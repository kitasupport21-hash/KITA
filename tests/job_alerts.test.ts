import { describe, it, expect } from 'vitest';
import initSqlJs from 'sql.js';
import { validateJobAlertSubscription } from '../src/server/validation.js';
import { matchAndTriggerJobAlerts } from '../src/server/db/database.js';

describe('Job Alert Subscriptions Validation & Matching', () => {
  it('validates subscription payload successfully with default title and values', () => {
    const validPayload = {
      category: 'F&B / Kuliner',
      city: 'Bandung',
      channel: 'both',
      frequency: 'instant',
      email_destination: 'seeker@kita.id',
      min_salary: 3000000
    };
    const res = validateJobAlertSubscription(validPayload, 'seeker@kita.id');
    expect(res.isValid).toBe(true);
    expect(res.data?.category).toBe('F&B / Kuliner');
    expect(res.data?.channel).toBe('both');
    expect(res.data?.frequency).toBe('instant');
  });

  it('rejects invalid email destination or invalid channel', () => {
    const invalidChannel = {
      channel: 'telepathy',
      frequency: 'instant'
    };
    const res = validateJobAlertSubscription(invalidChannel);
    expect(res.isValid).toBe(false);
    expect(res.errors.channel).toBeDefined();

    const missingEmail = {
      channel: 'email',
      frequency: 'instant',
      email_destination: 'invalid-email-format'
    };
    const res2 = validateJobAlertSubscription(missingEmail);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.email_destination).toBeDefined();
  });

  it('matches published jobs against active subscriptions accurately', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT
      );
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        message TEXT,
        link TEXT,
        is_read INTEGER,
        created_at TEXT
      );
      CREATE TABLE job_listings (
        id TEXT PRIMARY KEY,
        employer_id TEXT,
        title TEXT
      );
      CREATE TABLE job_alert_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        category TEXT,
        city TEXT,
        job_type TEXT,
        workplace_type TEXT,
        min_salary INTEGER,
        channel TEXT,
        frequency TEXT,
        email_destination TEXT,
        is_active INTEGER,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE job_alert_logs (
        id TEXT PRIMARY KEY,
        subscription_id TEXT,
        user_id TEXT,
        job_id TEXT,
        channel TEXT,
        sent_at TEXT,
        status TEXT
      );
    `);

    // Insert user
    db.run(`INSERT INTO users VALUES ('user-seeker-1', 'seeker@kita.id', 'Dimas Pratama')`);

    // Insert active subscription for F&B in Bandung
    db.run(`
      INSERT INTO job_alert_subscriptions VALUES (
        'sub-1', 'user-seeker-1', 'Alert Barista Bandung', 'F&B / Kuliner', 'Bandung',
        'Semua', 'Semua', 2500000, 'both', 'instant', 'seeker@kita.id', 1, '2026-01-01', '2026-01-01'
      )
    `);

    // Test match with matching job
    const matchingJob = {
      id: 'new-job-1',
      employer_id: 'emp-99',
      title: 'Barista Espresso Specialist',
      category: 'F&B / Kuliner',
      city: 'Bandung',
      job_type: 'fulltime',
      workplace_type: 'onsite',
      min_salary: 3000000,
      max_salary: 4000000,
      employer_name: 'Kopi Artisan'
    };

    const triggerRes = matchAndTriggerJobAlerts(db, matchingJob);
    expect(triggerRes.matchedCount).toBe(1);
    expect(triggerRes.notificationsCreated).toBe(1);

    // Verify notification was stored
    const notifs = db.exec(`SELECT title, message FROM notifications WHERE user_id = 'user-seeker-1'`);
    expect(notifs[0].values.length).toBe(1);
    expect(notifs[0].values[0][0]).toContain('Barista Espresso Specialist');

    // Test non-matching job (different city)
    const nonMatchingJob = {
      id: 'new-job-2',
      employer_id: 'emp-99',
      title: 'Barista Bali',
      category: 'F&B / Kuliner',
      city: 'Bali',
      job_type: 'fulltime',
      workplace_type: 'onsite',
      min_salary: 3000000,
      max_salary: 4000000,
      employer_name: 'Kopi Bali'
    };

    const triggerRes2 = matchAndTriggerJobAlerts(db, nonMatchingJob);
    expect(triggerRes2.matchedCount).toBe(0);
  });
});
