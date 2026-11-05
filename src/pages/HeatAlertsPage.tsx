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
  Info
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { SmartHeatAlert, HeatAlertSubscription, AlertSeverity } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const HeatAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SmartHeatAlert[]>(() => mockDb.getSmartAlerts());
  const [subscriptions, setSubscriptions] = useState<HeatAlertSubscription[]>(() => mockDb.getAlertSubscriptions());
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');
  
  // Subscription form state
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

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-600" />
              <span>Smart Heat Alerts & Advance Warnings</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              AUTONOMOUS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated location-specific early heatwave warnings, threshold notifications, and personalized delivery channels.
          </p>
        </div>

        <button
          onClick={() => setShowSubModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 btn-interact"
        >
          <Plus className="w-4 h-4" />
          <span>Subscribe to Location</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs card-interactive">
          <div className="text-xs text-slate-500 font-semibold mb-1">Active Public Warnings</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {alerts.filter(a => a.is_active).length}
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {alerts.filter(a => a.severity === 'critical').length} Critical Heat Advisories
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs card-interactive">
          <div className="text-xs text-slate-500 font-semibold mb-1">Subscribed Localities</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {subscriptions.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Auto-dispatched via In-App & Browser Push
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs card-interactive">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total Delivery Reach</div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {alerts.reduce((acc, a) => acc + (a.delivery_stats?.delivered_count || 0), 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Zero duplicate alert deduplication active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Smart Alerts Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Active Heatwave Broadcasts</span>
            </h2>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'critical', 'high', 'advisory'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                    filterSeverity === sev
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                No active heat alerts
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isCrit = alert.severity === 'critical';
                return (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all card-interactive ${
                      isCrit 
                        ? 'bg-red-50/60 border-red-300 shadow-xs' 
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCrit 
                            ? 'bg-red-600 text-white' 
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{alert.location_name}, {alert.city}</span>
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {alert.headline}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {alert.description}
                    </p>

                    {/* Trigger reason & Duration badge */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1 mb-3">
                      <div className="text-slate-700">
                        <b>Trigger:</b> {alert.trigger_reason}
                      </div>
                      <div className="text-slate-500">
                        <b>Expected Duration:</b> Next {alert.expected_duration_hours} hours • Issued by {alert.issued_by}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                        Mandated Precautions
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {alert.recommended_actions.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Delivery stats footer */}
                    {alert.delivery_stats && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Dispatched to {alert.delivery_stats.delivered_count.toLocaleString()} subscribers</span>
                        <span>In-App: {alert.delivery_stats.in_app_count} • Push: {alert.delivery_stats.push_count}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Subscriptions & Notification Preferences */}
        <div className="space-y-5">
          {/* Subscribed Localities Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>My Alert Subscriptions</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{subscriptions.length} Wards</span>
            </div>

            <div className="space-y-2.5">
              {subscriptions.map(sub => (
                <div 
                  key={sub.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {sub.location_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Threshold: Risk &ge; {sub.high_threshold} • {sub.channels.join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSubscription(sub.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                      sub.is_active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sub.is_active ? 'Active' : 'Paused'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours & Policy Card */}
          <div className="bg-white text-slate-800 border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold font-mono uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Quiet Hours Safeguard</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quiet hours are active between <b className="text-slate-900">10:00 PM and 06:00 AM</b>. Standard advisories are queued and delivered at dawn, while life-threatening <b className="text-red-600">Critical</b> alerts will bypass quiet hours for immediate resident safety.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Dialog Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Subscribe to Ward Alerts</h3>
              <button onClick={() => setShowSubModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Locality or Ward Name</label>
                <input
                  type="text"
                  required
                  value={selectedLocality}
                  onChange={e => setSelectedLocality(e.target.value)}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">High Risk Threshold (0–100)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={highThreshold}
                    onChange={e => setHighThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold text-slate-900 w-8">{highThreshold}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'in_app', label: 'In-App Alerts' },
                    { id: 'push', label: 'Browser Push' },
                    { id: 'email', label: 'Email Digest' },
                    { id: 'sms', label: 'SMS Notice' }
                  ].map(ch => (
                    <label key={ch.id} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.includes(ch.id)}
                        onChange={e => {
                          if (e.target.checked) setChannels([...channels, ch.id]);
                          else setChannels(channels.filter(c => c !== ch.id));
                        }}
                      />
                      <span>{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
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