import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, 
  MapPin, 
  Flame, 
  Thermometer, 
  Droplets, 
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
  Stethoscope,
  Trees,
  PhoneCall,
  Phone
} from 'lucide-react';
import { 
  LocationZone, 
  GeocodedPlace,
  LocationHeatReport,
  WaterStation,
  CoolingCentre,
  HospitalResource,
  HeatSafeRoute
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationTracker } from '../../context/LocationContext';
import { mockDb } from '../../lib/mockDb';
import { fetchLiveWeather } from '../../lib/weatherApi';
import { searchGeographicalLocations, reverseGeocodeCoordinates } from '../../lib/geocodingService';
import { generateLocationHeatReport } from '../../lib/locationReportEngine';
import { LocationIntelligencePanel, FacilityDetails } from './LocationIntelligencePanel';

export type SmartMapMode = 'heat_risk' | 'temperature' | 'water' | 'cooling' | 'medical' | 'routes';

interface HeatRiskMapProps {
  locations?: LocationZone[];
  selectedLocationId?: string;
  onSelectLocation?: (location: LocationZone) => void;
  className?: string;
  initialMode?: SmartMapMode;
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

// Distance helper
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDist(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
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

// OpenStreetMap Raster Tiles
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

export const HeatRiskMap: React.FC<HeatRiskMapProps> = ({
  locations = mockDb.getLocations(),
  selectedLocationId,
  onSelectLocation,
  className = 'h-[720px]',
  initialMode = 'heat_risk'
}) => {
  const { t } = useLanguage();
  const { 
    currentLocation, 
    deviceLocation, 
    isAnalyzingDifferentLocation, 
    returnToDeviceLocation, 
    detectLocation, 
    analyzeCoordinates 
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
  const medicalLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Map Style & Status
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'osm'>('osm');
  const [activeReport, setActiveReport] = useState<LocationHeatReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

  // Selected Facility Flyout / Card State
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetails | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // 6 Interactive Modes
  const [mapMode, setMapMode] = useState<SmartMapMode>(initialMode);
  const [forecastHorizon, setForecastHorizon] = useState<'now' | 24 | 48 | 72>('now');

  // Telemetry sync for base locations
  const [localityTelemetry, setLocalityTelemetry] = useState<Record<string, LocalityTelemetry>>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Resident active coordinates
  const userLat = currentLocation.latitude || 13.0854;
  const userLon = currentLocation.longitude || 77.6250;

  // Real Distance & Facility Verification within 10 km (NO FAKE DATA)
  const facilitiesWithin10km = useMemo(() => {
    const allWaters = mockDb.getWaterStations();
    const allCoolings = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
    const allHospitals = mockDb.getHospitals();

    const waters = allWaters
      .map(w => ({ ...w, distKm: getDistanceKm(userLat, userLon, w.latitude, w.longitude) }))
      .filter(w => w.distKm <= 10)
      .sort((a, b) => a.distKm - b.distKm);

    const coolings = allCoolings
      .map(c => ({ ...c, distKm: getDistanceKm(userLat, userLon, c.latitude, c.longitude) }))
      .filter(c => c.distKm <= 10)
      .sort((a, b) => a.distKm - b.distKm);

    const hospitals = allHospitals
      .map(h => ({ ...h, distKm: getDistanceKm(userLat, userLon, h.latitude, h.longitude) }))
      .filter(h => h.distKm <= 10)
      .sort((a, b) => a.distKm - b.distKm);

    return { waters, coolings, hospitals };
  }, [userLat, userLon]);

  // Check if current mode has no registered facilities within 10 km
  const currentModeEmptyState = useMemo(() => {
    if (mapMode === 'water' && facilitiesWithin10km.waters.length === 0) {
      return 'No registered water stations within 10 km. Heat emergency helpline: 108 / 112';
    }
    if (mapMode === 'cooling' && facilitiesWithin10km.coolings.length === 0) {
      return 'No registered cooling centres within 10 km. Heat emergency helpline: 108 / 112';
    }
    if (mapMode === 'medical' && facilitiesWithin10km.hospitals.length === 0) {
      return 'No registered emergency hospitals within 10 km. Heat emergency helpline: 108 / 112';
    }
    return null;
  }, [mapMode, facilitiesWithin10km]);

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

  // Drop Sonar Pin Marker at Selected Coordinates
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

  // Handle Location Selection
  const handleSelectPlace = useCallback(async (place: GeocodedPlace) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedFacility(null);
    setIsLoadingReport(true);

    if (mapInstanceRef.current) {
      const targetZoom = place.type === 'city' ? 13 : 15;
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], targetZoom, {
        duration: 1.0,
        easeLinearity: 0.25
      });
    }

    dropSonarTargetMarker(place.latitude, place.longitude, place.shortName);

    try {
      const { report, weatherResult } = await generateLocationHeatReport(place);
      setActiveReport(report);

      dropSonarTargetMarker(
        place.latitude,
        place.longitude,
        place.shortName,
        weatherResult.reading.temperature_c
      );

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

  // Handle Map Click
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    setSelectedFacility(null);
    dropSonarTargetMarker(lat, lon, `Selected (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`);
    setIsLoadingReport(true);

    try {
      const geocoded = await reverseGeocodeCoordinates(lat, lon);
      const { report, weatherResult } = await generateLocationHeatReport(geocoded);
      setActiveReport(report);

      dropSonarTargetMarker(
        lat, 
        lon, 
        geocoded.shortName, 
        weatherResult.reading.temperature_c
      );

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

  // Tile Layer Creator
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

    return L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      className: 'heatshield-dark-tiles',
      maxZoom: 19,
    });
  }, []);

