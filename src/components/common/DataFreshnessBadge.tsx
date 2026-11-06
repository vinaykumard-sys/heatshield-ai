import React from 'react';
import { Wifi, WifiOff, Clock, Database, AlertCircle } from 'lucide-react';
import { formatTimeAgo } from '../../lib/utils';

export type DataFreshnessStatus = 'LIVE' | 'STALE' | 'CACHED' | 'OFFLINE' | 'UNAVAILABLE';

interface DataFreshnessBadgeProps {
  status: DataFreshnessStatus;
  observedAt?: string | null;
  source?: string;
  className?: string;
  showDetails?: boolean;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  status,
  observedAt,
  source = 'Open-Meteo & Ground Telemetry',
  className = '',
  showDetails = false
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'LIVE':
        return {
          label: 'LIVE DATA',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Wifi
        };
      case 'CACHED':
        return {
          label: 'CACHED',
          bg: 'bg-blue-50',
          text: 'text-[#1E60F2]',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          icon: Database
        };
      case 'STALE':
        return {
          label: 'STALE',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock
        };
      case 'OFFLINE':
        return {
          label: 'OFFLINE MODE',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-300',
          dot: 'bg-slate-400',
          icon: WifiOff
        };
      case 'UNAVAILABLE':
      default:
        return {
          label: 'DATA UNAVAILABLE',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500',
          icon: AlertCircle
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const timeLabel = observedAt ? formatTimeAgo(observedAt) : 'recently';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'LIVE' ? 'animate-pulse' : ''}`} />
        <span>{config.label}</span>
      </span>

      {showDetails && (
        <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
          <span>•</span>
          <span>Updated {timeLabel}</span>
          <span className="text-slate-300">({source})</span>
        </span>
      )}
    </div>
  );
};

export default DataFreshnessBadge;
