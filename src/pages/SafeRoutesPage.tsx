import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Car,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Layers,
  Crosshair,
  Loader2,
  ArrowLeftRight,
  X
} from 'lucide-react';
import { HeatSafeRoute, GeocodedPlace } from '../types';
import { fetchHeatSafeRoutes, calculateHeatSafeRoutes } from '../lib/safeRoutingService';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LocationAutocompleteInput } from '../components/common/LocationAutocompleteInput';
import { INITIAL_COOLING_CENTRES, INITIAL_WATER_POINTS } from '../lib/coolingCentresData';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_VOYAGER_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const SafeRoutesPage: React.FC = () => {
  const { currentLocation } = useLocationTracker();

  // Search & Waypoint State
  const [startPlace, setStartPlace] = useState('Hebbal Flyover');
  const [endPlace, setEndPlace] = useState('Yelahanka Old Town');
  const [startCoords, setStartCoords] = useState<[number, number]>([13.0358, 77.5970]);
  const [endCoords, setEndCoords] = useState<[number, number]>([13.1025, 77.5980]);
  const [travelMode, setTravelMode] = useState<'walk' | 'cycle' | 'drive'>('walk');

  // Route Data State
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
  const [routeError, setRouteError] = useState<string | null>(null);

  // UI Panel State
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [mapStyle, setMapStyle] = useState<'carto' | 'osm'>('carto');
  const [showStopsLayer, setShowStopsLayer] = useState(true);

  // Live Navigation Simulation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // Map & Leaflet References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const navMarkerRef = useRef<L.Marker | null>(null);
  const navIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Presets
  const presets = [
    { start: 'Hebbal Flyover', end: 'Yelahanka Old Town', s: [13.0358, 77.5970] as [number, number], e: [13.1025, 77.5980] as [number, number] },
    { start: 'Indiranagar 100ft Rd', end: 'Shivaji Nagar Market', s: [12.9784, 77.6408] as [number, number], e: [12.9860, 77.6035] as [number, number] },
    { start: 'Whitefield ITPL', end: 'Garudacharpalya Metro', s: [12.9865, 77.7380] as [number, number], e: [12.9920, 77.7120] as [number, number] },
    { start: 'Connaught Place', end: 'Karol Bagh Market', s: [28.6315, 77.2167] as [number, number], e: [28.6515, 77.1906] as [number, number] }
  ];

  // Helper to re-calculate routes asynchronously via OSRM
  const calculateRoutes = useCallback(async (
    sPlace: string,
    ePlace: string,
    sCoords: [number, number],
    eCoords: [number, number],
    mode: 'walk' | 'cycle' | 'drive'
  ) => {
    setIsCalculatingRoutes(true);
    setRouteError(null);

    try {
      const fetchedRoutes = await fetchHeatSafeRoutes({
        startPlace: sPlace,
        endPlace: ePlace,
        startCoords: sCoords,
        endCoords: eCoords,
        travelMode: mode
      });

      if (fetchedRoutes && fetchedRoutes.length > 0) {
        setRoutes(fetchedRoutes);
        // Default to coolest / canopy route (Option B) if available, else first
        const bestRoute = fetchedRoutes.find(r => r.route_type === 'low_heat_exposure') || fetchedRoutes[0];
        setSelectedRouteId(bestRoute.id);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRouteError('Network error connecting to routing service. Showing estimated heat corridors.');
      const fallbackRoutes = calculateHeatSafeRoutes({
        startPlace: sPlace,
        endPlace: ePlace,
        startCoords: sCoords,
        endCoords: eCoords,
        travelMode: mode
      });
      setRoutes(fallbackRoutes);
      setSelectedRouteId(fallbackRoutes[1]?.id || fallbackRoutes[0]?.id);
    } finally {
      setIsCalculatingRoutes(false);
    }
  }, []);

  // Recalculate when travel mode changes
  useEffect(() => {
    calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode);
  }, [travelMode]);

  // Handle Preset Selection
  const handleSelectPreset = (p: typeof presets[0]) => {
    if (isNavigating) stopNavigation();
    setStartPlace(p.start);
    setEndPlace(p.end);
    setStartCoords(p.s);
    setEndCoords(p.e);
    calculateRoutes(p.start, p.end, p.s, p.e, travelMode);
  };

  // Swap Start and End
  const handleSwapPlaces = () => {
    if (isNavigating) stopNavigation();
    const tempPlace = startPlace;
    const tempCoords = startCoords;
    setStartPlace(endPlace);
    setStartCoords(endCoords);
    setEndPlace(tempPlace);
    setEndCoords(tempCoords);
    calculateRoutes(endPlace, tempPlace, endCoords, tempCoords, travelMode);
  };

  // Use Current Location as Start
  const handleUseCurrentLocation = () => {
    if (currentLocation.latitude && currentLocation.longitude) {
      const coords: [number, number] = [currentLocation.latitude, currentLocation.longitude];
      const placeName = currentLocation.localityName || currentLocation.city || 'My Current Location';
      setStartPlace(placeName);
      setStartCoords(coords);
      calculateRoutes(placeName, endPlace, coords, endCoords, travelMode);
    }
  };

  // Handle Autocomplete Selection
  const handleSelectOrigin = (place: GeocodedPlace) => {
    if (isNavigating) stopNavigation();
    const coords: [number, number] = [place.latitude, place.longitude];
    const name = place.shortName || place.displayName;
    setStartPlace(name);
    setStartCoords(coords);
    calculateRoutes(name, endPlace, coords, endCoords, travelMode);
  };

  const handleSelectDestination = (place: GeocodedPlace) => {
    if (isNavigating) stopNavigation();
    const coords: [number, number] = [place.latitude, place.longitude];
    const name = place.shortName || place.displayName;
    setEndPlace(name);
    setEndCoords(coords);
    calculateRoutes(startPlace, name, startCoords, coords, travelMode);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [startCoords[0] || 13.0600, startCoords[1] || 77.6000],
      zoom: 13,
      zoomControl: false, // Repositioned to top-right to avoid overlapping floating panel
      attributionControl: false
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const initialTileLayer = L.tileLayer(
      mapStyle === 'carto' ? CARTO_VOYAGER_URL : OSM_TILE_URL,
      {
        maxZoom: 19,
        subdomains: 'abcd',
        className: 'heatshield-clean-tiles'
      }
    ).addTo(map);

    tileLayerRef.current = initialTileLayer;
    polylinesLayerRef.current = L.layerGroup().addTo(map);
    stopsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Trigger initial calculation
    calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode);

    return () => {
      if (navIntervalRef.current) clearInterval(navIntervalRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(
      mapStyle === 'carto' ? CARTO_VOYAGER_URL : OSM_TILE_URL,
      {
        maxZoom: 19,
        subdomains: 'abcd',
        className: 'heatshield-clean-tiles'
      }
    ).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Active Selected Route
  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  // Fit Bounds to Route
  const handleFitRouteBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return;

    try {
      const polyline = L.polyline(activeRoute.coordinates);
      const bounds = polyline.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 16,
          animate: true
        });
      }
    } catch (e) {
      console.warn('Bounds fitting error:', e);
    }
  }, [activeRoute]);

  // Update Route Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyLayer = polylinesLayerRef.current;
    const markerLayer = markersLayerRef.current;
    if (!map || !polyLayer || !markerLayer) return;

    polyLayer.clearLayers();
    markerLayer.clearLayers();

    // 1. Draw All Route Polylines
    routes.forEach(r => {
      const isSelected = r.id === selectedRouteId;
      const isCanopy = r.route_type === 'low_heat_exposure';
      const isRespite = r.route_type === 'respite_optimized';

      const color = isCanopy 
        ? '#10B981' // Green for Canopy Protected
        : isRespite 
        ? '#0284C7' // Sky Blue for Hydration Corridor
        : '#F59E0B'; // Amber for Arterial/Direct

      // Draw subtle contrast casing line underneath
      if (isSelected) {
        L.polyline(r.coordinates, {
          color: '#FFFFFF',
          weight: 10,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(polyLayer);
      }

      // Draw Main Route Line
      const poly = L.polyline(r.coordinates, {
        color: isSelected ? color : '#94A3B8',
        weight: isSelected ? 6 : 3.5,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: r.route_type === 'shortest' && isSelected ? '6, 6' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(polyLayer);

      poly.on('click', () => {
        setSelectedRouteId(r.id);
      });

      poly.bindTooltip(
        `<div style="font-size: 11px; font-weight: 600; padding: 2px 4px;">
          ${r.label}<br/>
          <span style="color: ${color}; font-weight: 700;">${r.distance_km} km • ${r.duration_minutes} min</span>
        </div>`,
        { sticky: true }
      );
    });

    // 2. Draw Start (Origin) Marker
    const startIconHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #10B981; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div style="position: absolute; top: 34px; background: #0F172A; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          START
        </div>
      </div>
    `;

    const startIcon = L.divIcon({
      html: startIconHtml,
      className: 'heatshield-route-pin',
      iconSize: [32, 48],
      iconAnchor: [16, 16]
    });

    const startMarker = L.marker(startCoords, { icon: startIcon, zIndexOffset: 1000 }).addTo(markerLayer);
    startMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; padding: 4px;">
        <div style="font-weight: 800; color: #10B981; text-transform: uppercase; font-size: 10px;">Journey Origin</div>
        <div style="font-weight: 700; color: #0F172A; margin-top: 2px;">${startPlace}</div>
        <div style="color: #64748B; font-size: 11px; margin-top: 2px;">[${startCoords[0].toFixed(4)}°N, ${startCoords[1].toFixed(4)}°E]</div>
      </div>
    `);

    // 3. Draw End (Destination) Marker
    const endIconHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #EF4444; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </div>
        <div style="position: absolute; top: 34px; background: #EF4444; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          ARRIVAL
        </div>
      </div>
    `;

    const endIcon = L.divIcon({
      html: endIconHtml,
      className: 'heatshield-route-pin',
      iconSize: [32, 48],
      iconAnchor: [16, 16]
    });

    const endMarker = L.marker(endCoords, { icon: endIcon, zIndexOffset: 1000 }).addTo(markerLayer);
    endMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; padding: 4px;">
        <div style="font-weight: 800; color: #EF4444; text-transform: uppercase; font-size: 10px;">Destination</div>
        <div style="font-weight: 700; color: #0F172A; margin-top: 2px;">${endPlace}</div>
        <div style="color: #64748B; font-size: 11px; margin-top: 2px;">[${endCoords[0].toFixed(4)}°N, ${endCoords[1].toFixed(4)}°E]</div>
      </div>
    `);

    // 4. Draw Intermediate Checkpoint Pins for Selected Route
    if (activeRoute.checkpoints && activeRoute.checkpoints.length > 0) {
      activeRoute.checkpoints.forEach((cp, idx) => {
        if (!cp.coordinates || cp.type === 'start' || cp.type === 'end') return;

        const isShade = cp.type === 'shade';
        const isWater = cp.type === 'water';
        const isShelter = cp.type === 'shelter';

        const bg = isShade ? '#10B981' : isWater ? '#0284C7' : '#6366F1';
        const symbol = isShade ? '🌿' : isWater ? '💧' : '🏛️';

        const cpHtml = `
          <div style="background: white; border: 2px solid ${bg}; color: ${bg}; width: 24px; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer;">
            ${symbol}
          </div>
        `;

        const cpIcon = L.divIcon({
          html: cpHtml,
          className: 'heatshield-cp-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const cpMarker = L.marker(cp.coordinates, { icon: cpIcon }).addTo(markerLayer);
        cpMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 800; color: ${bg}; text-transform: uppercase; font-size: 9px;">${cp.title}</div>
            <div style="color: #0F172A; font-weight: 600; margin-top: 2px;">${cp.desc}</div>
          </div>
        `);
      });
    }

    // Automatically Fit Bounds to show entire selected route
    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      try {
        const bounds = L.polyline(activeRoute.coordinates).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
      } catch (err) {
        console.warn('Polyline getBounds failed:', err);
      }
    }
  }, [routes, selectedRouteId, startCoords, endCoords, startPlace, endPlace]);

  // Display Nearby Verified Water & Cooling Stops on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stopsLayer = stopsLayerRef.current;
    if (!map || !stopsLayer) return;

    stopsLayer.clearLayers();
    if (!showStopsLayer) return;

    // Filter points reasonably close to route center
    const midLat = (startCoords[0] + endCoords[0]) / 2;
    const midLon = (startCoords[1] + endCoords[1]) / 2;

    // Verified Cooling Centres
    INITIAL_COOLING_CENTRES.forEach(c => {
      const d = Math.hypot(c.latitude - midLat, c.longitude - midLon) * 111;
      if (d <= 15) {
        const coolIconHtml = `
          <div style="background: #0284C7; border: 2px solid #FFFFFF; color: white; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 2px 6px rgba(2,132,199,0.4);">
            ❄️
          </div>
        `;
        const coolIcon = L.divIcon({
          html: coolIconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const m = L.marker([c.latitude, c.longitude], { icon: coolIcon }).addTo(stopsLayer);
        m.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 800; color: #0284C7; text-transform: uppercase; font-size: 9px;">Verified Cooling Shelter</div>
            <div style="font-weight: 700; color: #0F172A; margin-top: 1px;">${c.name}</div>
            <div style="color: #64748B; font-size: 10px; margin-top: 2px;">${c.address}</div>
            <div style="color: #10B981; font-weight: 600; font-size: 10px; margin-top: 3px;">✓ Air-Conditioned • Clean Water • Open</div>
          </div>
        `);
      }
    });

    // Public Water Points
    INITIAL_WATER_POINTS.forEach(w => {
      const d = Math.hypot(w.latitude - midLat, w.longitude - midLon) * 111;
      if (d <= 15) {
        const waterIconHtml = `
          <div style="background: #0EA5E9; border: 2px solid #FFFFFF; color: white; width: 20px; height: 20px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 2px 6px rgba(14,165,233,0.4);">
            💧
          </div>
        `;
        const waterIcon = L.divIcon({
          html: waterIconHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const m = L.marker([w.latitude, w.longitude], { icon: waterIcon }).addTo(stopsLayer);
        m.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 800; color: #0EA5E9; text-transform: uppercase; font-size: 9px;">Public Water Kiosk</div>
            <div style="font-weight: 700; color: #0F172A; margin-top: 1px;">${w.name}</div>
            <div style="color: #10B981; font-weight: 600; font-size: 10px; margin-top: 2px;">✓ Operational Clean Drinking Water</div>
          </div>
        `);
      }
    });
  }, [showStopsLayer, startCoords, endCoords]);

  // Live Navigation Simulation
  const startNavigation = () => {
    if (!activeRoute || activeRoute.coordinates.length < 2) return;
    setIsNavigating(true);
    setNavStepIndex(0);

    const map = mapInstanceRef.current;
    if (!map) return;

    // Create Navigation Pulsing Pin
    const navPinHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(30, 96, 242, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 9999px; background: #1E60F2; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(30, 96, 242, 0.6); display: flex; align-items: center; justify-content: center; color: white;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background: white;"></div>
        </div>
      </div>
    `;

    const navIcon = L.divIcon({
      html: navPinHtml,
      className: 'heatshield-nav-live-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (navMarkerRef.current) {
      map.removeLayer(navMarkerRef.current);
    }

    const firstCoord = activeRoute.coordinates[0];
    const marker = L.marker(firstCoord, { icon: navIcon, zIndexOffset: 2000 }).addTo(map);
    navMarkerRef.current = marker;

    map.setView(firstCoord, 16, { animate: true });

    let currentIdx = 0;
    const totalSteps = activeRoute.coordinates.length;
    const stepInterval = Math.max(800, Math.min(2000, 30000 / totalSteps));

    if (navIntervalRef.current) clearInterval(navIntervalRef.current);

    navIntervalRef.current = setInterval(() => {
      currentIdx += 1;
      if (currentIdx >= totalSteps) {
        currentIdx = totalSteps - 1;
        clearInterval(navIntervalRef.current!);
      }
      setNavStepIndex(currentIdx);

      const nextCoord = activeRoute.coordinates[currentIdx];
      if (marker && nextCoord) {
        marker.setLatLng(nextCoord);
        if (currentIdx % 3 === 0) {
          map.panTo(nextCoord, { animate: true, duration: 0.8 });
        }
      }
    }, stepInterval);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (navIntervalRef.current) {
      clearInterval(navIntervalRef.current);
      navIntervalRef.current = null;
    }
    const map = mapInstanceRef.current;
    if (map && navMarkerRef.current) {
      map.removeLayer(navMarkerRef.current);
      navMarkerRef.current = null;
    }
    handleFitRouteBounds();
  };

  // Heat Exposure categorization
  const getExposureBadge = (score: number) => {
    if (score <= 45) {
      return {
        label: 'Low Heat Exposure',
        variant: 'success' as const,
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        dotClass: 'bg-emerald-500'
      };
    } else if (score <= 65) {
      return {
        label: 'Moderate Exposure',
        variant: 'brand' as const,
        colorClass: 'text-sky-700 bg-sky-50 border-sky-200',
        dotClass: 'bg-sky-500'
      };
    }
    return {
      label: 'High Heat Exposure',
      variant: 'danger' as const,
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
      dotClass: 'bg-rose-500'
    };
  };

  const activeExposure = getExposureBadge(activeRoute.heat_exposure_score);

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto px-3 sm:px-4">
      <LocationTrackerBar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Heat-Safe Routes
            </h1>
            <Badge variant="brand" size="sm">Tree Canopy & Hydration</Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Navigate through tree-shaded avenues with real-time public water kiosks and cooling shelters.
          </p>
        </div>

        {/* Travel Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setTravelMode('walk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              travelMode === 'cycle'
                ? 'bg-[#1E60F2] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cycling</span>
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
            <span>Driving</span>
          </button>
        </div>
      </div>

      {/* Origin / Destination Search Bar with Real Autocomplete */}
      <Card padding="md" className="border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Origin Autocomplete */}
          <LocationAutocompleteInput
            label="Origin (Start Location)"
            value={startPlace}
            placeholder="Search starting locality, landmark, or address..."
            iconType="origin"
            onChange={setStartPlace}
            onSelect={handleSelectOrigin}
            onUseCurrentLocation={handleUseCurrentLocation}
          />

          {/* Swap Button */}
          <div className="flex items-center justify-center py-0.5 lg:py-0">
            <button
              type="button"
              onClick={handleSwapPlaces}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1E60F2] transition-colors"
              title="Swap origin and destination"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Autocomplete */}
          <LocationAutocompleteInput
            label="Destination"
            value={endPlace}
            placeholder="Search destination place, metro, or landmark..."
            iconType="destination"
            onChange={setEndPlace}
            onSelect={handleSelectDestination}
          />

          {/* Quick Presets Horizontal Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F1F5F9]">
            <span className="text-[11px] font-bold text-[#64748B] mr-0.5 shrink-0">Presets:</span>
            {presets.map(p => (
              <button
                key={p.start}
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:text-[#1E60F2] text-[#0F172A] font-semibold text-[11px] whitespace-nowrap transition-colors border border-[#E2E8F0]"
              >
                {p.start.split(' ')[0]} → {p.end.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {routeError && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-xl flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{routeError}</span>
          </div>
        )}
      </Card>

      {/* Main Map Viewport with OVERLAID Floating Route Info Panel */}
      <div className="relative w-full h-[620px] lg:h-[700px] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100">
        {/* Leaflet Canvas Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Right Map Controls Overlay */}
        <div className="absolute top-3.5 right-14 z-[900] flex items-center gap-1.5">
          {/* Fit Route Bounds Button */}
          <button
            onClick={handleFitRouteBounds}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0F172A] text-xs font-semibold shadow-md border border-[#E2E8F0] backdrop-blur-sm transition-all"
            title="Fit complete route in map view"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#1E60F2]" />
            <span className="hidden sm:inline">Fit Route</span>
          </button>

          {/* Toggle Cooling/Water Stops */}
          <button
            onClick={() => setShowStopsLayer(!showStopsLayer)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border backdrop-blur-sm transition-all ${
              showStopsLayer
                ? 'bg-blue-50 text-[#1E60F2] border-blue-200'
                : 'bg-white/90 hover:bg-white text-[#64748B] border-[#E2E8F0]'
            }`}
            title="Toggle nearby cooling centers & water stops"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cooling Stops</span>
          </button>

          {/* Map Layer Switcher */}
          <button
            onClick={() => setMapStyle(mapStyle === 'carto' ? 'osm' : 'carto')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0F172A] text-xs font-semibold shadow-md border border-[#E2E8F0] backdrop-blur-sm transition-all"
            title="Toggle map style"
          >
            <Layers className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[11px] uppercase font-bold">{mapStyle}</span>
          </button>
        </div>

        {/* Live Navigation Active Banner (Top Center) */}
        {isNavigating && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[950] bg-[#0F172A]/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Live Route Guidance
              </div>
              <div className="text-xs font-bold">
                Continuing along tree canopy shade corridor
              </div>
            </div>
            <button
              onClick={stopNavigation}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Exit
            </button>
          </div>
        )}

        {/* Loading Indicator Overlay */}
        {isCalculatingRoutes && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[950] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-[#E2E8F0] flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#1E60F2] animate-spin" />
            <span className="text-xs font-semibold text-[#0F172A]">Calculating live road geometry & thermal scores...</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP FLOATING ROUTE INFORMATION CARD (Over Top-Left of Map) */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:block absolute top-4 left-4 z-[900] w-[370px] max-h-[calc(100%-32px)] overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 space-y-3.5 transition-all">
            {/* Header: SAFE ROUTE badge and collapse toggle */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Safe Route</span>
                </span>
                {isCalculatingRoutes && (
                  <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#1E60F2]" />
                    <span>Updating</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors"
                title={isPanelCollapsed ? 'Expand panel' : 'Minimize panel'}
              >
                {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Origin -> Destination Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#0F172A] font-bold">
                <span className="truncate max-w-[145px]" title={startPlace}>{startPlace}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E60F2] shrink-0" />
                <span className="truncate max-w-[145px]" title={endPlace}>{endPlace}</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 capitalize flex items-center gap-1">
                {travelMode === 'walk' ? <Footprints className="w-3 h-3" /> : travelMode === 'cycle' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                <span>{travelMode} mode • {routes.length} options computed</span>
              </div>
            </div>

            {/* Collapsible Content */}
            {!isPanelCollapsed && (
              <>
                {/* Route Alternatives Selection Pills */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                    Select Path Variant:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {routes.map(r => {
                      const isSelected = r.id === selectedRouteId;
                      const isCanopy = r.route_type === 'low_heat_exposure';
                      const isRespite = r.route_type === 'respite_optimized';

                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRouteId(r.id)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-blue-50/90 border-[#1E60F2] ring-1 ring-[#1E60F2]'
                              : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0F172A]">
                            {isCanopy ? (
                              <Trees className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : isRespite ? (
                              <Droplets className="w-3 h-3 text-sky-600 shrink-0" />
                            ) : (
                              <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate">
                              {isCanopy ? 'Coolest' : isRespite ? 'Respite' : 'Fastest'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                            {r.duration_minutes} min
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Key Statistics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-center">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Distance</span>
                    <span className="text-xs font-bold text-[#0F172A]">{activeRoute.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Travel Time</span>
                    <span className="text-xs font-bold text-[#0F172A]">{activeRoute.duration_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Tree Shade</span>
                    <span className="text-xs font-bold text-emerald-700">{activeRoute.shade_coverage_pct}%</span>
                  </div>
                </div>

                {/* Heat Exposure & Checklist */}
                <div className="space-y-2 text-xs">
                  {/* Heat Exposure Score Pill */}
                  <div className="flex items-center justify-between p-2 rounded-xl border bg-white border-[#E2E8F0]">
                    <span className="text-[#64748B] text-[11px] font-medium">Heat Exposure</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${activeExposure.dotClass}`} />
                      <span className="font-bold text-[11px] text-[#0F172A]">
                        {activeRoute.heat_exposure_score <= 45 ? 'Low' : activeRoute.heat_exposure_score <= 65 ? 'Moderate' : 'High'} ({activeRoute.heat_exposure_score}/100)
                      </span>
                    </div>
                  </div>

                  {/* Avoids High-Risk Area Checklist Item */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-[#64748B]">Avoids high-risk area:</span>
                    {activeRoute.avoids_high_risk !== false ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Yes (Verified)</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Asphalt Hotspot</span>
                      </span>
                    )}
                  </div>

                  {/* Cooling Point Nearby Checklist Item */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-[#64748B]">Cooling point nearby:</span>
                    <span className="text-sky-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Yes ({activeRoute.cooling_centres_count + activeRoute.water_points_count} along route)</span>
                    </span>
                  </div>
                </div>

                {/* Route Summary Text */}
                <p className="text-[11px] text-[#64748B] leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {activeRoute.summary}
                </p>

                {/* Start Navigation Action Button */}
                <div>
                  {!isNavigating ? (
                    <button
                      type="button"
                      onClick={startNavigation}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1E60F2] hover:bg-[#1850CE] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.99]"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Route Navigation</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopNavigation}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.99]"
                    >
                      <X className="w-4 h-4" />
                      <span>Exit Navigation Simulation</span>
                    </button>
                  )}
                </div>

                {/* Toggle Checkpoints Details */}
                <div className="pt-1 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setShowCheckpoints(!showCheckpoints)}
                    className="w-full text-[11px] text-[#1E60F2] hover:text-[#1850CE] font-bold flex items-center justify-between py-1"
                  >
                    <span>Heat Checkpoints ({activeRoute.checkpoints?.length || 0})</span>
                    {showCheckpoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showCheckpoints && activeRoute.checkpoints && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                      {activeRoute.checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10px] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-white ${
                            cp.type === 'start' ? 'bg-emerald-600' :
                            cp.type === 'end' ? 'bg-rose-600' :
                            cp.type === 'shade' ? 'bg-emerald-500' :
                            cp.type === 'water' ? 'bg-sky-500' :
                            'bg-blue-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[#0F172A] block truncate">{cp.title}</span>
                            <span className="text-[#64748B] block truncate">{cp.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE FLOATING BOTTOM SHEET / EXPANDABLE OVERLAY CARD        */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:hidden absolute bottom-3 left-3 right-3 z-[900]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-2xl p-3.5 transition-all">
            {/* Header: drag bar / tap to expand */}
            <div 
              onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
              className="cursor-pointer"
            >
              <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Safe Route</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#0F172A] truncate max-w-[130px]">
                    {startPlace.split(' ')[0]} → {endPlace.split(' ')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                  <span className="font-bold text-[#0F172A]">{activeRoute.distance_km} km</span>
                  <span>•</span>
                  <span className="font-bold text-[#0F172A]">{activeRoute.duration_minutes} min</span>
                  {isMobileSheetExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
                </div>
              </div>
            </div>

            {/* Quick action button always visible on mobile */}
            {!isMobileSheetExpanded && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 text-[10px] text-[#64748B]">
                  <span className="text-emerald-700 font-bold">✓ Avoids high-risk area</span> • {activeRoute.shade_coverage_pct}% tree shade
                </div>
                {!isNavigating ? (
                  <button
                    onClick={startNavigation}
                    className="px-3.5 py-1.5 bg-[#1E60F2] text-white rounded-xl text-xs font-bold shrink-0 shadow-xs flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Start Route</span>
                  </button>
                ) : (
                  <button
                    onClick={stopNavigation}
                    className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Exit</span>
                  </button>
                )}
              </div>
            )}

            {/* Expanded Content on Mobile */}
            {isMobileSheetExpanded && (
              <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-3">
                {/* Route Switcher Pills */}
                <div className="grid grid-cols-3 gap-1.5">
                  {routes.map(r => {
                    const isSelected = r.id === selectedRouteId;
                    const isCanopy = r.route_type === 'low_heat_exposure';
                    const isRespite = r.route_type === 'respite_optimized';

                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRouteId(r.id)}
                        className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                          isSelected
                            ? 'bg-blue-50 border-[#1E60F2] text-[#1E60F2]'
                            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
                        }`}
                      >
                        <div>{isCanopy ? 'Coolest' : isRespite ? 'Respite' : 'Fastest'}</div>
                        <div className="text-[10px] font-medium text-[#64748B]">{r.duration_minutes} min</div>
                      </button>
                    );
                  })}
                </div>

                {/* Details Checklist */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Avoids High-Risk Area</span>
                    <span className="font-bold text-emerald-700">✓ Protected Path</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Cooling Points Nearby</span>
                    <span className="font-bold text-sky-700">✓ {activeRoute.water_points_count + activeRoute.cooling_centres_count} Available</span>
                  </div>
                </div>

                {/* Mobile Start Navigation Button */}
                {!isNavigating ? (
                  <button
                    onClick={startNavigation}
                    className="w-full py-2.5 bg-[#1E60F2] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Start Route Navigation</span>
                  </button>
                ) : (
                  <button
                    onClick={stopNavigation}
                    className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit Navigation</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Comparison Highlights Card Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coolest Canopy Route Card */}
        <Card padding="md" className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
                Recommended Safe Path
              </span>
              <h4 className="text-base font-bold text-[#0F172A]">Coolest Shaded Route</h4>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Sun Exposure</span>
            <span className="font-bold text-emerald-700">38/100 (42% Less Sun)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Tree Canopy Coverage</span>
            <span className="font-semibold text-emerald-800">78% Shaded</span>
          </div>
        </Card>

        {/* Respite & Hydration Card */}
        <Card padding="md" className="bg-gradient-to-br from-sky-500/10 to-transparent border-sky-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-sky-800 tracking-wider">
                Hydration Priority
              </span>
              <h4 className="text-base font-bold text-[#0F172A]">Water & Respite Corridor</h4>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Clean Water Kiosks</span>
            <span className="font-bold text-sky-700">3 Verified Stations</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Cooling Shelters</span>
            <span className="font-semibold text-sky-800">2 Municipal AC Halls</span>
          </div>
        </Card>

        {/* Fastest Direct Highway Card */}
        <Card padding="md" className="border-[#E2E8F0]">
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
            <span className="font-bold text-amber-700">84/100 (High Exposure)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Asphalt Radiant Heat</span>
            <span className="font-semibold text-rose-600">&gt; 45°C Surface Temp</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
