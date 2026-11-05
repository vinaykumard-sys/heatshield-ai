import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Sun, 
  Wind, 
  MapPin, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { CountUp } from './CountUp';
import { HeatRiskGauge } from './HeatRiskGauge';
import { LocationZone, EnvironmentalReading, HeatRiskAssessment } from '../../types';

interface WeatherHeroCardProps {
  currentLocation: {
    localityName: string;
    city: string;
    state: string;
    isRealDeviceLocation?: boolean;
    locationSource?: string;
  };
  currentReading: EnvironmentalReading | null;
  currentRisk: HeatRiskAssessment | null;
  peakHeatPeriod?: string;
  lastSyncTime: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  selectedZone: LocationZone | null;
  locations: LocationZone[];
  onSelectLocality: (loc: LocationZone) => void;
  userName?: string;
  className?: string;
}

export const WeatherHeroCard: React.FC<WeatherHeroCardProps> = ({
  currentLocation,
  currentReading,
  currentRisk,
  peakHeatPeriod,
  lastSyncTime,
  isRefreshing,
  onRefresh,
  selectedZone,
  locations,
  onSelectLocality,
  userName = 'Resident',
  className = '',
}) => {
  const currentTemp = currentReading?.temperature_c ?? 32;
  const feelsLike = currentReading?.feels_like_c ?? 35;
  const currentHumidity = currentReading?.relative_humidity_pct ?? 55;
  const currentUv = currentReading?.uv_index ?? 6;
  const riskScore = currentRisk?.risk_score ?? 58;
  const riskCategory = currentRisk?.risk_category ?? 'moderate';

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Live';
    return lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const localityDisplayName = currentLocation.localityName || selectedZone?.name || 'Monitored Sector';

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-6 relative overflow-hidden ${className}`}>
      {/* Top Bar: Location Badge, Status Pill, Selector & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        {/* Left: Location & GPS Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-900">{localityDisplayName}</span>
            <span className="text-slate-400 font-mono text-[11px]">• {currentLocation.city}</span>
          </div>

          {currentLocation.isRealDeviceLocation ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live GPS Fix
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Monitored Ward
            </span>
          )}

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            Updated {formatLastSync()}
          </span>
        </div>

        {/* Right: Quick Ward Selector & Sync Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) onSelectLocality(found);
              }}
              className="appearance-none bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all btn-interact disabled:opacity-50"
            title="Refresh Live Weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Large Apple-Weather Temperature + Gauge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Confident Clean Temperature Display & Human Briefing */}
        <div className="space-y-3 flex-1">
          <div className="text-xs font-medium text-slate-500">
            Current Thermal Conditions
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight font-mono">
              <CountUp value={Math.round(currentTemp)} durationMs={600} />°
            </span>
            <div className="space-y-0.5">
              <div className="text-base sm:text-lg font-semibold text-slate-700">
                Feels like <strong className="text-slate-900">{Math.round(feelsLike)}°C</strong>
              </div>
              <div className="text-xs text-slate-500">
                {feelsLike >= 40
                  ? 'Severe heat stress • Indoor shelter advised'
                  : feelsLike >= 35
                  ? 'Elevated heat index • Seek shade and hydrate'
                  : feelsLike >= 30
                  ? 'Moderate warmth • Routine hydration recommended'
                  : 'Comfortable thermal index'}
              </div>
            </div>
          </div>

          {/* Quick Alert Banner inside Hero if high or critical */}
          {(riskCategory === 'high' || riskCategory === 'critical') && (
            <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium border ${
              riskCategory === 'critical'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-orange-50 text-orange-800 border-orange-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${riskCategory === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
              <span>
                {riskCategory === 'critical'
                  ? 'Active Heatwave Emergency: Keep physical exertion to a minimum.'
                  : 'Elevated Daytime Heat: Stay hydrated before stepping into direct sun.'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Modern SVG Heat-Risk Gauge */}
        <div className="self-center lg:self-auto shrink-0 pt-2 lg:pt-0">
          <HeatRiskGauge
            score={riskScore}
            category={riskCategory}
            peakWindow={peakHeatPeriod}
            size="lg"
          />
        </div>
      </div>

      {/* 4 Apple Weather Minimalist Environmental Factor Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
        {/* Shaded Ambient Temp */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
            <span>Air Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            {currentReading ? `${currentTemp}°C` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 truncate">Shaded thermometer</div>
        </div>

        {/* Real-Feel Index */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
            <span>Real-Feel</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            {currentReading ? `${feelsLike}°C` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 truncate">Humidity adjusted</div>
        </div>

        {/* Relative Humidity */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
            <span>Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            {currentHumidity}%
          </div>
          <div className="text-[11px] text-slate-500 truncate">Sweat evaporation</div>
        </div>

        {/* UV Index */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
            <span>Solar UV</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            {currentUv}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {currentUv >= 8 ? 'Very High UV' : currentUv >= 6 ? 'High UV' : 'Moderate UV'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherHeroCard;
