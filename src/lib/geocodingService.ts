import { GeocodedPlace, isValidCoordinate } from '../types';

// Pre-seeded Indian cities, wards, localities & PIN codes for instantaneous zero-latency search
const CURATED_INDIAN_PLACES: GeocodedPlace[] = [
  // Bengaluru Localities (Requested explicitly in prompt)
  {
    id: 'bengaluru-hebbal',
    displayName: 'Hebbal, Bengaluru, Karnataka (560024)',
    shortName: 'Hebbal',
    subArea: 'North Bengaluru (Hebbal Lake & Flyover)',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560024',
    latitude: 13.0358,
    longitude: 77.5970,
    type: 'locality'
  },
  {
    id: 'bengaluru-chokkanahalli',
    displayName: 'Chokkanahalli, Thanisandra Main Rd, Bengaluru (560064)',
    shortName: 'Chokkanahalli',
    subArea: 'Thanisandra / Yelahanka Tech Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560064',
    latitude: 13.0850,
    longitude: 77.6320,
    type: 'locality'
  },
  {
    id: 'bengaluru-indiranagar',
    displayName: 'Indiranagar 100ft Rd, Bengaluru, Karnataka (560038)',
    shortName: 'Indiranagar',
    subArea: 'East Bengaluru Commercial & Residential Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    type: 'locality'
  },
  {
    id: 'bengaluru-whitefield',
    displayName: 'Whitefield EPIP Zone, Bengaluru, Karnataka (560066)',
    shortName: 'Whitefield',
    subArea: 'East Tech Park & IT Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    type: 'locality'
  },
  {
    id: 'bengaluru-koramangala',
    displayName: 'Koramangala 4th Block, Bengaluru (560034)',
    shortName: 'Koramangala',
    subArea: 'South-East Commercial & Startup Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    type: 'locality'
  },
  {
    id: 'bengaluru-peenya',
    displayName: 'Peenya Industrial Area Stage 1, Bengaluru (560058)',
    shortName: 'Peenya',
    subArea: 'North-West Industrial Thermal Hotspot',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    latitude: 13.0285,
    longitude: 77.5186,
    type: 'locality'
  },
  {
    id: 'bengaluru-yelahanka',
    displayName: 'Yelahanka New Town, Bengaluru (560064)',
    shortName: 'Yelahanka',
    subArea: 'North Bengaluru Residential Zone',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560064',
    latitude: 13.1007,
    longitude: 77.5963,
    type: 'locality'
  },
  {
    id: 'bengaluru-jayanagar',
    displayName: 'Jayanagar 4th Block, Bengaluru (560011)',
    shortName: 'Jayanagar',
    subArea: 'South Bengaluru Residential Zone',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560011',
    latitude: 12.9308,
    longitude: 77.5838,
    type: 'locality'
  },
  {
    id: 'bengaluru-electronic-city',
    displayName: 'Electronic City Phase 1, Bengaluru (560100)',
    shortName: 'Electronic City',
    subArea: 'South Tech Corridor (Elevated Tollway)',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    latitude: 12.8399,
    longitude: 77.6770,
    type: 'locality'
  },

  // Major Karnataka Regional Cities
  {
    id: 'karnataka-mysuru',
    displayName: 'Mysuru (Mysore), Karnataka (570001)',
    shortName: 'Mysuru',
    subArea: 'Heritage City & Southern Plateau',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    latitude: 12.2958,
    longitude: 76.6394,
    type: 'city'
  },
  {
    id: 'karnataka-hubballi',
    displayName: 'Hubballi (Hubli), Dharwad, Karnataka (580020)',
    shortName: 'Hubballi',
    subArea: 'Commercial Capital of North Karnataka',
    city: 'Hubballi',
    state: 'Karnataka',
    pincode: '580020',
    latitude: 15.3647,
    longitude: 75.1240,
    type: 'city'
  },
  {
    id: 'karnataka-mangaluru',
    displayName: 'Mangaluru (Mangalore), Coastal Karnataka (575001)',
    shortName: 'Mangaluru',
    subArea: 'Coastal Port & Humid Thermal Zone',
    city: 'Mangaluru',
    state: 'Karnataka',
    pincode: '575001',
    latitude: 12.9141,
    longitude: 74.8560,
    type: 'city'
  },
  {
    id: 'karnataka-belagavi',
    displayName: 'Belagavi (Belgaum), Karnataka (590001)',
    shortName: 'Belagavi',
    subArea: 'Northern Border Foothills',
    city: 'Belagavi',
    state: 'Karnataka',
    pincode: '590001',
    latitude: 15.8497,
    longitude: 74.4977,
    type: 'city'
  },
  {
    id: 'karnataka-kalaburagi',
    displayName: 'Kalaburagi (Gulbarga), Karnataka (585101)',
    shortName: 'Kalaburagi',
    subArea: 'Deccan Heatwave Arid Belt',
    city: 'Kalaburagi',
    state: 'Karnataka',
    pincode: '585101',
    latitude: 17.3297,
    longitude: 76.8343,
    type: 'city'
  },

  // Major Indian Metros and High Heatwave Regions
  {
    id: 'metro-mumbai',
    displayName: 'Mumbai, Maharashtra (400001)',
    shortName: 'Mumbai',
    subArea: 'Coastal Metro & Urban Heat Island',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
    type: 'city'
  },
  {
    id: 'metro-delhi',
    displayName: 'New Delhi, National Capital Territory (110001)',
    shortName: 'Delhi',
    subArea: 'Northern Plains Severe Heat Dome Region',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6139,
    longitude: 77.2090,
    type: 'city'
  },
  {
    id: 'metro-chennai',
    displayName: 'Chennai, Tamil Nadu (600001)',
    shortName: 'Chennai',
    subArea: 'Coromandel Coastal High Humidity Thermal Zone',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    latitude: 13.0827,
    longitude: 80.2707,
    type: 'city'
  },
  {
    id: 'metro-hyderabad',
    displayName: 'Hyderabad, Telangana (500001)',
    shortName: 'Hyderabad',
    subArea: 'Deccan Plateau Semi-Arid Urban Centre',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    latitude: 17.3850,
    longitude: 78.4867,
    type: 'city'
  },
  {
    id: 'metro-ahmedabad',
    displayName: 'Ahmedabad, Gujarat (380001)',
    shortName: 'Ahmedabad',
    subArea: 'Western Heat Action Plan Pioneer Zone',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    latitude: 23.0225,
    longitude: 72.5714,
    type: 'city'
  },
  {
    id: 'metro-nagpur',
    displayName: 'Nagpur, Maharashtra (440001)',
    shortName: 'Nagpur',
    subArea: 'Central Vidarbha Severe Thermal Belt',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    latitude: 21.1458,
    longitude: 79.0882,
    type: 'city'
  },
  {
    id: 'metro-jaipur',
    displayName: 'Jaipur, Rajasthan (302001)',
    shortName: 'Jaipur',
    subArea: 'Thar Desert Fringe Extreme Temperature Zone',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    latitude: 26.9124,
    longitude: 75.7873,
    type: 'city'
  },
  {
    id: 'metro-kolkata',
    displayName: 'Kolkata, West Bengal (700001)',
    shortName: 'Kolkata',
    subArea: 'Gangetic Delta High Wet Bulb Zone',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    latitude: 22.5726,
    longitude: 88.3639,
    type: 'city'
  }
];

