import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import type { JobListing, JobApplication, User, ListingStatus } from '../shared/types.js';
import { useTheme } from './ThemeContext.js';
import {
  Plus,
  Users,
  CheckCircle2,
  Briefcase,
  X,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Sun,
  Moon,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  ShieldCheck,
  Check,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  MapPin,
  Laptop
} from 'lucide-react';

interface EmployerDashboardProps {
  currentUser: User;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ currentUser }) => {
  const { toggleTheme, isDark } = useTheme();

  // Active sub-view in dashboard: 'overview' | 'listings' | 'applicants' | 'profile'
  const [activeView, setActiveView] = useState<'overview' | 'listings' | 'applicants' | 'profile'>('overview');

  // Listings state
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter for Listings
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'closed'>('all');
  const [listingSearchQuery, setListingSearchQuery] = useState('');

  // All applicants state aggregated across listings
  const [allApplicants, setAllApplicants] = useState<JobApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicantFilterStatus, setApplicantFilterStatus] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Modal: Create or Edit Job Listing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('F&B / Kuliner');
  const [formJobType, setFormJobType] = useState('fulltime');
  const [formWorkplace, setFormWorkplace] = useState('onsite');
  const [formCity, setFormCity] = useState(currentUser.city || 'Bandung');
  const [formMinSalary, setFormMinSalary] = useState('3500000');
  const [formMaxSalary, setFormMaxSalary] = useState('5000000');
  const [formNegotiable, setFormNegotiable] = useState(true);
  const [formSalaryPeriod, setFormSalaryPeriod] = useState('monthly');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formStatus, setFormStatus] = useState<ListingStatus>('published');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Single job drawer for applicants
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<JobListing | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployerListings();
      if (res.success && res.data) {
        setListings(res.data);
        // Fetch all applicants for all listings
        let apps: JobApplication[] = [];
        for (const job of res.data) {
          try {
            const appsRes = await api.getListingApplications(job.id);
            if (appsRes.success && appsRes.data) {
              apps = [...apps, ...appsRes.data];
            }
          } catch {
            // ignore
          }
        }
        setAllApplicants(apps);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data dasbor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenCreate = () => {
    setEditingJobId(null);
    setFormTitle('');
    setFormCategory('F&B / Kuliner');
    setFormJobType('fulltime');
    setFormWorkplace('onsite');
    setFormCity(currentUser.city || 'Bandung');
    setFormMinSalary('3500000');
    setFormMaxSalary('5000000');
    setFormNegotiable(true);
    setFormSalaryPeriod('monthly');
    setFormDescription('');
    setFormRequirements('Pendidikan minimal SMA/SMK atau D3 sederajat\nPengalaman relevan minimal 1 tahun\nDisiplin, teliti, dan bertanggung jawab');
    setFormBenefits('Gaji pokok standar industri\nBPJS Ketenagakerjaan\nTunjangan makan & uang transport');
    setFormStatus('published');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (job: JobListing) => {
    setEditingJobId(job.id);
    setFormTitle(job.title);
    setFormCategory(job.category);
    setFormJobType(job.job_type);
    setFormWorkplace(job.workplace_type);
    setFormCity(job.city);
    setFormMinSalary(String(job.min_salary));
    setFormMaxSalary(String(job.max_salary));
    setFormNegotiable(job.is_salary_negotiable);
    setFormSalaryPeriod(job.salary_period);
    setFormDescription(job.description);
    setFormRequirements(Array.isArray(job.requirements) ? job.requirements.join('\n') : '');
    setFormBenefits(Array.isArray(job.benefits) ? job.benefits.join('\n') : '');
    setFormStatus(job.status);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      title: formTitle,
      category: formCategory,
      job_type: formJobType,
      workplace_type: formWorkplace,
      city: formCity,
      province: 'Indonesia',
      min_salary: Number(formMinSalary) || 0,
      max_salary: Number(formMaxSalary) || 0,
      is_salary_negotiable: formNegotiable,
      salary_period: formSalaryPeriod,
      description: formDescription,
      requirements: formRequirements.split('\n').map((s) => s.trim()).filter(Boolean),
      benefits: formBenefits.split('\n').map((s) => s.trim()).filter(Boolean),
      status: formStatus
    };

    try {
      if (editingJobId) {
        const res = await api.updateEmployerListing(editingJobId, payload);
        if (res.success) {
          showToast('Lowongan pekerjaan berhasil diperbarui.', 'success');
          setIsEditModalOpen(false);
          fetchDashboardData();
        }
      } else {
        const res = await api.createEmployerListing(payload);
        if (res.success) {
          showToast('Lowongan baru berhasil dipublikasikan ke bursa kerja.', 'success');
          setIsEditModalOpen(false);
          fetchDashboardData();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data lowongan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'closed' : 'published';
    try {
      await api.toggleListingStatus(jobId, nextStatus);
      setListings((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus as any } : j))
      );
      showToast(nextStatus === 'published' ? 'Lowongan kembali dibuka.' : 'Lowongan ditutup.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status lowongan', 'error');
    }
  };

  const handleUpdateApplicantStatus = async (appId: string, newStatus: any) => {
    setStatusUpdating(true);
    try {
      const res = await api.updateApplicationStatus(appId, newStatus);
      if (res.success) {
        setAllApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        if (selectedApplicant && selectedApplicant.id === appId) {
          setSelectedApplicant({ ...selectedApplicant, status: newStatus });
        }
        showToast(`Tahap pelamar diperbarui menjadi "${newStatus}".`, 'success');
      }
    } catch (err: any) {
      showToast(`Gagal memperbarui status: ${err.message}`, 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Metrics calculations
  const totalApplicantsCount = allApplicants.length;
  const activeJobsCount = listings.filter((j) => j.status === 'published').length;
  const closedJobsCount = listings.filter((j) => j.status === 'closed').length;
  const interviewedCount = allApplicants.filter((a) => a.status === 'interview').length;
  const acceptedCount = allApplicants.filter((a) => a.status === 'accepted').length;

  // Filtered listings
  const filteredListings = listings.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (listingSearchQuery.trim()) {
      const q = listingSearchQuery.toLowerCase().trim();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchCat = j.category.toLowerCase().includes(q);
      const matchCity = j.city.toLowerCase().includes(q);
      return matchTitle || matchCat || matchCity;
    }
    return true;
  });

  // Filtered applicants
  const filteredApplicants = allApplicants.filter((a) => {
    if (applicantFilterStatus === 'all') return true;
    return a.status === applicantFilterStatus;
  });

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-18 right-4 z-50 max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-in fade-in duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-slate-900 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 text-xs font-semibold leading-relaxed">
            {toastMessage.text}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Command Header Bar: Modern, Minimalist & Intuitive */}
      <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          {/* Breadcrumb Context */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>KITA</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">Dasbor Manajemen Rekrutmen</span>
            <span>/</span>
            <span className="text-[#8B0026] dark:text-red-400 font-bold">UMKM Binaan</span>
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Kendali Bisnis & Talenta
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NIB Terverifikasi</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentUser.full_name} · PT Kreasi Tenun Nusantara Mandiri (Yogyakarta)
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={handleOpenCreate}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#8B0026] hover:bg-red-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pasang Lowongan Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Priority KPI Scorecards (Clean, Tabular figures, Single-elevation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Lowongan Aktif */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Lowongan Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {activeJobsCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>{listings.length} total posisi terdaftar</span>
          </div>
        </div>

        {/* Metric 2: Total Pelamar Masuk */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Pelamar Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalApplicantsCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>{interviewedCount} dalam tahap wawancara</span>
          </div>
        </div>

        {/* Metric 3: Kandidat Diterima */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Kandidat Diterima</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {acceptedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>Perekrutan berhasil resmi</span>
          </div>
        </div>

        {/* Metric 4: Legalitas Usaha */}
        <div className="bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Kepatuhan NIB</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 pt-1">
            Valid 100%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>OSS Kemendag RI Aktif</span>
          </div>
        </div>
      </div>

      {/* 3. Intuitive Dashboard View Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1 sm:gap-2 pb-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'overview'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ringkasan Usaha</span>
          </button>

          <button
            onClick={() => setActiveView('listings')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'listings'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Manajemen Lowongan ({listings.length})</span>
          </button>

          <button
            onClick={() => setActiveView('applicants')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'applicants'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kandidat Masuk ({totalApplicantsCount})</span>
          </button>

          <button
            onClick={() => setActiveView('profile')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'profile'
                ? 'bg-[#8B0026] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Legalitas Profil</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden lg:block shrink-0">
          Sinkronisasi Otomatis · Kemnaker & OSS
        </div>
      </div>

      {/* 4. Active View Rendering */}

      {/* VIEW A: OVERVIEW */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Quick Overview Split: Active Jobs Summary + Recent Applicants Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Vacancies Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Lowongan Usaha Anda Saat Ini
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Posisi kerja yang sedang tayang di bursa kerja KITA
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('listings')}
                  className="text-xs font-bold text-[#8B0026] dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <span>Kelola Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {listings.length === 0 ? (
                <div className="bg-white dark:bg-[#111827] p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada lowongan terdaftar.</p>
                  <button
                    onClick={handleOpenCreate}
                    className="mt-2 py-2 px-4 bg-[#8B0026] text-white text-xs font-bold rounded-xl"
                  >
                    Buat Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{job.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              job.status === 'published'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {job.status === 'published' ? 'Aktif' : 'Ditutup'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{job.category}</span>
                          <span>·</span>
                          <span>{job.city}</span>
                          <span>·</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatRupiah(job.min_salary)} - {formatRupiah(job.max_salary)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setSelectedJobForApplicants(job);
                          }}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applications_count || 0} Pelamar</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: Recent Candidates Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Pelamar Terbaru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Berkas kandidat yang masuk
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('applicants')}
                  className="text-xs font-bold text-[#8B0026] dark:text-red-400 hover:underline"
                >
                  Semua
                </button>
              </div>

              <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
                {allApplicants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada berkas pelamar masuk.
                  </div>
                ) : (
                  allApplicants.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApplicant(app)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#8B0026] dark:text-red-400 font-black flex items-center justify-center text-xs shrink-0">
                          {app.seeker_name?.substring(0, 2).toUpperCase() || 'PL'}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {app.seeker_name || 'Pelamar KITA'}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {app.job_title}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize shrink-0">
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: LISTINGS MANAGEMENT */}
      {activeView === 'listings' && (
        <div className="space-y-4">
          {/* Controls Bar: Search + Status Filter */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={listingSearchQuery}
                onChange={(e) => setListingSearchQuery(e.target.value)}
                placeholder="Cari posisi lowongan Anda..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua ({listings.length})
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'published'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Aktif ({activeJobsCount})
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'closed'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ditutup ({closedJobsCount})
              </button>
            </div>
          </div>

          {/* High-density Listings Table */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
            {filteredListings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Tidak ada lowongan yang sesuai kriteria filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredListings.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{job.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.status === 'published'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {job.status === 'published' ? 'Aktif' : 'Ditutup'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>{job.category}</span>
                        <span>·</span>
                        <span>{job.city}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatRupiah(job.min_salary)} - {formatRupiah(job.max_salary)}
                        </span>
                        <span>·</span>
                        <span>Dipublikasikan: {new Date(job.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => setSelectedJobForApplicants(job)}
                        className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{job.applications_count || 0} Pelamar</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatus(job.id, job.status)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                          job.status === 'published'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {job.status === 'published' ? 'Tutup' : 'Buka'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: APPLICANTS PIPELINE */}
      {activeView === 'applicants' && (
        <div className="space-y-4">
          {/* Status Pipeline Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'Semua Pelamar' },
              { id: 'submitted', label: 'Lamaran Masuk' },
              { id: 'reviewing', label: 'Sedang Ditelaah' },
              { id: 'interview', label: 'Tahap Wawancara' },
              { id: 'accepted', label: 'Diterima' },
              { id: 'rejected', label: 'Ditolak' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setApplicantFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  applicantFilterStatus === st.id
                    ? 'bg-[#8B0026] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
            {filteredApplicants.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Belum ada pelamar di kategori status ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApplicants.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplicant(app)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#8B0026] dark:text-red-400 font-extrabold flex items-center justify-center shrink-0 text-xs">
                        {app.seeker_name?.substring(0, 2).toUpperCase() || 'PL'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {app.seeker_name || 'Pelamar Kerja'}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {app.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#8B0026] dark:text-red-400 font-semibold mt-0.5">
                          {app.job_title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {app.seeker_email} · {app.seeker_city || 'Indonesia'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#8B0026] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors self-end sm:self-auto flex items-center gap-1"
                    >
                      <span>Tinjau Berkas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW D: PROFILE & LEGALITY */}
      {activeView === 'profile' && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Legalitas Badan Usaha UMKM</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verifikasi NIB & Kemitraan Ketenagakerjaan Resmi</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>NIB Terverifikasi Sah</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px]">Nama Perusahaan / Merek:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">PT Kreasi Tenun Nusantara Mandiri</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px]">Nomor Induk Berusaha (NIB):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">0220108920194 (OSS R.I.)</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px]">NPWP Badan Usaha:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">01.234.567.8-541.000</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px]">Domisili Kantor & Studio:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Jl. Prawirotaman No. 18, Yogyakarta</span>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Review Drawer Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedApplicant.seeker_name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Posisi: {selectedApplicant.job_title}</p>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedApplicant.seeker_email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telepon / WhatsApp:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedApplicant.seeker_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Melamar:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{new Date(selectedApplicant.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Surat Pengantar Lamaran:</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
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
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 text-[#8B0026] dark:text-red-300 rounded-2xl font-bold transition-colors"
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
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Tindak Lanjut & Tahap Seleksi:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, 'reviewing')}
                    className="p-2 text-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-xs"
                  >
                    Ditelaah
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, 'interview')}
                    className="p-2 text-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 text-xs"
                  >
                    Wawancara
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, 'accepted')}
                    className="p-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-xs"
                  >
                    Diterima
                  </button>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, 'rejected')}
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

      {/* Modal: Create or Edit Job Listing */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingJobId ? 'Perbarui Lowongan Pekerjaan' : 'Publikasikan Lowongan Pekerjaan Baru'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Posisi Lowongan <span className="text-[#8B0026]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Barista Senior, Desainer Grafis, Staf Gudang"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sektor</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="F&B / Kuliner">F&B / Kuliner</option>
                    <option value="Logistik & Rantai Pasok">Logistik & Rantai Pasok</option>
                    <option value="Perbankan & Keuangan">Perbankan & Keuangan</option>
                    <option value="Teknologi & IT">Teknologi & IT</option>
                    <option value="Desain & Industri Kreatif">Desain & Industri Kreatif</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Kerja</label>
                  <select
                    value={formJobType}
                    onChange={(e) => setFormJobType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="fulltime">Penuh Waktu (Full Time)</option>
                    <option value="parttime">Paruh Waktu (Part Time)</option>
                    <option value="freelance">Freelance / Proyek</option>
                    <option value="internship">Magang</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lokasi Kerja</label>
                  <select
                    value={formWorkplace}
                    onChange={(e) => setFormWorkplace(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="onsite">On-site (Lokasi)</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote (WFH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kota Penempatan</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Bandung, Yogyakarta, dsb"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gaji Min (Rp)</label>
                    <input
                      type="number"
                      value={formMinSalary}
                      onChange={(e) => setFormMinSalary(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gaji Max (Rp)</label>
                    <input
                      type="number"
                      value={formMaxSalary}
                      onChange={(e) => setFormMaxSalary(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Pekerjaan <span className="text-[#8B0026]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan peran kerja, tanggung jawab harian, dan lingkungan kerja..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#8B0026] hover:bg-red-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {formSubmitting ? 'Menyimpan...' : editingJobId ? 'Perbarui Lowongan' : 'Publikasikan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
