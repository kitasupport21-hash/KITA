import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 10000);
const staticDir = path.resolve(process.cwd(), 'dist');
const CACHE_MS = 10 * 60 * 1000;
const JOBSTREET_HOST = 'https://id.jobstreet.com';
const JOBSTREET_SITE = 'ID-Main';
const JOBSTREET_WHERE = 'Indonesia';
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const SEARCHES = ['', 'software developer', 'data analyst', 'sales marketing', 'finance accounting', 'admin customer service', 'engineering manufacturing', 'hospitality retail logistics', 'healthcare', 'fresh graduate'];
const JOBSERVER_SEARCHES = ['software developer','data analyst','sales','marketing','accounting','admin','customer service','engineer','hotel','retail','logistics','IT support','finance','HR','operator','warehouse','driver','nurse'];
let cache = { at: 0, jobs: [] };
let loading = null;

const text = v => v == null ? '' : String(v).trim();
const first = (...v) => v.map(text).find(Boolean) || '';
const safeUrl = v => { try { const u = new URL(text(v)); return u.protocol === 'https:' ? u.toString() : null; } catch { return null; } };
const json = (res, status, data) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'content-type'}); res.end(JSON.stringify(data)); };

function salaryRange(label='') {
  const nums = (label.match(/[0-9]+(?:[.,][0-9]+)?/g)||[]).map(x=>Number(x.replace(/,/g,''))).filter(Number.isFinite);
  if (!nums.length) return [null,null];
  const vals = nums.map(n => n > 100000000 ? n/100000000 : n > 100000 ? n/1000000 : n/1000000);
  return [vals[0], vals[1] ?? vals[0]];
}

function normalizeSeek(p, index) {
  const company = first(p.companyName, p.advertiser?.description);
  if (!p.id || !p.title || !company || /^private advertiser$/i.test(company)) return null;
  const loc = p.locations?.[0] || {};
  const arrangements = (p.workArrangements?.data || []).map(x => text(x?.label?.text).toLowerCase());
  const mode = arrangements.includes('remote') ? 'Remote' : arrangements.includes('hybrid') ? 'Hybrid' : arrangements.includes('on-site') ? 'On-site' : 'On-site';
  const types = (p.workTypes || []).map(text);
  const level = first(p.seniority, p.experience, 'Beginner');
  const [salaryMin, salaryMax] = salaryRange(p.salaryLabel);
  const posted = new Date(p.listingDate || Date.now());
  return { id:`jobstreet-${p.id}`, external_id:String(p.id), title:text(p.title), company, province:first(loc.label,'Indonesia'), city:first(loc.label,'Indonesia'), salary_min_jt:salaryMin, salary_max_jt:salaryMax, work_mode:mode, level, tags:types.slice(0,20), description:first(p.abstract,p.description,p.salaryLabel), source_name:'NOVA Job API · JobStreet', source_url:`${JOBSTREET_HOST}/job/${p.id}`, apply_url:`${JOBSTREET_HOST}/job/${p.id}`, verified:true, posted_at:Number.isNaN(posted.getTime())?new Date().toISOString():posted.toISOString() };
}

