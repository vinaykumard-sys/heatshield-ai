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
  Sliders
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
        return 'Overview';
      case '/map':
      case '/heat-map':
        return 'Hyperlocal Heat Risk Map';
      case '/predictions':
        return 'AI Heatwave Prediction Engine';
      case '/cooling-centres':
        return 'Cooling Centre & Water Finder';
      case '/residents':
        return 'Vulnerable Residents';
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
        return 'Alerts & Notifications';
      case '/analytics':
        return 'Health Risk Analytics';
      case '/settings':
      case '/admin':
        return 'System Settings & Models';
      case '/portal':
        return 'Resident Safety Portal';
      default:
        return 'Dashboard';
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/map', label: 'Heat Risk Map', icon: MapPin },
    { to: '/predictions', label: 'Predictions', icon: TrendingUp },
    { to: '/cooling-centres', label: 'Cooling Centres', icon: Building2 },
    { to: '/residents', label: 'Residents', icon: Users, show: isVolunteer || isAdmin },
    { to: '/checkins', label: 'Welfare Check-ins', icon: HeartPulse, show: isVolunteer || isAdmin },
    { to: '/requests', label: 'Assistance Requests', icon: HelpCircle },
    { to: '/assistant', label: 'AI Voice Assistant', icon: Bot },
    { to: '/heat-simulator', label: 'Heat Simulator', icon: Sliders },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: isAdmin ? '/admin' : '/settings', label: 'Settings', icon: Settings },
  ];

  const visibleNavItems = navItems.filter(item => item.show === undefined || item.show);

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
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Navigation
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {item.badge}
                  </span>
                )}
              </Link>
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search platform..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Emergency Hotline SOS Button */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
              title="State Emergency Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">SOS ({helplineNum})</span>
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Community Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            <div className="h-6 w-px bg-[#E2E8F0] mx-0.5" />

            {/* User Profile Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
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
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-dropdown py-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-[#E2E8F0]">
                    <p className="font-semibold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-slate-500 truncate text-[11px]">{user?.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/portal"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Resident Portal</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>
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

        {/* Page Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
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
