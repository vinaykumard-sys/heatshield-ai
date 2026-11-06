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

    const riskLevel = hi >= 42 ? 'CRITICAL RISK' : hi >= 38 ? 'HIGH RISK' : hi >= 33 ? 'MODERATE RISK' : 'LOW RISK';
    const riskColor = hi >= 42 ? 'text-red-600 bg-red-50' : hi >= 38 ? 'text-orange-600 bg-orange-50' : hi >= 33 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

    return {
      time: label,
      rawTime: pt.time,
      temp: t,
      feelsLike: hi,
      humidity: pt.relative_humidity_pct ? Math.round(pt.relative_humidity_pct) : 50,
      uv: pt.uv_index !== undefined ? pt.uv_index : 5,
      riskLevel,
      riskColor
    };
  });

  const temps = chartData.flatMap(d => [d.temp, d.feelsLike]);
  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);

  // Custom Apple-style clean tooltip (Section 17)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#E5EDF5] rounded-2xl p-3.5 shadow-dropdown text-xs space-y-1.5 min-w-[150px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span className="font-semibold">{data.time}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${data.riskColor}`}>
              {data.riskLevel}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#1E60F2] font-bold">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#1E60F2] inline-block" />
              Air Temp:
            </span>
            <span>{data.temp}°C</span>
          </div>
          <div className="flex items-center justify-between text-orange-600 font-bold">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              Feels like:
            </span>
            <span>{data.feelsLike}°C</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
            <span>Humidity: {data.humidity}%</span>
            <span>UV: {data.uv}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-[20px] border border-[#E5EDF5] p-6 shadow-xs space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Hourly Temperature & Heat Curve
            </h3>
            <p className="text-[11px] text-slate-500">
              Air temperature vs feels-like heat stress
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-[#F5F8FC] p-1 rounded-xl border border-[#E5EDF5] text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeMetric === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeMetric === 'temp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Air Temp
          </button>
          <button
            onClick={() => setActiveMetric('feelsLike')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeMetric === 'feelsLike' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Feels Like
          </button>
        </div>
      </div>

      {/* Responsive Recharts Area Chart */}
      <div className="h-[210px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#1E60F2" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
              dy={6}
            />

            <YAxis
              domain={[minTemp, maxTemp]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `${v}°`}
            />

            <Tooltip content={<CustomTooltip />} />

            {(activeMetric === 'both' || activeMetric === 'feelsLike') && (
              <Area
                type="monotone"
                dataKey="feelsLike"
                name="Feels Like"
                stroke="#F97316"
                strokeWidth={2.4}
                fillOpacity={1}
                fill="url(#orangeGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#F97316', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}

            {(activeMetric === 'both' || activeMetric === 'temp') && (
              <Area
                type="monotone"
                dataKey="temp"
                name="Air Temp"
                stroke="#1E60F2"
                strokeWidth={2.4}
                fillOpacity={1}
                fill="url(#blueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#1E60F2', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2]" />
            <span>Air Temp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            <span>Feels Like (Heat Index)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Next 12 Hours
        </span>
      </div>
    </div>
  );
};

export default TemperatureGraph;
