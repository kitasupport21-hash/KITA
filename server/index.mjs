import http from 'node:http';
import { Pool } from 'pg';

const port = Number(process.env.PORT || 10000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

const send = (res, status, data) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': process.env.FRONTEND_ORIGIN || '*', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
  res.end(JSON.stringify(data));
};
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', c => raw += c); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } }); });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    if (req.url === '/api/health') {
      const result = await pool.query('select now() as now');
      return send(res, 200, { ok: true, database: true, now: result.rows[0].now });
    }
    if (req.url?.startsWith('/api/jobs') && req.method === 'GET') {
      const result = await pool.query(`select id,title,company,province,city,salary_min_jt,salary_max_jt,work_mode,level,tags,source_name,source_url,apply_url,verified,posted_at from jobs where status='active' order by posted_at desc nulls last limit 100`);
      return send(res, 200, { jobs: result.rows });
    }
    if (req.url === '/api/profiles' && req.method === 'POST') {
      const data = await body(req);
      if (!data.email) return send(res, 400, { error: 'email is required' });
      const result = await pool.query(`insert into profiles (email,name,skills,preferred_modes,preferred_provinces,target_levels,minimum_salary_jt) values ($1,$2,$3,$4,$5,$6,$7) on conflict (email) do update set name=excluded.name,skills=excluded.skills,preferred_modes=excluded.preferred_modes,preferred_provinces=excluded.preferred_provinces,target_levels=excluded.target_levels,minimum_salary_jt=excluded.minimum_salary_jt,updated_at=now() returning *`, [data.email,data.name||null,data.skills||[],data.preferredModes||[],data.preferredProvinces||[],data.targetLevels||[],Number(data.minimumSalaryJt||0)]);
      return send(res, 200, { profile: result.rows[0] });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: 'internal_server_error' });
  }
});
server.listen(port, '0.0.0.0', () => console.log(`NOVA API listening on ${port}`));
