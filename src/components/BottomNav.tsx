import React from 'react';
import type { UserRole } from '../shared/types.js';
import {
  Home,
  Search,
  Briefcase,
  FileText,
  Building2,
  Users,
  User as UserIcon,
} from 'lucide-react';

interface BottomNavProps {
  currentUser: {
    id: string;
    role: UserRole;
    full_name: string;
    avatar_url?: string;
  } | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  onSelectTab
}) => {
  const isEmployer = currentUser?.role === 'employer';

  const navItems = isEmployer
    ? [
        { id: 'home', label: 'Beranda', icon: Home },
        { id: 'employer-dashboard', label: 'Lowongan', icon: Briefcase },
        { id: 'employer-applicants', label: 'Pelamar', icon: Users },
        { id: 'profile', label: 'Profil', icon: UserIcon }
      ]
    : [
        { id: 'home', label: 'Beranda', icon: Home },
        { id: 'search', label: 'Cari', icon: Search },
        { id: 'companies', label: 'Perusahaan', icon: Building2 },
        { id: 'applications', label: 'Lamaran', icon: FileText },
        { id: 'profile', label: 'Profil', icon: UserIcon }
      ];

  const isTabActive = (itemId: string) => {
    if (itemId === 'home') return activeTab === 'home' || activeTab === 'marketplace';
    if (itemId === 'search') return activeTab === 'search' || activeTab === 'job-search';
    if (itemId === 'applications') return activeTab === 'applications' || activeTab === 'seeker-applications';
    if (itemId === 'companies') return activeTab === 'companies';
    if (itemId === 'profile') return activeTab === 'profile';
    return activeTab === itemId;
  };

  const gridColsClass = navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <nav
      aria-label="Navigasi Utama Bawah"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-colors duration-200"
    >
      <div className={`grid ${gridColsClass} items-center max-w-md mx-auto`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isTabActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] active:scale-95 ${
                active
                  ? 'text-[#8B0026] dark:text-red-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B0026] dark:bg-red-400" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
