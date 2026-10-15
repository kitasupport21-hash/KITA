/**
 * KITA - Core API Router
 * Endpoints for Marketplace, Seekers, Employers, Admin Moderation, and Support
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, matchAndTriggerJobAlerts } from './db/database.js';
import { INDONESIA_38_PROVINCES } from './sync/locations_data.js';
import { executeSyncCycle } from './sync/scheduler.js';
import { dispatchApplicationEmail, getEmailEngineStatus } from './email/mailer.js';
import {
  generateToken,
  requireAuth,
  requireRole,
  type AuthenticatedRequest
} from './auth.js';
import {
  validateRegistration,
  validateLogin,
  validateJobListing,
  validateApplication,
  validateJobAlertSubscription
} from './validation.js';
import type { User, JobListing, JobApplication, JobAlertSubscription } from '../shared/types.js';


const RESUME_STORAGE_DIR = path.resolve(process.cwd(), 'data', 'private-resumes');
fs.mkdirSync(RESUME_STORAGE_DIR, { recursive: true });

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, RESUME_STORAGE_DIR),
    filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.pdf`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(isPdf ? null : new Error('Hanya berkas CV PDF yang diperbolehkan.'), isPdf);
  }
});

const parseResumeUpload = (req: any, res: any, next: any) => {
  resumeUpload.single('resume')(req, res, (error: any) => {
    if (error) {
      res.status(400).json({ success: false, error: error.message || 'Unggahan CV gagal.' });
      return;
    }
    next();
  });
};

export const apiRouter = Router();

// Health check
apiRouter.get('/health', async (_req, res) => {
  try {
    const db = await getDatabase();
    const result = db.exec('SELECT 1');
    const isDbOk = result.length > 0;
    res.json({
      status: 'ok',
      service: 'KITA API',
      database: isDbOk ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const { email, password, full_name, role, phone, city, company_name, industry } = validation.data!;
    const db = await getDatabase();

    const existingStmt = db.prepare('SELECT id FROM users WHERE email = :email');
    existingStmt.bind({ ':email': email });
    const hasExisting = existingStmt.step();
    existingStmt.free();
    if (hasExisting) {
      res.status(409).json({ success: false, error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' });
      return;
    }

    const userId = `user-${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, city, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, full_name, role, phone || null, city || null, now, now]
    );

    if (role === 'employer') {
      const profileId = `emp-prof-${crypto.randomUUID()}`;
      db.run(
        `INSERT INTO employer_profiles (id, user_id, company_name, industry, company_size, city, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          profileId,
          userId,
          company_name || full_name,
          industry || 'Usaha Mikro Kecil Menengah (UMKM)',
          '1-10 Karyawan',
          city || 'Indonesia',
          now
        ]
      );
    }

    saveDatabase(db);

    const newUser: User = {
      id: userId,
      email,
      full_name,
      role,
      phone: phone || undefined,
      city: city || undefined,
      created_at: now,
      updated_at: now
    };

    const token = generateToken(newUser);
    res.cookie('kita_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      data: { user: newUser, token }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Gagal mendaftarkan akun. Silakan coba lagi.' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const { email, password } = validation.data!;
    const db = await getDatabase();

    const stmt = db.prepare('SELECT id, email, password_hash, full_name, role, phone, city, avatar_url, bio, created_at, updated_at FROM users WHERE email = :email');
    stmt.bind({ ':email': email });

    if (!stmt.step()) {
      stmt.free();
      res.status(401).json({ success: false, error: 'Email atau kata sandi tidak cocok' });
      return;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    const isPasswordValid = await bcrypt.compare(password, row.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Email atau kata sandi tidak cocok' });
      return;
    }

    const user: User = {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      phone: row.phone || undefined,
      city: row.city || undefined,
      avatar_url: row.avatar_url || undefined,
      bio: row.bio || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    const token = generateToken(user);
    res.cookie('kita_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan sistem saat masuk.' });
  }
});

apiRouter.get('/auth/me', async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.json({ success: true, data: { user: null } });
    return;
  }
  try {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT id, email, full_name, role, phone, city, avatar_url, bio, created_at, updated_at FROM users WHERE id = :id');
    stmt.bind({ ':id': req.user.userId });
    if (!stmt.step()) {
      stmt.free();
      res.json({ success: true, data: { user: null } });
      return;
    }
    const user = stmt.getAsObject() as unknown as User;
    stmt.free();
    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('kita_token');
  res.json({ success: true, message: 'Berhasil keluar.' });
});

/* ==========================================================================
   MARKETPLACE & JOB SEARCH ENDPOINTS
   ========================================================================== */
// Real CV upload: private disk storage, PDF-only, max 5 MB, no public static serving.
apiRouter.post('/uploads/resume', requireAuth, requireRole(['seeker']), parseResumeUpload, async (req: AuthenticatedRequest, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'Pilih file CV PDF terlebih dahulu.' });
    return;
  }

  try {
    const fd = fs.openSync(file.path, 'r');
    const signature = Buffer.alloc(5);
    fs.readSync(fd, signature, 0, 5, 0);
    fs.closeSync(fd);
    if (signature.toString('ascii') !== '%PDF-') {
      fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'File tidak memiliki format PDF yang valid.' });
      return;
    }

    const db = await getDatabase();
    const id = crypto.randomUUID();
    const originalName = path.basename(file.originalname).slice(0, 180) || 'CV.pdf';
    db.run(
      `INSERT INTO resume_uploads (id, user_id, stored_name, original_name, mime_type, size_bytes, created_at)
       VALUES (?, ?, ?, ?, 'application/pdf', ?, ?)`,
      [id, req.user!.userId, file.filename, originalName, file.size, new Date().toISOString()]
    );
    saveDatabase(db);
    res.status(201).json({
      success: true,
      data: { resume_url: `/api/resumes/${id}`, original_name: originalName, size_bytes: file.size }
    });
  } catch (error: any) {
    try { if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch {}
    res.status(500).json({ success: false, error: 'CV tidak dapat disimpan dengan aman.' });
  }
});