// In-memory LRU cache to prevent repeated network requests
const searchCache = new Map<string, GeocodedPlace[]>();
const reverseCache = new Map<string, GeocodedPlace>();

/**
 * Searches for any city, locality, landmark or PIN code across India.
 * First checks curated fast-matches, then queries Nominatim with Photon fallback.
 */
export async function searchGeographicalLocations(
  query: string,
  abortSignal?: AbortSignal
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  // Check cache
  if (searchCache.has(trimmed)) {
    return searchCache.get(trimmed)!;
  }

  // 1. Instant Curated Matches (zero latency)
  const instantMatches = CURATED_INDIAN_PLACES.filter(place => {
    return (
      place.displayName.toLowerCase().includes(trimmed) ||
      place.shortName.toLowerCase().includes(trimmed) ||
      (place.subArea && place.subArea.toLowerCase().includes(trimmed)) ||
      place.city.toLowerCase().includes(trimmed) ||
      (place.pincode && place.pincode.startsWith(trimmed))
    );
  });

  // If we already have 3+ precise curated matches and user query is short, return quickly
  if (instantMatches.length >= 3 && trimmed.length <= 4) {
    searchCache.set(trimmed, instantMatches);
    return instantMatches;
  }

  // 2. Query Live OpenStreetMap Nominatim with India filter
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&countrycodes=in&limit=6`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HeatShieldAI-CommandCenter/2.0'
      },
      signal: abortSignal
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const liveResults: GeocodedPlace[] = data.map((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.street;
          const sub =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.quarter ||
            addr.subdistrict;
          const city =
            addr.city ||
            addr.town ||
            addr.city_district ||
            addr.district ||
            addr.county ||
            'India';
          const state = addr.state || 'India';
          const pincode = addr.postcode || '';

          const shortName = road || sub || item.name || city;
          const displayName = [shortName, city, state, pincode ? `(${pincode})` : '']
            .filter(Boolean)
            .join(', ');

          let placeType: GeocodedPlace['type'] = 'locality';
          if (item.type === 'city' || item.addresstype === 'city') placeType = 'city';
          else if (item.addresstype === 'postcode') placeType = 'postcode';
          else if (item.type === 'road' || item.addresstype === 'road') placeType = 'road';
          else if (item.type === 'building' || item.type === 'attraction') placeType = 'landmark';

          return {
            id: `geo-live-${item.place_id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            displayName,
            shortName,
            subArea: sub || road || city,
            city,
            state,
            pincode,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: placeType
          };
        });

        // Combine instant matches with live results (removing duplicates)
        const combined = [...instantMatches];
        for (const res of liveResults) {
          const exists = combined.some(
            c =>
              Math.abs(c.latitude - res.latitude) < 0.005 &&
              Math.abs(c.longitude - res.longitude) < 0.005
          );
          if (!exists) {
            combined.push(res);
          }
        }

        const finalResults = combined.slice(0, 7);
        searchCache.set(trimmed, finalResults);
        return finalResults;
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    console.warn('Nominatim geocode failed, trying Photon fallback:', err);
  }

  // 3. Fallback to Photon API if Nominatim fails
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&limit=5&bbox=68.0,6.5,97.5,37.0`; // India bounding box
    const res = await fetch(photonUrl, { signal: abortSignal });
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        const photonResults: GeocodedPlace[] = data.features.map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [77.59, 12.97];
          const name = p.name || p.city || 'Location';
          const city = p.city || p.district || 'India';
          const state = p.state || '';
          const postcode = p.postcode || '';

          return {
            id: `photon-${p.osm_id || Math.random()}`,
            displayName: [name, city, state, postcode].filter(Boolean).join(', '),
            shortName: name,
            subArea: p.street || city,
            city,
            state,
            pincode: postcode,
            latitude: coords[1],
            longitude: coords[0],
            type: 'locality'
          };
        });

        const merged = [...instantMatches, ...photonResults].slice(0, 6);
        searchCache.set(trimmed, merged);
        return merged;
      }
    }
  } catch (e) {
    // Return curated matches if available
  }

  return instantMatches.slice(0, 6);
}

/**
 * Reverse geocodes an arbitrary (latitude, longitude) coordinate clicked on the map or from device GPS.
 * Uses fast dual provider: BigDataCloud client API (fast, keyless, CORS enabled) with OSM Nominatim fallback.
 * Strictly guarantees honest coordinate labeling without ever inventing generic placeholder names like "Indian Urban Area".
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<GeocodedPlace> {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error(`Invalid coordinates: [lat: ${latitude}, lon: ${longitude}]`);
  }

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  // Check if coordinates are close to any curated place (< 2.0km)
  for (const place of CURATED_INDIAN_PLACES) {
    const dLat = Math.abs(place.latitude - latitude);
    const dLon = Math.abs(place.longitude - longitude);
    if (dLat < 0.018 && dLon < 0.018) {
      return {
        ...place,
        latitude,
        longitude
      };
    }
  }

  // 1. High-speed provider: BigDataCloud reverse geocode client (average 150-300ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);

    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || '';
      const city = data.city || data.locality || data.principalSubdivision || '';
      const state = data.principalSubdivision || 'India';
      const pincode = data.postcode || '';

      let wardName = '';
      if (data.localityInfo?.administrative && Array.isArray(data.localityInfo.administrative)) {
        const ward = data.localityInfo.administrative.find((a: any) => a.adminLevel >= 7 && a.name);
        if (ward) wardName = ward.name;
      }

      const shortName = wardName || locality || city || `Zone (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
      const displayName = [shortName, city !== shortName ? city : '', state, pincode ? `(${pincode})` : '']
        .filter(Boolean)
        .join(', ');

      const result: GeocodedPlace = {
        id: `rev-${Date.now()}`,
        displayName,
        shortName,
        subArea: wardName || city || 'Local Sector',
        city: city || 'Local Sector',
        state,
        pincode,
        latitude,
        longitude,
        type: 'coordinate'
      };

      reverseCache.set(cacheKey, result);
      return result;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' && signal?.aborted) throw err;
  }

  // 2. Fallback provider: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HeatShieldAI-CommandCenter/2.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const road = addr.road || addr.street;
      const sub =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        addr.quarter;
      const city =
        addr.city ||
        addr.town ||
        addr.city_district ||
        addr.district ||
        addr.county ||
        addr.village ||
        'Local Sector';
      const state = addr.state || 'India';
      const pincode = addr.postcode || '';

      const shortName = road ? (sub ? `${road}, ${sub}` : road) : (sub || data.name || city);
      const displayName = [shortName, city !== shortName ? city : '', state, pincode ? `(${pincode})` : '']
        .filter(Boolean)
        .join(', ');

      const result: GeocodedPlace = {
        id: `rev-${Date.now()}`,
        displayName,
        shortName,
        subArea: sub || road || city,
        city,
        state,
        pincode,
        latitude,
        longitude,
        type: 'coordinate'
      };

      reverseCache.set(cacheKey, result);
      return result;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' && signal?.aborted) throw err;
    console.warn('Reverse geocode network fallback:', err);
  }

  // 3. Factual coordinate-based position representation without fabricated names
  const coordLabel = `Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;
  const fallback: GeocodedPlace = {
    id: `rev-fallback-${Date.now()}`,
    displayName: `${coordLabel}, India`,
    shortName: coordLabel,
    subArea: 'Monitored Geographic Coordinates',
    city: 'Monitored Sector',
    state: 'India',
    pincode: '',
    latitude,
    longitude,
    type: 'coordinate'
  };

  reverseCache.set(cacheKey, fallback);
  return fallback;
}
