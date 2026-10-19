import http from 'node:http';
import crypto from 'node:crypto';
import { Pool } from 'pg';

const port = Number(process.env.PORT || 10000);
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }) : null;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const sessions = new Map();

const schema = `
create extension if not exists pgcrypto;
create table if not exists profiles (
 id uuid primary key default gen_random_uuid(), email text unique not null, name text,
 password_hash text, email_verified boolean not null default false,
 skills text[] not null default '{}', preferred_modes text[] not null default '{}', preferred_provinces text[] not null default '{}', target_levels text[] not null default '{}', minimum_salary_jt numeric not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists jobs (
 id uuid primary key default gen_random_uuid(), external_id text, title text not null, company text not null, province text, city text, salary_min_jt numeric, salary_max_jt numeric, work_mode text, level text, tags text[] not null default '{}', description text, source_name text not null, source_url text, apply_url text, verified boolean not null default false, status text not null default 'active', posted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source_name, external_id)
);
create table if not exists saved_jobs (profile_id uuid references profiles(id) on delete cascade, job_id uuid references jobs(id) on delete cascade, created_at timestamptz not null default now(), primary key(profile_id, job_id));
create table if not exists applications (id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id) on delete cascade, job_id uuid references jobs(id) on delete cascade, status text not null default 'saved', applied_at timestamptz, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(profile_id, job_id));
create index if not exists jobs_location_idx on jobs(province, city);
create index if not exists jobs_status_posted_idx on jobs(status, posted_at desc);
`;
const send=(res,status,data,headers={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':process.env.FRONTEND_ORIGIN||'*','access-control-allow-headers':'content-type, authorization','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS',...headers});res.end(JSON.stringify(data));};
const body=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>1000000)reject(new Error('payload_too_large'))});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('invalid_json'))}})});
const requireDb=()=>{if(!pool)throw new Error('DATABASE_URL is not configured');return pool};
const verifyPassword=(password,stored)=>{const [salt,hash]=stored.split(':');if(!salt||!hash)return false;const derived=crypto.scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex');return crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(derived,'hex'));};
const makePasswordHash=password=>{const salt=crypto.randomBytes(16);const hash=crypto.scryptSync(password,salt,64);return `${salt.toString('hex')}:${hash.toString('hex')}`};
const issueSession=(profileId,email)=>{const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{profileId,email,expiresAt:Date.now()+SESSION_TTL_MS});return token};
const getSession=req=>{const auth=req.headers.authorization||'';if(!auth.startsWith('Bearer '))return null;const token=auth.slice(7);const session=sessions.get(token);if(!session||session.expiresAt<Date.now()){sessions.delete(token);return null}return {token,...session}};
const cleanProfile=row=>({id:row.id,email:row.email,name:row.name,emailVerified:row.email_verified,skills:row.skills||[],preferredModes:row.preferred_modes||[],preferredProvinces:row.preferred_provinces||[],targetLevels:row.target_levels||[],minimumSalaryJt:Number(row.minimum_salary_jt||0)});