apiRouter.get('/resumes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
      res.status(404).json({ success: false, error: 'Berkas CV tidak ditemukan.' });
      return;
    }
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM resume_uploads WHERE id = :id');
    stmt.bind({ ':id': req.params.id });
    const found = stmt.step();
    const upload = found ? stmt.getAsObject() as any : null;
    stmt.free();
    if (!upload) {
      res.status(404).json({ success: false, error: 'Berkas CV tidak ditemukan.' });
      return;
    }

    let allowed = req.user!.role === 'admin' || upload.user_id === req.user!.userId;
    if (!allowed && req.user!.role === 'employer') {
      const access = db.prepare(`
        SELECT 1 FROM job_applications a
        JOIN job_listings j ON j.id = a.job_id
        WHERE a.resume_url = :resumeUrl AND j.employer_id = :employerId
        LIMIT 1
      `);
      access.bind({ ':resumeUrl': `/api/resumes/${upload.id}`, ':employerId': req.user!.userId });
      allowed = access.step();
      access.free();
    }
    if (!allowed) {
      res.status(403).json({ success: false, error: 'Anda tidak memiliki izin untuk membuka berkas CV ini.' });
      return;
    }

    const filePath = path.join(RESUME_STORAGE_DIR, String(upload.stored_name));
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File CV tidak tersedia di penyimpanan.' });
      return;
    }
    res.type('application/pdf');
    res.download(filePath, String(upload.original_name), (error) => {
      if (error && !res.headersSent) res.status(500).end();
    });
  } catch {
    res.status(500).json({ success: false, error: 'Berkas CV tidak dapat dibuka.' });
  }
});

apiRouter.get('/jobs', async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const {
      keyword,
      category,
      city,
      province,
      job_type,
      workplace_type,
      source_type,
      application_method,
      min_salary
    } = req.query;

    let sql = `
      SELECT 
        j.id, j.employer_id, j.title, j.category, j.job_type, j.workplace_type,
        j.city, j.province, j.min_salary, j.max_salary, j.is_salary_negotiable,
        j.salary_period, j.description, j.requirements, j.benefits, j.status,
        j.status_reason, j.is_demo, j.created_at, j.updated_at,
        j.source_type, j.source_name, j.source_id, j.original_listing_url,
        j.application_method, j.application_url, j.company_verified_status,
        j.verified_company_email, j.workplace_address, j.recruitment_phone,
        j.verification_evidence, j.verification_history,
        j.publication_date, j.expiry_date, j.last_verified_at,
        ep.company_name as employer_name,
        ep.city as employer_city,
        ep.logo_url as employer_logo,
        ep.is_verified as is_verified_employer,
        ep.verification_status as employer_verification_status,
        (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as applications_count
      FROM job_listings j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.status = 'published'
        AND (j.expiry_date IS NULL OR datetime(j.expiry_date) >= datetime('now'))
    `;

    const params: any = {};

    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      const term = `%${keyword.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(j.title) LIKE :kw OR LOWER(j.description) LIKE :kw OR LOWER(ep.company_name) LIKE :kw)`;
      params[':kw'] = term;
    }

    if (category && typeof category === 'string' && category !== 'Semua') {
      sql += ` AND j.category = :category`;
      params[':category'] = category;
    }

    if (city && typeof city === 'string' && city !== 'Semua Kota') {
      sql += ` AND j.city = :city`;
      params[':city'] = city;
    }

    if (province && typeof province === 'string' && province !== 'Semua Provinsi') {
      sql += ` AND j.province = :province`;
      params[':province'] = province;
    }

    if (job_type && typeof job_type === 'string' && job_type !== 'Semua') {
      sql += ` AND j.job_type = :job_type`;
      params[':job_type'] = job_type;
    }

    if (workplace_type && typeof workplace_type === 'string' && workplace_type !== 'Semua') {
      sql += ` AND j.workplace_type = :workplace_type`;
      params[':workplace_type'] = workplace_type;
    }

    if (source_type && typeof source_type === 'string' && source_type !== 'Semua') {
      sql += ` AND j.source_type = :source_type`;
      params[':source_type'] = source_type;
    }

    if (application_method && typeof application_method === 'string' && application_method !== 'Semua') {
      sql += ` AND j.application_method = :application_method`;
      params[':application_method'] = application_method;
    }

    if (min_salary && !isNaN(Number(min_salary))) {
      sql += ` AND j.max_salary >= :min_salary`;
      params[':min_salary'] = Number(min_salary);
    }

    sql += ` ORDER BY j.created_at DESC LIMIT 60`;

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const jobs: JobListing[] = [];
    const nowTime = Date.now();

    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      let reqs: string[] = [];
      let bens: string[] = [];
      try { reqs = JSON.parse(row.requirements || '[]'); } catch { reqs = []; }
      try { bens = JSON.parse(row.benefits || '[]'); } catch { bens = []; }

      let finalStatus = row.status;
      if (row.expiry_date && new Date(row.expiry_date).getTime() < nowTime) {
        finalStatus = 'expired';
      }

      jobs.push({
        ...row,
        status: finalStatus,
        is_salary_negotiable: Boolean(row.is_salary_negotiable),
        is_verified_employer: Boolean(row.is_verified_employer),
        is_demo: Boolean(row.is_demo),
        requirements: reqs,
        benefits: bens
      });
    }
    stmt.free();

    if (req.user) {
      for (const job of jobs) {
        const savedStmt = db.prepare('SELECT 1 FROM saved_jobs WHERE user_id = :uid AND job_id = :jid');
        savedStmt.bind({ ':uid': req.user.userId, ':jid': job.id });
        job.is_saved = savedStmt.step();
        savedStmt.free();
        const appliedStmt = db.prepare('SELECT 1 FROM job_applications WHERE seeker_id = :uid AND job_id = :jid');
        appliedStmt.bind({ ':uid': req.user.userId, ':jid': job.id });
        job.has_applied = appliedStmt.step();
        appliedStmt.free();
      }
    }

    res.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ success: false, error: 'Gagal mengambil data lowongan pekerjaan.' });
  }
});

