import React from 'react';

type Props = { keyword?: string; province?: string };

const SOURCES = [
  { name: 'Pasker ID / Karirhub', detail: 'Portal pekerjaan pemerintah Indonesia', url: (q: string, p: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:paskerid.kemnaker.go.id ${q} ${p} lowongan kerja`)}` },
  { name: 'Jobstreet Indonesia', detail: 'Lowongan lintas industri', url: (q: string, p: string) => `https://id.jobstreet.com/id/jobs?keywords=${encodeURIComponent(q)}&where=${encodeURIComponent(p)}` },
  { name: 'LinkedIn Jobs', detail: 'Profesional, remote, dan magang', url: (q: string, p: string) => `https://id.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(p)}` },
  { name: 'Indeed Indonesia', detail: 'Pencarian lowongan kerja', url: (q: string, p: string) => `https://id.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(p)}` },
  { name: 'Glints', detail: 'Karier dan peluang awal', url: (q: string, p: string) => `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(q)}&location=${encodeURIComponent(p)}` },
  { name: 'KitaLulus', detail: 'Peluang lokal Indonesia', url: (q: string, p: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:kitalulus.com ${q} ${p} lowongan kerja`)}` },
  { name: 'Kalibrr', detail: 'Peluang profesional', url: (q: string, p: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:kalibrr.com ${q} ${p} jobs`)}` },
  { name: 'HiredToday', detail: 'Mitra pencarian kerja Indonesia', url: (q: string, p: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:hiredtoday.com ${q} ${p} lowongan kerja`)}` },
];

export default function NovaJobSources({ keyword = '', province = 'Indonesia' }: Props) {
  const q = keyword.trim() || 'lowongan kerja';
  const location = province === 'All Indonesia' || province === 'Seluruh Indonesia' ? 'Indonesia' : `${province}, Indonesia`;
  return <section className="source-panel" aria-label="External Indonesian job portals">
    <div className="source-heading"><div><span className="eyebrow">EXTERNAL JOB PORTALS</span><h3>Explore jobs across Indonesia</h3></div><span className="source-live-label">Official source links</span></div>
    <p className="source-note">NOVA has no authorized live job feed connected yet. These links open search results on each provider; they are not imported NOVA listings. Check the posting date, employer, and application URL on the source before applying.</p>
    <div className="source-grid">{SOURCES.map(source => <a className="source-card" key={source.name} href={source.url(q, location)} target="_blank" rel="noopener noreferrer"><span className="source-link-icon">↗</span><span><strong>{source.name}</strong><small>{source.detail}</small></span><span className="source-arrow">↗</span></a>)}</div>
  </section>;
}
