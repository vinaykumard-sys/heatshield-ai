import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  colorScheme?: 'orange' | 'amber' | 'emerald' | 'red' | 'blue' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-card transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-card-hover' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 tracking-normal">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </h3>
            {trend && (
              <span
                className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  trend.isNeutral
                    ? 'bg-slate-100 text-slate-600'
                    : trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-[#E2E8F0] text-slate-600 shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2.5 pt-2 border-t border-[#F1F5F9] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
