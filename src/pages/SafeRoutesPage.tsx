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
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  RotateCw,
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
  X,
  Box,
  RefreshCw,
  Milestone,
  ListOrdered
} from 'lucide-react';
import { RouteScene3D } from '../components/3d/RouteScene3D';
import { HeatSafeRoute, GeocodedPlace, RouteStep, RouteCheckpoint } from '../types';
import { 
  fetchHeatSafeRoutes, 
  formatRouteDistance, 
  formatRouteDuration,
  getDistanceKm 
} from '../lib/safeRoutingService';
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

  // Real Road Route Data State (Never static/fake splines)
  const [routes, setRoutes] = useState<HeatSafeRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);

  // UI Panel & View State
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [showDirections, setShowDirections] = useState(true);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [mobileTab, setMobileTab] = useState<'overview' | 'directions' | 'checkpoints'>('overview');
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

  // Presets for Quick Testing
  const presets = [
    { start: 'Hebbal Flyover', end: 'Yelahanka Old Town', s: [13.0358, 77.5970] as [number, number], e: [13.1025, 77.5980] as [number, number] },
    { start: 'Indiranagar 100ft Rd', end: 'Shivaji Nagar Market', s: [12.9784, 77.6408] as [number, number], e: [12.9860, 77.6035] as [number, number] },
    { start: 'Whitefield ITPL', end: 'Garudacharpalya Metro', s: [12.9865, 77.7380] as [number, number], e: [12.9920, 77.7120] as [number, number] },
    { start: 'Connaught Place', end: 'Karol Bagh Market', s: [28.6315, 77.2167] as [number, number], e: [28.6515, 77.1906] as [number, number] }
  ];

  // Primary calculation function connecting directly to real road routing via OSRM
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
        setRouteError(null);
      } else {
        throw new Error('No road route returned');
      }
    } catch (err: any) {
      console.error('Safe routing fetch failed:', err);
      // Truthful error state: never fallback to fake splines or curves
      setRouteError('Unable to calculate road route. Please check the selected locations or network connection.');
      setRoutes([]);
      setSelectedRouteId('');
    } finally {
      setIsCalculatingRoutes(false);
    }
  }, []);

  // On Initial Mount: trigger calculateRoutes immediately so real road routes are displayed
  useEffect(() => {
    calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode);
  }, []);

  // When Travel Mode changes, recalculate
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
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

  // Invalidate Leaflet map size when switching back to 2D
  useEffect(() => {
    if (viewMode === '2d' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 120);
    }
  }, [viewMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [startCoords[0] || 13.0600, startCoords[1] || 77.6000],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

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
  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;

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

  // Focus specific coordinate step or checkpoint on map
  const handleFocusPoint = (coords?: [number, number]) => {
    if (!coords || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView(coords, 17, { animate: true });
  };

  // Update Route Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyLayer = polylinesLayerRef.current;
    const markerLayer = markersLayerRef.current;
    if (!map || !polyLayer || !markerLayer) return;

    polyLayer.clearLayers();
    markerLayer.clearLayers();

    if (!routes || routes.length === 0) return;

    // 1. Draw All Real Road Route Polylines
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

      // Draw Main Road Line
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
          <span style="color: ${color}; font-weight: 700;">${r.formatted_distance || `${r.distance_km} km`} • ${r.formatted_duration || `${r.duration_minutes} min`}</span>
        </div>`,
        { sticky: true }
      );
    });

    // 2. Draw Start Marker
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

    // 3. Draw End Marker
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
    if (activeRoute?.checkpoints && activeRoute.checkpoints.length > 0) {
      activeRoute.checkpoints.forEach((cp) => {
        if (!cp.coordinates || cp.type === 'start' || cp.type === 'end') return;

        const isShade = cp.type === 'shade';
        const isWater = cp.type === 'water';

        const bg = isShade ? '#10B981' : isWater ? '#0284C7' : '#6366F1';
        const symbol = isShade ? '🌿' : isWater ? '💧' : '🏛️';

        const cpHtml = `
          <div style="background: white; border: 2.5px solid ${bg}; color: ${bg}; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.18); cursor: pointer;">
            ${symbol}
          </div>
        `;

        const cpIcon = L.divIcon({
          html: cpHtml,
          className: 'heatshield-cp-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const cpMarker = L.marker(cp.coordinates, { icon: cpIcon }).addTo(markerLayer);
        cpMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 3px; max-width: 200px;">
            <div style="font-weight: 800; color: ${bg}; text-transform: uppercase; font-size: 9px;">${cp.title}</div>
            <div style="color: #0F172A; font-weight: 700; margin-top: 2px;">${cp.desc}</div>
            ${cp.temperature ? `<div style="color: #EF4444; font-weight: 600; font-size: 10px; margin-top: 2px;">Temp: ${cp.temperature}°C</div>` : ''}
            ${cp.reason ? `<div style="color: #64748B; font-size: 10px; margin-top: 2px;">${cp.reason}</div>` : ''}
          </div>
        `);
      });
    }

    // Automatically Fit Bounds to show entire selected real route
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

  // Display Nearby Verified Water & Cooling Stops on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stopsLayer = stopsLayerRef.current;
    if (!map || !stopsLayer) return;

    stopsLayer.clearLayers();
    if (!showStopsLayer) return;

    const midLat = (startCoords[0] + endCoords[0]) / 2;
    const midLon = (startCoords[1] + endCoords[1]) / 2;

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

  // Heat Exposure categorization badge helper
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

  // Maneuver icon helper
  const renderManeuverIcon = (type?: string, modifier?: string) => {
    if (type === 'depart') {
      return <Navigation className="w-4 h-4 text-emerald-600" />;
    }
    if (type === 'arrive') {
      return <MapPin className="w-4 h-4 text-rose-600" />;
    }
    if (modifier === 'uturn') {
      return <RotateCcw className="w-4 h-4 text-amber-600" />;
    }
    if (modifier?.includes('right')) {
      if (modifier.includes('slight')) {
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      }
      return <CornerUpRight className="w-4 h-4 text-blue-600" />;
    }
    if (modifier?.includes('left')) {
      if (modifier.includes('slight')) {
        return <ArrowUpLeft className="w-4 h-4 text-blue-600" />;
      }
      return <CornerUpLeft className="w-4 h-4 text-blue-600" />;
    }
    if (type === 'roundabout' || type === 'rotary') {
      return <RotateCw className="w-4 h-4 text-purple-600" />;
    }
    return <ArrowUp className="w-4 h-4 text-slate-700" />;
  };

  // Heat risk badge helper for checkpoints
  const renderHeatRiskBadge = (risk?: string) => {
    const r = risk?.toLowerCase();
    if (r === 'low') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Low Risk
        </span>
      );
    }
    if (r === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Moderate
        </span>
      );
    }
    if (r === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          High Risk
        </span>
      );
    }
    if (r === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 border border-red-300">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Critical
        </span>
      );
    }
    return null;
  };

  // Temperature indicator helper
  const renderTemperatureBadge = (temp?: number) => {
    if (temp === undefined) return null;
    const isHigh = temp >= 40;
    const isModerate = temp >= 33 && temp < 40;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
        isHigh
          ? 'bg-rose-50 text-rose-700 border border-rose-200'
          : isModerate
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}>
        <Sun className="w-2.5 h-2.5" />
        <span>{temp}°C</span>
      </span>
    );
  };

  // Checkpoint type badge
  const renderCheckpointTypeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">S</div>;
      case 'end':
        return <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">E</div>;
      case 'shade':
        return <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">🌿</div>;
      case 'water':
        return <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs shrink-0">💧</div>;
      case 'shelter':
        return <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">🏛️</div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs shrink-0">•</div>;
    }
  };

  const activeExposure = activeRoute ? getExposureBadge(activeRoute.heat_exposure_score) : null;

  // Find routes for bottom summary cards
  const coolestRoute = routes.find(r => r.route_type === 'low_heat_exposure');
  const respiteRoute = routes.find(r => r.route_type === 'respite_optimized');
  const fastestRoute = routes.find(r => r.route_type === 'shortest');

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
            <Badge variant="brand" size="sm">Real Road Geometry & Thermal Corridors</Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Real turn-by-turn road navigation routed through tree canopies, verified cooling shelters, and public hydration kiosks.
          </p>
        </div>

        {/* Controls: View Mode (2D / 3D) & Travel Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* 3D vs 2D Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D City View</span>
              <span className="px-1 py-0.2 rounded bg-white/20 text-[9px] uppercase font-black">3D</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === '2d'
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Leaflet</span>
            </button>
          </div>

          {/* Travel Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
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
      </div>

      {/* Origin / Destination Search Bar with Autocomplete & Presets */}
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

          {/* Quick Presets Strip */}
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

        {/* Truthful Error Banner in Search Card */}
        {routeError && (
          <div className="mt-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{routeError}</span>
            </div>
            <button
              onClick={() => calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode)}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </Card>

      {/* Main Map Viewport with OVERLAID Floating Route Info Panel */}
      <div className="relative w-full h-[52vh] min-h-[380px] sm:h-[580px] lg:h-[720px] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-50">
        {/* 2D Leaflet Canvas Container */}
        <div className={`w-full h-full z-0 ${viewMode === '2d' ? 'block' : 'hidden'}`}>
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* 3D City Route Viewport */}
        {viewMode === '3d' && (
          <div className="w-full h-full z-0">
            <RouteScene3D
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              startPlace={startPlace}
              endPlace={endPlace}
              coolingCentres={INITIAL_COOLING_CENTRES}
              waterPoints={INITIAL_WATER_POINTS}
              travelMode={travelMode}
              isLoading={isCalculatingRoutes}
              height="100%"
            />
          </div>
        )}

        {/* Top-Right Map Controls Overlay (2D Leaflet Mode) */}
        {viewMode === '2d' && (
          <div className="absolute top-3.5 right-14 z-[900] flex items-center gap-1.5">
            <button
              onClick={handleFitRouteBounds}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0F172A] text-xs font-semibold shadow-md border border-[#E2E8F0] backdrop-blur-sm transition-all"
              title="Fit complete route in map view"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span className="hidden sm:inline">Fit Route</span>
            </button>

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

            <button
              onClick={() => setMapStyle(mapStyle === 'carto' ? 'osm' : 'carto')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0F172A] text-xs font-semibold shadow-md border border-[#E2E8F0] backdrop-blur-sm transition-all"
              title="Toggle map style"
            >
              <Layers className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] uppercase font-bold">{mapStyle}</span>
            </button>
          </div>
        )}

        {/* Live Navigation Simulation Active Banner (Top Center) */}
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

        {/* Truthful Error Overlay (When routing fails, never show fake curves) */}
        {routeError && !isCalculatingRoutes && routes.length === 0 && (
          <div className="absolute inset-0 z-[950] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Road Routing Unavailable</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Unable to calculate road route. Please check the selected locations or network connection.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E60F2] hover:bg-[#1850CE] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Road Route</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP FLOATING ROUTE INFORMATION CARD (Over Top-Left of Map) */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:block absolute top-4 left-4 z-[900] w-[390px] max-h-[calc(100%-32px)] overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-xl p-4 space-y-3.5 transition-all">
            {/* Header: SAFE ROUTE badge and collapse toggle */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Heat-Safe Route</span>
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
                <span className="truncate max-w-[155px]" title={startPlace}>{startPlace}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1E60F2] shrink-0" />
                <span className="truncate max-w-[155px]" title={endPlace}>{endPlace}</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 capitalize flex items-center gap-1">
                {travelMode === 'walk' ? <Footprints className="w-3 h-3" /> : travelMode === 'cycle' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                <span>{travelMode} mode • {routes.length > 0 ? `${routes.length} real road options` : 'Calculating...'}</span>
              </div>
            </div>

            {/* Error or Empty State inside Card */}
            {routeError && routes.length === 0 && !isCalculatingRoutes && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center space-y-2">
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  Unable to calculate road route. Please check the selected locations or network connection.
                </p>
                <button
                  onClick={() => calculateRoutes(startPlace, endPlace, startCoords, endCoords, travelMode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E60F2] hover:bg-[#1850CE] text-white rounded-lg text-xs font-bold transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Collapsible Content */}
            {!isPanelCollapsed && activeRoute && (
              <>
                {/* Route Alternatives Selection Cards per Section 17 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                    Select Route Variant:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {routes.map(r => {
                      const isSelected = r.id === selectedRouteId;
                      const isCanopy = r.route_type === 'low_heat_exposure';
                      const isRespite = r.route_type === 'respite_optimized';

                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRouteId(r.id)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/95 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#0F172A]">
                            {isCanopy ? (
                              <Trees className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : isRespite ? (
                              <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate">
                              {isCanopy ? 'Coolest' : isRespite ? 'Respite' : 'Fastest'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 mt-1">
                            {r.formatted_duration || `${r.duration_minutes} min`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {r.formatted_distance || `${r.distance_km} km`}
                          </div>
                          <div className="mt-1">
                            {isCanopy ? (
                              <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                ↓ {Math.max(25, r.shade_coverage_pct || 38)}% less heat
                              </span>
                            ) : isRespite ? (
                              <span className="inline-block text-[9px] font-bold text-sky-700 bg-sky-50 px-1 py-0.5 rounded border border-sky-200">
                                {Math.max(1, r.cooling_centres_count + r.water_points_count)} cooling stops
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                Direct arterial
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Route Summary Card: real formatted distance, duration, shade %, heat score */}
                <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-center">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Distance</span>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {activeRoute.formatted_distance || `${activeRoute.distance_km} km`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Travel Time</span>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {activeRoute.formatted_duration || `${activeRoute.duration_minutes} min`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Tree Shade</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {activeRoute.shade_coverage_pct}%
                    </span>
                  </div>
                </div>

                {/* Heat Exposure Score & Safety Checklist */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl border bg-white border-[#E2E8F0]">
                    <span className="text-[#64748B] text-[11px] font-medium">Heat Exposure</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${activeExposure?.dotClass || 'bg-slate-400'}`} />
                      <span className="font-bold text-[11px] text-[#0F172A]">
                        {activeRoute.heat_exposure_score <= 45 ? 'Low' : activeRoute.heat_exposure_score <= 65 ? 'Moderate' : 'High'} ({activeRoute.heat_exposure_score}/100)
                      </span>
                    </div>
                  </div>

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

                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-[#64748B]">Cooling point nearby:</span>
                    <span className="text-sky-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Yes ({activeRoute.cooling_centres_count + activeRoute.water_points_count} along corridor)</span>
                    </span>
                  </div>
                </div>

                {/* Route Summary Text */}
                <p className="text-[11px] text-[#64748B] leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {activeRoute.summary}
                </p>

                {/* Navigation Simulation Button */}
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

                {/* ------------------------------------------------------- */}
                {/* Real Turn-by-Turn Directions Panel (Expandable)         */}
                {/* ------------------------------------------------------- */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setShowDirections(!showDirections)}
                    className="w-full text-[11px] text-[#1E60F2] hover:text-[#1850CE] font-bold flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-[#1E60F2]" />
                      <span>Turn-by-Turn Directions ({activeRoute.steps?.length || 0} steps)</span>
                    </div>
                    {showDirections ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDirections && activeRoute.steps && (
                    <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {activeRoute.steps.length === 0 ? (
                        <div className="text-[11px] text-[#64748B] italic p-2 text-center">
                          Direct road corridor with no turn maneuvers required.
                        </div>
                      ) : (
                        activeRoute.steps.map((step, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleFocusPoint(step.coordinates)}
                            className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group"
                            title="Click to focus step on map"
                          >
                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs group-hover:border-blue-300">
                              {renderManeuverIcon(step.maneuver_type, step.maneuver_modifier)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#0F172A] text-[11px] leading-snug">
                                {step.instruction}
                              </div>
                              {step.street_name && (
                                <div className="text-[10px] text-[#64748B] truncate mt-0.5">
                                  {step.street_name}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                                <span className="font-semibold text-slate-700">{formatRouteDistance(step.distance_meters)}</span>
                                <span>•</span>
                                <span>{formatRouteDuration(step.duration_seconds)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------- */}
                {/* Real Heat Checkpoints Panel (Expandable)                */}
                {/* ------------------------------------------------------- */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setShowCheckpoints(!showCheckpoints)}
                    className="w-full text-[11px] text-[#1E60F2] hover:text-[#1850CE] font-bold flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Milestone className="w-3.5 h-3.5 text-[#1E60F2]" />
                      <span>Heat Checkpoints & Shelters ({activeRoute.checkpoints?.length || 0})</span>
                    </div>
                    {showCheckpoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showCheckpoints && activeRoute.checkpoints && (
                    <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {activeRoute.checkpoints.length === 0 ? (
                        <div className="text-[11px] text-[#64748B] italic p-2 text-center">
                          No checkpoints recorded along this corridor.
                        </div>
                      ) : (
                        activeRoute.checkpoints.map((cp, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleFocusPoint(cp.coordinates)}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-colors cursor-pointer space-y-1.5"
                            title="Click to view checkpoint location"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {renderCheckpointTypeIcon(cp.type)}
                                <div className="font-bold text-[#0F172A] text-[11px] truncate">
                                  {cp.title}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {renderHeatRiskBadge(cp.heat_risk)}
                                {renderTemperatureBadge(cp.temperature)}
                              </div>
                            </div>

                            <p className="text-[10px] text-[#64748B] leading-relaxed">
                              {cp.desc}
                            </p>

                            {cp.reason && (
                              <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200/60 flex items-start gap-1">
                                <Info className="w-3 h-3 text-[#1E60F2] shrink-0 mt-0.5" />
                                <span className="leading-tight">{cp.reason}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              {cp.nearby_respite ? (
                                <span className="text-sky-700 font-semibold truncate max-w-[210px]" title={cp.nearby_respite}>
                                  Nearby: {cp.nearby_respite}
                                </span>
                              ) : (
                                <span className="text-slate-400">Direct road link</span>
                              )}
                              {cp.distance_from_prev && (
                                <span className="font-mono text-slate-400 font-semibold shrink-0">
                                  +{cp.distance_from_prev}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
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

                {activeRoute ? (
                  <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                    <span className="font-bold text-[#0F172A]">
                      {activeRoute.formatted_distance || `${activeRoute.distance_km} km`}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-[#0F172A]">
                      {activeRoute.formatted_duration || `${activeRoute.duration_minutes} min`}
                    </span>
                    {isMobileSheetExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
                  </div>
                ) : (
                  <span className="text-xs text-[#64748B]">Calculating...</span>
                )}
              </div>
            </div>

            {/* Quick action strip always visible on mobile */}
            {!isMobileSheetExpanded && activeRoute && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 text-[10px] text-[#64748B]">
                  <span className="text-emerald-700 font-bold">✓ Safe road path</span> • {activeRoute.shade_coverage_pct}% tree shade
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
            {isMobileSheetExpanded && activeRoute && (
              <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain">
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
                        <div className="text-[10px] font-medium text-[#64748B]">
                          {r.formatted_duration || `${r.duration_minutes} min`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Tabs Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setMobileTab('overview')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      mobileTab === 'overview' ? 'bg-white text-[#1E60F2] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setMobileTab('directions')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      mobileTab === 'directions' ? 'bg-white text-[#1E60F2] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Turns ({activeRoute.steps?.length || 0})
                  </button>
                  <button
                    onClick={() => setMobileTab('checkpoints')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      mobileTab === 'checkpoints' ? 'bg-white text-[#1E60F2] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Checkpoints ({activeRoute.checkpoints?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {mobileTab === 'overview' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Distance</span>
                        <span className="font-bold text-xs text-[#0F172A]">
                          {activeRoute.formatted_distance || `${activeRoute.distance_km} km`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Travel Time</span>
                        <span className="font-bold text-xs text-[#0F172A]">
                          {activeRoute.formatted_duration || `${activeRoute.duration_minutes} min`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Tree Shade</span>
                        <span className="font-bold text-xs text-emerald-700">
                          {activeRoute.shade_coverage_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Heat Exposure</span>
                        <span className="font-bold text-[#0F172A]">
                          {activeRoute.heat_exposure_score}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Cooling Points</span>
                        <span className="font-bold text-sky-700">
                          {activeRoute.water_points_count + activeRoute.cooling_centres_count} Along Path
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#64748B] leading-relaxed bg-slate-50 p-2 rounded-xl">
                      {activeRoute.summary}
                    </p>
                  </div>
                )}

                {/* Tab 2: Turn-by-Turn Directions */}
                {mobileTab === 'directions' && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {activeRoute.steps && activeRoute.steps.length > 0 ? (
                      activeRoute.steps.map((step, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleFocusPoint(step.coordinates)}
                          className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {renderManeuverIcon(step.maneuver_type, step.maneuver_modifier)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#0F172A] text-[11px] leading-snug">
                              {step.instruction}
                            </div>
                            {step.street_name && (
                              <div className="text-[10px] text-[#64748B] truncate">
                                {step.street_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                              <span>{formatRouteDistance(step.distance_meters)}</span>
                              <span>•</span>
                              <span>{formatRouteDuration(step.duration_seconds)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#64748B] text-center py-4">No turn steps available.</div>
                    )}
                  </div>
                )}

                {/* Tab 3: Heat Checkpoints */}
                {mobileTab === 'checkpoints' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeRoute.checkpoints && activeRoute.checkpoints.length > 0 ? (
                      activeRoute.checkpoints.map((cp, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleFocusPoint(cp.coordinates)}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {renderCheckpointTypeIcon(cp.type)}
                              <span className="font-bold text-[#0F172A] text-[11px] truncate">{cp.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {renderHeatRiskBadge(cp.heat_risk)}
                              {renderTemperatureBadge(cp.temperature)}
                            </div>
                          </div>
                          <p className="text-[10px] text-[#64748B]">{cp.desc}</p>
                          {cp.nearby_respite && (
                            <div className="text-[10px] text-sky-700 font-medium">Nearby: {cp.nearby_respite}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#64748B] text-center py-4">No checkpoints defined.</div>
                    )}
                  </div>
                )}

                {/* Mobile Navigation Button */}
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

      {/* Dynamic Route Comparison Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coolest Canopy Route Card */}
        <Card 
          padding="md" 
          onClick={() => coolestRoute && setSelectedRouteId(coolestRoute.id)}
          className={`cursor-pointer transition-all ${
            selectedRouteId === coolestRoute?.id 
              ? 'ring-2 ring-emerald-500 bg-gradient-to-br from-emerald-500/15 to-transparent border-emerald-300' 
              : 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-200 hover:border-emerald-300'
          }`}
        >
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
            <span className="text-[#64748B]">Distance & Time</span>
            <span className="font-bold text-emerald-700">
              {coolestRoute?.formatted_distance || (coolestRoute ? `${coolestRoute.distance_km} km` : '—')} • {coolestRoute?.formatted_duration || (coolestRoute ? `${coolestRoute.duration_minutes} min` : '—')}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Sun Exposure</span>
            <span className="font-bold text-emerald-700">
              {coolestRoute ? `${coolestRoute.heat_exposure_score}/100` : '—'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Tree Canopy</span>
            <span className="font-semibold text-emerald-800">
              {coolestRoute ? `${coolestRoute.shade_coverage_pct}% Shaded` : '—'}
            </span>
          </div>
        </Card>

        {/* Respite & Hydration Card */}
        <Card 
          padding="md" 
          onClick={() => respiteRoute && setSelectedRouteId(respiteRoute.id)}
          className={`cursor-pointer transition-all ${
            selectedRouteId === respiteRoute?.id 
              ? 'ring-2 ring-sky-500 bg-gradient-to-br from-sky-500/15 to-transparent border-sky-300' 
              : 'bg-gradient-to-br from-sky-500/10 to-transparent border-sky-200 hover:border-sky-300'
          }`}
        >
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
            <span className="text-[#64748B]">Distance & Time</span>
            <span className="font-bold text-sky-700">
              {respiteRoute?.formatted_distance || (respiteRoute ? `${respiteRoute.distance_km} km` : '—')} • {respiteRoute?.formatted_duration || (respiteRoute ? `${respiteRoute.duration_minutes} min` : '—')}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Clean Water Kiosks</span>
            <span className="font-bold text-sky-700">
              {respiteRoute ? `${respiteRoute.water_points_count} Verified Stations` : '—'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Cooling Shelters</span>
            <span className="font-semibold text-sky-800">
              {respiteRoute ? `${respiteRoute.cooling_centres_count} Municipal AC Halls` : '—'}
            </span>
          </div>
        </Card>

        {/* Fastest Direct Arterial Card */}
        <Card 
          padding="md" 
          onClick={() => fastestRoute && setSelectedRouteId(fastestRoute.id)}
          className={`cursor-pointer transition-all ${
            selectedRouteId === fastestRoute?.id 
              ? 'ring-2 ring-amber-500 bg-amber-500/5 border-amber-300' 
              : 'border-[#E2E8F0] hover:border-amber-300'
          }`}
        >
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
            <span className="text-[#64748B]">Distance & Time</span>
            <span className="font-bold text-amber-700">
              {fastestRoute?.formatted_distance || (fastestRoute ? `${fastestRoute.distance_km} km` : '—')} • {fastestRoute?.formatted_duration || (fastestRoute ? `${fastestRoute.duration_minutes} min` : '—')}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Sun Exposure</span>
            <span className="font-bold text-amber-700">
              {fastestRoute ? `${fastestRoute.heat_exposure_score}/100 (High Exposure)` : '—'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#0F172A]">
            <span className="text-[#64748B]">Asphalt Radiant Heat</span>
            <span className="font-semibold text-rose-600">&gt; 42°C Surface Temp</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const SafeRoutePage = SafeRoutesPage;
export default SafeRoutesPage;
