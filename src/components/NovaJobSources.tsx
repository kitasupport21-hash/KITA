import React, { useEffect, useMemo, useState } from 'react';
import provinceData from '../data/indonesia-provinces.json';
import { displayProvinceName, INDONESIAN_REGENCIES } from '../lib/indonesiaRegions';

type Props = { keyword?: string; province?: string };
type Province = { id: string; name: string };
type Regency = { id: string; provinceId: string; name: string };
type OfficialJob = { id: string; title: string; company: string; city: string; workMode: string; category: string; description: string; salaryText: string; sourceUrl: string; applyUrl: string; deadline: string; verifiedSource: boolean };
type OfficialFeed = { jobs: OfficialJob[]; sourceUrl: string; checkedAt: string; notice: string; live: boolean };
type GovernmentNotice = { id: string; title: string; agency: string; category: 'recruitment' | 'announcement'; summary: string; sourceName: string; sourceUrl: string; applyUrl: string; postedAt: string; verifiedSource: boolean; applicationStatus: string };
type GovernmentFeed = { announcements: GovernmentNotice[]; sourceUrl: string; checkedAt: string; notice: string; live: boolean; officialPortal: string };
const PROVINCES = provinceData as Province[];
const REGENCIES = INDONESIAN_REGENCIES as Regency[];

const FUTURE_ROLES = [
  { label: 'AI & Data', query: 'AI data analyst machine learning' },
  { label: 'Software & Cybersecurity', query: 'software developer cybersecurity cloud' },
  { label: 'Green Energy & EV', query: 'renewable energy electric vehicle battery' },
  { label: 'Healthcare', query: 'healthcare nurse medical laboratory' },
  { label: 'Logistics & Supply Chain', query: 'logistics supply chain warehouse' },
  { label: 'Digital Business', query: 'digital marketing ecommerce product' },
  { label: 'Manufacturing & Skilled Trades', query: 'technician manufacturing maintenance' },
  { label: 'Agriculture & Food', query: 'agritech food processing agriculture' },
];

function buildSources(keyword: string, location: string) {
  const q = keyword.trim() || 'lowongan kerja';
  const where = location === 'Indonesia' ? 'Indonesia' : `${location}, Indonesia`;
  return [
    { name: 'Pasker ID / Karirhub', detail: 'Portal resmi Kementerian Ketenagakerjaan', url: `https://paskerid.kemnaker.go.id/miniJobi?search=${encodeURIComponent(`${q} ${location === 'Indonesia' ? '' : location}`.trim())}` },
    { name: 'HiredToday', detail: 'Portal yang terintegrasi dengan Karirhub', url: `https://www.google.com/search?q=${encodeURIComponent(`site:hiredtoday.com ${q} ${where} jobs`)}&tbs=qdr:m` },
    { name: 'Toploker', detail: 'Pencarian lowongan Indonesia', url: `https://www.google.com/search?q=${encodeURIComponent(`site:toploker.com ${q} ${where} lowongan kerja`)}&tbs=qdr:m` },
    { name: 'Redy', detail: 'Pencarian peluang kerja lokal', url: `https://www.getredy.id/lowongan?search=${encodeURIComponent(`${q} ${where}`)}` },
    { name: 'Glints', detail: 'Pekerjaan profesional dan awal karier', url: `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(q)}&location=${encodeURIComponent(where)}&sortBy=LATEST` },
    { name: 'Jobstreet Indonesia', detail: 'Peluang lintas industri', url: `https://id.jobstreet.com/id/jobs?keywords=${encodeURIComponent(q)}&where=${encodeURIComponent(where)}&sortmode=ListedDate` },
    { name: 'LinkedIn Jobs', detail: 'Profesional, remote, dan magang', url: `https://id.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(where)}&sortBy=DD` },
    { name: 'Indeed Indonesia', detail: 'Pencarian pekerjaan dan kata kunci', url: `https://id.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(where)}&sort=date` },
  ];
}

