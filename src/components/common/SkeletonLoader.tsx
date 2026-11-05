import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
}) => {
  const variantClass = {
    text: 'rounded-md h-4',
    rect: 'rounded-2xl',
    circle: 'rounded-full',
  }[variant];

  return (
    <div
      className={`skeleton-shimmer bg-slate-200/70 ${variantClass} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      aria-hidden="true"
    />
  );
};

export const DashboardHeroSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-28 h-6 rounded-full" />
          <Skeleton className="w-36 h-6 rounded-full" />
        </div>
        <Skeleton className="w-48 h-10" />
        <Skeleton className="w-full max-w-xl h-5" />
      </div>
      <div className="w-44 h-44 rounded-full skeleton-shimmer self-center" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 border-t border-slate-100">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  </div>
);
