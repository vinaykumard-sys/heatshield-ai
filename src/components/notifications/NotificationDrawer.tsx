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
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'missed_checkin':
        return <UserCheck className="w-4 h-4 text-amber-700" />;
      case 'request_update':
        return <HelpCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end animate-fade-in">
      <div 
        className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Community Alerts</h3>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread high-priority notifications` : 'All alerts caught up'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & filter */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'unread' ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">No alerts to display</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  !item.is_read
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200'
                } hover:border-blue-300 hover:translate-x-1 hover:shadow-xs active:scale-[0.99]`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 mt-0.5 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${!item.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                        {item.type.replace('_', ' ')}
                      </span>
                      {!item.is_read && (
                        <span className="text-[11px] text-blue-600 font-semibold hover:underline">
                          Mark as read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Link to full alerts page */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <Link
            to="/alerts"
            onClick={() => setIsDrawerOpen(false)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
          >
            <span>Open Full Alerts & Dispatches Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
