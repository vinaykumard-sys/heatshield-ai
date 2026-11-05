import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Flame, 
  AlertTriangle, 
  UserCheck, 
  HelpCircle, 
  Info, 
  CheckCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  PhoneCall,
  PlusCircle,
  Droplets,
  Building2,
  Send,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { formatTimeAgo } from '../lib/utils';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { EmergencyModal } from '../components/common/EmergencyModal';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [mainTab, setMainTab] = useState<'warnings' | 'notifications' | 'requests'>('warnings');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const smartAlerts = mockDb.getSmartAlerts();
  const requests = mockDb.getRequests();

  // Metrics
  const metrics = useMemo(() => {
    const critical = notifications.filter(n => n.priority === 'critical' || n.type === 'critical_risk').length;
    const warnings = smartAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
    const myRequests = requests.filter(r => r.resident_id === user?.id || r.requested_by === user?.id);

    return { 
      totalAlerts: smartAlerts.length, 
      unreadNotifs: unreadCount, 
      criticalWarnings: warnings,
      pendingRequests: requests.filter(r => r.status === 'open' || r.status === 'assigned').length 
    };
  }, [notifications, smartAlerts, requests, unreadCount, user]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Emergency Modal */}
      <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
      
      {/* New Assistance Request Modal */}
      <NewRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        onSuccess={() => {}} 
      />

      {/* TOP EMERGENCY SOS BANNER */}
      <div className="bg-white border border-rose-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Need Immediate Heat Emergency Assistance?</h3>
            <p className="text-xs text-slate-600">
              National Emergency Hotline: <strong className="text-rose-700">112</strong> &bull; Ambulance Response: <strong className="text-rose-700">108</strong> &bull; NDMA Disaster Helpline: <strong className="text-rose-700">1077</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency SOS Desk</span>
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Request Aid</span>
          </button>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-600" />
              <span>Alerts & Community Assistance</span>
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
              LIVE BROADCASTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time heat advisories, hourly weather alerts, and localized humanitarian assistance dispatch.
          </p>
        </div>

        {mainTab === 'notifications' && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* MAIN NAVIGATION PILLS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setMainTab('warnings')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            mainTab === 'warnings'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Smart Heat Warnings ({smartAlerts.length})</span>
        </button>

        <button
          onClick={() => setMainTab('notifications')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            mainTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-App Notifications {unreadCount > 0 && `(${unreadCount} new)`}</span>
        </button>

        <button
          onClick={() => setMainTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            mainTab === 'requests'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Assistance Requests ({requests.length})</span>
        </button>
      </div>

      {/* TAB 1: SMART HEAT WARNINGS */}
      {mainTab === 'warnings' && (
        <div className="space-y-4">
          {smartAlerts.length > 0 ? (
            <div className="space-y-3">
              {smartAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isHigh = alert.severity === 'high';

                return (
                  <div
                    key={alert.id}
                    className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 transition-all ${
                      isCritical ? 'border-red-300 bg-red-50/20' : isHigh ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                          {alert.severity} SEVERITY
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          📍 {alert.location_name}, {alert.city}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Valid for next {alert.expected_duration_hours || 6} hours
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {alert.headline}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {alert.description}
                    </p>

                    {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
                        <strong className="text-slate-800 font-bold block">NDMA Immediate Protective Actions:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                          {alert.recommended_actions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2 shadow-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800">No active heat alerts</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your monitored area currently has no verified active heat alerts. Temperatures and heat indices are within normal safe ranges.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IN-APP NOTIFICATIONS */}
      {mainTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  !notif.is_read ? 'bg-blue-50/40 border-blue-200 border-l-4 border-l-blue-600' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="shrink-0 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Bell className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800">No Notifications Available</h4>
              <p className="text-xs text-slate-500">Hourly weather updates and welfare alerts will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSISTANCE REQUESTS */}
      {mainTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Community Welfare & Hydration Requests</span>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Request</span>
            </button>
          </div>

          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                        {req.category.replace(/_/g, ' ')}
                      </span>
                      <strong className="text-slate-900 font-bold">{req.locality_name}</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">{req.description}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Submitted {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                    req.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                    req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto text-purple-400 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800">No active assistance requests</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Need urgent drinking water delivery, respite transport to a cooling sanctuary, or a welfare visit? Submit an assistance request.
              </p>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Assistance Request</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