apiRouter.get('/jobs/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const jobId = req.params.id;

    const stmt = db.prepare(`
      SELECT 
        j.id, j.employer_id, j.title, j.category, j.job_type, j.workplace_type,
        j.city, j.province, j.min_salary, j.max_salary, j.is_salary_negotiable,
        j.salary_period, j.description, j.requirements, j.benefits, j.status,
        j.status_reason, j.is_demo, j.created_at, j.updated_at,
        j.source_type, j.source_name, j.source_id, j.original_listing_url,
        j.application_method, j.application_url, j.company_verified_status,
        j.verified_company_email, j.workplace_address, j.recruitment_phone,
        j.verification_evidence, j.verification_history,
        j.publication_date, j.expiry_date, j.last_verified_at,
        ep.company_name as employer_name,
        ep.industry as employer_industry,
        ep.company_size as employer_size,
        ep.city as employer_city,
        ep.province as employer_province,
        ep.address as employer_address,
        ep.logo_url as employer_logo,
        ep.website as employer_website,
        ep.verified_email as employer_verified_email,
        ep.nib_number as employer_nib,
        ep.npwp_number as employer_npwp,
        ep.is_verified as is_verified_employer,
        ep.verification_status as employer_verification_status,
        (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as applications_count
      FROM job_listings j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.id = :id
    `);
    stmt.bind({ ':id': jobId });

    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ success: false, error: 'Lowongan pekerjaan tidak ditemukan.' });
      return;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    let reqs: string[] = [];
    let bens: string[] = [];
    try { reqs = JSON.parse(row.requirements || '[]'); } catch { reqs = []; }
    try { bens = JSON.parse(row.benefits || '[]'); } catch { bens = []; }

    let finalStatus = row.status;
    if (row.expiry_date && new Date(row.expiry_date).getTime() < Date.now()) {
      finalStatus = 'expired';
    }

    const job = {
      ...row,
      status: finalStatus,
      is_salary_negotiable: Boolean(row.is_salary_negotiable),
      is_verified_employer: Boolean(row.is_verified_employer),
      is_demo: Boolean(row.is_demo),
      requirements: reqs,
      benefits: bens,
      has_applied: false,
      is_saved: false
    };

    if (req.user) {
      const savedStmt = db.prepare('SELECT 1 FROM saved_jobs WHERE user_id = :uid AND job_id = :jid');
      savedStmt.bind({ ':uid': req.user.userId, ':jid': job.id });
      job.is_saved = savedStmt.step();
      savedStmt.free();
      const appliedStmt = db.prepare('SELECT 1 FROM job_applications WHERE seeker_id = :uid AND job_id = :jid');
      appliedStmt.bind({ ':uid': req.user.userId, ':jid': job.id });
      job.has_applied = appliedStmt.step();
      appliedStmt.free();
    }

    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/jobs/:id/save', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const jobId = req.params.id;
    const userId = req.user!.userId;

    const existingStmt = db.prepare('SELECT id FROM saved_jobs WHERE user_id = :uid AND job_id = :jid');
    existingStmt.bind({ ':uid': userId, ':jid': jobId });
    const alreadySaved = existingStmt.step();
    existingStmt.free();
    if (alreadySaved) {
      db.run(`DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?`, [userId, jobId]);
      saveDatabase(db);
      res.json({ success: true, saved: false, message: 'Lowongan dihapus dari daftar minat.' });
    } else {
      const id = `saved-${crypto.randomUUID()}`;
      db.run(`INSERT INTO saved_jobs (id, user_id, job_id, created_at) VALUES (?, ?, ?, ?)`, [
        id, userId, jobId, new Date().toISOString()
      ]);
      saveDatabase(db);
      res.json({ success: true, saved: true, message: 'Lowongan berhasil disimpan!' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/saved-jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT 
        j.id, j.title, j.category, j.job_type, j.workplace_type, j.city, j.province,
        j.min_salary, j.max_salary, j.salary_period, j.status,
        j.source_type, j.source_name, j.application_method, j.original_listing_url,
        ep.company_name as employer_name, ep.logo_url as employer_logo
      FROM saved_jobs s
      JOIN job_listings j ON j.id = s.job_id
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE s.user_id = :userId
      ORDER BY s.created_at DESC
    `);
    stmt.bind({ ':userId': req.user!.userId });
    const jobs = [];
    while (stmt.step()) {
      jobs.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   COMPANIES DIRECTORY & LOCATIONS ENDPOINTS
   ========================================================================== */
apiRouter.get('/companies', async (req, res) => {
  try {
    const db = await getDatabase();
    const { search, industry } = req.query;

    const empStmt = db.prepare(`
      SELECT 
        ep.id, ep.user_id, ep.company_name, ep.industry, ep.company_size,
        ep.address, ep.city, ep.province, ep.logo_url, ep.website,
        ep.verified_email, ep.nib_number, ep.npwp_number,
        ep.verification_status, ep.is_verified,
        (SELECT COUNT(*) FROM job_listings j WHERE j.employer_id = ep.user_id AND j.status = 'published') as open_jobs_count
      FROM employer_profiles ep
    `);
    const registeredCompanies: any[] = [];
    while (empStmt.step()) {
      registeredCompanies.push(empStmt.getAsObject());
    }
    empStmt.free();

    // Show only real employer profiles created in this installation.
    // Never fabricate company cards or imply a partnership/verification that has not occurred.
    let results = registeredCompanies.map((company) => ({
      ...company,
      is_verified: Boolean(company.is_verified)
    }));
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      results = results.filter((c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      );
    }

    if (industry && typeof industry === 'string' && industry !== 'Semua') {
      results = results.filter((c) => c.industry === industry);
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/locations', async (_req, res) => {
  try {
    const db = await getDatabase();
    const countsStmt = db.prepare(`
      SELECT province, city, COUNT(*) as count
      FROM job_listings
      WHERE status = 'published'
      GROUP BY province, city
    `);
    const locationCounts: { [province: string]: { total: number; cities: { [city: string]: number } } } = {};

    while (countsStmt.step()) {
      const row = countsStmt.getAsObject() as any;
      const prov = row.province || 'DKI Jakarta';
      const city = row.city || 'Jakarta';
      const count = Number(row.count) || 0;
      if (!locationCounts[prov]) {
        locationCounts[prov] = { total: 0, cities: {} };
      }
      locationCounts[prov].total += count;
      locationCounts[prov].cities[city] = (locationCounts[prov].cities[city] || 0) + count;
    }
    countsStmt.free();

    const regions = INDONESIA_38_PROVINCES.map((region) => ({
      id: region.id,
      name: region.name,
      provinces: region.provinces.map((prov) => ({
        name: prov.name,
        capital: prov.capital,
        count: locationCounts[prov.name]?.total || 0,
        cities: prov.cities.map((city) => ({
          name: city,
          count: locationCounts[prov.name]?.cities[city] || 0
        }))
      }))
    }));

    res.json({
      success: true,
      data: {
        regions,
        locationCounts
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   APPLICATIONS & APPLICATION ROUTING ENGINE
   ========================================================================== */
async function processJobApplication(jobId: string, req: AuthenticatedRequest, res: any) {
  try {
    const seekerId = req.user!.userId;
    const validation = validateApplication({ ...req.body, job_id: jobId });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const { cover_letter, resume_url, portfolio_url } = validation.data!;
    const consentSharing = req.body.consent_data_sharing !== false ? 1 : 0;
    const db = await getDatabase();

    // A private KITA CV URL may only be attached by the account that uploaded it.
    const privateResumeMatch = /^\/api\/resumes\/([0-9a-f-]{36})$/i.exec(resume_url);
    if (privateResumeMatch) {
      const resumeStmt = db.prepare('SELECT id FROM resume_uploads WHERE id = :id AND user_id = :userId');
      resumeStmt.bind({ ':id': privateResumeMatch[1], ':userId': seekerId });
      const ownsResume = resumeStmt.step();
      resumeStmt.free();
      if (!ownsResume) {
        res.status(403).json({ success: false, error: 'CV ini tidak dimiliki akun Anda. Unggah CV sendiri sebelum melamar.' });
        return;
      }
    }

    const jobStmt = db.prepare(`
      SELECT 
        j.id, j.employer_id, j.title, j.status, j.expiry_date,
        j.application_method, j.application_url, j.original_listing_url,
        j.verified_company_email, j.source_name,
        ep.company_name
      FROM job_listings j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.id = :jobId
    `);
    jobStmt.bind({ ':jobId': jobId });

    if (!jobStmt.step()) {
      jobStmt.free();
      res.status(404).json({ success: false, error: 'Lowongan pekerjaan tidak ditemukan.' });
      return;
    }

    const job = jobStmt.getAsObject() as any;
    jobStmt.free();

    if (job.status !== 'published') {
      res.status(400).json({ success: false, error: 'Lowongan ini tidak lagi tersedia untuk dilamar.' });
      return;
    }

    if (job.expiry_date && new Date(job.expiry_date).getTime() < Date.now()) {
      res.status(400).json({
        success: false,
        error: `Masa aktif lowongan ini telah kedaluwarsa. Pengiriman lamaran tidak dapat dilakukan.`
      });
      return;
    }

    // Strict duplicate prevention
    const duplicateStmt = db.prepare('SELECT id FROM job_applications WHERE job_id = :jobId AND seeker_id = :seekerId');
    duplicateStmt.bind({ ':jobId': jobId, ':seekerId': seekerId });
    const isDuplicate = duplicateStmt.step();
    duplicateStmt.free();
    if (isDuplicate) {
      res.status(409).json({
        success: false,
        error: 'Anda sudah pernah mengajukan lamaran untuk posisi ini. Periksa status berkas Anda pada tab Lamaran Saya.'
      });
      return;
    }

    const seekerStmt = db.prepare(`SELECT id, full_name, email, phone FROM users WHERE id = :uid`);
    seekerStmt.bind({ ':uid': seekerId });
    let seekerUser: any = null;
    if (seekerStmt.step()) {
      seekerUser = seekerStmt.getAsObject();
    }
    seekerStmt.free();

    const applicationId = `app-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    let deliveryStatus = 'SUBMITTED_LOCAL';
    let deliveryLogId: string | null = null;
    let deliveryError: string | null = null;
    let successMessage = 'Lamaran Anda berhasil dicatat secara resmi di portal KITA.';

    if (job.application_method === 'verified_email' && job.verified_company_email) {
      const dispatchRes = await dispatchApplicationEmail(db, {
        applicationId,
        recipientEmail: job.verified_company_email,
        companyName: job.company_name || 'Tim Rekrutmen',
        jobTitle: job.title,
        applicantName: seekerUser?.full_name || 'Pelamar KITA',
        applicantEmail: seekerUser?.email || '',
        applicantPhone: seekerUser?.phone || '',
        coverLetter: cover_letter,
        resumeUrl: resume_url,
        portfolioUrl: portfolio_url || ''
      });
      deliveryStatus = dispatchRes.status;
      deliveryLogId = dispatchRes.logId;
      deliveryError = dispatchRes.errorMessage || null;
      successMessage = dispatchRes.success
        ? `Lamaran berhasil dikirim ke email perusahaan melalui KITA.`
        : `Lamaran tersimpan di KITA, tetapi pengiriman email ke perusahaan gagal. Coba lagi atau gunakan kontak resmi perusahaan.`;
    } else if (job.application_method === 'external_url') {
      deliveryStatus = 'EXTERNAL_REDIRECT_REQUIRED';
      successMessage = `Lowongan ini terhubung langsung ke portal karir resmi perusahaan.`;
    }

    db.run(
      `INSERT INTO job_applications (
        id, job_id, seeker_id, resume_url, cover_letter, portfolio_url,
        status, delivery_status, delivery_log_id, delivery_error, consent_data_sharing,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        jobId,
        seekerId,
        resume_url,
        cover_letter,
        portfolio_url || null,
        deliveryStatus,
        deliveryLogId,
        deliveryError,
        consentSharing,
        now,
        now
      ]
    );

    const notifId = `notif-${crypto.randomUUID()}`;
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [
        notifId,
        job.employer_id,
        'Lamaran Masuk Baru',
        `Pelamar baru (${seekerUser?.full_name || 'Kandidat'}) telah mengajukan berkas untuk "${job.title}".`,
        `/employer/applications`,
        now
      ]
    );

    saveDatabase(db);

    res.status(201).json({
      success: true,
      message: successMessage,
      applicationId,
      deliveryStatus,
      applicationMethod: job.application_method,
      targetUrl: job.application_url || job.original_listing_url || null
    });
  } catch (error: any) {
    console.error('Job application error:', error);
    res.status(500).json({ success: false, error: 'Gagal memproses lamaran pekerjaan.' });
  }
}

apiRouter.post('/jobs/:id/apply', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  await processJobApplication(req.params.id, req, res);
});

apiRouter.post('/applications', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  const jobId = req.body?.job_id;
  if (!jobId) {
    res.status(400).json({ success: false, error: 'ID Lowongan pekerjaan wajib ada' });
    return;
  }
  await processJobApplication(jobId, req, res);
});

apiRouter.get('/seeker/applications', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();

    const stmt = db.prepare(`
      SELECT 
        a.id, a.job_id, a.status, a.delivery_status, a.delivery_error,
        a.cover_letter, a.resume_url, a.portfolio_url, a.created_at, a.updated_at,
        j.title as job_title, j.city as job_city, j.province as job_province,
        j.job_type, j.workplace_type, j.source_name, j.source_type,
        j.application_method, j.original_listing_url, j.verified_company_email,
        ep.company_name as employer_name, ep.logo_url as employer_logo,
        ep.is_verified as is_verified_employer, ep.verification_status as company_verified_status
      FROM job_applications a
      JOIN job_listings j ON j.id = a.job_id
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE a.seeker_id = :seekerId
      ORDER BY a.created_at DESC
    `);
    stmt.bind({ ':seekerId': req.user!.userId });
    const applications = [];
    while (stmt.step()) {
      applications.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ success: true, data: applications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/seeker/applications/:id/status', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;
    const allowed = ['submitted', 'reviewing', 'interview', 'accepted', 'rejected'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Status lamaran tidak valid' });
      return;
    }
    const db = await getDatabase();
    db.run(`UPDATE job_applications SET status = ?, updated_at = ? WHERE id = ? AND seeker_id = ?`, [
      status, new Date().toISOString(), applicationId, req.user!.userId
    ]);
    saveDatabase(db);
    res.json({ success: true, message: `Status lamaran diperbarui ke ${status}`, newStatus: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   SEEKER JOB ALERT SUBSCRIPTIONS & NOTIFICATIONS
   ========================================================================== */
apiRouter.get('/seeker/job-alerts', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM job_alert_subscriptions
      WHERE user_id = :userId
      ORDER BY created_at DESC
    `);
    stmt.bind({ ':userId': req.user!.userId });
    const alerts: JobAlertSubscription[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      let matchSql = `SELECT COUNT(*) AS count FROM job_listings WHERE status = 'published'`;
      const matchParams: Record<string, string | number> = {};
      if (row.category && row.category !== 'Semua') { matchSql += ' AND category = :category'; matchParams[':category'] = row.category; }
      if (row.city && row.city !== 'Semua Kota') { matchSql += ' AND city = :city'; matchParams[':city'] = row.city; }
      if (row.job_type && row.job_type !== 'Semua') { matchSql += ' AND job_type = :jobType'; matchParams[':jobType'] = row.job_type; }
      if (row.min_salary && row.min_salary > 0) { matchSql += ' AND max_salary >= :minSalary'; matchParams[':minSalary'] = Number(row.min_salary); }
      const countStmt = db.prepare(matchSql);
      countStmt.bind(matchParams);
      const matchesCount = countStmt.step() ? Number(countStmt.getAsObject().count || 0) : 0;
      countStmt.free();
      alerts.push({
        ...row,
        is_active: Boolean(row.is_active),
        matches_count: matchesCount
      });
    }
    stmt.free();
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/seeker/job-alerts', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const validation = validateJobAlertSubscription(req.body, req.user!.email);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }
    const val = validation.data!;
    const db = await getDatabase();
    const alertId = `alert-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO job_alert_subscriptions (
        id, user_id, title, category, city, job_type, workplace_type, min_salary,
        channel, frequency, email_destination, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        alertId,
        req.user!.userId,
        val.title,
        val.category,
        val.city,
        val.job_type,
        val.workplace_type,
        val.min_salary,
        val.channel,
        val.frequency,
        val.email_destination,
        now,
        now
      ]
    );

    const notifMsg = `Langganan notifikasi "${val.title}" berhasil diaktifkan.`;
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [`notif-${crypto.randomUUID()}`, req.user!.userId, 'Langganan Notifikasi Dibuat', notifMsg, '/seeker/applications', now]
    );

    saveDatabase(db);
    res.status(201).json({
      success: true,
      message: 'Langganan notifikasi lowongan berhasil disimpan!',
      alertId
    });
  } catch (error: any) {
    console.error('Create alert subscription error:', error);
    res.status(500).json({ success: false, error: 'Gagal membuat langganan notifikasi.' });
  }
});

apiRouter.patch('/seeker/job-alerts/:id/toggle', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const alertId = req.params.id;
    const db = await getDatabase();
    const ownerStmt = db.prepare('SELECT user_id, is_active, title FROM job_alert_subscriptions WHERE id = :id');
    ownerStmt.bind({ ':id': alertId });
    const ownerExists = ownerStmt.step();
    const ownerRow = ownerExists ? ownerStmt.getAsObject() : null;
    ownerStmt.free();
    if (!ownerExists || !ownerRow) {
      res.status(404).json({ success: false, error: 'Langganan notifikasi tidak ditemukan' });
      return;
    }
    const ownerId = ownerRow.user_id;
    const currentActive = ownerRow.is_active;
    const title = ownerRow.title;
    if (ownerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Akses ditolak.' });
      return;
    }
    const nextActive = currentActive ? 0 : 1;
    const now = new Date().toISOString();
    db.run(`UPDATE job_alert_subscriptions SET is_active = ?, updated_at = ? WHERE id = ?`, [
      nextActive, now, alertId
    ]);
    saveDatabase(db);
    res.json({
      success: true,
      isActive: Boolean(nextActive),
      message: `Langganan "${title}" ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/seeker/job-alerts/:id', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const alertId = req.params.id;
    const db = await getDatabase();
    const ownerStmt = db.prepare('SELECT user_id FROM job_alert_subscriptions WHERE id = :id');
    ownerStmt.bind({ ':id': alertId });
    const ownerExists = ownerStmt.step();
    const ownerId = ownerExists ? ownerStmt.getAsObject().user_id : null;
    ownerStmt.free();
    if (!ownerExists) {
      res.status(404).json({ success: false, error: 'Langganan notifikasi tidak ditemukan' });
      return;
    }
    if (ownerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Akses ditolak.' });
      return;
    }
    db.run(`DELETE FROM job_alert_subscriptions WHERE id = ?`, [alertId]);
    saveDatabase(db);
    res.json({ success: true, message: 'Langganan notifikasi berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/seeker/job-alerts/:id/test-trigger', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const alertId = req.params.id;
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT * FROM job_alert_subscriptions WHERE id = :id AND user_id = :userId`);
    stmt.bind({ ':id': alertId, ':userId': req.user!.userId });
    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ success: false, error: 'Langganan tidak ditemukan' });
      return;
    }
    const sub = stmt.getAsObject() as any;
    stmt.free();

    const now = new Date().toISOString();
    const notifMsg = `[Uji Coba Notifikasi] Kriteria "${sub.title}" aktif. Notifikasi terverifikasi siap dikirimkan.`;
    db.run(
      `INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [`notif-${crypto.randomUUID()}`, req.user!.userId, `Pengujian Langganan: ${sub.title}`, notifMsg, '/jobs', now]
    );
    saveDatabase(db);
    res.json({
      success: true,
      message: `Uji coba berhasil! Notifikasi siap menerima lowongan baru.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notifications
apiRouter.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = :userId 
      ORDER BY created_at DESC 
      LIMIT 30
    `);
    stmt.bind({ ':userId': req.user!.userId });
    const notifications = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      notifications.push({
        ...row,
        is_read: Boolean(row.is_read)
      });
    }
    stmt.free();
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const notifId = req.params.id;
    const db = await getDatabase();
    db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [
      notifId, req.user!.userId
    ]);
    saveDatabase(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/notifications/mark-all-read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.userId]);
    saveDatabase(db);
    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   EMPLOYER & UMKM BUSINESS MANAGEMENT ENDPOINTS
   ========================================================================== */
apiRouter.get('/employer/listings', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT 
        j.*,
        (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as applications_count
      FROM job_listings j
      WHERE j.employer_id = :empId
      ORDER BY j.created_at DESC
    `);
    stmt.bind({ ':empId': req.user!.userId });
    const listings = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      listings.push({
        ...row,
        requirements: JSON.parse(row.requirements || '[]'),
        benefits: JSON.parse(row.benefits || '[]'),
        is_salary_negotiable: Boolean(row.is_salary_negotiable),
        is_demo: Boolean(row.is_demo)
      });
    }
    stmt.free();
    res.json({ success: true, data: listings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/employer/listings', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const validation = validateJobListing(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }
    const val = validation.data!;
    const db = await getDatabase();
    const jobId = `job-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO job_listings (
        id, employer_id, title, category, job_type, workplace_type, city, province,
        min_salary, max_salary, is_salary_negotiable, salary_period, description,
        requirements, benefits, status, is_demo, publication_date, last_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        jobId,
        req.user!.userId,
        val.title,
        val.category,
        val.job_type,
        val.workplace_type,
        val.city,
        val.province,
        val.min_salary,
        val.max_salary,
        val.is_salary_negotiable ? 1 : 0,
        val.salary_period,
        val.description,
        JSON.stringify(val.requirements),
        JSON.stringify(val.benefits),
        val.status,
        now,
        now,
        now,
        now
      ]
    );

    if (val.status === 'published') {
      const empStmt = db.prepare('SELECT company_name FROM employer_profiles WHERE user_id = :uid');
      empStmt.bind({ ':uid': req.user!.userId });
      const empName = (empStmt.step() ? empStmt.getAsObject().company_name as string : '') || 'UMKM Lokal';
      empStmt.free();
      matchAndTriggerJobAlerts(db, {
        id: jobId,
        employer_id: req.user!.userId,
        title: val.title,
        category: val.category,
        city: val.city,
        job_type: val.job_type,
        workplace_type: val.workplace_type,
        min_salary: val.min_salary,
        max_salary: val.max_salary,
        employer_name: empName
      });
    }

    saveDatabase(db);
    res.status(201).json({
      success: true,
      message: 'Lowongan pekerjaan berhasil diterbitkan!',
      jobId
    });
  } catch (error: any) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, error: 'Gagal membuat lowongan pekerjaan.' });
  }
});

