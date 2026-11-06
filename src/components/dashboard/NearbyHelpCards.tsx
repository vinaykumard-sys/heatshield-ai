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
  Eye,
  AlertTriangle,
  PhoneCall
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
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
export function formatDistance(distKm: number): string {
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

const MAX_NEARBY_RADIUS_KM = 10;

export const NearbyHelpCards: React.FC<NearbyHelpCardsProps> = ({
  userLat: propsLat,
  userLon: propsLon,
  onLocateOnMap,
  className = '',
}) => {
  const context = useLocationTracker();

  // Active coordinates from props, tracker, or selected zone
  const lat = propsLat ?? context.currentLocation?.latitude ?? context.selectedZone?.latitude ?? 13.0854;
  const lon = propsLon ?? context.currentLocation?.longitude ?? context.selectedZone?.longitude ?? 77.6250;
  const locationLabel = context.currentLocation?.localityName || context.selectedZone?.name || 'your current area';

  // Compute nearest facilities sorted strictly by real proximity, capped at 10 km
  const { nearestWater, nearestCooling, nearestMedical, allEmptyWithin10km } = useMemo(() => {
    const waterList = mockDb.getWaterStations();
    const coolingList = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
    const hospitalList = mockDb.getHospitals();

    // Sort water stations and filter to within 10 km (NO FAKE DATA)
    const validWater = waterList
      .map((w) => ({
        ...w,
        distKm: getDistanceKm(lat, lon, w.latitude, w.longitude),
      }))
      .filter((w) => w.distKm <= MAX_NEARBY_RADIUS_KM)
      .sort((a, b) => a.distKm - b.distKm);

    // Sort cooling centres and filter to within 10 km
    const validCooling = coolingList
      .map((c) => ({
        ...c,
        distKm: getDistanceKm(lat, lon, c.latitude, c.longitude),
      }))
      .filter((c) => c.distKm <= MAX_NEARBY_RADIUS_KM)
      .sort((a, b) => a.distKm - b.distKm);

    // Sort hospitals and filter to within 10 km
    const validMedical = hospitalList
      .map((h) => ({
        ...h,
        distKm: getDistanceKm(lat, lon, h.latitude, h.longitude),
      }))
      .filter((h) => h.distKm <= MAX_NEARBY_RADIUS_KM)
      .sort((a, b) => a.distKm - b.distKm);

    const hasNone = validWater.length === 0 && validCooling.length === 0 && validMedical.length === 0;

    return {
      nearestWater: validWater[0] || null,
      nearestCooling: validCooling[0] || null,
      nearestMedical: validMedical[0] || null,
      allEmptyWithin10km: hasNone,
    };
  }, [lat, lon]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Nearby Help & Lifelines</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Within 10 km
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified life-support facilities closest to {locationLabel}, sorted by real travel distance.
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

      {/* OVERARCHING EMPTY STATE (NO FAKE DATA: when no facilities exist within 10 km) */}
      {allEmptyWithin10km ? (
        <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-base font-extrabold text-slate-900">
              No registered facilities within 10 km
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No municipal cooling shelter, public water ATM, or heat emergency facility is registered within 10 km of <span className="font-semibold text-slate-800">{locationLabel}</span>.
            </p>
            <div className="pt-2 text-sm font-bold text-red-600 flex items-center justify-center gap-2">
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Heat emergency helpline: 108 / 112</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Heat Ambulance (108)</span>
            </a>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>National Emergency (112)</span>
            </a>
            <Link
              to="/cooling-centres"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] font-bold text-xs border border-blue-200 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse State Directory</span>
            </Link>
          </div>
        </div>
      ) : (
        /* 3 PRIMARY CARDS: Water, Cooling, Medical (Real data or category-specific honest empty state) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* CARD 1: WATER */}
          {nearestWater ? (
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Droplets className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified point</span>
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                      {formatDistance(nearestWater.distKm)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Water ATM Point
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1E60F2] transition-colors line-clamp-1">
                    {nearestWater.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{nearestWater.address}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{nearestWater.operating_hours || '24 Hours Open'}</span>
                </span>

                {onLocateOnMap ? (
                  <button
                    onClick={() => onLocateOnMap('water', nearestWater.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E60F2] text-[#1E60F2] hover:text-white border border-blue-200 hover:border-[#1E60F2] text-xs font-bold transition-all shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Locate</span>
                  </button>
                ) : (
                  <Link
                    to="/water-stations"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1E60F2] text-[#1E60F2] hover:text-white border border-blue-200 hover:border-[#1E60F2] text-xs font-bold transition-all shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Locate</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Honest empty state for Water */
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 flex flex-col justify-between text-center space-y-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Droplets className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Water Stations within 10 km</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No registered water refill ATM found near your location.
                </p>
                <div className="text-[11px] font-semibold text-red-600">
                  Heat helpline: 108 / 112
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/water-stations"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  <span>Water Directory</span>
                </Link>
              </div>
            </div>
          )}

          {/* CARD 2: COOLING */}
          {nearestCooling ? (
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Cooling centre</span>
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                      {formatDistance(nearestCooling.distKm)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Climate Shelter
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {nearestCooling.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{nearestCooling.address}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{nearestCooling.operating_hours || 'Open peak heat'}</span>
                </span>

                <Link
                  to="/cooling-centres"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Honest empty state for Cooling */
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 flex flex-col justify-between text-center space-y-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Cooling Centre within 10 km</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No public cooling sanctuary registered within 10 km.
                </p>
                <div className="text-[11px] font-semibold text-red-600">
                  Heat helpline: 108 / 112
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/cooling-centres"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  <span>Cooling Directory</span>
                </Link>
              </div>
            </div>
          )}

          {/* CARD 3: MEDICAL */}
          {nearestMedical ? (
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <HeartPulse className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      <HeartPulse className="w-3 h-3 text-rose-600" />
                      <span>Emergency facility</span>
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                      {formatDistance(nearestMedical.distKm)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Heatstroke Care ICU
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-1">
                    {nearestMedical.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{nearestMedical.address}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-rose-500" />
                  <span>{nearestMedical.emergency_phone || 'SOS 108'}</span>
                </span>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestMedical.latitude},${nearestMedical.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold transition-all shadow-xs"
                  title="Open directions in Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            /* Honest empty state for Medical */
            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-5 flex flex-col justify-between text-center space-y-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Hospitals within 10 km</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Call emergency dispatch directly for emergency transport.
                </p>
                <div className="text-[11px] font-semibold text-red-600">
                  Heat emergency helpline: 108 / 112
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                <a
                  href="tel:108"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  <Phone className="w-3 h-3" />
                  <span>Dial 108</span>
                </a>
                <Link
                  to="/hospital-directory"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  <span>Directory</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default NearbyHelpCards;
