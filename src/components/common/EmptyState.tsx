import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 text-center rounded-[20px] bg-white border border-[#E5EDF5] shadow-xs flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center mb-1">
        {icon || <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