apiRouter.put('/employer/listings/:id', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const db = await getDatabase();
    const ownerStmt = db.prepare('SELECT employer_id FROM job_listings WHERE id = :id');
    ownerStmt.bind({ ':id': jobId });
    const ownerExists = ownerStmt.step();
    const ownerId = ownerExists ? ownerStmt.getAsObject().employer_id : null;
    ownerStmt.free();
    if (!ownerExists) {
      res.status(404).json({ success: false, error: 'Lowongan tidak ditemukan' });
      return;
    }
    if (ownerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Anda tidak memiliki hak akses mengubah lowongan ini.' });
      return;
    }
    const validation = validateJobListing(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }
    const val = validation.data!;
    const now = new Date().toISOString();
    db.run(
      `UPDATE job_listings SET 
        title = ?, category = ?, job_type = ?, workplace_type = ?, city = ?, province = ?,
        min_salary = ?, max_salary = ?, is_salary_negotiable = ?, salary_period = ?,
        description = ?, requirements = ?, benefits = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        val.title, val.category, val.job_type, val.workplace_type, val.city, val.province,
        val.min_salary, val.max_salary, val.is_salary_negotiable ? 1 : 0, val.salary_period,
        val.description, JSON.stringify(val.requirements), JSON.stringify(val.benefits),
        val.status, now, jobId
      ]
    );
    saveDatabase(db);
    res.json({ success: true, message: 'Lowongan berhasil diperbarui.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/employer/listings/:id/status', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const { status } = req.body;
    if (!['draft', 'published', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Status tidak valid.' });
      return;
    }
    const db = await getDatabase();
    const ownerStmt = db.prepare('SELECT employer_id FROM job_listings WHERE id = :id');
    ownerStmt.bind({ ':id': jobId });
    const ownerExists = ownerStmt.step();
    const ownerId = ownerExists ? ownerStmt.getAsObject().employer_id : null;
    ownerStmt.free();
    if (!ownerExists) {
      res.status(404).json({ success: false, error: 'Lowongan tidak ditemukan' });
      return;
    }
    if (ownerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Akses ditolak.' });
      return;
    }
    db.run(`UPDATE job_listings SET status = ?, updated_at = ? WHERE id = ?`, [
      status, new Date().toISOString(), jobId
    ]);
    saveDatabase(db);
    res.json({ success: true, message: `Status lowongan berhasil diubah menjadi: ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/employer/listings/:id/applications', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const db = await getDatabase();
    const ownerStmt = db.prepare('SELECT employer_id, title FROM job_listings WHERE id = :id');
    ownerStmt.bind({ ':id': jobId });
    const ownerExists = ownerStmt.step();
    const ownerRow = ownerExists ? ownerStmt.getAsObject() : null;
    ownerStmt.free();
    if (!ownerExists || !ownerRow) {
      res.status(404).json({ success: false, error: 'Lowongan tidak ditemukan' });
      return;
    }
    if (ownerRow.employer_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Akses ditolak.' });
      return;
    }
    const stmt = db.prepare(`
      SELECT 
        a.id, a.job_id, a.seeker_id, a.resume_url, a.cover_letter, a.portfolio_url,
        a.status, a.created_at, a.updated_at,
        u.full_name as seeker_name, u.email as seeker_email, u.phone as seeker_phone,
        u.city as seeker_city, u.avatar_url as seeker_avatar
      FROM job_applications a
      JOIN users u ON u.id = a.seeker_id
      WHERE a.job_id = :jobId
      ORDER BY a.created_at DESC
    `);
    stmt.bind({ ':jobId': jobId });
    const applicants = [];
    while (stmt.step()) {
      applicants.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({
      success: true,
      jobTitle: ownerRow.title,
      data: applicants
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/employer/applications/:id/status', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;
    const allowed = ['submitted', 'reviewing', 'interview', 'accepted', 'rejected'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: 'Status lamaran tidak valid' });
      return;
    }
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT a.id, a.seeker_id, j.title, j.employer_id 
      FROM job_applications a
      JOIN job_listings j ON j.id = a.job_id
      WHERE a.id = :appId
    `);
    stmt.bind({ ':appId': applicationId });
    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ success: false, error: 'Data lamaran tidak ditemukan' });
      return;
    }
    const row = stmt.getAsObject() as any;
    stmt.free();

    if (row.employer_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Akses ditolak.' });
      return;
    }

    const now = new Date().toISOString();
    db.run(`UPDATE job_applications SET status = ?, updated_at = ? WHERE id = ?`, [
      status, now, applicationId
    ]);

    saveDatabase(db);
    res.json({ success: true, message: 'Status lamaran berhasil diperbarui.', newStatus: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/employer/profile', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT * FROM employer_profiles WHERE user_id = :uid`);
    stmt.bind({ ':uid': req.user!.userId });
    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ success: false, error: 'Profil bisnis belum ada.' });
      return;
    }
    const profile = stmt.getAsObject();
    stmt.free();
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.put('/employer/profile', requireAuth, requireRole(['employer']), async (req: AuthenticatedRequest, res) => {
  try {
    const { company_name, industry, company_size, address, city, province, logo_url, website, verified_email, nib_number, npwp_number, full_name, phone } = req.body;
    if (!company_name || !industry || !city) {
      res.status(400).json({ success: false, error: 'Nama perusahaan, sektor industri, dan kota wajib diisi.' });
      return;
    }
    const db = await getDatabase();
    const existingStmt = db.prepare('SELECT id FROM employer_profiles WHERE user_id = :uid');
    existingStmt.bind({ ':uid': req.user!.userId });
    const profileExists = existingStmt.step();
    existingStmt.free();
    const now = new Date().toISOString();
    if (profileExists) {
      db.run(
        `UPDATE employer_profiles SET 
           company_name = ?, industry = ?, company_size = ?, address = ?, city = ?, province = ?,
           logo_url = ?, website = ?, verified_email = ?, nib_number = ?, npwp_number = ?
         WHERE user_id = ?`,
        [company_name, industry, company_size || '1-10 Karyawan', address || null, city, province || 'Indonesia', logo_url || null, website || null, verified_email || null, nib_number || null, npwp_number || null, req.user!.userId]
      );
    } else {
      const profId = `emp-prof-${crypto.randomUUID()}`;
      db.run(
        `INSERT INTO employer_profiles (
          id, user_id, company_name, industry, company_size, address, city, province,
          logo_url, website, verified_email, nib_number, npwp_number, verification_status, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification', 0, ?)`,
        [profId, req.user!.userId, company_name, industry, company_size || '1-10 Karyawan', address || null, city, province || 'Indonesia', logo_url || null, website || null, verified_email || null, nib_number || null, npwp_number || null, now]
      );
    }
    db.run('UPDATE users SET full_name = ?, phone = ?, city = ?, updated_at = ? WHERE id = ?', [String(full_name || company_name).trim(), phone || null, city, now, req.user!.userId]);
    saveDatabase(db);
    res.json({ success: true, message: 'Profil badan usaha berhasil diperbarui.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seeker Profile
apiRouter.get('/seeker/profile', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT id, email, full_name, role, phone, city, bio, cv_url, skills, created_at, updated_at FROM users WHERE id = :id`);
    stmt.bind({ ':id': req.user!.userId });
    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ success: false, error: 'Profil tidak ditemukan.' });
      return;
    }
    const row = stmt.getAsObject() as any;
    stmt.free();
    let skills: string[] = [];
    try { skills = JSON.parse(row.skills || '[]'); } catch { skills = []; }
    res.json({ success: true, data: { ...row, skills } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.put('/seeker/profile', requireAuth, requireRole(['seeker']), async (req: AuthenticatedRequest, res) => {
  try {
    const { full_name, phone, city, bio, cv_url, skills } = req.body;
    if (!full_name || !full_name.trim()) {
      res.status(400).json({ success: false, error: 'Nama lengkap wajib diisi.' });
      return;
    }
    const db = await getDatabase();
    const now = new Date().toISOString();
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : (skills ? JSON.stringify(String(skills).split(',').map((s: string) => s.trim())) : '[]');
    db.run(
      `UPDATE users SET full_name = ?, phone = ?, city = ?, bio = ?, cv_url = ?, skills = ?, updated_at = ? WHERE id = ?`,
      [full_name.trim(), phone || null, city || null, bio || null, cv_url || null, skillsJson, now, req.user!.userId]
    );
    saveDatabase(db);
    res.json({ success: true, message: 'Profil pencari kerja berhasil diperbarui.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync Status & Trigger
apiRouter.get('/sync/status', async (_req, res) => {
  try {
    const db = await getDatabase();
    const activeJobs = (db.exec(`SELECT COUNT(*) FROM job_listings WHERE status = 'published'`)[0]?.values[0]?.[0] as number) || 0;
    const expiredJobs = (db.exec(`SELECT COUNT(*) FROM job_listings WHERE status = 'expired'`)[0]?.values[0]?.[0] as number) || 0;

    const lastLogStmt = db.prepare(`SELECT * FROM import_sync_logs ORDER BY synced_at DESC LIMIT 1`);
    let lastSync: any = null;
    if (lastLogStmt.step()) {
      lastSync = lastLogStmt.getAsObject();
    }
    lastLogStmt.free();

    res.json({
      success: true,
      data: {
        active_vacancies_count: activeJobs,
        expired_vacancies_count: expiredJobs,
        last_sync: lastSync,
        connected_integrations: [
          { name: 'Karirhub / Pasker ID', type: 'kemnaker_karirhub', status: 'PORTAL_LINK_ONLY' },
          { name: 'Jobstreet Indonesia', type: 'jobstreet', status: 'PORTAL_LINK_ONLY' },
          { name: 'LinkedIn Jobs Indonesia', type: 'linkedin_jobs', status: 'PORTAL_LINK_ONLY' },
          { name: 'Indeed Indonesia', type: 'indeed_id', status: 'PORTAL_LINK_ONLY' },
          { name: 'Glints Indonesia', type: 'glints_id', status: 'PORTAL_LINK_ONLY' },
          { name: 'HiredToday Indonesia', type: 'hiredtoday', status: 'PORTAL_LINK_ONLY' }
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/sync/trigger', requireAuth, requireRole(['admin']), async (_req, res) => {
  try {
    const result = await executeSyncCycle(true);
    res.status(result.success ? 200 : 503).json({
      success: result.success,
      message: result.success
        ? 'Pemeriksaan sumber selesai. KITA hanya mengimpor lowongan individual jika tersedia dari sumber resmi/berizin; tautan portal saja tidak dihitung sebagai lowongan yang tersinkron.'
        : 'Pemeriksaan sinkronisasi gagal. Lihat detail status dan coba lagi nanti.',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/email/status', async (_req, res) => {
  try {
    const status = getEmailEngineStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { target_type, target_id, reason, details } = req.body;
    if (!target_type || !target_id || !reason) {
      res.status(400).json({ success: false, error: 'Jenis target, ID, dan alasan laporan wajib diisi.' });
      return;
    }
    const db = await getDatabase();
    const reportId = `rep-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO moderation_reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [reportId, req.user!.userId, target_type, target_id, reason, details || '', now]
    );
    saveDatabase(db);
    res.status(201).json({
      success: true,
      message: 'Laporan Anda telah diterima oleh Tim Pengawas & Anti-Penipuan KITA untuk diinvestigasi.',
      reportId
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/jobs/:id/report', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = req.params.id;
    const { reason, details, email } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, error: 'Alasan pelaporan wajib dicantumkan.' });
      return;
    }
    const db = await getDatabase();
    const reporterId = req.user!.userId;
    const reportId = `rep-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO moderation_reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
       VALUES (?, ?, 'job', ?, ?, ?, 'pending', ?)`,
      [reportId, reporterId, jobId, reason, details || (email ? `Kontak pelapor: ${email}` : ''), now]
    );
    saveDatabase(db);
    res.status(201).json({
      success: true,
      message: 'Laporan lowongan mencurigakan berhasil dikirim ke Tim Pengawas KITA.',
      reportId
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   ADMIN ENDPOINTS
   ========================================================================== */
apiRouter.get('/admin/stats', requireAuth, requireRole(['admin']), async (_req, res) => {
  try {
    const db = await getDatabase();
    const usersCount = (db.exec('SELECT COUNT(*) FROM users')[0]?.values[0]?.[0] as number) || 0;
    const employersCount = (db.exec('SELECT COUNT(*) FROM employer_profiles')[0]?.values[0]?.[0] as number) || 0;
    const jobsCount = (db.exec('SELECT COUNT(*) FROM job_listings WHERE status = "published"')[0]?.values[0]?.[0] as number) || 0;
    const applicationsCount = (db.exec('SELECT COUNT(*) FROM job_applications')[0]?.values[0]?.[0] as number) || 0;
    const pendingReportsCount = (db.exec('SELECT COUNT(*) FROM moderation_reports WHERE status = "pending"')[0]?.values[0]?.[0] as number) || 0;
    const openTicketsCount = (db.exec('SELECT COUNT(*) FROM support_tickets WHERE status = "open"')[0]?.values[0]?.[0] as number) || 0;
    res.json({
      success: true,
      data: {
        usersCount,
        employersCount,
        jobsCount,
        applicationsCount,
        pendingReportsCount,
        openTicketsCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/admin/reports', requireAuth, requireRole(['admin']), async (_req, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT 
        r.*, u.full_name as reporter_name, u.email as reporter_email
      FROM moderation_reports r
      JOIN users u ON u.id = r.reporter_id
      ORDER BY r.created_at DESC
    `);
    const reports = [];
    while (stmt.step()) {
      reports.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/admin/reports/:id/status', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body;
    const db = await getDatabase();
    db.run(`UPDATE moderation_reports SET status = ?, resolved_at = ? WHERE id = ?`, [
      status, new Date().toISOString(), reportId
    ]);
    saveDatabase(db);
    res.json({ success: true, message: 'Status laporan moderasi diperbarui.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ==========================================================================
   SUPPORT & TICKETS
   ========================================================================== */
apiRouter.get('/support/tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDatabase();
    const isAdmin = req.user!.role === 'admin';
    let sql = `
      SELECT t.*, u.full_name as user_name, u.role as user_role,
        (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id) as messages_count
      FROM support_tickets t
      JOIN users u ON u.id = t.user_id
    `;
    const params: Record<string, string> = {};
    if (!isAdmin) { sql += ' WHERE t.user_id = :userId'; params[':userId'] = req.user!.userId; }
    sql += ' ORDER BY t.created_at DESC';
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const tickets = [];
    while (stmt.step()) {
      tickets.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ success: true, data: tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/support/tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, category, message, priority } = req.body;
    if (!subject || !message) {
      res.status(400).json({ success: false, error: 'Subjek dan isi pesan wajib diisi.' });
      return;
    }
    const db = await getDatabase();
    const ticketId = `ticket-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO support_tickets (id, user_id, subject, category, message, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
      [ticketId, req.user!.userId, subject.trim(), category || 'Umum', message.trim(), priority || 'normal', now, now]
    );
    db.run(
      `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`msg-${crypto.randomUUID()}`, ticketId, req.user!.userId, req.user!.role, message.trim(), now]
    );
    saveDatabase(db);
    res.status(201).json({ success: true, message: 'Tiket bantuan berhasil diajukan.', ticketId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/support/tickets/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ticketId = req.params.id;
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM support_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.ticket_id = :ticketId
      ORDER BY m.created_at ASC
    `);
    stmt.bind({ ':ticketId': ticketId });
    const messages = [];
    while (stmt.step()) {
      messages.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/support/tickets/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Pesan tidak boleh kosong.' });
      return;
    }
    const db = await getDatabase();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`msg-${crypto.randomUUID()}`, ticketId, req.user!.userId, req.user!.role, message.trim(), now]
    );
    db.run(`UPDATE support_tickets SET updated_at = ? WHERE id = ?`, [now, ticketId]);
    saveDatabase(db);
    res.json({ success: true, message: 'Balasan terkirim.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
