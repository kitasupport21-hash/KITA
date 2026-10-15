import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Store,
  Zap,
  ChevronRight,
  Bell,
  Clock,
  Tag
} from 'lucide-react';
import type { JobListing, User } from '../../shared/types.js';

interface HomeScreenViewProps {
  currentUser: User | null;
  jobs: JobListing[];
  loading: boolean;
  onSelectJob: (job: JobListing) => void;
  onNavigateToSearch: (category?: string) => void;
  onNavigateToLocations: () => void;
  onNavigateToCompanies: () => void;
  onToggleBookmark: (jobId: string) => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onPostJob?: () => void;
}

/**
 * Determines if a job listing was posted within the last 24 hours
 */
const getNewJobPulseInfo = (job: JobListing): { isNew: boolean; timeText: string } => {
  const dateStr = job.publication_date || job.created_at;
  if (!dateStr) return { isNew: false, timeText: '' };

  const postTime = new Date(dateStr).getTime();
  if (isNaN(postTime)) return { isNew: false, timeText: '' };

  const now = Date.now();
  const diffMs = now - postTime;
  const hours = diffMs / (1000 * 60 * 60);

  // If posted within the last 24 hours (with tolerance for minor client-server skew)
  if (diffMs >= -3600000 && hours <= 24) {
    if (hours < 1) {
      return { isNew: true, timeText: 'Baru saja' };
    }
    const roundedHours = Math.max(1, Math.floor(hours));
    return { isNew: true, timeText: `${roundedHours} jam lalu` };
  }

  return { isNew: false, timeText: '' };
};

