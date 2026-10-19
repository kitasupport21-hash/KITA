import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatch, detectRiskSignals } from '../src/lib/novaEngine.ts';
import { parseCvText, supportedCvTextType } from '../src/lib/novaCv.ts';
import { regencyMatchesCity, filterRegenciesForProvince } from '../src/lib/indonesiaRegions.ts';

test('career match scoring stays in range and explains gaps', () => {
  const result = calculateMatch({
    skills: ['React', 'TypeScript'], preferredModes: ['Remote'],
    preferredProvinces: ['DKI Jakarta'], targetLevels: ['Junior'], minimumSalaryJt: 8
  }, {
    title: 'Frontend Developer', tags: ['React'], mode: 'Remote',
    province: 'DKI Jakarta', level: 'Junior', salary: 'Rp 5–7 jt'
  });
  assert.ok(result.overall >= 0 && result.overall <= 100);
  assert.equal(result.skills, 50);
  assert.deepEqual(result.gaps, ['typescript']);
  assert.ok(result.reasons.length >= 3);
});

test('fraud detection flags suspicious upfront payment and OTP requests', () => {
  const signals = detectRiskSignals('Please transfer a registration fee before interview and send OTP to recruiter');
  assert.ok(signals.includes('upfront payment'));
  assert.ok(signals.includes('unusual identity request'));
});

test('CV text parser extracts contact details and recognized skills', () => {
  const parsed = parseCvText('Dewi Lestari\ndewi@example.id\n+62 812-3456-7890\nSkills\nReact, TypeScript, SQL\nExperience\nFrontend intern');
  assert.equal(parsed.fullName, 'Dewi Lestari');
  assert.equal(parsed.email, 'dewi@example.id');
  assert.ok(parsed.skills.includes('React'));
  assert.ok(parsed.skills.includes('TypeScript'));
  assert.equal(parsed.sourceTextLength > 20, true);
});

test('CV upload type gate does not pretend PDF/DOCX extraction exists', () => {
  assert.equal(supportedCvTextType('text/plain', 'cv.txt'), true);
  assert.equal(supportedCvTextType('', 'cv.md'), true);
  assert.equal(supportedCvTextType('application/pdf', 'cv.pdf'), false);
  assert.equal(supportedCvTextType('', 'cv.docx'), false);
});

test('Indonesia location reference contains all provinces and regencies with valid parent links', async () => {
  const { readFile } = await import('node:fs/promises');
  const provinces = JSON.parse(await readFile(new URL('../src/data/indonesia-provinces.json', import.meta.url), 'utf8'));
  const regencies = [];
  for (const part of [1, 2, 3]) regencies.push(...JSON.parse(await readFile(new URL(`../src/data/indonesia-regencies-${part}.json`, import.meta.url), 'utf8')));
  assert.equal(provinces.length, 38);
  assert.equal(regencies.length, 514);
  const provinceIds = new Set(provinces.map((item) => item.id));
  assert.ok(regencies.every((item) => provinceIds.has(item.provinceId)));
  assert.equal(new Set(regencies.map((item) => item.id)).size, 514);
});

test('district matching tolerates common Indonesian city-name prefixes', () => {
  assert.equal(regencyMatchesCity('Kota Administrasi Jakarta Selatan', 'KOTA ADM. JAKARTA SELATAN'), true);
  assert.equal(regencyMatchesCity('Kota Administrasi Jakarta Selatan', 'Jakarta Selatan'), true);
  assert.equal(regencyMatchesCity('Kabupaten Solok Selatan', 'KAB. SOLOK SELATAN'), true);
  assert.equal(regencyMatchesCity('Kota Bandung', 'KABUPATEN BANDUNG'), false);
  assert.equal(filterRegenciesForProvince('DKI Jakarta').length, 6);
  assert.equal(filterRegenciesForProvince('All Indonesia').length, 514);
});

test('official Pasker feed keeps only current listings with direct detail and apply links', async () => {
  const { parsePaskerMiniJobi } = await import('../server/pasker-feed.mjs');
  const html = `
    <div class="col-lg-4 col-md-6"><div class="card"><div class="card-body">
      <h3 class="h6 fw-bold mb-2">Operator Produksi</h3><div class="small text-muted mb-3">PT Contoh Industri</div>
      <span class="badge text-bg-light border">KAB. BEKASI</span><span class="badge text-bg-light border">Full-time</span><span class="badge text-bg-light border">Manufaktur</span>
      <p class="mb-3 text-secondary">Mengoperasikan lini produksi.</p><div><strong>Gaji:</strong> Rp 5.000.000</div><div><strong>Batas Lamar:</strong> 25 Des 2026</div>
      <a href="https://paskerid.kemnaker.go.id/miniJobi/100" class="btn">Lihat Detail</a>
    </div></div></div>
    <div class="col-lg-4 col-md-6"><div class="card"><div class="card-body">
      <h3 class="h6 fw-bold mb-2">Lowongan Kedaluwarsa</h3><div class="small text-muted mb-3">PT Lama</div>
      <span class="badge">KOTA BANDUNG</span><span class="badge">Full-time</span><span class="badge">Teknologi</span>
      <p class="mb-3 text-secondary">Sudah tutup.</p><div><strong>Batas Lamar:</strong> 25 Apr 2026</div>
      <a href="https://paskerid.kemnaker.go.id/miniJobi/99" class="btn">Lihat Detail</a>
    </div></div></div>`;
  const jobs = parsePaskerMiniJobi(html, new Date('2026-10-19T00:00:00Z'));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].title, 'Operator Produksi');
  assert.equal(jobs[0].company, 'PT Contoh Industri');
  assert.equal(jobs[0].city, 'KAB. BEKASI');
  assert.equal(jobs[0].sourceUrl, 'https://paskerid.kemnaker.go.id/miniJobi/100');
  assert.equal(jobs[0].applyUrl, 'https://paskerid.kemnaker.go.id/register?job=100');
  assert.equal(jobs[0].verifiedSource, true);
});

