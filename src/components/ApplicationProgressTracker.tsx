import React from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  Award,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  ChevronRight,
  ShieldCheck,
  Check,
  Sparkles,
  ExternalLink,
  Mail,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../shared/types.js';

export interface PipelineStageConfig {
  id: 'submitted' | 'reviewing' | 'interview' | 'decision';
  label: string;
  shortLabel: string;
  stepNumber: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'submitted',
    stepNumber: 1,
    label: 'Lamaran Terkirim',
    shortLabel: 'Diajukan',
    description: 'Berkas digital dan CV tersimpan di portal dan diteruskan ke sistem rekrutmen perusahaan.',
    icon: FileText
  },
  {
    id: 'reviewing',
    stepNumber: 2,
    label: 'Peninjauan Berkas',
    shortLabel: 'Ditinjau',
    description: 'Tim HRD sedang meneliti kesesuaian kualifikasi, pengalaman, dan portofolio kandidat.',
    icon: Search
  },
  {
    id: 'interview',
    stepNumber: 3,
    label: 'Tahap Wawancara',
    shortLabel: 'Wawancara',
    description: 'Kandidat diundang ke sesi wawancara kompetensi kerja atau wawancara teknis.',
    icon: Calendar
  },
  {
    id: 'decision',
    stepNumber: 4,
    label: 'Keputusan Akhir',
    shortLabel: 'Keputusan',
    description: 'Pengumuman hasil evaluasi menyeluruh atau penerbitan surat penawaran kerja (Offering).',
    icon: Award
  }
];

export function getStageIndex(status: ApplicationStatus | string): number {
  switch (status) {
    case 'submitted':
      return 0;
    case 'reviewing':
      return 1;
    case 'interview':
      return 2;
    case 'accepted':
    case 'rejected':
      return 3;
    default:
      return 0;
  }
}

export function getStatusTheme(status: ApplicationStatus | string) {
  switch (status) {
    case 'submitted':
      return {
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
        badgeText: 'text-amber-800 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        accentBg: 'bg-amber-500',
        accentRing: 'ring-amber-200 dark:ring-amber-900',
        lightBg: 'bg-amber-50/70 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Lamaran Terkirim (Applied)',
        percent: 25,
        icon: Clock,
        stepHeadline: 'Tahap 1 dari 4: Berkas Diajukan',
        stepSummary: 'Berkas dan resume Anda telah berhasil tercatat di sistem rekrutmen perusahaan. Menunggu giliran antrian verifikasi berkas oleh Tim HRD.'
      };
    case 'reviewing':
      return {
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
        badgeText: 'text-blue-800 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        accentBg: 'bg-blue-600',
        accentRing: 'ring-blue-200 dark:ring-blue-900',
        lightBg: 'bg-blue-50/70 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900',
        text: 'text-blue-700 dark:text-blue-300',
        label: 'Sedang Ditinjau (Under Review)',
        percent: 50,
        icon: Search,
        stepHeadline: 'Tahap 2 dari 4: Peninjauan Kualifikasi',
        stepSummary: 'Tim HRD perusahaan aktif mempelajari portofolio dan riwayat kerja Anda. Estimasi respon verifikasi biasanya 2-5 hari kerja.'
      };
    case 'interview':
      return {
        badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
        badgeText: 'text-purple-800 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        accentBg: 'bg-purple-600',
        accentRing: 'ring-purple-200 dark:ring-purple-900',
        lightBg: 'bg-purple-50/70 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-900',
        text: 'text-purple-700 dark:text-purple-300',
        label: 'Tahap Wawancara (Interviewed)',
        percent: 75,
        icon: Calendar,
        stepHeadline: 'Tahap 3 dari 4: Undangan Sesi Wawancara',
        stepSummary: 'Selamat! Profil Anda lolos seleksi berkas. Perusahaan menjadwalkan sesi interview. Pastikan nomor kontak dan email aktif untuk konfirmasi.'
      };
    case 'accepted':
      return {
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        accentBg: 'bg-emerald-600',
        accentRing: 'ring-emerald-200 dark:ring-emerald-900',
        lightBg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-900',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Diterima Bekerja (Accepted)',
        percent: 100,
        icon: CheckCircle2,
        stepHeadline: 'Tahap 4 dari 4: Diterima Resmi 🎉',
        stepSummary: 'Selamat! Anda dinyatakan lolos seluruh tahapan rekrutmen. Surat penawaran kerja (Offering Letter) resmi telah diterbitkan oleh perusahaan.'
      };
    case 'rejected':
      return {
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-700 dark:text-slate-300',
        badgeBorder: 'border-slate-300 dark:border-slate-700',
        accentBg: 'bg-slate-500',
        accentRing: 'ring-slate-200 dark:ring-slate-800',
        lightBg: 'bg-slate-50 dark:bg-slate-800/40',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        label: 'Belum Berhasil (Not Selected)',
        percent: 100,
        icon: XCircle,
        stepHeadline: 'Tahapan Seleksi Ditutup',
        stepSummary: 'Terima kasih telah berpartisipasi. Kualifikasi Anda disimpan dalam database talent perusahaan untuk peluang posisi berikutnya yang cocok.'
      };
    default:
      return {
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-600 dark:text-slate-400',
        badgeBorder: 'border-slate-200 dark:border-slate-700',
        accentBg: 'bg-slate-400',
        accentRing: 'ring-slate-200',
        lightBg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-600',
        label: 'Diproses',
        percent: 25,
        icon: Clock,
        stepHeadline: 'Lamaran Diproses',
        stepSummary: 'Lamaran sedang dalam alur pemrosesan sistem.'
      };
  }
}

