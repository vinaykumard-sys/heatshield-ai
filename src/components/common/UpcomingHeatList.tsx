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
    if (temp >= 36) return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
    return <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <div className={`bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Upcoming Hours
            </h3>
            <p className="text-[11px] text-slate-500">
              Next expected temperature shifts
            </p>
          </div>
        </div>

        {maxHeatPoint && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-700 bg-amber-50 border border-amber-200">
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
              className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors ${
                isPeak
                  ? 'bg-amber-50/70 border border-amber-200'
                  : 'bg-[#F5F8FC] border border-[#E5EDF5] hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-[80px]">
                {getWeatherIcon(hour.time, temp)}
                <span className="font-semibold text-slate-700">
                  {label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-bold text-slate-900">{temp}°C</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">
                    feels {heatIndex}°C
                  </span>
                </div>

                {isPeak && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Peak
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingHeatList;