async function fetchSeekPage(query, page) {
  const u = new URL(`${JOBSTREET_HOST}/api/jobsearch/v5/search`);
  u.searchParams.set('siteKey', JOBSTREET_SITE); u.searchParams.set('where', JOBSTREET_WHERE); u.searchParams.set('page', String(page)); u.searchParams.set('pageSize', String(PAGE_SIZE)); u.searchParams.set('sortmode','ListedDate');
  if (query) u.searchParams.set('keywords', query);
  const r = await fetch(u, {headers:{accept:'application/json','user-agent':'NOVA-job-api/3.0'}, signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error(`jobstreet_${r.status}`);
  const body = await r.json();
  return Array.isArray(body?.data) ? body.data : Array.isArray(body?.data?.results) ? body.data.results : Array.isArray(body?.results) ? body.results : [];
}

async function fetchJobStreet() {
  const all=[];
  for (const query of SEARCHES) {
    for (let page=1; page<=MAX_PAGES; page++) {
      let batch;
      try { batch=await fetchSeekPage(query,page); } catch (e) { console.error('NOVA JobStreet fetch failed:', query || 'all', page, e?.message || e); break; }
      if (!batch.length) break;
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      await new Promise(r=>setTimeout(r,180));
    }
  }
  return all.map(normalizeSeek).filter(Boolean);
}

async function fetchJobserverOne(query) {
  const form = new URLSearchParams({Fcountry:'Indonesia', Fsearch:query, Fpattern:'', Faddress:''});
  const r = await fetch('https://jobserver.ai/api-injector/fetchjobs', {method:'POST', headers:{'content-type':'application/x-www-form-urlencoded','accept':'application/json','user-agent':'NOVA-job-api/3.0'}, body:form, signal:AbortSignal.timeout(12000)});
  if (!r.ok) return null;
  const body = await r.json(); const j=body?.job; if (!j?.jobposition || !j?.joblink) return null;
  const d=new Date(j.jobdate || Date.now());
  if (!Number.isNaN(d.getTime()) && d.getFullYear()<2026) return null;
  return {id:`jobserver-${j.joblink}`,external_id:j.joblink,title:text(j.jobposition),company:first(j.employer,'Confidential employer'),province:'Indonesia',city:first(j.jobaddress,'Indonesia'),salary_min_jt:null,salary_max_jt:null,work_mode:/remote/i.test(`${j.jobpattern} ${j.jobaddress}`)?'Remote':'On-site',level:first(j.jobexperience,'Beginner'),tags:[text(j.jobpattern),text(j.jobexperience)].filter(Boolean),description:text(j.jobdescription),source_name:'NOVA Job API · Jobserver',source_url:safeUrl(j.joblink)||'https://jobserver.ai',apply_url:safeUrl(j.joblink),verified:false,posted_at:Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString()};
}

async function fetchFallback() { const out=[]; for(const q of JOBSERVER_SEARCHES){ try{const j=await fetchJobserverOne(q); if(j) out.push(j);}catch(e){console.error('NOVA Jobserver fallback:',q,e?.message||e);} } return out; }

function dedupe(items){const m=new Map(); for(const j of items){const k=first(j.external_id,j.apply_url,`${j.title}|${j.company}|${j.city}`).toLowerCase(); if(k&&!m.has(k))m.set(k,j);} return [...m.values()].sort((a,b)=>new Date(b.posted_at)-new Date(a.posted_at));}
async function refresh(){if(loading)return loading; loading=(async()=>{let jobs=await fetchJobStreet(); if(!jobs.length) jobs=await fetchFallback(); jobs=dedupe(jobs); if(!jobs.length) throw new Error('job_feed_empty'); cache={at:Date.now(),jobs}; console.log(`NOVA Job API warmed with ${jobs.length} Indonesia jobs`); return jobs;})().catch(e=>{console.error('NOVA refresh failed:',e?.stack||e); if(cache.jobs.length)return cache.jobs; throw e;}).finally(()=>{loading=null;}); return loading;}
async function load(){if(cache.jobs.length&&Date.now()-cache.at<CACHE_MS)return cache.jobs; return refresh();}
setInterval(()=>{if(cache.jobs.length&&Date.now()-cache.at>=CACHE_MS&&!loading)refresh().catch(()=>{});},CACHE_MS).unref();

function filter(jobs,u){let r=jobs;const q=text(u.searchParams.get('q')).toLowerCase(),city=text(u.searchParams.get('city')).toLowerCase(),mode=text(u.searchParams.get('mode')).toLowerCase(),level=text(u.searchParams.get('level')).toLowerCase();const limit=Math.min(Math.max(Number(u.searchParams.get('limit'))||100,1),1000);if(q)r=r.filter(j=>`${j.title} ${j.company} ${j.city} ${j.province} ${j.description} ${j.tags.join(' ')}`.toLowerCase().includes(q));if(city)r=r.filter(j=>`${j.city} ${j.province}`.toLowerCase().includes(city));if(mode)r=r.filter(j=>j.work_mode.toLowerCase().includes(mode));if(level)r=r.filter(j=>j.level.toLowerCase().includes(level));return r.slice(0,limit);}

async function staticFile(req,res){let p;try{p=decodeURIComponent(new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname);}catch{return json(res,400,{error:'invalid_path'});}let f=path.resolve(staticDir,`.${p}`);if(f!==staticDir&&!f.startsWith(staticDir+path.sep))return json(res,403,{error:'forbidden'});let data;try{data=await readFile(f);}catch{if(path.extname(f)||p.startsWith('/assets/'))return json(res,404,{error:'not_found'});f=path.join(staticDir,'index.html');try{data=await readFile(f);}catch{return json(res,503,{error:'frontend_build_missing'});}}const ext=path.extname(f).toLowerCase();const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-cache':'public, max-age=31536000, immutable','x-content-type-options':'nosniff'});res.end(data);}

const server=http.createServer(async(req,res)=>{try{if(req.method==='OPTIONS')return json(res,204,{});const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);if(u.pathname==='/api/health'&&req.method==='GET'){let jobs=cache.jobs;try{jobs=await load();}catch{}return json(res,200,{ok:true,database:false,databaseRequired:false,jobFeedConfigured:true,jobsAvailable:jobs.length,source:'NOVA Job API',upstreams:['JobStreet Indonesia','Jobserver Indonesia'],cachedAt:cache.at?new Date(cache.at).toISOString():null});}if(u.pathname==='/api/jobs'&&req.method==='GET'){const jobs=filter(await load(),u);return json(res,200,{jobs,total:jobs.length,source:'NOVA Job API',updated_at:cache.at?new Date(cache.at).toISOString():null});}if(u.pathname.startsWith('/api/jobs/')&&req.method==='GET'){const id=decodeURIComponent(u.pathname.slice(10));const jobs=await load();const job=jobs.find(j=>j.id===id||j.external_id===id);return job?json(res,200,{job,source:'NOVA Job API'}):json(res,404,{error:'job_not_found'});}if(u.pathname==='/api/catalog'&&req.method==='GET'){const jobs=await load();const count=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}));const c={},p={},m={},l={};for(const j of jobs){c[j.city]=(c[j.city]||0)+1;p[j.province]=(p[j.province]||0)+1;m[j.work_mode]=(m[j.work_mode]||0)+1;l[j.level]=(l[j.level]||0)+1;}return json(res,200,{cities:count(c),provinces:count(p),work_modes:count(m),levels:count(l),total_jobs:jobs.length,source:'NOVA Job API'});}if(req.method==='GET'&&!u.pathname.startsWith('/api/'))return staticFile(req,res);return json(res,404,{error:'not_found'});}catch(e){console.error('NOVA guest server error:',e?.stack||e);return json(res,502,{error:e?.message||'job_feed_unavailable'});}});
server.listen(port,'0.0.0.0',()=>{console.log(`NOVA guest server listening on ${port}`);refresh().catch(()=>{});});
