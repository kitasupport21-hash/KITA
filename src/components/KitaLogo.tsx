import React from 'react';

interface KitaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'maroon-on-white' | 'monochrome-white' | 'dark-mode';
  showTagline?: boolean;
  className?: string;
}

export const KitaLogo: React.FC<KitaLogoProps> = ({
  size = 'md',
  variant = 'maroon-on-white',
  showTagline = false,
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7 text-xs rounded-lg', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-8 h-8 text-xs font-black rounded-xl', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-11 h-11 text-base font-black rounded-2xl', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14 text-xl font-black rounded-3xl', text: 'text-3xl', sub: 'text-sm' }
  };

  const isDarkEmblem = variant === 'monochrome-white';
  const iconBg = isDarkEmblem
    ? 'bg-white text-[#8B0026] shadow-sm'
    : 'bg-[#8B0026] text-white shadow-xs';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Visual Emblem */}
      <div
        className={`${sizeMap[size].icon} flex items-center justify-center shrink-0 tracking-tight font-black ${iconBg}`}
      >
        <span>KI</span>
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span
            className={`font-black tracking-tight ${sizeMap[size].text} ${
              isDarkEmblem ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            KITA
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B0026] shrink-0" />
        </div>
        {showTagline && (
          <span
            className={`font-medium tracking-normal mt-0.5 ${sizeMap[size].sub} ${
              isDarkEmblem ? 'text-red-200' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Kerja · Freelance · UMKM
          </span>
        )}
      </div>
    </div>
  );
};
