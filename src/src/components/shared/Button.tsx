import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const BASE = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#CC0000] hover:bg-[#AA0000] text-white focus-visible:ring-[#CC0000]',
  secondary: 'bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#2D2D2D] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 focus-visible:ring-slate-300 dark:focus-visible:ring-white/30',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white focus-visible:ring-slate-300 dark:focus-visible:ring-white/30',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
};

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

