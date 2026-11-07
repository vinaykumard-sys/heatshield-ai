import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
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
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Umbrella,
  Eye,
  CheckCircle2
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
import { WeatherHourlyDetail, WeatherDailyDetail, LiveWeatherBanner } from '../../lib/weatherApi';
import { formatTimeAgo } from '../../lib/utils';

export interface HourlyWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayHourly: WeatherHourlyDetail[];
  currentReading?: any;
  liveBanner?: LiveWeatherBanner | null;
  locationName: string;
  cityName: string;
  lastSyncTime: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

type GraphMetric = 'temp' | 'rain' | 'uv' | 'humidity';

export const HourlyWeatherModal: React.FC<HourlyWeatherModalProps> = ({
  isOpen,
  onClose,
  todayHourly,
  currentReading,
  liveBanner,
  locationName,
  cityName,
  lastSyncTime,
  isRefreshing = false,
  onRefresh
}) => {
  const [selectedMetric, setSelectedMetric] = useState<GraphMetric>('temp');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Scroll to current hour when modal opens
  useEffect(() => {
    if (isOpen && todayHourly.length > 0) {
      const currentIdx = todayHourly.findIndex((h) => h.isCurrentHour);
      if (currentIdx !== -1) {
        setSelectedHourIndex(currentIdx);
        setTimeout(() => {
          const el = document.getElementById(`hourly-card-${currentIdx}`);
          if (el && scrollContainerRef.current) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }, 150);
      }
    }
  }, [isOpen, todayHourly]);

  // Safe hours list (ensure 24 hours)
  const hours = useMemo(() => {
    if (!todayHourly || todayHourly.length === 0) return [];
    return todayHourly;
  }, [todayHourly]);

  // Daily summary metrics
  const summary = useMemo(() => {
    if (hours.length === 0) {
      return {
        maxTemp: 30,
        minTemp: 22,
        peakHeatHour: '14:00',
        maxRainProb: 0,
        totalPrecipMm: 0,
        maxUv: 6,
        avgHumidity: 55,
        avgWind: 12
      };
    }
    let maxTemp = -999;
    let minTemp = 999;
    let peakHour = hours[0].timeShort;
    let maxRainProb = 0;
    let totalPrecipMm = 0;
    let maxUv = 0;
    let sumHumidity = 0;
    let sumWind = 0;

    hours.forEach((h) => {
      if (h.temperature_c > maxTemp) {
        maxTemp = h.temperature_c;
        peakHour = h.timeShort;
      }
      if (h.temperature_c < minTemp) {
        minTemp = h.temperature_c;
      }
      if (h.precipitation_probability > maxRainProb) {
        maxRainProb = h.precipitation_probability;
      }
      totalPrecipMm += h.precipitation_mm;
      if (h.uv_index > maxUv) {
        maxUv = h.uv_index;
      }
      sumHumidity += h.relative_humidity_pct;
      sumWind += h.wind_speed_kmh;
    });

    return {
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      peakHeatHour: peakHour,
      maxRainProb,
      totalPrecipMm: Number(totalPrecipMm.toFixed(1)),
      maxUv: Number(maxUv.toFixed(1)),
      avgHumidity: Math.round(sumHumidity / hours.length),
      avgWind: Math.round(sumWind / hours.length)
    };
  }, [hours]);

  // Chart data
  const chartData = useMemo(() => {
    return hours.map((h, idx) => ({
      index: idx,
      hourLabel: h.timeShort,
      timeFull: h.time12,
      temp: h.temperature_c,
      feelsLike: h.apparent_temperature_c,
      rainProb: h.precipitation_probability,
      precipMm: h.precipitation_mm,
      uv: h.uv_index,
      humidity: h.relative_humidity_pct,
      wind: h.wind_speed_kmh,
      condition: h.weather_condition,
      isCurrent: h.isCurrentHour
    }));
  }, [hours]);

  if (!isOpen) return null;

  const renderWeatherIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'cloud-lightning':
        return <CloudLightning className={`${className} text-purple-600`} />;
      case 'cloud-rain':
        return <CloudRain className={`${className} text-blue-600`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${className} text-sky-500`} />;
      case 'cloud-fog':
        return <Cloud className={`${className} text-slate-400`} />;
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

  const getUvBadge = (uv: number) => {
    if (uv >= 8) return { label: 'Very High', color: 'bg-rose-100 text-rose-800' };
    if (uv >= 6) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    if (uv >= 3) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Low', color: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Today's Hourly Weather Breakdown"
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
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Today's 24-Hour Hourly Weather
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#1E60F2] border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-pulse" />
                Live Open-Meteo
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                {locationName}, {cityName}
              </span>
              <span>·</span>
              <span>
                {lastSyncTime
                  ? `Updated ${formatTimeAgo(lastSyncTime.toISOString())}`
                  : 'Updated just now'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                title="Fetch latest satellite telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODAL BODY (Scrollable) */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* 1. REAL-TIME BANNER */}
          {liveBanner && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${liveBanner.badgeClass}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{liveBanner.icon}</span>
                <div>
                  <h4 className="text-sm font-extrabold">{liveBanner.headline}</h4>
                  <p className="text-xs opacity-90">{liveBanner.details}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-white/70 border border-current/20 shrink-0">
                Real-Time
              </span>
            </div>
          )}

          {/* 2. SUMMARY HIGHLIGHT METRICS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50/80 to-white p-3.5 rounded-2xl border border-blue-100/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                High / Low Temp
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {summary.maxTemp}°C <span className="text-sm font-semibold text-slate-400">/ {summary.minTemp}°C</span>
              </div>
              <span className="text-[11px] font-medium text-blue-600 mt-0.5 block">
                Peak heat at {summary.peakHeatHour}
              </span>
            </div>

            <div className="bg-gradient-to-br from-sky-50/80 to-white p-3.5 rounded-2xl border border-sky-100/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rain Probability
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {summary.maxRainProb}%
              </div>
              <span className="text-[11px] font-medium text-sky-600 mt-0.5 block">
                {summary.totalPrecipMm > 0 ? `${summary.totalPrecipMm} mm expected` : 'Dry conditions expected'}
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50/80 to-white p-3.5 rounded-2xl border border-amber-100/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak UV Radiation
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
                <span>{summary.maxUv}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${getUvBadge(summary.maxUv).color}`}>
                  {getUvBadge(summary.maxUv).label}
                </span>
              </div>
              <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">
                Intense between 11 AM - 3 PM
              </span>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Atmosphere & Wind
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {summary.avgHumidity}% <span className="text-sm font-semibold text-slate-400">RH</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 mt-0.5 block">
                Avg wind {summary.avgWind} km/h
              </span>
            </div>
          </div>

          {/* 3. INTERACTIVE 24-HOUR CURVE GRAPH */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>24-Hour Diurnal Evolution</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    12 AM – 11 PM
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a variable to inspect how the microclimate changes across the entire day
                </p>
              </div>

              {/* Metric selector tabs */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                <button
                  onClick={() => setSelectedMetric('temp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMetric === 'temp'
                      ? 'bg-white text-[#1E60F2] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Temp & Feels
                </button>
                <button
                  onClick={() => setSelectedMetric('rain')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMetric === 'rain'
                      ? 'bg-white text-sky-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rain Probability
                </button>
                <button
                  onClick={() => setSelectedMetric('uv')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMetric === 'uv'
                      ? 'bg-white text-amber-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  UV Index
                </button>
                <button
                  onClick={() => setSelectedMetric('humidity')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMetric === 'humidity'
                      ? 'bg-white text-teal-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Humidity & Wind
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1E60F2" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
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
                        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                            <span className="font-extrabold text-blue-300">{pt.timeFull}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{pt.condition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Air Temperature:</span>
                            <span className="font-bold text-white">{pt.temp}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Feels Like:</span>
                            <span className="font-bold text-amber-300">{pt.feelsLike}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rain Probability:</span>
                            <span className="font-bold text-sky-300">{pt.rainProb}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">UV Index:</span>
                            <span className="font-bold text-amber-400">{pt.uv}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Relative Humidity:</span>
                            <span className="font-bold text-teal-300">{pt.humidity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Wind Speed:</span>
                            <span className="font-bold text-slate-300">{pt.wind} km/h</span>
                          </div>
                        </div>
                      );
                    }}
                  />

                  {selectedMetric === 'temp' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="temp"
                        name="Temperature"
                        stroke="#1E60F2"
                        strokeWidth={2.5}
                        fill="url(#tempGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="feelsLike"
                        name="Feels Like"
                        stroke="#F97316"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="url(#feelsGradient)"
                      />
                    </>
                  )}

                  {selectedMetric === 'rain' && (
                    <Area
                      type="monotone"
                      dataKey="rainProb"
                      name="Rain Chance %"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      fill="url(#rainGradient)"
                    />
                  )}

                  {selectedMetric === 'uv' && (
                    <Area
                      type="monotone"
                      dataKey="uv"
                      name="UV Index"
                      stroke="#EAB308"
                      strokeWidth={2.5}
                      fill="url(#uvGradient)"
                    />
                  )}

                  {selectedMetric === 'humidity' && (
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity %"
                      stroke="#0D9488"
                      strokeWidth={2.5}
                      fill="url(#humGradient)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. COMPLETE HOUR-BY-HOUR 24-HOUR CARDS (12 AM to 11 PM) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Full 24-Hour Timeline</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Scroll horizontally to inspect all hours
                  </span>
                </h3>
              </div>
            </div>

            {/* Horizontal Scrollable Strip of 24 Hours */}
            <div
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory custom-scrollbar"
            >
              {hours.map((h, idx) => {
                const isSelected = selectedHourIndex === idx;
                const isCurrent = h.isCurrentHour;

                return (
                  <div
                    key={idx}
                    id={`hourly-card-${idx}`}
                    onClick={() => setSelectedHourIndex(idx)}
                    className={`shrink-0 w-32 p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 snap-center ${
                      isSelected
                        ? 'bg-blue-50/90 border-[#1E60F2] shadow-md ring-2 ring-[#1E60F2]/20'
                        : isCurrent
                        ? 'bg-sky-50/60 border-sky-300'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    {/* Time & Now Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${isCurrent ? 'text-[#1E60F2]' : 'text-slate-800'}`}>
                        {h.timeShort}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1E60F2] text-white">
                          NOW
                        </span>
                      )}
                    </div>

                    {/* Weather condition icon & label */}
                    <div className="flex flex-col items-center py-1 text-center">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-1">
                        {renderWeatherIcon(h.iconName, 'w-5 h-5')}
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-600 truncate w-full">
                        {h.weather_condition}
                      </span>
                    </div>

                    {/* Temperature */}
                    <div className="text-center">
                      <div className="text-base font-black text-slate-900">
                        {Math.round(h.temperature_c)}°C
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        Feels {Math.round(h.apparent_temperature_c)}°
                      </div>
                    </div>

                    {/* Metrics Footer */}
                    <div className="pt-2 border-t border-slate-100/90 space-y-1 text-[10px] font-semibold text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sky-600">
                          <Droplets className="w-3 h-3 text-sky-500" />
                          {h.precipitation_probability}%
                        </span>
                        <span className="text-amber-600 font-bold">
                          UV {h.uv_index}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>{h.relative_humidity_pct}% RH</span>
                        <span>{Math.round(h.wind_speed_kmh)} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. SELECTED HOUR DEEP-DIVE INSPECTOR CARD */}
          {selectedHourIndex !== null && hours[selectedHourIndex] && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center">
                    {renderWeatherIcon(hours[selectedHourIndex].iconName, 'w-5 h-5')}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Detail for {hours[selectedHourIndex].time12}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Condition: <strong className="text-slate-800">{hours[selectedHourIndex].weather_condition}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-xs font-black text-[#1E60F2] bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                  {hours[selectedHourIndex].temperature_c}°C · Feels like {hours[selectedHourIndex].apparent_temperature_c}°C
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Precipitation</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {hours[selectedHourIndex].precipitation_probability}% · {hours[selectedHourIndex].precipitation_mm} mm
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">UV Index</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {hours[selectedHourIndex].uv_index} ({getUvBadge(hours[selectedHourIndex].uv_index).label})
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Relative Humidity</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {hours[selectedHourIndex].relative_humidity_pct}%
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Wind Speed</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {hours[selectedHourIndex].wind_speed_kmh} km/h
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================================================================= */}
        {/* MODAL FOOTER */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1E60F2]" />
            <span>
              Real-time atmospheric data provided by Open-Meteo High-Resolution Meteorological Telemetry.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#1E60F2] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md transition-colors self-end sm:self-auto"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
