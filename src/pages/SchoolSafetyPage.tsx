import React, { useState } from 'react';
import { 
  GraduationCap, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Bell, 
  Building2, 
  Sun, 
  CheckCircle2, 
  Plus, 
  X,
  PhoneCall,
  ChevronDown
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { SchoolRegistration, SchoolActivityGuidance } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';

export const SchoolSafetyPage: React.FC = () => {
  const { currentReading, currentLocation } = useLocationTracker();
  const [schools, setSchools] = useState<SchoolRegistration[]>(() => mockDb.getSchools());
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || 'sch-1');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolStudents, setNewSchoolStudents] = useState(500);

  const defaultSchool: SchoolRegistration = {
    id: 'sch-default',
    name: 'Municipal Campus Safety Protocol',
    address: 'Metropolitan School District',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0854,
    longitude: 77.6250,
    contact_email: 'school-safety@heatshield.gov.in',
    contact_phone: '+91 80 2200 0000',
    principal_name: 'District Directorate',
    student_count: 650,
    operating_hours: '08:00 AM - 02:30 PM',
    outdoor_activity_curfew_temp: 36.0,
    has_shaded_playgrounds: true,
    water_fountains_count: 12,
    ac_halls_count: 3,
    verification_status: 'verified',
    created_at: new Date().toISOString()
  };

  const currentSchool = schools.find(s => s.id === selectedSchoolId) || schools[0] || defaultSchool;

  const campusTemp = currentReading?.temperature_c ?? 33.5;
  const isCurfewActive = campusTemp >= currentSchool.outdoor_activity_curfew_temp;

  const activityGuidance: SchoolActivityGuidance = isCurfewActive
    ? {
        outdoor_status: 'suspended_indoor_only',
        status_headline: 'Outdoor Activities Suspended',
        status_explanation: `Current temperature (${campusTemp}°C) exceeds the school safety threshold (${currentSchool.outdoor_activity_curfew_temp}°C). Outdoor physical sports and assemblies must be held indoors.`,
        hydration_interval_minutes: 20,
        recess_recommendation: 'Move students into shaded hallways, fans, or air-conditioned rooms.',
        sports_recommendation: 'Postpone sports until late afternoon or conduct in indoor gymnasium.'
      }
    : {
        outdoor_status: 'permitted',
        status_headline: 'Outdoor Recess Permitted',
        status_explanation: `Current temperature (${campusTemp}°C) is within safe campus limits. Ensure students drink water before stepping outside.`,
        hydration_interval_minutes: 35,
        recess_recommendation: 'Standard outdoor recess permitted with shade access.',
        sports_recommendation: 'Permitted with regular 5-minute hydration breaks.'
      };

  const handleRegisterSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: SchoolRegistration = {
      id: `sch-${Date.now()}`,
      name: newSchoolName,
      address: newSchoolAddress,
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 13.0200 + (Math.random() - 0.5) * 0.05,
      longitude: 77.5900 + (Math.random() - 0.5) * 0.05,
      contact_email: 'admin@school.edu.in',
      contact_phone: '+91 80 2345 6789',
      principal_name: 'Authorized Principal',
      student_count: newSchoolStudents,
      operating_hours: '08:00 AM - 02:45 PM',
      outdoor_activity_curfew_temp: 35.0,
      has_shaded_playgrounds: true,
      water_fountains_count: 10,
      ac_halls_count: 2,
      verification_status: 'verified',
      created_at: new Date().toISOString()
    };
    mockDb.saveSchool(newSch);
    setSchools(mockDb.getSchools());
    setShowRegisterModal(false);
    setNewSchoolName('');
    setNewSchoolAddress('');
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#1E60F2]" />
            <span>School Heat Safety Protocol</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated outdoor activity curfews, mandatory hydration intervals, and student heat protection
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Register Campus</span>
        </button>
      </div>

      {/* Campus Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Campus:</span>
          <div className="relative">
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="appearance-none text-xs font-semibold px-3 pr-8 py-1.5 border border-[#E5EDF5] bg-[#F5F8FC] rounded-xl focus:outline-none cursor-pointer text-slate-900"
            >
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_count} students)</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="text-xs text-slate-400 truncate">
          {currentSchool.address}
        </span>
      </div>

      {/* Primary Directive: School Heat Status (Section 25) */}
      <div className={`p-6 rounded-[20px] border transition-all ${
        isCurfewActive 
          ? 'bg-red-50/70 border-red-200 text-red-950' 
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
              isCurfewActive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isCurfewActive ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                School Heat Status
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                {activityGuidance.status_headline}
              </h2>
              <p className="text-xs leading-relaxed max-w-xl opacity-90">
                {activityGuidance.status_explanation}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-white/80 p-3 rounded-xl border border-current/20">
            <span className="text-[11px] block opacity-75 font-medium">Campus Temperature</span>
            <span className="text-3xl font-extrabold font-sans">{campusTemp}°C</span>
            <span className="text-[11px] block text-slate-500">Threshold: {currentSchool.outdoor_activity_curfew_temp}°C</span>
          </div>
        </div>
      </div>

      {/* Grid: Current Conditions & Guidance (Section 25) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Outdoor Activity Recommendation */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Outdoor Activity</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
              <strong className="text-slate-900 block">Recess Guidance:</strong>
              <p>{activityGuidance.recess_recommendation}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
              <strong className="text-slate-900 block">Sports & Assemblies:</strong>
              <p>{activityGuidance.sports_recommendation}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Hydration Guidance */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#1E60F2]" />
            <h3 className="text-sm font-bold text-slate-900">Hydration Guidance</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-center space-y-1">
              <span className="text-xs text-[#1E60F2] font-semibold block">Mandatory Water Bell Interval</span>
              <span className="text-3xl font-extrabold text-[#1E60F2] font-sans">
                Every {activityGuidance.hydration_interval_minutes} min
              </span>
            </div>
            <p className="leading-relaxed">
              Ring campus bells periodically to remind classroom teachers to halt lessons for 60 seconds and ensure all students drink water.
            </p>
          </div>
        </div>

        {/* Card 3: Heat Warnings & Emergency Information */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Emergency Protocol</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
              <strong className="block font-bold">Heat Exhaustion Hotlines</strong>
              <p className="text-[11px]">Dial 108 for immediate campus ambulance response.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1">
              <span className="text-slate-500 block">Campus First-Aid Lead:</span>
              <span className="font-bold text-slate-900">School Medical Room ({currentSchool.contact_phone})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Register School Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Campus Safety</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSchool} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">School / Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g., Delhi Public School, Hebbal"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Campus Address</label>
                <input
                  type="text"
                  placeholder="e.g., Bellary Road, Bengaluru"
                  value={newSchoolAddress}
                  onChange={(e) => setNewSchoolAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Enrolled Students</label>
                <input
                  type="number"
                  value={newSchoolStudents}
                  onChange={(e) => setNewSchoolStudents(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSafetyPage;
