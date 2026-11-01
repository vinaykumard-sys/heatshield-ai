import React, { useState } from 'react';
import { 
  Navigation, 
  AlertTriangle, 
  PhoneCall, 
  Search,
  RefreshCw
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { EmergencyModal } from './EmergencyModal';
import { RiskBadge } from './RiskBadge';

export const LocationTrackerBar: React.FC = () => {
  const { 
    currentLocation, 
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

  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    await searchAndSetLocation(searchInput.trim());
    setIsSearching(false);
  };

  // Determine emergency helpline based on state
  const isKarnataka = currentLocation.state.toLowerCase().includes('karnataka');
  const helplineNumber = isKarnataka ? '1070' : '1077';

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Main Location & Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Location Title & Coordinates */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-2.5 rounded-lg shrink-0 transition-all ${
              currentLocation.isRealDeviceLocation
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <Navigation className={`w-5 h-5 ${isTracking ? 'animate-spin text-blue-600' : ''}`} />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {isTracking ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Acquiring Device Position...
                  </span>
                ) : currentLocation.locationSource === 'gps' ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Device GPS Fix
                  </span>
                ) : currentLocation.locationSource === 'ip' ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    City IP Geolocation
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {currentLocation.locationSource === 'search' ? 'Searched Locality' : 'Default Ward Baseline'}
                  </span>
                )}
                
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                  isLiveWeather 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isLiveWeather ? 'LIVE METEO TELEMETRY' : 'OFFLINE SIMULATED'}
                </span>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title="Telemetry automatically updates every 5 minutes in real time. Click to sync immediately."
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Auto-sync: 5m</span>
                </button>

                {currentLocation.pincode && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    PIN {currentLocation.pincode}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {currentLocation.localityName}
                </h2>
                <span className="text-xs sm:text-sm font-medium text-slate-500">
                  {currentLocation.city}, {currentLocation.state}
                </span>
              </div>

              {currentLocation.subArea && (
                <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Zone: <strong className="text-slate-700 font-medium">{currentLocation.subArea}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {currentLocation.latitude.toFixed(4)}°N, {currentLocation.longitude.toFixed(4)}°E
                  </span>
                  {currentLocation.accuracyMeters && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ±{currentLocation.accuracyMeters}m accuracy
                    </span>
                  )}
                </p>
              )}

              {trackingError && (
                <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5 mt-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{trackingError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Real-time Environmental Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentReading && (
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">Temp</span>
                  <span className="text-base font-bold text-slate-900 font-mono">{currentReading.temperature_c}°C</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">Humidity</span>
                  <span className="text-base font-bold text-blue-600 font-mono">{currentReading.relative_humidity_pct}%</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">Feels Like</span>
                  <span className="text-base font-bold text-orange-600 font-mono">{currentReading.feels_like_c}°C</span>
                </div>
                {currentRisk && (
                  <div className="pl-1 border-l border-slate-200">
                    <RiskBadge category={currentRisk.risk_category} score={currentRisk.risk_score} size="md" />
                  </div>
                )}
              </div>
            )}

            {/* Emergency Hotline Button */}
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS Helpline ({helplineNumber})</span>
            </button>
          </div>
        </div>

        {/* Hyperlocal Road / Area Search & GPS Trigger Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Instant Address / Road Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search any road/colony (e.g. Chokkanahalli, Bengaluru)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shrink-0 shadow-sm"
            >
              {isSearching ? 'Locating...' : 'Set Area'}
            </button>
          </form>

          {/* Quick Buttons: GPS Auto-Fix & Preset Bengaluru Spots */}
          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            <button
              onClick={detectLocation}
              disabled={isTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors whitespace-nowrap shadow-sm"
            >
              <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isTracking ? 'animate-spin' : ''}`} />
              <span>{isTracking ? 'Detecting GPS...' : 'Detect Device GPS'}</span>
            </button>

            <span className="text-slate-300 hidden md:inline">|</span>

            {/* Quick Bengaluru Shortcuts */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-slate-400">Quick:</span>
              <button
                type="button"
                onClick={() => searchAndSetLocation('Chokkanahalli Road, Bengaluru')}
                className="hover:text-blue-600 transition-colors font-medium hover:underline"
              >
                Chokkanahalli
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => searchAndSetLocation('Yelahanka, Bengaluru')}
                className="hover:text-blue-600 transition-colors font-medium hover:underline"
              >
                Yelahanka
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => searchAndSetLocation('Indiranagar, Bengaluru')}
                className="hover:text-blue-600 transition-colors font-medium hover:underline"
              >
                Indiranagar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </>
  );
};
