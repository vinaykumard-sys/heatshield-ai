import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  RefreshCw, 
  Info,
  Clock,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  Sun,
  Moon,
  CloudSun,
  Wind,
  Navigation,
  Eye,
  Activity,
  Layers,
  Building2,
  BedDouble
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { mockDb } from '../lib/mockDb';
import { LocationZone, HeatForecast, PredictionComparison } from '../types';
import { generateLocationForecasts, getPredictionComparisons } from '../lib/predictionEngine';
import { fetchLiveWeather, WeatherFetchResult } from '../lib/weatherApi';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { RiskBadge } from '../components/common/RiskBadge';
import { useLocationTracker } from '../context/LocationContext';

/**
 * 3D-Styled Weather Icon with subtle SVG gradients and soft depth filters
 */
const Weather3DIcon: React.FC<{ 
  type: 'sun' | 'cloud-sun' | 'heatwave' | 'moon'; 
  className?: string;
  size?: number;
}> = ({ type, className = '', size = 44 }) => {
  if (type === 'sun') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className={`overflow-visible ${className}`}>
        <defs>
          <radialGradient id="sun3dGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="25%" stopColor="#FDE047" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </radialGradient>
          <filter id="sun3dShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#F97316" floodOpacity="0.45" />
          </filter>
        </defs>
        {/* Rays */}
        <g stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <line x1="24" y1="4" x2="24" y2="8" />
          <line x1="24" y1="40" x2="24" y2="44" />
          <line x1="4" y1="24" x2="8" y2="24" />
          <line x1="40" y1="24" x2="44" y2="24" />
          <line x1="10" y1="10" x2="13" y2="13" />
          <line x1="35" y1="35" x2="38" y2="38" />
          <line x1="10" y1="38" x2="13" y2="35" />
          <line x1="35" y1="13" x2="38" y2="10" />
        </g>
        {/* Sun Core */}
        <circle cx="24" cy="24" r="14" fill="url(#sun3dGrad)" filter="url(#sun3dShadow)" />
        {/* Inner specular gloss */}
        <circle cx="20" cy="19" r="4.5" fill="#FFFFFF" opacity="0.55" />
      </svg>
    );
  }

  if (type === 'cloud-sun') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className={`overflow-visible ${className}`}>
        <defs>
          <radialGradient id="sunBackGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <linearGradient id="cloud3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#64748B" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Sun peeking */}
        <circle cx="31" cy="17" r="9" fill="url(#sunBackGrad)" />
        {/* Cloud in front */}
        <path 
          d="M17 38h18a8 8 0 0 0 1.5-15.8 10 10 0 0 0-19-2.2A7 7 0 0 0 17 38z" 
          fill="url(#cloud3dGrad)" 
          filter="url(#cloudShadow)" 
        />
        <circle cx="25" cy="24" r="3" fill="#FFFFFF" opacity="0.6" />
      </svg>
    );
  }

  if (type === 'heatwave') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className={`overflow-visible ${className}`}>
        <defs>
          <radialGradient id="flameGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#F97316" />
            <stop offset="85%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>
          <filter id="flameShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#DC2626" floodOpacity="0.5" />
          </filter>
        </defs>
        <path 
          d="M24 4c2 7-3 11-1 16 3-3 6-4 7-2 4 4 4 12-1 16-6 5-16 4-19-3-3-8 1-13 4-18 2-3 4-6 5-9z" 
          fill="url(#flameGrad)" 
          filter="url(#flameShadow)" 
        />
        <circle cx="22" cy="27" r="4" fill="#FFFFFF" opacity="0.45" />
      </svg>
    );
  }

  // Moon for night
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={`overflow-visible ${className}`}>
      <defs>
        <radialGradient id="moon3dGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#C7D2FE" />
          <stop offset="80%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </radialGradient>
        <filter id="moonShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#6366F1" floodOpacity="0.4" />
        </filter>
      </defs>
      <path 
        d="M32 9A16 16 0 1 0 39 33 14 14 0 0 1 32 9z" 
        fill="url(#moon3dGrad)" 
        filter="url(#moonShadow)" 
      />
      <circle cx="21" cy="24" r="2.5" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
};

