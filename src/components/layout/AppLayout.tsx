import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  HeartPulse, 
  HelpCircle, 
  Bell, 
  BarChart3, 
  Settings, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  User as UserIcon, 
  PhoneCall,
  ShieldCheck,
  Compass,
  TrendingUp,
  Building2,
  Bot,
  Sliders,
  Droplets,
  HardHat,
  ShieldAlert,
  Navigation,
  Heart,
  GraduationCap,
  Stethoscope,
  Code2,
  Flame,
  Wifi,
  WifiOff,
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from '../common/BrandLogo';
import { EmergencyModal } from '../common/EmergencyModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { useLocationTracker } from '../../context/LocationContext';
import { FloatingAssistantWidget } from '../assistant/FloatingAssistantWidget';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, role, logout, isAdmin, isVolunteer, isResident } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { currentLocation } = useLocationTracker();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Page title mapping based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Resident Safety Briefing';
      case '/map':
      case '/explore':
      case '/heat-map':
        return 'Hyperlocal Heat Risk Map';
      case '/predictions':
        return 'AI Heatwave Prediction Engine';
      case '/cooling-centres':
        return 'Cooling Shelters & Mist Havens';
      case '/residents':
        return 'Vulnerable Residents Directory';
      case '/checkins':
      case '/welfare-checkins':
        return 'Smart Welfare Check-in System';
      case '/requests':
        return 'Assistance Requests';
      case '/assistant':
        return 'HeatShield Multilingual AI Voice Assistant';
      case '/heat-simulator':
        return 'What-If Heat Simulation Sandbox';
      case '/alerts':
      case '/alerts-assistance':
        return 'Alerts & Assistance';
      case '/analytics':
        return 'Health Risk Analytics';
      case '/settings':
      case '/admin':
        return 'Municipal System Settings';
      case '/account':
        return 'My Account & Alert Preferences';
      case '/portal':
        return 'Resident Safety Portal';
      case '/heat-alerts':
        return 'Smart Heat Alert System';
      case '/water-stations':
        return 'Public Water Availability Tracker';
      case '/worker-safety':
        return 'Outdoor Worker Safety Manager';
      case '/command-centre':
        return 'Municipal Command Centre';
      case '/safe-routes':
        return 'Heat-Safe Route Planner';
      case '/family-safety':
      case '/my-safety':
        return 'My Safety & Family Circle';
      case '/school-safety':
        return 'School Heat Safety Protocol';
      case '/hospital-directory':
        return 'Hospital Resource Directory';
      case '/developer':
        return 'Developer Portal & Public APIs';
      case '/resident-dashboard':
        return 'Personalized Resident Dashboard';
      case '/impact-dashboard':
        return 'HeatShield Impact & Resilience';
      case '/academy':
        return 'Heat Awareness Academy';
      case '/offline-emergency':
        return 'Offline Emergency Mode';
      default:
        return 'Dashboard';
    }
  };

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    show?: boolean;
    badge?: number | string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'Resident Safety Services',
      items: [
        { to: '/dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
        { to: '/map', label: 'Explore & Find Help', icon: MapPin },
        { to: '/alerts', label: 'Alerts & Assistance', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
        { to: '/family-safety', label: 'My Safety', icon: Heart },
        { to: '/academy', label: 'Learn & Prepare', icon: GraduationCap },
        { to: '/account', label: 'My Account', icon: UserIcon },
      ]
    },
    {
      title: 'Community Lifelines',
      items: [
        { to: '/water-stations', label: 'Water Availability', icon: Droplets },
        { to: '/cooling-centres', label: 'Cooling Centres', icon: Building2 },
        { to: '/hospital-directory', label: 'Hospital Directory', icon: Stethoscope },
        { to: '/safe-routes', label: 'Heat-Safe Routes', icon: Navigation },
        { to: '/assistant', label: 'AI Voice Assistant', icon: Bot },
        { to: '/offline-emergency', label: 'Offline Emergency', icon: WifiOff },
      ]
    },
    {
      title: 'Municipal & Officer Tools',
      items: [
        { to: '/command-centre', label: 'Command Centre', icon: ShieldAlert, show: isAdmin },
        { to: '/residents', label: 'Residents Directory', icon: Users, show: isVolunteer || isAdmin },
        { to: '/checkins', label: 'Welfare Check-ins', icon: HeartPulse, show: isVolunteer || isAdmin },
        { to: '/requests', label: 'Assistance Triage', icon: HelpCircle, show: isVolunteer || isAdmin },
        { to: '/worker-safety', label: 'Worker Safety', icon: HardHat, show: isVolunteer || isAdmin },
        { to: '/school-safety', label: 'School Safety', icon: GraduationCap, show: isVolunteer || isAdmin },
        { to: '/heat-simulator', label: 'Heat Simulator', icon: Sliders, show: isAdmin },
        { to: '/impact-dashboard', label: 'Impact Dashboard', icon: Award, show: isVolunteer || isAdmin },
        { to: '/analytics', label: 'Health Analytics', icon: BarChart3, show: isAdmin },
        { to: '/developer', label: 'Developer Portal', icon: Code2, show: isAdmin },
        { to: '/admin', label: 'Admin Settings', icon: Settings, show: isAdmin },
      ]
    }
  ];

  const isKarnataka = (currentLocation?.state || '').toLowerCase().includes('karnataka');
  const helplineNum = isKarnataka ? '1070' : '1077';

  const roleLabel = {
    admin: 'Administrator',
    volunteer: 'Community Volunteer',
    resident: 'Registered Resident',
  }[role] || 'Registered Resident';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-[#0F172A]">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar (Desktop & Mobile) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-[1050] w-64 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E2E8F0]">
          <Link to="/dashboard" className="flex items-center">
            <BrandLogo size="md" showBadge={true} />
          </Link>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.show === undefined || item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {group.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium nav-item-interactive ${
                        isActive
                          ? 'active-nav'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 nav-icon shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full shadow-2xs ${
                          item.badge === 'Live' ? 'bg-red-100 text-red-700 font-mono animate-pulse' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Bottom: Active Zone Indicator */}
        <div className="p-3 border-t border-[#E2E8F0]">
          <div className="p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Monitored Ward</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs text-slate-900 font-medium truncate">
              {currentLocation.localityName}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {currentLocation.city}, {currentLocation.state}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-subtle">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search platform..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none input-interactive"
              />
            </div>

            {/* Online / Offline Sync Status Indicator */}
            <Link
              to="/offline-emergency"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium btn-press ${
                isOnline 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-[1.02]' 
                  : 'border-amber-300 bg-amber-50 text-amber-800 animate-pulse'
              }`}
              title={isOnline ? 'Online - Database synchronized' : 'Offline - Emergency lifelines cached'}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </>
              )}
            </Link>

            {/* Emergency Hotline SOS Button */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold sos-breathe-subtle btn-press"
              title="State Emergency Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span className="hidden sm:inline">SOS ({helplineNum})</span>
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all btn-press hover:scale-105"
              title="Community Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              )}
            </button>

            <div className="h-6 w-px bg-[#E2E8F0] mx-0.5" />

            {/* User Profile Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all btn-press hover:scale-[1.02]"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-900 truncate max-w-[120px]">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E2E8F0] shadow-dropdown py-1.5 text-xs z-50 animate-dropdown-enter">
                  <div className="px-3.5 py-2 border-b border-[#E2E8F0]">
                    <p className="font-semibold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-slate-500 truncate text-[11px]">{user?.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Account & Verification</span>
                    </Link>
                    <Link
                      to="/family-safety"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Safety & Family</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>System Administration</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 text-left font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content Body with Smooth Page Transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div key={location.pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <NotificationDrawer />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Persistent Multilingual AI Voice Assistant Widget */}
      <FloatingAssistantWidget />
    </div>
  );
};
