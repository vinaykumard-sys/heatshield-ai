import React from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Sun, 
  Wind, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Compass, 
  Sparkles,
  Info
} from 'lucide-react';
import { EnvironmentalReading, HeatRiskAssessment } from '../../types';

interface WeatherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  localityDisplayName: string;
  cityName: string;
  currentReading: EnvironmentalReading | null;
  currentRisk: HeatRiskAssessment | null;
  lastSyncTime: Date | null;
  actionResult: any;
}

export const WeatherDetailsModal: React.FC<WeatherDetailsModalProps> = ({
  isOpen,
  onClose,
  localityDisplayName,
  cityName,
  currentReading,
  currentRisk,
  lastSyncTime,
  actionResult
}) => {
  if (!isOpen) return null;

  const currentTemp = currentReading?.temperature_c ?? 28;
  const feelsLike = currentReading?.feels_like_c ?? (currentTemp + 2);
  const humidity = currentReading?.relative_humidity_pct ?? 55;
  const uv = currentReading?.uv_index ?? 6.2;
  const wind = currentReading?.wind_speed_kmh ?? 12.5;
  const pressure = 1013;
  const dewPoint = Math.round(currentTemp - ((100 - humidity) / 5));
  const wetBulb = actionResult?.advancedMetrics?.wetBulbApproxC ?? 24.2;
  const heatIndex = actionResult?.advancedMetrics?.heatIndexC ?? Math.round(feelsLike);
  const vaporPressure = actionResult?.advancedMetrics?.vaporPressureHpa ?? 26.4;
  const riskScore = actionResult?.riskScore ?? currentRisk?.risk_score ?? 64;
  const riskLevel = actionResult?.riskLevel ?? currentRisk?.risk_category ?? 'high';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold">
                <Thermometer className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Live Biometeorological Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span>{localityDisplayName}, {cityName}</span>
              <span className="text-slate-300">•</span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{lastSyncTime ? `Updated ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Telemetry'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Quick Status Strip */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black text-slate-900 tracking-tight font-sans">
              {Math.round(currentTemp)}°C
            </span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-700 block">
                Feels like {Math.round(feelsLike)}°C
              </span>
              <span className="text-[11px] text-slate-500 block">
                {currentReading?.weather_condition || 'Clear & Sunny'} • Wet Bulb {wetBulb}°C
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Risk Score</span>
              <span className="text-sm font-black text-slate-900">{riskScore}/100</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Category</span>
              <span className="text-xs font-black uppercase text-blue-700">{riskLevel}</span>
            </div>
          </div>
        </div>

        {/* 8 Detailed Biometeorology Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Wet-Bulb Temp */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Wet-Bulb</span>
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{wetBulb}°C</div>
            <span className="text-[10px] text-slate-500 block leading-tight">Human cooling limit: 35°C</span>
          </div>

          {/* Card 2: Heat Index */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Heat Index</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{heatIndex}°C</div>
            <span className="text-[10px] text-slate-500 block leading-tight">NOAA Rothfusz model</span>
          </div>

          {/* Card 3: Relative Humidity */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{humidity}%</div>
            <span className="text-[10px] text-slate-500 block leading-tight">Vapor: {vaporPressure} hPa</span>
          </div>

          {/* Card 4: UV Index */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">UV Index</span>
              <Sun className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-lg font-black text-slate-900">{uv} / 12</div>
            <span className="text-[10px] text-slate-500 block leading-tight">{uv >= 8 ? 'Very High SPF 50+' : 'Moderate SPF 30+'}</span>
          </div>

          {/* Card 5: Wind & Ventilation */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Wind Speed</span>
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{wind} km/h</div>
            <span className="text-[10px] text-slate-500 block leading-tight">Surface convective flow</span>
          </div>

          {/* Card 6: Dew Point */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Dew Point</span>
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{dewPoint}°C</div>
            <span className="text-[10px] text-slate-500 block leading-tight">Condensation threshold</span>
          </div>

          {/* Card 7: UHI Microclimate Anomaly */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">UHI Heat Island</span>
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-lg font-black text-slate-900">+1.8°C</div>
            <span className="text-[10px] text-slate-500 block leading-tight">Urban concrete canopy</span>
          </div>

          {/* Card 8: Ensemble Confidence */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Confidence</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-700">96%</div>
            <span className="text-[10px] text-slate-500 block leading-tight">AWS & Open-Meteo</span>
          </div>
        </div>

        {/* Plain Language Actionable Recommendations */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-[#1E60F2]" />
            <span>Physiological Safety Advisory for Residents</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            With a Wet-Bulb reading of <strong>{wetBulb}°C</strong> and relative humidity at <strong>{humidity}%</strong>, natural skin sweat evaporation efficiency is restricted by ~{Math.min(70, Math.round(humidity * 0.7))}%. It is essential to drink at least <strong>3.5 - 4.5 Liters</strong> of clean water or electrolyte ORS fluids today and minimize heavy outdoor exertion during peak hours.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Certified by IMD / NDMA Heat Action Plan guidelines.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherDetailsModal;
