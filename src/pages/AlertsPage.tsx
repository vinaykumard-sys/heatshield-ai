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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatTimeAgo } from '../lib/utils';
import { NotificationType, NotificationPriority } from '../types';

export const AlertsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'critical' | 'environmental' | 'welfare'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Overview metrics
  const metrics = useMemo(() => {
    const critical = notifications.filter(n => n.priority === 'critical' || n.type === 'critical_risk').length;
    const warnings = notifications.filter(n => n.priority === 'warning' || n.type === 'environmental_alert').length;
    const welfare = notifications.filter(n => n.type === 'missed_checkin').length;

    return { total: notifications.length, unread: unreadCount, critical, warnings, welfare };
  }, [notifications, unreadCount]);

  // Filtered notifications
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (activeTab === 'unread' && n.is_read) return false;
      if (activeTab === 'critical' && n.priority !== 'critical' && n.type !== 'critical_risk') return false;
      if (activeTab === 'environmental' && n.type !== 'environmental_alert') return false;
      if (activeTab === 'welfare' && n.type !== 'missed_checkin') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const getAlertIcon = (type: NotificationType, priority: NotificationPriority) => {
    if (priority === 'critical' || type === 'critical_risk') {
      return (
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
      );
    }
    if (priority === 'warning' || type === 'environmental_alert') {
      return (
        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'missed_checkin') {
      return (
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
          <UserCheck className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'request_update') {
      return (
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <HelpCircle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
        <Info className="w-5 h-5" />
      </div>
    );
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
            WARNING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            INFO
          </span>
        );
    }
  };

  const getActionLink = (type: NotificationType) => {
    switch (type) {
      case 'critical_risk':
      case 'environmental_alert':
        return { to: '/map', label: 'View Heat Risk Map' };
      case 'missed_checkin':
        return { to: '/checkins', label: 'Review Welfare Priority' };
      case 'request_update':
        return { to: '/requests', label: 'View Assistance Requests' };
      default:
        return { to: '/dashboard', label: 'Open Overview' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>Community Alerts & Dispatches</span>
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              TELEMETRY ALERTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time thermal risk warnings, emergency welfare escalations, and environmental telemetry updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Broadcasts</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">All registered alerts</span>
        </div>

        <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
            <span>Unread Alerts</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">{metrics.unread}</div>
          <span className="text-[10px] text-slate-500">Require coordinator review</span>
        </div>

        <div className="p-4 bg-white border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-red-600 font-semibold mb-1">
            <span>Critical Warnings</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-700">{metrics.critical}</div>
          <span className="text-[10px] text-slate-500">Extreme thermal distress</span>
        </div>

        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>Welfare Escalations</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800">{metrics.welfare}</div>
          <span className="text-[10px] text-slate-500">Field visit flags</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs overflow-x-auto shadow-sm">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'critical', label: `Critical (${metrics.critical})` },
            { id: 'environmental', label: `Weather (${metrics.warnings})` },
            { id: 'welfare', label: `Welfare (${metrics.welfare})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded capitalize whitespace-nowrap font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.map((notif) => {
          const action = getActionLink(notif.type);
          const isCritical = notif.priority === 'critical' || notif.type === 'critical_risk';

          return (
            <div
              key={notif.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all ${
                !notif.is_read ? 'border-l-4 border-l-blue-600 bg-blue-50/20' : 'border-slate-200'
              } ${isCritical ? 'border-red-200' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: Icon & Content */}
                <div className="flex items-start gap-3.5">
                  {getAlertIcon(notif.type, notif.priority)}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {notif.title}
                      </h3>
                      {getPriorityBadge(notif.priority)}
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(notif.created_at)}</span>
                      </span>
                      <span>Type: <strong className="text-slate-600 capitalize">{notif.type.replace(/_/g, ' ')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    to={action.to}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">No alerts match the selected criteria.</p>
            <p className="text-xs text-slate-400 mt-0.5">All community telemetry and welfare check-ins are clear.</p>
          </div>
        )}
      </div>
    </div>
  );
};