import { getJobSkillTags } from '../../lib/skillsHelper.js';
import { IndonesiaJobSources } from '../IndonesiaJobSources.js';
export { getJobSkillTags };

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  currentUser,
  jobs,
  loading,
  onSelectJob,
  onNavigateToSearch,
  onNavigateToLocations,
  onNavigateToCompanies,
  onToggleBookmark,
  onOpenNotifications,
  onOpenAuth,
  onPostJob
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatRupiah = (val?: number) => {
    if (!val) return 'Gaji Dirahasiakan';
    return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      try {
        const stored = localStorage.getItem('kita_recent_searches');
        const prev: string[] = stored ? JSON.parse(stored) : [];
        const filtered = prev.filter((item) => typeof item === 'string' && item.toLowerCase() !== query.toLowerCase());
        const updated = [query, ...filtered].slice(0, 5);
        localStorage.setItem('kita_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    onNavigateToSearch(query || undefined);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-6 transition-colors duration-200">
      {/* 1. Header Bar: Brand + Notifications + User Avatar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#8B0026] text-white flex items-center justify-center font-black text-sm shadow-xs">
            KI
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                KITA
              </span>
              <button
                type="button"
                onClick={onNavigateToLocations}
                className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-[#8B0026] dark:text-red-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Buka Pusat Lowongan di Seluruh Indonesia"
              >
                <span>Indonesia</span>
                <ChevronRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Kerja · Freelance · UMKM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center relative transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8B0026]" />
          </button>

          {currentUser ? (
            <div className="w-9 h-9 rounded-full bg-[#8B0026] text-white flex items-center justify-center font-bold text-xs ring-2 ring-red-100 dark:ring-red-950">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="py-1.5 px-3 rounded-full bg-[#8B0026] text-white text-xs font-bold shadow-xs hover:bg-red-800 transition-colors"
            >
              Masuk
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Field */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari posisi kerja, skill, atau instansi..."
            className="w-full pl-11 pr-20 py-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] shadow-2xs transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 py-1.5 px-3 bg-[#8B0026] hover:bg-red-800 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors"
          >
            Cari
          </button>
        </div>
      </form>

      {/* 3. Hero Banner with Indonesian Headline */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B0026] via-rose-950 to-red-950 text-white p-6 shadow-md border border-red-900/50">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold text-red-100">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Portal lowongan kerja Indonesia</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Peluang Kerja Untuk Masa Depan Yang Lebih Baik
          </h2>
          <p className="text-xs text-red-100/90 leading-relaxed font-normal max-w-sm">
            Jelajahi lowongan terbaru dari berbagai portal kerja Indonesia, dengan pilihan lokasi dari seluruh 38 provinsi.
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => onNavigateToSearch()}
              className="py-2.5 px-4 bg-white text-[#8B0026] hover:bg-red-50 text-xs font-black rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Cari Lowongan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (onPostJob) {
                  onPostJob();
                } else {
                  onNavigateToCompanies();
                }
              }}
              className="py-2.5 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
            >
              Pasang Iklan
            </button>
          </div>
        </div>
      </div>

      <IndonesiaJobSources compact />

      {/* 4. Three Main Category Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Kategori Utama
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Berdasarkan Tipe</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateToSearch('Pekerjaan')}
            className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-left transition-all hover:border-red-200 shadow-2xs group flex flex-col justify-between min-h-[96px]"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#8B0026] dark:group-hover:text-red-400">
                Pekerjaan
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Penuh / Paruh Waktu</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToSearch('Freelance')}
            className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-left transition-all hover:border-amber-200 shadow-2xs group flex flex-col justify-between min-h-[96px]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                Freelance
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Proyek & Lepas</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToCompanies()}
            className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-left transition-all hover:border-emerald-200 shadow-2xs group flex flex-col justify-between min-h-[96px]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                UMKM
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">NIB Terverifikasi</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Indonesian Regions Quick Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div
          onClick={onNavigateToLocations}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                Pusat Lowongan di Indonesia
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Peta 38 provinsi dari Sabang sampai Merauke
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToLocations();
            }}
            className="text-xs font-extrabold text-[#8B0026] dark:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          >
            <span>Peta Indonesia</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Popular City Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-1">Kota Populer:</span>
          {[
            'Jakarta',
            'Surabaya',
            'Bandung',
            'Medan',
            'Bali',
            'Yogyakarta',
            'Semarang',
            'Makassar'
          ].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onNavigateToSearch(city)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700/80 transition-colors shrink-0 cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Recent Vacancies Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lowongan Terbaru & Populer
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Diperbarui secara berkala dari sumber ketenagakerjaan resmi
            </p>
          </div>
          <button
            onClick={() => onNavigateToSearch()}
            className="text-xs font-bold text-[#8B0026] dark:text-red-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Belum ada lowongan terdaftar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => {
              const { isNew, timeText } = getNewJobPulseInfo(job);
              const skillTags = getJobSkillTags(job);

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden ${
                    isNew
                      ? 'bg-gradient-to-br from-emerald-50/25 via-white to-white dark:from-emerald-950/15 dark:via-slate-900 dark:to-slate-900 border-emerald-300/80 dark:border-emerald-800/80 ring-1 ring-emerald-400/25 dark:ring-emerald-500/20 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Subtle top ambient pulse glow strip for new listings */}
                  {isNew && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-pulse pointer-events-none"
                      aria-hidden="true"
                    />
                  )}

                  {/* Subtle 'New Job' pulse badge for listings posted within last 24 hours */}
                  {isNew && (
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/80 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Lowongan Baru</span>
                        <span className="text-[9px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                          &bull; {timeText}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Diunggah &lt;24 Jam</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={
                          job.employer_logo ||
                          'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={job.employer_name || 'Perusahaan'}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#8B0026] dark:group-hover:text-red-400 transition-colors truncate">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                            {job.employer_name || 'Mitra KITA'}
                          </span>
                          {(job.is_verified_employer || job.company_verified_status !== 'pending_verification') && (
                            <span title="Terverifikasi">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(job.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400 rounded-lg transition-colors"
                      title="Simpan Lowongan"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${job.is_saved ? 'fill-[#8B0026] text-[#8B0026] dark:fill-red-400 dark:text-red-400' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Interactive Clickable Skill Tags */}
                  {skillTags.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      {skillTags.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToSearch(skill);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/60 border border-slate-200/90 hover:border-red-300 dark:border-slate-700/80 dark:hover:border-red-800 text-slate-700 hover:text-[#8B0026] dark:text-slate-300 dark:hover:text-red-300 text-[10px] font-bold transition-all cursor-pointer shadow-2xs group/tag active:scale-95"
                          title={`Cari semua lowongan dengan keahlian "${skill}"`}
                          aria-label={`Filter lowongan berdasarkan skill ${skill}`}
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400 group-hover/tag:text-[#8B0026] dark:group-hover/tag:text-red-400 transition-colors" />
                          <span>{skill}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.city || 'Indonesia'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {job.job_type === 'fulltime' ? 'Penuh Waktu' : job.job_type === 'freelance' ? 'Freelance' : job.job_type}
                      </span>
                      {isNew && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Clock className="w-3 h-3 text-emerald-500 animate-pulse shrink-0" />
                          <span>{timeText}</span>
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-[#8B0026] dark:text-red-400 text-xs">
                      {(!job.min_salary && !job.max_salary) || (job.min_salary <= 0 && job.max_salary <= 0)
                        ? 'Kompetitif'
                        : formatRupiah(job.min_salary)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
