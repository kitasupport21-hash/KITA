import React, { useMemo, useState } from 'react';
import { ExternalLink, MapPin, Search, ShieldCheck, RefreshCw } from 'lucide-react';

const PROVINCES = [
  'Seluruh Indonesia','Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau','Jambi','Sumatera Selatan',
  'Kepulauan Bangka Belitung','Bengkulu','Lampung','DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Banten',
  'Bali','Nusa Tenggara Barat','Nusa Tenggara Timur','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur',
  'Kalimantan Utara','Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara',
  'Maluku','Maluku Utara','Papua','Papua Barat','Papua Selatan','Papua Tengah','Papua Pegunungan','Papua Barat Daya'
];

const SOURCES = [
  { name: 'Karirhub / Pasker ID', kind: 'Portal pemerintah Indonesia', url: 'https://paskerid.kemnaker.go.id/', color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', national: true },
  { name: 'Jobstreet Indonesia', kind: 'Lowongan berbagai bidang', url: 'https://id.jobstreet.com/id/', color: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
  { name: 'LinkedIn Jobs', kind: 'Profesional & magang', url: 'https://id.linkedin.com/jobs/', color: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' },
  { name: 'Indeed Indonesia', kind: 'Pencarian lintas perusahaan', url: 'https://id.indeed.com/', color: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' },
  { name: 'Glints', kind: 'Karier & magang', url: 'https://glints.com/id', color: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300' },
  { name: 'KitaLulus', kind: 'Lowongan lokal Indonesia', url: 'https://www.kitalulus.com/', color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  { name: 'Kalibrr', kind: 'Peluang profesional', url: 'https://www.kalibrr.com/', color: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
  { name: 'HiredToday', kind: 'Mitra Pasker ID', url: 'https://www.hiredtoday.com/', color: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' }
];

function makeSearchUrl(name: string, baseUrl: string, keyword: string, province: string) {
  const q = keyword.trim() || 'lowongan kerja';
  const location = province === 'Seluruh Indonesia' ? 'Indonesia' : `${province}, Indonesia`;
  if (name === 'Karirhub / Pasker ID') return `https://www.google.com/search?q=${encodeURIComponent(`site:paskerid.kemnaker.go.id ${q} ${location} lowongan kerja`)}`;
  if (name === 'Indeed Indonesia') return `https://id.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(location)}`;
  if (name === 'LinkedIn Jobs') return `https://id.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`;
  if (name === 'Jobstreet Indonesia') return `https://id.jobstreet.com/id/jobs?keywords=${encodeURIComponent(q)}&where=${encodeURIComponent(location)}`;
  if (name === 'Glints') return `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`;
  // Use a domain-scoped search when a stable public search URL is not configured.
  if (name === 'KitaLulus') return `https://www.google.com/search?q=${encodeURIComponent(`site:kitalulus.com ${q} ${location} lowongan kerja`)}`;
  if (name === 'Kalibrr') return `https://www.google.com/search?q=${encodeURIComponent(`site:kalibrr.com ${q} ${location} jobs Indonesia`)}`;
  if (name === 'HiredToday') return `https://www.google.com/search?q=${encodeURIComponent(`site:hiredtoday.com ${q} ${location} lowongan kerja`)}`;
  return baseUrl;
}

export const IndonesiaJobSources: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [keyword, setKeyword] = useState('');
  const [province, setProvince] = useState('Seluruh Indonesia');
  const links = useMemo(() => SOURCES.map(source => ({ ...source, searchUrl: makeSearchUrl(source.name, source.url, keyword, province) })), [keyword, province]);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Sumber lowongan kerja Indonesia">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B0026]/10 text-[#8B0026] dark:text-red-300"><ShieldCheck className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Lowongan terbaru dari portal Indonesia</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Pilih lokasi dan kata kunci untuk membuka hasil pencarian portal. Untuk portal tanpa URL pencarian publik yang stabil, KITA membuka pencarian web yang dibatasi ke domain portal tersebut. Status lowongan ditentukan oleh sumbernya.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Contoh: admin, kasir, programmer" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#8B0026] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="relative block">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select value={province} onChange={e => setProvince(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#8B0026] dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <div className={`grid grid-cols-1 gap-2 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {links.map(source => (
          <a key={source.name} href={source.searchUrl} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-[#8B0026]/40 hover:shadow-sm dark:border-slate-800 dark:hover:border-red-800">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${source.color}`}><ExternalLink className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">{source.name}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{source.kind}</span></span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-[#8B0026]" />
          </a>
        ))}
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"><RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />Untuk menjaga keakuratan, KITA tidak mengarang lowongan atau mengklaim semua iklan masih aktif. Periksa tanggal, perusahaan, dan syarat lamaran pada portal sumber sebelum melamar.</p>
    </section>
  );
};
