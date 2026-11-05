import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Navigation,
  PhoneCall,
  Sun,
  Clock,
  Heart,
  Stethoscope,
  Info,
  ShieldAlert,
  Send
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { EmergencyModal } from '../components/common/EmergencyModal';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLocation,
    currentReading, 
    currentRisk, 
    forecastHourly, 
    forecastDaily,
    isLiveWeather,
    selectedZone,
    selectCustomLocality,
    forceTelemetryRefresh,
    lastSyncTime
  } = useLocationTracker();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const locations = mockDb.getLocations();
  const smartAlerts = mockDb.getSmartAlerts();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const currentTemp = currentReading?.temperature_c ?? 32.5;
  const feelsLike = currentReading?.feels_like_c ?? 35.0;
  const currentHumidity = currentReading?.relative_humidity_pct ?? 55.0;
  const currentUv = currentReading?.uv_index ?? 7.5;
  const riskScore = currentRisk?.risk_score ?? 58;
  const riskCategory = currentRisk?.risk_category ?? 'moderate';

  // 1. Peak Heat Window
  const peakHeatPeriod = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      const highest = [...forecastHourly].sort((a, b) => (b.heat_index_c || b.temperature_c) - (a.heat_index_c || a.temperature_c))[0];
      if (highest) {
        return `${highest.time || '13:00'} (${highest.temperature_c}°C Peak Stress)`;
      }
    }
    return '12:30 PM - 03:30 PM (Midday Solar Peak)';
  }, [forecastHourly]);

  // 2. Actionable Plain-Language Daily Heat Briefing
  const dailyBriefing = useMemo(() => {
    if (riskCategory === 'critical' || feelsLike >= 42) {
      return 'CRITICAL HEATWAVE ALERT: Dangerous thermal conditions detected in your sector. Stay indoors in shaded or cooled rooms. Hydrate every 15-20 minutes with water or electrolyte solution. Avoid direct sunlight and unshaded transit.';
    }
    if (riskCategory === 'high' || feelsLike >= 38) {
      return 'HIGH HEAT DANGER ADVISORY: Thermal stress is elevated. Limit unshaded outdoor errands between 11:30 AM and 4:00 PM. Drink water continuously before feeling thirsty and seek shaded walking corridors.';
    }
    if (riskCategory === 'moderate' || feelsLike >= 33) {
      return 'MODERATE HEAT INDEX: Elevated daytime warmth with strong solar UV. Wear lightweight breathable clothing, stay hydrated throughout the day, and protect vulnerable children and elderly family members.';
    }
    return 'FAVOURABLE CONDITIONS: Thermal conditions in your monitored zone are within the normal seasonal baseline. Safe for outdoor errands. Maintain routine hydration.';
  }, [riskCategory, feelsLike]);

  // 3. Proximity Sorted Lifelines (Water, Cooling, Hospital)
  const { nearestWater, nearestCooling, nearestHospital } = useMemo(() => {
    const lat = currentLocation?.latitude || selectedZone?.latitude || 13.0854;
    const lon = currentLocation?.longitude || selectedZone?.longitude || 77.6250;

    const waterStations = mockDb.getWaterStations();
    const coolingCentres = mockDb.getCoolingCentres();
    const hospitals = mockDb.getHospitals();

    const sortedWater = [...waterStations].map(w => ({
      ...w,
      distKm: getDistanceKm(lat, lon, w.latitude, w.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    const sortedCooling = [...coolingCentres].map(c => ({
      ...c,
      distKm: getDistanceKm(lat, lon, c.latitude, c.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    const sortedHospitals = [...hospitals].map(h => ({
      ...h,
      distKm: getDistanceKm(lat, lon, h.latitude, h.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    return {
      nearestWater: sortedWater[0] || null,
      nearestCooling: sortedCooling[0] || null,
      nearestHospital: sortedHospitals[0] || null
    };
  }, [currentLocation, selectedZone]);

  // 4. Dynamic Hourly Safe-Windows (Next 6 Windows)
  const hourlySafeWindows = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      const step = forecastHourly.length >= 10 ? 2 : 1;
      const sample = [];
      for (let i = 0; i < forecastHourly.length && sample.length < 6; i += step) {
        sample.push(forecastHourly[i]);
      }

      return sample.map(slot => {
        const t = slot.temperature_c;
        const hi = slot.heat_index_c || t;
        let risk: 'safe' | 'caution' | 'danger' = 'safe';
        let label = 'Safe Window';
        let note = 'Good for outdoor errands';

        if (hi >= 39 || t >= 38) {
          risk = 'danger';
          label = 'Peak Heat Window';
          note = 'Stay indoors, continuous hydration';
        } else if (hi >= 35 || t >= 33) {
          risk = 'danger';
          label = 'High Danger Window';
          note = 'Elevated index, seek tree shade';
        } else if (hi >= 30 || t >= 29) {
          risk = 'caution';
          label = 'Caution Window';
          note = 'UV rising, keep water bottle';
        }

        return {
          hour: slot.time || '12:00',
          temp: t,
          risk,
          label,
          note
        };
      });
    }

    return [
      { hour: '09:00', temp: Math.round(currentTemp - 4), risk: 'safe' as const, label: 'Safe Window', note: 'Good time for morning errands' },
      { hour: '11:00', temp: Math.round(currentTemp - 1), risk: 'caution' as const, label: 'Caution Window', note: 'Wear sun protection' },
      { hour: '13:00', temp: Math.round(currentTemp + 2), risk: 'danger' as const, label: 'High Danger Window', note: 'Avoid unshaded midday sun' },
      { hour: '15:00', temp: Math.round(currentTemp + 3), risk: 'danger' as const, label: 'Peak Heat Window', note: 'Thermal load cooling gradually' },
      { hour: '17:00', temp: Math.round(currentTemp), risk: 'caution' as const, label: 'Moderate Caution', note: 'Evening breeze setting in' },
      { hour: '19:00', temp: Math.round(currentTemp - 3), risk: 'safe' as const, label: 'Safe Evening', note: 'Favourable for walking' }
    ];
  }, [forecastHourly, currentTemp]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Emergency Modal */}
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />

      {/* Hyperlocal Location Command Bar */}
      <LocationTrackerBar />

      {/* 5-SECOND RESIDENT HEAT BRIEFING HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            {/* 5-SECOND SAFETY VERDICT PILL */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-md ${
                riskCategory === 'critical' ? 'bg-red-500/20 text-red-200 border-red-400/50' :
                riskCategory === 'high' ? 'bg-orange-500/20 text-orange-200 border-orange-400/50' :
                riskCategory === 'moderate' ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' :
                'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  riskCategory === 'critical' ? 'bg-red-400 animate-ping' :
                  riskCategory === 'high' ? 'bg-orange-400 animate-pulse' :
                  riskCategory === 'moderate' ? 'bg-amber-400' :
                  'bg-emerald-400'
                }`} />
                <span>
                  {riskCategory === 'critical' ? 'Critical Heat Emergency' :
                   riskCategory === 'high' ? 'High Heat Danger' :
                   riskCategory === 'moderate' ? 'Moderate Heat Advisory' :
                   'Safe Right Now'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
                📍 {currentLocation.localityName || selectedZone?.name || 'Monitored Ward'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Hello, {user?.full_name || 'Resident'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
              {dailyBriefing}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Peak Period: <strong className="text-white">{peakHeatPeriod}</strong></span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span>Last Updated: <strong className="text-slate-300">{lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Refresh & Locality Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) selectCustomLocality(found);
              }}
              className="bg-white/10 text-white border border-white/20 rounded-2xl px-3.5 py-2.5 text-xs font-semibold backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-slate-900">
                  📍 {loc.name} ({loc.city})
                </option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 btn-interact hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Check Live Weather</span>
            </button>
          </div>
        </div>

        {/* 4 CORE ENVIRONMENTAL CONDITIONS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
              <span>Current Air Temp</span>
              <Thermometer className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {currentReading ? `${currentTemp}°C` : <span className="text-xl animate-pulse text-slate-400">Syncing...</span>}
            </div>
            <div className="text-[11px] text-slate-400 truncate">Shaded Air Temperature</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
              <span>Real-Feel Index</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">
              {currentReading ? `${feelsLike}°C` : <span className="text-xl animate-pulse text-slate-400">Syncing...</span>}
            </div>
            <div className="text-[11px] text-red-300 font-medium truncate">
              {feelsLike >= 40 ? 'Severe Heat Index' : feelsLike >= 35 ? 'Elevated Heat Index' : 'Moderate Heat Index'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
              <span>Relative Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{currentHumidity}%</div>
            <div className="text-[11px] text-slate-400 truncate">Moisture & Sweat Factor</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
              <span>Safety Category</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-400 font-mono capitalize">
              {riskCategory} <span className="text-sm font-normal text-slate-400">({riskScore}/100)</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Official Safety Level</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (1-Tap Resident Lifelines) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Resident Quick Actions & Emergency Lifelines
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">1-Tap Direct Navigation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            to="/water-stations"
            className="p-3 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900 flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Find Water ATM</span>
            <span className="text-[10px] text-blue-600 font-mono">Free Drinking</span>
          </Link>

          <Link
            to="/cooling-centres"
            className="p-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Cooling Shelters</span>
            <span className="text-[10px] text-emerald-600 font-mono">Air-Conditioned</span>
          </Link>

          <Link
            to="/hospital-directory"
            className="p-3 rounded-2xl border border-red-100 bg-red-50/50 hover:bg-red-100/60 text-red-900 flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Heatstroke ICU</span>
            <span className="text-[10px] text-red-600 font-mono">Hospitals</span>
          </Link>

          <Link
            to="/safe-routes"
            className="p-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-100/60 text-cyan-900 flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
              <Navigation className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Shaded Route</span>
            <span className="text-[10px] text-cyan-700 font-mono">Canopy Transit</span>
          </Link>

          <Link
            to="/requests"
            className="p-3 rounded-2xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Request Aid</span>
            <span className="text-[10px] text-purple-600 font-mono">Water/Transport</span>
          </Link>

          <button
            onClick={() => setIsEmergencyOpen(true)}
            className="p-3 rounded-2xl border border-rose-200 bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center text-center gap-1.5 transition-all btn-interact hover:scale-[1.02] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-xs font-bold">Emergency SOS</span>
            <span className="text-[10px] text-rose-100 font-mono">112 / 108 Hotline</span>
          </button>
        </div>
      </div>

      {/* ACTIVE LOCAL ALERTS OR VERIFIED EMPTY STATE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Active Heat Warnings & Bulletins</h3>
          </div>
          <Link to="/alerts" className="text-xs text-blue-600 hover:underline">
            View All Advisories
          </Link>
        </div>

        {smartAlerts.length > 0 ? (
          <div className="space-y-2.5">
            {smartAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                      {alert.severity}
                    </span>
                    <strong className="text-slate-900 font-bold">{alert.headline}</strong>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {alert.description}
                  </p>
                </div>
                <Link
                  to="/alerts"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm text-center"
                >
                  Read Actions
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No severe heatwave warnings currently active in your monitored sector. Conditions are within normal seasonal range.</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              NORMAL
            </span>
          </div>
        )}
      </div>

      {/* NEAREST LIFELINES & TODAY'S HOURLY EXPOSURE PLANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nearest Lifelines (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Nearest Verified Lifelines</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Proximity Sorted</span>
          </div>

          <div className="space-y-3">
            {/* Water ATM */}
            {nearestWater && (
              <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/40 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-700 uppercase font-bold">Nearest Water ATM</span>
                    {nearestWater.distKm !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {formatDistance(nearestWater.distKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">{nearestWater.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{nearestWater.address}</span>
                </div>
                <Link
                  to="/water-stations"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Locate
                </Link>
              </div>
            )}

            {/* Cooling Sanctuary */}
            {nearestCooling && (
              <div className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold">Nearest Cooling Sanctuary</span>
                    {nearestCooling.distKm !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {formatDistance(nearestCooling.distKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">{nearestCooling.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{nearestCooling.address}</span>
                </div>
                <Link
                  to="/cooling-centres"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  View
                </Link>
              </div>
            )}

            {/* Hospital with Heatstroke Ward */}
            {nearestHospital && (
              <div className="p-3.5 rounded-2xl border border-red-100 bg-red-50/40 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-red-700 uppercase font-bold">Nearest Heatstroke ICU</span>
                    {nearestHospital.distKm !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                        {formatDistance(nearestHospital.distKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">{nearestHospital.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{nearestHospital.address}</span>
                </div>
                <Link
                  to="/hospital-directory"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm"
                >
                  Direct
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Today's Hourly Exposure Planner (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Hourly Safe-Windows</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Open-Meteo High-Res</span>
          </div>

          <div className="space-y-2.5">
            {hourlySafeWindows.map((slot) => {
              const badgeStyle = 
                slot.risk === 'safe' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                slot.risk === 'caution' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-red-100 text-red-800 border-red-200';

              return (
                <div
                  key={slot.hour}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-sm w-14">{slot.hour}</span>
                    <span className="font-mono text-xs text-slate-500 w-12">{slot.temp}°C</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {slot.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600">{slot.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTERACTIVE MAP PREVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Interactive Neighbourhood Heat Map</h3>
            <span className="text-xs text-slate-400 hidden sm:inline">• Live Water ATMs & Cooling Sanctuaries</span>
          </div>
          <Link to="/map" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
            <span>Open Full Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <HeatRiskMap 
          locations={locations} 
          selectedLocationId={selectedZone?.id} 
          onSelectLocation={selectCustomLocality}
          className="h-[440px] rounded-3xl" 
        />
      </div>

      {/* 7-DAY WARD HEAT OUTLOOK */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">7-Day Ward Heat Outlook</h3>
            <p className="text-xs text-slate-500">Predicted daily high/low temperatures & heatwave alert level</p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {forecastDaily.map((day, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5 cursor-default hover:border-slate-300 transition-colors"
            >
              <span className="text-[11px] font-mono font-semibold text-slate-500 block truncate">{day.date}</span>
              <div className="text-base font-bold text-slate-900 font-mono">{day.max_temp_c}°C</div>
              <div className="text-xs text-slate-400 font-mono">Min {day.min_temp_c}°C</div>
              <div className="pt-1">
                <RiskBadge category={day.risk_level} size="sm" showPulse={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
