import React from 'react';
import { Sun, CloudSun, Moon, Flame, Clock } from 'lucide-react';

interface HourlyPoint {
  time: string;
  temperature_c: number;
  relative_humidity_pct?: number;
  heat_index_c?: number;
  uv_index?: number;
}

interface UpcomingHeatListProps {
  hourly: HourlyPoint[];
  className?: string;
}

export const UpcomingHeatList: React.FC<UpcomingHeatListProps> = ({
  hourly,
  className = '',
}) => {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  // Find peak heat point
  const maxHeatPoint = hourly.reduce(
    (max, curr) => {
      const currStress = curr.heat_index_c || curr.temperature_c;
      const maxStress = max.heat_index_c || max.temperature_c;
      return currStress > maxStress ? curr : max;
    },
    hourly[0]
  );

  const formatHour = (timeStr: string, idx: number) => {
    if (idx === 0) return 'Now';
    const parts = timeStr.split(':');
    if (parts.length >= 1) {
      const h = parseInt(parts[0], 10);
      if (!isNaN(h)) {
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        if (h > 12) return `${h - 12} PM`;
        return `${h} AM`;
      }
    }
    return timeStr;
  };

  const getWeatherIcon = (timeStr: string, temp: number) => {
    let hourNum = 12;
    const parts = timeStr.split(':');
    if (parts.length >= 1) hourNum = parseInt(parts[0], 10);
    const isNight = hourNum >= 19 || hourNum < 6;

    if (isNight) return <Moon className="w-4 h-4 text-indigo-400 shrink-0" />;
    if (temp >= 36) return <Sun className="w-4 h-4 text-amber-500 animate-[spin_12s_linear_infinite] shrink-0" />;
    return <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Upcoming Heat (Next Hours)
            </h3>
            <p className="text-[11px] text-slate-500">
              Thermal trajectory for your immediate sector
            </p>
          </div>
        </div>

        {maxHeatPoint && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Peak: {maxHeatPoint.time}
          </span>
        )}
      </div>

      {/* Hourly Stack List */}
      <div className="space-y-2">
        {hourly.slice(0, 5).map((hour, idx) => {
          const isPeak = hour.time === maxHeatPoint?.time;
          const label = formatHour(hour.time, idx);
          const temp = Math.round(hour.temperature_c);
          const heatIndex = hour.heat_index_c ? Math.round(hour.heat_index_c) : temp;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs transition-colors ${
                isPeak
                  ? 'bg-amber-50/70 border border-amber-200'
                  : 'bg-slate-50/60 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-[70px]">
                {getWeatherIcon(hour.time, temp)}
                <span className="font-semibold text-slate-700 font-mono text-xs">{label}</span>
              </div>

              {isPeak ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-amber-600" />
                  Peak Stress
                </span>
              ) : heatIndex >= 38 ? (
                <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  High Index
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  {hour.relative_humidity_pct ?? 50}% humidity
                </span>
              )}

              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-extrabold text-slate-900">{temp}°</span>
                <span className="text-[11px] text-slate-400">
                  {heatIndex > temp ? `(${heatIndex}°)` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingHeatList;
