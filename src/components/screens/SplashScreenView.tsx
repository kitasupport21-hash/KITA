import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenViewProps { onGetStarted: () => void; onOpenLogin: () => void; }

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({ onGetStarted, onOpenLogin }) => (
  <div className="min-h-[680px] h-full bg-[#146BFF] text-white flex flex-col justify-between overflow-hidden rounded-[36px] relative">
    <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#0754cf] to-transparent pointer-events-none" />
    <div className="absolute bottom-0 left-0 right-0 h-48 opacity-25 pointer-events-none">
      <div className="absolute left-[8%] bottom-0 w-10 h-24 bg-white/20 rounded-t-sm" />
      <div className="absolute left-[18%] bottom-0 w-16 h-32 bg-white/15 rounded-t-sm" />
      <div className="absolute right-[18%] bottom-0 w-14 h-28 bg-white/15 rounded-t-sm" />
      <div className="absolute right-[7%] bottom-0 w-9 h-20 bg-white/20 rounded-t-sm" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1.5 h-44 bg-white/75" />
      <div className="absolute left-1/2 bottom-36 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-white/75" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-24 h-1 bg-white/70 rounded-full" />
    </div>
    <div className="relative z-10 px-7 pt-8 text-right"><button onClick={onGetStarted} className="text-xs font-semibold text-white/90">Lewati</button></div>
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 text-center">
      <div className="w-24 h-24 flex items-center justify-center mb-4"><div className="text-[74px] font-black italic tracking-[-0.18em] leading-none text-white">K</div></div>
      <h1 className="text-4xl font-black tracking-tight">KerjaKu</h1>
      <p className="mt-3 text-sm font-medium text-blue-100 max-w-[260px] leading-relaxed">Temukan Pekerjaan Impianmu di Indonesia</p>
    </div>
    <div className="relative z-10 px-7 pb-8">
      <button onClick={onGetStarted} className="w-full py-3.5 bg-white text-[#146BFF] text-sm font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2">Mulai Sekarang <ArrowRight className="w-4 h-4" /></button>
      <button onClick={onOpenLogin} className="w-full mt-3 py-2 text-xs font-semibold text-white/90">Sudah punya akun? Masuk</button>
    </div>
  </div>
);
