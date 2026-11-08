import React, { useEffect, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
  ChevronRight,
  MessageCircle,
  Radio,
  Smartphone,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenEmergency?: () => void;
  onOpenDownload?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show?: boolean;
  badge?: number | string;
  badgeType?: 'alert' | 'info' | 'pulse';
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
  onOpenDownload,
}) => {
  const { user, role, isAdmin, isVolunteer } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const activeLayoutId = useId();

  // Close mobile sidebar automatically whenever pathname changes
  useEffect(() => {
    onCloseMobile();
  }, [location.pathname]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/map', label: 'Heat Map', icon: MapPin, aliasMatches: ['/heat-map', '/explore'], badge: '3D', badgeType: 'info' },
        { to: '/predictions', label: 'Forecast', icon: TrendingUp },
      ]
    },
    {
      title: 'Heat Safety',
      items: [
        { to: '/heat-alerts', label: 'Heat Alerts', icon: Flame, aliasMatches: ['/alerts'], badge: 'Live', badgeType: 'alert' },
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
        { to: '/assistant', label: 'AI Assistant', icon: Bot, badge: 'AI', badgeType: 'info' },
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
        { to: '/whatsapp', label: 'WhatsApp Gateway', icon: MessageCircle, show: isAdmin },
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
      {/* Mobile Backdrop Overlay with Frosted Glass */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* 3D-Aware Slim & Sleek Navigation Rail */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-[1050] lg:z-auto w-[264px] shrink-0 bg-white/95 backdrop-blur-2xl border-r border-[#E8EFF9] flex flex-col transition-transform duration-250 ease-out lg:rounded-l-[32px] shadow-[1px_0_24px_rgba(15,35,70,0.05)] lg:shadow-none select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Top Brand Header */}
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-[#E8EFF9] shrink-0 bg-gradient-to-b from-white to-[#F9FBFE]">
          <Link 
            to="/dashboard" 
            onClick={onCloseMobile} 
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
            aria-label="HeatShield AI - Return to dashboard"
          >
            <BrandLogo size="md" showBadge={true} />
          </Link>
          <button 
            onClick={onCloseMobile}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-[#EEF3FB] lg:hidden transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D-styled Real-time Heat Defense Status Pill */}
        <div className="px-3.5 pt-3.5 pb-1">
          <div className="relative group overflow-hidden px-3 py-2 rounded-2xl bg-gradient-to-r from-[#EEF4FD] via-[#F4F8FE] to-[#EEF4FD] border border-[#DFEAF8] shadow-[0_2px_8px_rgba(20,50,90,0.04)] text-[11px] font-semibold text-slate-700 transition-all hover:border-blue-200">
            {/* Subtle ambient shimmer edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                </span>
                <span className="text-slate-800 font-bold tracking-tight text-xs">Heat Defense</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-700 bg-white/90 px-2 py-0.5 rounded-full shadow-2xs border border-blue-100/80">
                <Radio className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                <span>Live</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items (Layered 3D active pill glider & silky transitions) */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto overscroll-contain" aria-label="Main navigation menu">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.show === undefined || item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400/90 flex items-center justify-between">
                  <span>{group.title}</span>
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isCurrentActive(item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative group flex items-center justify-between px-3.5 py-2.5 text-xs rounded-2xl transition-all duration-150 transform-gpu focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isActive
                          ? 'text-white font-semibold shadow-md shadow-blue-500/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                      } ${!shouldReduceMotion && !isActive ? 'hover:translate-x-1' : ''}`}
                    >
                      {/* Smooth Liquid Active Glider */}
                      {isActive && (
                        <motion.div
                          layoutId={`sidebarActiveIndicator-${activeLayoutId}`}
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500 z-0 shadow-sm"
                          transition={{
                            type: shouldReduceMotion ? false : 'spring',
                            stiffness: 380,
                            damping: 32,
                          }}
                        >
                          {/* Inner 3D specular highlight */}
                          <div className="absolute inset-x-2 top-0 h-px bg-white/30 rounded-full" />
                        </motion.div>
                      )}

                      <div className="relative z-10 flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform ${!shouldReduceMotion ? 'group-hover:scale-110' : ''} ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="relative z-10 flex items-center gap-1.5 shrink-0 ml-1">
                        {isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse" />
                        ) : item.badge !== undefined ? (
                          <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                            item.badgeType === 'alert'
                              ? 'bg-rose-100 text-rose-600 animate-pulse'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Prominent Mobile Drawer & Desktop Rail App Download Banner */}
        <div className="px-3 pt-2 pb-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              if (onOpenDownload) onOpenDownload();
            }}
            className="w-full text-left group relative overflow-hidden p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all cursor-pointer border border-blue-400/25 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Download HeatShield AI Android App (APK)"
            aria-label="Download HeatShield AI Android App"
          >
            {/* Top specular highlight */}
            <div className="absolute inset-x-2 top-0 h-px bg-white/30 rounded-full" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25 shadow-2xs">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate flex items-center gap-1.5">
                  <span>Download App</span>
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-400 text-emerald-950 px-1 py-0.2 rounded-full">
                    APK
                  </span>
                </div>
                <div className="text-[10px] text-blue-100 truncate">
                  Android v1.0 • 28.4 MB
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-blue-200 group-hover:translate-y-0.5 group-hover:text-white transition-all shrink-0" />
            </div>
          </button>
        </div>

        {/* Rail Footer: Elevated Layered Profile Chip & Settings Dock */}
        <div className="p-3 border-t border-[#E8EFF9] space-y-2 shrink-0 bg-white/80 backdrop-blur-md">
          <Link
            to="/account"
            onClick={onCloseMobile}
            aria-current={location.pathname === '/account' ? 'page' : undefined}
            className={`group relative flex items-center gap-2.5 p-2 rounded-2xl text-xs transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              location.pathname === '/account'
                ? 'bg-blue-50 text-blue-800 font-bold border-blue-200/90 shadow-xs'
                : 'bg-slate-50/70 hover:bg-[#EEF3FB] text-slate-700 hover:text-slate-900 border-[#E5EDF7]'
            }`}
          >
            {/* Iridescent 3D Avatar Orb */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-2 ring-white/90 group-hover:ring-blue-200 transition-all">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate font-bold text-slate-800 text-xs flex items-center gap-1">
                <span className="truncate">{user?.full_name || 'Resident'}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{roleLabel}</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <div className="flex items-center gap-1.5 pt-0.5">
            <Link
              to="/settings"
              onClick={onCloseMobile}
              title="Application Settings"
              aria-label="Settings"
              aria-current={location.pathname === '/settings' ? 'page' : undefined}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex-1 flex items-center justify-center gap-1.5 border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                location.pathname === '/settings'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white hover:bg-[#EEF3FB] text-slate-600 hover:text-slate-900 border-[#E5EDF7]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Settings</span>
            </Link>
            <button
              onClick={() => {
                onCloseMobile();
                if (onOpenEmergency) onOpenEmergency();
              }}
              title="Immediate Heat Emergency Call"
              aria-label="Immediate Heat Emergency Call"
              className="p-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-xs font-bold flex items-center justify-center transition-all px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;