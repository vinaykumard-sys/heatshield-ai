import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocationZone, EnvironmentalReading, HeatRiskAssessment } from '../types';
import { fetchLiveWeather } from '../lib/weatherApi';
import { evaluateHeatRisk } from '../lib/riskEngine';
import { mockDb } from '../lib/mockDb';

export interface TrackedLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  localityName: string;
  subArea?: string;
  city: string;
  state: string;
  pincode?: string;
  isRealDeviceLocation: boolean;
  locationSource?: 'gps' | 'ip' | 'search' | 'default';
  detectedAt?: string;
}

interface LocationContextType {
  currentLocation: TrackedLocation;
  currentReading: EnvironmentalReading | null;
  currentRisk: HeatRiskAssessment | null;
  isTracking: boolean;
  trackingError: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  detectLocation: () => Promise<void>;
  searchAndSetLocation: (query: string) => Promise<boolean>;
  selectCustomLocality: (loc: LocationZone) => void;
  selectedZone: LocationZone;
  isLiveWeather: boolean;
  forecastHourly: any[];
  forecastDaily: any[];
  lastSyncTime: Date | null;
  forceTelemetryRefresh: () => Promise<void>;
}

// Initial default: Bengaluru (Chokkanahalli / Yelahanka)
const DEFAULT_BENGALURU_LOCATION: TrackedLocation = {
  latitude: 13.0854,
  longitude: 77.6250,
  localityName: 'Chokkanahalli Road',
  subArea: 'Yelahanka / Jakkur Ward',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560064',
  isRealDeviceLocation: false,
  locationSource: 'default',
};

