import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  HeartPulse, 
  HelpCircle, 
  BarChart3, 
  Settings, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  LogIn,
  Home,
  UserCheck,
  PhoneCall,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { RoleSwitcherPill } from '../common/RoleSwitcherPill';
import { BrandLogo } from '../common/BrandLogo';
import { EmergencyModal } from '../common/EmergencyModal';
import { useLocationTracker } from '../../context/LocationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isVolunteer, isResident } = useAuth();
  const { t } = useLanguage();
  const { currentLocation } = useLocationTracker();
  const { unreadCount, setIsDrawerOpen } = useNotifications();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const isKarnataka = (currentLocation?.state || '').toLowerCase().includes('karnataka');
  const helplineNum = isKarnataka ? '1070' : '1077';

  const navLinks = [
    { to: '/', label: t('navHome'), icon: Home, public: true },
    { to: '/dashboard', label: t('navDashboard'), icon: BarChart3, public: true },
    { to: '/map', label: t('navMap'), icon: MapPin, public: true },
    { to: '/residents', label: t('navResidents'), icon: Users, show: isVolunteer || isAdmin },
    { to: '/checkins', label: t('navCheckins'), icon: HeartPulse, show: isVolunteer || isAdmin },
    { to: '/requests', label: t('navRequests'), icon: HelpCircle, public: true },
    { to: '/portal', label: t('navPortal'), icon: UserCheck, show: isResident || !isAuthenticated },
    { to: '/admin', label: t('navAdmin'), icon: Settings, show: isAdmin },
    { to: '/analytics', label: t('navAnalytics'), icon: BarChart3, public: true },
  ];

  const visibleLinks = navLinks.filter(l => l.public || l.show);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-obsidian-950/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Redesigned Brand Logo */}
            <Link to="/" className="flex items-center group py-2">
              <BrandLogo size="md" showBadge={true} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 bg-obsidian-900/80 p-1 rounded-2xl border border-white/[0.06]">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/[0.1] text-white shadow-sm ring-1 ring-white/10 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons & Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Emergency Hotline Direct Button */}
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Direct Emergency Hotline"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SOS ({helplineNum})</span>
                <span className="sm:hidden font-mono">{helplineNum}</span>
              </button>

              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* Quick Role Switcher Pill */}
              <RoleSwitcherPill />

              {/* Notification Drawer Trigger */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
                title="Community Notifications"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-obsidian-950 rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Auth Action */}
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">{t('navLogout')}</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-obsidian-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  <LogIn className="w-3.5 h-3.5 text-obsidian-950" />
                  <span>{t('navLogin')}</span>
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Navigation */}
          {mobileMenuOpen && (
            <div className="xl:hidden py-4 border-t border-white/[0.08] space-y-3 animate-in slide-in-from-top-2">
              <div className="pb-3 border-b border-white/[0.08] flex justify-between items-center sm:hidden">
                <LanguageSelector />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian-900 border border-white/[0.08] text-xs font-semibold text-rose-400"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('navLogout')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </>
  );
};
