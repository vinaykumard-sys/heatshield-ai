import React, { useState, useMemo } from 'react';
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
  PhoneCall,
  ShieldAlert,
  Navigation,
  ShieldCheck,
  ChevronRight,
  Sun,
  Activity,
  Droplet
} from 'lucide-react';
import { LocationHeatReport, GeocodedPlace, CoolingCentre } from '../../types';
import { FullLocationReportModal } from './FullLocationReportModal';
import { mockDb } from '../../lib/mockDb';

interface LocationIntelligencePanelProps {
  report: LocationHeatReport | null;
  isLoading: boolean;
  onSelectPlace?: (place: GeocodedPlace) => void;
  className?: string;
}

// Haversine distance calculator for nearby cooling centres
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  // Find nearest verified cooling centres from database
  const nearestCoolingCentres = useMemo(() => {
    if (!report) return [];
    const centres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
    return centres
      .map(c => ({
        centre: c,
        distanceKm: calculateDistanceKm(report.latitude, report.longitude, c.latitude, c.longitude)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 2);
  }, [report]);

  // Loading state skeleton
  if (isLoading) {
    return (
      <aside aria-label="Location Telemetry Loading" className={`w-full h-full min-h-[420px] bg-slate-900/98 backdrop-blur-xl text-white p-6 flex flex-col justify-center items-center gap-3 animate-pulse ${className}`}>
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-bold">
          ANALYZING COORDINATES...
        </span>
        <span className="text-[11px] text-slate-400 text-center max-w-[260px] leading-relaxed">
          Retrieving Open-Meteo atmospheric telemetry and evaluating hyperlocal heat risk...
        </span>
      </aside>
    );
  }

  // Blank state prompt
  if (!report) {
    return (
      <aside aria-label="Location Intelligence Panel" className={`w-full h-full min-h-[420px] bg-slate-900/98 backdrop-blur-xl text-white p-6 flex flex-col justify-center items-center text-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-lg">
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

  // Trajectory points for pure SVG curve
  const forecastPoints = [
    { label: 'Now', temp: report.temperature, risk: Math.round(report.risk_score) },
    { label: '+24h', temp: report.forecast_data.pred24h_temp, risk: report.forecast_data.pred24h_risk },
    { label: '+48h', temp: report.forecast_data.pred48h_temp, risk: report.forecast_data.pred48h_risk },
    { label: '+72h', temp: report.forecast_data.pred72h_temp, risk: report.forecast_data.pred72h_risk }
  ];

  const minTemp = Math.min(...forecastPoints.map(p => p.temp)) - 1;
  const maxTemp = Math.max(...forecastPoints.map(p => p.temp)) + 1;
  const tempRange = Math.max(1, maxTemp - minTemp);

  // SVG coordinates calculation (width: 280, height: 60)
  const svgWidth = 280;
  const svgHeight = 60;
  const coords = forecastPoints.map((pt, i) => {
    const x = 20 + i * ((svgWidth - 40) / 3);
    const y = svgHeight - 12 - ((pt.temp - minTemp) / tempRange) * (svgHeight - 24);
    return { x, y, ...pt };
  });

  const pathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

  return (
    <>
      <aside 
        aria-label="Location Intelligence Report" 
        className={`w-full h-full bg-slate-900/98 backdrop-blur-xl text-white flex flex-col p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 pb-24 ${className}`}
      >
        {/* =========================================================================
            SECTION 1: SELECTED LOCATION INFORMATION
            ========================================================================= */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{report.city || 'India'}, {report.state || ''}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleToggleFavorite}
                className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                title={isFavorited ? 'Saved in favorites' : 'Add to favorites'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-400 text-rose-400' : ''}`} />
              </button>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug break-words">
            {report.location_name}
          </h3>
        </div>

        {/* =========================================================================
            SECTION 2: LOCATION COORDINATES
            ========================================================================= */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <span className="flex items-center gap-1 truncate">
            <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
          </span>
          {report.pincode && (
            <span className="text-slate-300 font-semibold shrink-0 pl-2 border-l border-slate-800">
              PIN: {report.pincode}
            </span>
          )}
        </div>

        {/* =========================================================================
            SECTION 3: DATA FRESHNESS INDICATOR
            ========================================================================= */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>OPEN-METEO LIVE</span>
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{new Date(report.created_at || report.data_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        </div>

        {/* =========================================================================
            SECTION 4: ENVIRONMENTAL STATUS
            ========================================================================= */}
        {isAbove35 ? (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-red-400 block text-[11px] uppercase tracking-wider">
                HEAT DANGER ZONE (&gt; 35.0°C)
              </span>
              <p className="text-[10px] text-red-200 leading-relaxed">
                Ambient reading exceeds safe threshold ({report.temperature.toFixed(1)}°C). Red radar ring active on map.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 text-slate-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Normal Thermal Range ({report.temperature.toFixed(1)}°C). No red circle overlay.</span>
          </div>
        )}

        {/* =========================================================================
            SECTIONS 5 & 6: WEATHER CARD 2-COLUMN GRID
            Row 1: Ambient Temperature | Feels Like
            Row 2: Humidity            | Wind / Sky
            ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5 font-mono">
          {/* Card 1: Ambient Temperature */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between min-h-[76px] space-y-1 hover-elevate transition-all duration-200">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">Ambient Temp</span>
            </div>
            <div className={`text-xl font-black transition-colors duration-300 ${isAbove35 ? 'text-red-400' : 'text-white'}`}>
              {report.temperature.toFixed(1)}°C
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {isAbove35 ? 'Critical Heat' : 'Standard'}
            </div>
          </div>

          {/* Card 2: Feels Like */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between min-h-[76px] space-y-1 hover-elevate transition-all duration-200">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate">Feels Like</span>
            </div>
            <div className="text-xl font-black text-orange-400 transition-colors duration-300">
              {report.feels_like.toFixed(1)}°C
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Apparent Index
            </div>
          </div>

          {/* Card 3: Humidity */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between min-h-[76px] space-y-1 hover-elevate transition-all duration-200">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Humidity</span>
            </div>
            <div className="text-xl font-black text-cyan-400 transition-colors duration-300">
              {report.humidity}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Relative Vapor
            </div>
          </div>

          {/* Card 4: Wind / Sky */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between min-h-[76px] space-y-1 hover-elevate transition-all duration-200">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Wind / Sky</span>
            </div>
            <div className="text-base font-black text-slate-100 truncate transition-colors duration-300">
              {report.wind_speed_kmh || 12} km/h
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {report.weather_condition || 'Clear Sky'}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 7: HEAT RISK SCORE
            ========================================================================= */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
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

          {/* Progress bar gauge */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${
                report.risk_category === 'critical' ? 'bg-red-500' :
                report.risk_category === 'high' ? 'bg-orange-500' :
                report.risk_category === 'moderate' ? 'bg-amber-400' :
                'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, report.risk_score))}%` }}
            />
          </div>
        </div>

        {/* =========================================================================
            SECTION 8: 3-DAY TEMPERATURE OUTLOOK (Pure SVG Trajectory Curve)
            ========================================================================= */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono text-[10px]">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>3-Day Thermal Trajectory</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">
              Peak: {Math.max(...forecastPoints.map(d => d.temp)).toFixed(1)}°C
            </span>
          </div>

          {/* Pure SVG Sparkline: Never triggers ResizeObserver loops, zero overlapping */}
          <div className="w-full h-16 relative flex items-center justify-center">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area under curve */}
              <path d={areaD} fill="url(#trajGrad)" />

              {/* Trajectory Stroke */}
              <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

              {/* Nodes and Labels */}
              {coords.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#38BDF8" stroke="#0B132B" strokeWidth="1.5" />
                  <text 
                    x={pt.x} 
                    y={pt.y - 7} 
                    textAnchor="middle" 
                    fill="#F8FAFC" 
                    fontSize="9" 
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pt.temp.toFixed(0)}°
                  </text>
                  <text 
                    x={pt.x} 
                    y={svgHeight} 
                    textAnchor="middle" 
                    fill="#94A3B8" 
                    fontSize="8" 
                    fontFamily="monospace"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* =========================================================================
            SECTION 9: 24/48/72-HOUR FORECAST CARDS
            ========================================================================= */}
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-center">
          <div className="p-2 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-0.5 hover-elevate transition-all duration-150">
            <span className="text-slate-400 block">+24h</span>
            <span className="font-bold text-white text-xs block">{report.forecast_data.pred24h_temp}°C</span>
            <span className={`text-[9px] block font-semibold ${report.forecast_data.pred24h_risk > 65 ? 'text-orange-400' : 'text-slate-400'}`}>
              Risk {report.forecast_data.pred24h_risk}
            </span>
          </div>
          <div className="p-2 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-0.5 hover-elevate transition-all duration-150">
            <span className="text-slate-400 block">+48h</span>
            <span className="font-bold text-white text-xs block">{report.forecast_data.pred48h_temp}°C</span>
            <span className={`text-[9px] block font-semibold ${report.forecast_data.pred48h_risk > 65 ? 'text-orange-400' : 'text-slate-400'}`}>
              Risk {report.forecast_data.pred48h_risk}
            </span>
          </div>
          <div className="p-2 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-0.5 hover-elevate transition-all duration-150">
            <span className="text-slate-400 block">+72h</span>
            <span className="font-bold text-white text-xs block">{report.forecast_data.pred72h_temp}°C</span>
            <span className={`text-[9px] block font-semibold ${report.forecast_data.pred72h_risk > 65 ? 'text-orange-400' : 'text-slate-400'}`}>
              Risk {report.forecast_data.pred72h_risk}
            </span>
          </div>
        </div>

        {/* =========================================================================
            SECTION 10: AI ENVIRONMENTAL ASSESSMENT
            ========================================================================= */}
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>AI Environmental Assessment</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {report.ai_explanation}
          </p>
        </div>

        {/* =========================================================================
            SECTION 11: PREVENTIVE RECOMMENDATIONS
            ========================================================================= */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Preventive Heat Health Actions</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold shrink-0">💧</span>
              <span>Maintain hydration: drink at least 500ml water or ORS every 2 hours.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">☀️</span>
              <span>Avoid strenuous direct outdoor exposure during peak sun hours (12:00 PM – 03:30 PM).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">👕</span>
              <span>Wear loose, light-colored breathable cotton clothing and head covers.</span>
            </li>
          </ul>
        </div>

        {/* =========================================================================
            SECTION 12: NEARBY COOLING CENTRES
            ========================================================================= */}
        <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Nearby Verified Cooling Respite</span>
            </div>
            <span className="text-[9px] font-mono text-sky-400">Air-Conditioned</span>
          </div>

          {nearestCoolingCentres.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              No municipal cooling shelters in immediate proximity.
            </p>
          ) : (
            <div className="space-y-2">
              {nearestCoolingCentres.map(({ centre, distanceKm }) => (
                <div 
                  key={centre.id}
                  className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {centre.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {centre.address} • ⏰ {centre.operating_hours}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1"
                  >
                    <span>{distanceKm.toFixed(1)} km</span>
                    <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION 13: COMMUNITY ASSISTANCE INFORMATION & HELPLINES
            ========================================================================= */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-red-400 shrink-0" />
              <span>Emergency Heat Helplines</span>
            </span>
            <span className="text-[9px] font-mono text-red-400 font-bold">24x7 TOLL FREE</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <a 
              href="tel:112" 
              className="p-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 rounded-lg text-red-200 transition-colors block"
            >
              <span className="text-xs font-black block font-mono">112</span>
              <span className="text-[9px] text-red-300">National</span>
            </a>
            <a 
              href="tel:108" 
              className="p-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 rounded-lg text-red-200 transition-colors block"
            >
              <span className="text-xs font-black block font-mono">108</span>
              <span className="text-[9px] text-red-300">Ambulance</span>
            </a>
            <a 
              href="tel:1070" 
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors block"
            >
              <span className="text-xs font-black block font-mono">1070</span>
              <span className="text-[9px] text-slate-400">Disaster</span>
            </a>
          </div>

          {/* Primary Action Button: View Full Location Report */}
          <button
            onClick={() => setShowFullModal(true)}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 btn-interact hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Full Dossier</span>
          </button>
        </div>
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