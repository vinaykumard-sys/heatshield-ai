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

export const HospitalDirectoryPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalResource[]>(() => mockDb.getHospitals());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'heatstroke' | 'pediatric' | 'icu' | 'open24_7'>('all');
  const [selectedHospital, setSelectedHospital] = useState<HospitalResource | null>(hospitals[0] || null);

  // Filtered & searched hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
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
  }, [hospitals, searchQuery, selectedFilter]);

  const totalHeatstrokeBeds = useMemo(() => {
    return hospitals.reduce((acc, h) => acc + (h.has_heatstroke_ward ? 8 : 0), 0);
  }, [hospitals]);

  return (
    <div className="space-y-6 pb-12">
      {/* Location Bar */}
      <LocationTrackerBar />

      {/* Emergency Alert Banner */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 font-mono">Immediate Life Emergency</span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Heatstroke is a Critical Medical Emergency (Dial 108 / 112)</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              HeatShield AI does not replace national emergency medical dispatch. If a person displays confusion, delirium, hot dry skin, or loss of consciousness, call an ambulance immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href="tel:108"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all btn-interact hover:scale-[1.03] active:scale-[0.97]"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            Call 108 (Ambulance)
          </a>
          <a
            href="tel:112"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all btn-interact hover:scale-[1.03] active:scale-[0.97]"
          >
            <PhoneCall className="w-4 h-4" />
            Call 112
          </a>
        </div>
      </div>

      {/* Header & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-600 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Healthcare Emergency Logistics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Hospital Resource Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified real-time heatstroke treatment capacity, emergency bed telemetry, and direct medical lines.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-subtle">
            <span className="text-[11px] font-mono text-slate-500 block uppercase">Verified Hospitals</span>
            <span className="text-xl font-extrabold text-slate-900">{hospitals.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <span className="text-[11px] font-mono text-emerald-700 block uppercase">Heatstroke Beds</span>
            <span className="text-xl font-extrabold text-emerald-800">{totalHeatstrokeBeds}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <span className="text-[11px] font-mono text-blue-700 block uppercase">24/7 Heat Trauma</span>
            <span className="text-xl font-extrabold text-blue-800">100% Verified</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, locality, address or PIN code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:bg-white focus:outline-none input-interactive transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap btn-press transition-all ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Hospitals ({hospitals.length})
          </button>
          <button
            onClick={() => setSelectedFilter('heatstroke')}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap btn-press transition-all flex items-center gap-1.5 ${
              selectedFilter === 'heatstroke'
                ? 'bg-orange-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Heatstroke Ward Active
          </button>
          <button
            onClick={() => setSelectedFilter('pediatric')}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap btn-press transition-all ${
              selectedFilter === 'pediatric'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pediatric Cooling Capability
          </button>
          <button
            onClick={() => setSelectedFilter('icu')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'icu'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Available ICU Beds
          </button>
          <button
            onClick={() => setSelectedFilter('open24_7')}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedFilter === 'open24_7'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            24/7 Emergency
          </button>
        </div>
      </div>

      {/* Main Grid: Hospital List & Selected Hospital Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hospital Directory List */}
        <div className="lg:col-span-7 space-y-3">
          {filteredHospitals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hospitals matched your filter criteria.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                className="mt-3 text-xs text-blue-600 font-medium hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredHospitals.map(hospital => {
              const isSelected = selectedHospital?.id === hospital.id;
              const loadBadgeColor = hospital.emergency_department_open
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border-amber-200';

              return (
                <div
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-900">{hospital.name}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${loadBadgeColor}`}>
                          {hospital.operating_hours.toUpperCase()}
                        </span>
                        {hospital.has_heatstroke_ward && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" />
                            HEAT WARD ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{hospital.address}, {hospital.city}</span>
                        {hospital.distance_km && (
                          <span className="font-mono text-blue-600 font-semibold">• {hospital.distance_km} km away</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                  </div>

                  {/* Bed Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="text-[10px] text-slate-500 block">Emergency ER</span>
                      <span className="font-bold text-slate-800 font-mono">{hospital.emergency_department_open ? '24/7 Open' : 'Day Only'}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="text-[10px] text-slate-500 block">Burn / ICU</span>
                      <span className="font-bold text-slate-800 font-mono">{hospital.has_burn_icu ? 'Available' : 'Transfer'}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <span className="text-[10px] text-slate-500 block">Heatstroke Care</span>
                      <span className="font-bold text-emerald-700 font-mono">{hospital.has_heatstroke_ward ? 'Active' : 'General'}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                    <a
                      href={`tel:${hospital.emergency_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{hospital.emergency_phone}</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Hospital Detailed Intelligence Panel & Emergency Protocol */}
        <div className="lg:col-span-5 space-y-6">
          {selectedHospital ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">Facility Profile</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  ID: {selectedHospital.id}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state}</p>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Operating Hours</span>
                  <span className="font-bold text-slate-800">{selectedHospital.operating_hours}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Pediatric Emergency</span>
                  <span className="font-bold text-slate-800">{selectedHospital.has_pediatric_emergency ? 'Available' : 'Adult Only'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Burn / ICU Unit</span>
                  <span className="font-bold text-slate-800">{selectedHospital.has_burn_icu ? 'Yes (Specialized)' : 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Heatstroke Protocol</span>
                  <span className="font-bold text-orange-700">{selectedHospital.has_heatstroke_ward ? 'Level 1 Active' : 'General Care'}</span>
                </div>
              </div>

              {/* Direct Emergency Call */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-blue-700 font-bold block">Hospital Direct Desk</span>
                  <span className="text-sm font-bold text-slate-900">{selectedHospital.emergency_phone}</span>
                </div>
                <a
                  href={`tel:${selectedHospital.emergency_phone}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Now
                </a>
              </div>

              {/* Google Maps link */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
                Navigate in Google Maps ({selectedHospital.distance_km || '2.4'} km)
              </a>
            </div>
          ) : null}

          {/* First-Aid Pre-Hospital Protocol Guide Card */}
          <div className="bg-gradient-to-br from-slate-900 to-navy-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Pre-Hospital Heat Emergency Protocol</h4>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                <div>
                  <strong className="text-white">Rapid Cooling is Critical:</strong> Move person out of sunlight immediately into shade or AC. Loosen tight clothing.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                <div>
                  <strong className="text-white">Active Evaporative Cooling:</strong> Douse clothes with cool (not ice cold) water and aggressively fan. Apply ice packs to armpits, groin, and back of neck.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                <div>
                  <strong className="text-white">Never Force Fluids:</strong> Do NOT administer oral water if patient is confused, vomiting, or semi-conscious to prevent aspiration.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">4</span>
                <div>
                  <strong className="text-white">Tell 108 Dispatcher:</strong> Report "Suspected heatstroke with altered mental state" for highest ambulance triage priority.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDirectoryPage;
