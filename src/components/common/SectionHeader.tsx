import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  icon,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4', className)}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#1E60F2] shrink-0">{icon}</span>}
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