async function start(){if(pool)await pool.query(schema);server.listen(port,'0.0.0.0',()=>console.log(`NOVA API listening on ${port}`))}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS')return send(res,204,{});
 try{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);const db=requireDb();
  if(url.pathname==='/api/health'&&req.method==='GET'){const r=await db.query('select now() as now');return send(res,200,{ok:true,database:true,now:r.rows[0].now,jobFeedConfigured:Boolean(process.env.NOVA_JOB_FEED_URL)})}
  if(url.pathname==='/api/auth/signup'&&req.method==='POST'){
   const d=await body(req);const email=String(d.email||'').trim().toLowerCase();const password=String(d.password||'');const name=String(d.name||'').trim();
   if(!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{error:'invalid_email'});if(password.length<8)return send(res,400,{error:'password_too_short'});
   const exists=await db.query('select id from profiles where email=$1',[email]);if(exists.rowCount)return send(res,409,{error:'email_already_registered'});
   const r=await db.query('insert into profiles(email,name,password_hash) values($1,$2,$3) returning *',[email,name||null,makePasswordHash(password)]);const token=issueSession(r.rows[0].id,email);
   return send(res,201,{token,profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/auth/login'&&req.method==='POST'){
   const d=await body(req);const email=String(d.email||'').trim().toLowerCase();const password=String(d.password||'');const r=await db.query('select * from profiles where email=$1',[email]);
   if(!r.rowCount||!r.rows[0].password_hash||!verifyPassword(password,r.rows[0].password_hash))return send(res,401,{error:'invalid_credentials'});
   const token=issueSession(r.rows[0].id,email);return send(res,200,{token,profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/auth/me'&&req.method==='GET'){
   const session=getSession(req);if(!session)return send(res,401,{error:'unauthorized'});const r=await db.query('select * from profiles where id=$1',[session.profileId]);if(!r.rowCount)return send(res,401,{error:'unauthorized'});return send(res,200,{profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/auth/logout'&&req.method==='POST'){const session=getSession(req);if(session)sessions.delete(session.token);return send(res,200,{ok:true})}

  const session=getSession(req);
  if(url.pathname==='/api/profile'&&req.method==='PATCH'){
   if(!session)return send(res,401,{error:'unauthorized'});const d=await body(req);
   const r=await db.query(`update profiles set name=coalesce($1,name),skills=coalesce($2,skills),preferred_modes=coalesce($3,preferred_modes),preferred_provinces=coalesce($4,preferred_provinces),target_levels=coalesce($5,target_levels),minimum_salary_jt=coalesce($6,minimum_salary_jt),updated_at=now() where id=$7 returning *`,[d.name,d.skills,d.preferredModes,d.preferredProvinces,d.targetLevels,d.minimumSalaryJt==null?null:Number(d.minimumSalaryJt),session.profileId]);return send(res,200,{profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/profile'&&req.method==='GET'){if(!session)return send(res,401,{error:'unauthorized'});const r=await db.query('select * from profiles where id=$1',[session.profileId]);return send(res,200,{profile:cleanProfile(r.rows[0])})}

  if(url.pathname==='/api/jobs'&&req.method==='GET'){
   const q=String(url.searchParams.get('q')||'').trim(),province=String(url.searchParams.get('province')||'').trim(),level=String(url.searchParams.get('level')||'').trim(),mode=String(url.searchParams.get('mode')||'').trim();const values=[],where=["status='active'"];
   if(q){values.push(`%${q}%`);where.push(`(title ilike $${values.length} or company ilike $${values.length} or city ilike $${values.length} or province ilike $${values.length} or array_to_string(tags,' ') ilike $${values.length})`)}if(province){values.push(province);where.push(`province=$${values.length}`)}if(level){values.push(level);where.push(`level=$${values.length}`)}if(mode){values.push(mode);where.push(`work_mode=$${values.length}`)}
   const r=await db.query(`select id,external_id,title,company,province,city,salary_min_jt,salary_max_jt,work_mode,level,tags,description,source_name,source_url,apply_url,verified,posted_at from jobs where ${where.join(' and ')} order by posted_at desc nulls last limit 100`,values);return send(res,200,{jobs:r.rows,sourceConfigured:Boolean(process.env.NOVA_JOB_FEED_URL),notice:r.rowCount?'Live database jobs':'No live jobs ingested yet'});
  }
  const saved=url.pathname.match(/^\/api\/saved$/);if(saved){if(!session)return send(res,401,{error:'unauthorized'});if(req.method==='GET'){const r=await db.query('select j.* from saved_jobs s join jobs j on j.id=s.job_id where s.profile_id=$1 order by s.created_at desc',[session.profileId]);return send(res,200,{jobs:r.rows})}if(req.method==='POST'){const d=await body(req);if(!d.jobId)return send(res,400,{error:'jobId_required'});await db.query('insert into saved_jobs(profile_id,job_id) values($1,$2) on conflict do nothing',[session.profileId,d.jobId]);return send(res,201,{ok:true})}if(req.method==='DELETE'){const id=url.searchParams.get('jobId');await db.query('delete from saved_jobs where profile_id=$1 and job_id=$2',[session.profileId,id]);return send(res,200,{ok:true})}}
  const apps=url.pathname.match(/^\/api\/applications$/);if(apps){if(!session)return send(res,401,{error:'unauthorized'});if(req.method==='GET'){const r=await db.query('select a.*,j.title,j.company,j.city,j.province,j.level,j.work_mode,j.apply_url from applications a join jobs j on j.id=a.job_id where a.profile_id=$1 order by a.updated_at desc',[session.profileId]);return send(res,200,{applications:r.rows})}if(req.method==='POST'){const d=await body(req);if(!d.jobId)return send(res,400,{error:'jobId_required'});const r=await db.query(`insert into applications(profile_id,job_id,status,applied_at,notes) values($1,$2,$3,$4,$5) on conflict(profile_id,job_id) do update set status=excluded.status,applied_at=excluded.applied_at,notes=excluded.notes,updated_at=now() returning *`,[session.profileId,d.jobId,d.status||'applied',d.appliedAt||new Date().toISOString(),d.notes||null]);return send(res,201,{application:r.rows[0]})}}
  return send(res,404,{error:'not_found'});
 }catch(error){console.error(error);const status=error.message==='DATABASE_URL is not configured'?503:error.message==='invalid_json'?400:error.message==='payload_too_large'?413:500;return send(res,status,{error:status===500?'internal_server_error':error.message})}
});
start().catch(error=>{console.error('NOVA API failed to start:',error);process.exit(1)});
