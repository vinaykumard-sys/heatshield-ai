import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  ShieldCheck,
  Heart,
  Settings,
  Cpu,
  LogOut,
  ChevronDown,
  Bell,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className = '' }) => {
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const roleLabel = {
    admin: 'Administrator',
    volunteer: 'Volunteer',
    resident: 'Resident',
  }[role] || 'Resident';

  // Click-outside and Escape key press handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Lock body scroll on mobile bottom sheet
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      navigate('/login');
    }
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VD';

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Vinay';
  const fullDisplayName = user?.full_name || 'Vinay (Resident)';
  const userEmail = user?.email || 'vinay@heatshield.gov.in';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Avatar & Touch Trigger: 'VD / Vinay / Resident / ▼' visible and touchable on mobile & desktop */}
      <button
        id="heatshield-profile-button"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="User profile and account settings"
        className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pl-1.5 sm:pr-2.5 rounded-full bg-[#EEF3FB] hover:bg-[#E2ECF9] active:bg-[#D9E7F7] border border-[#E9F0FA] transition-all duration-150 shadow-xs btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer shrink-0"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-2 ring-white/80">
          {initials}
        </div>
        <div className="flex flex-col text-left text-xs leading-none min-w-0">
          <div className="font-bold text-slate-800 truncate max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]">
            {displayName}
          </div>
          <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white text-blue-600 border border-blue-100 shadow-2xs truncate">
            {roleLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* 1. Mobile Viewports (< md): Native Mobile Bottom Sheet Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Native Bottom Sheet Card */}
          <div
            className="relative z-10 w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 p-5 max-h-[85vh] overflow-y-auto animate-bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="User profile details and settings"
          >
            {/* Sheet Pull Handle */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header: Avatar, Name, Role Badge, Email, Close */}
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 ring-2 ring-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="font-bold text-slate-900 truncate text-sm">
                      {fullDisplayName}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/80 text-blue-700 border border-blue-200/60 shrink-0">
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate text-xs mt-0.5">
                    {userEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                  aria-label="Close bottom sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50 text-[11px]">
                <span className="text-slate-600 font-medium">Heat Defense Protocol</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Shield
                </span>
              </div>
            </div>

            {/* Navigation Links: Profile, Settings, Notifications, Family Safety */}
            <div className="space-y-1">
              {/* Profile & Health Needs */}
              <Link
                to="/account"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-slate-800 text-sm">Profile & Health Needs</div>
                  <div className="text-xs text-slate-400 truncate">Medical alerts & contact info</div>
                </div>
              </Link>

              {/* Resident Dashboard */}
              <Link
                to="/resident-dashboard"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-slate-800 text-sm">Resident Dashboard</div>
                  <div className="text-xs text-slate-400 truncate">Vitals & personal heat shield</div>
                </div>
              </Link>

              {/* App Settings */}
              <Link
                to="/settings"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-slate-800 text-sm">App Settings</div>
                  <div className="text-xs text-slate-400 truncate">Preferences & telemetry</div>
                </div>
              </Link>

              {/* Notifications & Heat Alerts */}
              <Link
                to="/alerts"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-slate-800 text-sm">Notifications & Alerts</div>
                  <div className="text-xs text-slate-400 truncate">Heat advisories & sound alerts</div>
                </div>
              </Link>

              {/* Family Safety Circle */}
              <Link
                to="/family-safety"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-slate-800 text-sm">Family Safety Circle</div>
                  <div className="text-xs text-slate-400 truncate">Elders & dependents tracking</div>
                </div>
              </Link>
            </div>

            {/* Bottom Actions: Sign Out */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100/80 active:bg-red-200/80 text-red-600 font-bold text-sm transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={handleItemClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 py-2.5 rounded-2xl text-slate-500 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Desktop Viewports (md+): Sleek Dropdown Menu */}
      {isOpen && (
        <div
          className="hidden md:block absolute right-0 top-full mt-2 w-72 z-50 rounded-3xl shadow-2xl border border-slate-100 bg-white ring-1 ring-slate-900/5 p-2 text-xs transition-all animate-dropdown-enter"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="heatshield-profile-button"
        >
          {/* User Profile Header Card */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-100/80 mb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ring-2 ring-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate text-xs">
                  {fullDisplayName}
                </p>
                <p className="text-slate-500 truncate text-[11px]">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-200/50">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-700 border border-blue-200/60">
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Shield
              </span>
            </div>
          </div>

          {/* Navigation Menu Items */}
          <div className="py-1 space-y-0.5" role="none">
            {/* 1. Resident profile */}
            <Link
              to="/resident-dashboard"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">Resident Profile</div>
                <div className="text-[10px] text-slate-400 truncate">Vitals & personal heat shield</div>
              </div>
            </Link>

            {/* 2. Profile & Health Needs */}
            <Link
              to="/account"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">Profile & Health Needs</div>
                <div className="text-[10px] text-slate-400 truncate">Medical alerts & contact info</div>
              </div>
            </Link>

            {/* 3. Notifications */}
            <Link
              to="/alerts"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">Notifications & Alerts</div>
                <div className="text-[10px] text-slate-400 truncate">Advisories & sound settings</div>
              </div>
            </Link>

            {/* 4. Family Safety Circle */}
            <Link
              to="/family-safety"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">Family Safety Circle</div>
                <div className="text-[10px] text-slate-400 truncate">Elders & dependents tracking</div>
              </div>
            </Link>

            {/* 5. App Settings */}
            <Link
              to="/settings"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">App Settings</div>
                <div className="text-[10px] text-slate-400 truncate">Preferences & notifications</div>
              </div>
            </Link>

            {/* 6. Developer Diagnostics */}
            <Link
              to="/developer"
              onClick={handleItemClick}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-slate-100"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold text-slate-800 text-xs">Developer Diagnostics</div>
                <div className="text-[10px] text-slate-400 truncate">Telemetry & subsystem health</div>
              </div>
            </Link>
          </div>

          {/* Divider & Sign Out */}
          <div className="border-t border-slate-100 pt-1 mt-1" role="none">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-red-600 hover:bg-red-50 text-left font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={handleItemClick}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-blue-600 hover:bg-blue-50 text-left font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
