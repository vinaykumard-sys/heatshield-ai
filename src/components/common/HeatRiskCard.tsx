import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  Info, 
  Activity,
  Flame,
  Sun,
  Droplets,
  Building2
} from 'lucide-react';
import { HeatRiskGauge } from './HeatRiskGauge';
import { RiskCategory } from '../../types';

export interface HeatRiskCardProps {
  score: number;
  category: RiskCategory | string;
  peakWindow?: string;
  peakTemp?: number;
  peakHeat?: string;
  hourlyForecast?: Array<{
    time: string;
    temperature_c?: number;
    temp?: number;
    heat_index_c?: number;
  }>;
  trend?: 'Increasing' | 'Stable' | 'Decreasing';
  contributions?: {
    ambient?: number;
    heatIndex?: number;
    wetBulb?: number;
    solarUv?: number;
    uhi?: number;
  };
  className?: string;
}

export const HeatRiskCard: React.FC<HeatRiskCardProps> = ({
  score,
  category,
  peakWindow = '2:00 PM',
  peakTemp = 34,
  peakHeat,
  hourlyForecast,
  trend = 'Increasing',
  contributions,
  className = '',
}) => {
  const [showFormulas, setShowFormulas] = useState(false);

  // Normalize category string for comparison and display
  const normCategory = (category || 'moderate').toLowerCase();
  const displayCategory = normCategory.toUpperCase();

  // Calculate dynamic peak heat string (e.g. "2:00 PM · 34°C") from hourly forecast
  const peakHeatDisplay = useMemo(() => {
    if (peakHeat) return peakHeat;

    if (hourlyForecast && hourlyForecast.length > 0) {
      let maxEntry = hourlyForecast[0];
      let maxTemp = maxEntry.temperature_c ?? maxEntry.temp ?? 0;

      for (const entry of hourlyForecast) {
        const t = entry.temperature_c ?? entry.temp ?? 0;
        if (t > maxTemp) {
          maxTemp = t;
          maxEntry = entry;
        }
      }

      let timeLabel = maxEntry.time;
      if (timeLabel.includes('T')) {
        const d = new Date(timeLabel);
        timeLabel = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } else if (timeLabel.includes(':')) {
        const [h, m] = timeLabel.split(':');
        const hourNum = parseInt(h, 10);
        if (!isNaN(hourNum)) {
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const hour12 = hourNum % 12 || 12;
          timeLabel = `${hour12}:${m || '00'} ${ampm}`;
        }
      }
      return `${timeLabel} · ${Math.round(maxTemp)}°C`;
    }

    return `${peakWindow} · ${Math.round(peakTemp)}°C`;
  }, [peakHeat, hourlyForecast, peakWindow, peakTemp]);

  // Short, clear, plain-English explanation
  const getRiskDescription = () => {
    switch (normCategory) {
      case 'critical':
      case 'extreme':
        return 'Dangerous thermal threshold reached. High probability of heat exhaustion or heat stroke with continuous exposure. Stay indoors in shaded or cooled rooms.';
      case 'high':
        return 'Elevated daytime heat stress. Avoid strenuous activity during peak solar hours, stay in ventilated areas, and hydrate frequently.';
      case 'moderate':
        return 'Warm conditions with elevated sun exposure. Stay hydrated and avoid prolonged direct sunlight during peak heat.';
      case 'low':
      case 'normal':
      default:
        return 'Conditions are within a safe seasonal range. Comfortable for standard outdoor activities with regular hydration.';
    }
  };

  // Category pill style
  const categoryStyle = useMemo(() => {
    switch (normCategory) {
      case 'critical':
      case 'extreme':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  }, [normCategory]);

  // Default contribution percentages if not provided
  const factorShares = contributions || {
    ambient: 35,
    heatIndex: 25,
    wetBulb: 15,
    solarUv: 15,
    uhi: 10,
  };

  return (
    <div className={`bg-white rounded-[26px] border border-[#E5EDF5] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4 transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(15,23,42,0.09)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Heat Risk Index
            </h3>
            <p className="text-[11px] text-slate-500">
              Biometeorological health & safety
            </p>
          </div>
        </div>

        <Link
          to="/predictions"
          className="text-xs text-[#1E60F2] hover:underline font-bold inline-flex items-center gap-1 group"
        >
          <span>24h Forecast</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Prominent Circular Risk Gauge with Smooth SVG Draw */}
      <div className="py-2 flex flex-col items-center justify-center">
        <HeatRiskGauge
          score={score}
          category={category}
          peakWindow={peakWindow}
          size="lg"
          animated={true}
        />
      </div>

      {/* Primary Metrics Strip: Peak Heat & Risk Trend */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Peak Heat Tile */}
        <div className="p-3 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-0.5 transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Peak heat</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate tracking-tight">
            {peakHeatDisplay}
          </div>
        </div>

        {/* Risk Trend Tile */}
        <div className="p-3 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-0.5 transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            {trend === 'Increasing' ? (
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            ) : trend === 'Decreasing' ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Risk trend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              {trend}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${categoryStyle}`}>
              {displayCategory}
            </span>
          </div>
        </div>
      </div>

      {/* Short Plain-English Explanation */}
      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E9F0FA]">
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {getRiskDescription()}
        </p>
      </div>

      {/* Technical Formulas & Factor Contributions (Secondary / Expandable) */}
      <div className="pt-1 border-t border-slate-100">
        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600 hover:text-[#1E60F2] transition-colors focus:outline-none group"
          aria-expanded={showFormulas}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E60F2]" />
            <span>Biometeorological formula & weights</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              showFormulas ? 'rotate-180 text-[#1E60F2]' : ''
            }`}
          />
        </button>

        {showFormulas && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-3 animate-fadeIn text-xs">
            {/* Scientific Formula equation */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Risk Engine Weighted Formula
              </span>
              <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800 overflow-x-auto">
                Risk = 0.35·T_amb + 0.25·HI + 0.15·Twb + 0.15·UV + 0.10·UHI
              </div>
            </div>

            {/* Factor Weight Contribution Bars */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Factor Weight Contributions
              </span>

              {/* Ambient Air Temp */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-500" />
                    Ambient Temperature (T_amb)
                  </span>
                  <span className="font-bold text-slate-800">{factorShares.ambient}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${factorShares.ambient}%` }} />
                </div>
              </div>

              {/* Real-Feel Heat Index */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-500" />
                    Heat Index (HI)
                  </span>
                  <span className="font-bold text-slate-800">{factorShares.heatIndex}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${factorShares.heatIndex}%` }} />
                </div>
              </div>

              {/* Wet Bulb Temperature */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    Wet Bulb Stress (Twb)
                  </span>
                  <span className="font-bold text-slate-800">{factorShares.wetBulb}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${factorShares.wetBulb}%` }} />
                </div>
              </div>

              {/* Urban Heat Island Anomaly */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-purple-500" />
                    Urban Heat Island (UHI)
                  </span>
                  <span className="font-bold text-slate-800">{factorShares.uhi}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${factorShares.uhi}%` }} />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200/60">
              Calibrated according to Indian Meteorological Department (IMD) heat advisory standards and WHO thermal stress indices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatRiskCard;