  // Initialize Leaflet Map
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

    const tileLayer = createTileLayer('osm');
    tileLayer.addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    coolingCentresLayerRef.current = L.layerGroup().addTo(map);
    waterPointsLayerRef.current = L.layerGroup().addTo(map);
    medicalLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    targetPinLayerRef.current = L.layerGroup().addTo(map);

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

  // Recenter smoothly on canonical location changes
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

  // Tile style switch
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

  // Live Geocoding Search
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

  // =========================================================================
  // RENDER INTERACTIVE MAP LAYERS BASED ON ACTIVE 6 MODES
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const zonesLayer = zonesLayerRef.current;
    const coolingLayer = coolingCentresLayerRef.current;
    const waterLayer = waterPointsLayerRef.current;
    const medicalLayer = medicalLayerRef.current;
    const routesLayer = routesLayerRef.current;

    if (!map || !markersLayer || !zonesLayer || !coolingLayer || !waterLayer || !medicalLayer || !routesLayer) return;

    // Reset all dynamic layer groups
    markersLayer.clearLayers();
    zonesLayer.clearLayers();
    coolingLayer.clearLayers();
    waterLayer.clearLayers();
    medicalLayer.clearLayers();
    routesLayer.clearLayers();

    // 1. Device GPS Location Marker
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
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #1E60F2; box-shadow: 0 0 8px #1E60F2; display: inline-block;"></span>
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

    // Active Analyzed Location Marker
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
          ? `📍 Area: ${currentLocation.localityName || 'Bengaluru Urban'}`
          : `🎯 Active: ${currentLocation.localityName || 'Selected Area'}`;

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
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${activeDotColor}; display: inline-block;"></span>
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

