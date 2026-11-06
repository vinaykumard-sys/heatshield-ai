import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'subtle' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-50 text-[#1E60F2] border border-blue-100',
    brand: 'bg-blue-50 text-[#1E60F2] border border-blue-100',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    subtle: 'bg-white text-slate-600 border border-[#E5EDF5] shadow-xs',
    outline: 'bg-white text-slate-600 border border-[#E5EDF5] shadow-xs',
  };

  const dotClasses: Record<string, string> = {
    primary: 'bg-[#1E60F2]',
    brand: 'bg-[#1E60F2]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    neutral: 'bg-slate-400',
    subtle: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors select-none',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClasses)} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
