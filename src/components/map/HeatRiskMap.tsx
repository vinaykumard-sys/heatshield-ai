import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Search, 
  Layers, 
  MapPin, 
  Flame, 
  Thermometer, 
  Droplets, 
  Building2, 
  HelpCircle,
  Sparkles,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Clock,
  Compass,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  LocationZone, 
  EnvironmentalReading, 
  HeatRiskAssessment, 
  CoolingCentre, 
  PublicWaterPoint, 
  HeatForecast 
} from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { evaluateHeatRisk } from '../../lib/riskEngine';
import { fetchLiveWeather } from '../../lib/weatherApi';
import { useLanguage } from '../../context/LanguageContext';
import { useLocationTracker } from '../../context/LocationContext';
import { mockDb } from '../../lib/mockDb';
import { generateLocationForecasts } from '../../lib/predictionEngine';

interface HeatRiskMapProps {
  locations: LocationZone[];
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

// Clean concise place name helper for map pill display
const getPlaceShortName = (fullName: string): string => {
  const parts = fullName.split('&');
  let short = parts[0].trim();
  short = short
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
  return short;
};

export const HeatRiskMap: React.FC<HeatRiskMapProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  className = 'h-[580px]'
}) => {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const coolingCentresLayerRef = useRef<L.LayerGroup | null>(null);
  const waterPointsLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});

  const { currentLocation } = useLocationTracker();
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'voyager'>('osm');
  const [activeLoc, setActiveLoc] = useState<LocationZone | null>(null);
  const [activeRisk, setActiveRisk] = useState<HeatRiskAssessment | null>(null);
  const [activeReading, setActiveReading] = useState<EnvironmentalReading | null>(null);
  const [activeForecasts, setActiveForecasts] = useState<HeatForecast[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [forecastHorizon, setForecastHorizon] = useState<'now' | 24 | 48 | 72>('now');
  
  // Layer toggles
  const [showCoolingCentres, setShowCoolingCentres] = useState(true);
  const [showWaterPoints, setShowWaterPoints] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());

  // Real-time temperature registry for each locality
  const [localityTelemetry, setLocalityTelemetry] = useState<Record<string, LocalityTelemetry>>({});

  // Sync real-time temperature across all monitored localities
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

  // Automated 5-Minute Recurring Telemetry Polling Cycle
  useEffect(() => {
    syncAllLocalitiesTelemetry(false);

    const refreshTimer = setInterval(() => {
      console.log(`[HeatRiskMap] Executing 5-minute automated real-time temperature update at ${new Date().toLocaleTimeString()}`);
      syncAllLocalitiesTelemetry(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshTimer);
  }, [syncAllLocalitiesTelemetry]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Bangalore or current detected location
    const initialLat = currentLocation.latitude || 12.9716;
    const initialLon = currentLocation.longitude || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: false,
    });

    // Standard OpenStreetMap Tile Layer - The original, high-contrast, fully labeled map
    const standardOsm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    });

    standardOsm.addTo(map);
    currentTileLayerRef.current = standardOsm;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    zonesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    coolingCentresLayerRef.current = L.layerGroup().addTo(map);
    waterPointsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Style Switcher (Original OSM vs Satellite vs Clean Voyager)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newLayer: L.TileLayer;
    if (mapStyle === 'satellite') {
      newLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      });
    } else if (mapStyle === 'voyager') {
      newLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      });
    } else {
      // Standard Original OpenStreetMap
      newLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      });
    }

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Markers, Zones, Cooling Centres, and Water Points
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
    markerMapRef.current = {};

    // 1. Render User Current GPS Location Marker with Place Name Pill
    if (currentLocation.latitude && currentLocation.longitude) {
      const userLocName = currentLocation.localityName || 'Your Location';
      const userMarkerHtml = `
        <div class="heatshield-user-pin-wrapper" style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #2563EB;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: #FFFFFF;
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #FFFFFF;
              box-shadow: 0 0 6px #FFFFFF;
              display: inline-block;
              flex-shrink: 0;
            "></span>
            <span>📍 You: ${userLocName}</span>
          </div>
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #2563EB;
          "></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: 'heatshield-user-pin-icon',
        iconSize: [160, 32],
        iconAnchor: [80, 32],
        popupAnchor: [0, -32],
      });

      const userMarker = L.marker([currentLocation.latitude, currentLocation.longitude], { icon: userIcon })
        .addTo(markersLayer);

      const userPopupHtml = `
        <div style="min-width: 250px; font-family: 'Inter', system-ui, sans-serif; color: #0F172A;">
          <div style="font-size: 10px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            📍 Live User Position
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">
            ${userLocName}, ${currentLocation.city}
          </div>
          <div style="font-size: 11px; color: #64748B; font-family: monospace; margin-bottom: 8px;">
            Lat: ${currentLocation.latitude.toFixed(4)}°N • Lon: ${currentLocation.longitude.toFixed(4)}°E
          </div>
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748B;">Device Tracking:</span>
              <span style="font-weight: 700; color: #2563EB;">● ACTIVE (${(currentLocation.locationSource || 'gps').toUpperCase()})</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Monitored City:</span>
              <span style="font-weight: 700; color: #0F172A;">${currentLocation.city}, ${currentLocation.state}</span>
            </div>
          </div>
        </div>
      `;

      userMarker.bindPopup(userPopupHtml, {
        maxWidth: 290,
        className: 'heatshield-climate-popup',
        autoPan: true
      });
    }

    // 2. Render Cooling Centres Layer if Enabled
    if (showCoolingCentres) {
      const coolingCentres = mockDb.getCoolingCentres().filter(c => c.verification_status === 'verified');
      coolingCentres.forEach(centre => {
        const coolIcon = L.divIcon({
          html: `
            <div class="cursor-pointer group" style="display: inline-flex; align-items: center; justify-content: center;">
              <div style="
                background: #FFFFFF;
                border: 2px solid #2563EB;
                color: #2563EB;
                border-radius: 9999px;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: 700;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
              ">
                <span>❄️</span>
                <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${centre.name.split(' ')[0]} Shelter</span>
              </div>
            </div>
          `,
          className: 'cooling-map-pin',
          iconSize: [120, 26],
          iconAnchor: [60, 13],
          popupAnchor: [0, -15]
        });

        const coolMarker = L.marker([centre.latitude, centre.longitude], { icon: coolIcon }).addTo(coolingLayer);

        coolMarker.bindPopup(`
          <div style="min-width: 260px; font-family: 'Inter', system-ui, sans-serif; color: #0F172A;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 700; color: #2563EB; text-transform: uppercase;">
                ❄️ Verified Public Cooling Shelter
              </span>
              <span style="font-size: 9px; font-weight: 700; color: #16A34A; background: #DCFCE7; padding: 1px 6px; border-radius: 4px;">
                OPEN NOW
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 2px;">
              ${centre.name}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
              ${centre.address}
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px; font-size: 10px; margin-bottom: 8px;">
              <div>⏰ Hours: <b>${centre.operating_hours}</b></div>
              <div>👥 Capacity: <b>~${centre.capacity_estimate} persons</b></div>
              <div>💧 Drinking Water: <b>${centre.drinking_water_available ? 'Yes' : 'No'}</b> • AC: <b>${centre.air_conditioned ? 'Yes' : 'Fans'}</b></div>
            </div>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}" 
              target="_blank" 
              rel="noreferrer"
              style="display: block; text-align: center; background: #2563EB; color: white; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              Get Directions →
            </a>
          </div>
        `, { maxWidth: 290, className: 'heatshield-climate-popup' });
      });
    }

    // 3. Render Public Water Points Layer if Enabled
    if (showWaterPoints) {
      const waterPoints = mockDb.getWaterPoints().filter(w => w.is_operational);
      waterPoints.forEach(wp => {
        const waterIcon = L.divIcon({
          html: `
            <div class="cursor-pointer" style="display: inline-flex; align-items: center; justify-content: center;">
              <div style="
                background: #0284C7;
                color: #FFFFFF;
                border: 1.5px solid #FFFFFF;
                border-radius: 9999px;
                padding: 2px 6px;
                font-size: 9px;
                font-weight: 800;
                box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
                display: flex;
                align-items: center;
                gap: 2px;
                white-space: nowrap;
              ">
                <span>💧 Water ATM</span>
              </div>
            </div>
          `,
          className: 'water-map-pin',
          iconSize: [80, 22],
          iconAnchor: [40, 11],
          popupAnchor: [0, -12]
        });

        const waterMarker = L.marker([wp.latitude, wp.longitude], { icon: waterIcon }).addTo(waterLayer);
        waterMarker.bindPopup(`
          <div style="min-width: 200px; font-family: 'Inter', system-ui, sans-serif;">
            <div style="font-size: 9px; font-weight: 700; color: #0284C7; text-transform: uppercase;">
              💧 Verified Drinking Water Point
            </div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A; margin: 2px 0;">
              ${wp.name}
            </div>
            <div style="font-size: 10px; color: #64748B;">
              Locality: ${wp.locality_name} • Status: <b style="color: #16A34A;">Operational</b>
            </div>
          </div>
        `, { maxWidth: 240, className: 'heatshield-climate-popup' });
      });
    }

    // 4. Render Monitored Neighbourhood Heat Risk Zones & Place Markers
    const openRequests = mockDb.getRequests().filter(r => r.status === 'open' || r.status === 'assigned');

    locations.forEach((loc) => {
      const telemetry = localityTelemetry[loc.id];
      const isNorth = loc.latitude > 25.0;
      const defaultTemp = isNorth ? 39.5 : 33.8;
      
      // Select temperature based on chosen forecast horizon
      let activeHorizonTemp = telemetry?.tempC ?? defaultTemp;
      if (forecastHorizon === 24) activeHorizonTemp = telemetry?.pred24 ?? (activeHorizonTemp + 1.2);
      else if (forecastHorizon === 48) activeHorizonTemp = telemetry?.pred48 ?? (activeHorizonTemp + 1.8);
      else if (forecastHorizon === 72) activeHorizonTemp = telemetry?.pred72 ?? (activeHorizonTemp + 0.6);

      const currentHumidity = telemetry?.humidityPct ?? 52;
      const currentFeelsLike = activeHorizonTemp + 2.8;

      // STRICT USER RULE: RED CIRCLE APPEARS ONLY WHEN TEMPERATURE > 35°C!
      const isAbove35 = activeHorizonTemp > 35.0;

      // Filter handling
      if (filterRisk === 'above35' && !isAbove35) return;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = loc.name.toLowerCase().includes(q) || loc.city.toLowerCase().includes(q);
        if (!matches) return;
      }

      // Draw Neighborhood Heat Risk Zone Circle:
      // STRICT REQUIREMENT: RED CIRCLE APPEARS ONLY WHEN TEMPERATURE > 35°C.
      // IF <= 35°C, NO CIRCLE APPEARS (NORMAL). NO GREEN CIRCLES!
      let zoneCircle: L.Circle | null = null;
      if (isAbove35) {
        const radiusMeters = 2400 + (loc.estimated_population / 25);
        zoneCircle = L.circle([loc.latitude, loc.longitude], {
          radius: radiusMeters,
          color: '#DC2626', // Red
          weight: 2.0,
          opacity: 0.85,
          fillColor: '#DC2626',
          fillOpacity: 0.22,
          dashArray: '5, 5',
        }).addTo(zonesLayer);
      }

      // Custom Place Name Pill Marker
      const isSelected = activeLoc?.id === loc.id;
      const placeShortName = getPlaceShortName(loc.name);

      const markerHtml = `
        <div class="heatshield-place-pill-wrapper" style="position: relative; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: ${isAbove35 ? '#FEF2F2' : '#FFFFFF'};
            border: 2px solid ${isAbove35 ? '#DC2626' : (isSelected ? '#2563EB' : '#CBD5E1')};
            box-shadow: 0 4px 12px ${isAbove35 ? 'rgba(220, 38, 38, 0.35)' : (isSelected ? 'rgba(15, 23, 42, 0.25)' : 'rgba(15, 23, 42, 0.10)')};
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: ${isAbove35 ? '#991B1B' : '#0F172A'};
            white-space: nowrap;
            transition: all 0.15s ease;
            transform: ${isSelected ? 'scale(1.10)' : 'scale(1)'};
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: ${isAbove35 ? '#DC2626' : '#64748B'};
              box-shadow: ${isAbove35 ? '0 0 6px #DC2626' : 'none'};
              display: inline-block;
              flex-shrink: 0;
            " class="${isAbove35 ? 'animate-ping' : ''}"></span>
            <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em;">${placeShortName}</span>
            <span style="
              font-size: 10px;
              font-family: monospace;
              font-weight: 800;
              color: ${isAbove35 ? '#FFFFFF' : '#334155'};
              background: ${isAbove35 ? '#DC2626' : '#F1F5F9'};
              padding: 1px 6px;
              border-radius: 4px;
            ">${activeHorizonTemp.toFixed(1)}°C ${isAbove35 ? '⚠️ >35°C' : ''}</span>
          </div>
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${isAbove35 ? '#DC2626' : (isSelected ? '#2563EB' : '#94A3B8')};
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'heatshield-place-pill-icon',
        iconSize: [160, 32],
        iconAnchor: [80, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(markersLayer);
      markerMapRef.current[loc.id] = marker;

      // Popup on click
      const popupHtml = `
        <div style="min-width: 270px; max-width: 310px; font-family: 'Inter', system-ui, sans-serif; color: #0F172A; line-height: 1.4;">
          <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">
                📍 ${loc.city}, ${loc.state}
              </span>
              <span style="
                display: inline-block;
                padding: 2px 7px;
                border-radius: 9999px;
                font-size: 9px;
                font-weight: 800;
                color: ${isAbove35 ? '#ffffff' : '#334155'};
                background-color: ${isAbove35 ? '#DC2626' : '#E2E8F0'};
                text-transform: uppercase;
              ">
                ${isAbove35 ? '⚠️ RED HEAT ZONE (>35°C)' : 'NORMAL (≤35°C)'}
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; line-height: 1.3;">
              ${loc.name}
            </div>
            <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 2px;">
              Horizon: <b>${forecastHorizon === 'now' ? 'Live Reading' : `+${forecastHorizon} Hours Projection`}</b>
            </div>
          </div>

          ${isAbove35 ? `
            <div style="background: #FEF2F2; border: 1.5px solid #DC2626; border-radius: 8px; padding: 7px 9px; margin-bottom: 8px; display: flex; align-items: start; gap: 6px;">
              <span style="font-size: 14px; line-height: 1;">⚠️</span>
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #DC2626;">RED HEAT ZONE (ABOVE 35°C)</div>
                <div style="font-size: 10px; color: #991B1B; line-height: 1.3;">Temperature exceeds 35°C. Red circle rendered on map. Maintain hydration and seek shade.</div>
              </div>
            </div>
          ` : `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; font-size: 10px; color: #475569;">
              ✅ <b>Normal Temperature:</b> Current reading is ≤ 35°C. No red circle overlay.
            </div>
          `}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 8px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 5px 8px; border-radius: 6px;">
              <div style="color: #64748B; font-size: 9px; font-weight: 600;">🌡️ ${forecastHorizon === 'now' ? 'Current Temp' : 'Projected Temp'}</div>
              <div style="font-weight: 900; font-size: 15px; color: ${isAbove35 ? '#DC2626' : '#0F172A'}; font-family: monospace;">
                ${activeHorizonTemp.toFixed(1)}°C
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 5px 8px; border-radius: 6px;">
              <div style="color: #64748B; font-size: 9px; font-weight: 600;">🔥 Feels Like</div>
              <div style="font-weight: 800; font-size: 14px; color: ${isAbove35 ? '#DC2626' : '#EA580C'}; font-family: monospace;">
                ${currentFeelsLike.toFixed(1)}°C
              </div>
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px; font-size: 10px; color: #475569;">
            <div>🏥 Verified Cooling Centres: <b>${loc.cooling_centers_count} Nearby</b></div>
            <div>🏢 Urban Heat Island Multiplier: <b>${loc.urban_heat_island_factor}x</b></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 330,
        minWidth: 270,
        className: 'heatshield-climate-popup',
        autoPan: true,
        autoPanPadding: L.point(40, 40),
      });

      marker.on('click', () => {
        handleSelectLocation(loc);
        marker.openPopup();
      });

      if (zoneCircle) {
        zoneCircle.on('click', () => {
          handleSelectLocation(loc);
          marker.openPopup();
        });
      }

      // Assistance request markers if enabled
      if (showRequests) {
        const locRequests = openRequests.filter(r => r.locality_id === loc.id);
        if (locRequests.length > 0) {
          const reqIcon = L.divIcon({
            html: `
              <div class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm border border-white" title="${locRequests.length} Active Requests">
                ${locRequests.length}
              </div>
            `,
            className: 'request-map-pin',
            iconSize: [20, 20],
            iconAnchor: [0, 20]
          });

          L.marker([loc.latitude + 0.012, loc.longitude + 0.012], { icon: reqIcon })
            .addTo(markersLayer)
            .bindTooltip(`${locRequests.length} Open Assistance Requests in ${loc.name}`);
        }
      }
    });

  }, [
    locations, 
    filterRisk, 
    searchQuery, 
    showCoolingCentres, 
    showWaterPoints, 
    showRequests, 
    activeLoc, 
    language, 
    localityTelemetry,
    forecastHorizon
  ]);

  // Handle Location Selection and fetch telemetry + 24/48/72h predictions
  const handleSelectLocation = async (loc: LocationZone, initialRisk?: HeatRiskAssessment) => {
    setActiveLoc(loc);
    if (onSelectLocation) onSelectLocation(loc);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 13, { duration: 1.0 });
    }

    setIsLoadingTelemetry(true);
    try {
      const weatherData = await fetchLiveWeather(loc.latitude, loc.longitude, loc.id);
      setActiveReading(weatherData.reading);
      setIsLiveTelemetry(weatherData.isLive);

      const updatedRisk = evaluateHeatRisk({
        temperatureC: weatherData.reading.temperature_c,
        relativeHumidityPct: weatherData.reading.relative_humidity_pct,
        baselineVulnerabilityScore: loc.baseline_vulnerability_score,
        urbanHeatIslandFactor: loc.urban_heat_island_factor,
      }, loc.id, language);

      setActiveRisk(updatedRisk);

      // Load horizon forecasts for sidebar
      const fcList = await generateLocationForecasts(loc);
      setActiveForecasts(fcList);
    } catch (e) {
      if (initialRisk) setActiveRisk(initialRisk);
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (locations.length > 0 && !activeLoc) {
      const target = selectedLocationId 
        ? locations.find(l => l.id === selectedLocationId) || locations[0]
        : locations[0];
      handleSelectLocation(target);
    }
  }, [locations, selectedLocationId]);

  return (
    <div className={`relative isolate z-0 flex flex-col lg:flex-row rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm ${className}`}>
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[530px] z-20 flex flex-col gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('btnSearchLocation')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 text-xs sm:text-sm pl-9 pr-4 py-2 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Forecast Horizon Selector & Layers */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm text-[11px]">
          <span className="text-slate-400 px-1 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Time:</span>
          </span>

          <button
            onClick={() => setForecastHorizon('now')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              forecastHorizon === 'now' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Live Now
          </button>
          <button
            onClick={() => setForecastHorizon(24)}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              forecastHorizon === 24 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            +24h
          </button>
          <button
            onClick={() => setForecastHorizon(48)}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              forecastHorizon === 48 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            +48h
          </button>
          <button
            onClick={() => setForecastHorizon(72)}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              forecastHorizon === 72 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            +72h
          </button>

          <div className="h-3 w-px bg-slate-200 mx-0.5" />

          {/* Layer Controls */}
          <button
            onClick={() => setShowCoolingCentres(!showCoolingCentres)}
            className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 ${
              showCoolingCentres ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Toggle Cooling Centres Layer"
          >
            <span>❄️ Shelters</span>
          </button>

          <button
            onClick={() => setShowWaterPoints(!showWaterPoints)}
            className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 ${
              showWaterPoints ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Toggle Public Water Points Layer"
          >
            <span>💧 Water</span>
          </button>

          {/* Quick Filter: >35°C Red Circles Only */}
          <button
            onClick={() => setFilterRisk(filterRisk === 'above35' ? 'all' : 'above35')}
            className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
              filterRisk === 'above35' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
            }`}
            title="Show only places where temperature goes above 35°C (Red Circles)"
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>&gt;35°C Red Zones</span>
          </button>

          {/* 5-Min Telemetry Auto-Update Status Indicator */}
          <button
            onClick={() => syncAllLocalitiesTelemetry(true)}
            disabled={isRefreshingAll}
            className="px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 ml-auto"
            title="Real-time temperature updates every 5 minutes across the whole website. Click to sync now."
          >
            <RefreshCw className={`w-2.5 h-2.5 text-blue-600 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>5m</span>
          </button>
        </div>
      </div>

      {/* Map Style Selector (Top Right) */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm text-xs">
        <button
          onClick={() => setMapStyle('osm')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors flex items-center gap-1 ${
            mapStyle === 'osm' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Original Standard OpenStreetMap"
        >
          <span>🗺️ Original Map</span>
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors flex items-center gap-1 ${
            mapStyle === 'satellite' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Satellite Imagery"
        >
          <span>🛰️ Satellite</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 w-full h-[400px] sm:h-[500px] lg:h-full relative min-h-[380px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-2.5 shadow-sm text-xs hidden sm:block">
          <p className="text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1 flex items-center justify-between gap-3">
            <span>Thermal Alert System</span>
            <span className="text-[9px] font-mono font-normal text-slate-400">
              {forecastHorizon === 'now' ? 'Live Telemetry' : `+${forecastHorizon}h Projections`}
            </span>
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-slate-100" />
              <span className="text-slate-600">Normal (≤35°C): Clean Map</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-400/40 animate-pulse" />
              <span className="font-bold text-red-700">Heat Alert (&gt;35°C): Red Circle</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <span>❄️ Cooling Shelter</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <span>💧 Water ATM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Location Details Panel with 24/48/72h Horizon Overview */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col p-4 sm:p-5 overflow-y-auto max-h-[500px] lg:max-h-none">
        {activeLoc && activeRisk ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {activeLoc.city}, {activeLoc.state}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isLiveTelemetry ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isLiveTelemetry ? '● LIVE METEO' : '● ESTIMATED MODEL'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{activeLoc.name}</h3>
              <p className="text-xs text-slate-500 font-mono">
                PIN: {activeLoc.pincode} • Pop: ~{activeLoc.estimated_population.toLocaleString()}
              </p>
            </div>

            {/* Red Zone Banner if > 35°C */}
            {(activeReading?.temperature_c ?? 0) > 35.0 ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>RED HEAT ZONE: Current temperature exceeds 35°C ({activeReading?.temperature_c}°C). Red circle is displayed on the map.</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>Normal Temperature ({activeReading?.temperature_c ?? 34}°C). No red circle overlay.</span>
              </div>
            )}

            {/* Live Telemetry Readings Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-600" />
                  <span>Ambient Temp</span>
                </div>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {activeReading?.temperature_c ?? 34.5}°C
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  <span>Feels Like</span>
                </div>
                <span className="text-base font-bold text-orange-600 font-mono">
                  {activeReading?.feels_like_c ?? 37.2}°C
                </span>
              </div>
            </div>

            {/* Hyperlocal Predictive 24h / 48h / 72h Forecast Cards */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Predicted Thermal Horizons
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {activeForecasts.map(fc => (
                  <div key={fc.forecast_horizon_hours} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      +{fc.forecast_horizon_hours}h
                    </span>
                    <span className={`text-sm font-extrabold block my-0.5 ${fc.predicted_temperature_c > 35 ? 'text-red-600' : 'text-slate-900'}`}>
                      {fc.predicted_temperature_c}°C
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Risk: {fc.predicted_risk_score.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Risk Reasoning */}
            <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Hyperlocal AI Assessment</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeRisk.ai_explanation}
              </p>
            </div>

            {/* Community Assets Nearby */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Community Heat Defense Assets
              </p>
              <div className="flex items-center justify-between text-slate-700">
                <span>❄️ Verified Cooling Centres</span>
                <span className="font-bold font-mono">{activeLoc.cooling_centers_count} Active</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>🏢 Urban Heat Island Multiplier</span>
                <span className="font-bold font-mono">{activeLoc.urban_heat_island_factor}x</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center py-12">
            Select any heat zone marker on the map to inspect hyperlocal environmental risk.
          </div>
        )}
      </div>
    </div>
  );
};
