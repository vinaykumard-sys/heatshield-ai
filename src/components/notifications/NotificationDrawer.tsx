import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  Flame, 
  UserCheck, 
  HelpCircle, 
  Info,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatTimeAgo } from '../../lib/utils';
import { NotificationType } from '../../types';

export const NotificationDrawer: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isDrawerOpen, 
    setIsDrawerOpen 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isDrawerOpen) return null;

  const filtered = notifications.filter(n => filter === 'all' || !n.is_read);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'critical_risk':
        return <Flame className="w-4 h-4 text-red-600" />;
      case 'environmental_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'missed_checkin':
        return <UserCheck className="w-4 h-4 text-amber-700" />;
      case 'request_update':
        return <HelpCircle className="w-4 h-4 text-[#1E60F2]" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div 
        className="w-full max-w-md bg-white border-l border-[#E5EDF5] h-full flex flex-col shadow-modal animate-in slide-in-from-right duration-200 ease-out"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5EDF5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1E60F2]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Stay updated on neighborhood heat advisories</p>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Actions Bar */}
        <div className="px-5 py-2.5 bg-[#F5F8FC] border-b border-[#E5EDF5] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs border border-[#E5EDF5]' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-white text-slate-900 shadow-xs border border-[#E5EDF5]' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E60F2] hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <Bell className="w-8 h-8 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No notifications</p>
              <p className="text-xs max-w-xs text-slate-400">
                You're all caught up. We will notify you if heat risks or local alerts change.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.is_read
                    ? 'bg-white border-[#E5EDF5] hover:bg-slate-50/70'
                    : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E5EDF5] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {(item as any).link && (
                      <Link
                        to={(item as any).link}
                        onClick={() => setIsDrawerOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E60F2] hover:underline pt-0.5"
                      >
                        <span>View details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F5F8FC] border-t border-[#E5EDF5]">
          <Link
            to="/alerts"
            onClick={() => setIsDrawerOpen(false)}
            className="block text-center w-full py-2 px-3 rounded-xl bg-white border border-[#E5EDF5] hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors shadow-2xs"
          >
            View All Safety Alerts & Bulletins
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
