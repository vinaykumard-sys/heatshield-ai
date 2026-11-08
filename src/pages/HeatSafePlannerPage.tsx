import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Sun, 
  Trees, 
  Droplets, 
  Flame, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Navigation, 
  Building2, 
  Sparkles, 
  Footprints, 
  Bike, 
  Car, 
  Loader2, 
  Calendar,
  Share2,
  BookmarkCheck,
  ChevronRight,
  Info,
  Sliders
} from 'lucide-react';
import { HeatSafeRoute, GeocodedPlace, CoolingCentre, PublicWaterPoint } from '../types';
import { fetchHeatSafeRoutes, calculateHeatSafeRoutes, getDistanceKm } from '../lib/safeRoutingService';
import { fetchLiveWeather, WeatherFetchResult } from '../lib/weatherApi';
import { INITIAL_COOLING_CENTRES, INITIAL_WATER_POINTS } from '../lib/coolingCentresData';
import { RouteScene3D } from '../components/3d/RouteScene3D';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { LocationAutocompleteInput } from '../components/common/LocationAutocompleteInput';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useLocationTracker } from '../context/LocationContext';

export const HeatSafePlannerPage: React.FC = () => {
  const { currentLocation } = useLocationTracker();

  // Search & Waypoint State
  const [startPlace, setStartPlace] = useState('Hebbal Flyover');
  const [endPlace, setEndPlace] = useState('Yelahanka Old Town');
  const [startCoords, setStartCoords] = useState<[number, number]>([13.0358, 77.5970]);
  const [endCoords, setEndCoords] = useState<[number, number]>([13.1025, 77.5980]);
  const [travelMode, setTravelMode] = useState<'walk' | 'cycle' | 'drive'>('walk');

  // Departure Time State (Hour 0 - 23, defaults to 13:00 peak or current hour)
  const currentHour = new Date().getHours();
  const [departureHour, setDepartureHour] = useState<number>(13); // Default to midday peak exposure planner

  // Routes & Weather State
  const [routes, setRoutes] = useState<HeatSafeRoute[]>(() =>
    calculateHeatSafeRoutes({
      startPlace: 'Hebbal Flyover',
      endPlace: 'Yelahanka Old Town',
      startCoords: [13.0358, 77.5970],
      endCoords: [13.1025, 77.5980],
      travelMode: 'walk'
    })
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-canopy-init');
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [liveWeather, setLiveWeather] = useState<WeatherFetchResult | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [activeStationModal, setActiveStationModal] = useState<CoolingCentre | PublicWaterPoint | null>(null);

  // Quick departure hour presets
  const departurePresets = [
    { hour: 7, label: '07:00 AM', tag: 'Cool Window', safe: true },
    { hour: 10, label: '10:00 AM', tag: 'Moderate', safe: false },
    { hour: 13, label: '01:00 PM', tag: 'Peak Solar Heat', safe: false },
    { hour: 16, label: '04:00 PM', tag: 'Late Afternoon', safe: false },
    { hour: 19, label: '07:00 PM', tag: 'Night Cool-down', safe: true }
  ];

  // Fetch Open-Meteo Live & Hourly Weather for Origin
  useEffect(() => {
    let isCancelled = false;
    async function loadWeather() {
      setIsLoadingWeather(true);
      try {
        const weather = await fetchLiveWeather(startCoords[0], startCoords[1], 'planner-origin');
        if (!isCancelled) {
          setLiveWeather(weather);
        }
      } catch (err) {
        console.warn('Weather fetch fallback for planner:', err);
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    }
    loadWeather();
    return () => { isCancelled = true; };
  }, [startCoords]);

  // Recalculate routes on travel mode or coordinates change
  const handleRecalculateRoutes = useCallback(async (
    sPlace: string,
    ePlace: string,
    sCoords: [number, number],
    eCoords: [number, number],
    mode: 'walk' | 'cycle' | 'drive'
  ) => {
    setIsCalculatingRoutes(true);
    try {
      const fetched = await fetchHeatSafeRoutes({
        startPlace: sPlace,
        endPlace: ePlace,
        startCoords: sCoords,
        endCoords: eCoords,
        travelMode: mode
      });
      if (fetched && fetched.length > 0) {
        setRoutes(fetched);
        // Default to coolest route
        const coolest = fetched.find(r => r.route_type === 'low_heat_exposure') || fetched[0];
        setSelectedRouteId(coolest.id);
      }
    } catch {
      const fallback = calculateHeatSafeRoutes({
        startPlace: sPlace,
        endPlace: ePlace,
        startCoords: sCoords,
        endCoords: eCoords,
        travelMode: mode
      });
      setRoutes(fallback);
      setSelectedRouteId(fallback[1]?.id || fallback[0]?.id);
    } finally {
      setIsCalculatingRoutes(false);
    }
  }, []);

  useEffect(() => {
    handleRecalculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode);
  }, [travelMode]);

  // Active Route Reference
  const activeRoute = useMemo(() => {
    return routes.find(r => r.id === selectedRouteId) || routes[0];
  }, [routes, selectedRouteId]);

  // Extract hourly forecast at selected departure hour from Open-Meteo
  const hourForecast = useMemo(() => {
    const hourly = liveWeather?.todayHourly || liveWeather?.forecastHourly;
    if (!hourly || hourly.length === 0) {
      // Calibrated baseline if offline
      const isPeak = departureHour >= 11 && departureHour <= 15;
      const temp = isPeak ? 36.5 : departureHour < 9 || departureHour >= 18 ? 26.2 : 31.0;
      const feelsLike = isPeak ? 41.8 : departureHour < 9 || departureHour >= 18 ? 27.5 : 34.2;
      const uv = isPeak ? 9.5 : departureHour < 9 || departureHour >= 18 ? 1.0 : 5.8;
      return { temp, feelsLike, uv, condition: isPeak ? 'Intense Insolation' : 'Fair', isLive: false };
    }

    const matchingHour = hourly.find(h => h.hourNum === departureHour) 
      || hourly[0];

    return {
      temp: matchingHour.temperature_c,
      feelsLike: matchingHour.apparent_temperature_c,
      uv: matchingHour.uv_index,
      condition: matchingHour.weather_condition,
      isLive: true
    };
  }, [liveWeather, departureHour]);

  // Dynamic Heat Exposure Score adjusted for Departure Hour & Weather
  const departureHeatScore = useMemo(() => {
    let base = activeRoute?.heat_exposure_score || 50;

    // Time-of-day modifier
    if (departureHour >= 11 && departureHour <= 15) {
      base += 18; // Peak sun solar irradiance penalty
    } else if (departureHour >= 9 && departureHour < 11) {
      base += 6;
    } else if (departureHour > 15 && departureHour <= 17) {
      base += 8; // Hot asphalt thermal re-radiation
    } else if (departureHour < 9 || departureHour >= 18) {
      base -= 22; // Cool morning/evening window
    }

    // Weather feels-like modifier
    if (hourForecast.feelsLike >= 40) base += 10;
    else if (hourForecast.feelsLike <= 30) base -= 10;

    return Math.max(12, Math.min(98, Math.round(base)));
  }, [activeRoute, departureHour, hourForecast]);

  // Recommended Cooling Stops along the path
  const recommendedStops = useMemo(() => {
    if (!activeRoute?.coordinates) return [];

    const midLat = (startCoords[0] + endCoords[0]) / 2;
    const midLon = (startCoords[1] + endCoords[1]) / 2;

    const nearbyCooling = INITIAL_COOLING_CENTRES.map(c => ({
      type: 'cooling' as const,
      data: c,
      distKm: getDistanceKm(midLat, midLon, c.latitude, c.longitude)
    })).sort((a, b) => a.distKm - b.distKm).slice(0, 2);

    const nearbyWater = INITIAL_WATER_POINTS.map(w => ({
      type: 'water' as const,
      data: w,
      distKm: getDistanceKm(midLat, midLon, w.latitude, w.longitude)
    })).sort((a, b) => a.distKm - b.distKm).slice(0, 3);

    return [...nearbyCooling, ...nearbyWater];
  }, [startCoords, endCoords, activeRoute]);

  // Departure Safety Verdict
  const safetyVerdict = useMemo(() => {
    if (departureHeatScore <= 45) {
      return {
        label: 'Optimal Safe Departure Window',
        subtext: 'Minimal solar heat strain. Tree canopy provides comfortable shade corridor.',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500',
        advice: 'Safe for walking and cycling. Standard hydration recommended.'
      };
    } else if (departureHeatScore <= 70) {
      return {
        label: 'Moderate Heat Strain Expected',
        subtext: 'Elevated ambient temperature. Plan 1 hydration pause every 20 minutes.',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        advice: 'Wear breathable UV clothing and take shaded sidewalks.'
      };
    }
    return {
      label: 'Dangerous Heat Peak: Caution Advised',
      subtext: 'Intense solar insolation and asphalt heat (>43°C). Mandatory cooling stops needed.',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
      dotClass: 'bg-rose-500',
      advice: 'If possible, delay departure until 17:30 or utilize air-conditioned transport.'
    };
  }, [departureHeatScore]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-3 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              HeatSafe Departure & Route Planner
            </h1>
            <Badge variant="brand" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              3D Solar Simulation
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Simulate solar irradiance, asphalt thermal re-radiation, and plan air-conditioned respite stops by departure time.
          </p>
        </div>

        {/* Travel Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs self-start md:self-auto">
          <button
            onClick={() => setTravelMode('walk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'walk'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>
          <button
            onClick={() => setTravelMode('cycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'cycle'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cycle</span>
          </button>
          <button
            onClick={() => setTravelMode('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'drive'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>
        </div>
      </div>

      {/* 1. Departure Time Controller & Hourly Solar Exposure Strip */}
      <Card padding="md" className="border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B] block">
              Step 1: Select Journey Departure Time
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-5 h-5 text-[#1E60F2]" />
              <span className="text-xl font-extrabold text-[#0F172A]">
                {departureHour.toString().padStart(2, '0')}:00
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {departureHour >= 12 ? (departureHour === 12 ? '12:00 PM (Noon)' : `${departureHour - 12}:00 PM`) : `${departureHour}:00 AM`}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {departurePresets.map(preset => (
              <button
                key={preset.hour}
                onClick={() => setDepartureHour(preset.hour)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  departureHour === preset.hour
                    ? 'bg-[#1E60F2] text-white border-[#1E60F2] shadow-sm'
                    : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:bg-[#EFF6FF]'
                }`}
              >
                <div>{preset.label}</div>
                <div className={`text-[10px] font-medium ${departureHour === preset.hour ? 'text-white/80' : 'text-[#64748B]'}`}>
                  {preset.tag}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Departure Hour Slider */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1.5">
            <span>06:00 (Dawn)</span>
            <span className="font-bold text-[#0F172A]">Slide to Test Hour: {departureHour}:00</span>
            <span>22:00 (Night)</span>
          </div>
          <input
            type="range"
            min={6}
            max={22}
            step={1}
            value={departureHour}
            onChange={(e) => setDepartureHour(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-emerald-300 via-amber-400 to-rose-500 rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
          />
        </div>

        {/* Live Open-Meteo Weather Telemetry for Chosen Hour */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-[#64748B] block font-semibold">Ambient Air Temp</span>
            <span className="text-sm font-extrabold text-[#0F172A]">{hourForecast.temp}°C</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-semibold">Feels-Like Index</span>
            <span className={`text-sm font-extrabold ${hourForecast.feelsLike >= 38 ? 'text-rose-600' : 'text-[#0F172A]'}`}>
              {hourForecast.feelsLike}°C
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-semibold">Solar UV Index</span>
            <span className="text-sm font-extrabold text-amber-700">UV {hourForecast.uv}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-semibold">Telemetry Source</span>
            <span className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open-Meteo Live
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Origin & Destination Waypoint Inputs */}
      <Card padding="md" className="border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <LocationAutocompleteInput
            label="Origin (Start Location)"
            value={startPlace}
            placeholder="Starting address or locality..."
            iconType="origin"
            onChange={setStartPlace}
            onSelect={(place) => {
              const coords: [number, number] = [place.latitude, place.longitude];
              setStartPlace(place.shortName || place.displayName);
              setStartCoords(coords);
              handleRecalculateRoutes(place.shortName, endPlace, coords, endCoords, travelMode);
            }}
          />

          <div className="hidden lg:flex items-center justify-center pt-5">
            <ArrowRight className="w-5 h-5 text-[#64748B]" />
          </div>

          <LocationAutocompleteInput
            label="Destination"
            value={endPlace}
            placeholder="Destination address or landmark..."
            iconType="destination"
            onChange={setEndPlace}
            onSelect={(place) => {
              const coords: [number, number] = [place.latitude, place.longitude];
              setEndPlace(place.shortName || place.displayName);
              setEndCoords(coords);
              handleRecalculateRoutes(startPlace, place.shortName, startCoords, coords, travelMode);
            }}
          />
        </div>
      </Card>

      {/* 3. Heat Exposure Verdict Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${safetyVerdict.badgeClass}`}>
        <div className="flex items-start gap-3">
          <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${safetyVerdict.dotClass} animate-pulse`} />
          <div>
            <div className="font-extrabold text-sm sm:text-base">
              {safetyVerdict.label} (Score: {departureHeatScore}/100)
            </div>
            <div className="text-xs opacity-90 mt-0.5">{safetyVerdict.subtext}</div>
            <div className="text-xs font-semibold mt-1">💡 Advice: {safetyVerdict.advice}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Trip Duration
            </div>
            <div className="text-base font-extrabold">
              {activeRoute.duration_minutes} min • {activeRoute.distance_km} km
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN 3D INTERACTIVE VISUALIZATION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Interactive 3D Solar Route Simulation
            </h2>
            <Badge variant="neutral" size="sm">
              Sun Angle at {departureHour}:00
            </Badge>
          </div>
          <span className="text-xs text-[#64748B] hidden sm:inline">
            Click & drag to inspect heat islands & cooling stations
          </span>
        </div>

        <RouteScene3D
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
          startPlace={startPlace}
          endPlace={endPlace}
          coolingCentres={INITIAL_COOLING_CENTRES}
          waterPoints={INITIAL_WATER_POINTS}
          travelMode={travelMode}
          departureTimeHour={departureHour}
          height="640px"
          onSelectStation={setActiveStationModal}
        />
      </div>

      {/* 5. Recommended Cooling Stops & Hydration Kiosks along Route */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1E60F2]" />
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
                Recommended Respite Stops Along Path
              </h3>
            </div>
            <span className="text-xs text-[#64748B]">
              {recommendedStops.length} stops nearby
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedStops.map((stop, idx) => {
              const isCooling = stop.type === 'cooling';
              const station = stop.data;

              return (
                <div
                  key={`stop-${station.id || idx}`}
                  onClick={() => setActiveStationModal(station)}
                  className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1E60F2] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isCooling ? 'bg-sky-50 text-sky-700' : 'bg-cyan-50 text-cyan-700'
                      }`}>
                        {isCooling ? 'AC Respite Shelter' : 'Water Kiosk'}
                      </span>
                      <span className="text-[11px] font-bold text-[#64748B]">
                        ~{(stop.distKm * 1000).toFixed(0)}m from path
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] mt-2 line-clamp-1">
                      {station.name}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                      {'address' in station ? (station as CoolingCentre).address : station.locality_name}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Open
                    </span>
                    <span className="text-[#1E60F2] font-bold flex items-center gap-0.5">
                      View in 3D
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Journey Summary & Safety Check Card */}
        <Card padding="md" className="border-[#E2E8F0] bg-gradient-to-b from-white to-[#F8FAFC] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Journey Heat Safety Plan</span>
            </div>

            <h4 className="text-base font-bold text-[#0F172A] mt-2">
              {activeRoute.label}
            </h4>

            <div className="mt-4 space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Chosen Departure</span>
                <span className="font-bold">{departureHour}:00 hrs</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Calculated Exposure</span>
                <span className="font-bold">{departureHeatScore} / 100</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Tree Shade Coverage</span>
                <span className="font-bold text-emerald-700">{activeRoute.shade_coverage_pct}%</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Hydration Halts</span>
                <span className="font-bold text-sky-700">{activeRoute.water_points_count + activeRoute.cooling_centres_count} Available</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-2">
            <button
              onClick={() => alert(`HeatSafe Plan saved for ${departureHour}:00 departure! Drink 350ml water before departing.`)}
              className="w-full py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#154ec2] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Save HeatSafe Plan</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HeatSafePlannerPage;
