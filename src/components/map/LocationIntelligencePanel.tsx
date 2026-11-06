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
  Navigation,
  ExternalLink,
  ChevronRight,
  Sun,
  ShieldCheck,
  X
} from 'lucide-react';
import { LocationHeatReport, GeocodedPlace, CoolingCentre } from '../../types';
import { FullLocationReportModal } from './FullLocationReportModal';
import { mockDb } from '../../lib/mockDb';

interface LocationIntelligencePanelProps {
  report: LocationHeatReport | null;
  isLoading: boolean;
  onSelectPlace?: (place: GeocodedPlace) => void;
  onClose?: () => void;
  className?: string;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
  onClose,
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

  // Loading Skeleton
  if (isLoading) {
    return (
      <aside aria-label="Loading location details" className={`w-full h-full min-h-[380px] bg-white text-slate-800 p-6 flex flex-col justify-center items-center gap-3 animate-pulse ${className}`}>
        <div className="w-10 h-10 rounded-full border-2 border-[#1E60F2] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-[#1E60F2] tracking-wide">
          Updating location weather...
        </span>
        <span className="text-xs text-slate-400 text-center max-w-[220px]">
          Calculating heat index and nearest shelters
        </span>
      </aside>
    );
  }

  // Blank state prompt
  if (!report) {
    return (
      <aside aria-label="Location details panel" className={`w-full h-full min-h-[380px] bg-white text-slate-800 p-6 flex flex-col justify-center items-center text-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Select any location on map</h4>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
            Click any pin or coordinate to inspect live temperature, heat risk score, and nearby relief.
          </p>
        </div>
      </aside>
    );
  }

  const isAbove35 = report.temperature > 35.0;

  const getRiskBadge = () => {
    if (report.risk_score >= 75) return { label: 'CRITICAL RISK', color: 'bg-red-50 text-red-700 border-red-200' };
    if (report.risk_score >= 50) return { label: 'HIGH RISK', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (report.risk_score >= 25) return { label: 'MODERATE RISK', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'LOW RISK', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const riskBadge = getRiskBadge();
  const shortName = report.location_name.split(',')[0].trim();
  const regionName = `${report.city || ''}, ${report.state || ''}`.replace(/^,\s*|,\s*$/g, '');

  return (
    <>
      <aside 
        aria-label="Location Information Card" 
        className={`w-full h-full bg-white text-slate-800 flex flex-col p-5 overflow-y-auto space-y-4 animate-modal-enter ${className}`}
      >
        {/* Header (Section 20: Location Name, City, State) */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#1E60F2] flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{regionName || 'Monitored area'}</span>
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleToggleFavorite}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                title={isFavorited ? 'Saved in bookmarks' : 'Bookmark location'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            {shortName}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {report.location_name}
          </p>
        </div>

        {/* Temperature & Risk Badge Row (Section 20: 21°C, LOW RISK, Feels like 24°C) */}
        <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-slate-900 font-sans">
              {Math.round(report.temperature)}°C
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadge.color}`}>
              {riskBadge.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Feels like <strong className="text-slate-900">{Math.round(report.feels_like)}°C</strong></span>
            <span className="text-slate-400">Heat index: {Math.round(report.risk_score)}/100</span>
          </div>
        </div>

        {/* Environmental metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl border border-[#E5EDF5] bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span>Humidity</span>
            </div>
            <span className="font-bold text-slate-900">{report.humidity}%</span>
          </div>

          <div className="p-2.5 rounded-xl border border-[#E5EDF5] bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>UV Index</span>
            </div>
            <span className="font-bold text-slate-900">{(report as any).uv_index ?? 7}</span>
          </div>
        </div>

        {/* Action Buttons (Section 20: [Safety details] [Directions]) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setShowFullModal(true)}
            className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] font-semibold text-xs transition-colors flex items-center justify-center gap-1 btn-press"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety details</span>
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1 btn-press"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
          </a>
        </div>

        {/* Nearest Cooling Center */}
        {nearestCoolingCentres.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Nearby Cooling Sanctuary</span>
              <span>{nearestCoolingCentres[0].distanceKm.toFixed(1)} km</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-slate-900 truncate">
                  {nearestCoolingCentres[0].centre.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {nearestCoolingCentres[0].centre.address}
                </div>
              </div>
              <a
                href={`tel:${nearestCoolingCentres[0].centre.contact_phone || '108'}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs shrink-0 hover:bg-emerald-100 transition-colors"
              >
                Call
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* Full Modal Viewer */}
      {showFullModal && (
        <FullLocationReportModal
          report={report}
          onClose={() => setShowFullModal(false)}
        />
      )}
    </>
  );
};

export default LocationIntelligencePanel;
