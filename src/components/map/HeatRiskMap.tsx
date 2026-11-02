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
  const { currentLocation } = useLocationTracker();

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
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'osm'>('dark');
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

  // Horizon Controls
  const [forecastHorizon, setForecastHorizon] = useState<'now' | 24 | 48 | 72>('now');
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
    const pinColor = isHot ? '#EF4444' : '#00F0FF';

    const sonarIconHtml = `
      <div class="heatshield-sonar-marker" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div class="heatshield-sonar-ring" style="border-color: ${pinColor};"></div>
        <div class="heatshield-sonar-ring-2" style="border-color: ${pinColor};"></div>
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${pinColor};
          box-shadow: 0 0 14px ${pinColor}, 0 0 28px ${pinColor};
          border: 2px solid #FFFFFF;
          position: relative;
          z-index: 10;
        "></div>
        <div style="
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(11, 19, 43, 0.96);
          backdrop-filter: blur(8px);
          border: 1.5px solid ${pinColor};
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          color: #FFFFFF;
          padding: 3px 8px;
          border-radius: 9999px;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          pointer-events: none;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="color: ${pinColor}; font-size: 11px;">●</span>
          <span>${title}</span>
          ${temp !== undefined ? `<span style="font-family: monospace; font-weight: 900; color: ${isHot ? '#EF4444' : '#38BDF8'};">${temp.toFixed(1)}°C</span>` : ''}
        </div>
      </div>
    `;

    const sonarIcon = L.divIcon({
      html: sonarIconHtml,
      className: 'heatshield-sonar-div-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    L.marker([lat, lon], { icon: sonarIcon, zIndexOffset: 1000 }).addTo(targetLayer);
  }, []);

  // Handle Location Selection (from Search or Map Click)
  const handleSelectPlace = useCallback(async (place: GeocodedPlace) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsLoadingReport(true);

    // 1. Move Map smoothly to chosen location
    if (mapInstanceRef.current) {
      const targetZoom = place.type === 'city' ? 12 : 14;
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], targetZoom, {
        duration: 1.2,
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

      // Trigger external callback if location matches a registered zone
      if (onSelectLocation) {
        const matchedZone = locations.find(l => l.name.toLowerCase().includes(place.shortName.toLowerCase()));
        if (matchedZone) onSelectLocation(matchedZone);
      }
    } catch (err) {
      console.error('Error generating location heat report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [dropSonarTargetMarker, locations, onSelectLocation]);

  // Handle Clicking Anywhere on the Map
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Drop instant sonar marker at clicked coordinates
    dropSonarTargetMarker(lat, lon, `Selected (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`);
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
    } catch (err) {
      console.error('Error handling map click report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [dropSonarTargetMarker]);

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocation.latitude || 12.9716;
    const initialLon = currentLocation.longitude || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: false,
      attributionControl: true
    });

    // Initial Tile Layer
    const tileLayer = createTileLayer('dark');
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
  }, [currentLocation.latitude, currentLocation.longitude, handleMapClick, createTileLayer]);

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

    // 1. Current GPS Location Marker with glowing cyan pill
    if (currentLocation.latitude && currentLocation.longitude) {
      const userLocName = currentLocation.localityName || 'Your Location';
      const userMarkerHtml = `
        <div style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #0B132B;
            border: 1.5px solid #00F0FF;
            box-shadow: 0 4px 16px rgba(0, 240, 255, 0.4);
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #FFFFFF;
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #00F0FF;
              box-shadow: 0 0 8px #00F0FF;
              display: inline-block;
            "></span>
            <span>📍 YOU: ${userLocName}</span>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: 'heatshield-user-pin',
        iconSize: [160, 32],
        iconAnchor: [80, 16],
      });

      L.marker([currentLocation.latitude, currentLocation.longitude], { icon: userIcon, zIndexOffset: 800 }).addTo(markersLayer);
    }

    // 2. Cooling Centres Layer (rendered at zoom >= 12 to avoid clutter)
    if (showCoolingCentres && currentZoom >= 12) {
      const coolingCentres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
      coolingCentres.forEach(centre => {
        const coolIcon = L.divIcon({
          html: `
            <div style="
              background: #0F172A;
              border: 1.5px solid #38BDF8;
              color: #38BDF8;
              border-radius: 9999px;
              padding: 2px 7px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
              display: flex;
              align-items: center;
              gap: 3px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>❄️</span>
              <span style="max-width: 85px; overflow: hidden; text-overflow: ellipsis;">${centre.name.split(' ')[0]}</span>
            </div>
          `,
          className: 'cooling-map-pin',
          iconSize: [110, 24],
          iconAnchor: [55, 12]
        });

        const coolMarker = L.marker([centre.latitude, centre.longitude], { icon: coolIcon }).addTo(coolingLayer);
        coolMarker.bindPopup(`
          <div style="min-width: 250px; font-family: 'Inter', system-ui, sans-serif; color: #F8FAFC;">
            <div style="font-size: 9px; font-weight: 800; color: #38BDF8; text-transform: uppercase;">
              ❄️ Verified Cooling Centre
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin: 2px 0;">
              ${centre.name}
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
              ${centre.address}
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 6px; padding: 6px; font-size: 10px; margin-bottom: 6px;">
              <div>⏰ Hours: <b>${centre.operating_hours}</b></div>
              <div>👥 Capacity: <b>~${centre.capacity_estimate} persons</b></div>
              <div>💧 Drinking Water: <b>${centre.drinking_water_available ? 'Available' : 'No'}</b></div>
            </div>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}" 
              target="_blank" 
              rel="noreferrer"
              style="display: block; text-align: center; background: #0284C7; color: white; padding: 5px; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              Directions →
            </a>
          </div>
        `, { className: 'heatshield-dark-popup' });
      });
    }

    // 3. Public Water Points Layer (rendered at zoom >= 13)
    if (showWaterPoints && currentZoom >= 13) {
      const waterPoints = mockDb.getWaterPoints().filter(w => w.is_operational);
      waterPoints.forEach(wp => {
        const waterIcon = L.divIcon({
          html: `
            <div style="
              background: #0369A1;
              color: #FFFFFF;
              border: 1px solid #7DD3FC;
              border-radius: 9999px;
              padding: 2px 6px;
              font-size: 9px;
              font-weight: 800;
              box-shadow: 0 2px 6px rgba(3, 105, 161, 0.4);
              display: flex;
              align-items: center;
              gap: 2px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>💧 Water ATM</span>
            </div>
          `,
          className: 'water-map-pin',
          iconSize: [80, 22],
          iconAnchor: [40, 11]
        });

        const waterMarker = L.marker([wp.latitude, wp.longitude], { icon: waterIcon }).addTo(waterLayer);
        waterMarker.bindPopup(`
          <div style="min-width: 200px; font-family: 'Inter', system-ui, sans-serif; color: #F8FAFC;">
            <div style="font-size: 9px; font-weight: 800; color: #7DD3FC; text-transform: uppercase;">
              💧 Verified Drinking Water ATM
            </div>
            <div style="font-size: 12px; font-weight: 800; color: #FFFFFF; margin: 2px 0;">
              ${wp.name}
            </div>
            <div style="font-size: 10px; color: #94A3B8;">
              Locality: ${wp.locality_name} • Status: <b style="color: #4ADE80;">Operational</b>
            </div>
          </div>
        `, { className: 'heatshield-dark-popup' });
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
                <div class="heatshield-cluster-pill" style="${hasCritical ? 'border-color: #EF4444; background: rgba(69, 10, 10, 0.95);' : ''}">
                  <span class="heatshield-cluster-badge" style="${hasCritical ? 'background: #EF4444;' : ''}">
                    ${cluster.length}
                  </span>
                  <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: ${hasCritical ? '#FCA5A5' : '#38BDF8'};">
                    ${avgTemp.toFixed(1)}°C
                  </span>
                </div>
              `,
              className: 'heatshield-cluster-icon',
              iconSize: [90, 28],
              iconAnchor: [45, 14]
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
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${isAbove35 ? 'rgba(69, 10, 10, 0.95)' : 'rgba(15, 23, 42, 0.92)'};
                  border: 2px solid ${isAbove35 ? '#EF4444' : '#38BDF8'};
                  box-shadow: 0 4px 12px ${isAbove35 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  font-family: monospace;
                  font-size: 10px;
                  font-weight: 900;
                  color: ${isAbove35 ? '#FCA5A5' : '#FFFFFF'};
                " title="${loc.name} (${activeTemp.toFixed(1)}°C)">
                  ${Math.round(activeTemp)}°
                </div>
              `,
              className: 'heatshield-compact-station',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
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
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: ${isAbove35 ? 'rgba(69, 10, 10, 0.96)' : 'rgba(15, 23, 42, 0.92)'};
                border: 1.5px solid ${isAbove35 ? '#EF4444' : '#334155'};
                box-shadow: 0 4px 14px ${isAbove35 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
                padding: 3px 8px;
                border-radius: 9999px;
                font-family: 'Inter', system-ui, sans-serif;
                font-size: 11px;
                font-weight: 700;
                color: ${isAbove35 ? '#FCA5A5' : '#F8FAFC'};
                white-space: nowrap;
              ">
                <span style="
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  background-color: ${isAbove35 ? '#EF4444' : '#38BDF8'};
                  box-shadow: ${isAbove35 ? '0 0 8px #EF4444' : 'none'};
                  display: inline-block;
                "></span>
                <span style="max-width: 105px; overflow: hidden; text-overflow: ellipsis;">${placeShort}</span>
                <span style="
                  font-size: 10px;
                  font-family: monospace;
                  font-weight: 800;
                  color: ${isAbove35 ? '#FFFFFF' : '#38BDF8'};
                  background: ${isAbove35 ? '#DC2626' : '#1E293B'};
                  padding: 1px 4px;
                  border-radius: 4px;
                ">${activeTemp.toFixed(1)}°C</span>
              </div>
            </div>
          `;

          const stationIcon = L.divIcon({
            html: markerHtml,
            className: 'heatshield-station-pill',
            iconSize: [135, 28],
            iconAnchor: [67, 14]
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

  // Initial Load: Auto-generate report for current location or Hebbal, Bengaluru
  useEffect(() => {
    if (!activeReport && locations.length > 0) {
      const initialPlace: GeocodedPlace = {
        id: 'initial-loc',
        displayName: currentLocation.localityName 
          ? `${currentLocation.localityName}, ${currentLocation.city || 'Bengaluru'}` 
          : 'Hebbal, Bengaluru, Karnataka (560024)',
        shortName: currentLocation.localityName || 'Hebbal',
        city: currentLocation.city || 'Bengaluru',
        state: currentLocation.state || 'Karnataka',
        pincode: currentLocation.pincode || '560024',
        latitude: currentLocation.latitude || 13.0358,
        longitude: currentLocation.longitude || 77.5970,
        type: 'locality'
      };
      handleSelectPlace(initialPlace);
    }
  }, [currentLocation, activeReport, locations, handleSelectPlace]);

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
      className={`relative isolate z-0 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-[#090D16] shadow-2xl text-white ${className}`}
    >
      {/* =========================================================================
          TOP COMMAND BAR & UNIVERSAL SEARCH (FEATURE 2)
          ========================================================================= */}
      <div className="p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-30 space-y-2">
        <div className="relative">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search any city, locality, road, PIN code or landmark across India..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchSuggestions.length > 0) setIsSearchOpen(true); }}
              className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 text-white placeholder-slate-400 text-xs sm:text-sm pl-10 pr-24 py-2.5 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            
            {/* Quick Actions inside search bar */}
            <div className="absolute right-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchSuggestions([]); setIsSearchOpen(false); }}
                  className="p-1 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                ⌘K
              </span>
            </div>
          </div>

          {/* Live Search Suggestions Dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
              <div className="p-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-800">
                <span>Geographical Search Results</span>
                <span className="font-mono text-cyan-400">{searchSuggestions.length} found</span>
              </div>
              {searchSuggestions.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between gap-3 border-b border-slate-800/50 last:border-0 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20 shrink-0 text-xs">
                      {place.type === 'city' ? '🏙️' : place.type === 'postcode' ? '📮' : place.type === 'landmark' ? '🏛️' : '📍'}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                        {place.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {place.latitude.toFixed(4)}°N, {place.longitude.toFixed(4)}°E • {place.city}, {place.state}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Access Location Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
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
              className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/70 whitespace-nowrap text-[11px] font-medium transition-all shadow-xs"
            >
              {chip.name}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN MAP CANVAS & FLOATING CONTROLS (FEATURES 1, 6, 7)
          ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-[500px]">
        {/* Map Viewport Container: ~70% width on desktop */}
        <div className="w-full lg:w-[68%] xl:w-[70%] relative h-[480px] lg:h-full min-h-[460px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Top-Left Controls Bar (Horizon & Filter Toggles) */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl text-[11px]">
            <span className="text-slate-400 px-1 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Horizon:</span>
            </span>

            {(['now', 24, 48, 72] as const).map(h => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold transition-all ${
                  forecastHorizon === h
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {h === 'now' ? 'Live' : `+${h}h`}
              </button>
            ))}

            <div className="h-3 w-px bg-slate-700 mx-0.5" />

            {/* Layer Filter Toggles */}
            <button
              onClick={() => setShowCoolingCentres(!showCoolingCentres)}
              className={`px-2 py-0.5 rounded-lg font-medium text-[10px] transition-colors flex items-center gap-1 ${
                showCoolingCentres ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Cooling Centres"
            >
              <span>❄️ Shelters</span>
            </button>

            <button
              onClick={() => setShowWaterPoints(!showWaterPoints)}
              className={`px-2 py-0.5 rounded-lg font-medium text-[10px] transition-colors flex items-center gap-1 ${
                showWaterPoints ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Toggle Water Points"
            >
              <span>💧 Water</span>
            </button>

            <button
              onClick={() => syncAllLocalitiesTelemetry(true)}
              disabled={isRefreshingAll}
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Manual 5-Min Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Floating Map Actions (Top-Right) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
            {/* Style Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl text-[11px]">
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                  mapStyle === 'dark' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Dark Command
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                  mapStyle === 'satellite' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapStyle('osm')}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                  mapStyle === 'osm' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Street
              </button>
            </div>

            {/* Action Tools Cluster */}
            <div className="flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-800 transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-800 transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => {
                  if (currentLocation.latitude && currentLocation.longitude && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 14);
                  }
                }}
                className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 border-b border-slate-800 transition-colors"
                title="My Location"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([12.9716, 77.5946], 12);
                  }
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-800 transition-colors"
                title="Reset View"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom-Left Floating Legend (Positioned safely away from bottom-right assistant button) */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-xl p-2.5 shadow-2xl text-[11px] hidden sm:block">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400">
                Heat Risk Radar Legend
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                Click map to analyze
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Low (0–24)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Mod (25–49)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-slate-300">High (50–74)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-red-400">Critical (75–100)</span>
              </div>
              <div className="flex items-center gap-1 text-red-400 pl-2 border-l border-slate-700 font-bold">
                <span>⚠️ &gt;35°C Red Circle</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT-HAND LOCATION INTELLIGENCE PANEL (FEATURES 3, 4, 5)
            ========================================================================= */}
        <div className="w-full lg:w-[32%] xl:w-[30%] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-auto lg:h-full">
          <LocationIntelligencePanel
            report={activeReport}
            isLoading={isLoadingReport}
            onSelectPlace={handleSelectPlace}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};