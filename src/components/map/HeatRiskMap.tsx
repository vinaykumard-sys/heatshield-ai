import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, 
  MapPin, 
  Flame, 
  Thermometer, 
  Droplets, 
  Wind, 
  Building2, 
  Sparkles, 
  Navigation, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Compass, 
  ShieldCheck, 
  CheckCircle2,
  Maximize2,
  Minimize2,
  ChevronRight,
  Heart,
  X,
  Layers
} from 'lucide-react';
import { 
  LocationZone, 
  GeocodedPlace,
  LocationHeatReport
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationTracker } from '../../context/LocationContext';
import { mockDb } from '../../lib/mockDb';
import { fetchLiveWeather } from '../../lib/weatherApi';
import { searchGeographicalLocations, reverseGeocodeCoordinates } from '../../lib/geocodingService';
import { generateLocationHeatReport } from '../../lib/locationReportEngine';
import { LocationIntelligencePanel } from './LocationIntelligencePanel';

interface HeatRiskMapProps {
  locations?: LocationZone[];
  selectedLocationId?: string;
  onSelectLocation?: (location: LocationZone) => void;
  className?: string;
}

interface LocalityTelemetry {
  tempC: number;
  humidityPct: number;
  feelsLikeC: number;
  isAbove35: boolean; // Strictly TRUE only if tempC > 35.0°C
  pred24?: number;
  pred48?: number;
  pred72?: number;
}

// Helper for clean place pill labels
const getPlaceShortName = (fullName: string): string => {
  const parts = fullName.split('&');
  const short = parts[0].trim();
  return short
    .replace(' Satellite Town', '')
    .replace(' Aerodrome', '')
    .replace(' Flyover', '')
    .replace(' Industrial Area', ' Ind')
    .replace(' Inner Circle', '')
    .replace(' Market', '')
    .replace(' High-Density Settlement', '')
    .replace(' Industrial Estate', ' Ind')
    .replace(' Rural-Urban Fringe', '')
    .replace(' Road', ' Rd');
};

// OpenStreetMap Raster Tiles (Keyless, verified high-reliability provider)
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

