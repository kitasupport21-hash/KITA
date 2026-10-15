import React from 'react';
import {
  FileText,
  Search,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { ApplicationStatus } from '../shared/types.js';

export interface StatusStageMeta {
  id: 'submitted' | 'reviewing' | 'interview' | 'accepted';
  englishLabel: 'Received' | 'Under Review' | 'Interviewing' | 'Accepted';
  indonesianLabel: string;
  stepNumber: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
  radarClass: string;
  gradientClass: string;
  description: string;
}

export const VISUAL_STATUS_STAGES: StatusStageMeta[] = [
  {
    id: 'submitted',
    englishLabel: 'Received',
    indonesianLabel: 'Lamaran Diterima',
    stepNumber: 1,
    percentage: 25,
    icon: FileText,
    accentColor: '#F59E0B',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    radarClass: 'animate-radar-wave',
    gradientClass: 'from-amber-400 to-amber-500',
    description: 'Berkas dan CV pelamar berhasil masuk dan tercatat di sistem rekrutmen.'
  },
  {
    id: 'reviewing',
    englishLabel: 'Under Review',
    indonesianLabel: 'Peninjauan Berkas',
    stepNumber: 2,
    percentage: 50,
    icon: Search,
    accentColor: '#2563EB',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    radarClass: 'animate-radar-wave',
    gradientClass: 'from-blue-500 to-indigo-500',
    description: 'Kualifikasi & portofolio kandidat sedang dievaluasi oleh Tim HRD.'
  },
  {
    id: 'interview',
    englishLabel: 'Interviewing',
    indonesianLabel: 'Tahap Wawancara',
    stepNumber: 3,
    percentage: 75,
    icon: Calendar,
    accentColor: '#9333EA',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
    radarClass: 'animate-radar-wave-purple',
    gradientClass: 'from-purple-500 to-fuchsia-500',
    description: 'Kandidat masuk dalam sesi wawancara kompetensi atau teknis.'
  },
  {
    id: 'accepted',
    englishLabel: 'Accepted',
    indonesianLabel: 'Diterima Bekerja',
    stepNumber: 4,
    percentage: 100,
    icon: Award,
    accentColor: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    radarClass: 'animate-radar-wave-green',
    gradientClass: 'from-emerald-400 via-teal-400 to-emerald-500',
    description: 'Selamat! Surat penawaran kerja (Offering Letter) resmi telah diterbitkan.'
  }
];

export function getVisualStageInfo(status: ApplicationStatus | string) {
  switch (status) {
    case 'submitted':
      return {
        stageIndex: 0,
        percentage: 25,
        englishLabel: 'Received',
        indonesianLabel: 'Lamaran Diterima',
        isTerminal: false,
        isAccepted: false,
        isRejected: false,
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-500',
        ringClass: 'ring-amber-200 dark:ring-amber-900',
        radarClass: 'animate-radar-wave',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        summary: 'Tahap 1: Berkas terkirim & tercatat di portal rekrutmen.'
      };
    case 'reviewing':
      return {
        stageIndex: 1,
        percentage: 50,
        englishLabel: 'Under Review',
        indonesianLabel: 'Sedang Ditinjau',
        isTerminal: false,
        isAccepted: false,
        isRejected: false,
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-600',
        ringClass: 'ring-blue-200 dark:ring-blue-900',
        radarClass: 'animate-radar-wave',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        summary: 'Tahap 2: Tim HRD sedang mereview berkas & portofolio.'
      };
    case 'interview':
      return {
        stageIndex: 2,
        percentage: 75,
        englishLabel: 'Interviewing',
        indonesianLabel: 'Sesi Wawancara',
        isTerminal: false,
        isAccepted: false,
        isRejected: false,
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-600',
        ringClass: 'ring-purple-200 dark:ring-purple-900',
        radarClass: 'animate-radar-wave-purple',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        summary: 'Tahap 3: Undangan sesi interview kerja aktif.'
      };
    case 'accepted':
      return {
        stageIndex: 3,
        percentage: 100,
        englishLabel: 'Accepted',
        indonesianLabel: 'Diterima Bekerja 🎉',
        isTerminal: true,
        isAccepted: true,
        isRejected: false,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-500',
        ringClass: 'ring-emerald-200 dark:ring-emerald-900',
        radarClass: 'animate-radar-wave-green',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        summary: 'Tahap 4: Lolos seleksi & surat penawaran kerja resmi terbit.'
      };
    case 'rejected':
      return {
        stageIndex: 3,
        percentage: 100,
        englishLabel: 'Closed',
        indonesianLabel: 'Belum Berhasil',
        isTerminal: true,
        isAccepted: false,
        isRejected: true,
        colorClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-500',
        ringClass: 'ring-slate-200 dark:ring-slate-800',
        radarClass: '',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        summary: 'Tahap akhir: Proses rekrutmen untuk posisi ini telah ditutup.'
      };
    default:
      return {
        stageIndex: 0,
        percentage: 25,
        englishLabel: 'Received',
        indonesianLabel: 'Lamaran Diterima',
        isTerminal: false,
        isAccepted: false,
        isRejected: false,
        colorClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-500',
        ringClass: 'ring-slate-200',
        radarClass: '',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        summary: 'Lamaran sedang diproses dalam alur sistem.'
      };
  }
}

/**
 * Animated Circular SVG Progress Ring Gauge
 * Uses CSS transitions and stroke-dashoffset for smooth fluid progress display
 */
export const ApplicationStatusCircularGauge: React.FC<{
  status: ApplicationStatus | string;
  size?: number;
  strokeWidth?: number;
  showPercentText?: boolean;
}> = ({ status, size = 48, strokeWidth = 4, showPercentText = true }) => {
  const stageInfo = getVisualStageInfo(status);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stageInfo.percentage / 100) * circumference;

  const isRejected = stageInfo.isRejected;
  const isAccepted = stageInfo.isAccepted;

  // Stroke color styling
  const strokeColor = isRejected
    ? '#94A3B8'
    : isAccepted
      ? '#10B981'
      : stageInfo.stageIndex === 0
        ? '#F59E0B'
        : stageInfo.stageIndex === 1
          ? '#2563EB'
          : '#9333EA';

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title={`Progres Status: ${stageInfo.englishLabel} (${stageInfo.percentage}%)`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress SVG stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center percentage or check indicator */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {isAccepted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in-75 duration-300" />
        ) : isRejected ? (
          <XCircle className="w-5 h-5 text-slate-400" />
        ) : showPercentText ? (
          <span className="text-[10px] font-black tracking-tighter text-slate-800 dark:text-slate-100">
            {stageInfo.percentage}%
          </span>
        ) : null}
      </div>

      {/* Ambient CSS pulse ring for active in-progress stages */}
      {!isRejected && !isAccepted && (
        <span
          className={`absolute inset-0 rounded-full border border-current pointer-events-none ${stageInfo.colorClass} opacity-30 animate-pulse-glow`}
        />
      )}
    </div>
  );
};

