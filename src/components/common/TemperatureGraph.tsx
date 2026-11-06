import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceDot
} from 'recharts';
import { 
  TrendingUp, 
  Thermometer, 
  Flame, 
  Droplets, 
  Clock, 
  SunMedium,
  Sparkles,
  Info
} from 'lucide-react';

export interface HourlyForecastPoint {
  time: string;
  temperature_c: number;
  relative_humidity_pct?: number;
  heat_index_c?: number;
  uv_index?: number;
  wind_speed_kmh?: number;
}

export interface TemperatureGraphProps {
  hourly: HourlyForecastPoint[];
  className?: string;
}

export type ActiveMetric = 'all' | 'temp' | 'feelsLike' | 'humidity';

// Custom glowing dot for active chart hover point
const GlowingActiveDot = (props: any) => {
  const { cx, cy, stroke, fill } = props;
  if (!cx || !cy) return null;

  return (
    <g>
      {/* Outer Glow Halo */}
      <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.2} className="animate-pulse" />
      {/* Middle White Ring */}
      <circle cx={cx} cy={cy} r={6} fill="#FFFFFF" stroke={stroke} strokeWidth={2.5} />
      {/* Inner Solid Dot */}
      <circle cx={cx} cy={cy} r={3} fill={fill || stroke} />
    </g>
  );
};

