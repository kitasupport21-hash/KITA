import React from 'react';
import { ArrowRight, LogIn, Building2, ShieldCheck } from 'lucide-react';

interface SplashScreenViewProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({
  onGetStarted,
  onOpenLogin
}) => {
  return (
    <div className="min-h-[640px] h-full bg-[#8B0026] text-white flex flex-col justify-between relative overflow-hidden rounded-3xl shadow-xl">
      {/* Ambient background glows */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-rose-950/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Status preview */}
      <div className="p-6 pt-5 flex items-center justify-between relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-red-100 border border-white/15">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Platform Resmi Kemnaker RI</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-xs text-red-200 hover:text-white px-3 py-1 rounded-full bg-white/10 backdrop-blur-md transition-colors"
        >
          Lewati
        </button>
      </div>

      {/* Central Hero Branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 py-6">
        <div className="w-20 h-20 rounded-3xl bg-white text-[#8B0026] flex items-center justify-center font-black text-3xl shadow-2xl mb-4 tracking-tighter border-2 border-red-100/50">
          KI
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
          KITA
        </h1>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-red-100 mb-4 border border-white/20">
          <span>Kerja · Freelance · UMKM</span>
        </div>
        <p className="text-sm text-red-100/90 max-w-xs leading-relaxed font-medium">
          Peluang Kerja Untuk Masa Depan Yang Lebih Baik di Seluruh Penjuru Nusantara
        </p>

        {/* Visual Card: Ecosystem summary */}
        <div className="mt-6 w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/20 text-left flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">Ekosistem Bursa Kerja Resmi</div>
            <div className="text-[11px] text-red-200/90">38 Provinsi · Ribuan UMKM & BUMN</div>
          </div>
        </div>
      </div>

      {/* Bottom Architectural Silhouette & Action Buttons */}
      <div className="relative w-full z-10 px-6 pb-7 pt-2">
        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={onGetStarted}
            className="w-full py-3.5 px-5 bg-white text-[#8B0026] hover:bg-red-50 text-sm font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-4 h-4 text-[#8B0026]" />
          </button>
          <button
            onClick={onOpenLogin}
            className="w-full py-3 px-5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>Sudah Punya Akun? Masuk</span>
          </button>
        </div>
        <div className="mt-4 text-center">
          <span className="text-[10px] text-red-200/70 uppercase tracking-widest font-semibold">
            Kementerian Ketenagakerjaan RI · NIB Terintegrasi
          </span>
        </div>
      </div>
    </div>
  );
};