export default function NovaJobSources({ keyword = '', province = 'All Indonesia' }: Props) {
  const [selectedProvince, setSelectedProvince] = useState(() => PROVINCES.find((item) => displayProvinceName(item.name).toLowerCase() === province.toLowerCase())?.id || '');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [customKeyword, setCustomKeyword] = useState(keyword);
  const [officialFeed, setOfficialFeed] = useState<OfficialFeed | null>(null);
  const [officialLoading, setOfficialLoading] = useState(true);
  const [officialError, setOfficialError] = useState('');
  const [governmentFeed, setGovernmentFeed] = useState<GovernmentFeed | null>(null);
  const [governmentLoading, setGovernmentLoading] = useState(true);
  const [governmentError, setGovernmentError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/jobs/pasker', { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.notice || data.error || 'Official source unavailable'); return data as OfficialFeed; })
      .then((data) => { if (!cancelled) { setOfficialFeed(data); setOfficialError(''); } })
      .catch((error: unknown) => { if (!cancelled) setOfficialError(error instanceof Error ? error.message : 'Official source unavailable'); })
      .finally(() => { if (!cancelled) setOfficialLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/government-jobs', { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.notice || data.error || 'Government announcements unavailable'); return data as GovernmentFeed; })
      .then((data) => { if (!cancelled) { setGovernmentFeed(data); setGovernmentError(''); } })
      .catch((error: unknown) => { if (!cancelled) setGovernmentError(error instanceof Error ? error.message : 'Government announcements unavailable'); })
      .finally(() => { if (!cancelled) setGovernmentLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);
  const availableRegencies = useMemo(() => REGENCIES
    .filter((item) => !selectedProvince || item.provinceId === selectedProvince)
    .slice().sort((a, b) => a.name.localeCompare(b.name, 'id')), [selectedProvince]);
  const effectiveKeyword = selectedRole || customKeyword.trim() || keyword.trim() || 'lowongan kerja';
  const regency = REGENCIES.find((item) => item.id === selectedRegency);
  const provinceName = PROVINCES.find((item) => item.id === selectedProvince)?.name;
  const effectiveLocation = regency ? `${regency.name}, ${provinceName || 'Indonesia'}` : (selectedProvince ? provinceName || 'Indonesia' : 'Indonesia');
  const sources = useMemo(() => buildSources(effectiveKeyword, effectiveLocation), [effectiveKeyword, effectiveLocation]);

  return <section className="source-panel" aria-label="External Indonesian job portals">
    <div className="source-heading"><div><span className="eyebrow">REGIONAL JOB SEARCH</span><h3>Find opportunities by kabupaten / kota</h3></div><button type="button" className="source-live-label source-refresh-button" disabled={officialLoading || governmentLoading} onClick={() => { setOfficialLoading(true); setGovernmentLoading(true); setOfficialError(''); setGovernmentError(''); setRefreshKey((value) => value + 1); }}>{officialLoading || governmentLoading ? 'Memeriksa…' : '↻ Perbarui lowongan'}</button></div>
    <p className="source-note">Pilih provinsi dan kabupaten/kota agar setiap pencarian lebih relevan. NOVA membuka hasil pencarian terbaru dari portal kerja; lowongan eksternal belum dianggap sebagai listing terverifikasi di database NOVA. Periksa tanggal, perusahaan, lokasi, dan tautan lamaran sebelum melamar.</p>

    <div className="source-filters">
      <label>Provinsi<select value={selectedProvince} onChange={(event) => { setSelectedProvince(event.target.value); setSelectedRegency(''); }}><option value="">Seluruh Indonesia</option>{PROVINCES.slice().sort((a,b)=>a.name.localeCompare(b.name,'id')).map((item)=><option key={item.id} value={item.id}>{displayProvinceName(item.name)}</option>)}</select></label>
      <label>Kabupaten / Kota<select value={selectedRegency} onChange={(event) => setSelectedRegency(event.target.value)}><option value="">Semua kabupaten/kota</option>{availableRegencies.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Posisi atau keterampilan<input value={customKeyword} onChange={(event) => { setCustomKeyword(event.target.value); setSelectedRole(''); }} placeholder="Contoh: kasir, operator, data analyst" /></label>
    </div>

    <div className="official-jobs-panel">
      <div className="source-heading"><div><span className="eyebrow">OFFICIAL LIVE SOURCE</span><h3>Lowongan resmi Pasker ID</h3></div><a className="source-live-label source-live-link" href="https://paskerid.kemnaker.go.id/miniJobi" target="_blank" rel="noopener noreferrer">Open official portal ↗</a></div>
      <p className="source-note">NOVA checks the public miniJobi page from Indonesia’s Ministry of Manpower. Listings past their application deadline are excluded; applications remain on the official portal.</p>
      {officialLoading ? <p className="official-feed-status">Memeriksa lowongan resmi terbaru…</p> : officialError ? <p className="official-feed-status">{officialError}. <a href="https://paskerid.kemnaker.go.id/miniJobi" target="_blank" rel="noopener noreferrer">Periksa Pasker ID langsung.</a></p> : officialFeed?.jobs.length ? <div className="official-job-list">{officialFeed.jobs.map((job) => <article className="official-job-card" key={job.id}><div><strong>{job.title}</strong><span>{job.company} · {job.city || 'Lokasi lihat detail'}</span><small>{job.workMode}{job.category ? ` · ${job.category}` : ''}{job.salaryText ? ` · ${job.salaryText}` : ''}</small><small>Batas lamaran: {new Date(job.deadline).toLocaleDateString('id-ID')}</small></div><div className="official-job-actions"><a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">Detail</a><a href={job.applyUrl} target="_blank" rel="noopener noreferrer">Lamar ↗</a></div></article>)}</div> : <div className="official-feed-status">{officialFeed?.notice || 'Belum ada lowongan aktif yang lolos pemeriksaan tanggal.'} <a href="https://paskerid.kemnaker.go.id/miniJobi" target="_blank" rel="noopener noreferrer">Lihat halaman resmi ↗</a></div>}
      {!officialLoading && officialFeed?.checkedAt && <p className="official-feed-updated">Last checked: {new Date(officialFeed.checkedAt).toLocaleString('id-ID')} · Source: <a href={officialFeed.sourceUrl} target="_blank" rel="noopener noreferrer">paskerid.kemnaker.go.id</a></p>}
    </div>

    <div className="government-jobs-panel">
      <div className="source-heading"><div><span className="eyebrow">PEMERINTAH · SUMBER RESMI</span><h3>Pengumuman rekrutmen pemerintah Indonesia</h3></div><a className="source-live-label source-live-link" href="https://www.bkn.go.id/category/publikasi/pengumuman/" target="_blank" rel="noopener noreferrer">BKN RI ↗</a></div>
      <p className="source-note">Feed ini memantau arsip pengumuman BKN dan Kementerian Kesehatan, lalu menautkan portal SSCASN serta Pasker Kemnaker. Ini adalah sumber pemerintah terverifikasi yang tersedia saat ini, bukan klaim bahwa setiap pemerintah daerah/kementerian sudah terintegrasi. NOVA membedakan rekrutmen dari hasil seleksi; periksa tenggat dan persyaratan di dokumen resmi.</p>
      <div className="government-portals"><a href="https://www.kemkes.go.id/id/pengumuman-all" target="_blank" rel="noopener noreferrer"><strong>Pengumuman Kemenkes</strong><small>Rekrutmen kesehatan dan hasil seleksi</small></a><a href="https://www.bkn.go.id/category/publikasi/pengumuman/" target="_blank" rel="noopener noreferrer"><strong>Pengumuman BKN</strong><small>Seleksi, hasil, dan informasi ASN</small></a><a href="https://sscasn.bkn.go.id/" target="_blank" rel="noopener noreferrer"><strong>Portal SSCASN</strong><small>Portal resmi seleksi ASN</small></a><a href="https://paskerid.kemnaker.go.id/miniJobi" target="_blank" rel="noopener noreferrer"><strong>Lowongan Pasker ID</strong><small>Lowongan umum dari Kemnaker</small></a></div>
      {governmentLoading ? <p className="official-feed-status">Memeriksa pengumuman pemerintah terbaru…</p> : governmentError ? <p className="official-feed-status">{governmentError} <a href="https://www.bkn.go.id/category/publikasi/pengumuman/" target="_blank" rel="noopener noreferrer">Buka arsip BKN.</a></p> : governmentFeed?.announcements.length ? <div className="official-job-list">{governmentFeed.announcements.map((item) => <article className="government-notice-card" key={item.id}><div className="government-notice-meta"><span className={item.category === 'recruitment' ? 'government-status recruitment' : 'government-status'}>{item.category === 'recruitment' ? 'Rekrutmen resmi · cek tenggat' : 'Pengumuman resmi / hasil seleksi'}</span><small>{new Date(item.postedAt).toLocaleDateString('id-ID')}</small></div><strong>{item.title}</strong><span>{item.agency}</span>{item.summary && <p>{item.summary}</p>}<small>{item.applicationStatus}</small><div className="official-job-actions"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Baca pengumuman ↗</a>{item.category === 'recruitment' && <a href={item.applyUrl} target="_blank" rel="noopener noreferrer">Syarat & detail ↗</a>}</div></article>)}</div> : <p className="official-feed-status">{governmentFeed?.notice || 'Belum ada pengumuman baru yang ditemukan.'}</p>}
      {!governmentLoading && governmentFeed?.checkedAt && <p className="official-feed-updated">Last checked: {new Date(governmentFeed.checkedAt).toLocaleString('id-ID')} · <a href={governmentFeed.sourceUrl} target="_blank" rel="noopener noreferrer">Sumber BKN</a></p>}
    </div>

    <div className="future-role-heading"><b>Bidang karier masa depan</b><span>Choose a role family</span></div>
    <div className="future-role-chips">{FUTURE_ROLES.map((role)=><button type="button" key={role.label} className={selectedRole===role.query?'future-role-chip active':'future-role-chip'} onClick={()=>{if(selectedRole===role.query){setSelectedRole('');setCustomKeyword(keyword);}else{setSelectedRole(role.query);setCustomKeyword(role.query);}}}>{role.label}</button>)}</div>

    <div className="source-results-heading"><b>{effectiveKeyword}</b><span>{effectiveLocation}</span></div>
    <div className="source-grid">{sources.map((source)=><a className="source-card" key={source.name} href={source.url} target="_blank" rel="noopener noreferrer"><span className="source-link-icon">↗</span><span><strong>{source.name}</strong><small>{source.detail}</small></span><span className="source-arrow">↗</span></a>)}</div>
    <p className="source-attribution">Wilayah kabupaten/kota: dataset administrasi Indonesia 2026 dari <a href="https://github.com/izzulabadi/api-wilayah-indonesia-2026" target="_blank" rel="noopener noreferrer">api-wilayah-indonesia-2026</a>. NOVA does not scrape restricted job boards or invent vacancies.</p>
  </section>;
}
