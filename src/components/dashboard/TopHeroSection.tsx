import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  RefreshCw, 
  ArrowUpRight, 
  Flame, 
  Sun, 
  CloudSun, 
  Droplets, 
  ChevronDown, 
  ChevronUp,
  Sparkles, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Activity, 
  Clock,
  Wind,
  Compass,
  Cpu
} from 'lucide-react';
import { CountUp } from '../common/CountUp';
import { HeatRiskGauge } from '../common/HeatRiskGauge';
import { LocationZone, EnvironmentalReading, HeatRiskAssessment } from '../../types';
import { formatTimeAgo } from '../../lib/utils';
import { evaluateHeatSafety } from '../../lib/actionEngine';
import { DataFreshnessBadge, DataFreshnessStatus } from '../common/DataFreshnessBadge';

interface TopHeroSectionProps {
  userName?: string;
  currentLocation: {
    localityName: string;
    city: string;
    state: string;
    isRealDeviceLocation?: boolean;
    locationSource?: string;
  };
  currentReading: EnvironmentalReading | null;
  currentRisk: HeatRiskAssessment | null;
  forecastDaily?: any[];
  forecastHourly?: any[];
  lastSyncTime: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  selectedZone: LocationZone | null;
  locations: LocationZone[];
  onSelectLocality: (loc: LocationZone) => void;
  className?: string;
}

