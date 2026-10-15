import React, { useState } from 'react';
import { api } from '../lib/api.js';
import type { User, NotificationChannel, AlertFrequency } from '../shared/types.js';
import {
  Bell,
  X,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';

interface SubscribeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  initialFilters?: {
    category?: string;
    city?: string;
    job_type?: string;
    workplace_type?: string;
    min_salary?: number;
    keyword?: string;
  };
  initialCategory?: string;
  initialCity?: string;
  onSuccess?: () => void;
}

export const SubscribeAlertModal: React.FC<SubscribeAlertModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  initialFilters = {},
  initialCategory,
  initialCity,
  onSuccess
}) => {
  if (!isOpen) return null;

  const rawCat = initialCategory || initialFilters.category;
  const rawCity = initialCity || initialFilters.city;
  const defaultCategory = rawCat && rawCat !== 'Semua' ? rawCat : 'Semua';
  const defaultCity = rawCity && rawCity !== 'Semua Kota' ? rawCity : 'Semua Kota';
  const defaultJobType = initialFilters.job_type && initialFilters.job_type !== 'Semua'
    ? initialFilters.job_type
    : 'Semua';
  const defaultWorkplace = initialFilters.workplace_type && initialFilters.workplace_type !== 'Semua'
    ? initialFilters.workplace_type
    : 'Semua';

  const defaultTitle = `Notifikasi Lowongan ${defaultCategory !== 'Semua' ? defaultCategory : 'Semua Bidang'} (${defaultCity !== 'Semua Kota' ? defaultCity : 'Nasional'})`;

  const [title, setTitle] = useState(defaultTitle);
  const [category, setCategory] = useState(defaultCategory);
  const [city, setCity] = useState(defaultCity);
  const [jobType, setJobType] = useState(defaultJobType);
  const [workplaceType, setWorkplaceType] = useState(defaultWorkplace);
  const [minSalary, setMinSalary] = useState(String(initialFilters.min_salary || '0'));
  const [channel, setChannel] = useState<NotificationChannel>('both');
  const [frequency, setFrequency] = useState<AlertFrequency>('instant');
  const [emailDestination, setEmailDestination] = useState(currentUser?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 text-center border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Masuk untuk Pasang Notifikasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Fitur langganan notifikasi email dan push tersedia bagi pencari kerja terdaftar agar tidak tertinggal lowongan terbaru.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl"
            >
              Nanti Saja
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="flex-1 py-2.5 bg-[#8B0026] text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.createJobAlert({
        title,
        category,
        city,
        job_type: jobType,
        workplace_type: workplaceType,
        min_salary: Number(minSalary) || 0,
        channel,
        frequency,
        email_destination: emailDestination
      });
      if (res.success) {
        setSuccessMsg(res.message);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1600);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan langganan notifikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#8B0026] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <div>
              <h2 className="text-sm font-bold">Pasang Notifikasi Lowongan Baru</h2>
              <p className="text-[11px] text-red-100">Dapatkan notifikasi otomatis ke email atau aplikasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8B0026]" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama / Judul Notifikasi
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Lowongan F&B di Bandung"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori Pekerjaan</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="F&B / Kuliner">F&B / Kuliner</option>
                <option value="Teknologi & IT">Teknologi & IT</option>
                <option value="Perbankan & Keuangan">Perbankan & Keuangan</option>
                <option value="Logistik & Rantai Pasok">Logistik & Rantai Pasok</option>
                <option value="Desain & Industri Kreatif">Desain & Industri Kreatif</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kota</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Semua Kota">Semua Kota di Indonesia</option>
                <option value="Jakarta Selatan">Jakarta Selatan</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Medan">Medan</option>
                <option value="Denpasar">Denpasar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Saluran Pengiriman
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('both')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  channel === 'both'
                    ? 'border-[#8B0026] bg-red-50/50 dark:bg-red-950/40 text-[#8B0026] dark:text-red-300 ring-1 ring-[#8B0026]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Zap className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span className="font-bold text-[11px]">Email & Push</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  channel === 'email'
                    ? 'border-[#8B0026] bg-red-50/50 dark:bg-red-950/40 text-[#8B0026] dark:text-red-300 ring-1 ring-[#8B0026]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mail className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span className="font-bold text-[11px]">Hanya Email</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('push')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  channel === 'push'
                    ? 'border-[#8B0026] bg-red-50/50 dark:bg-red-950/40 text-[#8B0026] dark:text-red-300 ring-1 ring-[#8B0026]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#8B0026] dark:text-red-400" />
                <span className="font-bold text-[11px]">Push Notif</span>
              </button>
            </div>
          </div>

          {(channel === 'email' || channel === 'both') && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email Penerima
              </label>
              <input
                type="email"
                required
                value={emailDestination}
                onChange={(e) => setEmailDestination(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#8B0026] hover:bg-red-800 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              {submitting ? 'Menyimpan...' : 'Aktifkan Langganan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
