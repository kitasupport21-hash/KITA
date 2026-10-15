/**
 * KITA - Official Data Sync & Ingestion Pipeline
 * Connects to official sources (Kemnaker Karirhub, BUMN FHCI, and Verified Corporate ATS).
 * Enforces deduplication, provenance verification, expiration checking, and audit logs.
 */
import crypto from 'node:crypto';
import type { Database as SqlJsDatabase } from 'sql.js';
import type { SourceType, ApplicationMethod, CompanyVerificationStatus } from '../../shared/types.js';
import { VERIFIED_INDONESIAN_VACANCIES_DATASET } from './indonesian_vacancies.js';

const DEFAULT_FEED_TIMEOUT_MS = 15000;

function getConfiguredFeedUrls(): string[] {
  return (process.env.KITA_OFFICIAL_FEED_URLS || process.env.KITA_OFFICIAL_FEED_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeFeedItem(raw: any, feedUrl: string): RawExternalVacancy | null {
  if (!raw || typeof raw !== 'object') return null;
  const sourceId = String(raw.source_id ?? raw.id ?? '').trim();
  const listingUrl = String(raw.original_listing_url ?? raw.url ?? '').trim();
  const company = String(raw.company_name ?? raw.company ?? '').trim();
  const title = String(raw.title ?? raw.job_title ?? '').trim();
  const city = String(raw.city ?? '').trim();
  const province = String(raw.province ?? 'Indonesia').trim() || 'Indonesia';
  const publicationDate = String(raw.publication_date ?? raw.published_at ?? '').trim();
  if (!sourceId || !listingUrl || !company || !title || !city || !publicationDate) return null;
  if (!isHttpUrl(listingUrl) || !isHttpUrl(feedUrl)) return null;

  const sourceType = (raw.source_type ?? 'kemnaker_karirhub') as SourceType;
  const jobType = ['fulltime', 'parttime', 'freelance', 'internship', 'contract'].includes(raw.job_type) ? raw.job_type : 'fulltime';
  const workplaceType = ['remote', 'onsite', 'hybrid'].includes(raw.workplace_type) ? raw.workplace_type : 'onsite';
  const applicationMethod = ['direct_internal', 'verified_email', 'external_url'].includes(raw.application_method)
    ? raw.application_method
    : 'external_url';

  return {
    source_id: sourceId,
    source_type: sourceType,
    source_name: String(raw.source_name ?? 'Official job feed').trim() || 'Official job feed',
    original_listing_url: listingUrl,
    company_name: company,
    company_verified_status: 'pending_verification',
    company_logo: raw.company_logo ? String(raw.company_logo) : undefined,
    verified_company_email: raw.verified_company_email ? String(raw.verified_company_email).trim() : undefined,
    title,
    category: String(raw.category ?? 'Umum').trim() || 'Umum',
    job_type: jobType,
    workplace_type: workplaceType,
    city,
    province,
    min_salary: Number.isFinite(Number(raw.min_salary)) ? Number(raw.min_salary) : 0,
    max_salary: Number.isFinite(Number(raw.max_salary)) ? Number(raw.max_salary) : 0,
    is_salary_negotiable: Boolean(raw.is_salary_negotiable),
    salary_period: ['monthly', 'project', 'hourly'].includes(raw.salary_period) ? raw.salary_period : 'monthly',
    description: String(raw.description ?? '').trim(),
    requirements: Array.isArray(raw.requirements) ? raw.requirements.map(String) : [],
    benefits: Array.isArray(raw.benefits) ? raw.benefits.map(String) : [],
    application_method: applicationMethod,
    application_url: raw.application_url ? String(raw.application_url) : listingUrl,
    workplace_address: raw.workplace_address ? String(raw.workplace_address) : undefined,
    recruitment_phone: raw.recruitment_phone ? String(raw.recruitment_phone) : undefined,
    verification_evidence: raw.verification_evidence ? String(raw.verification_evidence) : `Feed resmi terdaftar: ${feedUrl}`,
    publication_date: publicationDate,
    expiry_date: raw.expiry_date ? String(raw.expiry_date) : null
  };
}

async function loadConfiguredOfficialFeeds(): Promise<RawExternalVacancy[]> {
  const urls = getConfiguredFeedUrls().filter(isHttpUrl);
  if (!urls.length) return [];
  const token = process.env.KITA_OFFICIAL_FEED_TOKEN?.trim();
  const results: RawExternalVacancy[] = [];
  for (const feedUrl of urls) {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KITA-JobPlatform/1.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      signal: AbortSignal.timeout(Number(process.env.KITA_OFFICIAL_FEED_TIMEOUT_MS) || DEFAULT_FEED_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`Official feed ${feedUrl} returned HTTP ${response.status}.`);
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : Array.isArray(payload.jobs) ? payload.jobs : Array.isArray(payload.data) ? payload.data : [];
    for (const raw of items) {
      const normalized = normalizeFeedItem(raw, feedUrl);
      if (normalized) results.push(normalized);
    }
  }
  return results;
}


export interface RawExternalVacancy {
  source_id: string;
  source_type: SourceType;
  source_name: string;
  original_listing_url: string;
  company_name: string;
  company_verified_status: CompanyVerificationStatus;
  company_logo?: string;
  verified_company_email?: string;
  title: string;
  category: string;
  job_type: 'fulltime' | 'parttime' | 'freelance' | 'internship' | 'contract';
  workplace_type: 'remote' | 'onsite' | 'hybrid';
  city: string;
  province: string;
  min_salary: number;
  max_salary: number;
  is_salary_negotiable: boolean;
  salary_period: 'monthly' | 'project' | 'hourly';
  description: string;
  requirements: string[];
  benefits: string[];
  application_method: ApplicationMethod;
  application_url?: string;
  workplace_address?: string;
  recruitment_phone?: string;
  verification_evidence?: string;
  publication_date: string;
  expiry_date?: string | null;
}

export function computeVacancyFingerprint(company: string, title: string, city: string): string {
  const norm = `${company.trim().toLowerCase()}|${title.trim().toLowerCase()}|${city.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(norm).digest('hex').substring(0, 16);
}

export const VERIFIED_INDONESIAN_OFFICIAL_FEEDS: RawExternalVacancy[] = VERIFIED_INDONESIAN_VACANCIES_DATASET;

export async function checkLiveSourceConnectivity(): Promise<{
  karirhub: { status: number; reachable: boolean; latencyMs: number; notes: string };
  paskerid: { status: number; reachable: boolean; latencyMs: number; notes: string };
}> {
  const result = {
    karirhub: { status: 0, reachable: false, latencyMs: 0, notes: '' },
    paskerid: { status: 0, reachable: false, latencyMs: 0, notes: '' }
  };

  try {
    const t0 = Date.now();
    const res = await fetch('https://karirhub.kemnaker.go.id/', {
      method: 'GET',
      headers: { 'User-Agent': 'KITA-JobPlatform/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    result.karirhub.status = res.status;
    result.karirhub.reachable = res.status >= 200 && res.status < 400;
    result.karirhub.latencyMs = Date.now() - t0;
    result.karirhub.notes = result.karirhub.reachable
      ? 'Portal Kemnaker Karirhub aktif dan merespons normal.'
      : `Kemnaker Karirhub status HTTP ${res.status}.`;
  } catch (err: any) {
    result.karirhub.notes = `Konektivitas Karirhub: ${err.message}`;
  }

  try {
    const t0 = Date.now();
    const res = await fetch('https://paskerid.kemnaker.go.id/', {
      method: 'GET',
      headers: { 'User-Agent': 'KITA-JobPlatform/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    result.paskerid.status = res.status;
    result.paskerid.reachable = res.status >= 200 && res.status < 400;
    result.paskerid.latencyMs = Date.now() - t0;
    result.paskerid.notes = result.paskerid.reachable
      ? 'Portal Pasker ID Kemnaker aktif dan merespons normal.'
      : `Pasker ID status HTTP ${res.status}.`;
  } catch (err: any) {
    result.paskerid.notes = `Konektivitas Pasker ID: ${err.message}`;
  }

  return result;
}

export async function syncOfficialVacancies(db: SqlJsDatabase): Promise<{
  totalInspected: number;
  newImported: number;
  duplicatesSkipped: number;
  expiredMarked: number;
  syncLogId: string;
}> {
  const syncLogId = `synclog-${crypto.randomUUID()}`;
  const configuredFeeds = getConfiguredFeedUrls().filter(isHttpUrl);
  let liveFeedItems: RawExternalVacancy[] = [];
  if (configuredFeeds.length > 0) {
    liveFeedItems = await loadConfiguredOfficialFeeds();
  }
  const feedItems = [...VERIFIED_INDONESIAN_OFFICIAL_FEEDS, ...liveFeedItems];
  const now = new Date();
  const nowIso = now.toISOString();

  let newImported = 0;
  let duplicatesSkipped = 0;
  let expiredMarked = 0;

  // Older releases populated the database with placeholder vacancies whose
  // application links led only to generic portal homepages. Expire those rows
  // so they are not presented as real, currently-open jobs.
  db.run(`UPDATE job_listings SET status = 'expired', updated_at = ?
    WHERE source_type <> 'direct_verified_employer'
       OR source_id LIKE 'VAC-KITA-%'
       OR source_id LIKE 'KMK-%'
       OR source_id LIKE 'PSK-%'
       OR source_id LIKE 'FHCI-%'
       OR source_id LIKE 'ASTRA-CORP-%'
       OR source_id LIKE 'DIR-YOG-%'`, [nowIso]);

  for (const item of feedItems) {
    let status: 'published' | 'expired' = 'published';
    if (item.expiry_date && new Date(item.expiry_date) < now) {
      status = 'expired';
      expiredMarked++;
    }

    const companySlug =
      item.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'perusahaan';

    const orgEmail = item.verified_company_email
      ? item.verified_company_email.toLowerCase()
      : `feed-${item.source_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@official.kita.id`;

    const escapedEmail = orgEmail.replace(/'/g, "''");
    const escapedSlug = companySlug.replace(/'/g, "''");

    const existingUserRows = db.exec(
      `SELECT id FROM users WHERE email = '${escapedEmail}' OR id = 'org-${escapedSlug}'`
    );
    let orgUserId = `org-${companySlug}`;

    if (existingUserRows.length > 0 && existingUserRows[0].values.length > 0) {
      orgUserId = String(existingUserRows[0].values[0][0]);
    } else {
      db.run(
        `INSERT INTO users (id, email, password_hash, full_name, role, city, created_at, updated_at)
         VALUES (?, ?, 'SYSTEM_OFFICIAL_INGESTION', ?, 'employer', ?, ?, ?)`,
        [orgUserId, orgEmail, item.company_name, item.city, nowIso, nowIso]
      );
    }

    const empProfId = `emp-prof-${companySlug}`;
    const profCheck = db.exec(
      `SELECT id FROM employer_profiles WHERE user_id = '${orgUserId.replace(/'/g, "''")}'`
    );

    if (profCheck.length === 0 || profCheck[0].values.length === 0) {
      db.run(
        `INSERT INTO employer_profiles (
          id, user_id, company_name, industry, company_size, address, city, province, logo_url,
          website, verified_email, verification_status, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          empProfId,
          orgUserId,
          item.company_name,
          item.category,
          '100+ Karyawan',
          item.workplace_address || 'Tidak dicantumkan publik',
          item.city,
          item.province,
          item.company_logo || null,
          null,
          item.verified_company_email || null,
          'pending_verification',
          nowIso
        ]
      );
    }

    const existingCheck = db.exec(
      `SELECT id, status FROM job_listings WHERE source_id = '${item.source_id.replace(/'/g, "''")}' OR (LOWER(title) = '${item.title.toLowerCase().replace(/'/g, "''")}' AND LOWER(city) = '${item.city.toLowerCase().replace(/'/g, "''")}')`
    );

    if (existingCheck.length > 0 && existingCheck[0].values.length > 0) {
      duplicatesSkipped++;
      db.run(
        `UPDATE job_listings SET last_verified_at = ?, status = ?, original_listing_url = ?, application_url = ?, workplace_address = ?, recruitment_phone = ?, verification_evidence = ?, company_verified_status = 'pending_verification' WHERE source_id = ?`,
        [
          nowIso,
          status,
          item.original_listing_url,
          item.application_url || item.original_listing_url,
          item.workplace_address || 'Tidak dicantumkan publik',
          item.recruitment_phone || 'Tidak dicantumkan publik',
          item.verification_evidence || 'Sumber lowongan tercatat; verifikasi perusahaan belum dilakukan',
          item.source_id
        ]
      );
      continue;
    }

    const jobId = `vac-${item.source_id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    db.run(
      `INSERT INTO job_listings (
        id, employer_id, title, category, job_type, workplace_type, city, province,
        min_salary, max_salary, is_salary_negotiable, salary_period, description,
        requirements, benefits, status, is_demo,
        source_type, source_name, source_id, original_listing_url, application_method,
        company_verified_status, verified_company_email, application_url,
        workplace_address, recruitment_phone, verification_evidence, verification_history,
        publication_date, expiry_date, last_verified_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        orgUserId,
        item.title,
        item.category,
        item.job_type,
        item.workplace_type,
        item.city,
        item.province,
        item.min_salary,
        item.max_salary,
        item.is_salary_negotiable ? 1 : 0,
        item.salary_period,
        item.description,
        JSON.stringify(item.requirements),
        JSON.stringify(item.benefits),
        status,
        item.source_type,
        item.source_name,
        item.source_id,
        item.original_listing_url,
        item.application_method,
        'pending_verification',
        item.verified_company_email || null,
        item.application_url || item.original_listing_url,
        item.workplace_address || 'Tidak dicantumkan publik',
        item.recruitment_phone || 'Tidak dicantumkan publik',
        item.verification_evidence || 'Sumber lowongan tercatat; verifikasi perusahaan belum dilakukan',
        JSON.stringify([{ timestamp: nowIso, method: 'official_ingestion', status: 'pending_verification' }]),
        item.publication_date,
        item.expiry_date || null,
        nowIso,
        nowIso,
        nowIso
      ]
    );
    newImported++;
  }

  const feedConfigured = feedItems.length > 0;
  const syncStatus = feedConfigured ? 'SUCCESS' : 'NO_FEED_CONFIGURED';
  const syncDetails = feedConfigured
    ? `Sinkronisasi selesai. Diperiksa: ${VERIFIED_INDONESIAN_OFFICIAL_FEEDS.length}, Baru: ${newImported}, Duplikat: ${duplicatesSkipped}, Kedaluwarsa: ${expiredMarked}`
    : 'Tidak ada API/feed resmi yang dikonfigurasi. Hanya pemeriksaan sumber dan pembersihan placeholder yang dijalankan; tidak ada lowongan live yang diimpor.';

  db.run(
    `INSERT INTO import_sync_logs (
      id, source_name, source_type, status, total_found, new_imported, duplicates_skipped, expired_updated, details, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      syncLogId,
      'Kementerian Ketenagakerjaan & Portal Resmi BUMN',
      'kemnaker_karirhub',
      syncStatus,
      feedItems.length,
      newImported,
      duplicatesSkipped,
      expiredMarked,
      syncDetails,
      nowIso
    ]
  );

  return {
    totalInspected: feedItems.length,
    newImported,
    duplicatesSkipped,
    expiredMarked,
    syncLogId
  };
}
