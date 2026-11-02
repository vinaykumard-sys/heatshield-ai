import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Thermometer, 
  Flame, 
  Droplets, 
  Wind, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Heart,
  Share2,
  Calendar,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { LocationHeatReport, GeocodedPlace } from '../../types';
import { formatReportAsText } from '../../lib/locationReportEngine';
import { mockDb } from '../../lib/mockDb';

interface FullLocationReportModalProps {
  report: LocationHeatReport;
  onClose: () => void;
  onSelectPlace?: (place: GeocodedPlace) => void;
}

export const FullLocationReportModal: React.FC<FullLocationReportModalProps> = ({
  report,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(() => mockDb.isFavoritePlace(report.location_name));

  const handleCopy = () => {
    const text = formatReportAsText(report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = formatReportAsText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HeatShield-Report-${report.location_name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleFavorite = () => {
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

  const isCritical = report.temperature > 35.0 || report.risk_score >= 75;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  GEOSPATIAL INTELLIGENCE REPORT
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {report.data_source.includes('Open-Meteo') ? '● LIVE TELEMETRY' : '● REGIONAL MODEL'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white line-clamp-1">
                {report.location_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorited
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Copy Report to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Download Report Text"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Coordinates and Timestamp meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Coordinates: <b>{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</b>
              </span>
              {report.pincode && <span>• PIN: <b>{report.pincode}</b></span>}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Assessed: {new Date(report.created_at).toLocaleTimeString()} ({new Date(report.created_at).toLocaleDateString()})</span>
            </div>
          </div>

          {/* Critical >35°C Alert if applicable */}
          {report.temperature > 35.0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-red-700">
                  RED THERMAL ALERT ZONE (&gt; 35.0°C)
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  Observed temperature in this sector exceeds the operational extreme thermal threshold. Outdoor sun exposure and physical labor must be strictly restricted.
                </p>
              </div>
            </div>
          )}

          {/* Environmental Conditions Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Current Microclimate Observations
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ambient Temp</span>
                </div>
                <div className={`text-xl font-extrabold font-mono ${report.temperature > 35 ? 'text-red-600' : 'text-slate-900'}`}>
                  {report.temperature.toFixed(1)}°C
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  <span>Heat Index</span>
                </div>
                <div className="text-xl font-extrabold text-orange-600 font-mono">
                  {report.feels_like.toFixed(1)}°C
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Humidity</span>
                </div>
                <div className="text-xl font-extrabold text-blue-600 font-mono">
                  {report.humidity}%
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Wind / Sky</span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {report.weather_condition || 'Clear Sky'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {report.wind_speed_kmh || 12} km/h
                </div>
              </div>
            </div>
          </div>

          {/* Heat Risk Score & Classification */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  OPERATIONAL HEAT RISK INDEX
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {report.risk_score.toFixed(1)}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">/ 100</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    report.risk_category === 'critical' ? 'bg-red-500 text-white' :
                    report.risk_category === 'high' ? 'bg-orange-500 text-white' :
                    report.risk_category === 'moderate' ? 'bg-amber-400 text-slate-900' :
                    'bg-emerald-500 text-white'
                  }`}>
                    {report.risk_category}
                  </span>
                </div>
              </div>

              {/* Mini Scale */}
              <div className="text-right text-[10px] font-mono text-slate-400 hidden sm:block">
                <div>Low: 0–24</div>
                <div>Moderate: 25–49</div>
                <div>High: 50–74</div>
                <div className="text-red-400 font-bold">Critical: 75–100</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  report.risk_category === 'critical' ? 'bg-red-500' :
                  report.risk_category === 'high' ? 'bg-orange-500' :
                  report.risk_category === 'moderate' ? 'bg-amber-400' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, report.risk_score))}%` }}
              />
            </div>
          </div>

          {/* Predictive 3-Day Thermal Outlook */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Predictive 3-Day Forecast Trajectory</span>
              <span className="text-[10px] text-blue-600 font-mono font-normal">Open-Meteo High-Res Model</span>
            </h4>
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Next 24 Hours</span>
                <span className="text-lg font-black text-slate-900 block my-0.5">
                  {report.forecast_data.pred24h_temp}°C
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Risk: <b>{report.forecast_data.pred24h_risk}</b>/100
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Next 48 Hours</span>
                <span className="text-lg font-black text-slate-900 block my-0.5">
                  {report.forecast_data.pred48h_temp}°C
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Risk: <b>{report.forecast_data.pred48h_risk}</b>/100
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Next 72 Hours</span>
                <span className="text-lg font-black text-slate-900 block my-0.5">
                  {report.forecast_data.pred72h_temp}°C
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Risk: <b>{report.forecast_data.pred72h_risk}</b>/100
                </span>
              </div>
            </div>
          </div>

          {/* AI Explainable Assessment */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI-Assisted Environmental Diagnostics</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {report.ai_explanation}
            </p>
          </div>

          {/* Preventive Health Protocols */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recommended Public Health Interventions
            </h4>
            <div className="space-y-2">
              {report.recommended_actions.map((act, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Helplines Bar */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-amber-900 font-semibold">
              Emergency Services:
            </span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <a href="tel:112" className="text-red-700 hover:underline">112 (National EMS)</a>
              <span>•</span>
              <a href="tel:108" className="text-red-700 hover:underline">108 (Ambulance)</a>
              <span>•</span>
              <a href="tel:1070" className="text-slate-700 hover:underline">1070 (Disaster)</a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Data Source: <b>{report.data_source}</b></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
