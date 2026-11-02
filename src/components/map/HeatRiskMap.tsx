import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Search, 
  Layers, 
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
  SlidersHorizontal,
  ChevronRight,
  Heart,
  X
} from 'lucide-react';
import { 
  LocationZone, 
  EnvironmentalReading, 
  HeatRiskAssessment, 
  CoolingCentre, 
  PublicWaterPoint, 
  HeatForecast,
  GeocodedPlace,
  LocationHeatReport
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationTracker } from '../../context/LocationContext';
import { mockDb } from '../../lib/mockDb';
import { fetchLiveWeather } from '../../lib/weatherApi';
import { evaluateHeatRisk } from '../../lib/riskEngine';
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
  let short = parts[0].trim();
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

export const HeatRiskMap: React.FC<HeatRiskMapProps> = ({
  locations = mockDb.getLocations(),
  selectedLocationId,
  onSelectLocation,
  className = 'h-[680px]'
}) => {
  const { t, language } = useLanguage();
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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Layer Controls
  const [activeLayerMode, setActiveLayerMode] = useState<'heat' | 'temperature' | 'humidity' | 'forecast'>('heat');
  const [forecastHorizon, setForecastHorizon] = useState<'now' | 24 | 48 | 72>('now');
  const [showCoolingCentres, setShowCoolingCentres] = useState(true);
  const [showWaterPoints, setShowWaterPoints] = useState(true);
  const [showMonitoringStations, setShowMonitoringStations] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // 5-minute telemetry sync for base locations
  const [localityTelemetry, setLocalityTelemetry] = useState<Record<string, LocalityTelemetry>>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());

  // Recent searches and favorites
  const [recentPlaces, setRecentPlaces] = useState<GeocodedPlace[]>(() => mockDb.getRecentPlaces());

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
    setLastSyncTimestamp(new Date());
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
          background: rgba(11, 19, 43, 0.95);
          backdrop-filter: blur(8px);
          border: 1.5px solid ${pinColor};
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
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
          <span style="color: ${pinColor};">●</span>
          <span>${title}</span>
          ${temp !== undefined ? `<span style="font-family: monospace; color: ${isHot ? '#EF4444' : '#38BDF8'};">${temp.toFixed(1)}°C</span>` : ''}
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
      const zoomLevel = place.type === 'city' ? 12 : place.type === 'postcode' ? 14 : 14;
      mapInstanceRef.current.flyTo([place.latitude, place.longitude], zoomLevel, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }

    // 2. Drop animated sonar target pin
    dropSonarTargetMarker(place.latitude, place.longitude, place.shortName);

    // 3. Generate end-to-end AI Location Heat Report
    try {
      const { report, weatherResult } = await generateLocationHeatReport(place);
      setActiveReport(report);
      setRecentPlaces(mockDb.getRecentPlaces());

      // Update sonar pin with live temp
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

      // 2. Generate AI Location Report
      const { report, weatherResult } = await generateLocationHeatReport(geocoded);
      setActiveReport(report);
      setRecentPlaces(mockDb.getRecentPlaces());

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

  // Initialize Leaflet Map (Command Center Theme)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocation.latitude || 12.9716;
    const initialLon = currentLocation.longitude || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Default: CartoDB Dark Matter (Futuristic Navy/Dark Command)
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    });

    darkTiles.addTo(map);
    currentTileLayerRef.current = darkTiles;

    // Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    coolingCentresLayerRef.current = L.layerGroup().addTo(map);
    waterPointsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    targetPinLayerRef.current = L.layerGroup().addTo(map);

    // Click anywhere listener
    map.on('click', handleMapClick);

    mapInstanceRef.current = map;

    return () => {
      map.off('click', handleMapClick);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentLocation.latitude, currentLocation.longitude, handleMapClick]);

  // Map Style Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newLayer: L.TileLayer;
    if (mapStyle === 'satellite') {
      newLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri World Imagery',
        maxZoom: 18,
      });
    } else if (mapStyle === 'osm') {
      newLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      });
    } else {
      // Dark Command (CartoDB Dark Matter)
      newLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
      });
    }

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [mapStyle]);

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

  // Render Base Monitoring Markers & Red Danger Circles
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

      L.marker([currentLocation.latitude, currentLocation.longitude], { icon: userIcon }).addTo(markersLayer);
    }

    // 2. Cooling Centres Layer
    if (showCoolingCentres) {
      const coolingCentres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
      coolingCentres.forEach(centre => {
        const coolIcon = L.divIcon({
          html: `
            <div style="
              background: #0F172A;
              border: 1.5px solid #38BDF8;
              color: #38BDF8;
              border-radius: 9999px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>❄️</span>
              <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${centre.name.split(' ')[0]} Shelter</span>
            </div>
          `,
          className: 'cooling-map-pin',
          iconSize: [120, 26],
          iconAnchor: [60, 13]
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

    // 3. Public Water Points Layer
    if (showWaterPoints) {
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

    // 4. Monitored Municipal Zones & >35°C Red Danger Circles
    if (showMonitoringStations) {
      locations.forEach(loc => {
        const telemetry = localityTelemetry[loc.id];
        const isNorth = loc.latitude > 25.0;
        const defaultTemp = isNorth ? 39.5 : 33.8;
        
        let activeTemp = telemetry?.tempC ?? defaultTemp;
        if (forecastHorizon === 24) activeTemp = telemetry?.pred24 ?? (activeTemp + 1.2);
        else if (forecastHorizon === 48) activeTemp = telemetry?.pred48 ?? (activeTemp + 1.8);
        else if (forecastHorizon === 72) activeTemp = telemetry?.pred72 ?? (activeTemp + 0.6);

        // USER RULE: Red circle ONLY when temp > 35°C! (If <=35, normal, NO green circle)
        const isAbove35 = activeTemp > 35.0;

        if (isAbove35) {
          L.circle([loc.latitude, loc.longitude], {
            radius: 2600 + (loc.estimated_population / 25),
            color: '#EF4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#DC2626',
            fillOpacity: 0.22,
            dashArray: '6, 6'
          }).addTo(zonesLayer);
        }

        // Futuristic Station Pill
        const placeShort = getPlaceShortName(loc.name);
        const markerHtml = `
          <div style="position: relative; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: ${isAbove35 ? 'rgba(69, 10, 10, 0.95)' : 'rgba(15, 23, 42, 0.90)'};
              border: 1.5px solid ${isAbove35 ? '#EF4444' : '#334155'};
              box-shadow: 0 4px 14px ${isAbove35 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
              padding: 3px 9px;
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
                background-color: ${isAbove35 ? '#EF4444' : '#64748B'};
                box-shadow: ${isAbove35 ? '0 0 8px #EF4444' : 'none'};
                display: inline-block;
              "></span>
              <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${placeShort}</span>
              <span style="
                font-size: 10px;
                font-family: monospace;
                font-weight: 800;
                color: ${isAbove35 ? '#FFFFFF' : '#38BDF8'};
                background: ${isAbove35 ? '#DC2626' : '#1E293B'};
                padding: 1px 5px;
                border-radius: 4px;
              ">${activeTemp.toFixed(1)}°C</span>
            </div>
          </div>
        `;

        const stationIcon = L.divIcon({
          html: markerHtml,
          className: 'heatshield-station-pill',
          iconSize: [150, 30],
          iconAnchor: [75, 15]
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

  }, [
    locations, 
    showCoolingCentres, 
    showWaterPoints, 
    showMonitoringStations, 
    localityTelemetry, 
    forecastHorizon, 
    currentLocation, 
    handleSelectPlace
  ]);

  // Initial Load: Auto-generate report for current location or first location
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

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!outerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

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
        {/* Map Viewport Container */}
        <div className="flex-1 relative w-full h-[460px] sm:h-[540px] lg:h-auto min-h-[440px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Top Controls Bar (Layer & Time Horizon) */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl text-[11px]">
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

          {/* Floating Map Actions (Right Side) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
            {/* Style Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl text-[11px]">
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
            <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-xl overflow-hidden self-end">
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

          {/* Bottom Floating Legend (Feature 7) */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-2.5 shadow-2xl text-[11px] hidden sm:block">
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
        <LocationIntelligencePanel
          report={activeReport}
          isLoading={isLoadingReport}
          onSelectPlace={handleSelectPlace}
        />
      </div>
    </div>
  );
};
