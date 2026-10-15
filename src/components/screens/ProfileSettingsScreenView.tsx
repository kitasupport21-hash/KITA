import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  FileText,
  Bookmark,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import type { User } from '../../shared/types.js';
import { useTheme } from '../ThemeContext.js';
import { api } from '../../lib/api.js';

interface ProfileSettingsScreenViewProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onNavigateToBookmarks: () => void;
  onUserUpdated: (user: User) => void;
}

export const ProfileSettingsScreenView: React.FC<ProfileSettingsScreenViewProps> = ({
  currentUser,
  onLogout,
  onOpenAuth,
  onNavigateToBookmarks,
  onUserUpdated
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.full_name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editCity, setEditCity] = useState(currentUser?.city || '');

  useEffect(() => {
    setEditName(currentUser?.full_name || '');
    setEditPhone(currentUser?.phone || '');
    setEditCity(currentUser?.city || '');
  }, [currentUser?.id, currentUser?.full_name, currentUser?.phone, currentUser?.city]);

  const profileFields = [currentUser?.full_name, currentUser?.email, currentUser?.phone, currentUser?.city];
  const profileCompletion = Math.round((profileFields.filter((value) => Boolean(String(value || '').trim())).length / profileFields.length) * 100);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaveError(null);
    setSaving(true);
    try {
      if (currentUser.role === 'seeker') {
        await api.updateSeekerProfile({ full_name: editName, phone: editPhone, city: editCity });
      } else if (currentUser.role === 'employer') {
        const existing = await api.getEmployerProfile();
        const profile = existing.data || {};
        await api.updateEmployerProfile({
          full_name: editName,
          company_name: profile.company_name || editName,
          industry: profile.industry || 'Lainnya',
          company_size: profile.company_size || '1-10 Karyawan',
          city: editCity,
          address: profile.address || '',
          province: profile.province || 'Indonesia',
          phone: editPhone,
        });
      } else {
        throw new Error('Profil administrator hanya dapat diubah melalui pengaturan admin.');
      }
      const refreshed = await api.getMe();
      if (refreshed.success && refreshed.data?.user) onUserUpdated(refreshed.data.user);
      setSavedSuccess(true);
      setTimeout(() => { setSavedSuccess(false); setEditProfileOpen(false); }, 1000);
    } catch (error: any) {
      setSaveError(error?.message || 'Profil gagal disimpan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 p-10 text-center rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8 shadow-xs space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto font-black text-xl">
          KI
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Masuk ke Profil Akun</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Silakan masuk untuk mengelola berkas CV, preferensi notifikasi, dan pengaturan akun Anda.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-3 w-full py-2.5 bg-[#8B0026] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-800 transition-colors"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-6 transition-colors duration-200">
      {/* 1. User Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#8B0026] text-white flex items-center justify-center font-black text-xl shadow-xs ring-4 ring-red-50 dark:ring-red-950">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {currentUser.full_name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentUser.role === 'employer' ? 'Rekruter UMKM' : currentUser.role === 'admin' ? 'Admin RI' : 'Pencari Kerja'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>{currentUser.city || 'Indonesia'}</span>
                <span>·</span>
                <span>{currentUser.phone || '0812xxxx'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditProfileOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Edit Profil"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Completion Meter */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Kelengkapan Profil</span>
            <span className="text-[#8B0026] dark:text-red-400">{profileCompletion}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#8B0026] rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveSubModal('cv')}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto mb-1.5">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">CV & Berkas</span>
          <span className="text-[10px] text-slate-400 block">Berkas lamaran</span>
        </button>
        <button
          onClick={onNavigateToBookmarks}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-1.5">
            <Bookmark className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tersimpan</span>
          <span className="text-[10px] text-slate-400 block">Lowongan Favorit</span>
        </button>
        <button
          onClick={() => setActiveSubModal('skills')}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Keahlian</span>
          <span className="text-[10px] text-slate-400 block">Profil keahlian</span>
        </button>
      </div>

      {/* 3. Settings Menu List with Dark Mode Option */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {/* Dark Mode Row */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tema Tampilan (Dark Mode)</span>
              <span className="text-[10px] text-slate-400">
                {isDark ? 'Mode gelap aktif (ramah mata)' : 'Mode terang aktif'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              isDark ? 'bg-[#8B0026]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Informasi Akun */}
        <button
          onClick={() => setEditProfileOpen(true)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Informasi Pribadi</span>
              <span className="text-[10px] text-slate-400">Nama, email, telepon, domisili</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Notifikasi */}
        <button
          onClick={() => setActiveSubModal('notifs')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Notifikasi & Job Alert</span>
              <span className="text-[10px] text-slate-400">Pemberitahuan lowongan baru & panggilan</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Keamanan */}
        <button
          onClick={() => setActiveSubModal('security')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Keamanan & Sandi</span>
              <span className="text-[10px] text-slate-400">Enkripsi data & verifikasi login</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Bantuan & Kemnaker */}
        <button
          onClick={() => setActiveSubModal('help')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Pusat Bantuan & Kebijakan</span>
              <span className="text-[10px] text-slate-400">Standar Kemnaker RI & anti-scam</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      {/* Account actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <button
          onClick={onLogout}
          className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun KITA</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Perbarui Informasi Pribadi</h3>
              <button
                onClick={() => setEditProfileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl text-center text-xs font-bold space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>Data Profil Berhasil Disimpan!</p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                {saveError && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">{saveError}</p>}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kota Domisili</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-[#8B0026] text-white font-bold rounded-xl shadow-xs disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
