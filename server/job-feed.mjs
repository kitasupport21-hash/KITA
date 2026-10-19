const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return null;
    // Reject generic homepage links unless the URL carries a specific search/detail query.
    if (url.pathname === '/' && !url.search && !url.hash) return null;
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

function validDate(value) {
  if (value == null || value === '') return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1000 ? number : undefined;
}

/** Normalize and reject feed records that cannot safely be presented as current, apply-ready jobs. */
export function normalizeFeedJob(item, defaultSourceName, now = new Date()) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const externalId = String(item.externalId ?? item.external_id ?? '').trim().slice(0, 200);
  const title = String(item.title || '').trim().slice(0, 200);
  const company = String(item.company || '').trim().slice(0, 200);
  const sourceName = String(item.sourceName ?? item.source_name ?? defaultSourceName ?? '').trim().slice(0, 120);
  const province = String(item.province || '').trim().slice(0, 120);
  const city = String(item.city ?? item.regency ?? '').trim().slice(0, 120);
  if (!externalId || !title || !company || !sourceName || !province || !city) return null;

  const posted = validDate(item.postedAt ?? item.posted_at);
  if (!posted || posted.getTime() < now.getTime() - MAX_AGE_MS || posted.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS) return null;
  const suppliedExpiry = validDate(item.expiresAt ?? item.expires_at ?? item.closingDate ?? item.closing_date);
  if ((item.expiresAt ?? item.expires_at ?? item.closingDate ?? item.closing_date) && !suppliedExpiry) return null;
  const expires = suppliedExpiry || new Date(Math.min(posted.getTime() + MAX_AGE_MS, now.getTime() + MAX_AGE_MS));
  if (expires.getTime() <= now.getTime() || expires.getTime() <= posted.getTime()) return null;

  const sourceUrl = safeHttpsUrl(item.sourceUrl ?? item.source_url);
  const applyUrl = safeHttpsUrl(item.applyUrl ?? item.apply_url);
  if (!sourceUrl && !applyUrl) return null;
  const salaryMin = numberOrNull(item.salaryMinJt ?? item.salary_min_jt);
  const salaryMax = numberOrNull(item.salaryMaxJt ?? item.salary_max_jt);
  if (salaryMin === undefined || salaryMax === undefined || (salaryMin != null && salaryMax != null && salaryMin > salaryMax)) return null;
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 30) : [];

  return {
    externalId, title, company, sourceName, province, city,
    salaryMin, salaryMax,
    workMode: String(item.workMode ?? item.work_mode ?? '').trim().slice(0, 40) || null,
    level: String(item.level || '').trim().slice(0, 40) || null,
    tags,
    description: String(item.description || '').trim().slice(0, 12000) || null,
    sourceUrl: sourceUrl || applyUrl,
    applyUrl: applyUrl || sourceUrl,
    postedAt: posted.toISOString(),
    expiresAt: expires.toISOString(),
  };
}
