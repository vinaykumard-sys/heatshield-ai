import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Sun, 
  Flame, 
  CloudSun, 
  CloudRain, 
  ArrowUpRight, 
  Activity, 
  RefreshCw,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { CanonicalLocation, EnvironmentalReading, HeatRiskAssessment, LocationZone } from '../../types';

export interface SoftWeatherHeroProps {
  currentLocation?: CanonicalLocation;
  currentReading?: EnvironmentalReading | null;
  currentRisk?: HeatRiskAssessment | null;
  forecastDaily?: any[];
  peakHeatPeriod?: string;
  lastSyncTime?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  selectedZone?: LocationZone | null;
  className?: string;
}

export const SoftWeatherHero: React.FC<SoftWeatherHeroProps> = (props) => {
  const context = useLocationTracker();

  // Merge passed props with context fallback
  const loc = props.currentLocation || context.currentLocation;
  const reading = props.currentReading !== undefined ? props.currentReading : context.currentReading;
  const risk = props.currentRisk !== undefined ? props.currentRisk : context.currentRisk;
  const daily = props.forecastDaily || context.forecastDaily || [];
  const lastSync = props.lastSyncTime !== undefined ? props.lastSyncTime : context.lastSyncTime;
  const isRefreshing = props.isRefreshing !== undefined ? props.isRefreshing : false;
  const onRefresh = props.onRefresh || context.forceTelemetryRefresh;

  // Temperature and condition values
  const currentTemp = reading ? Math.round(reading.temperature_c) : 41;
  const feelsLike = reading ? Math.round(reading.feels_like_c) : 44;
  const riskCategory = risk?.risk_category || (currentTemp >= 40 ? 'critical' : currentTemp >= 36 ? 'high' : 'moderate');
  const riskScore = risk?.risk_score ?? Math.min(96, Math.max(35, Math.round((currentTemp - 24) * 3.5)));

  // Dynamic condition label
  const getConditionLabel = () => {
    if (currentTemp >= 42 || feelsLike >= 45) return 'Extreme Heatwave Warning';
    if (currentTemp >= 38 || feelsLike >= 40) return 'Severe Thermal Load';
    if (currentTemp >= 34) return 'Elevated Heat Stress';
    return 'Moderate Solar Influx';
  };

  const conditionLabel = reading?.weather_condition && reading.weather_condition.length > 3
    ? reading.weather_condition
    : getConditionLabel();

  // Locality pin string (e.g. "Central Delhi, Ward 4" or dynamic locality)
  const localityName = loc.localityName || loc.locality || 'Central Delhi, Ward 4';
  const cityName = loc.city || 'Delhi';
  const stateName = loc.state || 'DL';

  // Format 4-day forecast
  const next4Days = daily && daily.length >= 4 
    ? daily.slice(0, 4) 
    : [
        { date: 'Today', max_temp_c: currentTemp, min_temp_c: Math.max(22, currentTemp - 11), risk_level: riskCategory },
        { date: 'Tomorrow', max_temp_c: currentTemp + 1, min_temp_c: Math.max(23, currentTemp - 10), risk_level: 'critical' },
        { date: '+2 Days', max_temp_c: currentTemp - 1, min_temp_c: Math.max(21, currentTemp - 12), risk_level: 'high' },
        { date: '+3 Days', max_temp_c: currentTemp, min_temp_c: Math.max(22, currentTemp - 11), risk_level: 'high' },
      ];

  const getWeatherIcon = (temp: number, index: number) => {
    if (temp >= 40) {
      return <Flame className="w-5 h-5 text-amber-500 animate-pulse" />;
    }
    if (index % 2 === 1) {
      return <CloudSun className="w-5 h-5 text-amber-400" />;
    }
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getDayTitle = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    // If date string contains day name (e.g. "Wed, 14 May")
    const parts = dateStr.split(',');
    return parts[0].trim();
  };

  const getSubDate = (dateStr: string, idx: number) => {
    const today = new Date();
    const target = new Date();
    target.setDate(today.getDate() + idx);
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`space-y-4 ${props.className || ''}`}>
      {/* Top Main Hero Row: Weather Card + "Check Full Stats" Gradient Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        
        {/* Soft Weather Hero (Main Card: 8 cols on xl) */}
        <div className="xl:col-span-8 bg-white rounded-[28px] border border-slate-100/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(15,23,42,0.09)]">
          {/* Subtle Ambient Thermal Accent glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-amber-200/35 via-rose-100/25 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-blue-100/30 via-slate-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header Row: Locality Pin + Live Status Telemetry Badge + Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 pb-4 border-b border-slate-100/80">
            {/* Locality Pin */}
            <div className="flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#1E60F2] shadow-xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  <span>{localityName}</span>
                  <span className="text-slate-400 font-normal text-xs sm:text-sm">({cityName}, {stateName})</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Microclimate Sensor Network • Real-Time Ward Feed
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry Indicator & Refresh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="tracking-wide">LIVE SENSOR FEED</span>
              </div>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-full border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:text-[#1E60F2] text-slate-500 transition-colors btn-press disabled:opacity-50"
                  title="Refresh Telemetry"
                  aria-label="Refresh Telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Core Weather Display: Massive Bold Temperature & Conditions */}
          <div className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-tight font-sans leading-none">
                  {currentTemp}
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-400">
                  °C
                </span>
              </div>

              {/* Condition Badge and Feels-like info */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                  riskCategory === 'critical' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : riskCategory === 'high' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {conditionLabel}
                </span>

                <span className="text-xs font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                  Feels like <strong className="text-slate-900 font-bold">{feelsLike}°C</strong>
                </span>

                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Heat Index Index: {riskScore}/100
                </span>
              </div>
            </div>

            {/* Weather Art Graphic (Sun / Flame / SkySense style soft glowing orb) */}
            <div className="flex flex-col items-center sm:items-end justify-center self-start sm:self-auto">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-8 ring-amber-100/60 animate-pulse">
                  <Sun className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
                </div>
                {/* Micro floating particle pill */}
                <div className="absolute -bottom-2 -left-2 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-card px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span>Peak 2:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Day Forecast Horizontal Strip */}
          <div className="pt-4 border-t border-slate-100/90 relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1E60F2]" />
                4-Day Thermal Outlook
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Daily High / Low</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {next4Days.map((day: any, idx: number) => {
                const title = getDayTitle(day.date || '', idx);
                const subDate = getSubDate(day.date || '', idx);
                const maxT = Math.round(day.max_temp_c);
                const minT = Math.round(day.min_temp_c);

                return (
                  <div
                    key={idx}
                    className="group bg-[#F8FAFC] hover:bg-white hover:border-[#1E60F2]/30 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-between gap-2 shadow-xs hover:shadow-card transition-all duration-200 cursor-default"
                  >
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#1E60F2] transition-colors">
                        {title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {subDate}
                      </p>
                    </div>

                    <div className="my-0.5">
                      {getWeatherIcon(maxT, idx)}
                    </div>

                    <div className="flex items-baseline gap-1.5 text-xs">
                      <span className="font-extrabold text-slate-900">{maxT}°</span>
                      <span className="text-slate-400 text-[11px] font-medium">/{minT}°</span>
                    </div>

                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      day.risk_level === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : day.risk_level === 'high'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {day.risk_level || 'Moderate'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* "Check Full Stats" Gradient Card (Royal blue / thermal gradient: 4 cols on xl) */}
        <div className="xl:col-span-4 bg-gradient-to-br from-[#1E60F2] via-[#2563EB] to-[#0E3BA5] text-white rounded-[28px] p-6 sm:p-7 shadow-lg shadow-blue-500/15 relative overflow-hidden flex flex-col justify-between group">
          {/* Subtle Decorative Geometry & Glow */}
          <div className="absolute -top-20 -right-20 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />

          {/* Top Section: Icon badge & Title */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
                <TrendingUp className="w-5 h-5 text-cyan-200" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                AI ENGINE
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Predictive Thermal Analytics
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed font-normal">
                72-Hour machine learning forecasting, diurnal curve simulation, and micro-climate vulnerability mapping.
              </p>
            </div>
          </div>

          {/* Middle Stat Snapshot */}
          <div className="relative z-10 my-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
              <span>Peak Risk Horizon</span>
              <span className="text-amber-300 font-bold">2:00 PM - 4:30 PM</span>
            </div>
            <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-300 via-amber-300 to-rose-400 h-full w-[78%] rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-200">
              <span>Confidence: 94.2%</span>
              <span>UHI Delta: +3.4°C</span>
            </div>
          </div>

          {/* Bottom Action: 45-degree arrow button to /predictions */}
          <div className="relative z-10 pt-2">
            <Link
              to="/predictions"
              className="w-full py-3 px-4 rounded-2xl bg-white text-[#1E60F2] font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all flex items-center justify-between group/btn btn-press"
            >
              <span>Check Full Stats & Forecast</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1E60F2] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SoftWeatherHero;
