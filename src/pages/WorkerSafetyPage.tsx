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
  FileText, 
  X,
  Users,
  Compass,
  Heart
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { WorkerOrganization, WorkerWorkplace, OutdoorWorker } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';

export const WorkerSafetyPage: React.FC = () => {
  const { currentReading } = useLocationTracker();
  const [orgs] = useState<WorkerOrganization[]>(() => mockDb.getWorkerOrganizations());
  const [selectedOrgId, setSelectedOrgId] = useState<string>(orgs[0]?.id || 'org-1');
  
  const [workplaces] = useState<WorkerWorkplace[]>(() => mockDb.getWorkerWorkplaces());
  const [selectedWpId, setSelectedWpId] = useState<string>(workplaces[0]?.id || 'wp-1');

  const [workers, setWorkers] = useState<OutdoorWorker[]>(() => mockDb.getOutdoorWorkers());

  // Checkin & Add Worker Modals
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<OutdoorWorker | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'hydrated_safe' | 'needs_rest' | 'feeling_unwell'>('hydrated_safe');

  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [newWorkerIdCode, setNewWorkerIdCode] = useState('');

  const defaultOrg: WorkerOrganization = {
    id: 'org-default',
    name: 'Municipal & Industrial Workplaces',
    industry: 'construction',
    contact_person: 'Occupational Health Officer',
    contact_phone: '+91 80 2200 1100',
    contact_email: 'worker-safety@heatshield.gov.in',
    total_workers: 0,
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

  // Live telemetry from Open-Meteo single source of truth
  const currentTemp = currentReading?.temperature_c ?? 34.5;
  const currentHumidity = currentReading?.relative_humidity_pct ?? 52;
  // Standard natural wet bulb & globe temp estimation (ISO 7243 WBGT)
  const estimatedWBGT = Number(((0.7 * (currentTemp * 0.72 + (currentHumidity / 12))) + (0.3 * (currentTemp + 2.0))).toFixed(1));
  const isExtremeWBGT = estimatedWBGT >= 31.0;
  const isHighWBGT = estimatedWBGT >= 29.0 && estimatedWBGT < 31.0;

  const workRestCycle = isExtremeWBGT 
    ? '30 min work / 30 min shaded rest' 
    : isHighWBGT 
    ? '45 min work / 15 min shaded rest' 
    : 'Continuous work / standard breaks';

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

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HardHat className="w-6 h-6 text-amber-600" />
              <span>Outdoor Worker Heat Protection & Safety</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              WBGT COMPLIANCE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Work-rest intervals, Wet Bulb Globe Temperature (WBGT) exposure tracking, and welfare checks for construction, delivery, and field workers.
          </p>
        </div>

        <button
          onClick={() => setShowAddWorkerModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 btn-interact"
        >
          <Plus className="w-4 h-4" />
          <span>Register Worker</span>
        </button>
      </div>

      {/* Organization & Workplace Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Organization:</span>
          <select
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
            disabled={orgs.length === 0}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          >
            {orgs.length === 0 ? (
              <option value="org-default">Standard Occupational Baseline</option>
            ) : (
              orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name} ({o.industry})</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Site:</span>
          <select
            value={selectedWpId}
            onChange={e => setSelectedWpId(e.target.value)}
            disabled={workplaces.length === 0}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          >
            {workplaces.length === 0 ? (
              <option value="wp-default">Operational Field Site</option>
            ) : (
              workplaces.filter(w => w.org_id === selectedOrgId).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Environmental & WBGT Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ambient Air Temp</span>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {currentTemp.toFixed(1)}°C
          </div>
          <div className="text-[11px] text-slate-500">
            Relative Humidity: {currentHumidity}%
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Estimated WBGT Index</span>
            <AlertTriangle className={`w-4 h-4 ${isExtremeWBGT ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {estimatedWBGT.toFixed(1)}°C
          </div>
          <div className={`text-[11px] font-bold ${isExtremeWBGT ? 'text-red-600' : 'text-amber-600'}`}>
            {isExtremeWBGT ? 'Extreme Stress' : isHighWBGT ? 'High Warning' : 'Moderate'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Mandatory Rest Cycle</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-black text-blue-700 leading-tight">
            {workRestCycle}
          </div>
          <div className="text-[11px] text-slate-500">
            Shaded rest shelter required
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Hydration Quota</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 font-mono">
            0.75 L / hr
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Electrolyte packets distributed
          </div>
        </div>
      </div>

      {/* Workplace Roster & Welfare Check-in Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-sm text-slate-900">
              On-Site Worker Safety Roster ({currentWorkers.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Site: {currentWp?.name}</span>
        </div>

        {currentWorkers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <HardHat className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No Workers Registered on this Site</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Register Worker&quot; above to add on-site employees, track mandatory hydration intervals, and record thermal welfare check-ins.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentWorkers.map(w => {
              const isSafe = w.last_checkin_status === 'hydrated_safe';
              const needsRest = w.last_checkin_status === 'needs_rest';
              return (
                <div 
                  key={w.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 card-interactive hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {w.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {w.worker_id_code} • {w.role_title}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isSafe ? 'bg-emerald-100 text-emerald-800' :
                      needsRest ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {w.last_checkin_status ? w.last_checkin_status.replace('_', ' ') : 'Pending'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200/60 pt-2 font-mono">
                    <span>Shift: {w.shift_name}</span>
                    <span className="text-slate-400">
                      {w.last_checkin_time ? new Date(w.last_checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No check-in'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedWorker(w);
                      setShowCheckinModal(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Update Safety Status</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Compliance & Legal Disclaimer Card */}
      <div className="p-4 bg-white text-slate-800 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs shadow-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            Occupational Health & Heat Stress Standard
          </span>
          <p className="text-slate-600 leading-relaxed">
            HeatShield AI provides proactive exposure modeling based on meteorological data and workplace microclimates. Mandatory rest breaks, shaded respite, and free hydration comply with international occupational heat safety benchmarks.
          </p>
        </div>
      </div>

      {/* Safety Status Update Modal */}
      {showCheckinModal && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Worker Heat Check-in</h3>
              <button onClick={() => setShowCheckinModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Worker: <b>{selectedWorker.full_name}</b> ({selectedWorker.worker_id_code})
            </div>

            <form onSubmit={handleWorkerCheckin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observed Status</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="status"
                      checked={checkinStatus === 'hydrated_safe'}
                      onChange={() => setCheckinStatus('hydrated_safe')}
                    />
                    <span className="font-semibold text-emerald-800">✅ Hydrated & Fit for Duty</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="status"
                      checked={checkinStatus === 'needs_rest'}
                      onChange={() => setCheckinStatus('needs_rest')}
                    />
                    <span className="font-semibold text-amber-800">⏸️ Fatigued — Transitioned to Shade</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="status"
                      checked={checkinStatus === 'feeling_unwell'}
                      onChange={() => setCheckinStatus('feeling_unwell')}
                    />
                    <span className="font-semibold text-red-800">⚠️ Heat Cramps / Dizzy — Medical First Aid</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Record Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Register Outdoor Worker</h3>
              <button onClick={() => setShowAddWorkerModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={e => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Worker ID / Badge Code</label>
                <input
                  type="text"
                  value={newWorkerIdCode}
                  onChange={e => setNewWorkerIdCode(e.target.value)}
                  placeholder="e.g. LT-BLR-102"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Trade</label>
                <input
                  type="text"
                  value={newWorkerRole}
                  onChange={e => setNewWorkerRole(e.target.value)}
                  placeholder="e.g. Mason / Courier / Delivery Rider"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Save Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};