/**
 * Visual Status Progress Indicator with CSS Animations
 * Features:
 * - Fluid CSS shimmering gradient bar
 * - Pulsing animated beacon on the current active milestone node
 * - Animated SVG dashed flow line
 * - Explicit labels: 'Received', 'Under Review', 'Interviewing', 'Accepted'
 */
export const ApplicationVisualStatusTracker: React.FC<{
  status: ApplicationStatus | string;
  createdAt?: string;
  className?: string;
  compact?: boolean;
}> = ({ status, createdAt, className = '', compact = false }) => {
  const stageInfo = getVisualStageInfo(status);
  const isRejected = stageInfo.isRejected;
  const isAccepted = stageInfo.isAccepted;

  return (
    <div className={`space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 ${className}`}>
      {/* Indicator Header with Animated Status Badge & Percent */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Animated Circular Gauge Indicator */}
          <ApplicationStatusCircularGauge status={status} size={36} strokeWidth={3.5} />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Alur Status Lamaran:
              </span>
              {/* Animated Status Pill */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs ${stageInfo.badgeBg}`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isAccepted
                        ? 'bg-emerald-400'
                        : isRejected
                          ? 'bg-slate-400'
                          : stageInfo.stageIndex === 0
                            ? 'bg-amber-400'
                            : stageInfo.stageIndex === 1
                              ? 'bg-blue-400'
                              : 'bg-purple-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isAccepted
                        ? 'bg-emerald-500'
                        : isRejected
                          ? 'bg-slate-500'
                          : stageInfo.stageIndex === 0
                            ? 'bg-amber-500'
                            : stageInfo.stageIndex === 1
                              ? 'bg-blue-600'
                              : 'bg-purple-600'
                    }`}
                  />
                </span>
                <span>{stageInfo.englishLabel}</span>
                <span className="opacity-75 text-[10px] font-medium hidden sm:inline">
                  ({stageInfo.indonesianLabel})
                </span>
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {stageInfo.summary}
            </p>
          </div>
        </div>

        {createdAt && (
          <div className="text-right shrink-0 hidden sm:block">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {new Date(createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Main Multi-Stage Linear Track with CSS Animations */}
      <div className="relative pt-2 pb-1 px-2 sm:px-3">
        {/* Static Background Rail Line */}
        <div className="absolute top-5 left-7 right-7 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full -translate-y-1/2 z-0" />

        {/* Dynamic Animated Shimmering Progress Bar */}
        <div
          className={`absolute top-5 left-7 h-1.5 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out ${
            isRejected
              ? 'bg-slate-400 dark:bg-slate-600'
              : 'bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-400 animate-progress-shimmer shadow-xs'
          }`}
          style={{
            width: isAccepted || isRejected
              ? 'calc(100% - 3.5rem)'
              : stageInfo.stageIndex === 0
                ? '12%'
                : stageInfo.stageIndex === 1
                  ? '46%'
                  : '80%'
          }}
        />

        {/* Milestone Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {VISUAL_STATUS_STAGES.map((stage, idx) => {
            const isCompleted = isAccepted || (!isRejected && idx < stageInfo.stageIndex);
            const isCurrent = !isAccepted && !isRejected && idx === stageInfo.stageIndex;
            const isTerminalDecision = idx === 3;
            const isRejectedTerminal = isRejected && isTerminalDecision;

            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center group relative">
                {/* Node Outer Radar Wave (CSS Animation when node is current) */}
                {isCurrent && (
                  <div
                    className={`absolute -top-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${stage.radarClass} pointer-events-none`}
                  />
                )}

                {/* Milestone Node Circle */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-2xs relative z-10 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white ring-3 ring-emerald-100 dark:ring-emerald-950/70'
                      : isCurrent
                        ? `${stageInfo.bgClass} text-white ring-4 ${stageInfo.ringClass} scale-110 shadow-sm`
                        : isRejectedTerminal
                          ? 'bg-slate-500 text-white ring-3 ring-slate-200 dark:ring-slate-700'
                          : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <StageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                  ) : isRejectedTerminal ? (
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold">{stage.stepNumber}</span>
                  )}
                </div>

                {/* Node Labels: English (Primary) & Indonesian Subtext */}
                <div className="text-center mt-1.5 flex flex-col items-center">
                  <span
                    className={`text-[10px] sm:text-[11px] font-extrabold tracking-tight transition-colors whitespace-nowrap ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isCurrent
                          ? `${stageInfo.colorClass} font-black`
                          : isRejectedTerminal
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {stage.englishLabel}
                  </span>

                  {!compact && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                      {isCompleted
                        ? 'Selesai'
                        : isCurrent
                          ? 'Tahap Aktif'
                          : isRejectedTerminal
                            ? 'Ditutup'
                            : stage.indonesianLabel.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Top Visual Pipeline Journey Dashboard Banner
 * Placed at the top of MyApplicationsScreenView to give job seekers an animated overview
 * of all their applications distributed across stages (Received, Under Review, Interviewing, Accepted).
 */
export const ApplicationPipelineOverviewBanner: React.FC<{
  applications: Array<{ status: ApplicationStatus | string }>;
  activeFilter: string;
  onSelectFilter: (status: string) => void;
}> = ({ applications, activeFilter, onSelectFilter }) => {
  const total = applications.length;
  if (total === 0) return null;

  const countReceived = applications.filter((a) => a.status === 'submitted').length;
  const countReviewing = applications.filter((a) => a.status === 'reviewing').length;
  const countInterviewing = applications.filter((a) => a.status === 'interview').length;
  const countAccepted = applications.filter((a) => a.status === 'accepted').length;

  const stages = [
    {
      id: 'submitted',
      label: 'Received',
      indo: 'Diterima',
      count: countReceived,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-700 dark:text-amber-300',
      bgGlow: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      icon: FileText
    },
    {
      id: 'reviewing',
      label: 'Under Review',
      indo: 'Ditinjau',
      count: countReviewing,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-700 dark:text-blue-300',
      bgGlow: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      icon: Search
    },
    {
      id: 'interview',
      label: 'Interviewing',
      indo: 'Wawancara',
      count: countInterviewing,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-700 dark:text-purple-300',
      bgGlow: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
      icon: Calendar
    },
    {
      id: 'accepted',
      label: 'Accepted',
      indo: 'Lolos/Offered',
      count: countAccepted,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      bgGlow: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      icon: Award
    }
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#8B0026] to-rose-700 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Pipeline Status Rekrutmen</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase">
                Live Tracker
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Visualisasi distribusi tahapan seleksi ({total} total lamaran aktif)
            </p>
          </div>
        </div>

        {activeFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className="text-[11px] font-bold text-[#8B0026] dark:text-red-400 hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        )}
      </div>

      {/* Grid of Stage Progress Cards with CSS Animations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((stg) => {
          const isSelected = activeFilter === stg.id;
          const StageIcon = stg.icon;
          const percentage = total > 0 ? Math.round((stg.count / total) * 100) : 0;

          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => onSelectFilter(isSelected ? 'all' : stg.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                isSelected
                  ? `${stg.bgGlow} ring-2 ring-current ${stg.textColor} shadow-xs`
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {/* Subtle top indicator bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stg.color} ${
                  stg.count > 0 ? 'opacity-100' : 'opacity-25'
                }`}
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <StageIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{stg.label}</span>
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {stg.count}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>{stg.indo}</span>
                <span className="font-semibold">{percentage}%</span>
              </div>

              {/* Mini animated progress bar */}
              <div className="mt-1.5 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stg.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
