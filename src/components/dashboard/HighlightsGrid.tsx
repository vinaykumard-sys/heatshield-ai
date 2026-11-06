import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  CloudRain, 
  Sun, 
  Building2, 
  Info, 
  AlertCircle,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { EnvironmentalReading, HeatRiskAssessment, LocationZone } from '../../types';

export interface HighlightsGridProps {
  currentReading?: EnvironmentalReading | null;
  currentRisk?: HeatRiskAssessment | null;
  selectedZone?: LocationZone | null;
  className?: string;
}

// Stull's scientific formula for Wet Bulb Temperature calculation (°C)
function calculateWetBulb(t: number, rh: number): number {
  const tw =
    t * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Number(tw.toFixed(1));
}

export const HighlightsGrid: React.FC<HighlightsGridProps> = (props) => {
  const context = useLocationTracker();

  const reading = props.currentReading !== undefined ? props.currentReading : context.currentReading;
  const risk = props.currentRisk !== undefined ? props.currentRisk : context.currentRisk;
  const zone = props.selectedZone !== undefined ? props.selectedZone : context.selectedZone;

  // Primary Metrics
  const currentTemp = reading?.temperature_c ?? 41.2;
  const feelsLike = reading?.feels_like_c ?? 44.5;
  const humidity = reading?.relative_humidity_pct ?? 58;
  const windSpeed = reading?.wind_speed_kmh ?? 13.5;
  const uvIndex = reading?.uv_index ?? 8.4;
  const uhiFactor = zone?.urban_heat_island_factor ? (zone.urban_heat_island_factor - 1) * 10 : 3.4;

  const wetBulb = reading?.wet_bulb_c ?? calculateWetBulb(currentTemp, humidity);
  const deltaTemp = Number((feelsLike - currentTemp).toFixed(1));
  const asphaltTemp = Math.round(currentTemp * 1.32);

  // Ventilation Rating
  const getVentilationRating = (speed: number) => {
    if (speed < 7) return { label: 'Stagnant Air', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (speed < 15) return { label: 'Moderate Canopy Flow', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Active Ventilation', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };
  const ventilation = getVentilationRating(windSpeed);

  // UV Severity Info
  const getUvInfo = (uv: number) => {
    if (uv >= 11) return { label: 'Extreme (11+)', color: 'text-purple-700', stroke: '#A855F7', bg: 'bg-purple-50' };
    if (uv >= 8) return { label: 'Very High (8-10)', color: 'text-rose-700', stroke: '#EF4444', bg: 'bg-rose-50' };
    if (uv >= 6) return { label: 'High (6-7)', color: 'text-orange-700', stroke: '#F97316', bg: 'bg-orange-50' };
    if (uv >= 3) return { label: 'Moderate (3-5)', color: 'text-amber-700', stroke: '#F59E0B', bg: 'bg-amber-50' };
    return { label: 'Low (0-2)', color: 'text-emerald-700', stroke: '#10B981', bg: 'bg-emerald-50' };
  };
  const uvInfo = getUvInfo(uvIndex);

  // Donut Gauge SVG parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const uvPercent = Math.min(100, Math.max(0, (uvIndex / 12) * 100));
  const strokeDashoffset = circumference - (uvPercent / 100) * circumference;

  return (
    <div className={`space-y-4 ${props.className || ''}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Today's Highlights</span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Ward Analytics
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Microclimatic thermal indices and physiological strain indicators
          </p>
        </div>
      </div>

      {/* 6 Soft-White Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card 1: Feel Like */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Feel Like
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
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
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Thermal Strain:</span>
              <span className="font-bold text-rose-600 px-2 py-0.5 rounded-full bg-rose-50 text-[11px]">
                High Discomfort
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Elevated ambient humidity impairs natural cutaneous evaporative cooling.
            </p>
          </div>
        </div>

        {/* Card 2: Wind & Airflow */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Wind & Airflow
              </span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {Math.round(windSpeed)}
                </span>
                <span className="text-base font-bold text-slate-400">km/h</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <span>NW (North-West) • 3.8 m/s</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Ventilation:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] border ${ventilation.color}`}>
                {ventilation.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Street canyon geometry restricts heat dispersion across building facades.
            </p>
          </div>
        </div>

        {/* Card 3: Wet Bulb & Rain */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Wet Bulb & Rain
              </span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {wetBulb}
                </span>
                <span className="text-xl font-bold text-slate-400">°C</span>
              </div>
              <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                Precipitation: 0% (Clear Sky)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Relief Likelihood:</span>
              <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                Low Rain Relief
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Wet bulb remains below critical 31°C limit, but outdoor work breaks are mandatory.
            </p>
          </div>
        </div>

        {/* Card 4: Humidity */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Humidity
              </span>
              <div className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
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
                Dew point is ~{Math.round(currentTemp - ((100 - humidity) / 5))}°C right now
              </p>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="pt-1 space-y-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, humidity))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                <span>Dry</span>
                <span>Comfortable</span>
                <span>Humid</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sweat evaporation rate impaired by ~{Math.min(85, Math.round(humidity * 0.75))}%. Keep electrolytes replenished.
            </p>
          </div>
        </div>

        {/* Card 5: Solar UV Index (With Circular Donut Gauge) */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Solar UV Index
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sun className="w-4 h-4" />
              </div>
            </div>

            {/* Donut Gauge and Value Row */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                    {uvIndex.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/12</span>
                </div>
                <div className="mt-1">
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${uvInfo.bg} ${uvInfo.color}`}>
                    {uvInfo.label}
                  </span>
                </div>
              </div>

              {/* Circular SVG Donut Gauge (Image 2 style) */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#F1F5F9"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={uvInfo.stroke}
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-800">{Math.round(uvPercent)}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Max</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct skin burn risk under 15 minutes. Wear SPF 50+ and UV-blocking sunglasses.
            </p>
          </div>
        </div>

        {/* Card 6: Urban Heat Island (UHI) */}
        <div className="bg-white rounded-[26px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05),0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(15,23,42,0.09)] transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Urban Heat Island
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                  +{uhiFactor.toFixed(1)}
                </span>
                <span className="text-xl font-bold text-slate-400">°C</span>
              </div>
              <p className="text-xs font-semibold text-rose-600 mt-0.5">
                Surface anomaly vs rural periphery
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Asphalt Heat Factor:</span>
              <span className="font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">
                ~{asphaltTemp}°C surface
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dense concrete infrastructure absorbs solar radiation, sustaining high nocturnal heat.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HighlightsGrid;
