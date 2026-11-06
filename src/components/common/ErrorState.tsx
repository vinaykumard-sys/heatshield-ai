import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Information unavailable',
  description = "We couldn't retrieve the latest data right now. Please check your connection and try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 text-center rounded-[20px] bg-white border border-rose-100 shadow-xs flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-2 text-slate-700"
        >
          Try again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
