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
import { formatTimeAgo } from '../../lib/utils';

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
  showGauge?: boolean;
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
  userName,
  showGauge = false,
  className = '',
}) => {
  const currentTemp = currentReading?.temperature_c ?? 32;
  const feelsLike = currentReading?.feels_like_c ?? 35;
  const currentHumidity = currentReading?.relative_humidity_pct ?? 55;
  const currentUv = currentReading?.uv_index ?? 6;
  const currentWind = currentReading?.wind_speed_kmh ?? 12;
  const riskScore = currentRisk?.risk_score ?? 58;
  const riskCategory = currentRisk?.risk_category ?? 'moderate';

  const localityDisplayName = currentLocation.localityName || selectedZone?.name || 'Your area';

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userName ? userName.split(' ')[0] : 'there';
  const updatedText = lastSyncTime ? formatTimeAgo(lastSyncTime.toISOString()) : 'Just now';

  const getRiskDisplay = () => {
    switch (riskCategory as string) {
      case 'critical':
      case 'extreme':
        return { label: 'CRITICAL RISK', color: 'text-red-700 bg-red-50 border-red-200' };
      case 'high':
        return { label: 'HIGH RISK', color: 'text-orange-700 bg-orange-50 border-orange-200' };
      case 'moderate':
        return { label: 'MODERATE RISK', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'low':
      default:
        return { label: 'LOW RISK', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  const riskBadge = getRiskDisplay();

  return (
    <div className={`bg-white rounded-[20px] border border-[#E5EDF5] p-6 sm:p-8 shadow-xs space-y-6 ${className}`}>
      {/* 1. HERO GREETING & LOCATION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {displayName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your heat safety overview
          </p>
        </div>

        {/* Locality dropdown selector & refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) onSelectLocality(found);
              }}
              className="appearance-none bg-[#F5F8FC] hover:bg-slate-100/80 text-slate-700 border border-[#E5EDF5] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-[#E5EDF5] text-slate-500 hover:text-[#1E60F2] hover:bg-blue-50 transition-colors btn-press disabled:opacity-50"
            title="Refresh weather"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. PRIMARY THERMAL CONDITIONS & VISUAL HIERARCHY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          {/* Location pill */}
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <MapPin className="w-4 h-4 text-[#1E60F2] shrink-0" />
            <span className="font-bold text-slate-900">{localityDisplayName}</span>
            <span className="text-slate-400">• {currentLocation.city}</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">• Updated {updatedText}</span>
          </div>

          {/* Large temperature display */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight font-sans">
              <CountUp value={Math.round(currentTemp)} durationMs={500} />°C
            </span>
            <div className="space-y-1">
              <div className="text-base sm:text-lg font-semibold text-slate-700">
                Feels like <strong className="text-slate-900 font-bold">{Math.round(feelsLike)}°C</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadge.color}`}>
                  {riskBadge.label}
                </span>
                <span className="text-xs text-slate-500">
                  {riskScore}/100 Heat Index
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Gauge inside hero if requested */}
        {showGauge && (
          <div className="self-center md:self-auto shrink-0">
            <HeatRiskGauge
              score={riskScore}
              category={riskCategory}
              peakWindow={peakHeatPeriod}
              size="md"
            />
          </div>
        )}
      </div>

      {/* 3. FOUR ENVIRONMENTAL TILES (Humidity, UV, Wind, Shaded Temp) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100">
        {/* Shaded Ambient Air Temp */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Air Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {currentReading ? `${currentTemp}°C` : '--'}
          </div>
          <div className="text-[11px] text-slate-400">Shaded outdoor</div>
        </div>

        {/* Feels Like / Real-Feel */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Feels Like</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {currentReading ? `${feelsLike}°C` : '--'}
          </div>
          <div className="text-[11px] text-slate-400">Heat index</div>
        </div>

        {/* Relative Humidity */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {currentHumidity}%
          </div>
          <div className="text-[11px] text-slate-400">Moisture level</div>
        </div>

        {/* Solar UV Index */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">UV Index</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {currentUv}
          </div>
          <div className="text-[11px] text-slate-400">
            {currentUv >= 8 ? 'Very high' : currentUv >= 6 ? 'High' : 'Moderate'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherHeroCard;
