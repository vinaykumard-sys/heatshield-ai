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
  GraduationCap,
  Stethoscope,
  Flame,
  Sparkles,
  Home,
  Compass,
  Check,
  Crosshair,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from '../common/BrandLogo';
import { EmergencyModal } from '../common/EmergencyModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { useLocationTracker } from '../../context/LocationContext';
import { FloatingAssistantWidget } from '../assistant/FloatingAssistantWidget';
import { mockDb } from '../../lib/mockDb';
import { LocationZone } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, role, logout, isAdmin, isVolunteer } = useAuth();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const { 
    currentLocation, 
    currentReading,
    currentRisk,
    selectCustomLocality,
    returnToDeviceLocation,
    searchAndSetLocation, 
    isTracking,
    selectedZone
  } = useLocationTracker();

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const wardDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Available ward zones for the ward switcher
  const availableZones: LocationZone[] = mockDb.getLocations();

  // Close dropdowns on outside click and Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (wardDropdownRef.current && !wardDropdownRef.current.contains(event.target as Node)) {
        setWardDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setWardDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const handleSelectWard = (zone: LocationZone) => {
    selectCustomLocality(zone);
    setWardDropdownOpen(false);
  };

  const handleReturnToDeviceLocation = async () => {
    await returnToDeviceLocation();
    setWardDropdownOpen(false);
  };

  // Clean, human-friendly page titles and descriptions
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Dashboard', desc: 'Real-time heat safety overview and neighborhood conditions' };
      case '/map':
      case '/heat-map':
      case '/explore':
        return { title: 'Heat Map', desc: 'Live microclimates, water ATMs, and cooling shelters' };
      case '/predictions':
        return { title: 'Forecast', desc: 'Hourly and multi-day heat risk predictions' };
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
      case '/organization':
      case '/organisation':
        return { title: 'Workplace Organizations', desc: 'Occupational heat safety rosters, WBGT thresholds, and employer coordination' };
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
        return { title: 'HeatShield AI', desc: 'Modern soft-UI climate safety operating system' };
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

  const currentLocalityName = currentLocation.localityName || currentLocation.locality || selectedZone?.name || 'Central Delhi';
  const currentCity = currentLocation.city || 'Delhi';
  const currentTemperature = currentReading ? Math.round(currentReading.temperature_c) : 32;
  const currentCityState = `${currentCity}, ${currentLocation.state || 'Delhi'}`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E2ECF9] via-[#EDF3FB] to-[#DFEAF8] lg:p-3 xl:p-4 flex flex-col justify-center items-center font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Floating Application Canvas (SkySense & Horizon Master Shell) */}
      <div className="w-full max-w-[1780px] h-screen lg:h-[calc(100vh-24px)] xl:h-[calc(100vh-32px)] bg-[#F4F7FE] lg:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(20,50,90,0.12),0_0_0_1px_rgba(255,255,255,0.85)] border border-[#E2EAF7] flex overflow-hidden relative">

        {/* 1. SLIM & SLEEK NAVIGATION RAIL */}
        <aside 
          className={`fixed lg:static top-0 bottom-0 left-0 z-[1050] lg:z-auto w-[252px] shrink-0 bg-white/95 backdrop-blur-xl border-r border-[#E9F0FA] flex flex-col transition-transform duration-200 ease-out lg:rounded-l-[32px] ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top Brand Header */}
          <div className="h-[72px] px-5 flex items-center justify-between border-b border-[#E9F0FA] shrink-0">
            <Link to="/dashboard" className="flex items-center group">
              <BrandLogo size="md" showBadge={true} />
            </Link>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-[#EEF3FB] lg:hidden transition-colors"
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

          {/* Navigation Items (Curved Active Pill Tabs) */}
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
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-180 nav-item-interactive ${
                          isActive
                            ? 'active-nav'
                            : 'text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 nav-icon shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse shrink-0 ml-1" />
                        ) : item.badge !== undefined ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-[#2563EB]">
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
              className={`flex items-center gap-2.5 p-2 rounded-2xl text-xs transition-all btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                location.pathname === '/account'
                  ? 'bg-blue-50 text-[#2563EB] font-bold border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#EEF3FB] font-medium'
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                {user?.full_name?.charAt(0).toUpperCase() || 'R'}
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
                title="Application Settings"
                className={`p-2 rounded-xl text-xs font-medium transition-colors flex-1 flex items-center justify-center gap-1.5 btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  location.pathname === '/settings'
                    ? 'bg-blue-50 text-[#2563EB] font-semibold border border-blue-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FB]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[11px]">Settings</span>
              </Link>
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                title="Immediate Heat Emergency"
                className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center justify-center transition-colors px-2.5 btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* 2. RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">

          {/* MODERN TOP HEADER */}
          <header className="relative h-[72px] shrink-0 bg-white/90 backdrop-blur-xl border-b border-[#E9F0FA] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 z-[1020]">
            
            {/* Left: Mobile Toggle & Ward Pin Switcher */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-1 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FB] lg:hidden transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Location Pin Indicator with Ward Switcher Dropdown */}
              <div className="relative" ref={wardDropdownRef}>
                <button
                  id="ward-selector-button"
                  type="button"
                  onClick={() => setWardDropdownOpen(prev => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setWardDropdownOpen(false);
                  }}
                  aria-expanded={wardDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`Current location: ${currentLocalityName}, ${currentCity}. ${currentTemperature} degrees Celsius. Click to switch location.`}
                  className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#EEF3FB] hover:bg-[#E3EDFA] border border-[#E9F0FA] text-slate-800 transition-all cursor-pointer shadow-xs btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                  title="Click to switch Delhi NCR Ward or Colony"
                >
                  <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <div className="text-left flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-slate-800 tracking-tight truncate max-w-[110px] sm:max-w-[150px] md:max-w-[180px]">
                      {currentLocalityName}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">·</span>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[70px] sm:max-w-[100px]">
                      {currentCity}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">•</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white text-blue-700 shadow-2xs border border-blue-100 shrink-0">
                      {currentTemperature}°C
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-180 ${wardDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Ward Switcher Dropdown Menu */}
                {wardDropdownOpen && (
                  <div 
                    className="absolute left-0 top-full mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-xl rounded-[24px] border border-[#E9F0FA] shadow-[0_20px_50px_-10px_rgba(20,50,90,0.18)] p-3 text-xs z-[1060] animate-dropdown-enter"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="ward-selector-button"
                  >
                    <div className="px-2 py-1.5 mb-1.5 flex items-center justify-between border-b border-[#F1F5F9]">
                      <span className="font-bold text-slate-800 text-xs">Switch Delhi NCR Ward</span>
                      <button
                        type="button"
                        onClick={handleReturnToDeviceLocation}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>Live GPS</span>
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {availableZones.map((zone) => {
                        const isSelected = selectedZone?.id === zone.id || currentLocalityName === zone.name;
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => handleSelectWard(zone)}
                            role="menuitem"
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                              isSelected
                                ? 'bg-[#EEF3FB] text-[#2563EB] font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="truncate font-semibold text-xs">{zone.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {zone.city}, {zone.state} • PIN {zone.pincode}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Soft Pill Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center flex-1 max-w-md mx-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ward, colony, cooling center..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EEF3FB]/90 hover:bg-[#E8EFF9] focus:bg-white border border-[#E9F0FA] focus:border-[#2563EB] rounded-full pl-10 pr-9 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/15 transition-all shadow-xs"
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-[#2563EB] animate-spin absolute right-3.5" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Right Action Cluster: SOS, Notifications, Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* SOS Emergency Hotline Button (Pill Button) */}
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="sos-btn flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full font-bold text-xs tracking-wide shadow-md btn-press"
                title="Immediate Heatstroke Emergency Assistance"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>SOS {helplineNum}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
              </button>

              {/* Notification Bell with Unread Badge */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="relative w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#EEF3FB] hover:bg-[#E2ECF9] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all duration-150 border border-[#E9F0FA] shadow-xs btn-press"
                title="Notifications"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs border-2 border-white animate-scale-in">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="h-5 w-px bg-[#E9F0FA] hidden sm:block mx-0.5" />

              {/* Profile Pill Avatar and Quick Role Badge */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  id="user-profile-button"
                  type="button"
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setProfileDropdownOpen(false);
                  }}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User profile and account settings"
                  className="flex items-center gap-2 p-1 sm:p-1.5 sm:pl-1.5 sm:pr-2.5 rounded-full bg-[#EEF3FB] hover:bg-[#E2ECF9] border border-[#E9F0FA] transition-all shadow-xs btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {user?.full_name?.charAt(0).toUpperCase() || 'R'}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-none">
                    <div className="font-bold text-slate-800 truncate max-w-[105px]">
                      {user?.full_name?.split(' ')[0] || 'Resident'}
                    </div>
                    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white text-[#2563EB] border border-blue-100 shadow-2xs">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block ml-0.5 transition-transform duration-180 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-xl rounded-[24px] border border-[#E9F0FA] shadow-[0_20px_50px_-10px_rgba(20,50,90,0.18)] p-2 text-xs z-[1060] animate-dropdown-enter"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-profile-button"
                  >
                    {/* User Header */}
                    <div className="p-3 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {user?.full_name?.charAt(0).toUpperCase() || 'R'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate text-xs">{user?.full_name || 'Resident'}</p>
                          <p className="text-slate-400 truncate text-[11px]">{user?.email || 'resident@heatshield.gov.in'}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                          {roleLabel || 'Resident'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1 space-y-0.5">
                      <Link
                        to="/account"
                        onClick={() => setProfileDropdownOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#EEF3FB] hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:bg-[#EEF3FB]"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Profile & Health Needs</span>
                      </Link>
                      <Link
                        to="/family-safety"
                        onClick={() => setProfileDropdownOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#EEF3FB] hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:bg-[#EEF3FB]"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Family Safety Circle</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-[#EEF3FB] hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:bg-[#EEF3FB]"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">App Settings</span>
                      </Link>
                    </div>

                    {/* Divider & Action */}
                    <div className="border-t border-[#F1F5F9] pt-1 mt-1">
                      {user ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          role="menuitem"
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-left font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          onClick={() => setProfileDropdownOpen(false)}
                          role="menuitem"
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#2563EB] hover:bg-blue-50 text-left font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:bg-blue-50"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>Sign In</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* PAGE MAIN CONTENT SCROLL CONTAINER */}
          <main className="flex-1 overflow-y-auto bg-[#F4F7FE] p-4 sm:p-6 lg:p-7 pb-20 lg:pb-7">
            <div className="max-w-[1440px] w-full mx-auto">
              <div key={location.pathname} className="animate-page-enter">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E9F0FA] lg:hidden h-16 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(20,50,90,0.06)]">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/dashboard' ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/map"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/map' || location.pathname === '/heat-map' ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </Link>
        <Link
          to="/heat-alerts"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/heat-alerts' || location.pathname === '/alerts' ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span>Alerts</span>
        </Link>
        <Link
          to="/resident-dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/resident-dashboard' || location.pathname === '/my-safety' ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Safety</span>
        </Link>
        <Link
          to="/account"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/account' ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800'
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