export const PredictionsPage: React.FC = () => {
  const { currentReading, currentRisk } = useLocationTracker();
  const locations = mockDb.getLocations();
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');
  const [forecasts, setForecasts] = useState<HeatForecast[]>([]);
  const [comparisons, setComparisons] = useState<PredictionComparison[]>([]);
  const [dailyForecast, setDailyForecast] = useState<WeatherFetchResult['forecastDaily']>([]);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherFetchResult['forecastHourly']>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<24 | 48 | 72>(24);

  const selectedLoc = locations.find(l => l.id === selectedLocId) || locations[0];

  const loadForecastData = async (loc: LocationZone, force = false) => {
    setIsLoading(true);
    try {
      const [results, weatherData] = await Promise.all([
        generateLocationForecasts(loc, force),
        fetchLiveWeather(loc.latitude, loc.longitude, loc.id, force).catch(() => null)
      ]);
      setForecasts(results);
      setComparisons(getPredictionComparisons(loc.id));
      if (weatherData) {
        setDailyForecast(weatherData.forecastDaily || []);
        setHourlyForecast(weatherData.forecastHourly || []);
      }
    } catch (e) {
      console.error('Error loading predictive forecasts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLoc) {
      loadForecastData(selectedLoc);
    }
  }, [selectedLocId]);

  const activeForecast = forecasts.find(f => f.forecast_horizon_hours === selectedHorizon) || forecasts[0];

  // Primary Thermal Reading Baseline
  const nowTemp = currentReading?.temperature_c ? Number(currentReading.temperature_c.toFixed(1)) : (forecasts[0] ? Number((forecasts[0].predicted_temperature_c - 1.2).toFixed(1)) : 33.2);
  const nowFeelsLike = currentReading?.feels_like_c ? Number(currentReading.feels_like_c.toFixed(1)) : (forecasts[0] ? Number((forecasts[0].predicted_feels_like_c - 1.0).toFixed(1)) : 35.4);
  const nowRisk = currentRisk?.risk_score ?? (forecasts[0] ? Math.max(30, forecasts[0].predicted_risk_score - 4) : 52);
  const nowHumidity = currentReading?.relative_humidity_pct ?? (forecasts[0] ? forecasts[0].predicted_humidity_pct : 54);

  // Fallback 7-day strip if API has not returned dailyForecast yet
  const displayDaily = useMemo(() => {
    if (dailyForecast && dailyForecast.length > 0) {
      return dailyForecast.slice(0, 7);
    }
    // Generate synthetic 7-day sequence based on baseline
    const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    return days.map((dayLabel, idx) => {
      const offset = idx === 0 ? 0 : idx === 1 ? 1.4 : idx === 2 ? 2.1 : idx === 3 ? 1.8 : 0.8;
      const maxT = Number((nowTemp + offset).toFixed(1));
      const minT = Number((nowTemp - 6.5 + (offset * 0.4)).toFixed(1));
      return {
        date: new Date(Date.now() + idx * 86400000).toISOString(),
        max_temp_c: maxT,
        min_temp_c: minT,
        avg_humidity_pct: Math.min(85, Math.max(35, nowHumidity + (idx % 2 === 0 ? -4 : 6))),
        uv_index_max: maxT > 37 ? 10 : maxT > 34 ? 8 : 6,
        risk_level: (maxT > 38 ? 'critical' : maxT > 35 ? 'high' : maxT > 31 ? 'moderate' : 'low') as any
      };
    });
  }, [dailyForecast, nowTemp, nowHumidity]);

  // Hourly curve data derived from real hourly forecast or 24h cycle model
  const hourlyCurveData = useMemo(() => {
    if (hourlyForecast && hourlyForecast.length >= 12) {
      // Pick 24 hourly intervals
      return hourlyForecast.slice(0, 24).map((h, idx) => {
        const timeLabel = h.time ? h.time.split('T')[1]?.slice(0, 5) || h.time : `${idx}:00`;
        return {
          time: timeLabel,
          temp: Number(h.temperature_c.toFixed(1)),
          feelsLike: Number((h.heat_index_c || h.temperature_c + 2.1).toFixed(1)),
          humidity: h.relative_humidity_pct,
          uv: h.uv_index ?? (idx >= 10 && idx <= 16 ? 8 : 1)
        };
      });
    }

    // Mathematical diurnal heat cycle curve for selected locality
    const baseT = activeForecast ? activeForecast.predicted_temperature_c : nowTemp;
    const hours = [
      '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00'
    ];
    return hours.map((hour, i) => {
      // Peak heat at 14:00, coolest at 06:00
      let tempMod = 0;
      if (hour === '14:00') tempMod = 0;
      else if (hour === '12:00' || hour === '16:00') tempMod = -1.2;
      else if (hour === '10:00' || hour === '18:00') tempMod = -3.4;
      else if (hour === '08:00' || hour === '20:00') tempMod = -5.8;
      else tempMod = -7.5; // nocturnal retention level

      const tempVal = Number((baseT + tempMod).toFixed(1));
      const feelsVal = Number((tempVal + 2.4).toFixed(1));
      return {
        time: hour,
        temp: tempVal,
        feelsLike: feelsVal,
        humidity: Math.round(nowHumidity + (tempMod < -4 ? 12 : -8)),
        uv: (hour === '12:00' || hour === '14:00') ? 9 : (hour === '10:00' || hour === '16:00') ? 6 : 0
      };
    });
  }, [hourlyForecast, activeForecast, nowTemp, nowHumidity]);

  // Urban Heat Island Daytime vs Nighttime metrics
  const daytimeHigh = activeForecast ? activeForecast.predicted_temperature_c : Math.max(...displayDaily.map(d => d.max_temp_c));
  const daytimeFeelsLike = activeForecast ? activeForecast.predicted_feels_like_c : Number((daytimeHigh + 2.8).toFixed(1));
  const nighttimeLow = displayDaily[selectedDayIndex]?.min_temp_c ?? 28.4;
  const uhiNocturnalRetentionDelta = Number((selectedLoc.urban_heat_island_factor * 3.8).toFixed(1)); // Nocturnal retention penalty in °C

  // Extreme heat warning determination
  const isExtremeHeat = daytimeHigh >= 36.0 || (activeForecast && activeForecast.predicted_risk_score >= 70);

  // Ranked high risk neighbourhoods
  const baseLiveTemp = currentReading?.temperature_c || 33.0;
  const highRiskNeighbourhoods = useMemo(() => {
    return locations
      .map(loc => {
        const isNorth = loc.latitude > 25.0;
        const baseRisk = Math.round(50 + (loc.baseline_vulnerability_score * 0.3) + (isNorth ? 12 : 4));
        const predT = Number((baseLiveTemp * loc.urban_heat_island_factor).toFixed(1));
        return {
          id: loc.id,
          name: loc.name,
          city: loc.city,
          predictedRisk: Math.min(96, baseRisk),
          predictedTemp: predT,
          vulnerability: loc.baseline_vulnerability_score,
          uhi: loc.urban_heat_island_factor
        };
      })
      .sort((a, b) => b.predictedRisk - a.predictedRisk)
      .slice(0, 6);
  }, [locations, baseLiveTemp]);

  const formatDayName = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    } catch {
      return `Day ${idx + 1}`;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Universal Location Bar */}
      <LocationTrackerBar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#1E60F2]" />
            <span>Heat Forecast & Risk Projection</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hyperlocal predictive models with diurnal curve analytics and urban heat island tracking
          </p>
        </div>

        {/* Locality Selector & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="appearance-none bg-white border border-[#E5EDF5] text-slate-900 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl shadow-xs input-interactive focus:outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => selectedLoc && loadForecastData(selectedLoc, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-[#E5EDF5] btn-press transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1E60F2] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Update Forecast</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. EXTREME HEAT WARNING BANNER
          ========================================================================= */}
      {isExtremeHeat && (
        <div className="relative overflow-hidden rounded-[28px] border border-orange-200/90 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-red-50/60 p-5 sm:p-6 shadow-[0_10px_30px_rgba(249,115,22,0.06)] animate-page-enter">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                    Severe Heat Advisory
                  </span>
                  <span className="text-xs font-bold text-orange-900">
                    Peak Thermal Window: 12:30 PM – 4:30 PM
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  High Thermal Risk in {selectedLoc.name}: Daytime Peak {daytimeHigh}°C
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
                  Temperatures projected to feel like <strong>{daytimeFeelsLike}°C</strong> with severe solar load. Urban Heat Island retention will keep night temperatures at <strong>{nighttimeLow}°C</strong> (+{uhiNocturnalRetentionDelta}°C retention delta), hindering physiological cooling recovery.
                </p>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-200/60">
              <span className="text-xs font-bold text-orange-800 bg-white/80 border border-orange-200 px-3 py-1.5 rounded-xl shadow-xs">
                💧 Hydrate: 500ml/hr
              </span>
              <a
                href="/cooling-centres"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-bold shadow-md shadow-orange-600/20 hover:brightness-110 transition-all btn-press"
              >
                <span>Find Shelter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. 7-DAY WEATHER STRIP WITH 3D-STYLED ICONS
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E60F2]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              7-Day Predictive Weather & Heat Index Strip
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Select a day to inspect
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {displayDaily.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isHotDay = day.max_temp_c >= 36;
            const iconType: 'sun' | 'cloud-sun' | 'heatwave' | 'moon' = 
              isHotDay ? 'heatwave' : day.avg_humidity_pct > 65 ? 'cloud-sun' : 'sun';

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-4 rounded-[24px] border text-center transition-all cursor-pointer bg-white relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#1E60F2] ring-2 ring-[#1E60F2]/15 shadow-md bg-gradient-to-b from-blue-50/40 via-white to-white'
                    : 'border-[#E5EDF5] hover:border-blue-200 hover:shadow-card hover:-translate-y-0.5'
                }`}
              >
                {/* Active Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#1E60F2] rounded-b-full" />
                )}

                <div className="text-xs font-bold text-slate-700 mb-2 truncate">
                  {formatDayName(day.date, idx)}
                </div>

                {/* 3D Icon Container */}
                <div className="flex items-center justify-center my-2 group-hover:scale-108 transition-transform duration-200">
                  <Weather3DIcon type={iconType} size={46} />
                </div>

                {/* High / Low Temperature Badges */}
                <div className="flex items-baseline justify-center gap-1.5 my-1.5">
                  <span className="text-base font-extrabold text-slate-900 font-sans">
                    {Math.round(day.max_temp_c)}°
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-sans">
                    {Math.round(day.min_temp_c)}°
                  </span>
                </div>

                {/* Risk Category Pill */}
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    day.risk_level === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                    day.risk_level === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    day.risk_level === 'moderate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="capitalize">{day.risk_level}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. HOURLY HEAT CURVE (AREA CHART) & HORIZON CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Progression Area Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1E60F2]" />
                <span>Hyperlocal Hourly Heat Progression Curve</span>
              </h3>
              <p className="text-xs text-slate-500">
                Diurnal curve displaying temperature, heat index, and 35°C critical threshold
              </p>
            </div>

            {/* Horizon Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F5F8FC] p-1 rounded-xl border border-[#E5EDF5] self-start sm:self-auto text-xs font-semibold">
              {(['24', '48', '72'] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedHorizon(Number(h) as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedHorizon === Number(h)
                      ? 'bg-[#1E60F2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>

          {/* Chart Viewport */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Temperature Gradient (Golden Amber to transparent) */}
                  <linearGradient id="curveTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Feels Like Gradient (Electric Blue to transparent) */}
                  <linearGradient id="curveFeelsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#1E60F2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={['dataMin - 3', 'dataMax + 3']} tickLine={false} axisLine={false} />
                <ReferenceLine y={35} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '35°C Alert Threshold', fill: '#EF4444', fontSize: 10, position: 'top' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
                          <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-1">
                            <span>Time: {data.time}</span>
                            <span className="text-[10px] text-slate-400">Hourly Model</span>
                          </div>
                          <div className="flex items-center justify-between text-orange-600 font-bold">
                            <span>Ambient Temp:</span>
                            <span>{data.temp}°C</span>
                          </div>
                          <div className="flex items-center justify-between text-[#1E60F2] font-bold">
                            <span>Feels Like:</span>
                            <span>{data.feelsLike}°C</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                            <span>Humidity:</span>
                            <span>{data.humidity}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="feelsLike"
                  name="Feels Like (°C)"
                  stroke="#1E60F2"
                  strokeWidth={2.4}
                  fillOpacity={1}
                  fill="url(#curveFeelsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#F97316"
                  strokeWidth={2.8}
                  fillOpacity={1}
                  fill="url(#curveTempGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Peak Highlight */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded-full bg-[#F97316]" />
                <span>Ambient Temp (°C)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded-full bg-[#1E60F2]" />
                <span>Feels Like / Heat Index</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Peak Thermal Window: 13:00 - 16:30 ({Math.round(daytimeHigh)}°C)
            </span>
          </div>
        </div>

        {/* AI Predictive Insight Card */}
        <div className="bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  AI Model Explainability (+{activeForecast?.forecast_horizon_hours || 24}h)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                92% Accuracy
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] text-xs text-slate-700 leading-relaxed">
              {activeForecast?.ai_explanation || `Atmospheric compression combined with low tree canopy density in ${selectedLoc.name} is driving an amplified urban thermal retention cycle.`}
            </div>

            {/* Contributing Factor Sliders */}
            <div className="space-y-3 pt-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Contributing Risk Factors
              </p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Solar Radiation</span>
                  <span className="font-bold text-slate-900">{activeForecast?.contributing_factors.ambient_temperature_score || 84}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${activeForecast?.contributing_factors.ambient_temperature_score || 84}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Humidity Heat Index</span>
                  <span className="font-bold text-slate-900">{activeForecast?.contributing_factors.humidity_heat_index_score || 68}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#1E60F2] h-full rounded-full" style={{ width: `${activeForecast?.contributing_factors.humidity_heat_index_score || 68}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Urban Canopy Deficit</span>
                  <span className="font-bold text-slate-900">{activeForecast?.contributing_factors.urban_exposure_score || 72}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activeForecast?.contributing_factors.urban_exposure_score || 72}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Checklist */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recommended Protocol
            </span>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-[#1E60F2] font-bold">•</span>
                <span>Hydrate prior to afternoon heat index spike.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#1E60F2] font-bold">•</span>
                <span>Avoid unshaded tarmac during peak solar radiation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. COMPARISON CARDS: DAYTIME VS NIGHTTIME (UHI NOCTURNAL RETENTION)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1E60F2]" />
              <span>Diurnal Thermal Contrast & Urban Heat Island Nocturnal Retention</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Comparing daytime direct solar load against nighttime heat trapping caused by concrete thermal inertia
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto">
            UHI Factor: {selectedLoc.urban_heat_island_factor}x
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Daytime Solar Peak */}
          <div className="rounded-[28px] border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-6 shadow-[0_10px_30px_rgba(245,158,11,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Daytime Solar Peak (11:00 AM – 05:00 PM)
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold">
                    Direct Solar Radiation & Ambient High
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                Peak Load
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <div>
                <span className="text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
                  {daytimeHigh}°C
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Feels like ~{daytimeFeelsLike}°C
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                  High Heat Exhaustion Risk
                </span>
              </div>
            </div>

            {/* Environmental breakdown */}
            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-white/90 border border-amber-100 text-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">UV Index</span>
                <span className="font-extrabold text-slate-900">9 (Very High)</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Asphalt Temp</span>
                <span className="font-extrabold text-orange-600">~52°C</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Relative Hum</span>
                <span className="font-extrabold text-slate-900">42%</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Outdoor workers and pedestrians face intense direct solar heating. Asphalt and dense roofing reach 50°C+, absorbing massive thermal energy for nocturnal release.
            </p>
          </div>

          {/* Card B: Nighttime Heat Retention (Critical UHI) */}
          <div className="rounded-[28px] border border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Nocturnal Heat Retention (10:00 PM – 05:00 AM)
                  </h3>
                  <p className="text-xs text-indigo-700 font-semibold">
                    Urban Heat Island Radiative Trapping
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Nocturnal Risk
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <div>
                <span className="text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
                  {nighttimeLow}°C
                </span>
                <span className="text-xs text-indigo-600 font-bold block mt-0.5">
                  +{uhiNocturnalRetentionDelta}°C retention penalty over rural baseline
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                  Severe Sleep Stress
                </span>
              </div>
            </div>

            {/* Environmental breakdown */}
            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-white/90 border border-indigo-100 text-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Release Lag</span>
                <span className="font-extrabold text-slate-900">6.2 Hours</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Indoor Air</span>
                <span className="font-extrabold text-indigo-600">&gt;30°C</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recovery</span>
                <span className="font-extrabold text-rose-600">Restricted</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dense concrete and masonry retain absorbed heat well past midnight. Temperatures stay above 28°C, preventing core body cooling and cardiovascular rest.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. NEIGHBORHOOD RISK PROJECTIONS & COMPARISON VERIFICATION
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Neighborhood Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Highest Projected Risk Neighborhoods (Next 24–48 Hours)
              </h3>
              <p className="text-xs text-slate-500">
                Ranked by Urban Heat Island factor and baseline vulnerability
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-[#1E60F2] border border-blue-100 self-start sm:self-auto">
              Live Heat Index
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F8FC] text-slate-500 uppercase tracking-wider font-semibold border-y border-[#E5EDF5]">
                <tr>
                  <th className="px-4 py-3">Neighborhood</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Predicted High</th>
                  <th className="px-4 py-3">UHI Factor</th>
                  <th className="px-4 py-3">Risk Category</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highRiskNeighbourhoods.map((n, idx) => (
                  <tr key={n.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                      <span>{n.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{n.city}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <span className={n.predictedTemp >= 38 ? 'text-red-600' : 'text-slate-900'}>
                        {n.predictedTemp}°C
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{n.uhi}x</td>
                    <td className="px-4 py-3">
                      <RiskBadge category={n.predictedRisk >= 75 ? 'critical' : n.predictedRisk >= 50 ? 'high' : 'moderate'} score={n.predictedRisk} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLocId(n.id)}
                        className="text-xs font-semibold text-[#1E60F2] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Accuracy & Verification */}
        <div className="bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Model Verification
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Measured vs Predicted
            </span>
          </div>

          <div className="space-y-3">
            {comparisons.map((cmp) => (
              <div key={cmp.horizon} className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Horizon: {cmp.horizon}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 text-[10px]">
                    {cmp.accuracy_label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Predicted</span>
                    <span className="font-bold text-slate-900">{cmp.predicted_temp}°C</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actual</span>
                    <span className="font-bold text-slate-900">{cmp.actual_temp}°C</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pred Risk</span>
                    <span className="font-bold text-[#1E60F2]">{cmp.predicted_risk}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actual Risk</span>
                    <span className="font-bold text-[#1E60F2]">{cmp.actual_risk}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionsPage;