export const HeatRiskMap: React.FC<HeatRiskMapProps> = ({
  locations = mockDb.getLocations(),
  selectedLocationId,
  onSelectLocation,
  className = 'h-[720px]'
}) => {
  const { t } = useLanguage();
  const { 
    currentLocation, 
    deviceLocation, 
    isAnalyzingDifferentLocation, 
    returnToDeviceLocation, 
    detectLocation, 
    analyzeCoordinates, 
    selectCustomLocality 
  } = useLocationTracker();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const targetPinLayerRef = useRef<L.LayerGroup | null>(null);
  const coolingCentresLayerRef = useRef<L.LayerGroup | null>(null);
  const waterPointsLayerRef = useRef<L.LayerGroup | null>(null);

  // State
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'osm'>('osm');
  const [activeReport, setActiveReport] = useState<LocationHeatReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Horizon Controls & Interactive Modes (Section 9: Heat Risk, Temperature, Water, Cooling, Medical, Safe Routes)
  const [forecastHorizon, setForecastHorizon] = useState<'now' | 24 | 48 | 72>('now');
  const [mapMode, setMapMode] = useState<'heat_risk' | 'temperature' | 'water' | 'cooling' | 'medical' | 'routes'>('heat_risk');
  const [showCoolingCentres, setShowCoolingCentres] = useState(true);
  const [showWaterPoints, setShowWaterPoints] = useState(true);
  const [showMonitoringStations, setShowMonitoringStations] = useState(true);

  // Telemetry sync for base locations
  const [localityTelemetry, setLocalityTelemetry] = useState<Record<string, LocalityTelemetry>>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Real-time batch telemetry sync
  const syncAllLocalitiesTelemetry = useCallback(async (forceRefresh = false) => {
    setIsRefreshingAll(true);
    const updatedTelemetry: Record<string, LocalityTelemetry> = {};

    const fetchPromises = locations.map(async (loc) => {
      try {
        const weatherData = await fetchLiveWeather(loc.latitude, loc.longitude, loc.id, forceRefresh);
        const temp = weatherData.reading.temperature_c;
        const daily = weatherData.forecastDaily || [];
        
        updatedTelemetry[loc.id] = {
          tempC: temp,
          humidityPct: weatherData.reading.relative_humidity_pct,
          feelsLikeC: weatherData.reading.feels_like_c,
          isAbove35: temp > 35.0,
          pred24: daily[1]?.max_temp_c ?? (temp + 1.2),
          pred48: daily[2]?.max_temp_c ?? (temp + 1.8),
          pred72: daily[3]?.max_temp_c ?? (temp + 0.6)
        };
      } catch (e) {
        const isNorth = loc.latitude > 25.0;
        const fallbackTemp = isNorth ? 39.5 : 33.8;
        updatedTelemetry[loc.id] = {
          tempC: fallbackTemp,
          humidityPct: 50,
          feelsLikeC: fallbackTemp + 2.5,
          isAbove35: fallbackTemp > 35.0,
          pred24: fallbackTemp + 0.8,
          pred48: fallbackTemp + 1.4,
          pred72: fallbackTemp + 0.5
        };
      }
    });

    await Promise.allSettled(fetchPromises);
    setLocalityTelemetry(updatedTelemetry);
    setIsRefreshingAll(false);
  }, [locations]);

  // Periodic 5-minute background refresh
  useEffect(() => {
    syncAllLocalitiesTelemetry(false);
    const refreshTimer = setInterval(() => {
      syncAllLocalitiesTelemetry(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [syncAllLocalitiesTelemetry]);

  // Drop Sonar Pin Marker at Selected Coordinates (Target indicator with radar rings)
  const dropSonarTargetMarker = useCallback((lat: number, lon: number, title: string, temp?: number) => {
    const targetLayer = targetPinLayerRef.current;
    if (!targetLayer) return;

    targetLayer.clearLayers();

    const isHot = (temp ?? 0) > 35.0;
    const pinColor = isHot ? '#EF4444' : '#1E60F2';
    const pinBg = isHot ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 96, 242, 0.2)';

    const sonarIconHtml = `
      <div class="heatshield-sonar-marker" style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div class="marker-halo-ring" style="border: 2px solid ${pinColor}; background: ${pinBg};"></div>
        <div class="marker-halo-ring marker-halo-ring-delayed" style="border: 1.5px solid ${pinColor};"></div>
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${pinColor};
          box-shadow: 0 0 12px ${pinColor}, 0 2px 6px rgba(0,0,0,0.15);
          border: 2.5px solid #FFFFFF;
          position: relative;
          z-index: 10;
        "></div>
        <div style="
          position: absolute;
          top: -32px;
          left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1.5px solid ${pinColor};
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
          color: #0F172A;
          padding: 3px 10px;
          border-radius: 9999px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${pinColor};"></span>
          <span>${title}</span>
          ${temp !== undefined ? `<span style="font-family: monospace; font-weight: 800; color: ${isHot ? '#EF4444' : '#1E60F2'}; background: ${isHot ? '#FEE2E2' : '#EFF6FF'}; padding: 1px 5px; border-radius: 4px;">${temp.toFixed(1)}°C</span>` : ''}
        </div>
      </div>
    `;

    const sonarIcon = L.divIcon({
      html: sonarIconHtml,
      className: 'heatshield-sonar-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    L.marker([lat, lon], { icon: sonarIcon, zIndexOffset: 1000 }).addTo(targetLayer);
  }, []);

  // Handle Location Selection (from Search or Selection)
  const handleSelectPlace = useCallback(async (place: GeocodedPlace) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsLoadingReport(true);

    // 1. Move Map smoothly to chosen location using precision zoom
    if (mapInstanceRef.current) {
      const targetZoom = place.type === 'city' ? 13 : 16;
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], targetZoom, {
        duration: 1.0,
        easeLinearity: 0.25
      });
    }

    // 2. Drop instant animated sonar target pin
    dropSonarTargetMarker(place.latitude, place.longitude, place.shortName);

    // 3. Generate end-to-end AI Location Heat Report
    try {
      const { report, weatherResult } = await generateLocationHeatReport(place);
      setActiveReport(report);

      // Update sonar pin with live confirmed temperature
      dropSonarTargetMarker(
        place.latitude,
        place.longitude,
        place.shortName,
        weatherResult.reading.temperature_c
      );

      // Synchronize with external callback and global LocationContext
      const matchedZone = locations.find(l => l.name.toLowerCase().includes(place.shortName.toLowerCase()));
      const targetZone: LocationZone = matchedZone || {
        id: `loc-custom-${Date.now()}`,
        name: place.shortName || place.displayName,
        city: place.city || 'India',
        state: place.state || 'India',
        pincode: place.pincode || '',
        latitude: place.latitude,
        longitude: place.longitude,
        baseline_vulnerability_score: 65,
        urban_heat_island_factor: 1.25,
        cooling_centers_count: 2,
        estimated_population: 25000
      };

      if (!matchedZone) {
        mockDb.saveLocation(targetZone);
      }

      if (onSelectLocation) {
        onSelectLocation(targetZone);
      } else if (analyzeCoordinates) {
        analyzeCoordinates(place.latitude, place.longitude, place.shortName);
      }
    } catch (err) {
      console.error('Error generating location heat report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [dropSonarTargetMarker, locations, onSelectLocation, analyzeCoordinates]);

  // Handle Clicking Anywhere on the Map
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Drop instant sonar marker at clicked coordinates
    dropSonarTargetMarker(lat, lon, `Selected (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`);
    setIsLoadingReport(true);

    try {
      // 1. Reverse Geocode Coordinates
      const geocoded = await reverseGeocodeCoordinates(lat, lon);

      // 2. Generate AI Location Report with fresh weather
      const { report, weatherResult } = await generateLocationHeatReport(geocoded);
      setActiveReport(report);

      // Update sonar pin with resolved place name & live temp
      dropSonarTargetMarker(
        lat, 
        lon, 
        geocoded.shortName, 
        weatherResult.reading.temperature_c
      );

      // 3. Synchronize clicked coordinates to global LocationContext as analyzed area
      const clickedZone: LocationZone = {
        id: `loc-click-${Date.now()}`,
        name: geocoded.shortName,
        city: geocoded.city,
        state: geocoded.state,
        pincode: geocoded.pincode || '',
        latitude: lat,
        longitude: lon,
        baseline_vulnerability_score: 65,
        urban_heat_island_factor: 1.25,
        cooling_centers_count: 2,
        estimated_population: 25000
      };
      mockDb.saveLocation(clickedZone);

      if (onSelectLocation) {
        onSelectLocation(clickedZone);
      } else if (analyzeCoordinates) {
        analyzeCoordinates(lat, lon, geocoded.shortName);
      }
    } catch (err) {
      console.error('Error handling map click report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [dropSonarTargetMarker, onSelectLocation, analyzeCoordinates]);

  // Helper to build tile layer
  const createTileLayer = useCallback((style: 'dark' | 'satellite' | 'osm'): L.TileLayer => {
    if (style === 'satellite') {
      return L.tileLayer(ESRI_SATELLITE_URL, {
        attribution: ESRI_ATTRIBUTION,
        className: 'heatshield-satellite-tiles',
        maxZoom: 18,
      });
    }

    if (style === 'osm') {
      return L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      });
    }

    // Futuristic Dark Command: OpenStreetMap raster tiles with dark navy CSS shader filter
    // Keyless, no watermarks, full global coverage, high resolution
    return L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      className: 'heatshield-dark-tiles',
      maxZoom: 19,
    });
  }, []);

  // Initialize Leaflet Map (Created once, updated reactively)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocation.latitude || 13.0854;
    const initialLon = currentLocation.longitude || 77.6250;
    const initialZoom = currentLocation.locationSource === 'gps' ? 15 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true
    });

    // Initial Tile Layer
    const tileLayer = createTileLayer('osm');
    tileLayer.addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    coolingCentresLayerRef.current = L.layerGroup().addTo(map);
    waterPointsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    targetPinLayerRef.current = L.layerGroup().addTo(map);

    // Zoom and click listeners
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('click', handleMapClick);

    mapInstanceRef.current = map;

    return () => {
      map.off('click', handleMapClick);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [handleMapClick, createTileLayer]);

  // Reactively track canonical location changes (GPS, search, click) and move map smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation.latitude || !currentLocation.longitude) return;

    const targetZoom = currentLocation.locationSource === 'gps'
      ? 15
      : currentLocation.locationSource === 'search'
      ? 15
      : 13;

    map.flyTo([currentLocation.latitude, currentLocation.longitude], targetZoom, {
      duration: 1.0,
      easeLinearity: 0.25
    });

    map.invalidateSize();
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.locationSource]);

  // Switch Tile Style on selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newLayer = createTileLayer(mapStyle);
    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [mapStyle, createTileLayer]);

  // Live Debounced Geocoding Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const results = await searchGeographicalLocations(searchQuery, controller.signal);
        setSearchSuggestions(results);
        setIsSearchOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(delayTimer);
      controller.abort();
    };
  }, [searchQuery]);

  // Render Base Monitoring Markers with Smart Clustering & Anti-Overlap
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const zonesLayer = zonesLayerRef.current;
    const coolingLayer = coolingCentresLayerRef.current;
    const waterLayer = waterPointsLayerRef.current;

    if (!map || !markersLayer || !zonesLayer || !coolingLayer || !waterLayer) return;

    markersLayer.clearLayers();
    zonesLayer.clearLayers();
    coolingLayer.clearLayers();
    waterLayer.clearLayers();

    // 1. Device GPS Location Pin (Rendered only when real GPS device position is available)
    if (deviceLocation && deviceLocation.isRealDeviceLocation) {
      const deviceName = deviceLocation.localityName || 'Your Device';
      const deviceMarkerHtml = `
        <div style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
          <div class="marker-halo-ring" style="border: 2px solid #1E60F2; background: rgba(30, 96, 242, 0.18);"></div>
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #FFFFFF;
            border: 2px solid #1E60F2;
            box-shadow: 0 6px 18px rgba(30, 96, 242, 0.22);
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: inherit;
            font-size: 11px;
            font-weight: 800;
            color: #0F172A;
            white-space: nowrap;
            position: relative;
            z-index: 10;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #1E60F2;
              box-shadow: 0 0 8px #1E60F2;
              display: inline-block;
            "></span>
            <span>📍 YOU: ${deviceName}</span>
          </div>
        </div>
      `;

      const deviceIcon = L.divIcon({
        html: deviceMarkerHtml,
        className: 'heatshield-device-pin',
        iconSize: [160, 32],
        iconAnchor: [80, 16],
      });

      L.marker([deviceLocation.latitude, deviceLocation.longitude], { icon: deviceIcon, zIndexOffset: 900 }).addTo(markersLayer);
    }

    // Active Analyzed / Current Location Marker (placed at active coordinates if different from deviceLocation or if GPS not active)
    if (currentLocation.latitude && currentLocation.longitude) {
      const isSameAsDevice = deviceLocation && 
        Math.abs(currentLocation.latitude - deviceLocation.latitude) < 0.001 &&
        Math.abs(currentLocation.longitude - deviceLocation.longitude) < 0.001;

      if (!isSameAsDevice) {
        const isDefault = currentLocation.locationSource === 'default';
        const isGps = currentLocation.locationSource === 'gps' && currentLocation.isRealDeviceLocation;
        const activeLabel = isGps 
          ? `📍 YOU: ${currentLocation.localityName || 'Your Location'}`
          : isDefault
          ? `📍 Default Area: ${currentLocation.localityName || 'Bengaluru Urban'}`
          : `🎯 Analyzed: ${currentLocation.localityName || 'Selected Area'}`;

        const activeBorderColor = isGps ? '#1E60F2' : isDefault ? '#F59E0B' : '#0284C7';
        const activeDotColor = isGps ? '#1E60F2' : isDefault ? '#F59E0B' : '#0284C7';

        const activeMarkerHtml = `
          <div style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
            <div class="marker-halo-ring" style="border: 2px solid ${activeBorderColor}; background: rgba(30, 96, 242, 0.15);"></div>
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #FFFFFF;
              border: 1.5px solid ${activeBorderColor};
              box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
              padding: 4px 10px;
              border-radius: 9999px;
              font-family: inherit;
              font-size: 11px;
              font-weight: 800;
              color: #0F172A;
              white-space: nowrap;
              position: relative;
              z-index: 10;
            ">
              <span style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: ${activeDotColor};
                display: inline-block;
              "></span>
              <span>${activeLabel}</span>
            </div>
          </div>
        `;

        const activeIcon = L.divIcon({
          html: activeMarkerHtml,
          className: 'heatshield-active-pin',
          iconSize: [170, 32],
          iconAnchor: [85, 16],
        });

        L.marker([currentLocation.latitude, currentLocation.longitude], { icon: activeIcon, zIndexOffset: 850 }).addTo(markersLayer);
      }
    }

    // 2. Cooling Centres Layer (rendered at zoom >= 12 to avoid clutter)
    if (showCoolingCentres && currentZoom >= 12) {
      const coolingCentres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
      coolingCentres.forEach(centre => {
        const coolIcon = L.divIcon({
          html: `
            <div style="
              background: #FFFFFF;
              border: 1.5px solid #0284C7;
              color: #0369A1;
              border-radius: 9999px;
              padding: 3px 9px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(2, 132, 199, 0.16);
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>❄️</span>
              <span style="max-width: 95px; overflow: hidden; text-overflow: ellipsis;">${centre.name.split(' ')[0]}</span>
            </div>
          `,
          className: 'cooling-map-pin',
          iconSize: [110, 24],
          iconAnchor: [55, 12]
        });

        const coolMarker = L.marker([centre.latitude, centre.longitude], { icon: coolIcon }).addTo(coolingLayer);
        coolMarker.bindPopup(`
          <div style="min-width: 250px; font-family: inherit; color: #0F172A; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #0284C7; background: #E0F2FE; padding: 2px 8px; border-radius: 9999px;">
                ❄️ Verified Cooling Sanctuary
              </span>
              <span style="font-size: 10px; font-weight: 700; color: #16A34A; background: #DCFCE7; padding: 2px 7px; border-radius: 9999px;">
                ● ${centre.operating_status === 'open' ? 'Open now' : centre.operating_status}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin: 4px 0 2px 0;">
              ${centre.name}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
              ${centre.address}
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 8px; font-size: 11px; margin-bottom: 10px; display: grid; grid-template-columns: 1fr; gap: 4px; color: #334155;">
              <div>⏰ <b>Hours:</b> ${centre.operating_hours}</div>
              <div>👥 <b>Capacity:</b> ~${centre.capacity_estimate} persons</div>
              <div>💧 <b>Clean Water:</b> ${centre.drinking_water_available ? 'Available' : 'No'}</div>
            </div>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}" 
              target="_blank" 
              rel="noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #1E60F2; color: #FFFFFF; padding: 8px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 12px rgba(30, 96, 242, 0.25);"
            >
              <span>Get Directions</span>
              <span>→</span>
            </a>
          </div>
        `, { className: 'heatshield-soft-popup' });
      });
    }

    // 3. Public Water Points Layer (rendered at zoom >= 13)
    if (showWaterPoints && currentZoom >= 13) {
      const waterPoints = mockDb.getWaterPoints().filter(w => w.is_operational);
      waterPoints.forEach(wp => {
        const waterIcon = L.divIcon({
          html: `
            <div style="
              background: #FFFFFF;
              color: #1E40AF;
              border: 1.5px solid #2563EB;
              border-radius: 9999px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.16);
              display: flex;
              align-items: center;
              gap: 3px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>💧 Water ATM</span>
            </div>
          `,
          className: 'water-map-pin',
          iconSize: [88, 24],
          iconAnchor: [44, 12]
        });

        const waterMarker = L.marker([wp.latitude, wp.longitude], { icon: waterIcon }).addTo(waterLayer);
        waterMarker.bindPopup(`
          <div style="min-width: 220px; font-family: inherit; color: #0F172A; padding: 2px;">
            <div style="font-size: 10px; font-weight: 700; color: #2563EB; background: #EFF6FF; padding: 2px 8px; border-radius: 9999px; display: inline-block; margin-bottom: 4px;">
              💧 Public Water Point
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin: 2px 0;">
              ${wp.name}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
              Locality: ${wp.locality_name} • <span style="color: #16A34A; font-weight: 700;">Operational</span>
            </div>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}" 
              target="_blank" 
              rel="noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; background: #1E60F2; color: #FFFFFF; padding: 7px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 12px rgba(30, 96, 242, 0.25);"
            >
              <span>Get Directions</span>
              <span>→</span>
            </a>
          </div>
        `, { className: 'heatshield-soft-popup' });
      });
    }

    // 4. Monitored Municipal Zones & Markers with Clustering & Collision Prevention
    if (showMonitoringStations) {
      // Step A: Prepare station data with current telemetry
      const stationData = locations.map(loc => {
        const telemetry = localityTelemetry[loc.id];
        const isNorth = loc.latitude > 25.0;
        const defaultTemp = isNorth ? 39.5 : 33.8;
        
        let activeTemp = telemetry?.tempC ?? defaultTemp;
        if (forecastHorizon === 24) activeTemp = telemetry?.pred24 ?? (activeTemp + 1.2);
        else if (forecastHorizon === 48) activeTemp = telemetry?.pred48 ?? (activeTemp + 1.8);
        else if (forecastHorizon === 72) activeTemp = telemetry?.pred72 ?? (activeTemp + 0.6);

        // USER RULE: Red circle ONLY when temp > 35.0°C!
        const isAbove35 = activeTemp > 35.0;

        return {
          location: loc,
          activeTemp,
          isAbove35
        };
      });

      // Step B: Render Red Danger Circles for >35°C zones
      stationData.forEach(({ location: loc, activeTemp, isAbove35 }) => {
        if (isAbove35) {
          L.circle([loc.latitude, loc.longitude], {
            radius: 2400 + (loc.estimated_population / 30),
            color: '#EF4444',
            weight: 2,
            opacity: 0.85,
            fillColor: '#DC2626',
            fillOpacity: 0.22,
            dashArray: '6, 6'
          }).addTo(zonesLayer);
        }
      });

      // Step C: Proximity Clustering Algorithm (Prevent Overlapping!)
      // At zoom < 13: Cluster markers closer than 55px to each other
      const clusterThresholdPx = currentZoom < 11 ? 75 : currentZoom < 13 ? 55 : 0;

      if (clusterThresholdPx > 0) {
        // Group into clusters based on screen distance
        const clusters: Array<typeof stationData> = [];
        const visited = new Set<string>();

        stationData.forEach(item => {
          if (visited.has(item.location.id)) return;
          const currentPoint = map.latLngToLayerPoint([item.location.latitude, item.location.longitude]);
          const currentCluster = [item];
          visited.add(item.location.id);

          stationData.forEach(candidate => {
            if (visited.has(candidate.location.id)) return;
            const candidatePoint = map.latLngToLayerPoint([candidate.location.latitude, candidate.location.longitude]);
            const dist = Math.hypot(currentPoint.x - candidatePoint.x, currentPoint.y - candidatePoint.y);
            if (dist < clusterThresholdPx) {
              currentCluster.push(candidate);
              visited.add(candidate.location.id);
            }
          });

          clusters.push(currentCluster);
        });

        // Render each cluster
        clusters.forEach(cluster => {
          if (cluster.length > 1) {
            // Multiple nearby markers grouped
            const avgLat = cluster.reduce((sum, c) => sum + c.location.latitude, 0) / cluster.length;
            const avgLon = cluster.reduce((sum, c) => sum + c.location.longitude, 0) / cluster.length;
            const avgTemp = cluster.reduce((sum, c) => sum + c.activeTemp, 0) / cluster.length;
            const hasCritical = cluster.some(c => c.isAbove35);

            const clusterIcon = L.divIcon({
              html: `
                <div class="heatshield-cluster-pill" style="
                  background: #FFFFFF;
                  border: 1.5px solid ${hasCritical ? '#EF4444' : '#1E60F2'};
                  box-shadow: 0 4px 14px ${hasCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 96, 242, 0.15)'};
                  color: #0F172A;
                  padding: 4px 10px;
                  border-radius: 9999px;
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span class="heatshield-cluster-badge" style="background: ${hasCritical ? '#EF4444' : '#1E60F2'}; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 9999px;">
                    ${cluster.length}
                  </span>
                  <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: ${hasCritical ? '#DC2626' : '#1E60F2'};">
                    ${avgTemp.toFixed(1)}°C
                  </span>
                </div>
              `,
              className: 'heatshield-cluster-icon',
              iconSize: [95, 30],
              iconAnchor: [47, 15]
            });

            const clusterMarker = L.marker([avgLat, avgLon], { icon: clusterIcon, zIndexOffset: 500 }).addTo(markersLayer);
            clusterMarker.on('click', () => {
              // Zoom in on cluster to resolve individual zones
              map.flyTo([avgLat, avgLon], currentZoom + 2, { duration: 0.8 });
            });
          } else {
            // Single marker at low zoom: compact circular badge
            const { location: loc, activeTemp, isAbove35 } = cluster[0];
            const compactIcon = L.divIcon({
              html: `
                <div style="
                  width: 34px;
                  height: 34px;
                  border-radius: 50%;
                  background: ${isAbove35 ? '#FEF2F2' : '#FFFFFF'};
                  border: 2px solid ${isAbove35 ? '#EF4444' : '#1E60F2'};
                  box-shadow: 0 4px 12px ${isAbove35 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.1)'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  font-family: monospace;
                  font-size: 11px;
                  font-weight: 800;
                  color: ${isAbove35 ? '#DC2626' : '#1E60F2'};
                " title="${loc.name} (${activeTemp.toFixed(1)}°C)">
                  ${Math.round(activeTemp)}°
                </div>
              `,
              className: 'heatshield-compact-station',
              iconSize: [34, 34],
              iconAnchor: [17, 17]
            });

            const singleMarker = L.marker([loc.latitude, loc.longitude], { icon: compactIcon }).addTo(markersLayer);
            singleMarker.on('click', () => {
              handleSelectPlace({
                id: loc.id,
                displayName: `${loc.name}, ${loc.city}, ${loc.state}`,
                shortName: loc.name,
                subArea: loc.name,
                city: loc.city,
                state: loc.state,
                pincode: loc.pincode,
                latitude: loc.latitude,
                longitude: loc.longitude,
                type: 'locality'
              });
            });
          }
        });
      } else {
        // Detailed zoom (>= 13): Render full, clear station pills with place names
        stationData.forEach(({ location: loc, activeTemp, isAbove35 }) => {
          const placeShort = getPlaceShortName(loc.name);
          const markerHtml = `
            <div style="position: relative; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
              ${isAbove35 ? `
                <div class="marker-halo-ring" style="border: 2px solid #EF4444; background: rgba(239, 68, 68, 0.2);"></div>
                <div class="marker-halo-ring marker-halo-ring-delayed" style="border: 1.5px solid #EF4444;"></div>
              ` : ''}
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: ${isAbove35 ? '#FEF2F2' : '#FFFFFF'};
                border: 1.5px solid ${isAbove35 ? '#EF4444' : '#E2E8F0'};
                box-shadow: 0 4px 14px ${isAbove35 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.08)'};
                padding: 3px 8px;
                border-radius: 9999px;
                font-family: inherit;
                font-size: 11px;
                font-weight: 700;
                color: ${isAbove35 ? '#991B1B' : '#0F172A'};
                white-space: nowrap;
                position: relative;
                z-index: 10;
              ">
                <span style="
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  background-color: ${isAbove35 ? '#EF4444' : '#1E60F2'};
                  box-shadow: ${isAbove35 ? '0 0 8px #EF4444' : 'none'};
                  display: inline-block;
                "></span>
                <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${placeShort}</span>
                <span style="
                  font-size: 10px;
                  font-family: monospace;
                  font-weight: 800;
                  color: #FFFFFF;
                  background: ${isAbove35 ? '#EF4444' : '#1E60F2'};
                  padding: 1.5px 5px;
                  border-radius: 6px;
                ">${activeTemp.toFixed(1)}°C</span>
              </div>
            </div>
          `;

          const stationIcon = L.divIcon({
            html: markerHtml,
            className: 'heatshield-station-pill',
            iconSize: [140, 28],
            iconAnchor: [70, 14]
          });

          const stnMarker = L.marker([loc.latitude, loc.longitude], { icon: stationIcon }).addTo(markersLayer);
          stnMarker.on('click', () => {
            handleSelectPlace({
              id: loc.id,
              displayName: `${loc.name}, ${loc.city}, ${loc.state}`,
              shortName: loc.name,
              subArea: loc.name,
              city: loc.city,
              state: loc.state,
              pincode: loc.pincode,
              latitude: loc.latitude,
              longitude: loc.longitude,
              type: 'locality'
            });
          });
        });
      }
    }
  }, [
    locations, 
    showCoolingCentres, 
    showWaterPoints, 
    showMonitoringStations, 
    localityTelemetry, 
    forecastHorizon, 
    currentLocation, 
    currentZoom,
    handleSelectPlace
  ]);

  // Initial Load: Auto-generate report for current canonical location without overwriting location state
  useEffect(() => {
    if (!activeReport && locations.length > 0 && currentLocation.latitude && currentLocation.longitude) {
      const initialPlace: GeocodedPlace = {
        id: 'initial-loc',
        displayName: currentLocation.displayName || `${currentLocation.localityName}, ${currentLocation.city}`,
        shortName: currentLocation.localityName || currentLocation.locality,
        city: currentLocation.city,
        state: currentLocation.state,
        pincode: currentLocation.pincode || '',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        type: 'locality'
      };
      
      generateLocationHeatReport(initialPlace)
        .then(({ report, weatherResult }) => {
          setActiveReport(report);
          dropSonarTargetMarker(
            currentLocation.latitude,
            currentLocation.longitude,
            currentLocation.localityName,
            weatherResult.reading.temperature_c
          );
        })
        .catch(() => {});
    }
  }, [currentLocation.latitude, currentLocation.longitude, activeReport, locations, dropSonarTargetMarker]);

  // Fullscreen Toggle with Map Size Invalidation
  const toggleFullscreen = () => {
    if (!outerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(() => {});
    }
  };

  // Window resize observer to ensure Leaflet canvas stays crisp
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={outerWrapperRef}
      className={`relative isolate z-0 flex flex-col rounded-[28px] overflow-hidden border border-[#E5EDF5] bg-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.08)] text-slate-900 ${className}`}
    >
      {/* =========================================================================
          TOP COMMAND BAR & UNIVERSAL SEARCH (FEATURE 2)
          ========================================================================= */}
      <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md border-b border-[#E5EDF5] z-30 space-y-2.5">
        <div className="relative">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-[#1E60F2] animate-spin' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search any city, locality, road, PIN code or landmark across India..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchSuggestions.length > 0) setIsSearchOpen(true); }}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] hover:border-slate-300 focus:border-[#1E60F2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-10 pr-24 py-2.5 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/15 input-interactive transition-all"
            />
            
            {/* Quick Actions inside search bar */}
            <div className="absolute right-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchSuggestions([]); setIsSearchOpen(false); }}
                  className="p-1 hover:text-slate-700"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-500">
                ⌘K
              </span>
            </div>
          </div>

          {/* Live Search Suggestions Dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/98 backdrop-blur-xl border border-[#E5EDF5] rounded-2xl shadow-2xl overflow-hidden z-50 animate-dropdown-enter max-h-72 overflow-y-auto">
              <div className="p-2.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-100 bg-[#F8FAFC]">
                <span>Geographical Search Results</span>
                <span className="font-mono text-[#1E60F2] font-semibold">{searchSuggestions.length} found</span>
              </div>
              {searchSuggestions.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F5F8FC] flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 transition-all duration-150 hover:translate-x-1 group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-xl bg-blue-50 text-[#1E60F2] group-hover:bg-[#1E60F2] group-hover:text-white transition-colors shrink-0 text-xs">
                      {place.type === 'city' ? '🏙️' : place.type === 'postcode' ? '📮' : place.type === 'landmark' ? '🏛️' : '📍'}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#1E60F2] truncate">
                        {place.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {place.latitude.toFixed(4)}°N, {place.longitude.toFixed(4)}°E • {place.city}, {place.state}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E60F2] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Access Location Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-bold">
            <Compass className="w-3 h-3 text-[#1E60F2]" />
            <span>Quick:</span>
          </span>
          {[
            { name: 'Hebbal, BLR', lat: 13.0358, lon: 77.5970 },
            { name: 'Chokkanahalli, BLR', lat: 13.0850, lon: 77.6320 },
            { name: 'Whitefield, BLR', lat: 12.9698, lon: 77.7500 },
            { name: 'Indiranagar, BLR', lat: 12.9784, lon: 77.6408 },
            { name: 'Mysuru, KA', lat: 12.2958, lon: 76.6394 },
            { name: 'Hubballi, KA', lat: 15.3647, lon: 75.1240 },
            { name: 'Mumbai, MH', lat: 19.0760, lon: 72.8777 },
            { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
            { name: 'Chennai, TN', lat: 13.0827, lon: 80.2707 }
          ].map((chip) => (
            <button
              key={chip.name}
              onClick={() => handleSelectPlace({
                id: `chip-${chip.name}`,
                displayName: chip.name,
                shortName: chip.name.split(',')[0],
                city: chip.name.includes('BLR') ? 'Bengaluru' : chip.name.includes('KA') ? 'Karnataka' : chip.name.split(',')[0],
                state: 'India',
                latitude: chip.lat,
                longitude: chip.lon,
                type: 'locality'
              })}
              className="px-3 py-1.5 rounded-full bg-[#F5F8FC] hover:bg-blue-50 text-slate-600 hover:text-[#1E60F2] border border-[#E5EDF5] hover:border-blue-200 whitespace-nowrap text-[11px] font-semibold transition-all shadow-xs btn-press"
            >
              {chip.name}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN MAP CANVAS & FLOATING CONTROLS (FEATURES 1, 6, 7)
          ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Map Viewport Container: ~70% width on desktop, strictly isolated */}
        <div className="w-full lg:w-[68%] xl:w-[70%] relative h-[440px] sm:h-[480px] lg:h-full min-h-0 overflow-hidden isolate z-0 shrink-0 lg:shrink">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Top-Left Controls Bar (Horizon & Filter Toggles) */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 p-1.5 bg-white/92 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.08)] text-xs">
            {/* Horizon Selector */}
            <div className="flex items-center gap-1 bg-[#F5F8FC] p-1 rounded-xl border border-[#E5EDF5]">
              <span className="text-slate-400 pl-1.5 pr-1 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1E60F2]" />
                <span className="hidden sm:inline">Horizon:</span>
              </span>

              {(['now', 24, 48, 72] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                    forecastHorizon === h
                      ? 'bg-[#1E60F2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {h === 'now' ? 'Live' : `+${h}h`}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Smart Map Modes (Section 9: Heat Risk, Temperature, Water, Cooling, Medical, Safe Routes) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'heat_risk', label: 'Heat Risk', icon: '🔥' },
                { id: 'temperature', label: 'Temperature', icon: '🌡️' },
                { id: 'water', label: 'Water', icon: '💧' },
                { id: 'cooling', label: 'Cooling', icon: '🧊' },
                { id: 'medical', label: 'Medical', icon: '🏥' },
                { id: 'routes', label: 'Safe Routes', icon: '🧭' },
              ].map((m) => {
                const isSelected = mapMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMapMode(m.id as any);
                      if (m.id === 'water') {
                        setShowWaterPoints(true);
                      } else if (m.id === 'cooling') {
                        setShowCoolingCentres(true);
                      } else if (m.id === 'heat_risk' || m.id === 'temperature') {
                        setShowMonitoringStations(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border shadow-2xs ${
                      isSelected
                        ? 'bg-[#1E60F2] text-white border-[#1E60F2] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => syncAllLocalitiesTelemetry(true)}
                disabled={isRefreshingAll}
                className="p-1.5 rounded-xl bg-white text-slate-500 hover:text-[#1E60F2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                title="Refresh Map Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin text-[#1E60F2]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Floating Notice: Analyzed Area vs Genuine Device GPS */}
          {isAnalyzingDifferentLocation && deviceLocation && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md border border-[#1E60F2]/30 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2.5 text-xs text-slate-800 max-w-[90%] sm:max-w-none animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-pulse shrink-0" />
              <span className="truncate">
                Analyzing <strong>{currentLocation.localityName}</strong> (Device: {deviceLocation.localityName})
              </span>
              <button
                type="button"
                onClick={returnToDeviceLocation}
                className="ml-1 px-2.5 py-1 rounded-lg bg-[#1E60F2] hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-xs"
              >
                Return to My Location
              </button>
            </div>
          )}

          {/* Floating Map Actions (Top-Right) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
            {/* Style Selector */}
            <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-md text-[11px]">
              <button
                onClick={() => setMapStyle('osm')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[10px] transition-colors ${
                  mapStyle === 'osm' ? 'bg-[#1E60F2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Street
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[10px] transition-colors ${
                  mapStyle === 'satellite' ? 'bg-[#1E60F2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2.5 py-1 rounded-xl font-bold text-[10px] transition-colors ${
                  mapStyle === 'dark' ? 'bg-[#1E60F2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dark
              </button>
            </div>

            {/* Action Tools Cluster */}
            <div className="flex flex-col bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-md overflow-hidden text-slate-700">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-2 hover:text-[#1E60F2] hover:bg-slate-50 border-b border-slate-100 transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-2 hover:text-[#1E60F2] hover:bg-slate-50 border-b border-slate-100 transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => {
                  if (deviceLocation && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([deviceLocation.latitude, deviceLocation.longitude], 15);
                    returnToDeviceLocation();
                  } else {
                    detectLocation();
                  }
                }}
                className="p-2 hover:text-[#1E60F2] hover:bg-slate-50 border-b border-slate-100 transition-colors"
                title="My Location (Device GPS)"
              >
                <Navigation className="w-3.5 h-3.5 text-[#1E60F2]" />
              </button>
              <button
                onClick={() => {
                  if (mapInstanceRef.current && currentLocation.latitude && currentLocation.longitude) {
                    mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 15);
                  }
                }}
                className="p-2 hover:text-[#1E60F2] hover:bg-slate-50 border-b border-slate-100 transition-colors"
                title="Recenter Active Locality"
              >
                <Compass className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:text-[#1E60F2] hover:bg-slate-50 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom-Left Floating Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] text-xs hidden sm:block">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60F2]" />
                <span>Heat Risk Radar Legend</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Click map to analyze
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="text-slate-600 font-semibold">Low (&lt;25)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                <span className="text-slate-600 font-semibold">Mod (25–49)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-200" />
                <span className="text-slate-600 font-semibold">High (50–74)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200 animate-pulse" />
                <span className="font-bold text-red-600">Critical (&ge;75)</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600 pl-2.5 border-l border-slate-200 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>&gt;35°C Red Circle</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT-HAND LOCATION INTELLIGENCE PANEL (FEATURES 3, 4, 5)
            ========================================================================= */}
        <div className="w-full lg:w-[32%] xl:w-[30%] min-h-0 h-auto lg:h-full border-t lg:border-t-0 lg:border-l border-[#E5EDF5] flex flex-col relative z-10 overflow-hidden bg-white">
          <LocationIntelligencePanel
            report={activeReport}
            isLoading={isLoadingReport}
            onSelectPlace={handleSelectPlace}
            className="flex-1 min-h-0"
          />
        </div>
      </div>
    </div>
  );
};