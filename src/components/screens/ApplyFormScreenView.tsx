import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Check,
  Send,
  User,
  ShieldCheck
} from 'lucide-react';
import type { JobListing, User as UserType } from '../../shared/types.js';
import { api } from '../../lib/api.js';

interface ApplyFormScreenViewProps {
  job: JobListing;
  currentUser: UserType | null;
  onNavigateBack: () => void;
  onApplySuccess: () => void;
  onOpenAuth: () => void;
}

export const ApplyFormScreenView: React.FC<ApplyFormScreenViewProps> = ({
  job,
  currentUser,
  onNavigateBack,
  onApplySuccess,
  onOpenAuth
}) => {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [coverLetter, setCoverLetter] = useState(
    'Saya berminat melamar posisi ini karena memiliki latar belakang serta kualifikasi yang relevan, dan siap memberikan kontribusi terbaik pada perusahaan Anda.'
  );
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [agreeConsent, setAgreeConsent] = useState(true);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [externalRedirectOpened, setExternalRedirectOpened] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!agreeConsent) {
      setError('Anda wajib menyetujui pernyataan integritas dan pengiriman berkas.');
      return;
    }
    if (job.application_method === 'external_url') {
      if (!job.application_url) {
        setError('Tautan lamaran eksternal belum tersedia. Hubungi dukungan KITA.');
        return;
      }
      window.open(job.application_url, '_blank', 'noopener,noreferrer');
      setExternalRedirectOpened(true);
      setSuccessSubmitted(true);
      setTimeout(() => onNavigateBack(), 2500);
      return;
    }
    if (!selectedResume) {
      setError('Pilih CV PDF asli sebelum mengirim lamaran.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const uploadedResume = await api.uploadResume(selectedResume);
      const res = await api.applyForJob(job.id, {
        cover_letter: coverLetter,
        resume_url: uploadedResume.data.resume_url,
        portfolio_url: portfolioUrl || undefined
      });
      if (res.success) {
        setSuccessSubmitted(true);
        setTimeout(() => {
          onApplySuccess();
        }, 1400);
      } else {
        setError(res.message || 'Gagal mengirimkan lamaran.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim lamaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedResume(null);
      setSelectedFile('');
      setFileSize('');
      setError('Demi keamanan, hanya CV berformat PDF yang diperbolehkan.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedResume(null);
      setSelectedFile('');
      setFileSize('');
      setError('Ukuran CV maksimal 5 MB.');
      e.target.value = '';
      return;
    }
    setSelectedResume(file);
    setSelectedFile(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden max-w-xl mx-auto pb-8 transition-colors duration-200">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-extrabold text-slate-900 dark:text-white">Formulir Lamaran Kerja</span>
        <div className="w-8" />
      </div>

      {/* Target Job Summary Banner */}
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={
              job.employer_logo ||
              'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&auto=format&fit=crop&q=80'
            }
            alt={job.employer_name || 'Perusahaan'}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
          />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Melamar Untuk Posisi
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {job.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              <span className="font-medium truncate">{job.employer_name}</span>
              <span>·</span>
              <span>{job.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successSubmitted ? (
          <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">
              {externalRedirectOpened ? 'Portal Lamaran Dibuka' : 'Lamaran Berhasil Dicatat'}
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-sm mx-auto leading-relaxed">
              {externalRedirectOpened
                ? 'KITA tidak mengirim lamaran ke situs tersebut. Selesaikan proses pada portal perusahaan; jika tab tidak terbuka, izinkan pop-up browser.'
                : 'CV Anda disimpan secara privat dan lamaran tercatat di database KITA. Email eksternal belum dikirim.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1: Profil */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                <span>1. Data Profil Pelamar</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Dimas Pratama"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email Aktif
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kota Domisili
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Contoh: Surabaya"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: CV */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8B0026] dark:text-red-400" />
                <span>2. Berkas Resume / CV</span>
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-2.5 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedFile || 'Belum ada CV dipilih'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{fileSize ? `${fileSize} · PDF siap diunggah` : 'PDF saja · Maksimal 5 MB'}</div>
                  </div>
                </div>
                <label className="inline-block cursor-pointer py-1.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-600 transition-colors">
                  <span>{selectedResume ? 'Ganti File CV' : 'Pilih File CV'}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleSelectResume}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Section 3: Surat Pengantar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Surat Lamaran / Ringkasan Diri Singkat
              </label>
              <textarea
                rows={3}
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Jelaskan secara singkat motivasi dan kesesuaian pengalaman Anda..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tautan Portofolio / Profil LinkedIn
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Section 4: Consent */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={agreeConsent}
                  onChange={(e) => setAgreeConsent(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8B0026] focus:ring-[#8B0026] shrink-0 mt-0.5 accent-[#8B0026]"
                />
                <span className="leading-relaxed">
                  Saya menyatakan bahwa data yang saya kirimkan adalah benar dan asli. Saya menyetujui data profil & CV diteruskan kepada pihak perusahaan untuk proses seleksi.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#8B0026] hover:bg-red-800 text-white font-extrabold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Mengirimkan Berkas...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Lamaran Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
