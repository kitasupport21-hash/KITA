import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

// Production ingestion boundary: normalize jobs from an authorized/public source into NOVA's schema.
// No fabricated vacancies are inserted here. Set NOVA_JOB_FEED_URL to a source you are authorized to consume.
const feedUrl = process.env.NOVA_JOB_FEED_URL;

function normalize(raw) {
  const salaryMin = Number(raw.salary_min_jt ?? raw.salaryMinJt ?? 0) || null;
  const salaryMax = Number(raw.salary_max_jt ?? raw.salaryMaxJt ?? 0) || null;
  return {
    external_id: String(raw.external_id ?? raw.id ?? '').trim() || null,
    title: String(raw.title ?? '').trim(),
    company: String(raw.company ?? '').trim(),
    province: String(raw.province ?? '').trim() || null,
    city: String(raw.city ?? '').trim() || null,
    salary_min_jt: salaryMin,
    salary_max_jt: salaryMax,
    work_mode: String(raw.work_mode ?? raw.mode ?? '').trim() || null,
    level: String(raw.level ?? '').trim() || null,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 30) : [],
    description: String(raw.description ?? '').trim() || null,
    source_name: String(raw.source_name ?? raw.sourceName ?? 'authorized-feed').trim(),
    source_url: String(raw.source_url ?? raw.sourceUrl ?? '').trim() || null,
    apply_url: String(raw.apply_url ?? raw.applyUrl ?? '').trim() || null,
    verified: Boolean(raw.verified),
    status: 'active',
    posted_at: raw.posted_at ?? raw.postedAt ?? null,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!feedUrl) throw new Error('NOVA_JOB_FEED_URL is required; no fake/demo feed is used');

  const response = await fetch(feedUrl, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`job feed returned ${response.status}`);
  const payload = await response.json();
  const sourceJobs = Array.isArray(payload) ? payload : payload.jobs;
  if (!Array.isArray(sourceJobs)) throw new Error('job feed must return an array or { jobs: [] }');

  let upserted = 0;
  for (const raw of sourceJobs) {
    const job = normalize(raw);
    if (!job.title || !job.company || !job.external_id) continue;
    await pool.query(`
      insert into jobs(external_id,title,company,province,city,salary_min_jt,salary_max_jt,work_mode,level,tags,description,source_name,source_url,apply_url,verified,status,posted_at,updated_at)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,now())
      on conflict(source_name,external_id) do update set
        title=excluded.title,company=excluded.company,province=excluded.province,city=excluded.city,
        salary_min_jt=excluded.salary_min_jt,salary_max_jt=excluded.salary_max_jt,work_mode=excluded.work_mode,
        level=excluded.level,tags=excluded.tags,description=excluded.description,source_url=excluded.source_url,
        apply_url=excluded.apply_url,verified=excluded.verified,status=excluded.status,posted_at=excluded.posted_at,updated_at=now()
    `, [job.external_id,job.title,job.company,job.province,job.city,job.salary_min_jt,job.salary_max_jt,job.work_mode,job.level,job.tags,job.description,job.source_name,job.source_url,job.apply_url,job.verified,job.status,job.posted_at]);
    upserted++;
  }
  console.log(`NOVA job ingestion complete: ${upserted} jobs upserted`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
