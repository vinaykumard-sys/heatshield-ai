import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Thermometer, Flame } from 'lucide-react';

interface HourlyForecastPoint {
  time: string;
  temperature_c: number;
  relative_humidity_pct?: number;
  heat_index_c?: number;
  uv_index?: number;
}

interface TemperatureGraphProps {
  hourly: HourlyForecastPoint[];
  className?: string;
}

export const TemperatureGraph: React.FC<TemperatureGraphProps> = ({
  hourly,
  className = '',
}) => {
  const [activeMetric, setActiveMetric] = useState<'both' | 'temp' | 'feelsLike'>('both');

  if (!hourly || hourly.length === 0) {
    return null;
  }

  // Format hourly data for the chart
  const chartData = hourly.slice(0, 12).map((pt, idx) => {
    // Format hour e.g. "14:00" -> "2 PM", or "Now" for first point
    let label = pt.time;
    const parts = pt.time.split(':');
    if (parts.length >= 1) {
      const h = parseInt(parts[0], 10);
      if (!isNaN(h)) {
        if (idx === 0) label = 'Now';
        else if (h === 0) label = '12 AM';
        else if (h === 12) label = '12 PM';
        else if (h > 12) label = `${h - 12} PM`;
        else label = `${h} AM`;
      }
    }

    const t = Math.round(pt.temperature_c);
    const hi = pt.heat_index_c ? Math.round(pt.heat_index_c) : t;

    return {
      time: label,
      rawTime: pt.time,
      temp: t,
      feelsLike: hi,
      humidity: pt.relative_humidity_pct ? Math.round(pt.relative_humidity_pct) : 50,
      uv: pt.uv_index !== undefined ? pt.uv_index : 5
    };
  });

  // Calculate min & max for Y-axis bounds
  const temps = chartData.flatMap(d => [d.temp, d.feelsLike]);
  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);

  // Custom Apple-style clean tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-lg text-xs space-y-1.5 min-w-[130px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between font-mono">
            <span>{data.time}</span>
            <span className="text-[10px] text-slate-400 font-normal">{data.rawTime}</span>
          </div>
          <div className="flex items-center justify-between text-blue-600 font-semibold font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              Air Temp:
            </span>
            <span>{data.temp}°C</span>
          </div>
          <div className="flex items-center justify-between text-orange-600 font-semibold font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              Real-Feel:
            </span>
            <span>{data.feelsLike}°C</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-0.5 border-t border-slate-100">
            <span>Humidity:</span>
            <span className="font-mono">{data.humidity}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Hourly Temperature & Thermal Stress Curve
            </h3>
            <p className="text-[11px] text-slate-500">
              Next 12 hours ambient temperature vs. humidity-adjusted heat index
            </p>
          </div>
        </div>

        {/* Legend / Filter Chips */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              activeMetric === 'both'
                ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              activeMetric === 'temp'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Air Temp</span>
          </button>
          <button
            onClick={() => setActiveMetric('feelsLike')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              activeMetric === 'feelsLike'
                ? 'bg-orange-500 text-white shadow-2xs font-semibold'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Real-Feel</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
            <defs>
              {/* Blue Gradient for Air Temp */}
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              {/* Orange Gradient for Feels-Like */}
              <linearGradient id="feelsLikeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
              dy={6}
            />

            <YAxis 
              domain={[minTemp, maxTemp]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${v}°`}
            />

            <Tooltip content={<CustomTooltip />} />

            {(activeMetric === 'both' || activeMetric === 'feelsLike') && (
              <Area 
                type="monotone" 
                dataKey="feelsLike" 
                stroke="#F97316" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#feelsLikeGradient)" 
                name="Real-Feel"
                dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#F97316', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}

            {(activeMetric === 'both' || activeMetric === 'temp') && (
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#2563EB" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#tempGradient)" 
                name="Air Temp"
                dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureGraph;
