import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Building2, 
  HeartPulse, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Phone,
  ShieldCheck,
  Compass,
  Eye
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { mockDb } from '../../lib/mockDb';
import { WaterStation, CoolingCentre, HospitalResource } from '../../types';

export interface NearbyHelpCardsProps {
  userLat?: number;
  userLon?: number;
  onLocateOnMap?: (facilityType: 'water' | 'cooling' | 'hospital', id: string) => void;
  className?: string;
}

// Haversine distance formula in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance: < 1 km -> "155 m", >= 1 km -> "1.8 km"
function formatDistance(distKm: number): string {
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

export const NearbyHelpCards: React.FC<NearbyHelpCardsProps> = ({
  userLat: propsLat,
  userLon: propsLon,
  onLocateOnMap,
  className = '',
}) => {
  const context = useLocationTracker();

  // Active coordinates
  const lat = propsLat ?? context.currentLocation?.latitude ?? context.selectedZone?.latitude ?? 28.6139;
  const lon = propsLon ?? context.currentLocation?.longitude ?? context.selectedZone?.longitude ?? 77.2090;

  // Compute nearest facilities sorted by real proximity
  const { nearestWater, nearestCooling, nearestMedical } = useMemo(() => {
    const waterList = mockDb.getWaterStations();
    const coolingList = mockDb.getCoolingCentres();
    const hospitalList = mockDb.getHospitals();

    // Sort water stations
    const sortedWater = [...waterList]
      .map((w) => ({
        ...w,
        distKm: getDistanceKm(lat, lon, w.latitude, w.longitude),
      }))
      .sort((a, b) => a.distKm - b.distKm);

    // Sort cooling centres
    const sortedCooling = [...coolingList]
      .map((c) => ({
        ...c,
        distKm: getDistanceKm(lat, lon, c.latitude, c.longitude),
      }))
      .sort((a, b) => a.distKm - b.distKm);

    // Sort hospitals
    const sortedHospitals = [...hospitalList]
      .map((h) => ({
        ...h,
        distKm: getDistanceKm(lat, lon, h.latitude, h.longitude),
      }))
      .sort((a, b) => a.distKm - b.distKm);

    return {
      nearestWater: sortedWater[0] || null,
      nearestCooling: sortedCooling[0] || null,
      nearestMedical: sortedHospitals[0] || null,
    };
  }, [lat, lon]);

  // Fallbacks if mock database is empty
  const waterData = nearestWater || {
    id: 'w-fallback',
    name: 'Municipal Water ATM Point',
    address: 'Near Central Metro Station, Gate 2',
    distKm: 0.155,
    operating_hours: '24 Hours',
    latitude: lat + 0.001,
    longitude: lon + 0.001,
  };

  const coolingData = nearestCooling || {
    id: 'c-fallback',
    name: 'Community Climate Cooling Sanctuary',
    address: 'Sector Public Library & Community Hall',
    distKm: 0.267,
    operating_hours: '08:00 AM - 08:00 PM',
    latitude: lat + 0.002,
    longitude: lon + 0.002,
  };

  const medicalData = nearestMedical || {
    id: 'm-fallback',
    name: 'District Heat Stroke Emergency Hospital',
    address: 'Block B, Sector Road (24/7 Heat ICU Ward)',
    distKm: 1.8,
    emergency_phone: '108 / 011-23365525',
    latitude: lat + 0.015,
    longitude: lon + 0.012,
  };

  // Google directions URL for hospital
  const medicalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${medicalData.latitude},${medicalData.longitude}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* SECTION HEADER (Requirement 13) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Nearby Help</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Live Proximity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified life-support facilities closest to your active location, sorted by walking and driving distance.
          </p>
        </div>

        <Link
          to="/cooling-centres"
          className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View all lifelines</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 PRIMARY CARDS (Requirement 13: Water, Cooling, Medical) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* CARD 1: WATER (Name, Distance, "Verified point", Action button [Locate]) */}
        <div className="bg-white rounded-[24px] border border-[#E5EDF5] p-5 shadow-xs hover:-translate-y-1 hover:border-blue-300 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3.5">
            {/* Top row: Icon, "Verified point" badge, Distance pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/80 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified point</span>
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                  {formatDistance(waterData.distKm)}
                </span>
              </div>
            </div>

            {/* Middle: Name & Address */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Hydration Station
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1E60F2] transition-colors line-clamp-1">
                {waterData.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{waterData.address}</span>
              </p>
            </div>
          </div>

          {/* Bottom Action: [Locate] button */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{('operating_hours' in waterData && waterData.operating_hours) || '24 Hours Open'}</span>
            </span>

            {onLocateOnMap ? (
              <button
                onClick={() => onLocateOnMap('water', waterData.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E60F2] text-[#1E60F2] hover:text-white border border-blue-200 hover:border-[#1E60F2] text-xs font-bold transition-all shadow-xs btn-press"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Locate</span>
              </button>
            ) : (
              <Link
                to="/water-stations"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E60F2] text-[#1E60F2] hover:text-white border border-blue-200 hover:border-[#1E60F2] text-xs font-bold transition-all shadow-xs btn-press"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Locate</span>
              </Link>
            )}
          </div>
        </div>

        {/* CARD 2: COOLING (Name, Distance, "Cooling centre", Action button [View]) */}
        <div className="bg-white rounded-[24px] border border-[#E5EDF5] p-5 shadow-xs hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3.5">
            {/* Top row: Icon, "Cooling centre" badge, Distance pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Cooling centre</span>
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                  {formatDistance(coolingData.distKm)}
                </span>
              </div>
            </div>

            {/* Middle: Name & Address */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Climate Shelter
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {coolingData.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{coolingData.address}</span>
              </p>
            </div>
          </div>

          {/* Bottom Action: [View] button */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{('operating_hours' in coolingData && coolingData.operating_hours) || 'Open during peak heat'}</span>
            </span>

            <Link
              to="/cooling-centres"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold transition-all shadow-xs btn-press"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </Link>
          </div>
        </div>

        {/* CARD 3: MEDICAL (Name, Distance, "Emergency facility", Action button [Directions]) */}
        <div className="bg-white rounded-[24px] border border-[#E5EDF5] p-5 shadow-xs hover:-translate-y-1 hover:border-rose-300 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-3.5">
            {/* Top row: Icon, "Emergency facility" badge, Distance pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
                  <HeartPulse className="w-3 h-3 text-rose-600" />
                  <span>Emergency facility</span>
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                  {formatDistance(medicalData.distKm)}
                </span>
              </div>
            </div>

            {/* Middle: Name & Address */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Heatstroke Care ICU
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-1">
                {medicalData.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{medicalData.address}</span>
              </p>
            </div>
          </div>

          {/* Bottom Action: [Directions] button (deep links to Google Maps or /hospital-directory) */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Phone className="w-3 h-3 text-rose-500" />
              <span>{('emergency_phone' in medicalData && medicalData.emergency_phone) || 'SOS 108'}</span>
            </span>

            <a
              href={medicalDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold transition-all shadow-xs btn-press"
              title="Open directions in Google Maps"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NearbyHelpCards;
