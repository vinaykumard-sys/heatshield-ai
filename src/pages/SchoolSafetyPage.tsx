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
  Lock,
  ChevronRight
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { SchoolRegistration, SchoolActivityGuidance } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';

export const SchoolSafetyPage: React.FC = () => {
  const { currentReading } = useLocationTracker();
  const [schools, setSchools] = useState<SchoolRegistration[]>(() => mockDb.getSchools());
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || 'sch-1');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolStudents, setNewSchoolStudents] = useState(500);

  const defaultSchool: SchoolRegistration = {
    id: 'sch-default',
    name: 'Standard Municipal Campus Protocol',
    address: 'Metropolitan School District',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0854,
    longitude: 77.6250,
    contact_email: 'school-safety@heatshield.gov.in',
    contact_phone: '+91 80 2200 0000',
    principal_name: 'District Education Directorate',
    student_count: 0,
    operating_hours: '08:00 AM - 02:30 PM',
    outdoor_activity_curfew_temp: 36.0,
    has_shaded_playgrounds: true,
    water_fountains_count: 0,
    ac_halls_count: 0,
    verification_status: 'verified',
    created_at: new Date().toISOString()
  };

  const currentSchool = schools.find(s => s.id === selectedSchoolId) || schools[0] || defaultSchool;

  // Dynamic temperature from live Open-Meteo telemetry
  const campusTemp = currentReading?.temperature_c ?? 33.5;
  const isCurfewActive = campusTemp >= currentSchool.outdoor_activity_curfew_temp;

  const activityGuidance: SchoolActivityGuidance = isCurfewActive
    ? {
        outdoor_status: 'suspended_indoor_only',
        status_headline: 'Outdoor Activities & Recess Suspended',
        status_explanation: `Ambient temperature (${campusTemp}°C) exceeds the school safety threshold (${currentSchool.outdoor_activity_curfew_temp}°C). Direct sun sports, assembly, and unshaded physical education are prohibited.`,
        hydration_interval_minutes: 20,
        recess_recommendation: 'Move children into shaded corridors and air-conditioned halls.',
        sports_recommendation: 'Postpone matches to after 4:30 PM or conduct inside gymnasium.'
      }
    : {
        outdoor_status: 'permitted',
        status_headline: 'Normal Outdoor Recess Permitted',
        status_explanation: `Current temperature (${campusTemp}°C) is within safe operational limits. Shaded play recommended during afternoon hours.`,
        hydration_interval_minutes: 40,
        recess_recommendation: 'Standard outdoor break with mandatory water fountain access.',
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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-600" />
              <span>School Heat Safety & Recess Guidance</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              CAMPUS SHIELD
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated outdoor activity curfews, mandatory hydration interval timers, and school facility heat audits.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm btn-interact shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register School Campus</span>
        </button>
      </div>

      {/* School Switcher */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Selected Institution:</span>
          <select
            value={selectedSchoolId}
            onChange={e => setSelectedSchoolId(e.target.value)}
            disabled={schools.length === 0}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none input-interactive font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          >
            {schools.length === 0 ? (
              <option value="sch-default">No schools registered yet (Showing standard guidelines)</option>
            ) : (
              schools.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_count} students)</option>
              ))
            )}
          </select>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
          {currentSchool?.address}
        </span>
      </div>

      {/* Primary Activity Directive Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isCurfewActive 
          ? 'bg-red-50/80 border-red-300 text-red-900' 
          : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${isCurfewActive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {isCurfewActive ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold block opacity-75">
                Current Activity Directive
              </span>
              <h2 className="text-lg font-black tracking-tight">
                {activityGuidance.status_headline}
              </h2>
              <p className="text-xs max-w-2xl leading-relaxed opacity-90">
                {activityGuidance.status_explanation}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-current/20 text-right">
            <span className="text-2xl font-black font-mono">{campusTemp}°C</span>
            <span className="text-[10px] font-mono opacity-80">Threshold: {currentSchool.outdoor_activity_curfew_temp}°C</span>
          </div>
        </div>
      </div>

      {/* School Protocols & Facility Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Recess Guidance Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 card-interactive">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Recess & Play Protocol</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activityGuidance.recess_recommendation}
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-700 font-mono border border-slate-100">
            Sports: <b>{activityGuidance.sports_recommendation}</b>
          </div>
        </div>

        {/* Compulsory Hydration Bell */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 card-interactive">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Bell className="w-4 h-4 text-blue-500" />
            <span>Compulsory Hydration Schedule</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated school bell reminder recommended every <b>{activityGuidance.hydration_interval_minutes} minutes</b> for classrooms.
          </p>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[11px] text-blue-800 font-mono border border-blue-100">
            Target: <b>250ml water intake per bell</b>
          </div>
        </div>

        {/* Campus Facilities Audit */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 card-interactive">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-sky-500" />
            <span>Campus Heat Facilities</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700 font-mono pt-1">
            <div className="flex justify-between">
              <span>Water Fountains:</span>
              <b>{currentSchool.water_fountains_count} Active</b>
            </div>
            <div className="flex justify-between">
              <span>AC Respite Halls:</span>
              <b>{currentSchool.ac_halls_count} Rooms</b>
            </div>
            <div className="flex justify-between">
              <span>Shaded Playgrounds:</span>
              <b>{currentSchool.has_shaded_playgrounds ? 'Verified Yes' : 'No'}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Student Privacy Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 leading-relaxed">
          <b>Child Privacy Guarantee:</b> HeatShield School Safety operates strictly at the aggregated campus level. No child location data, student biometric profiles, or personal records are collected or stored.
        </p>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Register Educational Campus</h3>
              <button onClick={() => setShowRegisterModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSchool} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School / College Name</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  placeholder="e.g. National Public School"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Address</label>
                <input
                  type="text"
                  required
                  value={newSchoolAddress}
                  onChange={e => setNewSchoolAddress(e.target.value)}
                  placeholder="e.g. 12th Main, Indiranagar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enrolled Students</label>
                <input
                  type="number"
                  value={newSchoolStudents}
                  onChange={e => setNewSchoolStudents(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Register Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};