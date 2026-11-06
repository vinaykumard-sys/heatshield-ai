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
  Phone,
  ArrowLeft,
  X,
  Stethoscope,
  Trees
} from 'lucide-react';
import { LocationHeatReport, GeocodedPlace, CoolingCentre } from '../../types';
import { FullLocationReportModal } from './FullLocationReportModal';
import { mockDb } from '../../lib/mockDb';

export interface FacilityDetails {
  id: string;
  type: 'water' | 'cooling' | 'hospital' | 'route';
  name: string;
  categoryLabel: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  operating_hours: string;
  status: string;
  isVerified: boolean;
  phone?: string;
  amenities?: string[];
  capacity?: number | string;
  routeDetails?: {
    distanceKm: number;
    shadeCoveragePct: number;
    durationMinutes: number;
    heatExposureScore: number;
    summary: string;
    warnings?: string[];
  };
}

interface LocationIntelligencePanelProps {
  report: LocationHeatReport | null;
  isLoading: boolean;
  selectedFacility?: FacilityDetails | null;
  onClearSelectedFacility?: () => void;
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

function formatDist(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

export const LocationIntelligencePanel: React.FC<LocationIntelligencePanelProps> = ({
  report,
  isLoading,
  selectedFacility,
  onClearSelectedFacility,
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

  // Only facilities within 10 km (NO FAKE DATA)
  const nearestCoolingCentres = useMemo(() => {
    if (!report) return [];
    const centres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
    return centres
      .map(c => ({
        centre: c,
        distanceKm: calculateDistanceKm(report.latitude, report.longitude, c.latitude, c.longitude)
      }))
      .filter(item => item.distanceKm <= 10)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 2);
  }, [report]);

  // =========================================================================
  // VIEW 1: FACILITY DETAILS FLYOUT / CARD
  // =========================================================================
  if (selectedFacility) {
    const isWater = selectedFacility.type === 'water';
    const isCooling = selectedFacility.type === 'cooling';
    const isHospital = selectedFacility.type === 'hospital';
    const isRoute = selectedFacility.type === 'route';

    const accentBg = isWater ? 'bg-blue-50 text-[#1E60F2] border-blue-100' :
      isCooling ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      isHospital ? 'bg-rose-50 text-rose-600 border-rose-100' :
      'bg-cyan-50 text-cyan-700 border-cyan-100';

    return (
      <aside
        aria-label="Facility Details Card"
        className={`w-full h-full bg-white text-slate-800 flex flex-col p-5 overflow-y-auto space-y-4 animate-fadeIn ${className}`}
      >
        {/* Back navigation & dismiss */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <button
            onClick={onClearSelectedFacility}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Area Overview</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Header with Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${accentBg}`}>
              {isWater ? <Droplets className="w-3.5 h-3.5" /> :
               isCooling ? <Building2 className="w-3.5 h-3.5" /> :
               isHospital ? <Stethoscope className="w-3.5 h-3.5" /> :
               <Navigation className="w-3.5 h-3.5" />}
              <span>{selectedFacility.categoryLabel}</span>
            </span>

            {/* Real Distance Badge */}
            <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {formatDist(selectedFacility.distanceKm)} away
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
            {selectedFacility.name}
          </h3>

          <p className="text-xs text-slate-500 flex items-start gap-1 leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{selectedFacility.address}</span>
          </p>
        </div>

        {/* Verification & Operating Status Card */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{selectedFacility.status}</span>
            </span>
          </div>

          {selectedFacility.isVerified && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Verification</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Facility</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Operating Hours</span>
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {selectedFacility.operating_hours}
            </span>
          </div>
        </div>

        {/* Capacity / Amenities / Route Stats */}
        {isRoute && selectedFacility.routeDetails && (
          <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-100 space-y-2 text-xs">
            <div className="font-bold text-cyan-900 flex items-center gap-1.5">
              <Trees className="w-4 h-4 text-cyan-700" />
              <span>Shade-Optimized Corridor</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>Shade: <strong>{selectedFacility.routeDetails.shadeCoveragePct}%</strong></div>
              <div>Duration: <strong>{selectedFacility.routeDetails.durationMinutes} min</strong></div>
            </div>
            <p className="text-[11px] text-slate-600 pt-1">
              {selectedFacility.routeDetails.summary}
            </p>
          </div>
        )}

        {selectedFacility.capacity && (
          <div className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Estimated Capacity</span>
            <span className="font-bold text-slate-900">{selectedFacility.capacity} persons</span>
          </div>
        )}

        {/* Action Buttons: Directions and Calling */}
        <div className="space-y-2 pt-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.latitude},${selectedFacility.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-[#1E60F2] hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions in Google Maps</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {selectedFacility.phone && (
            <a
              href={`tel:${selectedFacility.phone}`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call Helpline ({selectedFacility.phone})</span>
            </a>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW 2: LOADING SKELETON
  // =========================================================================
  if (isLoading) {
    return (
      <aside aria-label="Loading location details" className={`w-full h-full min-h-[380px] bg-white text-slate-800 p-6 flex flex-col justify-center items-center gap-3 animate-pulse ${className}`}>
        <div className="w-10 h-10 rounded-full border-2 border-[#1E60F2] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-[#1E60F2] tracking-wide">
          Updating location telemetry...
        </span>
        <span className="text-xs text-slate-400 text-center max-w-[220px]">
          Calculating heat index and nearest verified shelters
        </span>
      </aside>
    );
  }

  // =========================================================================
  // VIEW 3: BLANK STATE PROMPT
  // =========================================================================
  if (!report) {
    return (
      <aside aria-label="Location details panel" className={`w-full h-full min-h-[380px] bg-white text-slate-800 p-6 flex flex-col justify-center items-center text-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Select any point on the map</h4>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
            Click any pin, facility, or coordinate to inspect live temperature, heat risk score, and nearby lifelines.
          </p>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW 4: LOCATION INTELLIGENCE REPORT FOR ACTIVE PIN
  // =========================================================================
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
        {/* Header */}
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

        {/* Temperature & Risk Badge Row */}
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

        {/* Action Buttons */}
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

        {/* Nearest Cooling Center or Honest Empty State (NO FAKE DATA) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {nearestCoolingCentres.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Nearby Cooling Sanctuary</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                  {formatDist(nearestCoolingCentres[0].distanceKm)}
                </span>
              </div>
              <div className="p-3 rounded-2xl border border-slate-200/80 bg-[#F5F8FC] flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate">
                      {nearestCoolingCentres[0].centre.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold shrink-0">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
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
            </>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>No registered facilities within 10 km</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Heat emergency helpline:{' '}
                <a href="tel:108" className="font-bold text-red-600 underline">108</a> /{' '}
                <a href="tel:112" className="font-bold text-slate-800 underline">112</a>
              </p>
            </div>
          )}
        </div>
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
