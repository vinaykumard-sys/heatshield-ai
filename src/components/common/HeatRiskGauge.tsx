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

  // Severity configurations with calm, restrained tones (Apple/Health standard)
  const config = (() => {
    switch (category) {
      case 'critical':
      case 'extreme':
        return {
          stroke: '#EF4444',
          bgTrack: '#FEE2E2',
          pillBg: 'bg-red-50 text-red-700 border-red-200',
          dotBg: 'bg-red-500',
          label: 'Extreme Heat Risk',
          shortLabel: 'Extreme',
          advice: 'Emergency precautions active'
        };
      case 'high':
        return {
          stroke: '#F97316',
          bgTrack: '#FFEDD5',
          pillBg: 'bg-orange-50 text-orange-700 border-orange-200',
          dotBg: 'bg-orange-500',
          label: 'High Heat Risk',
          shortLabel: 'High',
          advice: 'Seek shade and hydrate'
        };
      case 'moderate':
        return {
          stroke: '#F59E0B',
          bgTrack: '#FEF3C7',
          pillBg: 'bg-amber-50 text-amber-700 border-amber-200',
          dotBg: 'bg-amber-500',
          label: 'Moderate Heat Advisory',
          shortLabel: 'Moderate',
          advice: 'Routine caution advised'
        };
      case 'low':
      case 'normal':
      default:
        return {
          stroke: '#10B981',
          bgTrack: '#D1FAE5',
          pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotBg: 'bg-emerald-500',
          label: 'Normal Heat Range',
          shortLabel: 'Normal',
          advice: 'Optimal thermal comfort'
        };
    }
  })();

  // Semi-circle gauge geometry
  // Radius: 54, Arc length for 220 degree arc
  const radius = size === 'sm' ? 42 : size === 'lg' ? 68 : 56;
  const strokeWidth = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;
  const viewBoxSize = (radius + strokeWidth) * 2 + 10;
  const center = viewBoxSize / 2;

  // 240-degree arc from 150 deg to 390 deg (-30 deg)
  const startAngle = 150;
  const endAngle = 390;
  const totalAngle = endAngle - startAngle; // 240 deg
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size === 'sm' ? 110 : size === 'lg' ? 170 : 140}
          height={size === 'sm' ? 110 : size === 'lg' ? 170 : 140}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="transform -rotate-60"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Active progress track */}
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

        {/* Center Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              <CountUp value={normalizedScore} durationMs={700} />
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono ml-0.5">/100</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Heat Risk
          </span>
        </div>
      </div>

      {/* Category Pill */}
      <div className="mt-1 flex flex-col items-center gap-1">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.pillBg} shadow-2xs`}
        >
          <span className={`w-2 h-2 rounded-full ${config.dotBg}`} />
          <span>{config.label}</span>
        </span>

        {peakWindow && (
          <span className="text-[11px] text-slate-500 font-medium">
            Peak heat: <strong className="text-slate-700">{peakWindow}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default HeatRiskGauge;
