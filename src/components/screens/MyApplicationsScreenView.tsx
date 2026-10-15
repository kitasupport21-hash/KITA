import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronRight,
  Search,
  Calendar,
  X,
  Sparkles,
  MapPin,
  RefreshCw,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import type { JobApplication, User, ApplicationStatus } from '../../shared/types.js';
import { api } from '../../lib/api.js';
import {
  ApplicationMiniTracker,
  ApplicationTimelineModal,
  getStatusTheme
} from '../ApplicationProgressTracker.js';
import {
  ApplicationVisualStatusTracker,
  ApplicationPipelineOverviewBanner,
  getVisualStageInfo
} from '../ApplicationVisualStatusIndicator.js';

interface MyApplicationsScreenViewProps {
  currentUser: User | null;
  onExploreJobs: () => void;
  onOpenAuth: () => void;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'submitted', label: 'Received (Diajukan)' },
  { id: 'reviewing', label: 'Under Review (Ditinjau)' },
  { id: 'interview', label: 'Interviewing (Wawancara)' },
  { id: 'accepted', label: 'Accepted (Diterima)' },
  { id: 'rejected', label: 'Belum Lolos' }
];



export const MyApplicationsScreenView: React.FC<MyApplicationsScreenViewProps> = ({
  currentUser,
  onExploreJobs,
  onOpenAuth
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      setLoading(false);
      return;
    }
    const fetchApps = async () => {
      setLoading(true);
      try {
        const res = await api.getSeekerApplications();
        if (res.success && res.data) {
          setApplications(res.data);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.warn('Gagal memuat lamaran:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [currentUser]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;
    const appId = selectedApp.id;
    setStatusError(null);
    try {
      await api.updateSeekerApplicationStatus(appId, newStatus);
      const refreshed = await api.getSeekerApplications();
      if (refreshed.success && refreshed.data) {
        setApplications(refreshed.data);
        const updated = refreshed.data.find((app) => app.id === appId);
        if (updated) setSelectedApp(updated);
      }
    } catch (error: any) {
      setStatusError(error?.message || 'Status lamaran tidak dapat diperbarui. Coba lagi.');
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeStatus === 'all') return true;
    return app.status === activeStatus;
  });

  const getStatusBadge = (status: string) => {
    const stageInfo = getVisualStageInfo(status);
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${stageInfo.badgeBg} border flex items-center gap-1.5 shrink-0 shadow-2xs`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stageInfo.bgClass}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${stageInfo.bgClass}`} />
        </span>
        <span>{stageInfo.englishLabel}</span>
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 text-center rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-6 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto shadow-2xs">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Pelacakan Status Lamaran
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Masuk ke akun Anda untuk memantau status lamaran kerja: 
            <strong> Diajukan</strong>, <strong>Ditinjau</strong>, hingga <strong>Wawancara</strong> secara real-time.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <button
            onClick={onOpenAuth}
            className="w-full py-3 bg-[#8B0026] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-800 transition-colors cursor-pointer"
          >
            Masuk dengan Akun Pelamar
          </button>
          <button
            onClick={onExploreJobs}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Jelajahi Lowongan Pekerjaan</span>
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0 && !loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-10 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 text-center rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-6 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Belum Ada Lamaran Aktif
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Anda belum mengirimkan berkas lamaran ke lowongan pekerjaan manapun. Temukan lowongan resmi dan kirimkan lamaran pertama Anda.
            </p>
          </div>
          <button
            onClick={onExploreJobs}
            className="w-full py-3 bg-[#8B0026] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Cari Lowongan Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10 transition-colors duration-200">

      {statusError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {statusError}
        </div>
      )}

      {/* Header with Title and Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-red-50/60 via-slate-50 to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lamaran Saya
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#8B0026] text-white">
              {applications.length} Terdata
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pelacak alur rekrutmen resmi: Terkirim → Review HRD → Wawancara → Keputusan
          </p>
        </div>
        <button
          onClick={onExploreJobs}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#8B0026] text-xs font-bold text-[#8B0026] dark:text-red-400 transition-all flex items-center gap-1 shadow-2xs"
        >
          <Search className="w-3 h-3" />
          <span>Cari Lowongan</span>
        </button>
      </div>

      {/* Top Visual Pipeline Overview Banner with CSS Animations */}
      <ApplicationPipelineOverviewBanner
        applications={applications}
        activeFilter={activeStatus}
        onSelectFilter={setActiveStatus}
      />

      {/* Horizontal Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {STATUS_FILTERS.map((tab) => {
          const isActive = activeStatus === tab.id;
          const count = tab.id === 'all'
            ? applications.length
            : applications.filter((a) => a.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#8B0026] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Lamaran dengan Filter Ini
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Coba pilih filter lain atau cari lowongan baru yang sesuai dengan minat dan keterampilan Anda.
          </p>
          <button
            onClick={() => setActiveStatus('all')}
            className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Tampilkan Semua Status
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-[#8B0026]/40 dark:hover:border-slate-700 transition-all cursor-pointer space-y-3"
            >
              {/* Card Top Row: Job Title, Company, Status Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                      #{app.id.slice(-6).toUpperCase()}
                    </span>
                    <span>•</span>
                    <span className="truncate">{app.employer_name || 'Mitra KITA'}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#8B0026] dark:group-hover:text-red-400 transition-colors line-clamp-1">
                    {app.job_title || 'Posisi Pekerjaan'}
                  </h4>
                </div>
                {getStatusBadge(app.status)}
              </div>

              {/* Visual Progress Status Indicator with CSS Animations */}
              <ApplicationVisualStatusTracker
                status={app.status}
                createdAt={app.created_at}
              />

              {/* Card Bottom Row: Delivery Confirmation & Click to Expand */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tervalidasi Resmi KITA ID</span>
                </div>
                <div className="text-[#8B0026] dark:text-red-400 font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Rincian Timeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Milestone Timeline Modal */}
      {selectedApp && (
        <ApplicationTimelineModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};
