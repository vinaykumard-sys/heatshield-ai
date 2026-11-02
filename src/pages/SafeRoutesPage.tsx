import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Search, 
  ShieldCheck, 
  Clock, 
  Droplets, 
  Building2, 
  Flame, 
  Sun, 
  Compass, 
  ArrowRight, 
  Trees, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { HeatSafeRoute } from '../types';
import { calculateHeatSafeRoutes } from '../lib/safeRoutingService';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const SafeRoutesPage: React.FC = () => {
  const [startPlace, setStartPlace] = useState('Hebbal Flyover');
  const [endPlace, setEndPlace] = useState('Yelahanka Old Town');
  const [startCoords, setStartCoords] = useState<[number, number]>([13.0358, 77.5970]);
  const [endCoords, setEndCoords] = useState<[number, number]>([13.1025, 77.5980]);

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
      center: [13.0600, 77.6000],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
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
        ? '#059669' // Green for canopy
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

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-emerald-600" />
              <span>Heat-Safe Route & Shade Planner</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              THERMAL ROUTING
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Intelligent pedestrian and commuter navigation factoring tree canopy shade, asphalt radiant heat, and drinking water waypoints.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono mr-1">Quick Presets:</span>
          {presets.map(p => (
            <button
              key={p.start}
              onClick={() => handleSelectPreset(p)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] whitespace-nowrap transition-all btn-press hover:scale-105 active:scale-95"
            >
              {p.start.split(' ')[0]} → {p.end.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Origin / Destination Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-xs input-interactive">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <label className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Origin</label>
            <input
              type="text"
              value={startPlace}
              onChange={e => setStartPlace(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-xs input-interactive">
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <div className="flex-1">
            <label className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Destination</label>
            <input
              type="text"
              value={endPlace}
              onChange={e => setEndPlace(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Routing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-xs font-mono">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Thermal Route Comparison Canvas</span>
            </span>
            <span className="text-slate-500 text-[11px]">Click lines to compare</span>
          </div>
          <div ref={mapContainerRef} className="w-full h-[480px]" />
        </div>

        {/* Alternative Route Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            3 Calculated Route Options
          </h2>

          {routes.map(r => {
            const isSelected = r.id === selectedRouteId;
            const isCanopy = r.route_type === 'low_heat_exposure';
            const isRespite = r.route_type === 'respite_optimized';

            return (
              <div 
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all shadow-xs card-interactive ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded text-xs ${
                      isCanopy ? 'bg-emerald-100 text-emerald-800' :
                      isRespite ? 'bg-sky-100 text-sky-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {isCanopy ? <Trees className="w-4 h-4" /> : isRespite ? <Droplets className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {isCanopy ? 'Route B: Canopy Protected' : isRespite ? 'Route C: Water & Respite' : 'Route A: Direct Arterial'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    r.heat_exposure_score < 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    Exposure {r.heat_exposure_score}/100
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {r.summary}
                </p>

                {/* Metrics bar */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-400 block">Distance</span>
                    <span className="font-bold text-slate-900">{r.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Walk Time</span>
                    <span className="font-bold text-slate-900">{r.duration_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Shade %</span>
                    <span className="font-bold text-emerald-700">{r.shade_coverage_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Water / Shelters</span>
                    <span className="font-bold text-sky-700">{r.water_points_count + r.cooling_centres_count} stops</span>
                  </div>
                </div>

                {r.warnings && r.warnings.length > 0 && (
                  <div className="mt-2 text-[10px] text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
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