import React, { useState } from 'react';
import { 
  HardHat, 
  Building, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  X,
  Users,
  Compass,
  Heart,
  ChevronDown,
  ShieldAlert,
  PhoneCall
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { WorkerOrganization, WorkerWorkplace, OutdoorWorker } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';
import { formatTimeAgo } from '../lib/utils';

export const WorkerSafetyPage: React.FC = () => {
  const { currentReading, forecastHourly } = useLocationTracker();
  const [orgs] = useState<WorkerOrganization[]>(() => mockDb.getWorkerOrganizations());
  const [selectedOrgId, setSelectedOrgId] = useState<string>(orgs[0]?.id || 'org-1');
  
  const [workplaces] = useState<WorkerWorkplace[]>(() => mockDb.getWorkerWorkplaces());
  const [selectedWpId, setSelectedWpId] = useState<string>(workplaces[0]?.id || 'wp-1');

  const [workers, setWorkers] = useState<OutdoorWorker[]>(() => mockDb.getOutdoorWorkers());

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<OutdoorWorker | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'hydrated_safe' | 'needs_rest' | 'feeling_unwell'>('hydrated_safe');

  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [newWorkerIdCode, setNewWorkerIdCode] = useState('');

  const [showReportUnsafeModal, setShowReportUnsafeModal] = useState(false);
  const [unsafeReportNotes, setUnsafeReportNotes] = useState('');
  const [unsafeReportSuccess, setUnsafeReportSuccess] = useState(false);

  const defaultOrg: WorkerOrganization = {
    id: 'org-default',
    name: 'Municipal & Industrial Workplaces',
    industry: 'construction',
    contact_person: 'Health & Safety Officer',
    contact_phone: '+91 80 2200 1100',
    contact_email: 'worker-safety@heatshield.gov.in',
    total_workers: 45,
    created_at: new Date().toISOString()
  };

  const defaultWp: WorkerWorkplace = {
    id: 'wp-default',
    org_id: 'org-default',
    org_name: 'Municipal & Industrial Workplaces',
    name: 'Outdoor Field Operational Zone',
    address: 'City Worksite Cluster',
    locality_name: 'Bengaluru Core',
    latitude: 13.0854,
    longitude: 77.6250,
    shift_start: '07:00',
    shift_end: '16:00',
    wbgt_threshold: 30.0,
    rest_interval_minutes: 15,
    drinking_water_nearby: true,
    shaded_shelter_available: true,
    created_at: new Date().toISOString()
  };

  const currentOrg = orgs.find(o => o.id === selectedOrgId) || orgs[0] || defaultOrg;
  const currentWp = workplaces.find(w => w.id === selectedWpId) || workplaces[0] || defaultWp;
  const currentWorkers = workers.filter(w => w.workplace_id === selectedWpId);

  const currentTemp = currentReading?.temperature_c ?? 34.5;
  const currentHumidity = currentReading?.relative_humidity_pct ?? 52;
  const estimatedWBGT = Number(((0.7 * (currentTemp * 0.72 + (currentHumidity / 12))) + (0.3 * (currentTemp + 2.0))).toFixed(1));
  const isExtremeWBGT = estimatedWBGT >= 31.0;
  const isHighWBGT = estimatedWBGT >= 29.0 && estimatedWBGT < 31.0;

  const workRestCycle = isExtremeWBGT 
    ? '30 min work / 30 min shaded rest' 
    : isHighWBGT 
    ? '45 min work / 15 min shaded rest' 
    : 'Continuous work / standard 15m hourly break';

  const peakHeatTime = '12:30 PM - 3:30 PM';

  const handleWorkerCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    mockDb.checkinWorker(selectedWorker.id, checkinStatus);
    setWorkers(mockDb.getOutdoorWorkers());
    setShowCheckinModal(false);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newW: OutdoorWorker = {
      id: `wrk-${Date.now()}`,
      org_id: selectedOrgId,
      workplace_id: selectedWpId,
      worker_id_code: newWorkerIdCode || `EMP-${Math.floor(Math.random() * 900 + 100)}`,
      full_name: newWorkerName,
      role_title: newWorkerRole || 'Field Operator',
      shift_name: 'full_day',
      preferred_language: 'en',
      consent_agreed: true,
      is_on_duty: true,
      last_checkin_status: 'hydrated_safe',
      last_checkin_time: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    mockDb.saveOutdoorWorker(newW);
    setWorkers(mockDb.getOutdoorWorkers());
    setShowAddWorkerModal(false);
    setNewWorkerName('');
    setNewWorkerRole('');
    setNewWorkerIdCode('');
  };

  const handleReportUnsafe = (e: React.FormEvent) => {
    e.preventDefault();
    setUnsafeReportSuccess(true);
    setTimeout(() => {
      setShowReportUnsafeModal(false);
      setUnsafeReportSuccess(false);
      setUnsafeReportNotes('');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="w-6 h-6 text-[#1E60F2]" />
            <span>Outdoor Worker Safety Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Work-rest intervals, Wet Bulb Globe Temperature (WBGT) tracking, and worker hydration checks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowReportUnsafeModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors btn-press"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report Unsafe Conditions</span>
          </button>
          <button
            onClick={() => setShowAddWorkerModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Register Worker</span>
          </button>
        </div>
      </div>

      {/* Selector: Org & Worksite */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-2.5">
          <Building className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Organization:</span>
          <select
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 border border-[#E5EDF5] bg-[#F5F8FC] rounded-xl focus:outline-none cursor-pointer text-slate-900"
          >
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name} ({o.industry})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Site:</span>
          <select
            value={selectedWpId}
            onChange={e => setSelectedWpId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 border border-[#E5EDF5] bg-[#F5F8FC] rounded-xl focus:outline-none cursor-pointer text-slate-900"
          >
            {workplaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Cards: Current worker heat risk, Recommended work/rest cycle, Peak heat, Hydration guidance (Section 26) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Worker Heat Risk */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Worker Heat Index</span>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-sans">
            {estimatedWBGT}°C
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isExtremeWBGT ? 'bg-red-50 text-red-700 border border-red-200' :
            isHighWBGT ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isExtremeWBGT ? 'Extreme Stress' : isHighWBGT ? 'Elevated Stress' : 'Safe Operating'}
          </span>
        </div>

        {/* 2. Recommended Work/Rest Cycle */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Work / Rest Cycle</span>
            <Clock className="w-4 h-4 text-[#1E60F2]" />
          </div>
          <div className="text-base font-bold text-slate-900 leading-snug">
            {workRestCycle}
          </div>
          <div className="text-[11px] text-slate-400">
            Mandatory shaded cooldown period
          </div>
        </div>

        {/* 3. Peak Heat Window */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Peak Solar Exposure</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {peakHeatTime}
          </div>
          <div className="text-[11px] text-slate-400">
            Halt heavy unshaded roof/asphalt work
          </div>
        </div>

        {/* 4. Hydration Guidance */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Hydration Directive</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            1 Cup / 20 min
          </div>
          <div className="text-[11px] text-slate-400">
            Provide potable cool water and electrolytes
          </div>
        </div>
      </div>

      {/* Workers Roster & Check-in (Section 26) */}
      <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E60F2]" />
            <h3 className="text-sm font-bold text-slate-900">On-Duty Field Workers ({currentWorkers.length})</h3>
          </div>
          <span className="text-xs text-slate-400">Live roster</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentWorkers.map(w => {
            const isSafe = w.last_checkin_status === 'hydrated_safe';
            const isRest = w.last_checkin_status === 'needs_rest';
            return (
              <div
                key={w.id}
                className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{w.full_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSafe ? 'bg-emerald-50 text-emerald-700' :
                      isRest ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {isSafe ? 'Hydrated & Safe' : isRest ? 'Needs Rest' : 'Unwell'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {w.role_title} • ID: {w.worker_id_code}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Checked in {formatTimeAgo(w.last_checkin_time)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedWorker(w);
                      setShowCheckinModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EDF5] text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Check-in
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkin Modal */}
      {showCheckinModal && selectedWorker && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-sm w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Worker Check-in</h3>
              <button onClick={() => setShowCheckinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWorkerCheckin} className="space-y-3.5 text-xs">
              <p className="font-semibold text-slate-800">
                Record safety condition for {selectedWorker.full_name}:
              </p>

              <div className="space-y-2">
                <label className="p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="checkin_status"
                    checked={checkinStatus === 'hydrated_safe'}
                    onChange={() => setCheckinStatus('hydrated_safe')}
                    className="text-[#1E60F2]"
                  />
                  <span>Hydrated & Safe (Continuing work)</span>
                </label>
                <label className="p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="checkin_status"
                    checked={checkinStatus === 'needs_rest'}
                    onChange={() => setCheckinStatus('needs_rest')}
                    className="text-amber-600"
                  />
                  <span>Needs Rest / Shaded Pause</span>
                </label>
                <label className="p-3 rounded-xl border border-red-200 bg-red-50 flex items-center gap-2.5 cursor-pointer text-red-800">
                  <input
                    type="radio"
                    name="checkin_status"
                    checked={checkinStatus === 'feeling_unwell'}
                    onChange={() => setCheckinStatus('feeling_unwell')}
                    className="text-red-600"
                  />
                  <span>Feeling Unwell / Symptoms of Heat Distress</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Record Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Unsafe Conditions Modal (Section 26) */}
      {showReportUnsafeModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Report Unsafe Thermal Conditions</h3>
              <button onClick={() => setShowReportUnsafeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {unsafeReportSuccess ? (
              <div className="p-6 text-center space-y-2 text-emerald-700">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                <h4 className="font-bold text-sm">Report Submitted to Site Safety Lead</h4>
                <p className="text-xs text-slate-500">Thank you for protecting field worker safety.</p>
              </div>
            ) : (
              <form onSubmit={handleReportUnsafe} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Report issues such as lack of drinking water, absent shaded breaks, or forced outdoor work during peak heat curfews.
                </p>

                <textarea
                  value={unsafeReportNotes}
                  onChange={(e) => setUnsafeReportNotes(e.target.value)}
                  placeholder="Describe the worksite condition..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportUnsafeModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Field Worker</h3>
              <button onClick={() => setShowAddWorkerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Ramesh Kumar"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g., Delivery Executive, Construction Operator"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Worker ID Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., EMP-104"
                  value={newWorkerIdCode}
                  onChange={(e) => setNewWorkerIdCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSafetyPage;
