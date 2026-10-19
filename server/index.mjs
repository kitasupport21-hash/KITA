import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { normalizeFeedJob } from './job-feed.mjs';
import { getLivePaskerJobs } from './pasker-feed.mjs';

const port = Number(process.env.PORT || 10000);
const staticDir = path.resolve(process.cwd(), 'dist');
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, max: 10 }) : null;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 30;
const rateBuckets = new Map();

const schema = `
create extension if not exists pgcrypto;
create table if not exists profiles (
 id uuid primary key default gen_random_uuid(), email text unique not null, name text,
 password_hash text, email_verified boolean not null default false,
 skills text[] not null default '{}', preferred_modes text[] not null default '{}', preferred_provinces text[] not null default '{}', target_levels text[] not null default '{}', minimum_salary_jt numeric not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists employer_profiles (
 id uuid primary key default gen_random_uuid(), owner_profile_id uuid not null references profiles(id) on delete cascade,
 legal_name text not null, display_name text not null, website text, business_email text, business_registration text,
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
 verification_notes text, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists employer_verification_events (
 id uuid primary key default gen_random_uuid(), employer_id uuid not null refere
…[1 chars truncated — re-run with head/grep/tail for full output]…
NS')return send(res,204,{});
 if(['POST','PUT','PATCH','DELETE'].includes(req.method)){
  const origin=req.headers.origin;const allowedOrigin=process.env.FRONTEND_ORIGIN||'http://localhost:5173';
  const hasSessionCookie=String(req.headers.cookie||'').split(';').some(part=>part.trim().startsWith('nova_session='));
  if((origin&&origin!==allowedOrigin)||(hasSessionCookie&&!origin))return send(res,403,{error:'origin_not_allowed'});
 }
 if(rateLimited(req))return send(res,429,{error:'rate_limited',retryAfterSeconds:Math.ceil(RATE_WINDOW_MS/1000)});
 try{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&!url.pathname.startsWith('/api/')){
   let requestedPath;
   try{requestedPath=decodeURIComponent(url.pathname)}catch{return send(res,400,{error:'invalid_path'})}
   let filePath=path.resolve(staticDir,'.'+requestedPath);
   if(filePath!==staticDir&&!filePath.startsWith(staticDir+path.sep))return send(res,403,{error:'forbidden'});
   let data;
   try{data=await readFile(filePath)}catch{
    if(path.extname(filePath)||requestedPath.startsWith('/assets/'))return send(res,404,{error:'not_found'});
    filePath=path.join(staticDir,'index.html');
    try{data=await readFile(filePath)}catch{return send(res,503,{error:'frontend_build_missing'})}
   }
   const ext=path.extname(filePath).toLowerCase();
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2'};
   res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-cache':'public, max-age=31536000, immutable','x-content-type-options':'nosniff'});
   return res.end(data);
  }
  if(url.pathname==='/api/public/jobs/pasker'&&req.method==='GET'){
   try{const result=await getLivePaskerJobs();return send(res,200,{...result,source:'Pasker ID miniJobi',live:true,notice:result.jobs.length?'Current official listings; apply through Pasker ID':'No unexpired openings were found on the official miniJobi page at this check.'},{'cache-control':'public, max-age=300, stale-while-revalidate=300'});}catch(error){console.error('Pasker live feed unavailable',error.message);return send(res,502,{error:'official_job_source_unavailable',sourceUrl:'https://paskerid.kemnaker.go.id/miniJobi',live:false,notice:'Could not refresh official listings right now. Open Pasker ID directly to check current vacancies.'});}
  }
  const db=requireDb();
  if(url.pathname==='/api/health'&&req.method==='GET'){const r=await db.query('select now() as now');return send(res,200,{ok:true,database:true,now:r.rows[0].now,jobFeedConfigured:Boolean(process.env.NOVA_JOB_FEED_URL)})}
  if(url.pathname==='/api/admin/jobs/sync'&&req.method==='POST'){
   const expected=process.env.NOVA_SYNC_SECRET||'';
   const supplied=String(req.headers['x-nova-sync-secret']||'');
   if(!expected)return send(res,503,{error:'sync_secret_not_configured'});
   const expectedBuffer=Buffer.from(expected),suppliedBuffer=Buffer.from(supplied);
   if(expectedBuffer.length!==suppliedBuffer.length||!crypto.timingSafeEqual(expectedBuffer,suppliedBuffer))return send(res,403,{error:'forbidden'});
   if(!process.env.NOVA_JOB_FEED_URL)return send(res,503,{error:'job_feed_not_configured'});
   let feedUrl;try{feedUrl=new URL(process.env.NOVA_JOB_FEED_URL)}catch{return send(res,503,{error:'invalid_job_feed_url'})}
   if(feedUrl.protocol!=='https:'&&feedUrl.hostname!=='localhost')return send(res,503,{error:'job_feed_must_use_https'});
   const response=await fetch(feedUrl,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
   if(!response.ok)return send(res,502,{error:'job_feed_request_failed',upstreamStatus:response.status});
   const payload=await response.json();const items=Array.isArray(payload)?payload:payload?.jobs;
   if(!Array.isArray(items))return send(res,502,{error:'invalid_job_feed_format'});
   if(items.length>5000)return send(res,413,{error:'job_feed_too_large'});
   let imported=0,skipped=0;
   for(const item of items){
    const job=normalizeFeedJob(item,feedUrl.hostname);
    if(!job){skipped++;continue}
    await db.query(`insert into jobs(external_id,title,company,province,city,salary_min_jt,salary_max_jt,work_mode,level,tags,description,source_name,source_url,apply_url,status,posted_at,expires_at)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',$15,$16)
     on conflict(source_name,external_id) do update set title=excluded.title,company=excluded.company,province=excluded.province,city=excluded.city,salary_min_jt=excluded.salary_min_jt,salary_max_jt=excluded.salary_max_jt,work_mode=excluded.work_mode,level=excluded.level,tags=excluded.tags,description=excluded.description,source_url=excluded.source_url,apply_url=excluded.apply_url,status='active',posted_at=excluded.posted_at,expires_at=excluded.expires_at,updated_at=now()`,
    [job.externalId,job.title,job.company,job.province,job.city,job.salaryMin,job.salaryMax,job.workMode,job.level,job.tags,job.description,job.sourceName,job.sourceUrl,job.applyUrl,job.postedAt,job.expiresAt]);
    imported++;
   }
   // Mark stale records inactive, including jobs whose source stopped returning them after expiry.
   await db.query("update jobs set status='expired',updated_at=now() where status='active' and ((expires_at is not null and expires_at <= now()) or (posted_at is not null and posted_at < now() - interval '60 days'))");
   return send(res,200,{ok:true,received:items.length,imported,skipped,source:feedUrl.hostname});
  }
  if(url.pathname==='/api/auth/signup'&&req.method==='POST'){
   const d=await body(req);const email=String(d.email||'').trim().toLowerCase();const password=String(d.password||'');const name=String(d.name||'').trim();
   if(!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{error:'invalid_email'});if(password.length<8||password.length>200)return send(res,400,{error:'invalid_password'});if(name.length>120)return send(res,400,{error:'invalid_name'});
   const exists=await db.query('select id from profiles where email=$1',[email]);if(exists.rowCount)return send(res,409,{error:'email_already_registered'});
   const r=await db.query('insert into profiles(email,name,password_hash) values($1,$2,$3) returning *',[email,name||null,makePasswordHash(password)]);const token=await issueSession(db,r.rows[0].id);
   return send(res,201,{profile:cleanProfile(r.rows[0])},{'set-cookie':sessionCookie(token)});
  }
  if(url.pathname==='/api/auth/login'&&req.method==='POST'){
   const d=await body(req);const email=String(d.email||'').trim().toLowerCase();const password=String(d.password||'');const r=await db.query('select * from profiles where email=$1',[email]);
   if(!r.rowCount||!r.rows[0].password_hash||!verifyPassword(password,r.rows[0].password_hash))return send(res,401,{error:'invalid_credentials'});
   const token=await issueSession(db,r.rows[0].id);return send(res,200,{profile:cleanProfile(r.rows[0])},{'set-cookie':sessionCookie(token)});
  }
  if(url.pathname==='/api/auth/me'&&req.method==='GET'){
   const session=await getSession(req,db);if(!session)return send(res,401,{error:'unauthorized'});const r=await db.query('select * from profiles where id=$1',[session.profileId]);if(!r.rowCount)return send(res,401,{error:'unauthorized'});return send(res,200,{profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/auth/logout'&&req.method==='POST'){const session=await getSession(req,db);if(session)await db.query('delete from sessions where token_hash=$1',[hashToken(session.token)]);return send(res,200,{ok:true},{'set-cookie':clearSessionCookie()})}

  const session=await getSession(req,db);
  if(url.pathname==='/api/profile'&&req.method==='PATCH'){
   if(!session)return send(res,401,{error:'unauthorized'});const d=await body(req);const skills=normalizeArray(d.skills),modes=normalizeArray(d.preferredModes),provinces=normalizeArray(d.preferredProvinces),levels=normalizeArray(d.targetLevels);
   if(!validStringArray(d.skills)||!validStringArray(d.preferredModes)||!validStringArray(d.preferredProvinces)||!validStringArray(d.targetLevels))return send(res,400,{error:'invalid_profile_arrays'});
   if(d.minimumSalaryJt!=null&&(!Number.isFinite(Number(d.minimumSalaryJt))||Number(d.minimumSalaryJt)<0||Number(d.minimumSalaryJt)>1000))return send(res,400,{error:'invalid_salary'});
   const r=await db.query(`update profiles set name=case when $1 is null then name else $1 end,skills=case when $2 is null then skills else $2 end,preferred_modes=case when $3 is null then preferred_modes else $3 end,preferred_provinces=case when $4 is null then preferred_provinces else $4 end,target_levels=case when $5 is null then target_levels else $5 end,minimum_salary_jt=case when $6 is null then minimum_salary_jt else $6 end,updated_at=now() where id=$7 returning *`,[d.name==null?null:String(d.name).slice(0,120),skills,modes,provinces,levels,d.minimumSalaryJt==null?null:Number(d.minimumSalaryJt),session.profileId]);return send(res,200,{profile:cleanProfile(r.rows[0])});
  }
  if(url.pathname==='/api/profile'&&req.method==='GET'){if(!session)return send(res,401,{error:'unauthorized'});const r=await db.query('select * from profiles where id=$1',[session.profileId]);return send(res,200,{profile:cleanProfile(r.rows[0])})}

  if(url.pathname==='/api/employers'&&req.method==='POST'){
   if(!session)return send(res,401,{error:'unauthorized'});const d=await body(req);const legalName=String(d.legalName||'').trim(),displayName=String(d.displayName||legalName).trim(),website=String(d.website||'').trim(),businessEmail=String(d.businessEmail||'').trim().toLowerCase(),registration=String(d.businessRegistration||'').trim();
   if(legalName.length<2||legalName.length>200||displayName.length<2||displayName.length>160)return send(res,400,{error:'invalid_employer_name'});
   if(website&&website.length>300)return send(res,400,{error:'invalid_website'});
   if(businessEmail&&!/^\S+@\S+\.\S+$/.test(businessEmail))return send(res,400,{error:'invalid_business_email'});
   if(registration.length>160)return send(res,400,{error:'invalid_business_registration'});
   const existing=await db.query('select id,verification_status from employer_profiles where owner_profile_id=$1 order by created_at desc limit 1',[session.profileId]);
   if(existing.rowCount&&existing.rows[0].verification_status==='verified')return send(res,409,{error:'employer_already_verified',employerId:existing.rows[0].id});
   const r=await db.query(`insert into employer_profiles(owner_profile_id,legal_name,display_name,website,business_email,business_registration) values($1,$2,$3,$4,$5,$6) returning *`,[session.profileId,legalName,displayName,website||null,businessEmail||null,registration||null]);
   await db.query('insert into employer_verification_events(employer_id,actor_profile_id,status,notes) values($1,$2,$3,$4)',[r.rows[0].id,session.profileId,'pending','Employer verification request submitted']);
   return send(res,201,{employer:{id:r.rows[0].id,legalName:r.rows[0].legal_name,displayName:r.rows[0].display_name,website:r.rows[0].website,verificationStatus:r.rows[0].verification_status}});
  }
  if(url.pathname==='/api/employers/me'&&req.method==='GET'){
   if(!session)return send(res,401,{error:'unauthorized'});const r=await db.query('select id,legal_name,display_name,website,business_email,business_registration,verification_status,verification_notes,verified_at,created_at,updated_at from employer_profiles where owner_profile_id=$1 order by created_at desc',[session.profileId]);return send(res,200,{employers:r.rows.map(e=>({id:e.id,legalName:e.legal_name,displayName:e.display_name,website:e.website,businessEmail:e.business_email,businessRegistration:e.business_registration,verificationStatus:e.verification_status,verificationNotes:e.verification_notes,verifiedAt:e.verified_at,createdAt:e.created_at,updatedAt:e.updated_at}))});
  }

  if(url.pathname==='/api/jobs'&&req.method==='GET'){
   const q=String(url.searchParams.get('q')||'').trim(),province=String(url.searchParams.get('province')||'').trim(),level=String(url.searchParams.get('level')||'').trim(),mode=String(url.searchParams.get('mode')||'').trim();const values=[],where=["j.status='active'"];
   if(q){values.push(`%${q.slice(0,120)}%`);where.push(`(j.title ilike $${values.length} or j.company ilike $${values.length} or j.city ilike $${values.length} or j.province ilike $${values.length} or array_to_string(j.tags,' ') ilike $${values.length})`)}if(province){values.push(province);where.push(`j.province=$${values.length}`)}if(level){values.push(level);where.push(`j.level=$${values.length}`)}if(mode){values.push(mode);where.push(`j.work_mode=$${values.length}`)}
   const r=await db.query(`select j.id,j.external_id,j.title,j.company,j.province,j.city,j.salary_min_jt,j.salary_max_jt,j.work_mode,j.level,j.tags,j.description,j.source_name,j.source_url,j.apply_url,(ep.verification_status='verified' and ep.id is not null) as verified,j.posted_at,j.expires_at,ep.id as employer_id,ep.display_name as verified_employer_name from jobs j left join employer_profiles ep on ep.id=j.employer_id where ${where.join(' and ')} and j.posted_at >= now() - interval '60 days' and (j.expires_at is null or j.expires_at > now()) order by j.posted_at desc nulls last limit 100`,values);return send(res,200,{jobs:r.rows,sourceConfigured:Boolean(process.env.NOVA_JOB_FEED_URL),notice:r.rowCount?'Live database jobs':'No live jobs ingested yet'});
  }
  if(url.pathname==='/api/saved'){
   if(!session)return send(res,401,{error:'unauthorized'});
   if(req.method==='GET'){const r=await db.query('select j.* from saved_jobs s join jobs j on j.id=s.job_id where s.profile_id=$1 order by s.created_at desc',[session.profileId]);return send(res,200,{jobs:r.rows})}
   if(req.method==='POST'){const d=await body(req);if(typeof d.jobId!=='string')return send(res,400,{error:'jobId_required'});const exists=await db.query("select 1 from jobs where id=$1 and status='active'",[d.jobId]);if(!exists.rowCount)return send(res,404,{error:'job_not_found'});await db.query('insert into saved_jobs(profile_id,job_id) values($1,$2) on conflict do nothing',[session.profileId,d.jobId]);return send(res,201,{ok:true})}
   if(req.method==='DELETE'){const id=url.searchParams.get('jobId');if(!id)return send(res,400,{error:'jobId_required'});await db.query('delete from saved_jobs where profile_id=$1 and job_id=$2',[session.profileId,id]);return send(res,200,{ok:true})}
  }
  if(url.pathname==='/api/applications'){
   if(!session)return send(res,401,{error:'unauthorized'});
   if(req.method==='GET'){const r=await db.query('select a.*,j.title,j.company,j.city,j.province,j.level,j.work_mode,j.apply_url from applications a join jobs j on j.id=a.job_id where a.profile_id=$1 order by a.updated_at desc',[session.profileId]);return send(res,200,{applications:r.rows})}
   if(req.method==='POST'){const d=await body(req);if(typeof d.jobId!=='string')return send(res,400,{error:'jobId_required'});const exists=await db.query("select 1 from jobs where id=$1 and status='active'",[d.jobId]);if(!exists.rowCount)return send(res,404,{error:'job_not_found'});const status=['saved','applied','screening','interview','offer','rejected','withdrawn'].includes(d.status)?d.status:'applied';const notes=d.notes==null?null:String(d.notes).slice(0,5000);const r=await db.query(`insert into applications(profile_id,job_id,status,applied_at,notes) values($1,$2,$3,$4,$5) on conflict(profile_id,job_id) do update set status=excluded.status,applied_at=excluded.applied_at,notes=excluded.notes,updated_at=now() returning *`,[session.profileId,d.jobId,status,d.appliedAt||new Date().toISOString(),notes]);const application=r.rows[0];await db.query('insert into application_status_events(application_id,new_status,note) values($1,$2,$3)',[application.id,status,notes]);const job=await db.query('select title from jobs where id=$1',[d.jobId]);await db.query('insert into notifications(profile_id,type,title,body,href) values($1,$2,$3,$4,$5)',[session.profileId,'application','Application updated',`Your application for ${job.rows[0]?.title||'a job'} is now ${status}.`,'/applications']);return send(res,201,{application})}
  }
  if(url.pathname==='/api/notifications'&&req.method==='GET'){
   if(!session)return send(res,401,{error:'unauthorized'});
   const r=await db.query('select id,type,title,body,href,read_at,created_at from notifications where profile_id=$1 order by created_at desc limit 100',[session.profileId]);
   return send(res,200,{notifications:r.rows,unreadCount:r.rows.filter(n=>!n.read_at).length});
  }
  if(url.pathname==='/api/notifications/mark-all-read'&&req.method==='PATCH'){
   if(!session)return send(res,401,{error:'unauthorized'});
   await db.query('update notifications set read_at=now() where profile_id=$1 and read_at is null',[session.profileId]);
   return send(res,200,{ok:true});
  }
  const notificationMatch=url.pathname.match(/^\/api\/notifications\/([0-9a-f-]+)\/read$/i);
  if(notificationMatch&&req.method==='PATCH'){
   if(!session)return send(res,401,{error:'unauthorized'});
   const r=await db.query('update notifications set read_at=coalesce(read_at,now()) where id=$1 and profile_id=$2 returning id',[notificationMatch[1],session.profileId]);
   if(!r.rowCount)return send(res,404,{error:'notification_not_found'});
   return send(res,200,{ok:true});
  }
  return send(res,404,{error:'not_found'});
 }catch(error){console.error(error);const status=error.message==='DATABASE_URL is not configured'?503:error.message==='invalid_json'?400:error.message==='payload_too_large'?413:500;return send(res,status,{error:status===500?'internal_server_error':error.message})}
});
start().catch(error=>{console.error('NOVA API failed to start:',error);process.exit(1)});