test('Pasker live reader checks linked listing pages and deduplicates current official vacancies', async () => {
  const { getLivePaskerJobs } = await import('../server/pasker-feed.mjs');
  const card = (id, title, deadline) => `<div class="col-lg-4 col-md-6"><div class="card"><h3>${title}</h3><div class="small text-muted mb-3">PT Contoh</div><span class="badge">KOTA BANDUNG</span><span class="badge">Full-time</span><span class="badge">Administrasi</span><p class="mb-3 text-secondary">Pekerjaan resmi.</p><div><strong>Batas Lamar:</strong> ${deadline}</div><a href="https://paskerid.kemnaker.go.id/miniJobi/${id}">Detail</a></div></div></div>`;
  const pages = new Map([
    ['https://paskerid.kemnaker.go.id/miniJobi', `<a href="http://paskerid.kemnaker.go.id/miniJobi?page=2">2</a>${card('10','Lowongan Lama','25 Apr 2026')}`],
    ['https://paskerid.kemnaker.go.id/miniJobi?page=2', card('20','Staf Administrasi','25 Des 2026') + card('20','Staf Administrasi','25 Des 2026')],
  ]);
  const calls = [];
  const result = await getLivePaskerJobs({ now: new Date('2026-10-19T00:00:00Z'), fetchImpl: async (url) => { calls.push(url); return { ok: pages.has(url), status: pages.has(url) ? 200 : 404, text: async () => pages.get(url) || '' }; } });
  assert.deepEqual(calls, ['https://paskerid.kemnaker.go.id/miniJobi','https://paskerid.kemnaker.go.id/miniJobi?page=2']);
  assert.equal(result.pagesChecked, 2);
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].title, 'Staf Administrasi');
});

test('feed import rejects missing location, stale dates, insecure URLs, and invalid salary ranges', async () => {
  const { normalizeFeedJob } = await import('../server/job-feed.mjs');
  const now = new Date('2026-10-19T00:00:00Z');
  const base = { externalId:'abc-1', title:'Warehouse Operator', company:'PT Contoh', sourceName:'Partner', province:'Jawa Barat', city:'Kab. Bekasi', postedAt:'2026-10-01', sourceUrl:'https://jobs.example/roles/abc-1', applyUrl:'https://jobs.example/apply/abc-1' };
  assert.equal(normalizeFeedJob(base, 'fallback', now)?.externalId, 'abc-1');
  assert.equal(normalizeFeedJob({...base, city:''}, 'fallback', now), null);
  assert.equal(normalizeFeedJob({...base, postedAt:'2026-01-01'}, 'fallback', now), null);
  assert.equal(normalizeFeedJob({...base, sourceUrl:'http://jobs.example/roles/abc-1', applyUrl:'http://jobs.example/apply/abc-1'}, 'fallback', now), null);
  assert.equal(normalizeFeedJob({...base, salaryMinJt:10, salaryMaxJt:4}, 'fallback', now), null);
  assert.equal(normalizeFeedJob({...base, expiresAt:'2026-10-01'}, 'fallback', now), null);
});

test('official BKN announcements are dated, linked to the government domain, and distinguish recruitment from results', async () => {
  const { parseBknGovernmentJobs } = await import('../server/government-jobs.mjs');
  const html = `
    <article><header><h2><a href="https://www.bkn.go.id/pengumuman-seleksi-tenaga-jasa-pengemudi-tahun-2026/">Pengumuman Seleksi Tenaga Jasa Pengemudi Tahun 2026</a></h2></header>
      <ul><li class="meta-date"><span class="updated">09/09/2026</span></li></ul><div class="blog-entry-excerpt"><p>Badan Kepegawaian Negara membuka seleksi tenaga jasa pengemudi.</p></div></article>
    <article><header><h2><a href="https://www.bkn.go.id/pengumuman-hasil-seleksi-administrasi/">Pengumuman Hasil Seleksi Administrasi</a></h2></header>
      <ul><li class="meta-date"><span class="updated">17/09/2026</span></li></ul><div class="blog-entry-excerpt"><p>Hasil seleksi administrasi diumumkan.</p></div></article>
    <article><header><h2><a href="https://attacker.example/fake/">Lowongan CPNS Palsu</a></h2></header>
      <ul><li class="meta-date"><span class="updated">18/09/2026</span></li></ul></article>`;
  const rows = parseBknGovernmentJobs(html, new Date('2026-10-19T00:00:00Z'));
  assert.equal(rows.length, 2);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, 'selection_update');
  assert.equal(rows[1].status, 'official_notice');
  assert.ok(rows.every((row) => row.verifiedSource && row.sourceUrl.startsWith('https://www.bkn.go.id/')));
});
