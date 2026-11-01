import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Sliders, 
  Activity, 
  Database, 
  Check, 
  Save, 
  Search
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { useAuth } from '../context/AuthContext';
import { RiskThresholdConfig, UserRole } from '../types';
import { isSupabaseConfigured, getDatabaseMode } from '../lib/supabase';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'thresholds' | 'users' | 'locations' | 'logs'>('thresholds');

  const [thresholds, setThresholds] = useState<RiskThresholdConfig>(() => mockDb.getRiskConfig());
  const [users, setUsers] = useState(() => mockDb.getUsers());
  const locations = mockDb.getLocations();
  const logs = mockDb.getActivityLogs();
  const [isSaved, setIsSaved] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  const dbStatus = getDatabaseMode();

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    mockDb.saveRiskConfig(thresholds);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const list = [...users];
    const u = list.find(x => x.id === userId);
    if (u) {
      u.role = newRole;
      setUsers(list);
      mockDb.logActivity({
        actor_name: user?.full_name || 'Admin',
        action: 'UPDATE_USER_ROLE',
        target_type: 'user',
        target_id: userId,
        details: { newRole }
      });
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!searchLog.trim()) return true;
    const q = searchLog.toLowerCase();
    return l.action.toLowerCase().includes(q) ||
      (l.actor_name && l.actor_name.toLowerCase().includes(q)) ||
      (l.target_type && l.target_type.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Administration & Governance</h1>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              RLS GOVERNANCE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure risk thresholds, manage volunteer permissions, adjust monitoring zones, and audit security logs.
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-sm">
          <Database className="w-4 h-4 text-blue-600" />
          <div>
            <span className="font-bold text-slate-900 block">{dbStatus.label}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isSupabaseConfigured ? 'Row Level Security Enforced' : 'Offline In-Memory + Cache'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs sm:text-sm">
        {[
          { id: 'thresholds', label: 'AI Risk Model Weights', icon: Sliders },
          { id: 'users', label: 'User Roles & Volunteers', icon: Users },
          { id: 'locations', label: 'Monitoring Localities', icon: MapPin },
          { id: 'logs', label: 'Security Audit Logs', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Risk Model Weights & Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Configure Explainable AI Scoring Weights
            </h3>
            <p className="text-xs text-slate-500">
              Adjust the algorithmic parameters that translate ambient meteorological sensors and urban heat island factors into a normalized 0-100 risk index.
            </p>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-5 text-xs sm:text-sm">
            {/* Model Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Protocol Standard</label>
              <input
                type="text"
                value={thresholds.name}
                onChange={(e) => setThresholds({ ...thresholds, name: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Weights Sliders */}
            <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs uppercase font-semibold text-slate-600 tracking-wider block">
                Factor Contribution Weights (Sum: 1.0)
              </span>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Ambient Temperature Weight</span>
                  <span className="font-mono font-bold text-orange-600">
                    {(thresholds.temp_weight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={thresholds.temp_weight}
                  onChange={(e) => setThresholds({ ...thresholds, temp_weight: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Humidity & Heat Index Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {(thresholds.humidity_weight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={thresholds.humidity_weight}
                  onChange={(e) => setThresholds({ ...thresholds, humidity_weight: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Urban Exposure & Built Density (UHI) Weight</span>
                  <span className="font-mono font-bold text-amber-600">
                    {(thresholds.vulnerability_weight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={thresholds.vulnerability_weight}
                  onChange={(e) => setThresholds({ ...thresholds, vulnerability_weight: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Diurnal Afternoon Peak Multiplier</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {(thresholds.diurnal_weight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={thresholds.diurnal_weight}
                  onChange={(e) => setThresholds({ ...thresholds, diurnal_weight: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Threshold limits */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="text-[11px] text-slate-500 block mb-1">Low Ceiling</label>
                <div className="font-mono font-bold text-emerald-700 text-base">{thresholds.low_max} / 100</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="text-[11px] text-slate-500 block mb-1">Moderate Ceiling</label>
                <div className="font-mono font-bold text-amber-700 text-base">{thresholds.moderate_max} / 100</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="text-[11px] text-slate-500 block mb-1">Critical Floor</label>
                <div className="font-mono font-bold text-red-700 text-base">{thresholds.critical_min} / 100</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Model parameters updated & logged to audit trail!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Threshold Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Users & Role Management */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Platform Users & Volunteer Rosters</h3>
            <p className="text-xs text-slate-500">
              Authorize community volunteers and promote coordinators. Roles are protected via database Row Level Security policies.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5">Name & Email</th>
                  <th className="p-3.5">Current Role</th>
                  <th className="p-3.5">Assigned Locality</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'volunteer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      Urban Ward {u.locality_id ? u.locality_id.replace('loc-', '#') : 'Central'}
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-700 text-xs font-semibold">● Active</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                        className="bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500 shadow-sm"
                      >
                        <option value="resident">Resident</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monitoring Localities */}
      {activeTab === 'locations' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Urban Monitoring Localities & Heat Island Factors</h3>
              <p className="text-xs text-slate-500">
                Ward boundaries and baseline thermal vulnerability ratings based on local roofing and vegetation data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                  <span className="text-xs text-slate-500 font-mono">{loc.city}, {loc.state}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-md bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Baseline Vuln</span>
                    <span className="font-bold text-slate-900 font-mono">{loc.baseline_vulnerability_score}/100</span>
                  </div>
                  <div className="p-2 rounded-md bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">UHI Factor</span>
                    <span className="font-bold text-orange-600 font-mono">{loc.urban_heat_island_factor}x</span>
                  </div>
                  <div className="p-2 rounded-md bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Cooling Shelters</span>
                    <span className="font-bold text-emerald-700 font-mono">{loc.cooling_centers_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Security & Operational Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable records of check-ins, role changes, alerts, and model threshold adjustments.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.actor_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Target: {log.target_type} {log.target_id ? `(${log.target_id})` : ''} • IP: {log.ip_address || '127.0.0.1'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
