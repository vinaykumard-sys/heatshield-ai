import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { HeatRiskGauge } from './HeatRiskGauge';
import { RiskCategory } from '../../types';

interface HeatRiskCardProps {
  score: number;
  category: RiskCategory | string;
  peakWindow?: string;
  className?: string;
}

export const HeatRiskCard: React.FC<HeatRiskCardProps> = ({
  score,
  category,
  peakWindow,
  className = '',
}) => {
  const getRiskDescription = () => {
    switch (category) {
      case 'critical':
      case 'extreme':
        return 'Critical thermal threshold reached. Danger of heat stroke with prolonged exposure. Stay indoors in cooled or shaded spaces.';
      case 'high':
        return 'Elevated heat stress expected. Limit outdoor exertion between 11:30 AM and 3:30 PM. Hydrate before feeling thirsty.';
      case 'moderate':
        return 'Noticeable daytime warmth with elevated solar radiation. Routine hydration and sun protection recommended.';
      case 'low':
      case 'normal':
      default:
        return 'Conditions are within the safe seasonal baseline. Comfortable for all standard outdoor activities.';
    }
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Community Heat Risk
            </h3>
            <p className="text-[11px] text-slate-500">
              NDMA & IMD health safety index
            </p>
          </div>
        </div>

        <Link
          to="/predictions"
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
        >
          <span>AI Forecast</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Modern Circular SVG Gauge */}
      <div className="py-2 flex justify-center">
        <HeatRiskGauge
          score={score}
          category={category}
          peakWindow={peakWindow}
          size="md"
        />
      </div>

      {/* Human Guidance Description */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <p className="text-xs text-slate-600 leading-relaxed">
          {getRiskDescription()}
        </p>

        {peakWindow && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Peak window: <strong className="text-slate-800">{peakWindow}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatRiskCard;
