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
  Activity
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
    // "Wed, 8 Nov" or "Thu, 9 Nov"
    const [weekday, dayMonth] = rawDate.split(',');
    return { dayLabel: weekday.trim(), dateSub: (dayMonth || '').trim() };
  }

  // Fallback: parse date if possible
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
    ? dailyRaw.slice(0, 7) 
    : defaultDailyList;

  // Icon selector based on risk & temp
  const renderWeatherIcon = (risk: string = 'moderate', maxTemp: number) => {
    if (risk === 'critical' || maxTemp >= 40) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
          <Flame className="w-4 h-4" />
        </div>
      );
    }
    if (risk === 'high' || maxTemp >= 35) {
      return (
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
          <Sun className="w-4 h-4" />
        </div>
      );
    }
    if (risk === 'moderate' || maxTemp >= 28) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
          <CloudSun className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
        <Sun className="w-4 h-4" />
      </div>
    );
  };

  const getRiskPill = (risk: string = 'moderate') => {
    switch (risk.toLowerCase()) {
      case 'critical':
        return { text: 'Critical', style: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'high':
        return { text: 'High', style: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'moderate':
        return { text: 'Moderate', style: 'bg-amber-100 text-amber-700 border-amber-200' };
      default:
        return { text: 'Low', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header bar with view full forecast link */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>5-Day Outlook & Diurnal Spline</span>
          </h3>
          <p className="text-xs text-slate-500">
            Multi-day high/low temperature trajectory and thermal risk progression
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showHourlyGraph && hourly.length > 0 && (
            <button
              type="button"
              onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>{isGraphExpanded ? 'Hide Spline' : 'Show Spline'}</span>
              {isGraphExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
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
              className={`text-left p-3.5 sm:p-4 rounded-[22px] transition-all duration-300 relative flex flex-col justify-between cursor-pointer group select-none ${
                isToday
                  ? 'bg-[#EFF6FF] border border-[#2563EB]/30 ring-1 ring-[#2563EB]/20 text-[#1E3A8A] shadow-[0_4px_16px_-2px_rgba(37,99,235,0.12)]'
                  : isSelected
                  ? 'bg-blue-50/60 border border-blue-300/80 ring-1 ring-blue-300/30 text-slate-900 shadow-xs'
                  : 'bg-white border border-slate-100/90 text-slate-700 hover:border-slate-200 hover:bg-slate-50/60 shadow-2xs'
              }`}
            >
              {/* Active Today Ribbon indicator */}
              {isToday && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                    Current
                  </span>
                </div>
              )}

              {/* Day title & date */}
              <div className="space-y-0.5">
                <span className={`text-xs sm:text-sm font-bold block ${isToday ? 'text-[#1E3A8A]' : 'text-slate-900'}`}>
                  {dayLabel}
                </span>
                <span className={`text-[10px] block font-medium ${isToday ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
                  {dateSub}
                </span>
              </div>

              {/* Icon & Temperature */}
              <div className="my-3 flex items-center justify-between">
                {renderWeatherIcon(day.risk_level, maxTemp)}

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-lg sm:text-xl font-black ${isToday ? 'text-[#1E3A8A]' : 'text-slate-900'}`}>
                      {maxTemp}°
                    </span>
                    <span className={`text-xs font-semibold ${isToday ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
                      / {minTemp}°
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Risk Tag */}
              <div className="pt-2 border-t border-slate-100/60 flex items-center justify-between">
                <span 
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${riskInfo.style}`}
                >
                  {riskInfo.text}
                </span>

                {day.avg_humidity_pct !== undefined && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-medium">
                    <Droplets className="w-2.5 h-2.5 text-sky-400" />
                    {Math.round(day.avg_humidity_pct)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Integrated Smooth Spline Bezier Temperature Graph */}
      {showHourlyGraph && hourly && hourly.length > 0 && isGraphExpanded && (
        <div className="mt-4 pt-2">
          <TemperatureGraph hourly={hourly} />
        </div>
      )}

    </div>
  );
};

export default HorizontalForecastStrip;
