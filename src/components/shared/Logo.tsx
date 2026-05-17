import { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SIZE_MAP = {
  sm: { box: 'w-6 h-6', text: 'text-[10px]', label: 'text-sm' },
  md: { box: 'w-8 h-8', text: 'text-sm', label: 'text-sm' },
  lg: { box: 'w-20 h-20', text: 'text-3xl', label: 'text-3xl' },
};

export function Logo({ size = 'md', showText = false }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const s = SIZE_MAP[size];

  const icon = imgError ? (
    <div className={`${s.box} rounded-lg bg-[#CC0000] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#CC0000]/30`}>
      <span className={`${s.text} font-black text-white font-['Outfit']`}>G</span>
    </div>
  ) : (
    <img
      src="/assets/logo-gip.png"
      alt="GIP"
      className={`${s.box} rounded-lg object-contain flex-shrink-0`}
      onError={() => setImgError(true)}
    />
  );

  if (!showText) return icon;

  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className={`font-bold text-slate-900 dark:text-white font-['Outfit'] ${s.label} hidden sm:block`}>GIP</span>
    </div>
  );
}
