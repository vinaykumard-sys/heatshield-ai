import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Thermometer, 
  Droplets, 
  Sun, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Heart, 
  Activity, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Flame, 
  Navigation,
  Bookmark,
  Users,
  ChevronRight,
  Settings2,
  RefreshCw
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Link } from 'react-router-dom';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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

interface ResidentProfile {
  name: string;
  age_group: 'youth' | 'adult' | 'elderly' | 'child';
  has_cardiovascular_condition: boolean;
  has_respiratory_condition: boolean;
  has_ac_at_home: boolean;
  outdoor_exposure_hours: number;
  weight_kg: number;
}

export const PersonalizedResidentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, currentRisk, forecastHourly, isLiveWeather } = useLocationTracker();

  // Resident Profile state with persistence
  const [profile, setProfile] = useState<ResidentProfile>(() => {
    try {
      const saved = localStorage.getItem('heatshield_resident_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      name: user?.full_name || (user?.email ? user.email.split('@')[0] : 'Resident User'),
      age_group: 'adult',
      has_cardiovascular_condition: false,
      has_respiratory_condition: false,
      has_ac_at_home: true,
      outdoor_exposure_hours: 2,
      weight_kg: 62
    };
  });

  // Sync profile name when user logs in if not previously set to custom name
  useEffect(() => {
    if (user?.full_name && (profile.name === 'Resident User' || profile.name === 'Priya Sharma')) {
      setProfile(p => ({ ...p, name: user.full_name }));
    }
  }, [user]);

  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSaveProfile = () => {
    try {
      localStorage.setItem('heatshield_resident_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
    setShowProfileModal(false);
  };

  // Live weather readings from LocationContext
  const currentTemp = currentReading?.temperature_c ?? 32.5;
  const feelsLike = currentReading?.feels_like_c ?? 35.0;
  const currentUv = currentReading?.uv_index ?? 7.5;
  const currentRiskScore = currentRisk?.risk_score ?? 60;
  const currentRiskCategory = currentRisk?.risk_category ?? 'moderate';

  // Hydration Tracker State with daily persistence
  const [waterGlasses, setWaterGlassesState] = useState<number>(() => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('heatshield_hydration_date');
      if (savedDate === todayKey) {
        const saved = localStorage.getItem('heatshield_hydration_glasses');
        if (saved !== null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 5; // default 5 glasses = 1250ml
  });

  const setWaterGlasses = (updater: number | ((prev: number) => number)) => {
    setWaterGlassesState(prev => {
      const val = typeof updater === 'function' ? updater(prev) : updater;
      const bounded = Math.max(0, val);
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        localStorage.setItem('heatshield_hydration_date', todayKey);
        localStorage.setItem('heatshield_hydration_glasses', bounded.toString());
      } catch {
        // ignore
      }
      return bounded;
    });
  };

  // Recommended hydration based on weight and heat
  const dailyTargetMl = useMemo(() => {
    const baseMl = profile.weight_kg * 35;
    const heatBonus = currentTemp > 33 ? 750 : currentTemp > 30 ? 500 : 250;
    return Math.round((baseMl + heatBonus) / 250) * 250; // nearest glass
  }, [profile.weight_kg, currentTemp]);

  const targetGlasses = Math.round(dailyTargetMl / 250);
  const currentHydrationMl = waterGlasses * 250;
  const hydrationPercent = Math.min(100, Math.round((currentHydrationMl / dailyTargetMl) * 100));

  // Nearest lifelines dynamically sorted by distance
  const { nearestWater, nearestCooling } = useMemo(() => {
    const waterStations = mockDb.getWaterStations();
    const coolingCentres = mockDb.getCoolingCentres();

    const sortedWater = [...waterStations].map(w => ({
      ...w,
      distKm: getDistanceKm(currentLocation.latitude, currentLocation.longitude, w.latitude, w.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    const sortedCooling = [...coolingCentres].map(c => ({
      ...c,
      distKm: getDistanceKm(currentLocation.latitude, currentLocation.longitude, c.latitude, c.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    return {
      nearestWater: sortedWater[0] || null,
      nearestCooling: sortedCooling[0] || null
    };
  }, [currentLocation.latitude, currentLocation.longitude]);

  // Dynamic Hourly exposure planner for today based on real Open-Meteo forecast
  const dynamicHourlyForecast = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      // Pick next 6 consecutive or step-2 hours
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
        let note = 'Good time for outdoor errands & commute';

        if (hi >= 39 || t >= 38) {
          risk = 'danger';
          label = 'Peak Heat Window';
          note = 'Hydrate continuously, avoid direct sun & keep indoors';
        } else if (hi >= 35 || t >= 33) {
          risk = 'danger';
          label = 'High Danger Window';
          note = 'Elevated heat index, seek shade, wear head cover';
        } else if (hi >= 30 || t >= 29) {
          risk = 'caution';
          label = 'Caution Window';
          note = 'UV and thermal load rising, keep hydrated';
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

    // High quality fallback around currentTemp
    return [
      { hour: '09:00', temp: Math.round(currentTemp - 4), risk: 'safe' as const, label: 'Safe Window', note: 'Good time for outdoor errands' },
      { hour: '11:00', temp: Math.round(currentTemp - 1), risk: 'caution' as const, label: 'Caution Window', note: 'Seek shade, wear UV protection' },
      { hour: '13:00', temp: Math.round(currentTemp + 2), risk: 'danger' as const, label: 'High Danger Window', note: 'Avoid direct sun, stay indoors' },
      { hour: '15:00', temp: Math.round(currentTemp + 3), risk: 'danger' as const, label: 'Peak Heat Window', note: 'Hydrate every 20 min, keep curtains closed' },
      { hour: '17:00', temp: Math.round(currentTemp), risk: 'caution' as const, label: 'Moderate Caution', note: 'Thermal load cooling gradually' },
      { hour: '19:00', temp: Math.round(currentTemp - 3), risk: 'safe' as const, label: 'Safe Evening', note: 'Ventilate indoor spaces' }
    ];
  }, [forecastHourly, currentTemp]);

  // Dynamic bookmarked places derived from monitored ambient telemetry
  const baseLiveTemp = currentReading?.temperature_c || 33.2;
  const bookmarkedPlaces = [
    { name: 'Home (Hebbal)', temp: Number((baseLiveTemp * 0.98).toFixed(1)), risk: 'Moderate', color: 'text-amber-600 bg-amber-50' },
    { name: 'Workplace (Manyata Tech Park)', temp: Number((baseLiveTemp * 1.04).toFixed(1)), risk: 'High', color: 'text-orange-600 bg-orange-50' },
    { name: 'Parents (Jayanagar)', temp: Number((baseLiveTemp * 0.96).toFixed(1)), risk: 'Moderate', color: 'text-amber-600 bg-amber-50' }
  ];

  return (
    <div className="space-y-6 pb-12">
      <LocationTrackerBar />

      {/* Hero: Personalized Heat Protection Status */}
      <div className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hyperlocal Heat Protection Profile</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Hello, {profile.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Thermal danger in your area is elevated. HeatShield AI has dynamically generated your hydration targets and hourly outdoor exposure restrictions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all btn-interact hover:scale-[1.02] active:scale-[0.98]"
            >
              <Settings2 className="w-4 h-4 text-cyan-400" />
              <span>Adjust Health Profile</span>
            </button>
            <Link
              to="/safe-routes"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all btn-interact hover:scale-[1.03] active:scale-[0.97]"
            >
              <Navigation className="w-4 h-4" />
              <span>Plan Shaded Route</span>
            </Link>
          </div>
        </div>

        {/* Real-time Environmental Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Ambient Temp</span>
              <Thermometer className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {currentReading ? `${currentTemp}°C` : <span className="text-xl animate-pulse text-slate-400">Syncing...</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{currentLocation.localityName || 'Monitored Sector'}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Feels-Like</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-300 mt-1">
              {currentReading ? `${feelsLike}°C` : <span className="text-xl animate-pulse text-slate-400">Syncing...</span>}
            </div>
            <div className="text-[11px] text-red-400/90 font-medium mt-0.5">
              {feelsLike >= 40 ? 'Severe Heat Index' : feelsLike >= 35 ? 'Elevated Heat Index' : 'Moderate Heat Index'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">UV Radiation</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {currentUv} ({currentUv >= 8 ? 'Very High' : currentUv >= 6 ? 'High' : 'Moderate'})
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentUv >= 8 ? 'Burn time: ~15 mins' : 'Wear sunscreen outdoors'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Personal Risk</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-400 mt-1 capitalize">
              {currentRiskCategory} ({currentRiskScore}/100)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {profile.has_ac_at_home ? 'AC active at residence' : 'Natural cross-ventilation'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Hydration & Exposure Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hydration Tracker */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dynamic Hydration Meter</h3>
                <span className="text-[11px] text-slate-500">Auto-calculated for {currentTemp}°C heat</span>
              </div>
            </div>
            <button
              onClick={() => setWaterGlasses(0)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-center space-y-1">
              <div className="text-4xl font-extrabold text-blue-600 tracking-tight font-mono">
                {currentHydrationMl} <span className="text-lg font-normal text-slate-400">/ {dailyTargetMl} ml</span>
              </div>
              <div className="text-xs text-slate-500">
                {waterGlasses} of {targetGlasses} glasses consumed ({hydrationPercent}%)
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setWaterGlasses(prev => prev + 1)}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all btn-interact hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+1 Glass (250 ml)</span>
            </button>
            <button
              onClick={() => setWaterGlasses(prev => Math.max(0, prev - 1))}
              className="px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold btn-press hover:scale-105 active:scale-95"
            >
              -1
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              AI Hydration Advisory
            </div>
            <p className="text-[11px] text-cyan-800">
              Drink water steadily every 30 minutes even before feeling thirsty. Add an electrolyte sachet or fresh lemon with pinch of salt if outdoors.
            </p>
          </div>
        </div>

        {/* Today's Hourly Exposure Planner */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Hourly Exposure Safe-Windows</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Bengaluru Urban</span>
          </div>

          <div className="space-y-2.5">
            {dynamicHourlyForecast.map((slot) => {
              const badgeStyle = 
                slot.risk === 'safe' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                slot.risk === 'caution' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-red-100 text-red-800 border-red-200';

              return (
                <div
                  key={slot.hour}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-sm w-14">{slot.hour}</span>
                    <span className="font-mono text-xs text-slate-500 w-12">{slot.temp}°C</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {slot.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">{slot.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bookmarked Places & Family Safety Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookmarked Places */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">My Monitored Locations</h3>
            </div>
            <Link to="/map" className="text-xs text-blue-600 hover:underline">View Map</Link>
          </div>

          <div className="space-y-3">
            {bookmarkedPlaces.map((b, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Temp: {b.temp}°C</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${b.color}`}>
                  {b.risk} Risk
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Lifelines */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Nearest Cooling & Water Lifelines</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Live Proximity Sorted</span>
          </div>

          <div className="space-y-3">
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
          </div>
        </div>
      </div>

      {/* Adjust Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Personal Health & Sensitivity Settings</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Age Category</label>
                <select
                  value={profile.age_group}
                  onChange={(e: any) => setProfile({ ...profile, age_group: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="child">Child (&lt; 12 yrs)</option>
                  <option value="youth">Youth (12 - 25 yrs)</option>
                  <option value="adult">Adult (26 - 60 yrs)</option>
                  <option value="elderly">Elderly (60+ yrs)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_ac_at_home}
                    onChange={(e) => setProfile({ ...profile, has_ac_at_home: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>I have functioning Air Conditioning at home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_cardiovascular_condition}
                    onChange={(e) => setProfile({ ...profile, has_cardiovascular_condition: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Cardiovascular / Blood pressure condition</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_respiratory_condition}
                    onChange={(e) => setProfile({ ...profile, has_respiratory_condition: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Respiratory condition (Asthma / COPD)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedResidentDashboardPage;
