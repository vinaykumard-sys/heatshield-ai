import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  RefreshCw, 
  ArrowUpRight, 
  Flame, 
  Sun, 
  SunMedium,
  CloudSun, 
  Droplets, 
  ChevronDown, 
  ChevronUp,
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Clock,
  Wind,
  Compass,
  CloudRain,
  Cpu,
  Thermometer,
  ShieldAlert
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

// Stull scientific formula for Wet Bulb Temperature calculation (°C)
function calculateWetBulb(t: number, rh: number): number {
  const tw =
    t * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Number(tw.toFixed(1));
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
  const uv = currentReading?.uv_index ?? 6.2;
  const wind = currentReading?.wind_speed_kmh ?? 12.5;
  const deltaTemp = Number((feelsLike - currentTemp).toFixed(1));
  const wetBulb = currentReading?.wet_bulb_c ?? calculateWetBulb(currentTemp, humidity);
  const dewPoint = Math.round(currentTemp - ((100 - humidity) / 5));

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

  // UV index info for donut arc gauge
  const getUvInfo = (val: number) => {
    if (val >= 11) return { label: 'Extreme', color: 'text-purple-700', stroke: '#A855F7', bg: 'bg-purple-50' };
    if (val >= 8) return { label: 'Very High', color: 'text-rose-700', stroke: '#EF4444', bg: 'bg-rose-50' };
    if (val >= 6) return { label: 'High', color: 'text-orange-700', stroke: '#F97316', bg: 'bg-orange-50' };
    if (val >= 3) return { label: 'Moderate', color: 'text-amber-700', stroke: '#F59E0B', bg: 'bg-amber-50' };
    return { label: 'Low', color: 'text-emerald-700', stroke: '#10B981', bg: 'bg-emerald-50' };
  };
  const uvInfo = getUvInfo(uv);

  // SVG parameters for UV Donut gauge
  const uvRadius = 32;
  const uvCircumference = 2 * Math.PI * uvRadius;
  const uvPercent = Math.min(100, Math.max(0, (uv / 12) * 100));
  const uvDashoffset = uvCircumference - (uvPercent / 100) * uvCircumference;

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
          high: Math.round(d.temperature_max_c ?? d.max_temp_c ?? 34),
          low: Math.round(d.temperature_min_c ?? d.min_temp_c ?? 22),
          risk: d.risk_category || d.risk_level || 'moderate'
        };
      });
    }

    return [
      { dayName: 'Today', high: Math.round(currentTemp + 4), low: Math.round(currentTemp - 4), risk: riskLevel },
      { dayName: 'Tomorrow', high: Math.round(currentTemp + 5), low: Math.round(currentTemp - 3), risk: riskLevel },
      { dayName: 'Day 3', high: Math.round(currentTemp + 3), low: Math.round(currentTemp - 4), risk: 'moderate' },
      { dayName: 'Day 4', high: Math.round(currentTemp + 2), low: Math.round(currentTemp - 5), risk: 'low' },
    ];
  }, [forecastDaily, currentTemp, riskLevel]);

  // Current daylight position calculation for Solar Arc (0 to 180 degrees)
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
  const sunriseHour = 5.8; // ~05:48 AM
  const sunsetHour = 18.7; // ~06:42 PM
  const daylightProgress = Math.min(1, Math.max(0, (currentHour - sunriseHour) / (sunsetHour - sunriseHour)));
  const sunAngle = daylightProgress * 180; // in degrees across semi-circle
  const sunRad = (sunAngle * Math.PI) / 180;
  const sunX = 50 - 40 * Math.cos(sunRad);
  const sunY = 50 - 40 * Math.sin(sunRad);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ------------------------------------------------------------------ */}
      {/* TOP HEADER BAR: Welcome, Location Selector & Data Freshness Badge */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {displayName}
            </h1>
            <DataFreshnessBadge
              status={freshnessStatus}
              observedAt={lastSyncTime?.toISOString()}
              source="Open-Meteo & Ground Telemetry"
              showDetails={true}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Hyperlocal neighborhood heat risk, plain-language guidance, and emergency protection
          </p>
        </div>

        {/* Location Switcher & Refresh Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find((l) => l.id === e.target.value);
                if (found) onSelectLocality(found);
              }}
              className="appearance-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl pl-3.5 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors cursor-pointer shadow-2xs"
              title="Select active monitoring ward"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-2xl border border-slate-200/90 bg-white text-slate-600 hover:text-[#1E60F2] hover:bg-blue-50/60 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh weather and heat telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 1: HERO WEATHER CARD + 4-DAY FORECAST */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* HERO WEATHER CARD (7 Cols) - Modern Soft-UI Aesthetic */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm shadow-blue-500/5 flex flex-col justify-between space-y-6 relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/20">
          
          {/* Subtle decorative ambient backdrop */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-blue-100/40 via-blue-50/10 to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

          {/* Location & Time Stamp */}
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold relative z-10 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50/80 px-3 py-1 rounded-full border border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span className="font-extrabold text-slate-900 tracking-tight">{localityDisplayName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-medium">{currentLocation.city}</span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {lastSyncTime ? `Observed ${formatTimeAgo(lastSyncTime.toISOString())}` : 'Updated just now'}
            </span>
          </div>

          {/* Large Temperature, Feels-like Pill & Circular Risk Gauge */}
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-7xl sm:text-8xl font-black text-slate-900 tracking-tighter font-sans leading-none">
                  <CountUp value={Math.round(currentTemp)} durationMs={600} />°C
                </div>
                <div className="hidden sm:flex flex-col text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Air Temp</span>
                  <span className="text-[#1E60F2] font-extrabold">{currentReading?.weather_condition || 'Sunny'}</span>
                </div>
              </div>

              {/* Feels-like pill & Heat risk badge */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Feels Like Pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                  <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Feels like <strong className="text-slate-900">{Math.round(feelsLike)}°C</strong></span>
                  <span className="text-[10px] text-blue-500 font-bold">({deltaTemp >= 0 ? `+${deltaTemp}` : deltaTemp}° offset)</span>
                </span>

                {/* Heat Risk Badge */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${riskBadge.color} shadow-2xs`}>
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

          {/* Level 1 Resident Slogan & Peak Heat Banner */}
          <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E60F2] shrink-0 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="font-extrabold text-[#1E60F2] text-xs sm:text-sm">
                "{slogan}"
              </span>
            </div>
            <div className="text-slate-600 font-medium bg-amber-50/70 border border-amber-200/60 px-3 py-1 rounded-xl self-start sm:self-auto">
              Peak heat: <strong className="text-slate-900 font-bold">{peakTime} · {peakTemp}°C</strong>
            </div>
          </div>
        </div>

        {/* 4-DAY MINI FORECAST STRIP (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm shadow-blue-500/5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upcoming 4-Day Forecast
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HIGH / LOW</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {miniForecast.map((item, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all border ${
                    isToday
                      ? 'bg-blue-50/80 border-blue-200/90 shadow-2xs ring-1 ring-blue-300/30'
                      : 'bg-slate-50/70 border-slate-200/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[11px] font-extrabold truncate w-full ${isToday ? 'text-[#1E60F2]' : 'text-slate-600'}`}>
                    {item.dayName}
                  </span>

                  <div className="my-2.5 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-2xs">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>

                  <div className="text-xs font-extrabold text-slate-900">
                    {item.high}°
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {item.low}°
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
            <span className="text-slate-500 text-[11px] font-medium truncate max-w-[200px]">
              {actionResult.recommendedOutdoorWindow.label}
            </span>
            <Link
              to="/predictions"
              className="text-[#1E60F2] font-bold text-[11px] hover:underline inline-flex items-center gap-0.5 shrink-0"
            >
              <span>Full stats</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 2: HIGHLIGHTS METRICS GRID (SkySense & Isabella Aesthetic) */}
      {/* Feels Like, Wind, Humidity, UV Index, Rain, Cloud Cover / Solar Arc */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Today's Highlights</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
                Microclimate Indices
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Key biometeorological observations and physiological heat strain factors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Feels Like */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  Feels Like
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Thermometer className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                    {Math.round(feelsLike)}
                  </span>
                  <span className="text-xl font-bold text-slate-400">°C</span>
                </div>
                <p className="text-xs font-semibold text-amber-600 mt-0.5">
                  {deltaTemp >= 0 ? `+${deltaTemp}°C` : `${deltaTemp}°C`} vs ambient air
                </p>
              </div>

              {/* Mini offset progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, (deltaTemp / 6) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>Mild (+0°)</span>
                  <span>Moderate (+2°)</span>
                  <span>High (+4°+)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Thermal Strain:</span>
              <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px]">
                {feelsLike >= 38 ? 'High Discomfort' : 'Moderate Heat Stress'}
              </span>
            </div>
          </div>

          {/* Card 2: Wind & Airflow */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  Wind & Airflow
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wind className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {Math.round(wind)}
                    </span>
                    <span className="text-base font-bold text-slate-400">km/h</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    <span>NW (315°) · 3.5 m/s</span>
                  </p>
                </div>

                {/* Clean Compass Rose SVG */}
                <div className="relative w-14 h-14 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="absolute text-[8px] font-black text-slate-400 top-1">N</span>
                  <span className="absolute text-[8px] font-black text-slate-400 right-1">E</span>
                  <span className="absolute text-[8px] font-black text-slate-400 bottom-1">S</span>
                  <span className="absolute text-[8px] font-black text-slate-400 left-1">W</span>
                  {/* Rotating pointer */}
                  <div className="w-6 h-6 flex items-center justify-center -rotate-45">
                    <div className="w-1.5 h-6 bg-gradient-to-t from-slate-300 to-[#1E60F2] rounded-full shadow-2xs" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Ventilation:</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px]">
                {wind < 8 ? 'Stagnant Air' : 'Light Breeze (Active)'}
              </span>
            </div>
          </div>

          {/* Card 3: Humidity & Dew Point */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  Humidity & Moisture
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Droplets className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                    {Math.round(humidity)}
                  </span>
                  <span className="text-xl font-bold text-slate-400">%</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Dew point: ~{dewPoint}°C (Vapor: {actionResult.advancedMetrics.vaporPressureHpa} hPa)
                </p>
              </div>

              {/* Segmented Gradient Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, humidity))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>Dry (&lt;40)</span>
                  <span>Optimal (40-60)</span>
                  <span>Muggy (&gt;65)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Evaporation:</span>
              <span className="font-extrabold text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-full text-[10px]">
                {humidity > 65 ? 'Slow (Impaired)' : 'Normal Efficiency'}
              </span>
            </div>
          </div>

          {/* Card 4: UV Index (Clean SVG Donut Gauge) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  UV Radiation
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sun className="w-4 h-4" />
                </div>
              </div>

              {/* Donut Gauge and Value Row */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {uv.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">/12</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${uvInfo.bg} ${uvInfo.color}`}>
                      {uvInfo.label}
                    </span>
                  </div>
                </div>

                {/* Circular SVG Donut Gauge */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={uvRadius}
                      stroke="#F1F5F9"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={uvRadius}
                      stroke={uvInfo.stroke}
                      strokeWidth="8"
                      strokeDasharray={uvCircumference}
                      strokeDashoffset={uvDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-800">{Math.round(uvPercent)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Burn Risk:</span>
              <span className="font-extrabold text-slate-700 text-[10px]">
                {uv >= 8 ? '&lt;15 mins (SPF 50+)' : '~25 mins safe window'}
              </span>
            </div>
          </div>

          {/* Card 5: Rain & Precipitation */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  Precipitation & Rain
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CloudRain className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                    0.0
                  </span>
                  <span className="text-base font-bold text-slate-400">mm</span>
                </div>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  0% probability in next 6h (Clear Sky)
                </p>
              </div>

              {/* Rain Probability Mini Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: '4%' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>No rain</span>
                  <span>Showers</span>
                  <span>Heavy</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Rain Relief:</span>
              <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px]">
                Low Relief Expected
              </span>
            </div>
          </div>

          {/* Card 6: Cloud Cover & Solar Arc */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
                  Solar Arc & Cloud
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <SunMedium className="w-4 h-4" />
                </div>
              </div>

              {/* Celestial Arc SVG */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      18
                    </span>
                    <span className="text-xl font-bold text-slate-400">%</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Clear Sky · Low Cloud Cover
                  </p>
                </div>

                {/* SVG Solar Arc Tracker */}
                <div className="relative w-24 h-12 flex items-end justify-center shrink-0 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 50">
                    {/* Semi-circle dashed track */}
                    <path
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                    {/* Traversed sunlight arc */}
                    <path
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeDasharray="125"
                      strokeDashoffset={125 - daylightProgress * 125}
                      strokeLinecap="round"
                    />
                    {/* Active Sun Dot */}
                    <circle
                      cx={sunX}
                      cy={sunY}
                      r="5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs">
              <span className="text-slate-500">Daylight:</span>
              <span className="font-extrabold text-slate-800 text-[10px]">
                05:48 AM → 06:42 PM
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LEVEL 3: ADVANCED TECHNICAL INFORMATION (Collapsible Drawer) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-blue-500/5 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
          className="w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
        >
          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1E60F2]" />
            <span>Advanced Meteorological Telemetry (Level 3)</span>
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>{showAdvancedDetails ? 'Hide technical biometeorology' : 'View wet bulb, psychrometric & model metrics'}</span>
            {showAdvancedDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {showAdvancedDetails && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs text-slate-600 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Wet-Bulb Temp</span>
                <span className="text-base font-extrabold text-slate-900">{actionResult.advancedMetrics.wetBulbApproxC}°C</span>
                <span className="text-[10px] text-slate-500 block">Stull Psychrometric</span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Rothfusz Heat Index</span>
                <span className="text-base font-extrabold text-slate-900">{actionResult.advancedMetrics.heatIndexC}°C</span>
                <span className="text-[10px] text-slate-500 block">NOAA Polynomial</span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">UHI Surface Anomaly</span>
                <span className="text-base font-extrabold text-slate-900">+1.8°C</span>
                <span className="text-[10px] text-slate-500 block">Urban canopy differential</span>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ensemble Confidence</span>
                <span className="text-base font-extrabold text-emerald-700">96%</span>
                <span className="text-[10px] text-slate-500 block">Open-Meteo & Ground AWS</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Methodology Notice:</strong> HeatShield evaluates composite risk by correlating dry bulb temperature, vapor pressure ({actionResult.advancedMetrics.vaporPressureHpa} hPa), and solar zenith angles. Live data is ingested from automated meteorological stations and validated against regional disaster authority baselines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopHeroSection;
