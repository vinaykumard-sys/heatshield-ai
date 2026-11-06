import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Sun, 
  CloudRain, 
  Building2, 
  Info,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { EnvironmentalReading, HeatRiskAssessment, LocationZone } from '../../types';

export interface TodayConditionsGridProps {
  currentReading?: EnvironmentalReading | null;
  currentRisk?: HeatRiskAssessment | null;
  selectedZone?: LocationZone | null;
  className?: string;
}

// Stull formula for Wet Bulb Temperature calculation (°C)
function calculateWetBulb(t: number, rh: number): number {
  const tw =
    t * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Number(tw.toFixed(1));
}

export const TodayConditionsGrid: React.FC<TodayConditionsGridProps> = ({
  currentReading: propsReading,
  currentRisk: propsRisk,
  selectedZone: propsZone,
  className = '',
}) => {
  const context = useLocationTracker();

  const reading = propsReading !== undefined ? propsReading : context.currentReading;
  const risk = propsRisk !== undefined ? propsRisk : context.currentRisk;
  const zone = propsZone !== undefined ? propsZone : context.selectedZone;

  // Primary Metrics with fallback realism
  const currentTemp = reading?.temperature_c ?? 34.0;
  const feelsLike = reading?.feels_like_c ?? 37.2;
  const humidity = reading?.relative_humidity_pct ?? 54;
  const windSpeed = reading?.wind_speed_kmh ?? 14.0;
  const uvIndex = reading?.uv_index ?? 7.5;
  const uhiFactor = zone?.urban_heat_island_factor ? (zone.urban_heat_island_factor - 1) * 10 : 3.2;

  const wetBulb = reading?.wet_bulb_c ?? calculateWetBulb(currentTemp, humidity);
  const deltaFeelsLike = Number((feelsLike - currentTemp).toFixed(1));
  const asphaltTemp = Math.round(currentTemp * 1.32);

  // Status Helpers
  const getFeelsLikeStatus = (fl: number) => {
    if (fl >= 44) return { label: 'Extreme Strain', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (fl >= 39) return { label: 'High Strain', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (fl >= 34) return { label: 'Elevated Strain', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Comfortable', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getWindStatus = (speed: number) => {
    if (speed < 7) return { label: 'Stagnant Air', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (speed < 16) return { label: 'Light Breeze', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Active Circulation', badge: 'bg-sky-50 text-sky-700 border-sky-200' };
  };

  const getHumidityStatus = (rh: number) => {
    if (rh >= 65) return { label: 'High / Muggy', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (rh >= 45) return { label: 'Moderate', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Dry / Optimal', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getUvStatus = (uv: number) => {
    if (uv >= 11) return { label: 'Extreme (11+)', badge: 'bg-purple-50 text-purple-700 border-purple-200', stroke: '#A855F7' };
    if (uv >= 8) return { label: 'Very High (8-10)', badge: 'bg-rose-50 text-rose-700 border-rose-200', stroke: '#EF4444' };
    if (uv >= 6) return { label: 'High (6-7)', badge: 'bg-orange-50 text-orange-700 border-orange-200', stroke: '#F97316' };
    if (uv >= 3) return { label: 'Moderate (3-5)', badge: 'bg-amber-50 text-amber-700 border-amber-200', stroke: '#F59E0B' };
    return { label: 'Low (0-2)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', stroke: '#10B981' };
  };

  const feelsStatus = getFeelsLikeStatus(feelsLike);
  const windStatus = getWindStatus(windSpeed);
  const humStatus = getHumidityStatus(humidity);
  const uvStatus = getUvStatus(uvIndex);

  // Circular gauge for UV Index
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const uvPercent = Math.min(100, Math.max(0, (uvIndex / 12) * 100));
  const strokeDashoffset = circumference - (uvPercent / 100) * circumference;

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Today's conditions</span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Microclimate
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time environmental metrics and human physiological thermal indices
          </p>
        </div>
      </div>

      {/* 6 Clean, Spacious Soft-White Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Card 1: Feels Like */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Feels Like
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {feelsLike.toFixed(1)}°C
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {deltaFeelsLike > 0 ? `+${deltaFeelsLike}°C` : `${deltaFeelsLike}°C`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Thermal heat index perceived by skin
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${feelsStatus.badge}`}>
              {feelsStatus.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Ambient: {currentTemp.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Card 2: Wind */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Wind
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Wind className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {windSpeed.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-500">km/h</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Light breeze / Air circulation
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${windStatus.badge}`}>
              {windStatus.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-500" />
              SW · 210°
            </span>
          </div>
        </div>

        {/* Card 3: Humidity */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Humidity
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Droplets className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {Math.round(humidity)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Moisture content affecting sweat evaporation
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${humStatus.badge}`}>
              {humStatus.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Dew: ~{Math.round(currentTemp - (100 - humidity) / 5)}°C
            </span>
          </div>
        </div>

        {/* Card 4: UV Index */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                UV Index
              </span>
              
              {/* Circular Mini Donut Gauge */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="#F1F5F9"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke={uvStatus.stroke}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <Sun className="w-3.5 h-3.5 absolute text-amber-500" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {uvIndex.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">/ 12</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Solar radiation intensity
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${uvStatus.badge}`}>
              {uvStatus.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Peak: 12 PM - 3 PM
            </span>
          </div>
        </div>

        {/* Card 5: Rain / Moisture */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rain & Moisture
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  0%
                </span>
                <span className="text-xs font-semibold text-slate-500">· 0.0 mm</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Precipitation likelihood / Wet bulb status
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
              wetBulb >= 31 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                : wetBulb >= 29 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Wet Bulb: {wetBulb.toFixed(1)}°C
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Limit: 32.0°C
            </span>
          </div>
        </div>

        {/* Card 6: Urban Heat Island / Asphalt Strain */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Urban Heat Island
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  +{uhiFactor.toFixed(1)}°C
                </span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Thermal Trap
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Built-environment asphalt and concrete heat retention
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-purple-50 text-purple-700 border-purple-200">
              High Anomaly
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Asphalt: ~{asphaltTemp}°C
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TodayConditionsGrid;
