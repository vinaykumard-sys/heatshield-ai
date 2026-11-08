import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  MapPin, 
  ChevronDown, 
  Crosshair, 
  Check, 
  Search, 
  X, 
  Loader2, 
  PhoneCall, 
  Bell,
  Smartphone,
  Download 
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { useNotifications } from '../../context/NotificationContext';
import { mockDb } from '../../lib/mockDb';
import { LocationZone } from '../../types';
import { ProfileDropdown } from '../common/ProfileDropdown';

export interface AppHeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenEmergency?: () => void;
  onOpenDownload?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMobileSidebar,
  onOpenEmergency,
  onOpenDownload,
}) => {
  const { 
    currentLocation, 
    currentReading, 
    selectCustomLocality, 
    returnToDeviceLocation, 
    searchAndSetLocation, 
    isTracking, 
    selectedZone 
  } = useLocationTracker();

  const { unreadCount, setIsDrawerOpen } = useNotifications();

  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const wardDropdownRef = useRef<HTMLDivElement>(null);

  // Available ward zones for the ward switcher
  const availableZones: LocationZone[] = mockDb.getLocations();

  // Close ward dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wardDropdownRef.current && !wardDropdownRef.current.contains(event.target as Node)) {
        setWardDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setWardDropdownOpen(false);
      }
    }

    if (wardDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [wardDropdownOpen]);

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

  const isKarnataka = (currentLocation?.state || '').toLowerCase().includes('karnataka');
  const helplineNum = isKarnataka ? '1070' : '1077';

  const currentLocalityName = currentLocation?.localityName || currentLocation?.locality || selectedZone?.name || 'Central Delhi';
  const currentCity = currentLocation?.city || 'Delhi';
  const currentTemperature = currentReading ? Math.round(currentReading.temperature_c) : 32;

  return (
    <header className="relative h-[72px] shrink-0 bg-white/90 backdrop-blur-xl border-b border-[#E9F0FA] px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-4 z-[1020] max-w-full overflow-hidden">
      
      {/* Left: Mobile Toggle & Ward Pin Switcher with GPS Status */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button 
          onClick={onOpenMobileSidebar}
          className="p-1.5 sm:p-2 -ml-1 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-[#EEF3FB] lg:hidden transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Location Pin Indicator with Ward Switcher Dropdown */}
        <div className="relative min-w-0" ref={wardDropdownRef}>
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
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#EEF3FB] hover:bg-[#E3EDFA] border border-[#E9F0FA] text-slate-800 transition-all cursor-pointer shadow-xs btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 max-w-[150px] xs:max-w-[210px] sm:max-w-none"
            title="Click to switch Delhi NCR Ward or Colony"
          >
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            
            <div className="text-left flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
              <span className="font-bold text-xs text-slate-800 tracking-tight truncate max-w-[70px] xs:max-w-[110px] sm:max-w-[150px] md:max-w-[180px]">
                {currentLocalityName}
              </span>
              <span className="text-slate-400 text-xs font-semibold hidden xs:inline">·</span>
              <span className="text-xs text-slate-500 font-medium truncate max-w-[50px] sm:max-w-[100px] hidden xs:inline">
                {currentCity}
              </span>
              <span className="text-slate-400 text-xs font-semibold">•</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white text-blue-700 shadow-2xs border border-blue-100 shrink-0">
                {currentTemperature}°C
              </span>

              {/* GPS Live Status Indicator */}
              <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 ml-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isTracking ? 'GPS Live' : 'Locality'}</span>
              </span>
            </div>

            <ChevronDown 
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                wardDropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`} 
            />
          </button>

          {/* Ward Switcher Dropdown Menu */}
          {wardDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-white ring-1 ring-slate-900/5 rounded-3xl border border-slate-100 shadow-2xl p-3 text-xs z-[1060] animate-dropdown-enter"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="ward-selector-button"
            >
              <div className="px-2 py-1.5 mb-1.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-800 text-xs">Switch Delhi NCR Ward</span>
                </div>
                <button
                  type="button"
                  onClick={handleReturnToDeviceLocation}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-full border border-blue-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3 text-blue-600" />
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
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
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Modern Search Bar matching reference ("Find your place...", pill input, soft search icon, clear button) */}
      <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center flex-1 max-w-md mx-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Find your place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#EEF3FB]/90 hover:bg-[#E8EFF9] focus:bg-white border border-[#E9F0FA] focus:border-blue-500 rounded-full pl-10 pr-9 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/15 transition-all shadow-xs"
        />
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3.5 pointer-events-none" />
        ) : searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Right Action Cluster: Download App, SOS, Notification Bell, and Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Prominent Download App Button - Hidden on mobile (< sm) because it's in the mobile drawer and dashboard */}
        <button
          type="button"
          onClick={onOpenDownload}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all duration-150 btn-press cursor-pointer border border-blue-500/20 shrink-0"
          title="Download HeatShield AI Android App"
          aria-label="Download HeatShield AI Android App"
        >
          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-100 shrink-0" />
          <span className="hidden md:inline">Download App</span>
          <span className="md:hidden text-[11px]">APK</span>
          <span className="hidden lg:inline-flex items-center text-[9px] font-extrabold uppercase bg-white/20 text-white px-1.5 py-0.2 rounded-full ml-0.5">
            v1.0
          </span>
        </button>

        {/* SOS Emergency Hotline Button (Pill Button) - Compact responsive design */}
        <button
          onClick={onOpenEmergency}
          className="sos-btn flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs tracking-wide shadow-md btn-press cursor-pointer shrink-0"
          title={`Immediate Heatstroke Emergency Assistance (Call ${helplineNum})`}
          aria-label={`Immediate Heatstroke Emergency Assistance (Call ${helplineNum})`}
        >
          <PhoneCall className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">SOS {helplineNum}</span>
          <span className="xs:hidden text-[11px] font-extrabold">SOS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5 hidden xs:inline-block" />
        </button>

        {/* Notification Bell with Unread Badge */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#EEF3FB] hover:bg-[#E2ECF9] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all duration-150 border border-[#E9F0FA] shadow-xs btn-press cursor-pointer shrink-0"
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center shadow-xs border-2 border-white animate-scale-in">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-5 w-px bg-[#E9F0FA] hidden sm:block mx-0.5" />

        {/* Profile Avatar with dropdown below avatar button */}
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
