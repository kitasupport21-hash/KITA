import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  MapPin,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Flag,
  Check
} from 'lucide-react';
import type { JobListing, User } from '../../shared/types.js';
import { api } from '../../lib/api.js';

interface JobDetailScreenViewProps {
  job: JobListing;
  currentUser: User | null;
  onNavigateBack: () => void;
  onApplyNow: () => void;
  onToggleBookmark: (jobId: string) => void;
  onNavigateToCompany?: (companyName: string) => void;
}

export const JobDetailScreenView: React.FC<JobDetailScreenViewProps> = ({
  job,
  currentUser,
  onNavigateBack,
  onApplyNow,
  onToggleBookmark,
  onNavigateToCompany
}) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'reqs' | 'company'>('desc');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Pungutan liar / Biaya rekrutmen tidak wajar');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportErrorMessage(null);
    try {
      await api.reportJob(job.id, {
        reason: reportReason,
        details: reportDetails,
        email: currentUser?.email
      });
      setReportSuccessMessage('Laporan Anda berhasil dikirim ke Pengawas KITA.');
      setTimeout(() => {
        setReportSuccessMessage(null);
        setReportModalOpen(false);
        setReportDetails('');
      }, 1800);
    } catch (error: any) {
      setReportErrorMessage(error?.message || 'Laporan belum berhasil dikirim. Silakan coba lagi.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatRupiah = (val?: number) => {
    if (!val) return 'Dirahasiakan';
    return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`;
  };

  const fallbackClipboardShare = (shareUrl: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          setShareFeedback('Tautan disalin!');
          setTimeout(() => setShareFeedback(null), 2500);
        })
        .catch(() => {
          setShareFeedback('Tautan siap dibagikan');
          setTimeout(() => setShareFeedback(null), 2500);
        });
    } else {
      setShareFeedback('Tautan siap dibagikan');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const handleShare = async () => {
    const salaryText =
      (!job.min_salary && !job.max_salary) || (job.min_salary <= 0 && job.max_salary <= 0)
        ? 'Gaji Kompetitif'
        : `${formatRupiah(job.min_salary)} - ${formatRupiah(job.max_salary)}`;

    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://kita.id';

    const shareData = {
      title: `${job.title} - ${job.employer_name || 'KITA'}`,
      text: `Lowongan Pekerjaan: ${job.title} di ${job.employer_name || 'Mitra KITA'} (${job.city || 'Indonesia'}). ${salaryText}. Lamar dan info lengkap di Bursa Kerja KITA:`,
      url: shareUrl
    };

    // Use native Web Share API to invoke system-level share sheet
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        setShareFeedback('Berhasil dibagikan!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (err: any) {
        // If user cancelled / dismissed the system share sheet (AbortError), no error prompt needed
        if (err && err.name !== 'AbortError') {
          fallbackClipboardShare(shareUrl);
        }
      }
    } else {
      // Graceful fallback for browsers without Web Share API
      fallbackClipboardShare(shareUrl);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden max-w-xl mx-auto pb-24 relative transition-colors duration-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-extrabold text-slate-800 dark:text-white">Detail Lowongan</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors relative"
            title="Bagikan Lowongan (Web Share)"
            aria-label="Bagikan Lowongan"
          >
            <Share2 className="w-4 h-4" />
            {shareFeedback && (
              <span className="absolute -bottom-8 right-0 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-lg border border-slate-700 whitespace-nowrap animate-in fade-in duration-150 z-30">
                {shareFeedback}
              </span>
            )}
          </button>
          <button
            onClick={() => onToggleBookmark(job.id)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Simpan"
            aria-label="Simpan Lowongan"
          >
            <Bookmark
              className={`w-4 h-4 ${job.is_saved ? 'fill-[#8B0026] text-[#8B0026] dark:fill-red-400 dark:text-red-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Crimson Gradient Header */}
      <div className="h-28 bg-gradient-to-r from-red-950 via-[#8B0026] to-red-900 relative" />

      {/* Floating Company Logo & Job Title */}
      <div className="px-5 -mt-10 relative z-10 space-y-4">
        <div className="flex items-end justify-between">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-md border border-slate-100 dark:border-slate-700 shrink-0">
            <img
              src={
                job.employer_logo ||
                'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=150&auto=format&fit=crop&q=80'
              }
              alt={job.employer_name || 'Perusahaan'}
              className="w-full h-full object-cover rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {job.company_verified_status === 'verified_kemnaker' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kemnaker Terverifikasi</span>
            </div>
          ) : job.company_verified_status === 'verified_nib' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>NIB Resmi Terverifikasi</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Portal Karir Resmi</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
            {job.title}
          </h1>
          <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToCompany?.(job.employer_name || '')}
                className="text-xs font-bold text-[#8B0026] dark:text-red-400 hover:underline flex items-center gap-1 text-left"
              >
                <span>{job.employer_name || 'Mitra Resmi KITA'}</span>
                {(job.is_verified_employer || job.company_verified_status !== 'pending_verification') && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </button>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{job.category}</span>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 transition-colors shadow-2xs cursor-pointer"
              title="Bagikan Lowongan via System Share Sheet"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
              <span>Bagikan</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Lokasi</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{job.city}, {job.province}</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Rentang Gaji</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {(!job.min_salary && !job.max_salary) || (job.min_salary <= 0 && job.max_salary <= 0)
                  ? 'Kompetitif'
                  : `${formatRupiah(job.min_salary)} - ${formatRupiah(job.max_salary)}`}
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Tipe Pekerjaan</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {job.job_type === 'fulltime' ? 'Penuh Waktu' : job.job_type === 'freelance' ? 'Freelance' : job.job_type}
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Sistem Kerja</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                {job.workplace_type === 'remote' ? 'Remote / WFH' : job.workplace_type === 'hybrid' ? 'Hybrid' : 'On-Site'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'desc'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Deskripsi
          </button>
          <button
            onClick={() => setActiveTab('reqs')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'reqs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Kualifikasi
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'company'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Perusahaan
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'desc' && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-2">
                  Tentang Pekerjaan Ini
                </h3>
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Fasilitas & Tunjangan</h4>
                  <ul className="space-y-1.5">
                    {job.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Anti-fraud banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Peringatan Keamanan Kemnaker</span>
                  <span>Platform KITA menjamin seluruh rekrutmen bebas dari segala bentuk pungutan biaya. Laporkan bila ada indikasi kecurangan.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reqs' && (
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-2">
                Persyaratan & Kualifikasi
              </h3>
              {job.requirements && job.requirements.length > 0 ? (
                <ul className="space-y-2">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B0026] dark:bg-red-400 shrink-0 mt-1.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Pendidikan minimal SMA/SMK atau sederajat, berkepribadian baik, dan berintegritas tinggi.</p>
              )}
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-[#8B0026] dark:text-red-400" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{job.employer_name || 'Mitra KITA'}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{job.employer_city || job.city}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Legalitas:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {job.company_verified_status === 'verified_kemnaker'
                        ? 'Kemnaker RI Terverifikasi'
                        : job.company_verified_status === 'verified_nib'
                        ? 'NIB Resmi Terverifikasi'
                        : 'Domain Resmi Terverifikasi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alamat Tempat Kerja:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-right max-w-[220px] truncate">
                      {job.workplace_address || 'Tidak dicantumkan publik'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sumber Portal:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{job.source_name || 'KITA Karir'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {job.original_listing_url && (
                    <a
                      href={job.original_listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Kunjungi Tautan Asli Lowongan</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="w-full py-2 px-3 text-slate-400 hover:text-red-600 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Laporkan Lowongan Mencurigakan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Laporkan Lowongan</h3>
            </div>
            {reportSuccessMessage ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                {reportErrorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{reportErrorMessage}</p>}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan Pelaporan</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Pungutan liar / Biaya rekrutmen tidak wajar">Pungutan liar / Biaya rekrutmen tidak wajar</option>
                    <option value="Informasi perusahaan palsu / fiktif">Informasi perusahaan palsu / fiktif</option>
                    <option value="Kontak rekrutmen mencurigakan / scam">Kontak rekrutmen mencurigakan / scam</option>
                    <option value="Lowongan sudah kedaluwarsa atau tutup">Lowongan sudah kedaluwarsa atau tutup</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Jelaskan bukti atau kejanggalan yang Anda temukan..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="flex-1 py-2 rounded-xl bg-[#8B0026] text-white font-bold text-xs disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Persistent Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onToggleBookmark(job.id)}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-colors shrink-0"
            title="Simpan Lowongan"
            aria-label="Simpan Lowongan"
          >
            <Bookmark className={`w-5 h-5 ${job.is_saved ? 'fill-[#8B0026] text-[#8B0026] dark:fill-red-400 dark:text-red-400' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            title="Bagikan Lowongan (Web Share)"
            aria-label="Bagikan Lowongan via System Share"
          >
            <Share2 className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span className="hidden sm:inline text-xs font-bold">Bagikan</span>
          </button>
          <button
            onClick={onApplyNow}
            className="flex-1 py-3.5 px-6 bg-[#8B0026] hover:bg-red-800 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Lamar Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
