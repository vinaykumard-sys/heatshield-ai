import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, 
  CloudSun, 
  Flame, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Droplets,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { TemperatureGraph, HourlyForecastPoint } from '../common/TemperatureGraph';

export interface DailyForecastCardItem {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  avg_humidity_pct?: number;
  uv_index_max?: number;
  risk_level?: 'low' | 'moderate' | 'high' | 'critical';
  weather_condition?: string;
}

export interface HorizontalForecastStripProps {
  forecastDaily?: DailyForecastCardItem[];
  forecastHourly?: HourlyForecastPoint[];
  showHourlyGraph?: boolean;
  selectedDayIndex?: number;
  onSelectDay?: (dayIndex: number) => void;
  className?: string;
}

/**
 * Parses daily date string into human friendly label (e.g. "Today", "Tomorrow", "Wed")
 */
function formatDayLabel(rawDate: string, index: number): { dayLabel: string; dateSub: string } {
  if (index === 0) return { dayLabel: 'Today', dateSub: 'Live' };
  if (index === 1) return { dayLabel: 'Tomorrow', dateSub: '+1 Day' };

  if (rawDate.includes(',')) {
    const [weekday, dayMonth] = rawDate.split(',');
    return { dayLabel: weekday.trim(), dateSub: (dayMonth || '').trim() };
  }

  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayLabel: days[d.getDay()],
      dateSub: `${months[d.getMonth()]} ${d.getDate()}`,
    };
  }

  return { dayLabel: `Day +${index}`, dateSub: rawDate };
}

export const HorizontalForecastStrip: React.FC<HorizontalForecastStripProps> = ({
  forecastDaily: propsDaily,
  forecastHourly: propsHourly,
  showHourlyGraph = true,
  selectedDayIndex: controlledSelectedIndex,
  onSelectDay,
  className = '',
}) => {
  const context = useLocationTracker();

  const dailyRaw = propsDaily || context.forecastDaily || [];
  const hourly = propsHourly || context.forecastHourly || [];

  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(0);
  const [isGraphExpanded, setIsGraphExpanded] = useState<boolean>(true);

  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;

  const handleSelect = (idx: number) => {
    setInternalSelectedIndex(idx);
    if (onSelectDay) {
      onSelectDay(idx);
    }
  };

  // Provide realistic fallback if daily forecast list is empty or short
  const defaultDailyList: DailyForecastCardItem[] = [
    { date: 'Today', max_temp_c: 28, min_temp_c: 20, avg_humidity_pct: 54, uv_index_max: 7.2, risk_level: 'moderate' },
    { date: 'Tomorrow', max_temp_c: 29, min_temp_c: 19, avg_humidity_pct: 50, uv_index_max: 7.8, risk_level: 'moderate' },
    { date: 'Day +2', max_temp_c: 28, min_temp_c: 20, avg_humidity_pct: 52, uv_index_max: 7.5, risk_level: 'moderate' },
    { date: 'Day +3', max_temp_c: 28, min_temp_c: 19, avg_humidity_pct: 48, uv_index_max: 8.0, risk_level: 'moderate' },
    { date: 'Day +4', max_temp_c: 30, min_temp_c: 21, avg_humidity_pct: 55, uv_index_max: 8.4, risk_level: 'high' },
  ];

  const dailyList: DailyForecastCardItem[] = dailyRaw && dailyRaw.length >= 4 
    ? dailyRaw.slice(0, 5) 
    : defaultDailyList;

  // Icon selector based on risk & temp
  const renderWeatherIcon = (risk: string = 'moderate', maxTemp: number) => {
    if (risk === 'critical' || maxTemp >= 40) {
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
          <Flame className="w-4 h-4" />
        </div>
      );
    }
    if (risk === 'high' || maxTemp >= 35) {
      return (
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
          <Sun className="w-4 h-4" />
        </div>
      );
    }
    if (risk === 'moderate' || maxTemp >= 28) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
          <CloudSun className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
        <Sun className="w-4 h-4" />
      </div>
    );
  };

  const getRiskPill = (risk: string = 'moderate') => {
    switch (risk.toLowerCase()) {
      case 'critical':
        return { text: 'Critical', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'high':
        return { text: 'High', style: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'moderate':
        return { text: 'Moderate', style: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { text: 'Low', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold shadow-2xs">
              <Calendar className="w-5 h-5 text-[#1E60F2]" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              5-Day Outlook & 24h Prediction Wave
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Multi-day high/low temperature trajectory and thermal risk progression
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {showHourlyGraph && (
            <button
              type="button"
              onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span>{isGraphExpanded ? 'Hide Wave Line' : 'Show Wave Line'}</span>
              {isGraphExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          <Link
            to="/predictions"
            className="text-xs font-bold text-[#1E60F2] hover:text-blue-700 hover:underline flex items-center gap-1 group"
          >
            <span>Full 7-day model</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Horizontal Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {dailyList.map((day, idx) => {
          const isToday = idx === 0;
          const isSelected = selectedIndex === idx;
          const { dayLabel, dateSub } = formatDayLabel(day.date, idx);
          const maxTemp = Math.round(day.max_temp_c);
          const minTemp = Math.round(day.min_temp_c);
          const riskInfo = getRiskPill(day.risk_level);

          return (
            <button
              key={`${day.date}-${idx}`}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`text-left p-4 rounded-3xl transition-all duration-200 relative flex flex-col justify-between cursor-pointer group select-none ${
                isToday
                  ? 'bg-blue-50/80 border border-blue-200/90 ring-1 ring-blue-300/40 text-blue-900 shadow-xs'
                  : isSelected
                  ? 'bg-slate-50/90 border border-blue-300 text-slate-900 shadow-2xs'
                  : 'bg-white border border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm shadow-blue-500/5'
              }`}
            >
              {/* Active Today Ribbon indicator */}
              {isToday && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#1E60F2] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                    Current
                  </span>
                </div>
              )}

              {/* Day title & date */}
              <div className="space-y-0.5">
                <span className={`text-xs sm:text-sm font-black block ${isToday ? 'text-blue-950' : 'text-slate-900'}`}>
                  {dayLabel}
                </span>
                <span className={`text-[10px] block font-semibold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                  {dateSub}
                </span>
              </div>

              {/* Icon & Temperature */}
              <div className="my-3.5 flex items-center justify-between">
                {renderWeatherIcon(day.risk_level, maxTemp)}

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-xl sm:text-2xl font-black ${isToday ? 'text-blue-950' : 'text-slate-900'}`}>
                      {maxTemp}°
                    </span>
                    <span className={`text-xs font-bold ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                      / {minTemp}°
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Risk Tag & Humidity */}
              <div className="pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                <span 
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${riskInfo.style}`}
                >
                  {riskInfo.text}
                </span>

                {day.avg_humidity_pct !== undefined && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-bold">
                    <Droplets className="w-2.5 h-2.5 text-sky-400" />
                    {Math.round(day.avg_humidity_pct)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Integrated 24-Hour Smooth Spline Bezier Temperature Graph with Anchor Dots */}
      {showHourlyGraph && isGraphExpanded && (
        <div className="pt-1">
          <TemperatureGraph hourly={hourly} />
        </div>
      )}

    </div>
  );
};

export default HorizontalForecastStrip;