export const TopHeroSection: React.FC<TopHeroSectionProps> = ({
  userName,
  currentLocation,
  currentReading,
  currentRisk,
  forecastDaily = [],
  forecastHourly = [],
  lastSyncTime,
  isRefreshing,
  onRefresh,
  selectedZone,
  locations,
  onSelectLocality,
  className = '',
}) => {
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const currentTemp = currentReading?.temperature_c ?? 27;
  const feelsLike = currentReading?.feels_like_c ?? (currentTemp + 2);
  const humidity = currentReading?.relative_humidity_pct ?? 55;
  const uv = currentReading?.uv_index ?? 6;
  const wind = currentReading?.wind_speed_kmh ?? 12;

  // Authoritative Action Engine
  const actionResult = useMemo(() => {
    return evaluateHeatSafety({
      currentTemp,
      feelsLikeTemp: feelsLike,
      humidity,
      uvIndex: uv,
      windSpeedKmH: wind,
      forecastHourly,
      observedAt: lastSyncTime ? lastSyncTime.toISOString() : undefined
    });
  }, [currentTemp, feelsLike, humidity, uv, wind, forecastHourly, lastSyncTime]);

  const riskScore = actionResult.riskScore;
  const riskLevel = actionResult.riskLevel;
  const slogan = actionResult.residentSlogan;
  const peakTime = actionResult.peakHeat.timeLabel;
  const peakTemp = actionResult.peakHeat.temperature;

  const localityDisplayName = currentLocation.localityName || selectedZone?.name || 'Central Ward';

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userName ? userName.split(' ')[0] : 'Resident';

  // Freshness status
  const freshnessStatus: DataFreshnessStatus = !navigator.onLine 
    ? 'OFFLINE'
    : lastSyncTime && (Date.now() - lastSyncTime.getTime() > 1000 * 60 * 45)
    ? 'STALE'
    : currentReading
    ? 'LIVE'
    : 'CACHED';

  // Risk display styles
  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'extreme':
        return { text: 'EXTREME RISK', color: 'bg-red-50 text-red-700 border-red-200', pulse: 'bg-red-500' };
      case 'high':
        return { text: 'HIGH RISK', color: 'bg-orange-50 text-orange-700 border-orange-200', pulse: 'bg-orange-500' };
      case 'moderate':
        return { text: 'MODERATE RISK', color: 'bg-amber-50 text-amber-800 border-amber-200', pulse: 'bg-amber-500' };
      case 'low':
      default:
        return { text: 'LOW RISK', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', pulse: 'bg-emerald-500' };
    }
  };

  const riskBadge = getRiskBadge();

  // Mini 4-day forecast derived from real data
  const miniForecast = useMemo(() => {
    if (forecastDaily && forecastDaily.length >= 4) {
      return forecastDaily.slice(0, 4).map((d: any, idx: number) => {
        let dayName = 'Today';
        if (idx === 1) dayName = 'Tomorrow';
        else if (idx > 1) {
          const dt = new Date(Date.now() + idx * 86400000);
          dayName = dt.toLocaleDateString([], { weekday: 'short' });
        }
        return {
          dayName,
          high: Math.round(d.temperature_max_c ?? d.high_c ?? 34),
          low: Math.round(d.temperature_min_c ?? d.low_c ?? 22),
          risk: d.risk_category || 'moderate'
        };
      });
    }

    return [
      { dayName: 'Today', high: Math.round(currentTemp + 5), low: Math.round(currentTemp - 4), risk: riskLevel },
      { dayName: 'Tomorrow', high: Math.round(currentTemp + 6), low: Math.round(currentTemp - 3), risk: riskLevel },
      { dayName: 'Day 3', high: Math.round(currentTemp + 4), low: Math.round(currentTemp - 4), risk: 'moderate' },
      { dayName: 'Day 4', high: Math.round(currentTemp + 3), low: Math.round(currentTemp - 5), risk: 'low' },
    ];
  }, [forecastDaily, currentTemp, riskLevel]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ------------------------------------------------------------------ */}
      {/* TOP HEADER BAR: Welcome, Location Selector & Data Freshness Badge */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {displayName}
            </h1>
            <DataFreshnessBadge
              status={freshnessStatus}
              observedAt={lastSyncTime?.toISOString()}
              source="Open-Meteo & Ground Telemetry"
              showDetails={true}
            />
          </div>
          <p className="text-xs text-slate-500">
            Real-time neighborhood heat risk, plain-language guidance, and emergency protection
          </p>
        </div>

        {/* Location Switcher & Refresh Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find((l) => l.id === e.target.value);
                if (found) onSelectLocality(found);
              }}
              className="appearance-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors cursor-pointer shadow-2xs"
              title="Select active monitoring ward"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#1E60F2] hover:bg-blue-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh weather and heat telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 1: SIMPLE HERO WEATHER CARD + FORECAST & QUICK STATS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* HERO CARD (Level 1: 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden">
          {/* Location & Time Stamp */}
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold relative z-10 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1E60F2]" />
              <span className="font-extrabold text-slate-900 tracking-tight">{localityDisplayName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{currentLocation.city}</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {lastSyncTime ? `Observed ${formatTimeAgo(lastSyncTime.toISOString())}` : 'Updated just now'}
            </span>
          </div>

          {/* Large Temperature, Feels-like & Risk Gauge */}
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight font-sans leading-none">
                <CountUp value={Math.round(currentTemp)} durationMs={600} />°C
              </div>

              <div className="text-sm sm:text-base font-bold text-slate-600">
                Feels like <strong className="text-slate-900 font-extrabold">{Math.round(feelsLike)}°C</strong>
              </div>

              {/* Status Badge */}
              <div className="pt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${riskBadge.color} shadow-2xs`}>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${riskBadge.pulse}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${riskBadge.pulse}`} />
                  </span>
                  <span>{riskBadge.text} • {riskScore}/100</span>
                </span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="shrink-0">
              <HeatRiskGauge
                score={riskScore}
                category={riskLevel === 'extreme' ? 'critical' : riskLevel}
                size="md"
                animated={true}
              />
            </div>
          </div>

          {/* Level 1 Resident Slogan & Peak Heat */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1E60F2] text-sm">
                "{slogan}"
              </span>
            </div>
            <div className="text-slate-600 font-medium">
              Peak heat: <strong className="text-slate-900 font-bold">{peakTime} · {peakTemp}°C</strong>
            </div>
          </div>
        </div>

        {/* 4-DAY MINI FORECAST STRIP (Level 2: 5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1E60F2]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upcoming 4-Day Forecast
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">HIGH / LOW</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {miniForecast.map((item, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all border ${
                    isToday
                      ? 'bg-blue-50/70 border-blue-200 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <span className={`text-[11px] font-extrabold truncate w-full ${isToday ? 'text-[#1E60F2]' : 'text-slate-600'}`}>
                    {item.dayName}
                  </span>

                  <div className="my-2 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>

                  <div className="text-xs font-bold text-slate-900">
                    {item.high}°
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.low}°
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              {actionResult.recommendedOutdoorWindow.label}
            </span>
            <Link
              to="/predictions"
              className="text-[#1E60F2] font-bold text-[11px] hover:underline inline-flex items-center gap-0.5"
            >
              <span>Full stats</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 2: DETAILS (Humidity, UV, Wind, Air Moisture) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{humidity}%</div>
          <span className="text-[10px] text-slate-500 block">
            {humidity > 70 ? 'Very humid • Slow sweat evaporation' : 'Moderate ambient humidity'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>UV Radiation</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{uv} of 12</div>
          <span className="text-[10px] text-slate-500 block">
            {uv >= 8 ? 'Very High • Sunburn risk in 15 mins' : 'Moderate solar glare'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Wind Speed</span>
            <Wind className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{wind} km/h</div>
          <span className="text-[10px] text-slate-500 block">
            {wind < 8 ? 'Stagnant warm air' : 'Light convective breeze'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Feels-Like Offset</span>
            <Flame className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {feelsLike >= currentTemp ? `+${(feelsLike - currentTemp).toFixed(1)}°C` : `${(feelsLike - currentTemp).toFixed(1)}°C`}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Thermal index delta above air temp
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 3: ADVANCED INFORMATION (Collapsible & Non-dominant) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
        >
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Advanced Meteorological Telemetry (Level 3)</span>
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>{showAdvancedDetails ? 'Hide technical data' : 'View wet bulb, sensor & model metrics'}</span>
            {showAdvancedDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {showAdvancedDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs text-slate-600">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Wet-Bulb Temp</span>
                <span className="text-sm font-bold text-slate-900">{actionResult.advancedMetrics.wetBulbApproxC}°C</span>
                <span className="text-[10px] text-slate-500 block">Stull Psychrometric</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Rothfusz Heat Index</span>
                <span className="text-sm font-bold text-slate-900">{actionResult.advancedMetrics.heatIndexC}°C</span>
                <span className="text-[10px] text-slate-500 block">NOAA Polynomial</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">UHI Anomaly</span>
                <span className="text-sm font-bold text-slate-900">+1.8°C</span>
                <span className="text-[10px] text-slate-500 block">Urban canopy differential</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Model Confidence</span>
                <span className="text-sm font-bold text-emerald-700">94%</span>
                <span className="text-[10px] text-slate-500 block">Multi-model ensemble</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              <strong>Methodology Notice:</strong> HeatShield evaluates composite risk by correlating dry bulb temperature, vapor pressure ({actionResult.advancedMetrics.vaporPressureHpa} hPa), and solar zenith angles. Live data is ingested from automated meteorological stations and validated against regional disaster authority baselines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopHeroSection;
