import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LocationZone, EnvironmentalReading, HeatRiskAssessment } from '../types';
import { fetchLiveWeather } from '../lib/weatherApi';
import { evaluateHeatRisk } from '../lib/riskEngine';
import { mockDb } from '../lib/mockDb';
import { searchGeographicalLocations } from '../lib/geocodingService';

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
  
  // Guard against race conditions: newer location requests supersede older asynchronous responses
  const locationRequestIdRef = useRef<number>(0);

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

  // Update telemetry whenever coordinates change, and poll every 5 minutes in real time
  useEffect(() => {
    updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone);

    const intervalTimer = setInterval(() => {
      updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalTimer);
  }, [currentLocation.latitude, currentLocation.longitude, selectedZone.id, updateTelemetry]);

  // Expose manual forced refresh
  const forceTelemetryRefresh = useCallback(async () => {
    await updateTelemetry(currentLocation.latitude, currentLocation.longitude, selectedZone, true);
  }, [currentLocation.latitude, currentLocation.longitude, selectedZone, updateTelemetry]);

  // Reverse Geocoding helper with high-reliability dual provider and zero hardcoding
  const reverseGeocode = async (lat: number, lon: number) => {
    // 1. Try BigDataCloud reverse geocode client (fast, keyless, CORS enabled)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.city || '';
        const city = data.city || data.locality || data.principalSubdivision || 'Detected City';
        const state = data.principalSubdivision || 'India';
        const pincode = data.postcode || '';

        let detailArea = locality;
        if (data.localityInfo?.administrative) {
          const ward = data.localityInfo.administrative.find((a: any) => a.adminLevel >= 7 && a.name);
          if (ward) detailArea = ward.name;
        }

        const localityName = detailArea && detailArea !== city ? `${detailArea}, ${city}` : (locality || city);

        return {
          localityName,
          subArea: detailArea || city,
          city,
          state,
          pincode
        };
      }
    } catch {
      // Proceed to OSM fallback
    }

    // 2. Try Nominatim with appropriate headers
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { 'Accept': 'application/json' }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.street;
        const sub = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict;
        const localityName = road ? (sub ? `${road}, ${sub}` : road) : (sub || data.name || 'Hyperlocal Area');
        const city = addr.city || addr.town || addr.city_district || addr.state_district || 'Detected Area';
        const state = addr.state || 'India';
        const pincode = addr.postcode || '';

        return {
          localityName,
          subArea: sub || city,
          city,
          state,
          pincode
        };
      }
    } catch {
      // Proceed to coordinate position fallback
    }

    // Clean coordinate-based fallback without fake hardcoded locality names
    return {
      localityName: `GPS Fix (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
      subArea: `Field Coordinates Location`,
      city: 'Detected Zone',
      state: 'India',
      pincode: ''
    };
  };

  // Fast IP Geolocation fallback when GPS is not yet granted or denied
  const detectLocationByIP = useCallback(async (): Promise<boolean> => {
    const reqId = ++locationRequestIdRef.current;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://ipwho.is/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (reqId !== locationRequestIdRef.current) return false;

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
            isRealDeviceLocation: false, // IP is not a genuine GPS device sensor fix
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
    const reqId = ++locationRequestIdRef.current;
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
          if (reqId !== locationRequestIdRef.current) {
            resolve();
            return;
          }

          const { latitude, longitude, accuracy } = pos.coords;
          setPermissionStatus('granted');

          // Reverse geocode coordinates to extract locality & street name
          const geo = await reverseGeocode(latitude, longitude);

          if (reqId !== locationRequestIdRef.current) {
            resolve();
            return;
          }

          const newLoc: TrackedLocation = {
            latitude,
            longitude,
            accuracyMeters: Math.round(accuracy),
            localityName: geo.localityName,
            subArea: geo.subArea || `GPS Fix (±${Math.round(accuracy)}m)`,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            isRealDeviceLocation: true, // Genuine browser GPS reading
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
          if (reqId !== locationRequestIdRef.current) {
            resolve();
            return;
          }

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
    detectLocation();
  }, [detectLocation]);

  // Forward search any road/area across India
  const searchAndSetLocation = async (query: string): Promise<boolean> => {
    if (!query.trim()) return false;
    const reqId = ++locationRequestIdRef.current;
    setIsTracking(true);
    setTrackingError(null);

    try {
      // 1. Try unified geographical search (instant curated database + Nominatim)
      const matches = await searchGeographicalLocations(query.trim());
      if (reqId !== locationRequestIdRef.current) return false;

      if (matches && matches.length > 0) {
        const match = matches[0];
        const newLoc: TrackedLocation = {
          latitude: match.latitude,
          longitude: match.longitude,
          localityName: match.shortName || match.displayName,
          subArea: match.subArea || `${match.city} Ward`,
          city: match.city,
          state: match.state,
          pincode: match.pincode || '',
          isRealDeviceLocation: false,
          locationSource: 'search',
          detectedAt: new Date().toISOString(),
        };

        const dynamicZone = createZoneFromTrackedLocation(newLoc);
        mockDb.saveLocation(dynamicZone);

        setCurrentLocation(newLoc);
        setSelectedZone(dynamicZone);
        localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
        setIsTracking(false);

        await updateTelemetry(match.latitude, match.longitude, dynamicZone, true);
        return true;
      }

      setTrackingError(`No location found for "${query}". Try searching by locality, city or PIN code.`);
      setIsTracking(false);
      return false;
    } catch (e: any) {
      if (reqId === locationRequestIdRef.current) {
        setTrackingError('Location search failed. Please check network connection.');
        setIsTracking(false);
      }
      return false;
    }
  };

  const selectCustomLocality = (loc: LocationZone) => {
    locationRequestIdRef.current++;
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
    updateTelemetry(loc.latitude, loc.longitude, loc, true);
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