function createZoneFromTrackedLocation(loc: TrackedLocation): LocationZone {
  return {
    id: `loc-detected-${loc.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
    name: loc.localityName,
    city: loc.city,
    state: loc.state,
    pincode: loc.pincode || '560001',
    latitude: loc.latitude,
    longitude: loc.longitude,
    baseline_vulnerability_score: 72.0,
    urban_heat_island_factor: 1.35,
    cooling_centers_count: 3,
    estimated_population: 45000,
  };
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<TrackedLocation>(() => {
    const saved = localStorage.getItem('heatshield_tracked_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_BENGALURU_LOCATION;
  });

  const [selectedZone, setSelectedZone] = useState<LocationZone>(() => {
    return createZoneFromTrackedLocation(currentLocation);
  });

  const [currentReading, setCurrentReading] = useState<EnvironmentalReading | null>(null);
  const [currentRisk, setCurrentRisk] = useState<HeatRiskAssessment | null>(null);
  const [forecastHourly, setForecastHourly] = useState<any[]>([]);
  const [forecastDaily, setForecastDaily] = useState<any[]>([]);
  const [isLiveWeather, setIsLiveWeather] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // Load weather and risk for given coordinates
  const updateTelemetry = useCallback(async (lat: number, lon: number, locZone: LocationZone, forceRefresh: boolean = false) => {
    try {
      const weather = await fetchLiveWeather(lat, lon, locZone.id, forceRefresh);
      setCurrentReading(weather.reading);
      setIsLiveWeather(weather.isLive);
      setForecastHourly(weather.forecastHourly);
      setForecastDaily(weather.forecastDaily);
      setLastSyncTime(new Date());

      const risk = evaluateHeatRisk({
        temperatureC: weather.reading.temperature_c,
        relativeHumidityPct: weather.reading.relative_humidity_pct,
        baselineVulnerabilityScore: locZone.baseline_vulnerability_score,
        urbanHeatIslandFactor: locZone.urban_heat_island_factor,
      }, locZone.id);

      setCurrentRisk(risk);
    } catch (e) {
      console.warn('Weather telemetry update failed:', e);
    }
  }, []);

  // Update telemetry whenever coordinates change, and poll every 5 minutes (300,000 ms) in real time
  useEffect(() => {
    updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone);

    // 5-minute automated telemetry sync cycle
    const intervalTimer = setInterval(() => {
      console.log(`[HeatShield AI] Real-time 5-minute telemetry auto-update cycle triggered at ${new Date().toLocaleTimeString()}`);
      updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalTimer);
  }, [currentLocation.latitude, currentLocation.longitude, selectedZone.id, updateTelemetry]);

  // Expose manual forced refresh
  const forceTelemetryRefresh = useCallback(async () => {
    await updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone, true);
  }, [currentLocation.latitude, currentLocation.longitude, selectedZone, updateTelemetry]);

  // Reverse Geocoding helper with DNS timeout guard
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { 'Accept': 'application/json' }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        
        // Extract road, suburb, neighbourhood
        const road = addr.road || addr.street;
        const sub = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict;
        const localityName = road ? (sub ? `${road}, ${sub}` : road) : (sub || data.name || 'Hyperlocal Area');
        const city = addr.city || addr.town || addr.city_district || addr.state_district || 'Bengaluru';
        const state = addr.state || 'Karnataka';
        const pincode = addr.postcode || '';

        return {
          localityName,
          subArea: sub || city,
          city,
          state,
          pincode
        };
      }
    } catch (e) {
      // Graceful local heuristic fallback when DNS or network is unreachable
    }

    // Heuristic fallback based on coordinates if network geocode fails
    if (lat > 12.8 && lat < 13.3 && lon > 77.4 && lon < 77.8) {
      return {
        localityName: 'Chokkanahalli Road / Yelahanka',
        subArea: 'North Bengaluru Urban',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560064'
      };
    }

    if (lat > 28.4 && lat < 28.9 && lon > 77.0 && lon < 77.4) {
      return {
        localityName: 'Central Delhi / Connaught Place',
        subArea: 'Delhi Urban District',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      };
    }

    return {
      localityName: `Coordinates (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
      subArea: 'Local Ward',
      city: 'Current Area',
      state: 'India',
      pincode: ''
    };
  };

  // Fast IP Geolocation fallback when GPS is not yet granted or denied
  const detectLocationByIP = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://ipwho.is/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.latitude && data.longitude) {
          const newLoc: TrackedLocation = {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracyMeters: 3000,
            localityName: data.city || data.region || 'Urban Centre',
            subArea: `${data.city || 'District'} (${data.connection?.isp || 'IP Location'})`,
            city: data.city || 'Bengaluru',
            state: data.region || 'Karnataka',
            pincode: data.postal || '',
            isRealDeviceLocation: true,
            locationSource: 'ip',
            detectedAt: new Date().toISOString(),
          };

          const dynamicZone = createZoneFromTrackedLocation(newLoc);
          mockDb.saveLocation(dynamicZone);

          setCurrentLocation(newLoc);
          setSelectedZone(dynamicZone);
          localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
          await updateTelemetry(data.latitude, data.longitude, dynamicZone);
          return true;
        }
      }
    } catch (e) {
      console.warn('IP geolocation fallback notice:', e);
    }
    return false;
  }, [updateTelemetry]);

  // Detect real device browser location with GPS and IP fallback
  const detectLocation = useCallback(async (): Promise<void> => {
    setIsTracking(true);
    setTrackingError(null);

    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      await detectLocationByIP();
      setIsTracking(false);
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setPermissionStatus('granted');

          // Reverse geocode coordinates to extract locality & street name
          const geo = await reverseGeocode(latitude, longitude);

          const newLoc: TrackedLocation = {
            latitude,
            longitude,
            accuracyMeters: Math.round(accuracy),
            localityName: geo.localityName,
            subArea: geo.subArea || `GPS Fix (±${Math.round(accuracy)}m)`,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            isRealDeviceLocation: true,
            locationSource: 'gps',
            detectedAt: new Date().toISOString(),
          };

          const dynamicZone = createZoneFromTrackedLocation(newLoc);
          mockDb.saveLocation(dynamicZone);

          setCurrentLocation(newLoc);
          setSelectedZone(dynamicZone);
          localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
          setIsTracking(false);

          await updateTelemetry(latitude, longitude, dynamicZone);
          resolve();
        },
        async (err) => {
          // If browser GPS is denied or unavailable, immediately use IP fallback
          setPermissionStatus('denied');
          setTrackingError(
            err.code === err.PERMISSION_DENIED
              ? 'Browser location permission denied. Switched to City IP detection.'
              : 'GPS satellite fix timed out. Switched to City IP detection.'
          );
          await detectLocationByIP();
          setIsTracking(false);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000,
        }
      );
    });
  }, [detectLocationByIP, updateTelemetry]);

  // AUTO-DETECT LOCATION ON INITIAL APP LOAD
  useEffect(() => {
    // Automatically trigger location detection on startup so browser prompts immediately
    detectLocation();
  }, [detectLocation]);

  // Forward search any road/area in Bangalore or anywhere in India
  const searchAndSetLocation = async (query: string): Promise<boolean> => {
    if (!query.trim()) return false;
    setIsTracking(true);
    setTrackingError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Append countrycodes=in for India focus
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Search failed');

      const results = await res.json();
      if (!results || results.length === 0) {
        setTrackingError(`No location found for "${query}". Try adding "Bengaluru" or road name.`);
        setIsTracking(false);
        return false;
      }

      const match = results[0];
      const lat = parseFloat(match.lat);
      const lon = parseFloat(match.lon);
      const addr = match.address || {};

      const road = addr.road || addr.street;
      const sub = addr.suburb || addr.neighbourhood || addr.residential;
      const localityName = road ? (sub ? `${road}, ${sub}` : road) : (match.name || query);
      const city = addr.city || addr.town || addr.city_district || addr.state_district || 'Bengaluru';
      const state = addr.state || 'Karnataka';

      const newLoc: TrackedLocation = {
        latitude: lat,
        longitude: lon,
        localityName,
        subArea: sub || city,
        city,
        state,
        pincode: addr.postcode || '',
        isRealDeviceLocation: true,
        locationSource: 'search',
        detectedAt: new Date().toISOString(),
      };

      const dynamicZone = createZoneFromTrackedLocation(newLoc);
      mockDb.saveLocation(dynamicZone);

      setCurrentLocation(newLoc);
      setSelectedZone(dynamicZone);
      localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
      setIsTracking(false);

      await updateTelemetry(lat, lon, dynamicZone);
      return true;
    } catch (e: any) {
      setTrackingError('Location search failed. Please check network connection.');
      setIsTracking(false);
      return false;
    }
  };

  const selectCustomLocality = (loc: LocationZone) => {
    setSelectedZone(loc);
    const newLoc: TrackedLocation = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      localityName: loc.name,
      subArea: `${loc.city} Ward`,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      isRealDeviceLocation: false,
      locationSource: 'search',
      detectedAt: new Date().toISOString(),
    };
    setCurrentLocation(newLoc);
    localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        currentReading,
        currentRisk,
        isTracking,
        trackingError,
        permissionStatus,
        detectLocation,
        searchAndSetLocation,
        selectCustomLocality,
        selectedZone,
        isLiveWeather,
        forecastHourly,
        forecastDaily,
        lastSyncTime,
        forceTelemetryRefresh,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationTracker = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationTracker must be used within a LocationProvider');
  }
  return context;
};
