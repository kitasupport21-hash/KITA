import React, { useEffect, useState } from 'react';
import type { User, UserRole, NotificationItem } from '../shared/types.js';
import { api } from '../lib/api.js';
import { KitaLogo } from './KitaLogo.js';
import { useTheme } from './ThemeContext.js';
import {
  Briefcase,
  Building2,
  LifeBuoy,
  LogOut,
  FileText,
  Bell,
  Search,
  MapPin,
  Moon,
  Sun,
  UserCheck,
  Menu,
  X,
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
  onLogout,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res.success) setNotifications(res.data);
      } catch {
        // Notification failures must not break the main navigation.
      }
    };

    void fetchNotifs();
    const interval = window.setInterval(fetchNotifs, 12000);
    return () => window.clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const selectTab = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      // Keep the current notification state if the request fails.
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        const res = await api.markNotificationRead(notif.id);
        if (res.success) {
          setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
        }
      }
    } catch {
      // The notification can still be opened even if marking it read fails.
    }

    setNotificationsOpen(false);
    if (notif.link?.includes('/jobs')) selectTab('search');
    else if (notif.link?.includes('/seeker/applications')) selectTab('applications');
    else if (notif.link?.includes('/employer')) selectTab('employer-dashboard');
  };

  const navButton = (tab: string, label: string, Icon: React.ElementType, active: boolean) => (
    <button
      key={tab}
      type="button"
      onClick={() => selectTab(tab)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
        active
          ? 'bg-red-50 text-[#8B0026] dark:bg-red-950/40 dark:text-red-300 font-bold'
          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <button type="button" className="cursor-pointer shrink-0" onClick={() => selectTab('marketplace')} aria-label="Kembali ke Beranda">
            <KitaLogo size="md" showTagline={true} />
          </button>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navButton('marketplace', 'Beranda', Briefcase, activeTab === 'marketplace' || activeTab === 'home')}
            {navButton('job-search', 'Cari Lowongan', Search, activeTab === 'job-search' || activeTab === 'search')}
            {navButton('companies', 'Perusahaan', Building2, activeTab === 'companies')}
            {navButton('locations', 'Peta Wilayah', MapPin, activeTab === 'locations')}
            {currentUser?.role === 'seeker' && navButton('seeker-applications', 'Lamaran Saya', FileText, activeTab === 'seeker-applications' || activeTab === 'applications')}
            {navButton('employer-dashboard', 'Dasbor UMKM', Building2, activeTab === 'employer-dashboard' || activeTab === 'dashboard')}
            {currentUser?.role === 'employer' && navButton('employer-applicants', 'Pelamar Masuk', UserCheck, activeTab === 'employer-applicants')}
            {navButton('support', 'Bantuan', LifeBuoy, activeTab === 'support')}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#8B0026] dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
                  title="Pemberitahuan Lowongan"
                  aria-label="Pemberitahuan"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#8B0026] rounded-full ring-2 ring-white dark:ring-slate-900" />}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Notifikasi KITA</span>
                        {unreadCount > 0 && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#8B0026] dark:text-red-300 px-1.5 py-0.5 rounded-full">{unreadCount} baru</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button type="button" onClick={() => void handleMarkAllRead()} className="text-[11px] text-[#8B0026] dark:text-red-400 hover:underline font-bold">
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">Belum ada pemberitahuan baru</div>
                      ) : notifications.map((notif) => (
                        <button
                          type="button"
                          key={notif.id}
                          onClick={() => void handleNotificationClick(notif)}
                          className={`w-full text-left p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!notif.is_read ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs ${!notif.is_read ? 'text-[#8B0026] dark:text-red-300 font-bold' : 'text-slate-800 dark:text-slate-200 font-semibold'}`}>{notif.title}</span>
                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#8B0026] shrink-0 mt-1" />}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <button type="button" onClick={() => selectTab('profile')} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-[#8B0026] dark:text-red-300 font-extrabold flex items-center justify-center text-xs">
                    {currentUser.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.full_name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role === 'employer' ? 'UMKM NIB' : currentUser.role === 'admin' ? 'Admin RI' : 'Pencari Kerja'}</div>
                  </div>
                </button>
                <button type="button" onClick={onLogout} title="Keluar" aria-label="Keluar" className="p-2 text-slate-400 hover:text-[#8B0026] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button type="button" onClick={() => onOpenAuth('login')} className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#8B0026] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Masuk</button>
                <button type="button" onClick={() => onOpenAuth('register')} className="px-3.5 py-2 text-xs font-bold text-white bg-[#8B0026] hover:bg-[#6f001e] rounded-xl transition-colors">Daftar</button>
              </div>
            )}

            <button type="button" className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Buka menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-3 pt-1 grid gap-1 border-t border-slate-100 dark:border-slate-800">
            {navButton('marketplace', 'Beranda', Briefcase, activeTab === 'marketplace' || activeTab === 'home')}
            {navButton('job-search', 'Cari Lowongan', Search, activeTab === 'job-search' || activeTab === 'search')}
            {navButton('companies', 'Perusahaan', Building2, activeTab === 'companies')}
            {navButton('locations', 'Peta Wilayah', MapPin, activeTab === 'locations')}
            {currentUser?.role === 'seeker' && navButton('seeker-applications', 'Lamaran Saya', FileText, activeTab === 'seeker-applications' || activeTab === 'applications')}
            {navButton('employer-dashboard', 'Dasbor UMKM', Building2, activeTab === 'employer-dashboard' || activeTab === 'dashboard')}
            {currentUser?.role === 'employer' && navButton('employer-applicants', 'Pelamar Masuk', UserCheck, activeTab === 'employer-applicants')}
            {navButton('support', 'Bantuan', LifeBuoy, activeTab === 'support')}
            {!currentUser && (
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }} className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700">Masuk</button>
                <button type="button" onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }} className="flex-1 px-3 py-2 text-xs font-bold text-white bg-[#8B0026] rounded-xl">Daftar</button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
