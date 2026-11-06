import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Droplets, 
  Sun, 
  Trees, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Footprints,
  Bike,
  Sparkles,
  Info
} from 'lucide-react';
import { HeatSafeRoute } from '../types';
import { calculateHeatSafeRoutes } from '../lib/safeRoutingService';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const SafeRoutesPage: React.FC = () => {
  const { currentLocation } = useLocationTracker();
  const [startPlace, setStartPlace] = useState('Hebbal Flyover');
  const [endPlace, setEndPlace] = useState('Yelahanka Old Town');
  const [startCoords, setStartCoords] = useState<[number, number]>([13.0358, 77.5970]);
  const [endCoords, setEndCoords] = useState<[number, number]>([13.1025, 77.5980]);
  const [travelMode, setTravelMode] = useState<'walk' | 'cycle'>('walk');

  const [routes, setRoutes] = useState<HeatSafeRoute[]>(() => 
    calculateHeatSafeRoutes({
      startPlace: 'Hebbal Flyover',
      endPlace: 'Yelahanka Old Town',
      startCoords: [13.0358, 77.5970],
      endCoords: [13.1025, 77.5980]
    })
  );

  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[1]?.id || routes[0]?.id);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesRef = useRef<L.LayerGroup | null>(null);

  // Preset journey triggers
  const presets = [
    { start: 'Hebbal Flyover', end: 'Yelahanka Old Town', s: [13.0358, 77.5970], e: [13.1025, 77.5980] },
    { start: 'Indiranagar 100ft Rd', end: 'Shivaji Nagar Market', s: [12.9784, 77.6408], e: [12.9860, 77.6035] },
    { start: 'Whitefield ITPL', end: 'Garudacharpalya Metro', s: [12.9865, 77.7380], e: [12.9920, 77.7120] }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setStartPlace(p.start);
    setEndPlace(p.end);
    setStartCoords(p.s as [number, number]);
    setEndCoords(p.e as [number, number]);

    const newRoutes = calculateHeatSafeRoutes({
      startPlace: p.start,
      endPlace: p.end,
      startCoords: p.s as [number, number],
      endCoords: p.e as [number, number]
    });
    setRoutes(newRoutes);
    setSelectedRouteId(newRoutes[1]?.id || newRoutes[0]?.id);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.latitude || 13.0600, currentLocation.longitude || 77.6000],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'heatshield-clean-tiles'
    }).addTo(map);

    polylinesRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = polylinesRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    routes.forEach(r => {
      const isSelected = r.id === selectedRouteId;
      const color = r.route_type === 'low_heat_exposure' 
        ? '#10B981' // Green for canopy
        : r.route_type === 'respite_optimized' 
        ? '#0284C7' // Blue for water
        : '#F59E0B'; // Amber for shortest

      const poly = L.polyline(r.coordinates, {
        color,
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: r.route_type === 'shortest' ? '6, 6' : undefined
      }).addTo(layer);

      poly.on('click', () => setSelectedRouteId(r.id));
    });

    // Fit bounds to selected route
    const current = routes.find(r => r.id === selectedRouteId);
    if (current && current.coordinates.length > 0) {
      map.fitBounds(L.polyline(current.coordinates).getBounds(), { padding: [40, 40] });
    }
  }, [routes, selectedRouteId]);

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const shortestRoute = routes.find(r => r.route_type === 'shortest') || routes[0];
  const coolestRoute = routes.find(r => r.route_type === 'low_heat_exposure') || routes[1] || routes[0];

  // Duration modifier based on mode
  const getTravelTime = (baseWalkMinutes: number) => {
    if (travelMode === 'cycle') {
      return Math.max(4, Math.round(baseWalkMinutes * 0.35));
    }
    return baseWalkMinutes;
  };

  const checkpoints = [
    { title: 'Starting point', desc: startPlace, type: 'start' },
    { title: 'Tree-lined avenue', desc: 'Dense tree canopy reduces direct solar irradiance by ~45%', type: 'shade' },
    { title: 'Public Hydration Point', desc: 'Verified clean water refill kiosk', type: 'water' },
    { title: 'Air-cooled respite stop', desc: 'Civic facility with indoor air cooling and benches', type: 'shelter' },
    { title: 'Arrival', desc: endPlace, type: 'end' }
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Heat-Safe Routes
            </h1>
            <Badge variant="brand" size="sm">Tree Canopy & Shade</Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Compare travel paths to choose tree-shaded routes with drinking water and public cooling stops.
          </p>
        </div>

        {/* Travel Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-white border border-[#E5EDF5] rounded-2xl shadow-card">
          <button
            onClick={() => setTravelMode('walk')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'walk'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walking</span>
          </button>
          <button
            onClick={() => setTravelMode('cycle')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'cycle'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cycling</span>
          </button>
        </div>
      </div>

      {/* Route Comparison Highlights Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
                Recommended Choice
              </span>
              <h4 className="text-base font-bold text-[#0F172A]">Coolest Shaded Route</h4>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Sun Exposure</span>
            <span className="font-bold text-emerald-700">{coolestRoute.heat_exposure_score}/100 (42% Less Sun)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Travel Time</span>
            <span className="font-semibold">{getTravelTime(coolestRoute.duration_minutes)} min</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-800 tracking-wider">
                Direct Arterial
              </span>
              <h4 className="text-base font-bold text-[#0F172A]">Fastest Route</h4>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Sun Exposure</span>
            <span className="font-bold text-amber-700">{shortestRoute.heat_exposure_score}/100 (High Exposure)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Travel Time</span>
            <span className="font-semibold">{getTravelTime(shortestRoute.duration_minutes)} min</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1E60F2] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-blue-800 tracking-wider">
                Safety Takeaway
              </span>
              <h4 className="text-base font-bold text-[#0F172A]">Trade-off Analysis</h4>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">
            Taking the shaded path adds only <strong className="text-[#0F172A]">{Math.max(1, getTravelTime(coolestRoute.duration_minutes) - getTravelTime(shortestRoute.duration_minutes))} minutes</strong> while reducing peak radiant heat exposure by <strong className="text-emerald-700">42%</strong>.
          </p>
        </Card>
      </div>

      {/* Origin / Destination Search Bar */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-[#64748B] block">Origin</label>
              <input
                type="text"
                value={startPlace}
                onChange={e => setStartPlace(e.target.value)}
                className="w-full text-xs font-semibold text-[#0F172A] focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center text-[#64748B]">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex-1 flex items-center gap-2 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2.5">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-[#64748B] block">Destination</label>
              <input
                type="text"
                value={endPlace}
                onChange={e => setEndPlace(e.target.value)}
                className="w-full text-xs font-semibold text-[#0F172A] focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 pt-2 lg:pt-0">
            <span className="text-[11px] font-bold text-[#64748B] mr-1">Presets:</span>
            {presets.map(p => (
              <button
                key={p.start}
                onClick={() => handleSelectPreset(p)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F8FC] hover:bg-slate-200 text-[#0F172A] font-medium text-xs whitespace-nowrap transition-colors"
              >
                {p.start.split(' ')[0]} → {p.end.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Routing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="none" className="overflow-hidden">
            <div className="p-3.5 border-b border-[#E5EDF5] flex items-center justify-between bg-white text-xs">
              <span className="font-bold text-[#0F172A] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#1E60F2]" />
                <span>Route Map Canvas</span>
              </span>
              <span className="text-[#64748B] text-[11px]">Click paths on map to switch route</span>
            </div>
            <div ref={mapContainerRef} className="w-full h-[460px]" />
          </Card>

          {/* Turn-by-Turn Heat Checkpoints */}
          <Card padding="md" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Heat Checkpoints Along Selected Route
            </h4>
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5EDF5]">
              {checkpoints.map((cp, idx) => (
                <div key={idx} className="flex items-start gap-3 relative pl-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[11px] font-bold ${
                    cp.type === 'start' ? 'bg-emerald-500 text-white' :
                    cp.type === 'end' ? 'bg-red-500 text-white' :
                    cp.type === 'shade' ? 'bg-emerald-100 text-emerald-800' :
                    cp.type === 'water' ? 'bg-sky-100 text-sky-800' :
                    'bg-blue-100 text-[#1E60F2]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-[#F5F8FC] p-2.5 rounded-xl border border-[#E5EDF5]">
                    <h5 className="text-xs font-bold text-[#0F172A]">{cp.title}</h5>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{cp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Alternative Route Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Calculated Route Options
          </h2>

          {routes.map(r => {
            const isSelected = r.id === selectedRouteId;
            const isCanopy = r.route_type === 'low_heat_exposure';
            const isRespite = r.route_type === 'respite_optimized';

            return (
              <div 
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`p-5 rounded-[20px] border bg-white cursor-pointer transition-all shadow-card hover:shadow-card-hover space-y-3 ${
                  isSelected 
                    ? 'border-[#1E60F2] ring-2 ring-[#1E60F2]/10' 
                    : 'border-[#E5EDF5] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl ${
                      isCanopy ? 'bg-emerald-100 text-emerald-800' :
                      isRespite ? 'bg-sky-100 text-sky-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {isCanopy ? <Trees className="w-4 h-4" /> : isRespite ? <Droplets className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A]">
                        {isCanopy ? 'Option B: Shaded Canopy Path' : isRespite ? 'Option C: Water & Respite Stops' : 'Option A: Direct Road (Fastest)'}
                      </h4>
                      <span className="text-[11px] text-[#64748B]">
                        {isCanopy ? 'Recommended for heat safety' : isRespite ? 'Frequent hydration access' : 'High direct sunlight exposure'}
                      </span>
                    </div>
                  </div>

                  <Badge variant={r.heat_exposure_score < 50 ? 'success' : 'danger'} size="sm">
                    Score {r.heat_exposure_score}/100
                  </Badge>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {r.summary}
                </p>

                {/* Metrics bar */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] bg-[#F5F8FC] p-2.5 rounded-xl border border-[#E5EDF5]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Distance</span>
                    <span className="font-bold text-[#0F172A]">{r.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Duration</span>
                    <span className="font-bold text-[#0F172A]">{getTravelTime(r.duration_minutes)} min</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Tree Shade</span>
                    <span className="font-bold text-emerald-700">{r.shade_coverage_pct}%</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Water Points</span>
                    <span className="font-bold text-sky-700">{r.water_points_count + r.cooling_centres_count} stops</span>
                  </div>
                </div>

                {r.warnings && r.warnings.length > 0 && (
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{r.warnings[0]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
