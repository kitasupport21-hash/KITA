import http from 'node:http';
import { Pool } from 'pg';

const port = Number(process.env.PORT || 10000);
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })
  : null;

const schema = `
create extension if not exists pgcrypto;
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(), email text unique not null, name text,
  skills text[] not null default '{}', preferred_modes text[] not null default '{}',
  preferred_provinces text[] not null default '{}', target_levels text[] not null default '{}',
  minimum_salary_jt numeric not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(), external_id text, title text not null, company text not null,
  province text, city text, salary_min_jt numeric, salary_max_jt numeric, work_mode text, level text,
  tags text[] not null default '{}', description text, source_name text not null, source_url text, apply_url text,
  verified boolean not null default false, status text not null default 'active', posted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(source_name, external_id)
);
create table if not exists saved_jobs (
  profile_id uuid references profiles(id) on delete cascade, job_id uuid references jobs(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(profile_id, job_id)
);
create table if not exists applications (
  id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade, status text not null default 'saved', applied_at timestamptz,
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(profile_id, job_id)
);
create index if not exists jobs_location_idx on jobs(province, city);
create index if not exists jobs_status_posted_idx on jobs(status, posted_at desc);
`;

const send = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': process.env.FRONTEND_ORIGIN || '*',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(data));
};
const body = req => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('payload_too_large')); });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid_json')); } });
});
const requireDb = () => { if (!pool) throw new Error('DATABASE_URL is not configured'); return pool; };

async function start() {
  if (pool) await pool.query(schema);
  server.listen(port, '0.0.0.0', () => console.log(`NOVA API listening on ${port}`));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const db = requireDb();

    if (url.pathname === '/api/health' && req.method === 'GET') {
      const result = await db.query('select now() as now');
      return send(res, 200, { ok: true, database: true, now: result.rows[0].now });
    }

    if (url.pathname === '/api/jobs' && req.method === 'GET') {
      const q = String(url.searchParams.get('q') || '').trim();
      const province = String(url.searchParams.get('province') || '').trim();
      const level = String(url.searchParams.get('level') || '').trim();
      const mode = String(url.searchParams.get('mode') || '').trim();
      const values = [];
      const where = ["status='active'"];
      if (q) { values.push(`%${q}%`); where.push(`(title ilike $${values.length} or company ilike $${values.length} or city ilike $${values.length} or province ilike $${values.length} or array_to_string(tags,' ') ilike $${values.length})`); }
      if (province) { values.push(province); where.push(`province=$${values.length}`); }
      if (level) { values.push(level); where.push(`level=$${values.length}`); }
      if (mode) { values.push(mode); where.push(`work_mode=$${values.length}`); }
      const result = await db.query(`select id,external_id,title,company,province,city,salary_min_jt,salary_max_jt,work_mode,level,tags,description,source_name,source_url,apply_url,verified,posted_at from jobs where ${where.join(' and ')} order by posted_at desc nulls last limit 100`, values);
      return send(res, 200, { jobs: result.rows });
    }

    if (url.pathname === '/api/profiles' && req.method === 'POST') {
      const data = await body(req);
      if (!data.email) return send(res, 400, { error: 'email is required' });
      const result = await db.query(`insert into profiles (email,name,skills,preferred_modes,preferred_provinces,target_levels,minimum_salary_jt)
        values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (email) do update set name=excluded.name,skills=excluded.skills,preferred_modes=excluded.preferred_modes,
        preferred_provinces=excluded.preferred_provinces,target_levels=excluded.target_levels,minimum_salary_jt=excluded.minimum_salary_jt,updated_at=now()
        returning *`, [data.email, data.name || null, data.skills || [], data.preferredModes || [], data.preferredProvinces || [], data.targetLevels || [], Number(data.minimumSalaryJt || 0)]);
      return send(res, 200, { profile: result.rows[0] });
    }

    if (url.pathname === '/api/profiles' && req.method === 'GET') {
      const email = String(url.searchParams.get('email') || '').trim();
      if (!email) return send(res, 400, { error: 'email is required' });
      const result = await db.query('select * from profiles where email=$1', [email]);
      if (!result.rowCount) return send(res, 404, { error: 'profile_not_found' });
      return send(res, 200, { profile: result.rows[0] });
    }

    const savedMatch = url.pathname.match(/^\/api\/profiles\/([^/]+)\/saved$/);
    if (savedMatch && req.method === 'GET') {
      const result = await db.query(`select j.* from saved_jobs s join jobs j on j.id=s.job_id where s.profile_id=$1 order by s.created_at desc`, [savedMatch[1]]);
      return send(res, 200, { jobs: result.rows });
    }
    if (savedMatch && req.method === 'POST') {
      const data = await body(req);
      if (!data.jobId) return send(res, 400, { error: 'jobId is required' });
      await db.query('insert into saved_jobs(profile_id,job_id) values($1,$2) on conflict do nothing', [savedMatch[1], data.jobId]);
      return send(res, 201, { ok: true });
    }
    if (savedMatch && req.method === 'DELETE') {
      const jobId = url.searchParams.get('jobId');
      if (!jobId) return send(res, 400, { error: 'jobId is required' });
      await db.query('delete from saved_jobs where profile_id=$1 and job_id=$2', [savedMatch[1], jobId]);
      return send(res, 200, { ok: true });
    }

    const appMatch = url.pathname.match(/^\/api\/profiles\/([^/]+)\/applications$/);
    if (appMatch && req.method === 'GET') {
      const result = await db.query(`select a.*, j.title,j.company,j.city,j.province,j.level,j.work_mode,j.apply_url from applications a join jobs j on j.id=a.job_id where a.profile_id=$1 order by a.updated_at desc`, [appMatch[1]]);
      return send(res, 200, { applications: result.rows });
    }
    if (appMatch && req.method === 'POST') {
      const data = await body(req);
      if (!data.jobId) return send(res, 400, { error: 'jobId is required' });
      const result = await db.query(`insert into applications(profile_id,job_id,status,applied_at,notes) values($1,$2,$3,$4,$5)
        on conflict(profile_id,job_id) do update set status=excluded.status,applied_at=excluded.applied_at,notes=excluded.notes,updated_at=now() returning *`,
        [appMatch[1], data.jobId, data.status || 'applied', data.appliedAt || new Date().toISOString(), data.notes || null]);
      return send(res, 201, { application: result.rows[0] });
    }

    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error(error);
    const status = error.message === 'DATABASE_URL is not configured' ? 503 : error.message === 'invalid_json' ? 400 : error.message === 'payload_too_large' ? 413 : 500;
    return send(res, status, { error: status === 500 ? 'internal_server_error' : error.message });
  }
});

start().catch(error => { console.error('NOVA API failed to start:', error); process.exit(1); });
