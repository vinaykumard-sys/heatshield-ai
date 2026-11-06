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
  RefreshCw,
  Minus
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Link } from 'react-router-dom';

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

  const [profile, setProfile] = useState<ResidentProfile>(() => {
    try {
      const saved = localStorage.getItem('heatshield_resident_profile');
      if (saved) return JSON.parse(saved);
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

  const currentTemp = currentReading?.temperature_c ?? 32.5;
  const feelsLike = currentReading?.feels_like_c ?? 35.0;
  const currentUv = currentReading?.uv_index ?? 7.5;
  const currentRiskScore = currentRisk?.risk_score ?? 60;
  const currentRiskCategory = currentRisk?.risk_category ?? 'moderate';

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
    return 5;
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

  const dailyTargetMl = useMemo(() => {
    const baseMl = profile.weight_kg * 35;
    const heatBonus = currentTemp > 33 ? 750 : currentTemp > 30 ? 500 : 250;
    return Math.round((baseMl + heatBonus) / 250) * 250;
  }, [profile.weight_kg, currentTemp]);

  const targetGlasses = Math.round(dailyTargetMl / 250);
  const currentHydrationMl = waterGlasses * 250;
  const hydrationPercent = Math.min(100, Math.round((currentHydrationMl / dailyTargetMl) * 100));

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

  const dynamicHourlyForecast = useMemo(() => {
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
        let note = 'Good time for outdoor errands & commute';

        if (hi >= 39 || t >= 38) {
          risk = 'danger';
          label = 'Peak Heat Window';
          note = 'Hydrate continuously, stay in shaded or cooled rooms';
        } else if (hi >= 35 || t >= 33) {
          risk = 'danger';
          label = 'High Heat Window';
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

    return [
      { hour: '09:00', temp: Math.round(currentTemp - 4), risk: 'safe' as const, label: 'Safe Window', note: 'Good time for outdoor errands' },
      { hour: '11:00', temp: Math.round(currentTemp - 1), risk: 'caution' as const, label: 'Caution Window', note: 'Seek shade, wear UV protection' },
      { hour: '13:00', temp: Math.round(currentTemp + 2), risk: 'danger' as const, label: 'High Heat Window', note: 'Avoid direct sun, stay indoors' },
      { hour: '15:00', temp: Math.round(currentTemp + 3), risk: 'danger' as const, label: 'Peak Heat Window', note: 'Hydrate every 20 min, keep curtains closed' },
      { hour: '17:00', temp: Math.round(currentTemp), risk: 'caution' as const, label: 'Moderate Caution', note: 'Thermal load cooling gradually' },
      { hour: '19:00', temp: Math.round(currentTemp - 3), risk: 'safe' as const, label: 'Safe Evening', note: 'Ventilate indoor spaces' }
    ];
  }, [forecastHourly, currentTemp]);

  const baseLiveTemp = currentReading?.temperature_c || 33.2;
  const bookmarkedPlaces = [
    { name: 'Home (Hebbal)', temp: Number((baseLiveTemp * 0.98).toFixed(1)), risk: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { name: 'Workplace (Manyata)', temp: Number((baseLiveTemp * 1.04).toFixed(1)), risk: 'High', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    { name: 'Family (Jayanagar)', temp: Number((baseLiveTemp * 0.96).toFixed(1)), risk: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' }
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Hero: Personalized Heat Protection Status */}
      <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1E60F2] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Personal Safety Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Personal Heat Overview for {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Real-time thermal monitoring active in your area. Hydration targets and outdoor exposure guidance tailored to your health sensitivity.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5EDF5] text-slate-700 text-xs font-semibold transition-colors btn-press shadow-xs"
            >
              <Settings2 className="w-4 h-4 text-[#1E60F2]" />
              <span>Sensitivity Settings</span>
            </button>
            <Link
              to="/safe-routes"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors btn-press"
            >
              <Navigation className="w-4 h-4" />
              <span>Safe Routes</span>
            </Link>
          </div>
        </div>

        {/* Real-time Environmental Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100">
          <div className="bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Ambient Temp</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {currentReading ? `${currentTemp}°C` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{currentLocation.localityName || 'Your neighborhood'}</div>
          </div>

          <div className="bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Feels-Like</span>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {currentReading ? `${feelsLike}°C` : '--'}
            </div>
            <div className="text-[11px] text-orange-600 font-semibold truncate">
              {feelsLike >= 40 ? 'Severe heat index' : feelsLike >= 35 ? 'Elevated heat index' : 'Moderate heat'}
            </div>
          </div>

          <div className="bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>UV Index</span>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {currentUv}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {currentUv >= 8 ? 'Very high' : currentUv >= 6 ? 'High' : 'Moderate'}
            </div>
          </div>

          <div className="bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Personal Risk</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E60F2]" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 capitalize">
              {currentRiskCategory}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Score: {currentRiskScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Hydration & Exposure Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hydration Tracker */}
        <div className="lg:col-span-5 bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hydration Tracker</h3>
                <span className="text-[11px] text-slate-500">Target for {currentTemp}°C heat</span>
              </div>
            </div>
            <button
              onClick={() => setWaterGlasses(0)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="text-center space-y-0.5">
              <div className="text-4xl font-extrabold text-[#1E60F2] font-sans">
                {currentHydrationMl} <span className="text-base font-semibold text-slate-400">/ {dailyTargetMl} ml</span>
              </div>
              <div className="text-xs text-slate-500">
                {waterGlasses} of {targetGlasses} glasses ({hydrationPercent}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-[#E5EDF5]">
              <div
                className="bg-[#1E60F2] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWaterGlasses(prev => prev + 1)}
              className="flex-1 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>+1 Glass (250 ml)</span>
            </button>
            <button
              onClick={() => setWaterGlasses(prev => Math.max(0, prev - 1))}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] hover:bg-slate-50 text-slate-600 text-xs font-semibold btn-press transition-colors"
              title="Remove 1 glass"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-[#1E60F2] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hydration Advice</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Drink water regularly every 30 minutes even before feeling thirsty. If spending prolonged time outdoors, take oral rehydration salts or natural coconut water.
            </p>
          </div>
        </div>

        {/* Today's Hourly Exposure Planner */}
        <div className="lg:col-span-7 bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Outdoor Activity Safe-Windows</h3>
                <p className="text-[11px] text-slate-500">Plan when to go outside and when to stay in shade</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">Today</span>
          </div>

          <div className="space-y-2">
            {dynamicHourlyForecast.map((slot) => {
              const badgeStyle = 
                slot.risk === 'safe' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                slot.risk === 'caution' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200';

              return (
                <div
                  key={slot.hour}
                  className="p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 w-14">{slot.hour}</span>
                    <span className="text-slate-500 w-12">{slot.temp}°C</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {slot.label}
                    </span>
                  </div>
                  <span className="text-slate-600 text-[11px]">{slot.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bookmarked Places & Nearest Lifelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookmarked Places */}
        <div className="lg:col-span-6 bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#1E60F2]" />
              <h3 className="text-sm font-bold text-slate-900">Monitored Locations</h3>
            </div>
            <Link to="/map" className="text-xs text-[#1E60F2] font-semibold hover:underline">View Map</Link>
          </div>

          <div className="space-y-2.5">
            {bookmarkedPlaces.map((b, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{b.name}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Temperature: {b.temp}°C
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${b.color}`}>
                  {b.risk} Risk
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Lifelines */}
        <div className="lg:col-span-6 bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Nearest Relief Points</h3>
            </div>
            <span className="text-xs text-slate-400">Live proximity</span>
          </div>

          <div className="space-y-2.5">
            {nearestWater && (
              <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#1E60F2] uppercase font-bold">Water ATM</span>
                    {nearestWater.distKm !== undefined && (
                      <span className="text-[10px] text-blue-800 font-semibold">
                        • {formatDistance(nearestWater.distKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 mt-0.5 truncate">{nearestWater.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{nearestWater.address}</span>
                </div>
                <Link
                  to="/water-stations"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-[#1E60F2] text-white text-xs font-semibold hover:bg-[#184FD0] transition-colors"
                >
                  Locate
                </Link>
              </div>
            )}

            {nearestCooling && (
              <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Cooling Shelter</span>
                    {nearestCooling.distKm !== undefined && (
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        • {formatDistance(nearestCooling.distKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 mt-0.5 truncate">{nearestCooling.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{nearestCooling.address}</span>
                </div>
                <Link
                  to="/cooling-centres"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-modal border border-[#E5EDF5] space-y-4 max-h-[90vh] overflow-y-auto animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Personal Health & Sensitivity</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Age Category</label>
                <select
                  value={profile.age_group}
                  onChange={(e: any) => setProfile({ ...profile, age_group: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none"
                >
                  <option value="child">Child (&lt; 12 yrs)</option>
                  <option value="youth">Youth (12 - 25 yrs)</option>
                  <option value="adult">Adult (26 - 60 yrs)</option>
                  <option value="elderly">Elderly (60+ yrs)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.has_ac_at_home}
                    onChange={(e) => setProfile({ ...profile, has_ac_at_home: e.target.checked })}
                    className="rounded text-[#1E60F2]"
                  />
                  <span>Functioning Air Conditioning at home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.has_cardiovascular_condition}
                    onChange={(e) => setProfile({ ...profile, has_cardiovascular_condition: e.target.checked })}
                    className="rounded text-[#1E60F2]"
                  />
                  <span>Cardiovascular / Blood pressure condition</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.has_respiratory_condition}
                    onChange={(e) => setProfile({ ...profile, has_respiratory_condition: e.target.checked })}
                    className="rounded text-[#1E60F2]"
                  />
                  <span>Respiratory condition (Asthma / COPD)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold text-xs hover:bg-[#184FD0] shadow-xs"
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
