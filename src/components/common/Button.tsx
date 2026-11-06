import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px]',
  }[size];

  const variantClasses = {
    primary: 'bg-[#1E60F2] text-white hover:bg-[#184FD0] shadow-[0_1px_3px_rgba(30,96,242,0.2)] focus-visible:ring-[#1E60F2]',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 focus-visible:ring-slate-400',
    outline: 'border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:ring-[#1E60F2]',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-[0_1px_3px_rgba(239,68,68,0.2)] focus-visible:ring-[#EF4444]',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 focus-visible:ring-slate-400',
    soft: 'bg-blue-50 text-[#1E60F2] hover:bg-blue-100/80 border border-blue-100 focus-visible:ring-[#1E60F2]',
  }[variant];

  return (
    <button
      className={cn(baseClasses, sizeClasses, variantClasses, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

export default Button;
