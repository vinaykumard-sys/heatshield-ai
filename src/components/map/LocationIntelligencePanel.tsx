import React, { useState } from 'react';
import { 
  MapPin, 
  Thermometer, 
  Flame, 
  Droplets, 
  Wind, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Heart, 
  FileText, 
  TrendingUp, 
  Building2, 
  Compass,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { LocationHeatReport, GeocodedPlace } from '../../types';
import { FullLocationReportModal } from './FullLocationReportModal';
import { mockDb } from '../../lib/mockDb';

interface LocationIntelligencePanelProps {
  report: LocationHeatReport | null;
  isLoading: boolean;
  onSelectPlace?: (place: GeocodedPlace) => void;
  className?: string;
}

export const LocationIntelligencePanel: React.FC<LocationIntelligencePanelProps> = ({
  report,
  isLoading,
  onSelectPlace,
  className = ''
}) => {
  const [showFullModal, setShowFullModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(() => 
    report ? mockDb.isFavoritePlace(report.location_name) : false
  );

  const handleToggleFavorite = () => {
    if (!report) return;
    const place: GeocodedPlace = {
      id: `fav-${Date.now()}`,
      displayName: report.location_name,
      shortName: report.location_name.split(',')[0],
      city: report.city || 'India',
      state: report.state || '',
      pincode: report.pincode,
      latitude: report.latitude,
      longitude: report.longitude,
      type: 'locality'
    };
    const newState = mockDb.toggleFavoritePlace(place);
    setIsFavorited(newState);
  };

  // Sparkline data for 3-day projection
  const forecastChartData = report ? [
    { label: 'Now', temp: report.temperature, risk: Math.round(report.risk_score) },
    { label: '+24h', temp: report.forecast_data.pred24h_temp, risk: report.forecast_data.pred24h_risk },
    { label: '+48h', temp: report.forecast_data.pred48h_temp, risk: report.forecast_data.pred48h_risk },
    { label: '+72h', temp: report.forecast_data.pred72h_temp, risk: report.forecast_data.pred72h_risk }
  ] : [];

  if (isLoading) {
    return (
      <aside aria-label="Location Telemetry Loading" className={`w-full lg:w-[380px] bg-slate-900/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-800 text-white p-5 flex flex-col justify-center items-center gap-3 animate-pulse ${className}`}>
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-semibold">
          ANALYZING COORDINATES...
        </span>
        <span className="text-[11px] text-slate-400 text-center max-w-[240px]">
          Retrieving Open-Meteo atmospheric telemetry and evaluating hyperlocal heat risk...
        </span>
      </aside>
    );
  }

  if (!report) {
    return (
      <aside aria-label="Location Intelligence Panel" className={`w-full lg:w-[380px] bg-slate-900/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-800 text-white p-6 flex flex-col justify-center items-center text-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-bold text-white">Geospatial Intelligence Ready</h4>
        <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
          Click <b>any point on the map</b> or search any Indian city, road, or PIN code to generate a live environmental heat report.
        </p>
      </aside>
    );
  }

  const isAbove35 = report.temperature > 35.0;

  return (
    <>
      <aside aria-label="Location Intelligence Report" className={`w-full lg:w-[380px] bg-slate-900/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-800 text-white flex flex-col p-4 sm:p-5 overflow-y-auto max-h-[540px] lg:max-h-none space-y-4 ${className}`}>
        {/* Header: Location & Freshness Badge */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{report.city || 'India'}, {report.state || ''}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleFavorite}
                className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                title={isFavorited ? 'Saved in favorites' : 'Add to favorites'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-400 text-rose-400' : ''}`} />
              </button>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                ● LIVE METEO
              </span>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug">
            {report.location_name}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>
              {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
            </span>
            {report.pincode && <span>PIN: {report.pincode}</span>}
          </div>
        </div>

        {/* Temperature Alert Banner: Strictly when > 35°C */}
        {isAbove35 ? (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2.5 text-red-200 text-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-400 block text-[11px] uppercase tracking-wider">
                RED HEAT DANGER ZONE (&gt; 35°C)
              </span>
              <span className="text-[10px] text-red-200">
                Temperature is {report.temperature}°C. Red circle rendered on map.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 text-slate-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Normal Thermal Range ({report.temperature}°C). No red circle overlay.</span>
          </div>
        )}

        {/* Microclimate Observation Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span>Ambient Temp</span>
            </div>
            <div className={`text-lg font-black ${isAbove35 ? 'text-red-400' : 'text-white'}`}>
              {report.temperature.toFixed(1)}°C
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Feels Like</span>
            </div>
            <div className="text-lg font-black text-orange-400">
              {report.feels_like.toFixed(1)}°C
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>Humidity</span>
            </div>
            <div className="text-lg font-black text-cyan-400">
              {report.humidity}%
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
              <Wind className="w-3 h-3 text-teal-400" />
              <span>Wind / Sky</span>
            </div>
            <div className="text-xs font-bold text-slate-200 truncate">
              {report.weather_condition || 'Clear'}
            </div>
            <div className="text-[10px] text-slate-400">
              {report.wind_speed_kmh || 12} km/h
            </div>
          </div>
        </div>

        {/* Operational Risk Index Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                HEAT RISK SCORE
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-white font-mono">
                  {report.risk_score.toFixed(1)}
                </span>
                <span className="text-slate-500 font-mono text-xs">/100</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              report.risk_category === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
              report.risk_category === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
              report.risk_category === 'moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              {report.risk_category} Risk
            </span>
          </div>

          {/* Progress gauge */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                report.risk_category === 'critical' ? 'bg-red-500' :
                report.risk_category === 'high' ? 'bg-orange-500' :
                report.risk_category === 'moderate' ? 'bg-amber-400' :
                'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, report.risk_score))}%` }}
            />
          </div>
        </div>

        {/* 3-Day Thermal Trajectory with Interactive Sparkline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono text-[10px]">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>3-Day Temperature Outlook</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Peak: {Math.max(...forecastChartData.map(d => d.temp))}°C
            </span>
          </div>

          {/* Mini Recharts Sparkline */}
          <div className="h-20 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastChartData} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#94A3B8', fontSize: 9, fontFamily: 'monospace' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#38BDF8' }}
                  formatter={(val: any) => [`${val}°C`, 'Forecast Temp']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#38BDF8" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#38BDF8', stroke: '#0F172A', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#38BDF8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Horizon cards */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-center pt-1">
            <div className="p-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg">
              <span className="text-slate-400 block">+24h</span>
              <span className="font-bold text-white text-xs block">{report.forecast_data.pred24h_temp}°C</span>
              <span className="text-slate-400">Risk {report.forecast_data.pred24h_risk}</span>
            </div>
            <div className="p-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg">
              <span className="text-slate-400 block">+48h</span>
              <span className="font-bold text-white text-xs block">{report.forecast_data.pred48h_temp}°C</span>
              <span className="text-slate-400">Risk {report.forecast_data.pred48h_risk}</span>
            </div>
            <div className="p-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg">
              <span className="text-slate-400 block">+72h</span>
              <span className="font-bold text-white text-xs block">{report.forecast_data.pred72h_temp}°C</span>
              <span className="text-slate-400">Risk {report.forecast_data.pred72h_risk}</span>
            </div>
          </div>
        </div>

        {/* AI Explainable Assessment Card */}
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Environmental Assessment</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
            {report.ai_explanation}
          </p>
        </div>

        {/* Primary Action Button: View Full Location Report */}
        <button
          onClick={() => setShowFullModal(true)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
        >
          <FileText className="w-4 h-4" />
          <span>View Full Location Report</span>
        </button>
      </aside>

      {/* Dedicated Fullscreen / Modal Report */}
      {showFullModal && (
        <FullLocationReportModal
          report={report}
          onClose={() => setShowFullModal(false)}
          onSelectPlace={onSelectPlace}
        />
      )}
    </>
  );
};
