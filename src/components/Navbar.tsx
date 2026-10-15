import React, { useState, useEffect } from 'react';
import type { User, UserRole, NotificationItem } from '../shared/types.js';
import { api } from '../lib/api.js';
import { KitaLogo } from './KitaLogo.js';
import { useTheme } from './ThemeContext.js';
import {
  Briefcase,
  Building2,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  FileText,
  Bell,
  Search,
  MapPin,
  Moon,
  Sun
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res.success) setNotifications(res.data);
      } catch {
        // silent
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      }
    } catch {
      // silent
    }
    setNotificationsOpen(false);
    if (notif.link?.includes('/jobs')) {
      onSelectTab('search');
    } else if (notif.link?.includes('/seeker/applications')) {
      onSelectTab('applications');
    } else if (notif.link?.includes('/employer')) {
      onSelectTab('employer-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Logo Brand */}
          <div
            className="cursor-pointer shrink-0"
            onClick={() => onSelectTab('marketplace')}
          >
            <KitaLogo size="md" showTagline={true} />
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onSelectTab('marketplace')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'marketplace' || activeTab === 'home'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </button>
            <button
              onClick={() => onSelectTab('job-search')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'job-search' || activeTab === 'search'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Lowongan</span>
            </button>
            <button
              onClick={() => onSelectTab('companies')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'companies'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Perusahaan</span>
            </button>
            <button
              onClick={() => onSelectTab('locations')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'locations'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta Wilayah</span>
            </button>

            {currentUser?.role === 'seeker' && (
              <button
                onClick={() => onSelectTab('seeker-applications')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                  activeTab === 'seeker-applications' || activeTab === 'applications'
                    ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lamaran Saya</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('employer-dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'employer-dashboard' || activeTab === 'dashboard'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dasbor UMKM</span>
            </button>

            {currentUser?.role === 'employer' && (
              <button
                onClick={() => onSelectTab('employer-applicants')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                  activeTab === 'employer-applicants'
                    ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pelamar Masuk</span>
              </button>
            )}


            <button
              onClick={() => onSelectTab('support')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeTab === 'support'
                  ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Bantuan</span>
            </button>
          </nav>

          {/* Zone 3: Actions + Dark Mode Toggle + Profile */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle Button (Prominent for dashboard & app) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#8B0026] dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
                  title="Pemberitahuan Lowongan"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#8B0026] rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Notifikasi KITA</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#8B0026] dark:text-red-300 px-1.5 py-0.2 rounded-full">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#8B0026] dark:text-red-400 hover:underline font-bold"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada pemberitahuan baru
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                              !notif.is_read ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className={`text-xs ${!notif.is_read ? 'text-[#8B0026] dark:text-red-300 font-bold' : 'text-slate-800 dark:text-slate-200 font-semibold'}`}>
                                {notif.title}
                              </span>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-[#8B0026] shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar or Login CTA */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectTab('profile')}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-[#8B0026] dark:text-red-300 font-extrabold flex items-center justify-center text-xs">
                    {currentUser.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {currentUser.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {currentUser.role === 'employer' ? 'UMKM NIB' : currentUser.role === 'admin' ? 'Admin RI' : 'Pencari Kerja'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className="p-2 text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#8B0026] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Masuk
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#8B0026] hover:bg-red-800 rounded-xl shadow-xs transition-colors"
                >
                  Daftar
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top duration-150">
          <button
            onClick={() => {
              onSelectTab('marketplace');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
            <span>Beranda</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('job-search');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
            <span>Cari Lowongan</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('companies');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
            <span>Direktori Perusahaan & UMKM</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('locations');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
            <span>Peta Wilayah Indonesia</span>
          </button>
          {currentUser?.role === 'seeker' && (
            <button
              onClick={() => {
                onSelectTab('seeker-applications');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
              <span>Lamaran Saya</span>
            </button>
          )}
          {currentUser?.role === 'employer' && (
            <>
              <button
                onClick={() => {
                  onSelectTab('employer-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span>Dasbor UMKM</span>
              </button>
              <button
                onClick={() => {
                  onSelectTab('employer-applicants');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span>Pelamar Masuk</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              onSelectTab('support');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <LifeBuoy className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
            <span>Pusat Bantuan & Pengaduan</span>
          </button>
        </div>
      )}
    </header>
  );
};
