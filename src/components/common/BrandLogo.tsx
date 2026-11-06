import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showBadge = true,
  variant = 'full',
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm font-bold', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { icon: 'w-8 h-8', text: 'text-base font-bold', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { icon: 'w-10 h-10', text: 'text-xl font-extrabold', badge: 'text-xs px-2 py-0.5' },
  };

  const cfg = sizeMap[size];

  const Icon = (
    <div className={`relative ${cfg.icon} shrink-0 rounded-xl bg-[#1E60F2] flex items-center justify-center shadow-xs transition-transform duration-150`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-4.5 h-4.5 text-white" 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v8" strokeWidth="2.4" />
        <path d="M8 12h8" strokeWidth="2.4" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{Icon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {Icon}
      <div className="flex items-center gap-1.5">
        <span className={`tracking-tight text-slate-900 ${cfg.text}`}>
          HeatShield
        </span>
        {showBadge && (
          <span className={`font-mono font-semibold rounded-md bg-blue-50 text-[#1E60F2] border border-blue-200/60 ${cfg.badge}`}>
            AI
          </span>
        )}
      </div>
    </div>
  );
};
