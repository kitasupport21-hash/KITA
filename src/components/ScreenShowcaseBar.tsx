import React, { useState } from 'react';
import { Smartphone, Monitor, Sun, Moon, X, Layers, SlidersHorizontal } from 'lucide-react';
import { useTheme } from './ThemeContext.js';

export type ScreenId =
  | 'splash'
  | 'login'
  | 'home'
  | 'search'
  | 'job-detail'
  | 'apply-form'
  | 'applications'
  | 'companies'
  | 'locations'
  | 'profile'
  | 'dashboard';

interface ScreenShowcaseBarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
}

export const SCREENS: { id: ScreenId; number: number; name: string }[] = [
  { id: 'home', number: 1, name: 'Beranda' },
  { id: 'search', number: 2, name: 'Pencarian Lowongan' },
  { id: 'job-detail', number: 3, name: 'Detail Lowongan' },
  { id: 'apply-form', number: 4, name: 'Formulir Lamaran' },
  { id: 'applications', number: 5, name: 'Lamaran Saya' },
  { id: 'companies', number: 6, name: 'Perusahaan' },
  { id: 'locations', number: 7, name: 'Lokasi di Indonesia' },
  { id: 'profile', number: 8, name: 'Profil & Pengaturan' },
  { id: 'dashboard', number: 9, name: 'Dasbor Rekrutmen' },
  { id: 'login', number: 10, name: 'Login Minimalis' },
  { id: 'splash', number: 11, name: 'Splash Screen' }
];

export const ScreenShowcaseBar: React.FC<ScreenShowcaseBarProps> = ({
  currentScreen,
  onSelectScreen,
  isMobileFrame,
  onToggleFrame
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kita_nav_bar_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('kita_nav_bar_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem('kita_nav_bar_dismissed');
    } catch {
      // ignore
    }
  };

  if (isDismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={handleRestore}
          className="px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white text-[11px] font-bold border border-slate-700 shadow-2xl flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Tampilkan Pengaturan Tampilan & Layar"
        >
          <Layers className="w-3.5 h-3.5 text-red-400" />
          <span>Navigasi Layar</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Navigasi Layar KITA"
      className="bg-slate-900 text-white border-b border-slate-800 text-xs px-3 py-2 z-50 sticky top-0 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Active indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-white text-xs tracking-tight">
            KITA
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Navigasi Layar
          </span>
        </div>

        {/* Screen Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full py-0.5">
          {SCREENS.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScreen(s.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#8B0026] text-white shadow-xs ring-1 ring-red-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className="opacity-70 font-semibold">{s.number}.</span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Actions: Dark mode + Viewport Frame Toggle + Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
            title={isDark ? 'Mode Terang' : 'Mode Gelap (Dark Mode)'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>
          <button
            onClick={onToggleFrame}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isMobileFrame
                ? 'bg-red-950/80 text-red-200 border border-red-800'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Ubah Mode Tampilan Lebar / Mobile"
          >
            {isMobileFrame ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-red-400" />
                <span>Mode Mobile</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Mode Layar Penuh</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-0.5"
            title="Sembunyikan bilah ini (Tampilan Real App Bersih)"
            aria-label="Tutup bilah navigasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
