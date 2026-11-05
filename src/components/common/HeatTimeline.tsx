import React from 'react';
import { Sun, CloudSun, Moon, Flame, Clock } from 'lucide-react';

interface HourlyPoint {
  time: string;
  temperature_c: number;
  relative_humidity_pct?: number;
  heat_index_c?: number;
  uv_index?: number;
}

interface HeatTimelineProps {
  hourly: HourlyPoint[];
  currentTemp?: number;
  className?: string;
}

export const HeatTimeline: React.FC<HeatTimelineProps> = ({
  hourly,
  currentTemp = 32,
  className = '',
}) => {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  // Find max heat index / temperature to mark peak hour
  const maxHeatPoint = hourly.reduce(
    (max, curr) => {
      const currStress = curr.heat_index_c || curr.temperature_c;
      const maxStress = max.heat_index_c || max.temperature_c;
      return currStress > maxStress ? curr : max;
    },
    hourly[0]
  );

  const formatHourLabel = (timeStr: string, index: number) => {
    if (index === 0) return 'Now';
    
    // Check if format is "HH:MM"
    const parts = timeStr.split(':');
    if (parts.length >= 1) {
      const hourNum = parseInt(parts[0], 10);
      if (!isNaN(hourNum)) {
        if (hourNum === 0) return '12 AM';
        if (hourNum === 12) return '12 PM';
        if (hourNum > 12) return `${hourNum - 12} PM`;
        return `${hourNum} AM`;
      }
    }
    return timeStr;
  };

  const getWeatherIcon = (timeStr: string, temp: number) => {
    let hourNum = 12;
    const parts = timeStr.split(':');
    if (parts.length >= 1) {
      hourNum = parseInt(parts[0], 10);
    }
    const isNight = hourNum >= 19 || hourNum < 6;

    if (isNight) {
      return <Moon className="w-5 h-5 text-indigo-400" />;
    }
    if (temp >= 36) {
      return <Sun className="w-5 h-5 text-amber-500 animate-[spin_12s_linear_infinite]" />;
    }
    return <CloudSun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Today's Heat & Exposure Timeline
            </h3>
            <p className="text-[11px] text-slate-500">
              Hourly ambient temperature and thermal stress window
            </p>
          </div>
        </div>

        {maxHeatPoint && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Peak Heat: {maxHeatPoint.time} ({Math.round(maxHeatPoint.heat_index_c || maxHeatPoint.temperature_c)}°C)</span>
          </div>
        )}
      </div>

      {/* Hourly Strip */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        <div className="flex items-stretch gap-2.5 min-w-max">
          {hourly.slice(0, 10).map((hour, idx) => {
            const isPeak = hour.time === maxHeatPoint?.time;
            const hourLabel = formatHourLabel(hour.time, idx);
            const tempVal = Math.round(hour.temperature_c);
            const heatIndexVal = hour.heat_index_c ? Math.round(hour.heat_index_c) : tempVal;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[84px] text-center transition-all ${
                  isPeak
                    ? 'bg-amber-50/70 border-2 border-amber-300 shadow-sm relative'
                    : 'bg-slate-50/60 border border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                {isPeak && (
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-2xs">
                    Peak
                  </span>
                )}

                <span className="text-xs font-semibold text-slate-600 font-mono">
                  {hourLabel}
                </span>

                <div className="my-2.5">
                  {getWeatherIcon(hour.time, tempVal)}
                </div>

                <div className="space-y-0.5">
                  <span className="text-base font-extrabold text-slate-900 font-mono block">
                    {tempVal}°
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {heatIndexVal > tempVal ? `Feels ${heatIndexVal}°` : `${hour.relative_humidity_pct ?? 50}% hum`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeatTimeline;
