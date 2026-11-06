import React from 'react';
import { cn } from '../../lib/utils';
import { CountUp } from './CountUp';

export interface MetricProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  supporting?: string;
  icon?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  trend,
  supporting,
  icon,
  size = 'md',
  className,
}) => {
  const isNumber = typeof value === 'number';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-extrabold text-slate-900 tracking-tight font-sans',
            size === 'lg' ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {isNumber ? <CountUp value={value as number} durationMs={600} /> : value}
        </span>
        {unit && (
          <span className="text-base sm:text-lg font-bold text-slate-500">
            {unit}
          </span>
        )}
      </div>

      {(trend || supporting) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          {trend && (
            <span
              className={cn(
                'font-semibold inline-flex items-center gap-0.5',
                trend.direction === 'up' && 'text-amber-600',
                trend.direction === 'down' && 'text-emerald-600',
                trend.direction === 'neutral' && 'text-slate-500'
              )}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
            </span>
          )}
          {supporting && <span>{supporting}</span>}
        </div>
      )}
    </div>
  );
};

export default Metric;
