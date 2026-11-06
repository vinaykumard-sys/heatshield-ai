import React, { useState } from 'react';
import { 
  Navigation, 
  Search,
  RefreshCw,
  MapPin,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { formatTimeAgo } from '../../lib/utils';

export const LocationTrackerBar: React.FC = () => {
  const { 
    currentLocation, 
    deviceLocation,
    isAnalyzingDifferentLocation,
    returnToDeviceLocation,
    currentReading, 
    currentRisk, 
    isTracking, 
    trackingError, 
    detectLocation, 
    searchAndSetLocation,
    isLiveWeather,
    lastSyncTime,
    forceTelemetryRefresh
  } = useLocationTracker();

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    await searchAndSetLocation(searchInput.trim());
    setSearchInput('');
    setIsSearching(false);
  };

  const formattedSyncTime = lastSyncTime ? formatTimeAgo(lastSyncTime.toISOString()) : 'Just now';

  return (
    <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Location indicator & status */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 truncate">
                {currentLocation.localityName || currentLocation.city}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentLocation.city}, {currentLocation.state}
              </span>

              {/* Friendly status pill */}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{currentLocation.isRealDeviceLocation ? 'Live location' : 'Selected area'}</span>
              </span>

              <span className="text-[11px] text-slate-400">
                Updated {formattedSyncTime}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {currentLocation.isRealDeviceLocation 
                ? 'Showing hyperlocal heat conditions for your current position' 
                : 'Showing conditions for this selected neighborhood'}
            </p>
          </div>
        </div>

        {/* Right: Search locality & Detect my GPS */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search area or PIN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none input-interactive"
            />
          </form>

          {isAnalyzingDifferentLocation && (
            <button
              onClick={returnToDeviceLocation}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-[#1E60F2] text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0 btn-press"
            >
              My location
            </button>
          )}

          <button
            onClick={() => detectLocation()}
            disabled={isTracking}
            className="px-3 py-1.5 rounded-xl border border-[#E5EDF5] bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0 flex items-center gap-1.5 btn-press"
            title="Detect GPS"
          >
            <Compass className={`w-3.5 h-3.5 text-[#1E60F2] ${isTracking ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isTracking ? 'Locating...' : 'Find me'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-[#E5EDF5] bg-white text-slate-500 hover:text-[#1E60F2] hover:bg-slate-50 transition-colors shrink-0 btn-press disabled:opacity-50"
            title="Refresh weather"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {trackingError && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <span>{trackingError}</span>
        </div>
      )}
    </div>
  );
};

export default LocationTrackerBar;
