import React, { useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Sun, 
  Flame, 
  CloudSun, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { LocationZone } from '../../types';
import { mockDb } from '../../lib/mockDb';

export interface CityZoneItem {
  id: string;
  name: string;
  subName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  temp: number;
  feelsLike: number;
  condition: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  uhiDelta: string;
  gradient: string;
  pincode: string;
  population: number;
  coolingCenters: number;
}

export const INDIAN_HEAT_CITIES: CityZoneItem[] = [
  {
    id: 'delhi-connaught-place',
    name: 'Central Delhi',
    subName: 'Connaught Place & Old Delhi',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    temp: 42,
    feelsLike: 46,
    condition: 'Extreme Heatwave',
    riskLevel: 'critical',
    uhiDelta: '+3.8°C',
    gradient: 'from-amber-500/20 via-rose-500/10 to-orange-500/20',
    pincode: '110001',
    population: 62000,
    coolingCenters: 5,
  },
  {
    id: 'loc-6',
    name: 'Ahmedabad',
    subName: 'Old City & Dariapur',
    city: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0338,
    longitude: 72.5850,
    temp: 43,
    feelsLike: 45,
    condition: 'Severe Thermal Load',
    riskLevel: 'critical',
    uhiDelta: '+3.5°C',
    gradient: 'from-orange-500/20 via-amber-500/10 to-red-500/20',
    pincode: '380001',
    population: 60000,
    coolingCenters: 4,
  },
  {
    id: 'zone-nagpur',
    name: 'Nagpur',
    subName: 'Sitabuldi & Vidarbha Epicenter',
    city: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    temp: 44,
    feelsLike: 47,
    condition: 'Critical Heat Surge',
    riskLevel: 'critical',
    uhiDelta: '+4.1°C',
    gradient: 'from-rose-500/25 via-red-500/15 to-amber-500/20',
    pincode: '440001',
    population: 52000,
    coolingCenters: 3,
  },
  {
    id: 'zone-chennai',
    name: 'Chennai',
    subName: 'T. Nagar & Coastal Belt',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0418,
    longitude: 80.2341,
    temp: 38,
    feelsLike: 44,
    condition: 'Humid Heat Stress',
    riskLevel: 'high',
    uhiDelta: '+2.8°C',
    gradient: 'from-blue-500/15 via-cyan-500/10 to-amber-500/15',
    pincode: '600017',
    population: 71000,
    coolingCenters: 4,
  },
  {
    id: 'blr-chokkanahalli',
    name: 'Bengaluru',
    subName: 'Yelahanka & Thanisandra Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0854,
    longitude: 77.6250,
    temp: 33,
    feelsLike: 35,
    condition: 'Moderate Solar Influx',
    riskLevel: 'moderate',
    uhiDelta: '+2.4°C',
    gradient: 'from-emerald-500/15 via-teal-500/10 to-blue-500/15',
    pincode: '560064',
    population: 45000,
    coolingCenters: 3,
  },
  {
    id: 'loc-10',
    name: 'Mumbai',
    subName: 'Dharavi & Kurla Thermal Basin',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0402,
    longitude: 72.8530,
    temp: 36,
    feelsLike: 43,
    condition: 'High Coastal Moisture',
    riskLevel: 'high',
    uhiDelta: '+3.2°C',
    gradient: 'from-sky-500/20 via-indigo-500/10 to-amber-500/15',
    pincode: '400017',
    population: 75000,
    coolingCenters: 3,
  },
];

export interface OtherCitiesRailProps {
  className?: string;
  onCitySelected?: (city: CityZoneItem) => void;
}

export const OtherCitiesRail: React.FC<OtherCitiesRailProps> = ({ className = '', onCitySelected }) => {
  const { currentLocation, selectedZone, selectCustomLocality } = useLocationTracker();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectCity = (cityItem: CityZoneItem) => {
    // 1. Check if location exists in mockDb
    const existingLocations = mockDb.getLocations();
    let targetZone = existingLocations.find(
      (l) => l.id === cityItem.id || l.city.toLowerCase() === cityItem.city.toLowerCase()
    );

    // 2. If not, construct a clean LocationZone object
    if (!targetZone) {
      targetZone = {
        id: cityItem.id,
        name: cityItem.subName,
        city: cityItem.city,
        state: cityItem.state,
        pincode: cityItem.pincode,
        latitude: cityItem.latitude,
        longitude: cityItem.longitude,
        baseline_vulnerability_score: cityItem.riskLevel === 'critical' ? 88.0 : 70.0,
        urban_heat_island_factor: parseFloat(cityItem.uhiDelta.replace('+', '').replace('°C', '')) / 10 + 1,
        cooling_centers_count: cityItem.coolingCenters,
        estimated_population: cityItem.population,
      };
      mockDb.saveLocation(targetZone);
    }

    // 3. Switch active locality via LocationContext
    selectCustomLocality(targetZone);
    if (onCitySelected) {
      onCitySelected(cityItem);
    }
  };

  // Determine if a city item is active
  const isCityActive = (cityItem: CityZoneItem) => {
    if (selectedZone && selectedZone.city.toLowerCase() === cityItem.city.toLowerCase()) return true;
    if (currentLocation && currentLocation.city.toLowerCase() === cityItem.city.toLowerCase()) return true;
    return false;
  };

  const getWeatherIcon = (temp: number) => {
    if (temp >= 42) return <Flame className="w-4 h-4 text-rose-500 animate-pulse" />;
    if (temp >= 38) return <Sun className="w-4 h-4 text-amber-500" />;
    return <CloudSun className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Key Heat Zones (India)</span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
              Select to switch active telemetry
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time urban heat tracking across India's most vulnerable metropolitan centers
          </p>
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-colors btn-press"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-colors btn-press"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Rail */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {INDIAN_HEAT_CITIES.map((cityItem) => {
          const active = isCityActive(cityItem);

          return (
            <div
              key={cityItem.id}
              onClick={() => handleSelectCity(cityItem)}
              className={`snap-start shrink-0 w-[240px] sm:w-[260px] rounded-[24px] p-4.5 p-4 sm:p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                active
                  ? 'bg-white border-[#1E60F2] ring-4 ring-blue-500/10 shadow-[0_8px_25px_-4px_rgba(30,96,242,0.18)] scale-[1.02]'
                  : 'bg-white hover:bg-slate-50/70 border-slate-100/90 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.04)] hover:shadow-card hover:border-blue-200'
              }`}
            >
              {/* Subtle Gradient Atmosphere Visual */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cityItem.gradient} opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none`}
              />

              {/* Card Header: Name + Pin + Active indicator */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <MapPin className="w-3 h-3 text-[#1E60F2]" />
                    <span>{cityItem.city}</span>
                    <span className="text-slate-400">• {cityItem.state}</span>
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight mt-0.5 line-clamp-1 group-hover:text-[#1E60F2] transition-colors">
                    {cityItem.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                    {cityItem.subName}
                  </p>
                </div>

                {active ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    cityItem.riskLevel === 'critical'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : cityItem.riskLevel === 'high'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {cityItem.riskLevel}
                  </span>
                )}
              </div>

              {/* Temperature Display & Condition */}
              <div className="relative z-10 mt-4 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                    {cityItem.temp}
                  </span>
                  <span className="text-base font-bold text-slate-400">°C</span>
                  <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                    Feels {cityItem.feelsLike}°
                  </span>
                </div>

                <div className="w-8 h-8 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center justify-center">
                  {getWeatherIcon(cityItem.temp)}
                </div>
              </div>

              {/* Bottom Micro Metrics: UHI Delta & Switch Locality Callout */}
              <div className="relative z-10 mt-3 pt-3 border-t border-slate-100/90 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Layers className="w-3 h-3 text-orange-500" />
                  <span>UHI: <strong className="text-slate-800">{cityItem.uhiDelta}</strong></span>
                </div>

                <div className="flex items-center gap-1 text-[#1E60F2] font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>{active ? 'Viewing' : 'Switch'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OtherCitiesRail;
