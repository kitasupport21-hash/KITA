/**
 * KITA - Persistent Relational SQLite Database Layer
 * Powered by sql.js with filesystem persistence & transactions
 */
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { syncOfficialVacancies } from '../sync/importer.js';

let dbInstance: SqlJsDatabase | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'kita.sqlite');

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Existing DB file could not be read, creating fresh instance:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run('PRAGMA foreign_keys = ON;');
  initSchema(dbInstance);
  await seedInitialData(dbInstance);
  // Remove only records created by earlier bundled demo seeds; never touch real user data.
  // This keeps fresh and upgraded installations free of fake users, support tickets and alerts.
  dbInstance.run("DELETE FROM support_messages WHERE ticket_id = 'ticket-1'");
  dbInstance.run("DELETE FROM support_tickets WHERE id = 'ticket-1'");
  dbInstance.run("DELETE FROM job_alert_subscriptions WHERE id = 'alert-sub-1'");
  dbInstance.run("DELETE FROM notifications WHERE id LIKE 'notif-demo-%'");
  dbInstance.run("DELETE FROM saved_jobs WHERE user_id IN ('user-emp-kreasi', 'user-seeker-1')");
  dbInstance.run("DELETE FROM job_applications WHERE seeker_id IN ('user-emp-kreasi', 'user-seeker-1')");
  dbInstance.run("DELETE FROM job_listings WHERE employer_id = 'user-emp-kreasi' AND is_demo = 1");
  dbInstance.run("DELETE FROM employer_profiles WHERE user_id = 'user-emp-kreasi'");
  dbInstance.run("DELETE FROM users WHERE id IN ('user-emp-kreasi', 'user-seeker-1')");
  // Older sample data must never be presented as a real verified employer.
  dbInstance.run("UPDATE employer_profiles SET is_verified = 0, verification_status = 'unverified', nib_number = NULL, npwp_number = NULL WHERE user_id = 'user-emp-kreasi'");
  // Previously imported organization records are not proof of completed KITA verification.
  dbInstance.run("UPDATE employer_profiles SET is_verified = 0, verification_status = 'pending_verification' WHERE user_id LIKE 'org-%'");
  dbInstance.run("UPDATE job_listings SET company_verified_status = 'pending_verification' WHERE source_id IS NOT NULL");
  await syncOfficialVacancies(dbInstance);
  saveDatabase(dbInstance);

  return dbInstance;
}

export function saveDatabase(db: SqlJsDatabase = dbInstance!): void {
  if (!db || db !== dbInstance) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (error) {
    console.error('Failed to persist SQLite database to disk:', error);
  }
}

function ensureColumn(db: SqlJsDatabase, table: string, column: string, colDef: string) {
  try {
    const info = db.exec(`PRAGMA table_info(${table})`);
    const cols = info[0]?.values?.map((v) => v[1]) || [];
    if (cols.length > 0 && !cols.includes(column)) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef};`);
    }
  } catch (err) {
    console.warn(`Could not add column ${column} to ${table}:`, err);
  }
}

function initSchema(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('seeker', 'employer', 'admin')),
      phone TEXT,
      city TEXT DEFAULT 'Jakarta',
      avatar_url TEXT,
      bio TEXT,
      cv_url TEXT,
      skills TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      industry TEXT NOT NULL,
      company_size TEXT NOT NULL,
      address TEXT,
      city TEXT NOT NULL,
      province TEXT DEFAULT 'Indonesia',
      logo_url TEXT,
      website TEXT,
      verified_email TEXT,
      nib_number TEXT,
      npwp_number TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending_verification',
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_listings (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      job_type TEXT NOT NULL CHECK(job_type IN ('fulltime', 'parttime', 'freelance', 'internship', 'contract')),
      workplace_type TEXT NOT NULL CHECK(workplace_type IN ('remote', 'onsite', 'hybrid')),
      city TEXT NOT NULL,
      province TEXT NOT NULL DEFAULT 'Indonesia',
      min_salary INTEGER NOT NULL DEFAULT 0,
      max_salary INTEGER NOT NULL DEFAULT 0,
      is_salary_negotiable INTEGER NOT NULL DEFAULT 0,
      salary_period TEXT NOT NULL DEFAULT 'monthly',
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      benefits TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'expired', 'needs_reverification', 'closed')),
      status_reason TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      source_type TEXT NOT NULL DEFAULT 'direct_verified_employer',
      source_name TEXT NOT NULL DEFAULT 'Portal KITA',
      source_id TEXT,
      original_listing_url TEXT,
      application_method TEXT NOT NULL DEFAULT 'direct_internal',
      application_url TEXT,
      company_verified_status TEXT NOT NULL DEFAULT 'pending_verification',
      verified_company_email TEXT,
      workplace_address TEXT,
      recruitment_phone TEXT,
      verification_evidence TEXT,
      verification_history TEXT,
      publication_date TEXT NOT NULL DEFAULT (datetime('now')),
      expiry_date TEXT,
      last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      seeker_id TEXT NOT NULL,
      resume_url TEXT NOT NULL,
      cover_letter TEXT NOT NULL,
      portfolio_url TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'reviewing', 'interview', 'accepted', 'rejected')),
      delivery_status TEXT NOT NULL DEFAULT 'SUBMITTED_LOCAL',
      delivery_log_id TEXT,
      delivery_error TEXT,
      consent_data_sharing INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE,
      FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(job_id, seeker_id)
    );

    CREATE TABLE IF NOT EXISTS resume_uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stored_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE,
      UNIQUE(user_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS moderation_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('job', 'user')),
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'closed')),
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_alert_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Semua',
      city TEXT NOT NULL DEFAULT 'Semua Kota',
      job_type TEXT NOT NULL DEFAULT 'Semua',
      workplace_type TEXT NOT NULL DEFAULT 'Semua',
      min_salary INTEGER NOT NULL DEFAULT 0,
      channel TEXT NOT NULL CHECK(channel IN ('email', 'push', 'both')),
      frequency TEXT NOT NULL CHECK(frequency IN ('instant', 'daily', 'weekly')),
      email_destination TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_alert_logs (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES job_alert_subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_sync_logs (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_found INTEGER NOT NULL,
      new_imported INTEGER NOT NULL,
      duplicates_skipped INTEGER NOT NULL,
      expired_updated INTEGER NOT NULL,
      details TEXT,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_delivery_logs (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      error_message TEXT,
      sent_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS privacy_deletion_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_city ON job_listings(city);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON job_listings(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status);
    CREATE INDEX IF NOT EXISTS idx_apps_seeker ON job_applications(seeker_id);
    CREATE INDEX IF NOT EXISTS idx_apps_job ON job_applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_user ON job_alert_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_active ON job_alert_subscriptions(is_active);
  `);
}

