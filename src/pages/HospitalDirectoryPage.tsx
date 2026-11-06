import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  PhoneCall, 
  Bed, 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Navigation, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Info,
  ChevronRight,
  ExternalLink,
  Flame,
  Stethoscope
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { HospitalResource } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDist(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

export const HospitalDirectoryPage: React.FC = () => {
  const { currentLocation } = useLocationTracker();
  const [hospitals, setHospitals] = useState<HospitalResource[]>(() => mockDb.getHospitals());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'heatstroke' | 'pediatric' | 'icu' | 'open24_7'>('all');

  const userLat = currentLocation?.latitude || 13.0854;
  const userLon = currentLocation?.longitude || 77.6250;

  const hospitalsWithDist = useMemo(() => {
    return hospitals.map(h => ({
      ...h,
      distKm: getDistanceKm(userLat, userLon, h.latitude, h.longitude)
    })).sort((a, b) => a.distKm - b.distKm);
  }, [hospitals, userLat, userLon]);

  const filteredHospitals = useMemo(() => {
    return hospitalsWithDist.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === 'heatstroke') return h.has_heatstroke_ward;
      if (selectedFilter === 'pediatric') return h.has_pediatric_emergency;
      if (selectedFilter === 'icu') return h.has_burn_icu;
      if (selectedFilter === 'open24_7') return h.emergency_department_open;

      return true;
    });
  }, [hospitalsWithDist, searchQuery, selectedFilter]);

  const totalHeatstrokeBeds = useMemo(() => {
    return hospitals.reduce((acc, h) => acc + (h.has_heatstroke_ward ? 8 : 0), 0);
  }, [hospitals]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Emergency Alert Banner */}
      <div className="bg-red-50/80 border border-red-200/80 rounded-[20px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">Medical Emergency Notice</span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Severe Heatstroke is Life-Threatening (Call 108 / 112)
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              If an individual experiences high body temperature, confusion, faintness, or ceases to sweat, call an ambulance immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href="tel:108"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors btn-press"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 108 (Ambulance)</span>
          </a>
          <a
            href="tel:112"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors btn-press"
          >
            <span>Call 112</span>
          </a>
        </div>
      </div>

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#1E60F2]" />
            <span>Hospital & Emergency Medical Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified healthcare facilities with emergency departments and heatstroke stabilization wards
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">
            {hospitals.length} verified hospitals nearby
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hospitals by name, locality, address or PIN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5EDF5] text-xs bg-[#F5F8FC] focus:bg-white focus:outline-none input-interactive"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E5EDF5] text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Hospitals ({hospitals.length})
          </button>
          <button
            onClick={() => setSelectedFilter('heatstroke')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              selectedFilter === 'heatstroke'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E5EDF5] text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Heatstroke Ward</span>
          </button>
          <button
            onClick={() => setSelectedFilter('open24_7')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              selectedFilter === 'open24_7'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E5EDF5] text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>24x7 Emergency Active</span>
          </button>
          <button
            onClick={() => setSelectedFilter('icu')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              selectedFilter === 'icu'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E5EDF5] text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>ICU Critical Care</span>
          </button>
        </div>
      </div>

      {/* Hospital Cards Grid (Section 27) */}
      {filteredHospitals.length === 0 ? (
        <div className="p-8 rounded-3xl border border-slate-100 bg-white text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No registered facilities within 10 km</h4>
          <p className="text-xs text-slate-500">
            No hospitals match your search in this area. Call emergency dispatch immediately.
          </p>
          <div className="pt-1 text-sm font-bold text-red-600 flex items-center justify-center gap-1.5">
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Heat emergency helpline: 108 / 112</span>
          </div>
          <div className="pt-2">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Heat Ambulance (108)</span>
            </a>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHospitals.map(h => (
          <div
            key={h.id}
            className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {h.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{h.address}</span>
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-[#1E60F2] bg-blue-50 border border-blue-100 shrink-0 font-sans">
                  {formatDist(h.distKm)}
                </span>
              </div>

              {/* Verified Availability Badges (Section 27) */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {h.emergency_department_open ? (
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ 24x7 Emergency Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                    Daytime Only
                  </span>
                )}

                {h.has_heatstroke_ward && (
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    Heatstroke Ward
                  </span>
                )}

                {h.has_burn_icu && (
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    ICU Ready
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Directions & Call (Section 27) */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <a
                href={`tel:${h.emergency_phone || h.general_phone}`}
                className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors btn-press"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Hospital</span>
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors btn-press"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default HospitalDirectoryPage;
