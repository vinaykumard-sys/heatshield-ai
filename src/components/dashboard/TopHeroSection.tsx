import React, { useMemo } from 'react';
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
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { CountUp } from '../common/CountUp';
import { HeatRiskGauge } from '../common/HeatRiskGauge';
import { LocationZone, EnvironmentalReading, HeatRiskAssessment } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

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
  const currentTemp = currentReading?.temperature_c ?? 27;
  const feelsLike = currentReading?.feels_like_c ?? 29;
  const riskScore = currentRisk?.risk_score ?? 53;
  const riskCategory = (currentRisk?.risk_category ?? 'moderate').toLowerCase();

  const localityDisplayName = currentLocation.localityName || selectedZone?.name || 'Central Ward';

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userName ? userName.split(' ')[0] : 'Resident';
  const updatedText = lastSyncTime ? `Updated ${formatTimeAgo(lastSyncTime.toISOString())}` : 'Updated just now';

  // Risk display configuration (green safe, amber moderate, red emergency)
  const getRiskDisplay = () => {
    switch (riskCategory) {
      case 'critical':
      case 'extreme':
        return { 
          categoryText: 'CRITICAL RISK', 
          color: 'bg-red-50 text-red-700 border-red-200',
          pulseColor: 'bg-red-500'
        };
      case 'high':
        return { 
          categoryText: 'HIGH RISK', 
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          pulseColor: 'bg-orange-500'
        };
      case 'moderate':
        return { 
          categoryText: 'MODERATE RISK', 
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          pulseColor: 'bg-amber-500'
        };
      case 'low':
      case 'normal':
      default:
        return { 
          categoryText: 'SAFE / LOW RISK', 
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pulseColor: 'bg-emerald-500'
        };
    }
  };

  const riskBadge = getRiskDisplay();

  // High / Low temperatures calculated from forecastDaily or forecastHourly
  const highTemp = useMemo(() => {
    if (forecastDaily && forecastDaily.length > 0 && forecastDaily[0]?.max_temp_c) {
      return Math.round(forecastDaily[0].max_temp_c);
    }
    if (forecastHourly && forecastHourly.length > 0) {
      return Math.round(Math.max(...forecastHourly.map((h: any) => h.temperature_c ?? h.temp ?? currentTemp)));
    }
    return 34;
  }, [forecastDaily, forecastHourly, currentTemp]);

  const lowTemp = useMemo(() => {
    if (forecastDaily && forecastDaily.length > 0 && forecastDaily[0]?.min_temp_c) {
      return Math.round(forecastDaily[0].min_temp_c);
    }
    if (forecastHourly && forecastHourly.length > 0) {
      return Math.round(Math.min(...forecastHourly.map((h: any) => h.temperature_c ?? h.temp ?? currentTemp)));
    }
    return 22;
  }, [forecastDaily, forecastHourly, currentTemp]);

  // Peak heat calculation (e.g. "2:00 PM")
  const peakHeatTime = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      let maxEntry = forecastHourly[0];
      let maxVal = maxEntry.temperature_c ?? maxEntry.temp ?? 0;
      for (const entry of forecastHourly) {
        const val = entry.temperature_c ?? entry.temp ?? 0;
        if (val > maxVal) {
          maxVal = val;
          maxEntry = entry;
        }
      }
      let t = maxEntry.time;
      if (t.includes('T')) {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
      if (t.includes(':')) {
        const [h, m] = t.split(':');
        const hNum = parseInt(h, 10);
        if (!isNaN(hNum)) {
          const ampm = hNum >= 12 ? 'PM' : 'AM';
          const h12 = hNum % 12 || 12;
          return `${h12}:${m || '00'} ${ampm}`;
        }
      }
      return t;
    }
    return '2:00 PM';
  }, [forecastHourly]);

  // 4-day mini forecast slice
  const miniForecast = (forecastDaily && forecastDaily.length > 0 ? forecastDaily.slice(0, 4) : [
    { date: 'Today', max_temp_c: highTemp, min_temp_c: lowTemp, risk_level: riskCategory },
    { date: 'Tomorrow', max_temp_c: highTemp + 1, min_temp_c: lowTemp + 1, risk_level: 'high' },
    { date: 'Wed', max_temp_c: highTemp - 1, min_temp_c: lowTemp, risk_level: 'moderate' },
    { date: 'Thu', max_temp_c: highTemp - 2, min_temp_c: lowTemp - 1, risk_level: 'moderate' },
  ]).map((d, i) => {
    let dayName = d.date;
    if (i === 0) dayName = 'Today';
    else if (i === 1) dayName = 'Tomorrow';
    else if (d.date && d.date.length > 3) {
      const dt = new Date(d.date);
      if (!isNaN(dt.getTime())) {
        dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      }
    }
    return {
      ...d,
      dayName,
      max: Math.round(d.max_temp_c ?? highTemp),
      min: Math.round(d.min_temp_c ?? lowTemp),
    };
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-[22px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E60F2] to-[#3B82F6] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {displayName}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Hyper-local AI climate surveillance & thermal resilience console
            </p>
          </div>
        </div>

        {/* Active Ward Switcher & Live Sync Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Live Sync Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE SYNC</span>
            <span className="text-emerald-600/70 font-normal hidden md:inline">• {lastSyncTime ? formatTimeAgo(lastSyncTime.toISOString()) : 'Just now'}</span>
          </div>

          {/* Ward Switcher Dropdown */}
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) onSelectLocality(found);
              }}
              className="appearance-none bg-[#F5F8FC] hover:bg-slate-100/90 text-slate-700 border border-[#E5EDF5] rounded-xl pl-3 pr-7 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors cursor-pointer"
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

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-[#E5EDF5] bg-white text-slate-500 hover:text-[#1E60F2] hover:bg-blue-50 transition-colors btn-press disabled:opacity-50 shadow-xs"
            title="Refresh telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. HERO ROW: Left (Hero Weather Card) | Middle (4-day Mini Forecast) | Right (Check Full Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT: HERO WEATHER SECTION (Requirement 4) */}
        {/* Large temperature design with soft-UI white card framing, generous spacing, subtle border #E5EDF5 */}
        <div className="md:col-span-5 bg-white rounded-[26px] border border-[#E5EDF5] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden">
          {/* Subtle warm backdrop glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-gradient-to-br from-amber-100/40 via-orange-50/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Real-time weather hierarchy: 1. Location */}
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold flex-wrap">
              <span className="text-base select-none">📍</span>
              <span className="font-extrabold text-slate-900 tracking-tight">{localityDisplayName}</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-slate-700">{currentLocation.city}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">{updatedText}</span>
            </div>
          </div>

          {/* Real-time weather hierarchy: 2. Large Temperature & 3. Feels-Like & 4. Heat Risk Badge & Circular Gauge */}
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              {/* Large temperature with smooth number count-up animation */}
              <div className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight font-sans leading-none">
                <CountUp value={Math.round(currentTemp)} durationMs={650} />°C
              </div>

              {/* Feels-like temperature */}
              <div className="text-sm sm:text-base font-bold text-slate-600">
                Feels like <strong className="text-slate-900 font-extrabold">{Math.round(feelsLike)}°C</strong>
              </div>

              {/* Heat risk status badge with subtle pulse */}
              <div className="pt-0.5">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold border ${riskBadge.color} shadow-xs`}>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${riskBadge.pulseColor}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${riskBadge.pulseColor}`} />
                  </span>
                  <span>{riskBadge.categoryText} • {riskScore}/100</span>
                </span>
              </div>
            </div>

            {/* Circular Gauge Draw Animation (Subtle & Tasteful) */}
            <div className="shrink-0 hidden xs:flex sm:flex">
              <HeatRiskGauge
                score={riskScore}
                category={riskCategory}
                size="sm"
                animated={true}
              />
            </div>
          </div>

          {/* Real-time weather hierarchy: 5. High / Low / Peak heat */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium relative z-10">
            <span className="font-semibold">
              High <strong className="text-slate-900 font-extrabold">{highTemp}°C</strong> • Low <strong className="text-slate-900 font-extrabold">{lowTemp}°C</strong> • Peak <strong className="text-slate-900 font-extrabold">{peakHeatTime}</strong>
            </span>
          </div>
        </div>

        {/* MIDDLE: 4-Day Mini Forecast Strip (4 cols on md, 4 on lg) */}
        <div className="md:col-span-4 bg-white rounded-[26px] border border-[#E5EDF5] p-5 shadow-xs hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#1E60F2]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4-Day Forecast Strip
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">HI / LO</span>
          </div>

          {/* 4 Mini Pill Cards */}
          <div className="grid grid-cols-4 gap-2">
            {miniForecast.map((item, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-200 border ${
                    isToday
                      ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-400/20'
                      : 'bg-[#F8FAFC] border-[#E9F0FA] hover:bg-slate-100/70'
                  }`}
                >
                  <span className={`text-[11px] font-extrabold truncate w-full ${isToday ? 'text-[#1E60F2]' : 'text-slate-600'}`}>
                    {item.dayName}
                  </span>

                  <div className="my-1.5 w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-xs">
                    {idx === 0 || idx === 1 ? (
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900">
                    {item.max}°
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {item.min}°
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 text-center font-medium">
            Next 96 hours continuous thermal stress predicted
          </div>
        </div>

        {/* RIGHT: Gradient Action Card ("Check Full Stats" in deep royal blue with 45° arrow) (3 cols on md, 3 on lg) */}
        <Link
          to="/predictions"
          className="md:col-span-3 bg-gradient-to-br from-[#1E60F2] via-[#154BC4] to-[#0A2E80] text-white rounded-[26px] p-5 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Subtle background radar circles */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full border border-white/5 pointer-events-none" />

          {/* Top Tag & 45° Arrow */}
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
              AI FORECAST
            </span>
            <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white text-white group-hover:text-[#1E60F2] flex items-center justify-center transition-all duration-300 group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Body stats */}
          <div className="my-3 space-y-1">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Check Full Stats
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
              Explore 24h biometeorological curves, wet bulb models, and microclimate risk simulation.
            </p>
          </div>

          {/* Footer Anomaly Preview */}
          <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] font-semibold text-blue-100">
            <span>+3.4°C Peak Variance</span>
            <span className="underline underline-offset-2 group-hover:text-white">Open Telemetry</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default TopHeroSection;
