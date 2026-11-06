import React from 'react';
import { CountUp } from './CountUp';

interface HeatRiskGaugeProps {
  score: number;
  category: 'low' | 'moderate' | 'high' | 'critical' | string;
  peakWindow?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HeatRiskGauge: React.FC<HeatRiskGaugeProps> = ({
  score,
  category,
  peakWindow,
  size = 'md',
  className = '',
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  const config = (() => {
    switch (category) {
      case 'critical':
      case 'extreme':
        return {
          stroke: '#EF4444',
          bgTrack: '#FEE2E2',
          pillBg: 'bg-red-50 text-red-700 border-red-200',
          label: 'CRITICAL',
          advice: 'Extreme caution active'
        };
      case 'high':
        return {
          stroke: '#F97316',
          bgTrack: '#FFEDD5',
          pillBg: 'bg-orange-50 text-orange-700 border-orange-200',
          label: 'HIGH',
          advice: 'Seek shade and hydrate'
        };
      case 'moderate':
        return {
          stroke: '#F59E0B',
          bgTrack: '#FEF3C7',
          pillBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'MODERATE',
          advice: 'Routine caution advised'
        };
      case 'low':
      case 'normal':
      default:
        return {
          stroke: '#10B981',
          bgTrack: '#D1FAE5',
          pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'LOW',
          advice: 'Safe conditions'
        };
    }
  })();

  const radius = size === 'sm' ? 44 : size === 'lg' ? 68 : 56;
  const strokeWidth = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;
  const viewBoxSize = (radius + strokeWidth) * 2 + 12;
  const center = viewBoxSize / 2;

  // 240-degree arc
  const startAngle = 150;
  const endAngle = 390;
  const totalAngle = endAngle - startAngle;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size === 'sm' ? 120 : size === 'lg' ? 180 : 150}
          height={size === 'sm' ? 120 : size === 'lg' ? 180 : 150}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="transform -rotate-60"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#EEF3F8"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Metric Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              <CountUp value={normalizedScore} durationMs={600} />
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-400 ml-0.5">/100</span>
          </div>
          <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 border ${config.pillBg}`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeatRiskGauge;
