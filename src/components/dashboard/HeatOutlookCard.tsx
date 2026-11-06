import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, 
  Flame, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { EnvironmentalReading, HeatRiskAssessment } from '../../types';

export interface HourlyForecastItem {
  time: string;
  temperature_c: number;
  relative_humidity_pct?: number;
  heat_index_c?: number;
  uv_index?: number;
  wind_speed_kmh?: number;
}

export interface HeatOutlookCardProps {
  forecastHourly?: HourlyForecastItem[];
  currentRisk?: HeatRiskAssessment | null;
  currentReading?: EnvironmentalReading | null;
  className?: string;
}

/**
 * Formats time string (e.g., "14:00", "2026-11-06T14:00:00", "2:00 PM") into "2:00 PM"
 */
function formatTime12h(rawTime: string): string {
  if (!rawTime) return '2:00 PM';
  
  // If already contains AM/PM
  if (rawTime.includes('AM') || rawTime.includes('PM')) {
    return rawTime;
  }

  // If ISO string like 2026-11-06T14:00:00
  if (rawTime.includes('T')) {
    const timePart = rawTime.split('T')[1];
    const hourPart = parseInt(timePart.split(':')[0], 10);
    const minutePart = timePart.split(':')[1] || '00';
    if (!isNaN(hourPart)) {
      const period = hourPart >= 12 ? 'PM' : 'AM';
      const h12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
      return `${h12}:${minutePart} ${period}`;
    }
  }

  // If 24h format like "14:00"
  const parts = rawTime.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1].slice(0, 2);
    if (!isNaN(h)) {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m} ${period}`;
    }
  }

  return rawTime;
}

export const HeatOutlookCard: React.FC<HeatOutlookCardProps> = ({
  forecastHourly: propsHourly,
  currentRisk: propsRisk,
  currentReading: propsReading,
  className = '',
}) => {
  const context = useLocationTracker();

  const hourly = propsHourly || context.forecastHourly || [];
  const risk = propsRisk !== undefined ? propsRisk : context.currentRisk;
  const reading = propsReading !== undefined ? propsReading : context.currentReading;

  // Calculate peak heat from hourly data
  const { peakTemp, peakTime, peakHeatIndex, expectedRisk, summaryText, peakHourNum } = useMemo(() => {
    let maxTemp = -999;
    let maxItem: HourlyForecastItem | null = null;
    let maxHi = -999;

    if (hourly && hourly.length > 0) {
      for (const pt of hourly) {
        const t = pt.temperature_c ?? 32;
        const hi = pt.heat_index_c ?? t;
        if (t > maxTemp) {
          maxTemp = t;
          maxItem = pt;
          maxHi = hi;
        }
      }
    }

    // Fallbacks if hourly is empty
    if (!maxItem) {
      const curTemp = reading?.temperature_c ?? 34.0;
      maxTemp = Math.round(curTemp + 1.8);
      maxHi = Math.round((reading?.feels_like_c ?? maxTemp + 3));
      maxItem = {
        time: '14:00',
        temperature_c: maxTemp,
        heat_index_c: maxHi,
      };
    }

    const roundedPeak = Math.round(maxTemp);
    const formattedPeakTime = formatTime12h(maxItem.time);

    // Extract numerical hour for advisory context
    let hNum = 14;
    if (maxItem.time.includes('T')) {
      const p = parseInt(maxItem.time.split('T')[1]?.split(':')[0] || '14', 10);
      if (!isNaN(p)) hNum = p;
    } else {
      const p = parseInt(maxItem.time.split(':')[0] || '14', 10);
      if (!isNaN(p)) hNum = p;
    }

    // Determine expected risk category
    let expRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
    if (risk?.risk_category) {
      const cat = risk.risk_category.toLowerCase();
      if (cat === 'critical') expRisk = 'Critical';
      else if (cat === 'high') expRisk = 'High';
      else if (cat === 'moderate') expRisk = 'Moderate';
      else expRisk = 'Low';
    } else {
      if (maxHi >= 42 || roundedPeak >= 41) expRisk = 'Critical';
      else if (maxHi >= 38 || roundedPeak >= 37) expRisk = 'High';
      else if (maxHi >= 33 || roundedPeak >= 32) expRisk = 'Moderate';
      else expRisk = 'Low';
    }

    // Clear plain-English summary based on peak conditions
    let summary = 'Peak solar thermal load hits in the early afternoon before cooling down.';
    if (expRisk === 'Critical') {
      summary = 'Dangerous solar thermal load peaks in the afternoon. Avoid unshaded exposure and stay hydrated.';
    } else if (expRisk === 'High') {
      summary = 'Elevated heat stress peaks in the afternoon with intense solar radiation before easing toward sunset.';
    } else if (expRisk === 'Moderate') {
      if (hNum >= 14) {
        summary = 'Peak solar thermal load hits in the early afternoon before cooling down.';
      } else {
        summary = 'Warmest conditions emerge midday with moderate radiative heat before stabilizing by late afternoon.';
      }
    } else {
      summary = 'Mild thermal conditions prevail with gentle daytime warming and low thermal stress.';
    }

    return {
      peakTemp: roundedPeak,
      peakTime: formattedPeakTime,
      peakHeatIndex: Math.round(maxHi),
      expectedRisk: expRisk,
      summaryText: summary,
      peakHourNum: hNum,
    };
  }, [hourly, risk, reading]);

  // Risk badge styling
  const riskBadgeStyles = {
    Low: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    Moderate: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    High: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    Critical: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
  }[expectedRisk];

  return (
    <div 
      className={`relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/40 rounded-[24px] border border-blue-100/70 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.1)] transition-all duration-300 group ${className}`}
    >
      {/* Subtle decorative radial glow in top-right */}
      <div 
        className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-blue-100/50 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4 sm:space-y-5">
        
        {/* Top Row: Title + Risk Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Today's heat outlook
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Diurnal temperature trajectory & thermal peak timing
            </p>
          </div>

          {/* Expected Risk Badge */}
          <div 
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase ${riskBadgeStyles.bg} ${riskBadgeStyles.text} ${riskBadgeStyles.border} shadow-2xs`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${riskBadgeStyles.dot}`} />
            <span>{expectedRisk} Risk</span>
          </div>
        </div>

        {/* Central Hero Stats: Peak Heat & Timing */}
        <div className="bg-white/80 backdrop-blur-xs rounded-[20px] p-4 sm:p-5 border border-slate-100/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          
          {/* Peak Heat Value */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Peak Heat
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {peakTemp}°C
              </span>
              <span className="text-xs font-semibold text-slate-500">
                at <strong className="text-slate-800">{peakTime}</strong>
              </span>
            </div>
          </div>

          {/* Perceived Heat Index Chip */}
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 py-1">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100/80 flex items-center justify-center text-orange-600 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Heat Index (Feels)</div>
              <div className="text-lg font-bold text-slate-900">{peakHeatIndex}°C</div>
            </div>
          </div>

          {/* Time Window Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Peak window: <strong>12:00 PM – 4:00 PM</strong></span>
          </div>
        </div>

        {/* Plain-English Summary */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {summaryText}
          </p>
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Based on microclimatic model predictions
          </span>

          <Link
            to="/predictions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E60F2] hover:text-blue-700 hover:underline transition-all group"
          >
            <span>View full forecast</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HeatOutlookCard;
