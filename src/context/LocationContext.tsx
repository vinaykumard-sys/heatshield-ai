import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  CanonicalLocation, 
  TrackedLocation, 
  LocationZone, 
  EnvironmentalReading, 
  HeatRiskAssessment,
  isValidCoordinate
} from '../types';
import { fetchLiveWeather } from '../lib/weatherApi';
import { evaluateHeatRisk } from '../lib/riskEngine';
import { mockDb } from '../lib/mockDb';
import { searchGeographicalLocations, reverseGeocodeCoordinates } from '../lib/geocodingService';

export interface LocationContextType {
  currentLocation: CanonicalLocation;
  deviceLocation: CanonicalLocation | null;
  isAnalyzingDifferentLocation: boolean;
  currentReading: EnvironmentalReading | null;
  currentRisk: HeatRiskAssessment | null;
  isTracking: boolean;
  trackingError: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported' | 'timeout';
  detectLocation: () => Promise<void>;
  searchAndSetLocation: (query: string) => Promise<boolean>;
  selectCustomLocality: (loc: LocationZone) => void;
  analyzeCoordinates: (lat: number, lon: number, customName?: string) => Promise<void>;
  returnToDeviceLocation: () => Promise<void>;
  selectedZone: LocationZone;
  isLiveWeather: boolean;
  forecastHourly: any[];
  forecastDaily: any[];
  todayHourly: any[];
  liveBanner: any | null;
  weatherResult: any | null;
  lastSyncTime: Date | null;
  forceTelemetryRefresh: () => Promise<void>;
}

// Canonical Default Baseline (Explicitly tagged as 'default' and NEVER presented as "YOU")
export const DEFAULT_CANONICAL_LOCATION: CanonicalLocation = {
  latitude: 13.0854,
  longitude: 77.6250,
  displayName: 'Bengaluru Urban Sector, Karnataka, India',
  locality: 'Chokkanahalli / Yelahanka',
  localityName: 'Chokkanahalli / Yelahanka',
  subArea: 'Yelahanka Monitoring Sector',
  city: 'Bengaluru',
  district: 'Bengaluru Urban',
  state: 'Karnataka',
  country: 'India',
  pincode: '560064',
  source: 'default',
  locationSource: 'default',
  accuracy: undefined,
  accuracyMeters: undefined,
  timestamp: new Date().toISOString(),
  detectedAt: new Date().toISOString(),
  isRealDeviceLocation: false,
};

