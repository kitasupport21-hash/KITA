/**
 * KITA - Bursa Kerja, Freelance & Ekosistem UMKM Indonesia
 * Root Application Component with Exact 10-Screen Reference Recreation,
 * Dark Mode Dashboard Support, and Optimized Performance.
 */
import React, { useState, useEffect } from 'react';
import { api, setClientToken } from './lib/api.js';
import type { User, UserRole, JobListing } from './shared/types.js';
import { ThemeProvider, useTheme } from './components/ThemeContext.js';
import { Navbar } from './components/Navbar.js';
import { BottomNav } from './components/BottomNav.js';
import { AuthModal } from './components/AuthModal.js';
import { EmployerDashboard } from './components/EmployerDashboard.js';
import { EmployerApplicantsView } from './components/EmployerApplicantsView.js';
import { SupportInboxView } from './components/SupportInboxView.js';
import { ScreenShowcaseBar, type ScreenId } from './components/ScreenShowcaseBar.js';

// Dedicated 10 Screen Components
import { SplashScreenView } from './components/screens/SplashScreenView.js';
import { LoginScreenView } from './components/screens/LoginScreenView.js';
import { HomeScreenView } from './components/screens/HomeScreenView.js';
import { SearchScreenView } from './components/screens/SearchScreenView.js';
import { JobDetailScreenView } from './components/screens/JobDetailScreenView.js';
import { ApplyFormScreenView } from './components/screens/ApplyFormScreenView.js';
import { MyApplicationsScreenView } from './components/screens/MyApplicationsScreenView.js';
import { CompaniesScreenView } from './components/screens/CompaniesScreenView.js';
import { LocationsScreenView } from './components/screens/LocationsScreenView.js';
import { ProfileSettingsScreenView } from './components/screens/ProfileSettingsScreenView.js';

import {
  CheckCircle2,
  Wifi,
  Battery,
  Signal,
  Building2,
  Users,
  Bell,
  X,
  ArrowRight
} from 'lucide-react';

