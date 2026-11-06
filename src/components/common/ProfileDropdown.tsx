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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await logout();
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
    : 'R';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Avatar Button Trigger */}
      <button
        id="heatshield-profile-button"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User profile and account settings"
        className="flex items-center gap-2 p-1 sm:p-1.5 sm:pl-1.5 sm:pr-2.5 rounded-full bg-[#EEF3FB] hover:bg-[#E2ECF9] border border-[#E9F0FA] transition-all duration-150 shadow-xs btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-2 ring-white/80">
          {initials}
        </div>
        <div className="hidden sm:block text-left text-xs leading-none">
          <div className="font-bold text-slate-800 truncate max-w-[105px]">
            {user?.full_name?.split(' ')[0] || 'Resident'}
          </div>
          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white text-blue-600 border border-blue-100 shadow-2xs">
            {roleLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 hidden sm:block ml-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Anchor dropdown cleanly below the avatar button */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 z-50 rounded-3xl shadow-2xl border border-slate-100 bg-white ring-1 ring-slate-900/5 p-2 text-xs transition-all animate-dropdown-enter"
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
                  {user?.full_name || 'Resident User'}
                </p>
                <p className="text-slate-500 truncate text-[11px]">
                  {user?.email || 'resident@heatshield.gov.in'}
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

            {/* 3. Family Safety Circle */}
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

            {/* 4. App Settings */}
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

            {/* 5. Developer Diagnostics */}
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

          {/* Divider & 6. Sign Out */}
          <div className="border-t border-slate-100 pt-1 mt-1" role="none">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-red-600 hover:bg-red-50 text-left font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
