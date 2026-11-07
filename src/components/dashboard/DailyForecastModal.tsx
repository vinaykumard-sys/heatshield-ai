import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { WeatherDailyDetail, WeatherHourlyDetail, DayTimeBlock } from '../../lib/weatherApi';

export interface DailyForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayIndex?: number;
  forecastDaily: WeatherDailyDetail[];
  locationName: string;
  cityName: string;
}

export const DailyForecastModal: React.FC<DailyForecastModalProps> = ({
  isOpen,
  onClose,
  initialDayIndex = 0,
  forecastDaily = [],
  locationName,
  cityName
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialDayIndex);

  // Sync initialDayIndex whenever modal opens or changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDayIndex(initialDayIndex);
    }
  }, [isOpen, initialDayIndex]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const daysList = useMemo(() => {
    return Array.isArray(forecastDaily) ? forecastDaily : [];
  }, [forecastDaily]);

  const activeDay: WeatherDailyDetail | undefined = daysList[selectedDayIndex] || daysList[0];

  if (!isOpen || !activeDay) return null;

  const renderWeatherIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'cloud-lightning':
        return <CloudLightning className={`${className} text-purple-600`} />;
      case 'cloud-rain':
        return <CloudRain className={`${className} text-blue-600`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${className} text-sky-500`} />;
      case 'cloud-fog':
      case 'cloud':
        return <Cloud className={`${className} text-slate-500`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-amber-500`} />;
      case 'snowflake':
        return <Snowflake className={`${className} text-cyan-400`} />;
      case 'sun':
      default:
        return <Sun className={`${className} text-amber-500`} />;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return {
          label: 'CRITICAL HEAT RISK',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          pulse: 'bg-rose-500'
        };
      case 'high':
        return {
          label: 'HIGH HEAT RISK',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
          pulse: 'bg-orange-500'
        };
      case 'moderate':
        return {
          label: 'MODERATE HEAT RISK',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          pulse: 'bg-amber-500'
        };
      default:
        return {
          label: 'LOW / SAFE RISK',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          pulse: 'bg-emerald-500'
        };
    }
  };

  const riskBadge = getRiskBadge(activeDay.risk_level);

  // Hourly curve data for active day
  const hourlyChartData = (activeDay.hourly || []).map((h) => ({
    hourLabel: h.timeShort,
    temp: h.temperature_c,
    feelsLike: h.apparent_temperature_c,
    rainProb: h.precipitation_probability,
    humidity: h.relative_humidity_pct,
    uv: h.uv_index,
    condition: h.weather_condition
  }));

  const renderTimeBlock = (block: DayTimeBlock, iconType: 'morning' | 'afternoon' | 'evening' | 'night') => {
    const isAfternoon = iconType === 'afternoon';
    return (
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          isAfternoon
            ? 'bg-amber-50/60 border-amber-200/90 shadow-2xs'
            : 'bg-white border-slate-200/80 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-900 block">{block.title}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{block.timeRange}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
            {renderWeatherIcon(block.iconName, 'w-4 h-4')}
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-slate-900">
            {Math.round(block.temp_c)}°C
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Feels like {Math.round(block.feels_like_c)}°C
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sky-600">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              {block.rain_probability}% Rain
            </span>
            <span className="text-amber-600 font-bold">
              UV {block.uv_index}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>{block.humidity_pct}% RH</span>
            <span>{block.wind_speed_kmh} km/h Wind</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detailed 7-Day Forecast Overview"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* MODAL HEADER */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-sky-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-[#1E60F2]/10 text-[#1E60F2] flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                7-Day High-Resolution Meteorological Forecast
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span className="font-bold text-slate-700">{locationName}, {cityName}</span>
              <span>·</span>
              <span>Select any day below to inspect time-of-day blocks and thermal risk</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors self-end sm:self-auto"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 7-DAY SELECTOR TABS (Scrollable) */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth custom-scrollbar">
            {daysList.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`shrink-0 px-4 py-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#1E60F2] text-white border-[#1E60F2] shadow-md shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                    {renderWeatherIcon(day.iconName, 'w-4 h-4')}
                  </div>
                  <div>
                    <span className="text-xs font-black block leading-tight">
                      {day.dayName}
                    </span>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {Math.round(day.max_temp_c)}° / {Math.round(day.min_temp_c)}°
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODAL BODY (Scrollable) */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* 1. SELECTED DAY HERO BANNER */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-sky-50/40 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${riskBadge.badgeClass}`}>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${riskBadge.pulse}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${riskBadge.pulse}`} />
                  </span>
                  {riskBadge.label}
                </span>

                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {activeDay.date}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{activeDay.dayName}</span>
                  <span className="text-xl">·</span>
                  <span className="text-lg font-bold text-[#1E60F2]">{activeDay.weather_condition}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl font-medium">
                  {activeDay.risk_assessment}
                </p>
              </div>
            </div>

            {/* High/Low Temperature Pill */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs self-start md:self-auto shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                {renderWeatherIcon(activeDay.iconName, 'w-6 h-6')}
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 leading-none">
                  {Math.round(activeDay.max_temp_c)}°C
                </div>
                <div className="text-xs font-bold text-slate-400 mt-1">
                  Low: {Math.round(activeDay.min_temp_c)}°C · Feels {Math.round(activeDay.apparent_temp_max_c)}°
                </div>
              </div>
            </div>
          </div>

          {/* 2. STATS ROW (Precipitation, UV, Wind, Humidity) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rain Probability
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                <span>{activeDay.precipitation_probability_max}%</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                {activeDay.precipitation_sum_mm > 0 ? `${activeDay.precipitation_sum_mm} mm total` : 'No rain recorded'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak UV Radiation
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{activeDay.uv_index_max}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                Peak hours 11:00 – 15:00
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Max Wind Gusts
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-slate-500" />
                <span>{Math.round(activeDay.wind_speed_max_kmh)} km/h</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                10-meter surface anemometer
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mean Humidity
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {activeDay.avg_humidity_pct}%
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                Diurnal humidity cycle
              </span>
            </div>
          </div>

          {/* 3. TIME-OF-DAY BLOCKS (Morning, Afternoon, Evening, Night) */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Time-of-Day Trajectory</span>
              <span className="text-[10px] font-bold text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                4 Key Day Phases
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {renderTimeBlock(activeDay.timeBlocks.morning, 'morning')}
              {renderTimeBlock(activeDay.timeBlocks.afternoon, 'afternoon')}
              {renderTimeBlock(activeDay.timeBlocks.evening, 'evening')}
              {renderTimeBlock(activeDay.timeBlocks.night, 'night')}
            </div>
          </div>

          {/* 4. HOURLY BREAKDOWN FOR THIS DAY */}
          {hourlyChartData.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    24-Hour Diurnal Progression for {activeDay.dayName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hourly temperature curve and diurnal heat distribution
                  </p>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dayTempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1E60F2" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="hourLabel"
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                      interval={2}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pt = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1">
                            <span className="font-extrabold text-blue-300 block">{pt.hourLabel} · {pt.condition}</span>
                            <div>Air Temp: <strong>{pt.temp}°C</strong></div>
                            <div>Feels Like: <strong>{pt.feelsLike}°C</strong></div>
                            <div>Rain Chance: <strong>{pt.rainProb}%</strong></div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      name="Temperature"
                      stroke="#1E60F2"
                      strokeWidth={2.5}
                      fill="url(#dayTempGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 5. RECOMMENDATIONS & HEAT HAZARD ADVISORY */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#1E60F2] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-slate-900">
                HeatShield Health Recommendation for {activeDay.dayName}
              </h4>
              <p className="text-slate-600 leading-relaxed font-medium">
                {activeDay.risk_level === 'critical' || activeDay.risk_level === 'high'
                  ? 'Plan intense outdoor work early before 10:30 AM or after 5:00 PM. Keep vulnerable family members in cool indoor spaces. Carry hydration electrolytes if traveling.'
                  : 'Atmospheric conditions allow normal outdoor activities. Ensure routine hydration and monitor solar exposure during midday hours.'}
              </p>
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* MODAL FOOTER */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Open-Meteo High-Resolution Ensemble Telemetry</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#1E60F2] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
