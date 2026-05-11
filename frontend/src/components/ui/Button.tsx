'use client';

import React from 'react';

// ── Tip tanımları ─────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size    = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant;
  size?:      Size;
  isLoading?: boolean;
}

// ── Stil haritaları ───────────────────────────────────────────
const variantStyles: Record<Variant, string> = {
  primary:   'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-[1.02]',
  secondary: 'bg-white/10 text-white hover:bg-white/20',
  outline:   'border border-[#6366f1] text-[#818cf8] hover:bg-[#6366f1]/10',
  danger:    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30',
  ghost:     'text-[#94a3b8] hover:text-white hover:bg-white/5',
};

const sizeStyles: Record<Size, string> = {
  sm:      'h-8 px-3 text-xs',
  default: 'h-10 px-4 py-2 text-sm',
  lg:      'h-12 px-8 text-base',
  icon:    'h-10 w-10',
};

// ── Bileşen ───────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center rounded-lg font-medium',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
      'outline-none focus:ring-2 focus:ring-[#6366f1]/50',
      variantStyles[variant],
      sizeStyles[size],
      className,
    ].join(' ');

    return (
      <button
        ref={ref}
        className={base}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
