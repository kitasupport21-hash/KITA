import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import type { JobApplication, JobListing, User } from '../shared/types.js';
import {
  Users,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';

interface EmployerApplicantsViewProps {
  currentUser: User;
  onNavigateToListings?: () => void;
}

export const EmployerApplicantsView: React.FC<EmployerApplicantsViewProps> = ({
  currentUser,
  onNavigateToListings
}) => {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'reviewing' | 'interview' | 'accepted' | 'rejected'>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployerListings();
      if (res.success && res.data) {
        setListings(res.data);
        let allApps: JobApplication[] = [];
        for (const job of res.data) {
          try {
            const appsRes = await api.getListingApplications(job.id);
            if (appsRes.success && appsRes.data) {
              allApps = [...allApps, ...appsRes.data];
            }
          } catch {
            // continue
          }
        }
        setApplicants(allApps);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: any) => {
    setStatusUpdating(true);
    try {
      const res = await api.updateApplicationStatus(appId, newStatus);
      if (res.success) {
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        if (selectedApplicant && selectedApplicant.id === appId) {
          setSelectedApplicant({ ...selectedApplicant, status: newStatus });
        }
        showToast(`Status pelamar berhasil diperbarui menjadi "${newStatus}".`);
      }
    } catch (err: any) {
      showToast(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredApplicants = applicants.filter((a) => {
    const matchJob = selectedJobId === 'all' || a.job_id === selectedJobId;
    const matchStatus = activeTab === 'all' || a.status === activeTab;
    return matchJob && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Diterima</span>;
      case 'interview':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Wawancara</span>;
      case 'reviewing':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Ditelaah</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Tidak Sesuai</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Masuk</span>;
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto transition-colors duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Manajemen Pelamar Kerja</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola berkas calon kandidat dari seluruh lowongan UMKM Anda
          </p>
        </div>

        {/* Filter by Job Listing */}
        <div className="w-full sm:w-64">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
          >
            <option value="all">Semua Lowongan ({applicants.length} Pelamar)</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Semua Pelamar' },
          { id: 'submitted', label: 'Lamaran Masuk' },
          { id: 'reviewing', label: 'Sedang Ditelaah' },
          { id: 'interview', label: 'Tahap Wawancara' },
          { id: 'accepted', label: 'Diterima' },
          { id: 'rejected', label: 'Ditolak' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-[#8B0026] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applicants List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
          Memuat data pelamar...
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Belum Ada Pelamar Masuk</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Belum ada berkas lamaran yang cocok dengan kriteria filter ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplicants.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApplicant(app)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 hover:border-red-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#8B0026] dark:text-red-400 font-extrabold flex items-center justify-center shrink-0 text-sm">
                  {app.seeker_name ? app.seeker_name.substring(0, 2).toUpperCase() : 'PL'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{app.seeker_name || 'Pelamar Kerja'}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="text-xs font-semibold text-[#8B0026] dark:text-red-400 mt-0.5">
                    Melamar posisi: {app.job_title}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    {app.seeker_email && <span>{app.seeker_email}</span>}
                    {app.seeker_phone && <span>· {app.seeker_phone}</span>}
                    <span>· {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedApplicant(app);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#8B0026] hover:text-white text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <span>Tinjau Berkas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedApplicant.seeker_name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Lowongan: {selectedApplicant.job_title}</p>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Email:</span>
                  <span className="font-semibold">{selectedApplicant.seeker_email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Telepon / WA:</span>
                  <span className="font-semibold">{selectedApplicant.seeker_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tanggal Melamar:</span>
                  <span className="font-semibold">{new Date(selectedApplicant.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Surat Pengantar</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedApplicant.cover_letter || 'Tidak menyertakan surat pengantar.'}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Berkas Pendukung</h4>
                {selectedApplicant.resume_url && (
                  <a
                    href={selectedApplicant.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 text-[#8B0026] dark:text-red-300 rounded-xl font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Lihat Berkas CV / Dokumen Pelamar</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Perbarui Status Pelamar:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'reviewing')}
                    className="p-2 text-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-xs"
                  >
                    Ditelaah
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'interview')}
                    className="p-2 text-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 text-xs"
                  >
                    Wawancara
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'accepted')}
                    className="p-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-xs"
                  >
                    Diterima
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'rejected')}
                    className="p-2 text-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 text-xs"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
