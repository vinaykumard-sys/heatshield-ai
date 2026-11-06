import React from 'react';
import { cn } from '../../lib/utils';

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
    rect: 'rounded-[16px]',
    circle: 'rounded-full',
  }[variant];

  return (
    <div
      className={cn('skeleton-shimmer bg-slate-200/60', variantClass, className)}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      aria-hidden="true"
    />
  );
};

export const DashboardHeroSkeleton: React.FC = () => (
  <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 sm:p-8 shadow-xs space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2">
        <Skeleton className="w-36 h-6 rounded-full" />
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      <Skeleton className="w-32 h-8 rounded-xl" />
    </div>
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-3 flex-1">
        <Skeleton className="w-28 h-4 rounded-md" />
        <div className="flex items-baseline gap-4">
          <Skeleton className="w-32 h-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-36 h-5 rounded-md" />
            <Skeleton className="w-48 h-4 rounded-md" />
          </div>
        </div>
      </div>
      <Skeleton className="w-32 h-32 rounded-full self-center" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="w-32 h-5 rounded-md" />
      <Skeleton className="w-16 h-4 rounded-md" />
    </div>
    <Skeleton className="w-full h-24 rounded-xl" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="w-20 h-8 rounded-xl" />
      <Skeleton className="w-20 h-8 rounded-xl" />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 rounded-2xl bg-white border border-[#E5EDF5] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1 max-w-sm">
            <Skeleton className="w-3/4 h-4 rounded-md" />
            <Skeleton className="w-1/2 h-3 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);