function AppContent() {
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Active Screen (1-10) or Role Management view
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [activeTab, setActiveTab] = useState<string>('home');

  // Mobile Frame Viewport preview toggle (Android Mockup vs Responsive Mode)
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Jobs state for search, detail, and apply screens
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [searchInitialKeyword, setSearchInitialKeyword] = useState<string>('');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('seeker');

  // Notifications modal state
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Restore authenticated session on initial mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const [meRes, jobsRes] = await Promise.all([
          api.getMe().catch(() => ({ success: false, data: { user: null } })),
          api.getJobs().catch(() => ({ success: false, data: [] }))
        ]);
        if (meRes.success && meRes.data?.user) {
          setCurrentUser(meRes.data.user);
          const notifRes = await api.getNotifications().catch(() => ({ success: false, data: [] }));
          if (notifRes.success && notifRes.data) setNotifications(notifRes.data);
        }
        if (jobsRes.success && jobsRes.data) {
          setJobs(jobsRes.data);
          if (jobsRes.data.length > 0) {
            setSelectedJob(jobsRes.data[0]);
          }
        }
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setAuthInitialized(true);
        setJobsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', role: UserRole = 'seeker') => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    const notifRes = await api.getNotifications().catch(() => ({ success: false, data: [] }));
    setNotifications(notifRes.success && notifRes.data ? notifRes.data : []);
    showToast(`Selamat datang, ${user.full_name}! Berhasil masuk sebagai ${user.role}.`);
    if (user.role === 'employer') {
      setActiveTab('employer-dashboard');
    } else if (user.role === 'admin') {
      // Admin controls live in the separate KITA Control app. Keep this app user-facing.
      setCurrentScreen('home');
      setActiveTab('home');
    } else {
      setCurrentScreen('home');
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Continue
    }
    setClientToken(null);
    setCurrentUser(null);
    setNotifications([]);
    setCurrentScreen('home');
    setActiveTab('home');
    showToast('Anda telah keluar dari akun KITA.');
  };


  const handleToggleBookmark = async (jobId: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    try {
      const res = await api.toggleSaveJob(jobId);
      if (res.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, is_saved: res.saved } : j))
        );
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob((prev) => (prev ? { ...prev, is_saved: res.saved } : null));
        }
        showToast(res.message);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan lowongan.');
    }
  };

  const handleSelectJob = (job: JobListing) => {
    setSelectedJob(job);
    setCurrentScreen('job-detail');
  };

  const handleNavigateToSearch = (cat?: string) => {
    setSearchInitialKeyword(cat || '');
    setCurrentScreen('search');
    setActiveTab('search');
  };

  const handleSelectLocation = (prov: string, city?: string) => {
    if (prov === 'Semua Provinsi' && !city) {
      setSearchInitialKeyword('');
    } else {
      setSearchInitialKeyword(city || prov);
    }
    setCurrentScreen('search');
    setActiveTab('search');
  };

  const handleSelectCompanyJobs = (companyName: string) => {
    setSearchInitialKeyword(companyName);
    setCurrentScreen('search');
    setActiveTab('search');
  };

  const handleBottomTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'home' || tabId === 'marketplace') {
      setCurrentScreen('home');
    } else if (tabId === 'search' || tabId === 'job-search') {
      setCurrentScreen('search');
    } else if (tabId === 'companies') {
      setCurrentScreen('companies');
    } else if (tabId === 'locations') {
      setCurrentScreen('locations');
    } else if (tabId === 'applications' || tabId === 'seeker-applications') {
      setCurrentScreen('applications');
    } else if (tabId === 'profile') {
      setCurrentScreen('profile');
    } else if (tabId === 'employer-dashboard' || tabId === 'employer-applicants' || tabId === 'support') {
      // These role-based views are rendered from activeTab; keep screen state valid.
      setCurrentScreen('home');
    }
  };


  const handleShowcaseSelect = (screenId: ScreenId) => {
    setCurrentScreen(screenId);
    if (screenId === 'home') setActiveTab('home');
    if (screenId === 'search') setActiveTab('search');
    if (screenId === 'companies') setActiveTab('companies');
    if (screenId === 'locations') setActiveTab('locations');
    if (screenId === 'applications') setActiveTab('applications');
    if (screenId === 'profile') setActiveTab('profile');
    if (screenId === 'dashboard') {
      if (currentUser?.role === 'employer') setActiveTab('employer-dashboard');
      else handleOpenAuth('login', 'employer');
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-16 h-16 rounded-3xl bg-[#8B0026] flex items-center justify-center text-white font-black text-2xl shadow-xl animate-pulse mb-3">
          KI
        </div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Memuat Bursa Kerja KITA...</p>
      </div>
    );
  }

  const renderScreenContent = () => {
    // If user explicitly browses employer/support views via navbar
    if (activeTab === 'employer-dashboard') {
      return currentUser?.role === 'employer' ? (
        <EmployerDashboard currentUser={currentUser} />
      ) : (
        <div className="bg-white dark:bg-[#111827] p-8 text-center rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-md mx-auto my-12 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Dasbor Manajemen Rekrutmen UMKM</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Halaman ini khusus untuk akun perusahaan. Silakan masuk dengan akun employer Anda atau daftar sebagai employer untuk mengelola lowongan dan berkas pelamar.
          </p>
          <button onClick={() => handleOpenAuth('login', 'employer')} className="mt-2 w-full py-3 bg-[#8B0026] text-white text-xs font-bold rounded-xl">Masuk sebagai Employer</button>
        </div>
      );
    }

    if (activeTab === 'employer-applicants') {
      return currentUser?.role === 'employer' ? (
        <EmployerApplicantsView
          currentUser={currentUser}
          onNavigateToListings={() => setActiveTab('employer-dashboard')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8">
          <Users className="w-10 h-10 text-[#8B0026] dark:text-red-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Akses Berkas Pelamar UMKM</h3>
          <button onClick={() => handleOpenAuth('login', 'employer')} className="mt-4 px-4 py-2 bg-[#8B0026] text-white text-xs font-bold rounded-xl">Masuk sebagai Employer</button>
        </div>
      );
    }


    if (activeTab === 'support') {
      return (
        <SupportInboxView
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth('login')}
        />
      );
    }

    if (activeTab === 'locations') {
      return (
        <LocationsScreenView
          onSelectLocation={handleSelectLocation}
          onNavigateBack={() => {
            setCurrentScreen('home');
            setActiveTab('home');
          }}
        />
      );
    }

    // 10 Blueprint Screens
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreenView
            onGetStarted={() => {
              setCurrentScreen('home');
              setActiveTab('home');
            }}
            onOpenLogin={() => {
              setCurrentScreen('login');
            }}
          />
        );
      case 'login':
        return (
          <LoginScreenView
            onLoginSuccess={handleAuthSuccess}
            onNavigateToRegister={() => handleOpenAuth('register')}
            onNavigateBack={() => {
              setCurrentScreen('home');
              setActiveTab('home');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreenView
            currentUser={currentUser}
            jobs={jobs}
            loading={jobsLoading}
            onSelectJob={handleSelectJob}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToLocations={() => setCurrentScreen('locations')}
            onNavigateToCompanies={() => setCurrentScreen('companies')}
            onToggleBookmark={handleToggleBookmark}
            onOpenNotifications={() => setNotificationsModalOpen(true)}
            unreadNotificationCount={notifications.filter((n) => !n.is_read).length}
            onOpenAuth={() => handleOpenAuth('login')}
            onPostJob={() => {
              if (currentUser?.role === 'employer') {
                setActiveTab('employer-dashboard');
              } else {
                handleOpenAuth('login', 'employer');
              }
            }}
          />
        );
      case 'search':
        return (
          <SearchScreenView
            jobs={jobs}
            loading={jobsLoading}
            onSelectJob={handleSelectJob}
            onToggleBookmark={handleToggleBookmark}
            initialKeyword={searchInitialKeyword}
          />
        );
      case 'job-detail':
        return (
          <JobDetailScreenView
            job={selectedJob || jobs[0]}
            currentUser={currentUser}
            onNavigateBack={() => setCurrentScreen('search')}
            onApplyNow={() => setCurrentScreen('apply-form')}
            onToggleBookmark={handleToggleBookmark}
            onNavigateToCompany={handleSelectCompanyJobs}
          />
        );
      case 'apply-form':
        return (
          <ApplyFormScreenView
            job={selectedJob || jobs[0]}
            currentUser={currentUser}
            onNavigateBack={() => setCurrentScreen('job-detail')}
            onApplySuccess={() => {
              showToast('Lamaran berhasil dikirimkan!');
              setCurrentScreen('applications');
              setActiveTab('applications');
            }}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        );
      case 'applications':
        return (
          <MyApplicationsScreenView
            currentUser={currentUser}
            onExploreJobs={() => {
              setCurrentScreen('search');
              setActiveTab('search');
            }}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        );
      case 'companies':
        return (
          <CompaniesScreenView
            onSelectCompanyJobs={handleSelectCompanyJobs}
          />
        );
      case 'locations':
        return (
          <LocationsScreenView
            onSelectLocation={handleSelectLocation}
            onNavigateBack={() => {
              setCurrentScreen('home');
              setActiveTab('home');
            }}
          />
        );
      case 'profile':
        return (
          <ProfileSettingsScreenView
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAuth={() => handleOpenAuth('login')}
            onUserUpdated={setCurrentUser}
            onNavigateToBookmarks={() => {
              setCurrentScreen('search');
              setActiveTab('search');
            }}
          />
        );
      case 'dashboard':
        return currentUser?.role === 'employer' ? (
          <EmployerDashboard currentUser={currentUser} />
        ) : (
          <div className="max-w-md mx-auto p-6 text-center">Silakan masuk dengan akun employer untuk membuka dashboard.</div>
        );
      default:
        return (
          <HomeScreenView
            currentUser={currentUser}
            jobs={jobs}
            loading={jobsLoading}
            onSelectJob={handleSelectJob}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToLocations={() => setCurrentScreen('locations')}
            onNavigateToCompanies={() => setCurrentScreen('companies')}
            onToggleBookmark={handleToggleBookmark}
            onOpenNotifications={() => setNotificationsModalOpen(true)}
            unreadNotificationCount={notifications.filter((n) => !n.is_read).length}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0b0f19] flex flex-col text-slate-900 dark:text-slate-100 pb-20 md:pb-0 transition-colors duration-200">

      {/* 2. Toast Notification Feedback */}
      {toastMessage && (
        <div className="fixed top-12 right-4 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3. Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'marketplace' || tab === 'home') setCurrentScreen('home');
          if (tab === 'job-search' || tab === 'search') setCurrentScreen('search');
          if (tab === 'companies') setCurrentScreen('companies');
          if (tab === 'locations') setCurrentScreen('locations');
          if (tab === 'seeker-applications' || tab === 'applications') setCurrentScreen('applications');
          if (tab === 'profile') setCurrentScreen('profile');
          if (tab === 'employer-dashboard' || tab === 'employer-applicants' || tab === 'support') setCurrentScreen('home');
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* 4. Main Viewport Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {isMobileFrame ? (
          /* Realistic Android Phone Frame Mockup Container */
          <div className="max-w-[420px] mx-auto bg-slate-900 p-3 rounded-[44px] shadow-2xl border-4 border-slate-800">
            <div className="bg-[#FAF9F8] dark:bg-[#0b0f19] rounded-[36px] overflow-hidden min-h-[740px] flex flex-col relative border border-slate-700/50 shadow-inner transition-colors">
              {/* Android Status Bar */}
              <div className="bg-white/95 dark:bg-slate-900/95 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 shrink-0 select-none border-b border-slate-100 dark:border-slate-800">
                <span>09:41</span>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-900/90 dark:bg-slate-700 border border-slate-700" />
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>
              {/* Screen Body */}
              <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
                {renderScreenContent()}
              </div>
              {/* Android Gesture Bar */}
              <div className="py-2 flex justify-center bg-white dark:bg-slate-900 shrink-0 border-t border-slate-100 dark:border-slate-800">
                <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {renderScreenContent()}
          </div>
        )}
      </main>

      {/* 5. Mobile Bottom Navigation */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={handleBottomTabSelect}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* 6. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
        initialRole={authRole}
      />

      {/* 7. Notifications Modal */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Notifikasi Akun</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Pembaruan lowongan, lamaran, & sistem</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {notifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                  <Bell className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada notifikasi</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Notifikasi akan muncul setelah ada aktivitas akun atau pembaruan yang nyata.</p>
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
                    );
                    api.markNotificationRead(n.id).catch(() => {});
                    setNotificationsModalOpen(false);
                    const target = String(n.link || '').toLowerCase();
                    if (target.includes('employer')) {
                      setActiveTab('employer-dashboard');
                    } else if (n.type === 'job' || target.includes('job')) {
                      setCurrentScreen('search');
                      setActiveTab('search');
                    } else if (n.type === 'application' || target.includes('application') || target.includes('lamaran')) {
                      setCurrentScreen('applications');
                      setActiveTab('applications');
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    n.is_read
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70'
                      : 'bg-red-50/40 dark:bg-red-950/30 border-red-200 dark:border-red-900 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#8B0026] dark:bg-red-400 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-slate-400 mt-2 block">
                    {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · Ketuk untuk membuka
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
                  api.markAllNotificationsRead().catch(() => {});
                  showToast('Semua notifikasi ditandai sudah dibaca.');
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Tandai Dibaca
              </button>
              <button
                type="button"
                onClick={() => setNotificationsModalOpen(false)}
                className="py-2.5 px-4 bg-[#8B0026] hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
