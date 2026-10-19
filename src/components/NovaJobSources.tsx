import React, { useMemo, useState } from 'react';
import provinceData from '../data/indonesia-provinces.json';
import { displayProvinceName, INDONESIAN_REGENCIES } from '../lib/indonesiaRegions';

type Props = { keyword?: string; province?: string };
type Province = { id: string; name: string };
type Regency = { id: string; provinceId: string; name: string };
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
    { name: 'Pasker ID / Karirhub', detail: 'Portal resmi Kementerian Ketenagakerjaan', url: `https://www.google.com/search?q=${encodeURIComponent(`site:paskerid.kemnaker.go.id ${q} ${where} lowongan kerja`)}` },
    { name: 'HiredToday', detail: 'Portal yang terintegrasi dengan Karirhub', url: `https://www.google.com/search?q=${encodeURIComponent(`site:hiredtoday.com ${q} ${where} jobs`)}` },
    { name: 'Toploker', detail: 'Pencarian lowongan Indonesia', url: `https://www.google.com/search?q=${encodeURIComponent(`site:toploker.com ${q} ${where} lowongan kerja`)}` },
    { name: 'Redy', detail: 'Pencarian peluang kerja lokal', url: `https://www.getredy.id/lowongan?search=${encodeURIComponent(`${q} ${where}`)}` },
    { name: 'Glints', detail: 'Pekerjaan profesional dan awal karier', url: `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(q)}&location=${encodeURIComponent(where)}` },
    { name: 'Jobstreet Indonesia', detail: 'Peluang lintas industri', url: `https://id.jobstreet.com/id/jobs?keywords=${encodeURIComponent(q)}&where=${encodeURIComponent(where)}` },
    { name: 'LinkedIn Jobs', detail: 'Profesional, remote, dan magang', url: `https://id.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(where)}` },
    { name: 'Indeed Indonesia', detail: 'Pencarian pekerjaan dan kata kunci', url: `https://id.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(where)}` },
  ];
}

export default function NovaJobSources({ keyword = '', province = 'All Indonesia' }: Props) {
  const [selectedProvince, setSelectedProvince] = useState(() => PROVINCES.find((item) => displayProvinceName(item.name).toLowerCase() === province.toLowerCase())?.id || '');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [customKeyword, setCustomKeyword] = useState(keyword);
  const availableRegencies = useMemo(() => REGENCIES
    .filter((item) => !selectedProvince || item.provinceId === selectedProvince)
    .slice().sort((a, b) => a.name.localeCompare(b.name, 'id')), [selectedProvince]);
  const effectiveKeyword = selectedRole || customKeyword.trim() || keyword.trim() || 'lowongan kerja';
  const regency = REGENCIES.find((item) => item.id === selectedRegency);
  const provinceName = PROVINCES.find((item) => item.id === selectedProvince)?.name;
  const effectiveLocation = regency?.name || (selectedProvince ? provinceName || 'Indonesia' : 'Indonesia');
  const sources = useMemo(() => buildSources(effectiveKeyword, effectiveLocation), [effectiveKeyword, effectiveLocation]);

  return <section className="source-panel" aria-label="External Indonesian job portals">
    <div className="source-heading"><div><span className="eyebrow">REGIONAL JOB SEARCH</span><h3>Find opportunities by kabupaten / kota</h3></div><span className="source-live-label">External source search</span></div>
    <p className="source-note">Pilih provinsi dan kabupaten/kota agar setiap pencarian lebih relevan. NOVA membuka hasil pencarian terbaru dari portal kerja; lowongan eksternal belum dianggap sebagai listing terverifikasi di database NOVA. Periksa tanggal, perusahaan, lokasi, dan tautan lamaran sebelum melamar.</p>

    <div className="source-filters">
      <label>Provinsi<select value={selectedProvince} onChange={(event) => { setSelectedProvince(event.target.value); setSelectedRegency(''); }}><option value="">Seluruh Indonesia</option>{PROVINCES.slice().sort((a,b)=>a.name.localeCompare(b.name,'id')).map((item)=><option key={item.id} value={item.id}>{displayProvinceName(item.name)}</option>)}</select></label>
      <label>Kabupaten / Kota<select value={selectedRegency} onChange={(event) => setSelectedRegency(event.target.value)}><option value="">Semua kabupaten/kota</option>{availableRegencies.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Posisi atau keterampilan<input value={customKeyword} onChange={(event) => { setCustomKeyword(event.target.value); setSelectedRole(''); }} placeholder="Contoh: kasir, operator, data analyst" /></label>
    </div>

    <div className="future-role-heading"><b>Bidang karier masa depan</b><span>Choose a role family</span></div>
    <div className="future-role-chips">{FUTURE_ROLES.map((role)=><button type="button" key={role.label} className={selectedRole===role.query?'future-role-chip active':'future-role-chip'} onClick={()=>{if(selectedRole===role.query){setSelectedRole('');setCustomKeyword(keyword);}else{setSelectedRole(role.query);setCustomKeyword(role.query);}}}>{role.label}</button>)}</div>

    <div className="source-results-heading"><b>{effectiveKeyword}</b><span>{effectiveLocation}</span></div>
    <div className="source-grid">{sources.map((source)=><a className="source-card" key={source.name} href={source.url} target="_blank" rel="noopener noreferrer"><span className="source-link-icon">↗</span><span><strong>{source.name}</strong><small>{source.detail}</small></span><span className="source-arrow">↗</span></a>)}</div>
    <p className="source-attribution">Wilayah kabupaten/kota: dataset administrasi Indonesia 2026 dari <a href="https://github.com/izzulabadi/api-wilayah-indonesia-2026" target="_blank" rel="noopener noreferrer">api-wilayah-indonesia-2026</a>. NOVA does not scrape restricted job boards or invent vacancies.</p>
  </section>;
}
