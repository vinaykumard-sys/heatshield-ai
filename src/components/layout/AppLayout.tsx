import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  HeartPulse, 
  HelpCircle, 
  Bell, 
  Settings, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  User as UserIcon, 
  PhoneCall,
  ShieldCheck,
  TrendingUp,
  Building2,
  Bot,
  Sliders,
  Droplets,
  HardHat,
  ShieldAlert,
  Navigation,
  Heart,
  HeartHandshake,
  GraduationCap,
  Stethoscope,
  Flame,
  WifiOff,
  Sparkles,
  Home,
  Compass
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
  const { user, role, logout, isAdmin, isVolunteer } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { currentLocation, searchAndSetLocation, isTracking } = useLocationTracker();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      await searchAndSetLocation(searchQuery.trim());
      setSearchQuery('');
    } finally {
      setIsSearching(false);
    }
  };

  // Clean, human-friendly page titles and descriptions
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Dashboard', desc: 'Real-time heat safety overview and neighborhood conditions' };
      case '/map':
      case '/heat-map':
      case '/explore':
        return { title: 'Heat Map', desc: 'Live conditions, water points, and cooling shelters near you' };
      case '/predictions':
        return { title: 'Forecast', desc: 'Hourly and multi-day heat risk forecast' };
      case '/heat-alerts':
        return { title: 'Heat Alerts', desc: 'Active advisories, alerts, and custom thresholds' };
      case '/alerts':
      case '/alerts-assistance':
        return { title: 'Notifications', desc: 'Community updates and important heat bulletins' };
      case '/resident-dashboard':
      case '/my-safety':
        return { title: 'My Safety', desc: 'Personal heat exposure, hydration guidance, and habits' };
      case '/water-stations':
        return { title: 'Nearby Help', desc: 'Verified drinking water ATMs and hydration points' };
      case '/cooling-centres':
        return { title: 'Cooling Centres', desc: 'Air-conditioned sanctuaries and relief shelters' };
      case '/safe-routes':
        return { title: 'Heat-Safe Routes', desc: 'Tree-shaded and lower heat exposure walking paths' };
      case '/requests':
        return { title: 'Assistance Requests', desc: 'Request water, ORS, or urgent heat assistance' };
      case '/family-safety':
        return { title: 'Family Safety', desc: 'Monitor loved ones and keep elders protected from heat' };
      case '/school-safety':
        return { title: 'School Safety', desc: 'Campus outdoor curfews and hydration protocols' };
      case '/worker-safety':
        return { title: 'Worker Safety', desc: 'Work-rest cycles, hydration guidance, and check-ins' };
      case '/hospital-directory':
        return { title: 'Hospital Directory', desc: 'Medical facilities with emergency heatstroke care' };
      case '/academy':
        return { title: 'Heat Academy', desc: 'Learn vital heat safety tips, hydration, and first aid' };
      case '/heat-simulator':
        return { title: 'Heat Simulator', desc: 'Simulate microclimate changes and urban heat scenarios' };
      case '/assistant':
        return { title: 'AI Assistant', desc: 'Ask about local heat conditions, safety tips, and shelters' };
      case '/account':
        return { title: 'Profile', desc: 'Personal preferences, health profiles, and notifications' };
      case '/settings':
        return { title: 'Settings', desc: 'Manage your app preferences and notification channels' };
      case '/help':
        return { title: 'Help & Relief', desc: 'Emergency relief hotlines and immediate support' };
      case '/command-centre':
        return { title: 'Command Centre', desc: 'Municipal heat resilience and response coordination' };
      case '/residents':
        return { title: 'Residents Directory', desc: 'Vulnerable community members triage' };
      case '/checkins':
      case '/welfare-checkins':
        return { title: 'Welfare Check-ins', desc: 'Community volunteer outreach and wellbeing checks' };
      case '/admin':
        return { title: 'System Administration', desc: 'Platform configuration and settings' };
      default:
        return { title: 'HeatShield', desc: 'Clean, modern heat safety platform' };
    }
  };

  const pageInfo = getPageInfo();

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    show?: boolean;
    badge?: number | string;
    aliasMatches?: string[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

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
      title: 'Safety',
      items: [
        { to: '/heat-alerts', label: 'Alerts', icon: Flame, aliasMatches: ['/alerts'] },
        { to: '/resident-dashboard', label: 'My Safety', icon: ShieldCheck, aliasMatches: ['/my-safety'] },
        { to: '/water-stations', label: 'Nearby Help', icon: Droplets },
        { to: '/cooling-centres', label: 'Cooling Centres', icon: Building2 },
        { to: '/safe-routes', label: 'Heat-Safe Routes', icon: Navigation },
        { to: '/requests', label: 'Assistance Requests', icon: HelpCircle },
      ]
    },
    {
      title: 'Personal',
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
        { to: '/residents', label: 'Residents Directory', icon: Users, show: isVolunteer || isAdmin },
        { to: '/checkins', label: 'Welfare Check-ins', icon: HeartPulse, show: isVolunteer || isAdmin },
        { to: '/admin', label: 'System Admin', icon: Settings, show: isAdmin },
      ]
    }] : [])
  ];

  const isKarnataka = (currentLocation?.state || '').toLowerCase().includes('karnataka');
  const helplineNum = isKarnataka ? '1070' : '1077';

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

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col antialiased text-[#0F172A]">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-[1050] w-64 bg-white border-r border-[#E5EDF5] flex flex-col transition-transform duration-200 ease-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5EDF5]">
          <Link to="/dashboard" className="flex items-center">
            <BrandLogo size="md" showBadge={true} />
          </Link>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.show === undefined || item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isCurrentActive(item);
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
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-[#1E60F2]">
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

        {/* Sidebar Bottom: Profile & Settings Shortcuts */}
        <div className="p-3 border-t border-[#E5EDF5] space-y-1">
          <Link
            to="/account"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium nav-item-interactive ${
              location.pathname === '/account' ? 'active-nav' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4 nav-icon shrink-0" />
            <span>Profile</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium nav-item-interactive ${
              location.pathname === '/settings' ? 'active-nav' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 nav-icon shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 pb-16 lg:pb-0">
        {/* Modern Clean Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5EDF5] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {pageInfo.title}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                {pageInfo.desc}
              </p>
            </div>
          </div>

          {/* Center: Location Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block flex-1 max-w-md mx-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search city, locality, road or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none input-interactive"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#1E60F2] border-t-transparent rounded-full animate-spin" />
            )}
          </form>

          {/* Right Action Cluster: Notifications, SOS, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* SOS Emergency Hotline Button */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="sos-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs"
              title="State Emergency Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS {helplineNum}</span>
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
              title="Notifications"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1E60F2]" />
              )}
            </button>

            <div className="h-5 w-px bg-[#E5EDF5] mx-0.5" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors btn-press"
              >
                <div className="w-8 h-8 rounded-full bg-[#1E60F2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.full_name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-900 truncate max-w-[110px]">
                    {user?.full_name || 'Resident'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E5EDF5] shadow-dropdown py-1.5 text-xs z-50 animate-dropdown-enter">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user?.full_name || 'Resident'}</p>
                    <p className="text-slate-500 truncate text-[11px]">{user?.email || 'Protected user'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#1E60F2] border border-blue-100">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile & Health Needs</span>
                    </Link>
                    <Link
                      to="/family-safety"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <span>Family Safety Circle</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>App Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    {user ? (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 text-left font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-[#1E60F2] hover:bg-blue-50 text-left font-medium transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div key={location.pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Modern Mobile Bottom Navigation Bar (Section 37: Home, Map, Alerts, Safety, Profile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5EDF5] lg:hidden h-16 flex items-center justify-around px-2 shadow-xs">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/dashboard' ? 'text-[#1E60F2] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/map"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/map' || location.pathname === '/heat-map' ? 'text-[#1E60F2] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </Link>
        <Link
          to="/heat-alerts"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/heat-alerts' || location.pathname === '/alerts' ? 'text-[#1E60F2] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span>Alerts</span>
        </Link>
        <Link
          to="/resident-dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/resident-dashboard' || location.pathname === '/my-safety' ? 'text-[#1E60F2] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Safety</span>
        </Link>
        <Link
          to="/account"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/account' ? 'text-[#1E60F2] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Global Modals & Drawers */}
      <NotificationDrawer />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Persistent AI Assistant Widget */}
      <FloatingAssistantWidget />
    </div>
  );
};
