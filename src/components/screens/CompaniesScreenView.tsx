import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../../lib/api.js';

interface CompaniesScreenViewProps {
  onSelectCompanyJobs: (companyName: string) => void;
}

const SECTOR_CHIPS = [
  'Semua',
  'BUMN & Korporat',
  'UMKM Binaan NIB',
  'Teknologi & IT',
  'Perbankan & Keuangan',
  'Logistik & Rantai Pasok',
  'Desain & Industri Kreatif'
];

export const CompaniesScreenView: React.FC<CompaniesScreenViewProps> = ({
  onSelectCompanyJobs
}) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState('Semua');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await api.getCompanies({
          search: search || undefined,
          industry: activeSector !== 'Semua' && activeSector !== 'BUMN & Korporat' && activeSector !== 'UMKM Binaan NIB' ? activeSector : undefined
        });
        if (res.success) {
          setCompanies(res.data);
        }
      } catch (err) {
        console.warn('Gagal memuat profil perusahaan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [search, activeSector]);

  const filteredCompanies = companies.filter((c) => {
    if (activeSector === 'BUMN & Korporat') {
      return c.company_name.includes('PT Bank Mandiri') || c.company_name.includes('Pelabuhan Indonesia') || c.company_name.includes('Pupuk') || c.company_name.includes('Telkomsel');
    }
    if (activeSector === 'UMKM Binaan NIB') {
      return c.verification_status === 'verified_nib' || c.company_name.includes('Kreasi Tenun') || c.company_name.includes('Kopi Gayo');
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-6 transition-colors duration-200">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
          Direktori Perusahaan & UMKM
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Temukan mitra pemberi kerja berbadan hukum sah & terverifikasi NIB / Kemnaker
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama perusahaan, BUMN, atau UMKM..."
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sector filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {SECTOR_CHIPS.map((chip) => {
          const isActive = activeSector === chip;
          return (
            <button
              key={chip}
              onClick={() => setActiveSector(chip)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#8B0026] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Company Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Tidak ada perusahaan yang sesuai pencarian.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              onClick={() => setSelectedCompany(comp)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-[#8B0026]/40 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={
                      comp.logo_url ||
                      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={comp.company_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {comp.company_name}
                      </h4>
                      {(comp.is_verified || ['verified_kemnaker', 'verified_nib', 'verified_corporate_domain'].includes(comp.verification_status)) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-label="Perusahaan terverifikasi" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {comp.industry}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-300 border border-red-100 dark:border-red-900 shrink-0">
                  {Number.isFinite(Number(comp.open_jobs_count)) && comp.open_jobs_count !== null && comp.open_jobs_count !== undefined ? Number(comp.open_jobs_count) + ' Lowongan' : 'Profil Perusahaan'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{comp.city}, {comp.province || 'Indonesia'}</span>
                </span>
                <span className="text-[#8B0026] dark:text-red-400 font-bold flex items-center gap-1">
                  <span>Lihat Profil</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Profil Perusahaan</h3>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={selectedCompany.logo_url}
                alt={selectedCompany.company_name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedCompany.company_name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{selectedCompany.is_verified || ['verified_kemnaker', 'verified_nib', 'verified_corporate_domain'].includes(selectedCompany.verification_status) ? 'Terverifikasi' : 'Status verifikasi belum dikonfirmasi'}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedCompany.description ||
                'Perusahaan berbadan hukum sah yang tergabung dalam ekosistem kemitraan KITA untuk penyaluran tenaga kerja resmi.'}
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Industri:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCompany.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ukuran Usaha:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCompany.company_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alamat:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCompany.address || selectedCompany.city}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const compName = selectedCompany.company_name;
                setSelectedCompany(null);
                onSelectCompanyJobs(compName);
              }}
              className="w-full py-3 bg-[#8B0026] hover:bg-red-800 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{Number.isFinite(Number(selectedCompany.open_jobs_count)) && selectedCompany.open_jobs_count !== null && selectedCompany.open_jobs_count !== undefined ? 'Lihat Lowongan (' + Number(selectedCompany.open_jobs_count) + ')' : 'Lihat Lowongan'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
