import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HeatRiskGauge } from './HeatRiskGauge';
import { RiskCategory } from '../../types';

interface HeatRiskCardProps {
  score: number;
  category: RiskCategory | string;
  peakWindow?: string;
  trend?: 'Increasing' | 'Stable' | 'Decreasing';
  className?: string;
}

export const HeatRiskCard: React.FC<HeatRiskCardProps> = ({
  score,
  category,
  peakWindow = '2:00 PM',
  trend = 'Increasing',
  className = '',
}) => {
  const getRiskDescription = () => {
    switch (category) {
      case 'critical':
      case 'extreme':
        return 'Severe thermal threshold reached. Danger of heat stroke with continuous exposure. Stay in shaded or cooled rooms.';
      case 'high':
        return 'Elevated daytime heat stress. Avoid strenuous activity during peak solar hours and drink water frequently.';
      case 'moderate':
        return 'Warm conditions with elevated sun exposure. Routine hydration and light cotton clothing advised.';
      case 'low':
      case 'normal':
      default:
        return 'Conditions are within a safe seasonal range. Comfortable for standard outdoor activities.';
    }
  };

  return (
    <div className={`bg-white rounded-[20px] border border-[#E5EDF5] p-6 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Heat Risk Index
            </h3>
            <p className="text-[11px] text-slate-500">
              Health & safety assessment
            </p>
          </div>
        </div>

        <Link
          to="/predictions"
          className="text-xs text-[#1E60F2] hover:underline font-semibold inline-flex items-center gap-1"
        >
          <span>Forecast</span>
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

      {/* Peak Heat & Trend Details */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Peak heat</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {peakWindow}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            {trend === 'Increasing' ? (
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            ) : trend === 'Decreasing' ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Risk trend</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {trend}
          </div>
        </div>
      </div>

      {/* Guidance Description */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-600 leading-relaxed">
          {getRiskDescription()}
        </p>
      </div>
    </div>
  );
};

export default HeatRiskCard;
