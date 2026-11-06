import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  TrendingUp, 
  Flame, 
  ShieldCheck, 
  Droplets, 
  Building2, 
  Navigation, 
  HelpCircle, 
  Heart, 
  GraduationCap, 
  HardHat, 
  Stethoscope, 
  Sparkles, 
  Sliders, 
  Bot, 
  ShieldAlert, 
  Users, 
  HeartPulse, 
  Settings, 
  Cpu, 
  X, 
  PhoneCall, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenEmergency?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show?: boolean;
  badge?: number | string;
  aliasMatches?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onOpenEmergency,
}) => {
  const { user, role, isAdmin, isVolunteer } = useAuth();
  const location = useLocation();

  // Close mobile sidebar automatically whenever pathname changes
  useEffect(() => {
    onCloseMobile();
  }, [location.pathname]);

  const navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/map', label: 'Heat Map', icon: MapPin, aliasMatches: ['/heat-map', '/explore'] },
        { to: '/predictions', label: 'Forecast', icon: TrendingUp },
      ]
    },
    {
      title: 'Heat Safety',
      items: [
        { to: '/heat-alerts', label: 'Heat Alerts', icon: Flame, aliasMatches: ['/alerts'] },
        { to: '/resident-dashboard', label: 'My Safety', icon: ShieldCheck, aliasMatches: ['/my-safety'] },
        { to: '/water-stations', label: 'Nearby Help', icon: Droplets },
        { to: '/cooling-centres', label: 'Cooling Centres', icon: Building2 },
        { to: '/safe-routes', label: 'Safe Routes', icon: Navigation },
        { to: '/requests', label: 'Assistance Requests', icon: HelpCircle },
      ]
    },
    {
      title: 'Specialized',
      items: [
        { to: '/family-safety', label: 'Family Safety', icon: Heart },
        { to: '/school-safety', label: 'School Safety', icon: GraduationCap },
        { to: '/worker-safety', label: 'Worker Safety', icon: HardHat },
        { to: '/hospital-directory', label: 'Hospital Directory', icon: Stethoscope },
        { to: '/academy', label: 'Heat Academy', icon: Sparkles },
        { to: '/heat-simulator', label: 'Heat Simulator', icon: Sliders },
        { to: '/assistant', label: 'AI Assistant', icon: Bot },
      ]
    },
    ...(isAdmin || isVolunteer ? [{
      title: 'Operations',
      items: [
        { to: '/command-centre', label: 'Command Centre', icon: ShieldAlert, show: isAdmin },
        { to: '/organization', label: 'Organizations', icon: Building2, show: true },
        { to: '/residents', label: 'Residents Directory', icon: Users, show: isVolunteer || isAdmin },
        { to: '/checkins', label: 'Welfare Check-ins', icon: HeartPulse, show: isVolunteer || isAdmin },
        { to: '/admin', label: 'System Admin', icon: Settings, show: isAdmin },
        { to: '/developer', label: 'Developer Diagnostics', icon: Cpu, show: isAdmin },
      ]
    }] : [])
  ];

  const roleLabel = {
    admin: 'Administrator',
    volunteer: 'Volunteer',
    resident: 'Resident',
  }[role] || 'Resident';

  const isCurrentActive = (item: NavItem) => {
    if (location.pathname === item.to) return true;
    if (item.aliasMatches && item.aliasMatches.includes(location.pathname)) return true;
    return false;
  };

  const userInitial = user?.full_name?.charAt(0).toUpperCase() || 'R';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Slim & Sleek Navigation Rail */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-[1050] lg:z-auto w-[256px] shrink-0 bg-white/95 backdrop-blur-xl border-r border-[#E9F0FA] flex flex-col transition-transform duration-200 ease-out lg:rounded-l-[32px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Top Brand Header */}
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-[#E9F0FA] shrink-0">
          <Link to="/dashboard" onClick={onCloseMobile} className="flex items-center group">
            <BrandLogo size="md" showBadge={true} />
          </Link>
          <button 
            onClick={onCloseMobile}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-[#EEF3FB] lg:hidden transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time System Status Pill */}
        <div className="px-4 pt-3.5 pb-1">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-[#EEF3FB] border border-[#E5EDF7] text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-slate-700 font-bold tracking-tight">Heat Defense</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-blue-100">
              Active
            </span>
          </div>
        </div>

        {/* Navigation Items (Modern soft navigation pills with active blue state & inactive hover state) */}
        <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.show === undefined || item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isCurrentActive(item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      className={`group flex items-center justify-between px-3.5 py-2.5 text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 rounded-2xl font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse shrink-0 ml-1" />
                      ) : item.badge !== undefined ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Rail Footer: User Profile Chip & Settings */}
        <div className="p-3 border-t border-[#E9F0FA] space-y-2 shrink-0 bg-white/70">
          <Link
            to="/account"
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 p-2 rounded-2xl text-xs transition-all btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              location.pathname === '/account'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#EEF3FB] font-medium'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0 ring-1 ring-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate font-bold text-slate-800 text-xs">
                {user?.full_name || 'Resident'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {roleLabel}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </Link>

          <div className="flex items-center gap-1 px-1">
            <Link
              to="/settings"
              onClick={onCloseMobile}
              title="Application Settings"
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex-1 flex items-center justify-center gap-1.5 btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                location.pathname === '/settings'
                  ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FB]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[11px]">Settings</span>
            </Link>
            <button
              onClick={() => {
                onCloseMobile();
                if (onOpenEmergency) onOpenEmergency();
              }}
              title="Immediate Heat Emergency"
              className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center justify-center transition-colors px-2.5 btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
