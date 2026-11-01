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
    sm: { icon: 'w-7 h-7', text: 'text-sm', badge: 'text-[10px] px-1.5 py-0.2' },
    md: { icon: 'w-8 h-8', text: 'text-base font-bold', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { icon: 'w-10 h-10', text: 'text-xl font-bold', badge: 'text-xs px-2 py-0.5' },
  };

  const cfg = sizeMap[size];

  // Minimalist, clinical healthcare shield icon
  const Icon = (
    <div className={`relative ${cfg.icon} shrink-0 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-5 h-5 text-white" 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Shield with medical protection cross & subtle thermal curve */}
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v8" strokeWidth="2.5" />
        <path d="M8 12h8" strokeWidth="2.5" />
      </svg>
      {/* Subtle indicator dot representing thermal vigilance */}
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{Icon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {Icon}
      <div className="flex items-center gap-1.5">
        <span className={`tracking-tight text-slate-900 font-bold ${cfg.text}`}>
          HeatShield
        </span>
        {showBadge && (
          <span className={`font-mono font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200/80 ${cfg.badge}`}>
            AI
          </span>
        )}
      </div>
    </div>
  );
};
