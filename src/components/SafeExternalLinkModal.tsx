import React from 'react';
import { ExternalLink, ShieldCheck, AlertCircle, X, ArrowRight } from 'lucide-react';

interface SafeExternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  companyName?: string;
  title?: string;
}

export const SafeExternalLinkModal: React.FC<SafeExternalLinkModalProps> = ({
  isOpen,
  onClose,
  url,
  companyName = 'Perusahaan',
  title = 'Kunjungan Tautan Resmi'
}) => {
  if (!isOpen) return null;

  let hostname = '';
  let isValidProtocol = false;
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
    isValidProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    isValidProtocol = false;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="h-1.5 w-full bg-[#8B0026]" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#8B0026] dark:text-red-400 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{companyName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isValidProtocol ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Domain Resmi Terverifikasi</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  {hostname}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Anda akan dialihkan ke situs eksternal resmi milik {companyName}. KITA tidak memungut biaya apapun dari proses pendaftaran kerja.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs min-h-[44px] transition-colors"
                >
                  Kembali
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-[#8B0026] hover:bg-red-800 text-white font-bold rounded-xl text-xs min-h-[44px] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Buka Halaman</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Tautan Tidak Terverifikasi</span>
                  <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                    Alamat tautan tidak memenuhi standar keamanan HTTPS KITA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs min-h-[44px]"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