export function createZoneFromCanonicalLocation(loc: CanonicalLocation): LocationZone {
  return {
    id: `loc-${loc.source}-${loc.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
    name: loc.localityName || loc.locality,
    city: loc.city || 'India',
    state: loc.state || 'India',
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
  // Device location: genuine hardware GPS position (null until user triggers/grants GPS)
  const [deviceLocation, setDeviceLocation] = useState<CanonicalLocation | null>(() => {
    try {
      const saved = localStorage.getItem('heatshield_device_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && isValidCoordinate(parsed.latitude, parsed.longitude) && parsed.source === 'gps') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  // Active canonical location driving map, weather, and risks
  const [currentLocation, setCurrentLocation] = useState<CanonicalLocation>(() => {
    try {
      const saved = localStorage.getItem('heatshield_tracked_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && isValidCoordinate(parsed.latitude, parsed.longitude)) {
          return {
            ...parsed,
            locality: parsed.locality || parsed.localityName,
            localityName: parsed.localityName || parsed.locality,
            source: parsed.source || parsed.locationSource || 'default',
            locationSource: parsed.locationSource || parsed.source || 'default',
            accuracy: parsed.accuracy || parsed.accuracyMeters,
            accuracyMeters: parsed.accuracyMeters || parsed.accuracy,
            timestamp: parsed.timestamp || parsed.detectedAt || new Date().toISOString(),
            detectedAt: parsed.detectedAt || parsed.timestamp || new Date().toISOString(),
          };
        }
      }
    } catch {}
    return DEFAULT_CANONICAL_LOCATION;
  });

  const [selectedZone, setSelectedZone] = useState<LocationZone>(() => {
    return createZoneFromCanonicalLocation(currentLocation);
  });

  const [currentReading, setCurrentReading] = useState<EnvironmentalReading | null>(null);
  const [currentRisk, setCurrentRisk] = useState<HeatRiskAssessment | null>(null);
  const [forecastHourly, setForecastHourly] = useState<any[]>([]);
  const [forecastDaily, setForecastDaily] = useState<any[]>([]);
  const [todayHourly, setTodayHourly] = useState<any[]>([]);
  const [liveBanner, setLiveBanner] = useState<any | null>(null);
  const [weatherResult, setWeatherResult] = useState<any | null>(null);
  const [isLiveWeather, setIsLiveWeather] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported' | 'timeout'>('prompt');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // Generation counter and abort controller to prevent asynchronous race conditions
  const locationRequestIdRef = useRef<number>(0);
  const activeAbortRef = useRef<AbortController | null>(null);

  // Check if currently viewing an analyzed/searched area distinct from actual device GPS
  const isAnalyzingDifferentLocation = Boolean(
    deviceLocation &&
    deviceLocation.isRealDeviceLocation &&
    (Math.abs(currentLocation.latitude - deviceLocation.latitude) > 0.005 ||
     Math.abs(currentLocation.longitude - deviceLocation.longitude) > 0.005)
  );

  // Unified telemetry update with generation-based cancellation
  const updateTelemetry = useCallback(
    async (
      lat: number, 
      lon: number, 
      locZone: LocationZone, 
      forceRefresh: boolean = false,
      reqId?: number,
      signal?: AbortSignal
    ) => {
      const activeReqId = reqId ?? ++locationRequestIdRef.current;
      
      if (!isValidCoordinate(lat, lon)) {
        console.warn('Aborting telemetry: coordinates are invalid', { lat, lon });
        return;
      }

      try {
        const weather = await fetchLiveWeather(lat, lon, locZone.id, forceRefresh, signal);

        // Guard against race conditions: newer location requests supersede older asynchronous responses
        if (activeReqId !== locationRequestIdRef.current) {
          return;
        }

        setCurrentReading(weather.reading);
        setIsLiveWeather(weather.isLive);
        setForecastHourly(weather.forecastHourly);
        setForecastDaily(weather.forecastDaily);
        setTodayHourly(weather.todayHourly || []);
        setLiveBanner(weather.liveBanner || null);
        setWeatherResult(weather);
        setLastSyncTime(new Date());

        const risk = evaluateHeatRisk({
          temperatureC: weather.reading.temperature_c,
          relativeHumidityPct: weather.reading.relative_humidity_pct,
          baselineVulnerabilityScore: locZone.baseline_vulnerability_score,
          urbanHeatIslandFactor: locZone.urban_heat_island_factor,
        }, locZone.id);

        if (activeReqId !== locationRequestIdRef.current) {
          return;
        }

        setCurrentRisk(risk);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn('Weather telemetry update notice:', e);
        }
      }
    },
    []
  );

  // Auto-refresh telemetry periodically (every 5 minutes)
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

  // Ultra-fast GPS Detection Flow:
  // 1. Immediately receives valid coordinates
  // 2. Immediately updates canonical state
  // 3. Immediately triggers map & marker updates
  // 4. Starts weather & reverse geocoding concurrently
  const detectLocation = useCallback(async (): Promise<void> => {
    const reqId = ++locationRequestIdRef.current;
    setIsTracking(true);
    setTrackingError(null);

    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      setTrackingError('Geolocation is not supported by your browser. Please search your locality manually.');
      setIsTracking(false);
      return;
    }

    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (reqId !== locationRequestIdRef.current) {
            resolve();
            return;
          }

          const { latitude, longitude, accuracy } = pos.coords;

          if (!isValidCoordinate(latitude, longitude)) {
            setTrackingError('Invalid GPS coordinates received from device.');
            setIsTracking(false);
            resolve();
            return;
          }

          setPermissionStatus('granted');
          setIsTracking(false); // GPS detection is complete immediately!

          const accMeters = Math.round(accuracy);
          const initialGpsLocation: CanonicalLocation = {
            latitude,
            longitude,
            displayName: `Your Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`,
            locality: `GPS Fix (±${accMeters}m)`,
            localityName: `GPS Fix (±${accMeters}m)`,
            subArea: `Device GPS Sensor (±${accMeters}m)`,
            city: 'Acquiring locality...',
            district: '',
            state: 'India',
            country: 'India',
            pincode: '',
            source: 'gps',
            locationSource: 'gps',
            accuracy: accMeters,
            accuracyMeters: accMeters,
            timestamp: new Date().toISOString(),
            detectedAt: new Date().toISOString(),
            isRealDeviceLocation: true,
          };

          // Update Canonical Location & Device Location immediately
          setDeviceLocation(initialGpsLocation);
          setCurrentLocation(initialGpsLocation);
          const dynamicZone = createZoneFromCanonicalLocation(initialGpsLocation);
          setSelectedZone(dynamicZone);
          mockDb.saveLocation(dynamicZone);
          localStorage.setItem('heatshield_tracked_location', JSON.stringify(initialGpsLocation));
          localStorage.setItem('heatshield_device_location', JSON.stringify(initialGpsLocation));

          // Step 1: Start weather immediately using exact coordinates (no geocoding lag!)
          updateTelemetry(latitude, longitude, dynamicZone, true, reqId, abortController.signal);

          // Step 2: Reverse geocode concurrently in background
          reverseGeocodeCoordinates(latitude, longitude, abortController.signal)
            .then((geo) => {
              if (reqId !== locationRequestIdRef.current) return;

              const enrichedLocation: CanonicalLocation = {
                ...initialGpsLocation,
                displayName: geo.displayName,
                locality: geo.shortName || geo.subArea || 'Your Location',
                localityName: geo.shortName || geo.subArea || 'Your Location',
                subArea: geo.subArea || `Device GPS (±${accMeters}m)`,
                city: geo.city || 'Detected City',
                district: geo.city || '',
                state: geo.state || 'India',
                pincode: geo.pincode || '',
              };

              setDeviceLocation(enrichedLocation);
              setCurrentLocation(enrichedLocation);
              const enrichedZone = createZoneFromCanonicalLocation(enrichedLocation);
              setSelectedZone(enrichedZone);
              mockDb.saveLocation(enrichedZone);
              localStorage.setItem('heatshield_tracked_location', JSON.stringify(enrichedLocation));
              localStorage.setItem('heatshield_device_location', JSON.stringify(enrichedLocation));
            })
            .catch((e) => {
              if (e?.name !== 'AbortError') {
                console.warn('Reverse geocode background resolution notice:', e);
              }
            })
            .finally(() => {
              resolve();
            });
        },
        (err) => {
          if (reqId !== locationRequestIdRef.current) {
            resolve();
            return;
          }

          setIsTracking(false);
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionStatus('denied');
            setTrackingError('Location access blocked in browser. Enable location permission in your browser address bar to detect your device, or search manually.');
          } else if (err.code === err.TIMEOUT) {
            setPermissionStatus('timeout');
            setTrackingError('GPS satellite acquisition timed out. Try clicking "Detect Device GPS" again or search your locality manually.');
          } else {
            setPermissionStatus('unsupported');
            setTrackingError('GPS fix unavailable. Search your road or locality manually.');
          }
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  }, [updateTelemetry]);

  // Search and update all dependent systems concurrently
  const searchAndSetLocation = useCallback(async (query: string): Promise<boolean> => {
    if (!query.trim()) return false;
    const reqId = ++locationRequestIdRef.current;
    setIsTracking(true);
    setTrackingError(null);

    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortRef.current = abortController;

    try {
      const matches = await searchGeographicalLocations(query.trim(), abortController.signal);
      if (reqId !== locationRequestIdRef.current) return false;

      if (matches && matches.length > 0) {
        const match = matches[0];
        if (!isValidCoordinate(match.latitude, match.longitude)) {
          setTrackingError('Search returned invalid coordinates.');
          setIsTracking(false);
          return false;
        }

        const newLoc: CanonicalLocation = {
          latitude: match.latitude,
          longitude: match.longitude,
          displayName: match.displayName,
          locality: match.shortName || match.displayName,
          localityName: match.shortName || match.displayName,
          subArea: match.subArea || `${match.city} Sector`,
          city: match.city,
          district: match.city,
          state: match.state,
          country: 'India',
          pincode: match.pincode || '',
          source: 'search',
          locationSource: 'search',
          accuracy: undefined,
          accuracyMeters: undefined,
          timestamp: new Date().toISOString(),
          detectedAt: new Date().toISOString(),
          isRealDeviceLocation: false,
        };

        const dynamicZone = createZoneFromCanonicalLocation(newLoc);
        mockDb.saveLocation(dynamicZone);

        setCurrentLocation(newLoc);
        setSelectedZone(dynamicZone);
        localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
        setIsTracking(false);

        await updateTelemetry(match.latitude, match.longitude, dynamicZone, true, reqId, abortController.signal);
        return true;
      }

      setTrackingError(`No location found for "${query}". Try searching by locality, road or PIN code.`);
      setIsTracking(false);
      return false;
    } catch (e: any) {
      if (reqId === locationRequestIdRef.current && e?.name !== 'AbortError') {
        setTrackingError('Location search failed. Please check network connectivity.');
        setIsTracking(false);
      }
      return false;
    }
  }, [updateTelemetry]);

  // Analyze specific arbitrary coordinates (e.g. clicking a point on the map)
  const analyzeCoordinates = useCallback(async (lat: number, lon: number, customName?: string): Promise<void> => {
    if (!isValidCoordinate(lat, lon)) return;
    const reqId = ++locationRequestIdRef.current;

    const initialName = customName || `Selected Area (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
    const newLoc: CanonicalLocation = {
      latitude: lat,
      longitude: lon,
      displayName: initialName,
      locality: initialName,
      localityName: initialName,
      subArea: `Analyzed Coordinate Point`,
      city: 'Analyzed Sector',
      district: '',
      state: 'India',
      country: 'India',
      pincode: '',
      source: 'search',
      locationSource: 'search',
      accuracy: undefined,
      accuracyMeters: undefined,
      timestamp: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      isRealDeviceLocation: false,
    };

    const dynamicZone = createZoneFromCanonicalLocation(newLoc);
    setCurrentLocation(newLoc);
    setSelectedZone(dynamicZone);
    localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));

    // 1. Fetch live weather for exact coordinates immediately
    updateTelemetry(lat, lon, dynamicZone, true, reqId);

    // 2. Reverse geocode in background to obtain human-readable name
    reverseGeocodeCoordinates(lat, lon)
      .then((geo) => {
        if (reqId !== locationRequestIdRef.current) return;
        const enriched: CanonicalLocation = {
          ...newLoc,
          displayName: geo.displayName || newLoc.displayName,
          locality: geo.shortName || geo.subArea || newLoc.locality,
          localityName: geo.shortName || geo.subArea || newLoc.localityName,
          subArea: geo.subArea || `${geo.shortName || newLoc.locality} (${geo.city || newLoc.city})`,
          city: geo.city || newLoc.city,
          district: geo.city || newLoc.district,
          state: geo.state || newLoc.state,
          country: 'India',
          pincode: geo.pincode,
        };

        setCurrentLocation(enriched);
        const enrichedZone = createZoneFromCanonicalLocation(enriched);
        setSelectedZone(enrichedZone);
        mockDb.saveLocation(enrichedZone);
        localStorage.setItem('heatshield_tracked_location', JSON.stringify(enriched));
      })
      .catch(() => {});
  }, [updateTelemetry]);

  // Return to Device Location (User's real GPS sensor fix)
  const returnToDeviceLocation = useCallback(async (): Promise<void> => {
    if (!deviceLocation) {
      await detectLocation();
      return;
    }

    const reqId = ++locationRequestIdRef.current;
    setCurrentLocation(deviceLocation);
    const dynamicZone = createZoneFromCanonicalLocation(deviceLocation);
    setSelectedZone(dynamicZone);
    localStorage.setItem('heatshield_tracked_location', JSON.stringify(deviceLocation));

    await updateTelemetry(deviceLocation.latitude, deviceLocation.longitude, dynamicZone, true, reqId);
  }, [deviceLocation, detectLocation, updateTelemetry]);

  // Select predefined municipal locality
  const selectCustomLocality = useCallback((loc: LocationZone) => {
    const reqId = ++locationRequestIdRef.current;
    setSelectedZone(loc);
    const newLoc: CanonicalLocation = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      displayName: `${loc.name}, ${loc.city}, ${loc.state}`,
      locality: loc.name,
      localityName: loc.name,
      subArea: `${loc.city} Municipal Sector`,
      city: loc.city,
      district: loc.city,
      state: loc.state,
      country: 'India',
      pincode: loc.pincode,
      source: 'search',
      locationSource: 'search',
      accuracy: undefined,
      accuracyMeters: undefined,
      timestamp: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      isRealDeviceLocation: false,
    };
    setCurrentLocation(newLoc);
    localStorage.setItem('heatshield_tracked_location', JSON.stringify(newLoc));
    updateTelemetry(loc.latitude, loc.longitude, loc, true, reqId);
  }, [updateTelemetry]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        deviceLocation,
        isAnalyzingDifferentLocation,
        currentReading,
        currentRisk,
        isTracking,
        trackingError,
        permissionStatus,
        detectLocation,
        searchAndSetLocation,
        selectCustomLocality,
        analyzeCoordinates,
        returnToDeviceLocation,
        selectedZone,
        isLiveWeather,
        forecastHourly,
        forecastDaily,
        todayHourly,
        liveBanner,
        weatherResult,
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