async function seedInitialData(db: SqlJsDatabase): Promise<void> {
  // Optional first-admin bootstrap. Never ship a publicly known admin password.
  const bootstrapEmail = process.env.KITA_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.KITA_BOOTSTRAP_ADMIN_PASSWORD;
  if (bootstrapEmail && bootstrapPassword && bootstrapPassword.length >= 14) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = :email');
    existingAdmin.bind({ ':email': bootstrapEmail });
    const adminExists = existingAdmin.step();
    existingAdmin.free();
    if (!adminExists) {
      const now = new Date().toISOString();
      db.run('INSERT INTO users (id, email, password_hash, full_name, role, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        `user-admin-${crypto.randomUUID()}`, bootstrapEmail, await bcrypt.hash(bootstrapPassword, 12),
        process.env.KITA_BOOTSTRAP_ADMIN_NAME?.trim() || 'KITA Administrator', 'admin', 'Indonesia', now, now
      ]);
    }
  }

  // Do not seed fake users, employers, jobs, applications, or notifications.
  // Real records are created through the registration and employer publishing flows.
  return;
}

export function matchAndTriggerJobAlerts(
  db: SqlJsDatabase,
  job: {
    id: string;
    employer_id: string;
    title: string;
    category: string;
    city: string;
    job_type: string;
    workplace_type: string;
    min_salary: number;
    max_salary: number;
    employer_name?: string;
  }
): { matchedCount: number; notificationsCreated: number } {
  try {
    const stmt = db.prepare(`
      SELECT 
        s.id, s.user_id, s.title as alert_title, s.category, s.city, s.job_type,
        s.workplace_type, s.min_salary, s.channel, s.frequency, s.email_destination,
        u.email as user_email, u.full_name as seeker_name
      FROM job_alert_subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.is_active = 1
        AND s.user_id != :employer_id
        AND (s.category = 'Semua' OR s.category = :category)
        AND (s.city = 'Semua Kota' OR s.city = :city)
        AND (s.job_type = 'Semua' OR s.job_type = :job_type)
        AND (s.workplace_type = 'Semua' OR s.workplace_type = :workplace_type)
        AND (:max_salary >= s.min_salary)
    `);
    stmt.bind({
      ':employer_id': job.employer_id,
      ':category': job.category,
      ':city': job.city,
      ':job_type': job.job_type,
      ':workplace_type': job.workplace_type,
      ':max_salary': job.max_salary || 0
    });

    const matches: any[] = [];
    while (stmt.step()) {
      matches.push(stmt.getAsObject());
    }
    stmt.free();

    const now = new Date().toISOString();
    let notifCount = 0;

    for (const sub of matches) {
      const channelLabel =
        sub.channel === 'both'
          ? 'Email & Push'
          : sub.channel === 'email'
          ? 'Email'
          : 'Push';
      const employerDisplayName = job.employer_name || 'UMKM Lokal';
      const notifTitle = `Pemberitahuan Lowongan: ${job.title}`;
      const notifMessage = `Cocok dengan langganan "${sub.alert_title}"! ${employerDisplayName} di ${job.city} membuka lowongan baru (${channelLabel}).`;

      db.run(
        `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [`notif-${crypto.randomUUID()}`, sub.user_id, notifTitle, notifMessage, `/jobs/${job.id}`, now]
      );
      notifCount++;

      db.run(
        `INSERT INTO job_alert_logs (id, subscription_id, user_id, job_id, channel, sent_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`log-${crypto.randomUUID()}`, sub.id, sub.user_id, job.id, sub.channel, now, 'sent']
      );
    }

    if (matches.length > 0) {
      saveDatabase(db);
    }

    return { matchedCount: matches.length, notificationsCreated: notifCount };
  } catch (error) {
    console.error('Failed to match job alerts:', error);
    return { matchedCount: 0, notificationsCreated: 0 };
  }
}