export const TemperatureGraph: React.FC<TemperatureGraphProps> = ({
  hourly,
  className = '',
}) => {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('all');

  // Format hourly data for fluid spline chart
  const { chartData, peakPoint, minVal, maxVal } = useMemo(() => {
    if (!hourly || hourly.length === 0) {
      return { chartData: [], peakPoint: null, minVal: 20, maxVal: 45 };
    }

    const formatted = hourly.slice(0, 12).map((pt, idx) => {
      let label = pt.time;
      const parts = pt.time.split(':');
      if (parts.length >= 1) {
        const h = parseInt(parts[0], 10);
        if (!isNaN(h)) {
          if (idx === 0) {
            label = 'Now';
          } else {
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 === 0 ? 12 : h % 12;
            const paddedDisplayH = displayH < 10 ? `0${displayH}` : `${displayH}`;
            label = `${paddedDisplayH}:00 ${period}`;
          }
        }
      }

      const t = Math.round(pt.temperature_c);
      const hi = pt.heat_index_c ? Math.round(pt.heat_index_c) : Math.round(t + 2);
      const hum = pt.relative_humidity_pct ? Math.round(pt.relative_humidity_pct) : 55;
      const uv = pt.uv_index !== undefined ? pt.uv_index : 6;

      const riskLevel = hi >= 42 ? 'CRITICAL RISK' : hi >= 38 ? 'HIGH RISK' : hi >= 33 ? 'MODERATE' : 'LOW';
      const riskColor = hi >= 42 ? 'text-rose-600 bg-rose-50 border-rose-200' : hi >= 38 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';

      return {
        time: label,
        rawTime: pt.time,
        temp: t,
        feelsLike: hi,
        humidity: hum,
        uv,
        riskLevel,
        riskColor,
      };
    });

    // Find peak heat point
    let peak = formatted[0];
    formatted.forEach((item) => {
      if (item.feelsLike > peak.feelsLike) {
        peak = item;
      }
    });

    // Calculate Y domain
    const allTemps = formatted.flatMap((d) => [d.temp, d.feelsLike]);
    const minT = Math.floor(Math.min(...allTemps) - 2);
    const maxT = Math.ceil(Math.max(...allTemps) + 3);

    return {
      chartData: formatted,
      peakPoint: peak,
      minVal: minT,
      maxVal: maxT,
    };
  }, [hourly]);

  if (!chartData || chartData.length === 0) {
    return null;
  }

  // Soft Apple / SkySense style custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-[20px] p-4 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.1),0_8px_10px_-6px_rgba(15,23,42,0.05)] text-xs space-y-2 min-w-[170px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span className="font-extrabold text-slate-800">{data.time}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${data.riskColor}`}>
              {data.riskLevel}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[#1E60F2] font-bold">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#1E60F2] inline-block" />
                Air Temp:
              </span>
              <span className="text-sm font-extrabold">{data.temp}°C</span>
            </div>

            <div className="flex items-center justify-between text-orange-600 font-bold">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                Feels Like:
              </span>
              <span className="text-sm font-extrabold">{data.feelsLike}°C</span>
            </div>

            <div className="flex items-center justify-between text-cyan-600 font-bold">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                Humidity:
              </span>
              <span>{data.humidity}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1.5 border-t border-slate-100 font-medium">
            <span>UV Radiation: {data.uv}/12</span>
            <span>Microclimate Model</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-[26px] border border-slate-100/90 p-5 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] space-y-5 transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(15,23,42,0.08)] ${className}`}>
      
      {/* Header Row: Title & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/80 text-[#1E60F2] flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Hourly Temperature & Heat Curve</span>
              {peakPoint && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 hidden md:inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Peak: {peakPoint.time} ({peakPoint.feelsLike}°C)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Fluid spline projection comparing ambient air, heat stress, and relative moisture
            </p>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-2xl border border-slate-200/70 text-xs self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              activeMetric === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveMetric('temp')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              activeMetric === 'temp'
                ? 'bg-white text-[#1E60F2] shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Air Temp
          </button>
          <button
            onClick={() => setActiveMetric('feelsLike')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              activeMetric === 'feelsLike'
                ? 'bg-white text-orange-600 shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Heat Index
          </button>
          <button
            onClick={() => setActiveMetric('humidity')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              activeMetric === 'humidity'
                ? 'bg-white text-cyan-600 shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Humidity
          </button>
        </div>
      </div>

      {/* Responsive Recharts Spline Chart */}
      <div className="h-[240px] sm:h-[260px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <defs>
              {/* Dual-stop Blue Gradient for Air Temp */}
              <linearGradient id="softBlueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#3B82F6" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>

              {/* Dual-stop Orange Gradient for Feels Like */}
              <linearGradient id="softOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.32} />
                <stop offset="60%" stopColor="#F97316" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0.0} />
              </linearGradient>

              {/* Dual-stop Cyan Gradient for Humidity */}
              <linearGradient id="softCyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#06B6D4" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Clean soft horizontal gridlines */}
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              dy={8}
            />

            <YAxis
              domain={activeMetric === 'humidity' ? [20, 100] : [minVal, maxVal]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(v) => activeMetric === 'humidity' ? `${v}%` : `${v}°`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Humidity Spline (when toggled or in all mode) */}
            {activeMetric === 'humidity' && (
              <Area
                type="natural"
                dataKey="humidity"
                name="Humidity"
                stroke="#06B6D4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#softCyanGradient)"
                dot={false}
                activeDot={<GlowingActiveDot stroke="#06B6D4" fill="#0891B2" />}
              />
            )}

            {/* Heat Index / Feels Like Spline */}
            {(activeMetric === 'all' || activeMetric === 'feelsLike') && (
              <Area
                type="natural"
                dataKey="feelsLike"
                name="Feels Like (Heat Index)"
                stroke="#F97316"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#softOrangeGradient)"
                dot={false}
                activeDot={<GlowingActiveDot stroke="#F97316" fill="#EA580C" />}
              />
            )}

            {/* Air Temp Spline */}
            {(activeMetric === 'all' || activeMetric === 'temp') && (
              <Area
                type="natural"
                dataKey="temp"
                name="Air Temp"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#softBlueGradient)"
                dot={false}
                activeDot={<GlowingActiveDot stroke="#3B82F6" fill="#1D4ED8" />}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3B82F6] ring-2 ring-blue-100" />
            <span className="font-semibold text-slate-700">Air Temp (°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316] ring-2 ring-orange-100" />
            <span className="font-semibold text-slate-700">Heat Index / Feels Like (°C)</span>
          </div>
          {activeMetric === 'humidity' && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#06B6D4] ring-2 ring-cyan-100" />
              <span className="font-semibold text-slate-700">Relative Humidity (%)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Next 12 Hours Forecast • Recharts Fluid Spline</span>
        </div>
      </div>
    </div>
  );
};

export default TemperatureGraph;