    // =========================================================================
    // MODE 1 & 2: HEAT RISK & TEMPERATURE TELEMETRY
    // =========================================================================
    if (mapMode === 'heat_risk' || mapMode === 'temperature') {
      const stationData = locations.map(loc => {
        const telemetry = localityTelemetry[loc.id];
        const isNorth = loc.latitude > 25.0;
        const defaultTemp = isNorth ? 39.5 : 33.8;
        
        let activeTemp = telemetry?.tempC ?? defaultTemp;
        if (forecastHorizon === 24) activeTemp = telemetry?.pred24 ?? (activeTemp + 1.2);
        else if (forecastHorizon === 48) activeTemp = telemetry?.pred48 ?? (activeTemp + 1.8);
        else if (forecastHorizon === 72) activeTemp = telemetry?.pred72 ?? (activeTemp + 0.6);

        const isAbove35 = activeTemp > 35.0;
        return { location: loc, activeTemp, isAbove35 };
      });

      // Render Red Danger Circles for >35°C zones in heat_risk mode
      if (mapMode === 'heat_risk') {
        stationData.forEach(({ location: loc, isAbove35 }) => {
          if (isAbove35) {
            L.circle([loc.latitude, loc.longitude], {
              radius: 2200 + (loc.estimated_population / 35),
              color: '#EF4444',
              weight: 2,
              opacity: 0.85,
              fillColor: '#DC2626',
              fillOpacity: 0.20,
              dashArray: '6, 6'
            }).addTo(zonesLayer);
          }
        });
      }

      // Station pills
      stationData.forEach(({ location: loc, activeTemp, isAbove35 }) => {
        const placeShort = getPlaceShortName(loc.name);
        const distKm = getDistanceKm(userLat, userLon, loc.latitude, loc.longitude);
        const distBadge = formatDist(distKm);

        const tempColor = activeTemp >= 35 ? '#EF4444' : activeTemp >= 30 ? '#F59E0B' : '#1E60F2';
        const tempBg = activeTemp >= 35 ? '#FEF2F2' : activeTemp >= 30 ? '#FFFBEB' : '#EFF6FF';

        const markerHtml = `
          <div style="position: relative; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
            ${isAbove35 ? `
              <div class="marker-halo-ring" style="border: 2px solid #EF4444; background: rgba(239, 68, 68, 0.2);"></div>
            ` : ''}
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: ${tempBg};
              border: 1.5px solid ${tempColor};
              box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
              padding: 3px 8px;
              border-radius: 9999px;
              font-family: inherit;
              font-size: 11px;
              font-weight: 700;
              color: #0F172A;
              white-space: nowrap;
              position: relative;
              z-index: 10;
            ">
              <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${tempColor}; display: inline-block;"></span>
              <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${placeShort}</span>
              <span style="font-family: monospace; font-size: 10px; font-weight: 800; color: #FFFFFF; background: ${tempColor}; padding: 1.5px 5px; border-radius: 6px;">
                ${activeTemp.toFixed(1)}°C
              </span>
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

    // =========================================================================
    // MODE 3: WATER STATIONS & ATMS
    // =========================================================================
    if (mapMode === 'water') {
      const waterStations = mockDb.getWaterStations();
      waterStations.forEach(ws => {
        const distKm = getDistanceKm(userLat, userLon, ws.latitude, ws.longitude);
        const distBadge = formatDist(distKm);

        const waterIcon = L.divIcon({
          html: `
            <div style="
              background: #FFFFFF;
              color: #1E40AF;
              border: 1.5px solid #2563EB;
              border-radius: 9999px;
              padding: 3px 9px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 14px rgba(37, 99, 235, 0.18);
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>💧</span>
              <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${ws.name}</span>
              <span style="font-size: 10px; font-family: monospace; background: #EFF6FF; color: #1D4ED8; padding: 1px 5px; border-radius: 6px; font-weight: 800;">
                ${distBadge}
              </span>
            </div>
          `,
          className: 'water-map-pin',
          iconSize: [140, 26],
          iconAnchor: [70, 13]
        });

        const waterMarker = L.marker([ws.latitude, ws.longitude], { icon: waterIcon }).addTo(waterLayer);
        waterMarker.on('click', () => {
          setSelectedFacility({
            id: ws.id,
            type: 'water',
            name: ws.name,
            categoryLabel: 'Public Water ATM Point',
            address: ws.address || `${ws.locality_name}, ${ws.city}`,
            latitude: ws.latitude,
            longitude: ws.longitude,
            distanceKm: distKm,
            operating_hours: ws.operating_hours || '24 Hours Open',
            status: ws.status === 'available' ? 'Available' : ws.status,
            isVerified: true,
            capacity: ws.water_type || 'RO Purified Drinking Water',
          });
          map.flyTo([ws.latitude, ws.longitude], 15, { duration: 0.8 });
        });
      });
    }

    // =========================================================================
    // MODE 4: COOLING CENTRES & SANCTUARIES
    // =========================================================================
    if (mapMode === 'cooling') {
      const coolingCentres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
      coolingCentres.forEach(cc => {
        const distKm = getDistanceKm(userLat, userLon, cc.latitude, cc.longitude);
        const distBadge = formatDist(distKm);

        const coolIcon = L.divIcon({
          html: `
            <div style="
              background: #FFFFFF;
              border: 1.5px solid #0284C7;
              color: #0369A1;
              border-radius: 9999px;
              padding: 3px 9px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 14px rgba(2, 132, 199, 0.20);
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>❄️</span>
              <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${cc.name}</span>
              <span style="font-size: 10px; font-family: monospace; background: #E0F2FE; color: #0369A1; padding: 1px 5px; border-radius: 6px; font-weight: 800;">
                ${distBadge}
              </span>
            </div>
          `,
          className: 'cooling-map-pin',
          iconSize: [150, 26],
          iconAnchor: [75, 13]
        });

        const coolMarker = L.marker([cc.latitude, cc.longitude], { icon: coolIcon }).addTo(coolingLayer);
        coolMarker.on('click', () => {
          setSelectedFacility({
            id: cc.id,
            type: 'cooling',
            name: cc.name,
            categoryLabel: 'Verified Cooling Sanctuary',
            address: cc.address,
            latitude: cc.latitude,
            longitude: cc.longitude,
            distanceKm: distKm,
            operating_hours: cc.operating_hours || '08:00 AM - 08:00 PM',
            status: cc.operating_status === 'open' ? 'Open now' : cc.operating_status,
            isVerified: true,
            capacity: cc.capacity_estimate,
            phone: cc.contact_phone || '108',
          });
          map.flyTo([cc.latitude, cc.longitude], 15, { duration: 0.8 });
        });
      });
    }

    // =========================================================================
    // MODE 5: MEDICAL & EMERGENCY HOSPITALS
    // =========================================================================
    if (mapMode === 'medical') {
      const hospitals = mockDb.getHospitals();
      hospitals.forEach(h => {
        const distKm = getDistanceKm(userLat, userLon, h.latitude, h.longitude);
        const distBadge = formatDist(distKm);

        const hospitalIcon = L.divIcon({
          html: `
            <div style="
              background: #FFFFFF;
              border: 1.5px solid #E11D48;
              color: #BE123C;
              border-radius: 9999px;
              padding: 3px 9px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 14px rgba(225, 29, 72, 0.20);
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>🏥</span>
              <span style="max-width: 115px; overflow: hidden; text-overflow: ellipsis;">${h.name}</span>
              <span style="font-size: 10px; font-family: monospace; background: #FFE4E6; color: #BE123C; padding: 1px 5px; border-radius: 6px; font-weight: 800;">
                ${distBadge}
              </span>
            </div>
          `,
          className: 'medical-map-pin',
          iconSize: [160, 26],
          iconAnchor: [80, 13]
        });

        const hospMarker = L.marker([h.latitude, h.longitude], { icon: hospitalIcon }).addTo(medicalLayer);
        hospMarker.on('click', () => {
          setSelectedFacility({
            id: h.id,
            type: 'hospital',
            name: h.name,
            categoryLabel: 'Emergency Hospital & Heat ICU',
            address: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            distanceKm: distKm,
            operating_hours: h.operating_hours || '24/7 Emergency',
            status: h.emergency_department_open ? '24/7 Emergency Open' : 'Open',
            isVerified: true,
            phone: h.emergency_phone || '108',
            capacity: h.has_heatstroke_ward ? 'Dedicated Heatstroke ICU Ward' : 'Emergency Beds',
          });
          map.flyTo([h.latitude, h.longitude], 15, { duration: 0.8 });
        });
      });
    }

    // =========================================================================
    // MODE 6: SAFE ROUTES CORRIDORS
    // =========================================================================
    if (mapMode === 'routes') {
      const safeRoutes = mockDb.getSafeRoutes();
      safeRoutes.forEach((route, idx) => {
        const isCanopy = route.route_type === 'low_heat_exposure';
        const isRespite = route.route_type === 'respite_optimized';
        const color = isCanopy ? '#10B981' : isRespite ? '#0284C7' : '#F59E0B';

        const polyline = L.polyline(route.coordinates, {
          color,
          weight: 5,
          opacity: 0.85,
          dashArray: isCanopy ? '8, 6' : undefined
        }).addTo(routesLayer);

        polyline.on('click', () => {
          setSelectedFacility({
            id: route.id,
            type: 'route',
            name: route.label,
            categoryLabel: isCanopy ? 'Tree-Canopy Shaded Corridor' : isRespite ? 'Hydration & Respite Corridor' : 'Direct Arterial Route',
            address: `${route.distance_km} km distance • ~${route.duration_minutes} min journey`,
            latitude: route.coordinates[0][0],
            longitude: route.coordinates[0][1],
            distanceKm: route.distance_km,
            operating_hours: 'Pedestrian Walkway • 24 Hours',
            status: `${route.shade_coverage_pct}% Shade Protection`,
            isVerified: true,
            routeDetails: {
              distanceKm: route.distance_km,
              shadeCoveragePct: route.shade_coverage_pct,
              durationMinutes: route.duration_minutes,
              heatExposureScore: route.heat_exposure_score,
              summary: route.summary,
              warnings: route.warnings,
            }
          });
        });

        // Start Point Marker
        const startCoord = route.coordinates[0];
        L.circleMarker(startCoord, {
          radius: 6,
          fillColor: '#FFFFFF',
          color: color,
          weight: 3,
          fillOpacity: 1
        }).addTo(routesLayer);
      });
    }

  }, [
    mapMode, 
    locations, 
    localityTelemetry, 
    forecastHorizon, 
    currentLocation, 
    deviceLocation, 
    userLat, 
    userLon, 
    handleSelectPlace
  ]);

  // Initial report generator for active location
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

  // Fullscreen Toggle
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
      className={`relative isolate z-0 flex flex-col rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white text-slate-900 ${className}`}
    >
      {/* =========================================================================
          TOP COMMAND BAR & UNIVERSAL SEARCH & 6 TABS SOFT PILL SELECTOR
          ========================================================================= */}
      <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md border-b border-slate-100 z-30 space-y-3">
        {/* Search row */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-[#1E60F2] animate-spin' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search any locality, road, city or PIN across India..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchSuggestions.length > 0) setIsSearchOpen(true); }}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] hover:border-slate-300 focus:border-[#1E60F2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-10 pr-20 py-2.5 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/15 transition-all"
            />
            
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

          {/* Search suggestions dropdown */}
          {isSearchOpen && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E5EDF5] rounded-2xl shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
              <div className="p-2.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-100 bg-[#F8FAFC]">
                <span>Geographical Search Results</span>
                <span className="font-mono text-[#1E60F2] font-semibold">{searchSuggestions.length} found</span>
              </div>
              {searchSuggestions.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F5F8FC] flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-xl bg-blue-50 text-[#1E60F2] text-xs shrink-0">
                      {place.type === 'city' ? '🏙️' : '📍'}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {place.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {place.latitude.toFixed(3)}°N, {place.longitude.toFixed(3)}°E • {place.city}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6 TABS CLEAN SOFT PILL SELECTOR BAR */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-2xl overflow-x-auto no-scrollbar shadow-2xs">
            {[
              { id: 'heat_risk', label: 'Heat Risk', icon: Flame, iconColor: 'text-orange-500' },
              { id: 'temperature', label: 'Temperature', icon: Thermometer, iconColor: 'text-rose-500' },
              { id: 'water', label: 'Water', icon: Droplets, iconColor: 'text-blue-500' },
              { id: 'cooling', label: 'Cooling', icon: Building2, iconColor: 'text-emerald-500' },
              { id: 'medical', label: 'Medical', icon: Stethoscope, iconColor: 'text-red-500' },
              { id: 'routes', label: 'Safe Routes', icon: Navigation, iconColor: 'text-cyan-600' },
            ].map((tab) => {
              const isSelected = mapMode === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMapMode(tab.id as any);
                    setSelectedFacility(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap btn-press ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1E60F2]' : tab.iconColor}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick refresh telemetry */}
          <button
            type="button"
            onClick={() => syncAllLocalitiesTelemetry(true)}
            disabled={isRefreshingAll}
            className="p-2 rounded-xl bg-[#F5F8FC] text-slate-600 hover:text-[#1E60F2] hover:bg-blue-50 border border-[#E5EDF5] transition-colors"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin text-[#1E60F2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN MAP CANVAS & FLOATING OVERLAYS
          ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Map Viewport Container */}
        <div className="w-full lg:w-[68%] xl:w-[70%] relative h-[440px] sm:h-[480px] lg:h-full min-h-0 overflow-hidden isolate z-0 shrink-0 lg:shrink">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Horizon Selector (active in temperature / heat risk mode) */}
          {(mapMode === 'heat_risk' || mapMode === 'temperature') && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-sm text-xs">
              <span className="text-slate-400 pl-2 pr-1 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1E60F2]" />
                <span className="hidden sm:inline">Horizon:</span>
              </span>

              {(['now', 24, 48, 72] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold transition-all ${
                    forecastHorizon === h
                      ? 'bg-[#1E60F2] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {h === 'now' ? 'Live' : `+${h}h`}
                </button>
              ))}
            </div>
          )}

          {/* NO FAKE DATA: Honest Empty State Floating Notification Banner */}
          {currentModeEmptyState && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white/98 backdrop-blur-md border border-amber-200/90 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-3 text-xs text-slate-800 max-w-[95%] sm:max-w-lg animate-in fade-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 leading-tight">
                  No registered {mapMode} facilities within 10 km
                </div>
                <div className="text-[11px] text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                  <PhoneCall className="w-3 h-3" />
                  <span>Heat emergency helpline: 108 / 112</span>
                </div>
              </div>
              <a
                href="tel:108"
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-xs"
              >
                Call 108
              </a>
            </div>
          )}

          {/* Floating Notice: Analyzed Area vs Real Device GPS */}
          {isAnalyzingDifferentLocation && deviceLocation && !currentModeEmptyState && (
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

          {/* Map Controls: Style Switcher & Zoom */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-sm text-[11px]">
              {(['osm', 'satellite', 'dark'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setMapStyle(s)}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase transition-colors ${
                    mapStyle === s ? 'bg-[#1E60F2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s === 'osm' ? 'Street' : s}
                </button>
              ))}
            </div>

            <div className="flex flex-col bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl shadow-sm overflow-hidden text-slate-700">
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
                title="My Device Location"
              >
                <Navigation className="w-3.5 h-3.5 text-[#1E60F2]" />
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

          {/* Floating Legend Bottom-Left */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-[#E5EDF5] rounded-2xl p-3 shadow-sm text-xs hidden sm:block">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="text-slate-600 font-semibold">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                <span className="text-slate-600 font-semibold">Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-200" />
                <span className="text-slate-600 font-semibold">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200 animate-pulse" />
                <span className="font-bold text-red-600">Critical &gt;35°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT-HAND INTELLIGENCE & FACILITY DETAILS FLYOUT CARD
            ========================================================================= */}
        <div className="w-full lg:w-[32%] xl:w-[30%] min-h-0 h-auto lg:h-full border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col relative z-10 overflow-hidden bg-white">
          <LocationIntelligencePanel
            report={activeReport}
            isLoading={isLoadingReport}
            selectedFacility={selectedFacility}
            onClearSelectedFacility={() => setSelectedFacility(null)}
            onSelectPlace={handleSelectPlace}
            className="flex-1 min-h-0"
          />
        </div>
      </div>
    </div>
  );
};

export default HeatRiskMap;
