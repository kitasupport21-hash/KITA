import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 10000);
const staticDir = path.resolve(process.cwd(), 'dist');
const FEED_URL = 'https://locojob.com/api/public/v1/jobs';
const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, jobs: [] };
let loading = null;

const json = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(data));
};

const text = (v) => v == null ? '' : String(v).trim();
const first = (...values) => values.map(text).find(Boolean) || '';
const number = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const parseSalary = (value) => {
  const s = text(value);
  if (!s) return [null, null];
  const nums = (s.match(/[0-9]+(?:[.,][0-9]+)?/g) || []).map(x => Number(x.replace(/,/g, ''))).filter(Number.isFinite);
  if (!nums.length) return [null, null];
  const values = nums.map(n => n > 100000 ? n / 1000000 : n > 10000 ? n / 100000 : n);
  return [values[0] ?? null, values[1] ?? values[0] ?? null];
};
const safeUrl = (v) => {
  try {
    const u = new URL(text(v));
    return u.protocol === 'https:' ? u.toString() : null;
  } catch { return null; }
};

function normalize(item, index) {
  const location = first(item.city, item.location?.city, item.location, item.place, item.address, 'Indonesia');
  const [salaryMin, salaryMax] = item.salary_min != null || item.salary_max != null
    ? [number(item.salary_min), number(item.salary_max)]
    : parseSalary(item.salary ?? item.pay ?? item.salary_range ?? item.compensation);
  const title = first(item.title, item.name, 'Open role');
  const company = first(item.company, item.company_name, item.employer?.name, item.hiring?.name, item.hiring?.company, item.hiring?.type === 'agency' ? 'Confidential employer' : '', 'Hiring company');
  const jobUrl = safeUrl(item.url ?? item.job_url ?? item.link ?? item.guid);
  const applyUrl = safeUrl(item.apply_url ?? item.application_url ?? item.applicationLink ?? item.application_link) || jobUrl;
  const skills = Array.isArray(item.skills) ? item.skills : Array.isArray(item.tags) ? item.tags : [];
  const workMode = first(item.work_mode, item.workMode, item.mode, item.remote ? 'Remote' : '', 'On-site');
  const level = first(item.level, item.seniority, item.experience_level, item.experience, item.fresher ? 'Beginner' : '', 'Beginner');
  const created = item.created_at || item.posted_at || item.postedAt || item.createdAt;
  const postedAt = created ? (Number.isFinite(Number(created)) ? new Date(Number(created) * 1000).toISOString() : new Date(created).toISOString()) : new Date().toISOString();
  const id = first(item.id, item.job_id, item.slug, jobUrl, `${title}-${company}-${index}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 180);
  return {
    id,
    external_id: id,
    title,
    company,
    province: first(item.province, item.state, item.region, 'Indonesia'),
    city: location,
    salary_min_jt: salaryMin,
    salary_max_jt: salaryMax,
    work_mode: workMode,
    level,
    tags: skills.map(text).filter(Boolean).slice(0, 20),
    description: first(item.description, item.summary, item.excerpt),
    source_name: 'LocoJobs',
    source_url: jobUrl || 'https://locojob.com',
    apply_url: applyUrl,
    verified: false,
    posted_at: postedAt,
  };
}

async function fetchPage(page) {
  const url = new URL(FEED_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', '20');
  const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'NOVA-career-platform/1.0' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`job_feed_${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.jobs || payload.data || []);
}

async function loadJobs() {
  if (Date.now() - cache.at < CACHE_MS && cache.jobs.length) return cache.jobs;
  if (loading) return loading;
  loading = (async () => {
    const all = [];
    for (let page = 1; page <= 10; page += 1) {
      const batch = await fetchPage(page);
      all.push(...batch);
      if (batch.length < 20) break;
    }
    const jobs = all.map(normalize).filter(j => j.apply_url || j.source_url);
    cache = { at: Date.now(), jobs };
    return jobs;
  })().finally(() => { loading = null; });
  return loading;
}

async function serveStatic(req, res) {
  let requestedPath;
  try { requestedPath = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname); }
  catch { return json(res, 400, { error: 'invalid_path' }); }
  let filePath = path.resolve(staticDir, `.${requestedPath}`);
  if (filePath !== staticDir && !filePath.startsWith(staticDir + path.sep)) return json(res, 403, { error: 'forbidden' });
  let data;
  try { data = await readFile(filePath); }
  catch {
    if (path.extname(filePath) || requestedPath.startsWith('/assets/')) return json(res, 404, { error: 'not_found' });
    filePath = path.join(staticDir, 'index.html');
    try { data = await readFile(filePath); } catch { return json(res, 503, { error: 'frontend_build_missing' }); }
  }
  const ext = path.extname(filePath).toLowerCase();
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.json':'application/json; charset=utf-8', '.woff':'font/woff', '.woff2':'font/woff2' };
  res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable', 'x-content-type-options':'nosniff' });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/health' && req.method === 'GET') {
      let count = cache.jobs.length;
      try { count = (await loadJobs()).length; } catch { /* health stays useful even if upstream is temporarily unavailable */ }
      return json(res, 200, { ok: true, database: false, databaseRequired: false, jobFeedConfigured: true, jobsAvailable: count, source: 'LocoJobs' });
    }
    if (url.pathname === '/api/jobs' && req.method === 'GET') {
      let jobs = await loadJobs();
      const q = text(url.searchParams.get('q')).toLowerCase();
      const city = text(url.searchParams.get('city')).toLowerCase();
      const mode = text(url.searchParams.get('mode')).toLowerCase();
      const level = text(url.searchParams.get('level')).toLowerCase();
      if (q) jobs = jobs.filter(j => `${j.title} ${j.company} ${j.city} ${j.province} ${j.description} ${j.tags.join(' ')}`.toLowerCase().includes(q));
      if (city) jobs = jobs.filter(j => `${j.city} ${j.province}`.toLowerCase().includes(city));
      if (mode) jobs = jobs.filter(j => j.work_mode.toLowerCase() === mode);
      if (level) jobs = jobs.filter(j => j.level.toLowerCase() === level);
      return json(res, 200, { jobs, total: jobs.length, source: 'LocoJobs' });
    }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) return serveStatic(req, res);
    return json(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error('NOVA guest server error:', error?.stack || error);
    return json(res, 502, { error: error instanceof Error ? error.message : 'job_feed_unavailable' });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`NOVA guest server listening on ${port}`));
