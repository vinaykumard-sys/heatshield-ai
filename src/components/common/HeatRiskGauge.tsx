import React, { useState, useEffect } from 'react';
import { CountUp } from './CountUp';

interface HeatRiskGaugeProps {
  score: number;
  category: 'low' | 'moderate' | 'high' | 'critical' | string;
  peakWindow?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const HeatRiskGauge: React.FC<HeatRiskGaugeProps> = ({
  score,
  category,
  peakWindow,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  const config = (() => {
    switch (category?.toLowerCase()) {
      case 'critical':
      case 'extreme':
        return {
          stroke: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.25)',
          bgTrack: '#FEE2E2',
          pillBg: 'bg-red-50 text-red-700 border-red-200',
          label: 'CRITICAL',
          advice: 'Extreme caution active'
        };
      case 'high':
        return {
          stroke: '#F97316',
          glow: 'rgba(249, 115, 22, 0.25)',
          bgTrack: '#FFEDD5',
          pillBg: 'bg-orange-50 text-orange-700 border-orange-200',
          label: 'HIGH',
          advice: 'Seek shade and hydrate'
        };
      case 'moderate':
        return {
          stroke: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.25)',
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
          glow: 'rgba(16, 185, 129, 0.25)',
          bgTrack: '#D1FAE5',
          pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'LOW',
          advice: 'Safe conditions'
        };
    }
  })();

  const radius = size === 'sm' ? 44 : size === 'lg' ? 68 : 56;
  const strokeWidth = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;
  const viewBoxSize = (radius + strokeWidth) * 2 + 16;
  const center = viewBoxSize / 2;

  // 240-degree arc
  const startAngle = 150;
  const endAngle = 390;
  const totalAngle = endAngle - startAngle;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const targetOffset = arcLength - (normalizedScore / 100) * arcLength;

  // Initial draw animation
  const [currentOffset, setCurrentOffset] = useState(animated ? arcLength : targetOffset);

  useEffect(() => {
    if (!animated) {
      setCurrentOffset(targetOffset);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentOffset(targetOffset);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetOffset, animated]);

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size === 'sm' ? 120 : size === 'lg' ? 180 : 150}
          height={size === 'sm' ? 120 : size === 'lg' ? 180 : 150}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="transform -rotate-60 drop-shadow-xs"
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

          {/* Value Progress Arc with smooth draw */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 2px 6px ${config.glow})`,
            }}
          />
        </svg>

        {/* Center Metric Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
              <CountUp value={normalizedScore} durationMs={700} />
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-400 ml-0.5">/100</span>
          </div>
          <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 border ${config.pillBg}`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeatRiskGauge;
