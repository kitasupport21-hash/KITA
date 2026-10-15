import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import type { User } from '../../shared/types.js';
import { api, setClientToken } from '../../lib/api.js';
import { useTheme } from '../ThemeContext.js';

interface LoginScreenViewProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateBack: () => void;
}

export const LoginScreenView: React.FC<LoginScreenViewProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateBack
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: identifier, password });
      if (res.success && res.data) {
        setClientToken(res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError('Email atau kata sandi tidak cocok.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali informasi Anda.');
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(false);
    setError('Pemulihan kata sandi belum diaktifkan karena layanan email belum dikonfigurasi. Hubungi administrator platform.');
  };

  return (
    <div className="min-h-[580px] flex items-center justify-center p-3 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-200">
        {/* Subtle Top Crimson Micro-Line */}
        <div className="h-1.5 w-full bg-[#8B0026]" />

        {/* Header Bar */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            {/* Dark Mode Toggle directly inside login screen */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Logo & Headline */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#8B0026] text-white flex items-center justify-center font-black text-sm shadow-xs">
                KI
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                KITA
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight pt-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              Masuk untuk memantau lamaran kerja, proyek freelance, dan ekosistem UMKM.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#8B0026] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {forgotPasswordOpen ? (
            /* Minimalist Forgot Password */
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Pemulihan Akun</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pemulihan kata sandi belum tersedia karena layanan email belum dikonfigurasi. Hubungi administrator platform.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 text-center space-y-2">
                  <p className="font-bold">Tautan Pemulihan Dikirim!</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Silakan periksa kotak masuk email di <strong>{forgotEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordOpen(false);
                      setForgotSuccess(false);
                    }}
                    className="mt-2 py-2 px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                  >
                    Kembali ke Masuk
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026]"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#8B0026] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Kirim Tautan
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Minimalist Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Identifier Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email atau No. Handphone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-[11px] font-semibold text-[#8B0026] dark:text-red-400 hover:underline"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-[#8B0026] focus:ring-1 focus:ring-[#8B0026] transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Session security: the server uses an HttpOnly session cookie. */}
              <div className="flex items-center justify-end pt-0.5">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sesi aman melalui cookie</span>
                </span>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#8B0026] hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>


              {/* Register Link */}
              <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Belum memiliki akun KITA? </span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-extrabold text-[#8B0026] dark:text-red-400 hover:underline"
                >
                  Daftar Sekarang
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
