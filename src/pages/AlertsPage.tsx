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

  const metrics = useMemo(() => {
    const warnings = smartAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
    return { 
      totalAlerts: smartAlerts.length, 
      unreadNotifs: unreadCount, 
      criticalWarnings: warnings,
      pendingRequests: requests.filter(r => r.status === 'open' || r.status === 'assigned').length 
    };
  }, [smartAlerts, requests, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    });
  }, [notifications, searchQuery]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Emergency Modal */}
      <EmergencyModal 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#1E60F2]" />
            <span>Alerts & Community Updates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time heatwave bulletins, personal notices, and emergency aid dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors btn-press"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Aid</span>
          </button>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors btn-press"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Heat Warnings</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
            {metrics.criticalWarnings}
          </div>
          <div className="text-[11px] text-slate-400">High & extreme alerts</div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Unread Notices</span>
            <Bell className="w-4 h-4 text-[#1E60F2]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
            {metrics.unreadNotifs}
          </div>
          <div className="text-[11px] text-slate-400">Community advisories</div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Aid Requests</span>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
            {metrics.pendingRequests}
          </div>
          <div className="text-[11px] text-slate-400">Active or in triage</div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Broadcasts</span>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
            {metrics.totalAlerts}
          </div>
          <div className="text-[11px] text-slate-400">Verified regional bulletins</div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMainTab('warnings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mainTab === 'warnings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Heat Warnings ({smartAlerts.length})
          </button>
          <button
            onClick={() => setMainTab('notifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mainTab === 'notifications'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Direct Notifications ({unreadCount})
          </button>
          <button
            onClick={() => setMainTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mainTab === 'requests'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Aid Requests ({requests.length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search alerts or notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none input-interactive"
          />
        </div>
      </div>

      {/* Tab 1: Heat Warnings */}
      {mainTab === 'warnings' && (
        <div className="space-y-4">
          {smartAlerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    alert.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                    alert.severity === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {alert.severity} Risk
                  </span>
                  <span className="text-xs font-bold text-slate-900">{alert.location_name}</span>
                  <span className="text-[11px] text-slate-400">• Active Bulletin</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {alert.headline}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {alert.description}
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <Link
                  to="/cooling-centres"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#1E60F2] hover:bg-blue-100 text-xs font-semibold transition-colors btn-press"
                >
                  View Guidance
                </Link>
                <span className="text-[11px] text-slate-400">
                  Valid for {alert.expected_duration_hours || 4} hours
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Direct Notifications */}
      {mainTab === 'notifications' && (
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Notification Feed</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No notifications match your search.
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    item.is_read
                      ? 'bg-white border-[#E5EDF5] hover:bg-slate-50'
                      : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E5EDF5] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bell className="w-4 h-4 text-[#1E60F2]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatTimeAgo(item.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Aid Requests */}
      {mainTab === 'requests' && (
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Community Aid Requests</h3>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Request</span>
            </button>
          </div>

          <div className="space-y-3">
            {requests.map(req => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                      req.status === 'assigned' ? 'bg-blue-50 text-[#1E60F2]' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                    <span className="font-bold text-slate-900">{req.resident_name || 'Resident'}</span>
                    <span className="text-slate-400">• {req.locality_name}</span>
                  </div>
                  <p className="text-slate-600">{req.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{formatTimeAgo(req.created_at)}</span>
                  <Link
                    to="/requests"
                    className="px-3 py-1 rounded-lg bg-white border border-[#E5EDF5] text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    View Status
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};

export default AlertsPage;