/**
 * Compact Horizontal Stepper & Progress Tracker
 * Embedded directly on each Job Application Card in the list view
 */
export const ApplicationMiniTracker: React.FC<{
  status: ApplicationStatus | string;
  createdAt: string;
  className?: string;
}> = ({ status, createdAt, className = '' }) => {
  const currentStageIdx = getStageIndex(status);
  const theme = getStatusTheme(status);
  const isRejected = status === 'rejected';
  const isAccepted = status === 'accepted';

  // Calculate width percentage for connecting active track
  const progressWidth = isAccepted || isRejected
    ? 100
    : currentStageIdx === 0
      ? 16.6
      : currentStageIdx === 1
        ? 50
        : 83.3;

  return (
    <div className={`space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 ${className}`}>
      {/* Tracker Header / Stage Title */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
          <span>Alur Progres Lamaran:</span>
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
            {theme.label}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
          {new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Visual Stepper Track with Nodes */}
      <div className="relative pt-2 pb-1 px-2">
        {/* Background track line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 dark:bg-slate-800 rounded-full -translate-y-1/2 z-0" />

        {/* Active filled track line */}
        <div
          className={`absolute top-5 left-6 h-1 rounded-full -translate-y-1/2 z-0 transition-all duration-500 ${
            isRejected ? 'bg-slate-400 dark:bg-slate-600' : 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500'
          }`}
          style={{ width: `calc(${progressWidth}% - 12px)` }}
        />

        {/* Step Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = isAccepted || (!isRejected && idx < currentStageIdx);
            const isCurrent = !isAccepted && !isRejected && idx === currentStageIdx;
            const isTerminalDecision = idx === 3;
            const isRejectedNode = isRejected && isTerminalDecision;

            // Icon selection
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center group">
                {/* Node Circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-500 text-white ring-3 ring-emerald-100 dark:ring-emerald-950/70'
                      : isCurrent
                        ? `${theme.accentBg} text-white ring-4 ${theme.accentRing} animate-pulse`
                        : isRejectedNode
                          ? 'bg-slate-500 text-white ring-3 ring-slate-200 dark:ring-slate-700'
                          : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <StageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : isRejectedNode ? (
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="text-[10px] sm:text-xs">{stage.stepNumber}</span>
                  )}
                </div>

                {/* Node Label */}
                <span
                  className={`text-[10px] sm:text-[11px] font-bold mt-1.5 transition-colors whitespace-nowrap ${
                    isCompleted
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                        ? `${theme.text} font-black`
                        : isRejectedNode
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isTerminalDecision && isAccepted
                    ? 'Diterima'
                    : isTerminalDecision && isRejected
                      ? 'Selesai'
                      : stage.shortLabel}
                </span>

                {/* State Tag */}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                  {isCompleted ? 'Selesai' : isCurrent ? 'Tahap Aktif' : isRejectedNode ? 'Ditutup' : 'Menunggu'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory Stage Context Banner */}
      <div className={`p-2.5 rounded-xl border ${theme.lightBg} ${theme.border} flex items-start gap-2 text-xs`}>
        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${theme.text}`} />
        <div className="space-y-0.5">
          <p className={`font-bold ${theme.text}`}>
            {theme.stepHeadline}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
            {theme.stepSummary}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Detailed Vertical Milestone Timeline & Progress Tracker Modal
 * Shows in-depth timeline stages with dates, action items, verification records, and testing switcher
 */
export const ApplicationTimelineModal: React.FC<{
  application: JobApplication;
  onClose: () => void;
  onStatusChange?: (newStatus: ApplicationStatus) => void;
}> = ({ application, onClose, onStatusChange }) => {
  const currentStageIdx = getStageIndex(application.status);
  const theme = getStatusTheme(application.status);
  const isRejected = application.status === 'rejected';
  const isAccepted = application.status === 'accepted';

  // Format dates
  const appliedDate = new Date(application.created_at);
  const formattedApplied = appliedDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const updatedDate = application.updated_at ? new Date(application.updated_at) : appliedDate;
  const formattedUpdated = updatedDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-bold">
                REF #{application.id.slice(-6).toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terverifikasi KITA</span>
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {application.job_title || 'Posisi Lowongan'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{application.employer_name || 'Mitra KITA'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Overview Card */}
        <div className={`p-3.5 rounded-2xl border ${theme.lightBg} ${theme.border} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Terkini
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} flex items-center gap-1.5`}>
              <theme.icon className="w-3.5 h-3.5" />
              <span>{theme.label}</span>
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            {theme.stepSummary}
          </p>
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tanggal Pengajuan: <strong className="text-slate-700 dark:text-slate-300">{formattedApplied}</strong></span>
            <span>Update Terakhir: <strong className="text-slate-700 dark:text-slate-300">{formattedUpdated}</strong></span>
          </div>
        </div>

        {/* Full Milestone Timeline */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
            <span>Timeline Tahapan Rekrutmen</span>
          </h4>

          <div className="relative pl-6 space-y-6 pt-2 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Step 1: Applied */}
            <div className="relative group">
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs ${
                  currentStageIdx >= 0
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70'
                    : 'bg-white dark:bg-slate-900 border-2 border-slate-300 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="pl-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>1. Berkas Lamaran Diajukan</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] rounded font-bold">
                      Selesai
                    </span>
                  </h5>
                  <span className="text-[10px] text-slate-400">{formattedApplied}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  Surat pengantar, Curriculum Vitae (CV), dan kontak terverifikasi berhasil dikirimkan ke portal rekrutmen perusahaan secara aman.
                </p>
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div className="relative group">
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs ${
                  isAccepted || (!isRejected && currentStageIdx > 1)
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70'
                    : currentStageIdx === 1 && !isRejected
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/70 animate-pulse'
                      : isRejected && currentStageIdx === 1
                        ? 'bg-slate-500 text-white ring-4 ring-slate-200 dark:ring-slate-800'
                        : currentStageIdx === 0
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/70'
                          : 'bg-white dark:bg-slate-900 border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isAccepted || (!isRejected && currentStageIdx > 1) ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : currentStageIdx === 1 ? (
                  <Search className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="pl-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>2. Peninjauan Berkas (Review HRD)</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                        isAccepted || (!isRejected && currentStageIdx > 1)
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : currentStageIdx === 1
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isAccepted || (!isRejected && currentStageIdx > 1)
                        ? 'Lolos Berkas'
                        : currentStageIdx === 1
                          ? 'Sedang Ditinjau'
                          : 'Antrian Peninjauan'}
                    </span>
                  </h5>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  Tim HRD mengevaluasi kecocokan kompetensi, pengalaman kerja, dan kelayakan administratif sesuai kualifikasi yang disyaratkan.
                </p>
              </div>
            </div>

            {/* Step 3: Interviewed */}
            <div className="relative group">
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs ${
                  isAccepted || (!isRejected && currentStageIdx > 2)
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70'
                    : currentStageIdx === 2 && !isRejected
                      ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/70 animate-pulse'
                      : isRejected && currentStageIdx === 2
                        ? 'bg-slate-500 text-white ring-4 ring-slate-200 dark:ring-slate-800'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isAccepted || (!isRejected && currentStageIdx > 2) ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : currentStageIdx === 2 ? (
                  <Calendar className="w-3.5 h-3.5" />
                ) : (
                  <span>3</span>
                )}
              </div>
              <div className="pl-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>3. Tahap Wawancara (Interview)</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                        isAccepted
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : currentStageIdx === 2
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isAccepted
                        ? 'Wawancara Selesai'
                        : currentStageIdx === 2
                          ? 'Undangan Aktif'
                          : 'Tahap Lanjutan'}
                    </span>
                  </h5>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  Sesi wawancara tatap muka atau tatap maya dengan HR dan manajer tim. Kandidat diuji kemampuan teknis dan kecocokan budaya kerja tim.
                </p>
                {currentStageIdx === 2 && (
                  <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-[11px] text-purple-800 dark:text-purple-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Petunjuk untuk Anda:</span>
                    </p>
                    <p className="leading-snug">
                      Periksa inbox email & nomor WhatsApp secara berkala untuk detail jadwal link Google Meet/Zoom atau alamat lokasi wawancara.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Final Decision */}
            <div className="relative group">
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs ${
                  isAccepted
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70'
                    : isRejected
                      ? 'bg-slate-500 text-white ring-4 ring-slate-200 dark:ring-slate-800'
                      : 'bg-white dark:bg-slate-900 border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isAccepted ? (
                  <Award className="w-4 h-4" />
                ) : isRejected ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <span>4</span>
                )}
              </div>
              <div className="pl-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>4. Keputusan Akhir Rekrutmen</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                        isAccepted
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : isRejected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isAccepted
                        ? 'Diterima Bekerja 🏆'
                        : isRejected
                          ? 'Belum Berhasil'
                          : 'Menunggu Hasil'}
                    </span>
                  </h5>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  {isAccepted
                    ? 'Selamat! Surat penawaran kerja (Offering Letter) dan petunjuk kontrak kerja resmi diterbitkan oleh pihak perusahaan.'
                    : isRejected
                      ? 'Proses seleksi untuk posisi ini telah selesai. Profil Anda tetap diarsipkan dalam daftar kandidat berpotensi untuk posisi mendatang.'
                      : 'Keputusan resmi akan diterbitkan setelah komite rekrutmen menyelesaikan penilaian menyeluruh seluruh kandidat.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Letter Details */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Surat Pengantar & Catatan Lamaran</span>
          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
            "{application.cover_letter || 'Pengajuan berkas resmi melalui platform KITA ID.'}"
          </p>
        </div>

        {/* Simulation / Interactive Test Switcher */}
        {onStatusChange && (
          <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-[#8B0026] dark:text-red-400" />
                <span>Simulasi Status Alur Lamaran:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk uji tampilan</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[11px]">
              {(['submitted', 'reviewing', 'interview', 'accepted', 'rejected'] as ApplicationStatus[]).map((st) => {
                const isActive = application.status === st;
                const labels: Record<string, string> = {
                  submitted: 'Terkirim',
                  reviewing: 'Ditinjau',
                  interview: 'Wawancara',
                  accepted: 'Diterima',
                  rejected: 'Belum Lolos'
                };
                return (
                  <button
                    key={st}
                    onClick={() => onStatusChange(st)}
                    className={`py-1.5 px-1 rounded-lg text-center font-bold text-[10px] transition-all ${
                      isActive
                        ? 'bg-[#8B0026] text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {labels[st]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
        >
          Tutup Rincian
        </button>
      </div>
    </div>
  );
};
