import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Sliders, 
  CheckCircle2, 
  Send, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  X, 
  Plus, 
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { SmartHeatAlert, HeatAlertSubscription, AlertSeverity } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const HeatAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SmartHeatAlert[]>(() => mockDb.getSmartAlerts());
  const [subscriptions, setSubscriptions] = useState<HeatAlertSubscription[]>(() => mockDb.getAlertSubscriptions());
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');
  
  // Subscription form modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedLocality, setSelectedLocality] = useState('Hebbal, Bengaluru');
  const [highThreshold, setHighThreshold] = useState(50);
  const [criticalThreshold, setCriticalThreshold] = useState(75);
  const [channels, setChannels] = useState<string[]>(['in_app', 'push']);
  const [quietHours, setQuietHours] = useState(true);

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: HeatAlertSubscription = {
      id: `sub-${Date.now()}`,
      user_id: 'current-user',
      location_id: `loc-${Date.now()}`,
      location_name: selectedLocality,
      high_threshold: highThreshold,
      critical_threshold: criticalThreshold,
      channels: channels as any,
      quiet_hours_enabled: quietHours,
      quiet_hours_start: '22:00',
      quiet_hours_end: '06:00',
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockDb.saveAlertSubscription(newSub);
    setSubscriptions(mockDb.getAlertSubscriptions());
    setShowSubModal(false);
  };

  const toggleSubscription = (id: string) => {
    const next = subscriptions.map(s => {
      if (s.id === id) return { ...s, is_active: !s.is_active };
      return s;
    });
    const target = next.find(s => s.id === id);
    if (target) mockDb.saveAlertSubscription(target);
    setSubscriptions(next);
  };

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity as string) {
      case 'critical':
        return {
          icon: <Flame className="w-5 h-5 text-red-600" />,
          cardBorder: 'border-red-200',
          cardBg: 'bg-red-50/40',
          badge: 'bg-red-100 text-red-800 border-red-200',
          btn: 'bg-red-600 hover:bg-red-700 text-white',
          label: 'Critical Warning'
        };
      case 'high':
        return {
          icon: <Flame className="w-5 h-5 text-orange-600" />,
          cardBorder: 'border-orange-200',
          cardBg: 'bg-orange-50/40',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          btn: 'bg-orange-600 hover:bg-orange-700 text-white',
          label: 'High Risk'
        };
      case 'advisory':
      case 'moderate':
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          cardBorder: 'border-amber-200',
          cardBg: 'bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
          label: 'Advisory'
        };
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#1E60F2]" />
            <span>Heat Alerts & Early Warnings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active weather warnings, neighborhood advisories, and notification preferences
          </p>
        </div>

        <button
          onClick={() => setShowSubModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>New Alert Subscription</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
        {(['all', 'critical', 'high', 'advisory'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterSeverity === sev
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E5EDF5] text-slate-600 hover:bg-slate-50'
            }`}
          >
            {sev === 'all' ? `All Alerts (${alerts.length})` : sev}
          </button>
        ))}
      </div>

      {/* Active Heat Alerts Grid (Section 22) */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-12 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Active Heat Warnings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are currently not under any heat warnings. Temperatures and humidity levels are in the normal seasonal range.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlerts.map(alert => {
              const style = getSeverityStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`rounded-[20px] border p-6 shadow-xs flex flex-col justify-between gap-4 transition-all ${style.cardBorder} ${style.cardBg}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {style.icon}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{alert.location_name}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {alert.headline}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>

                    {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/60 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Guidance:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {alert.recommended_actions.slice(0, 3).map((g: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-slate-400 font-bold">•</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500">
                      Duration: ~{alert.expected_duration_hours || 4} hours
                    </span>
                    <a
                      href="/cooling-centres"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors btn-press ${style.btn}`}
                    >
                      View guidance
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscriptions Management Section */}
      <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              My Area Alert Subscriptions
            </h3>
            <p className="text-xs text-slate-500">
              Receive automatic notifications when heat risk exceeds your chosen comfort levels
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {subscriptions.length} Configured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {sub.location_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sub.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {sub.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Alert at Score &gt; {sub.high_threshold} • Critical at &gt; {sub.critical_threshold}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-[11px] text-slate-400">
                  Channels: {sub.channels.join(', ')}
                </span>
                <button
                  onClick={() => toggleSubscription(sub.id)}
                  className="text-xs font-semibold text-[#1E60F2] hover:underline"
                >
                  {sub.is_active ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E5EDF5] w-full max-w-lg rounded-[20px] shadow-modal overflow-hidden animate-modal-enter">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Alert Subscription</h3>
                <p className="text-xs text-slate-500">Configure personal heat threshold warnings</p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monitored Locality</label>
                <input
                  type="text"
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">High Risk Threshold ({highThreshold})</label>
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={highThreshold}
                    onChange={(e) => setHighThreshold(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer accent-[#1E60F2]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Critical Threshold ({criticalThreshold})</label>
                  <input
                    type="range"
                    min="70"
                    max="95"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer accent-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] bg-white text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatAlertsPage;
