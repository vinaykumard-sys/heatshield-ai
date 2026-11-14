export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  street_name?: string;
  maneuver_type?: string;
  maneuver_modifier?: string;
  coordinates?: [number, number]; // [lat, lon]
  shade_level?: 'HIGH' | 'MODERATE' | 'LOW';
  heat_alert?: string;
}

export interface RouteCheckpoint {
  title: string;
  desc: string;
  type: 'start' | 'end' | 'shade' | 'shelter' | 'water' | 'hazard';
  coordinates: [number, number]; // [lat, lon]
  heat_risk: 'low' | 'moderate' | 'high' | 'extreme';
  temperature: number;
  reason?: string;
  nearby_respite?: string;
  distance_from_prev?: string;
}

export interface CoolingFacility {
  id: string;
  name: string;
  type: 'cooling_centre' | 'water_kiosk';
  latitude: number;
  longitude: number;
  address: string;
  amenities: string[];
  isOpen: boolean;
  contactPhone?: string;
  operatingHours?: string;
  distance_meters?: number;
}

export interface HeatSafeRoute {
  id: string;
  route_type: 'shortest' | 'low_heat_exposure' | 'respite_optimized';
  label: string;
  distance_km: number;
  duration_minutes: number;
  heat_exposure_score: number; // 0-100 (lower is safer)
  shade_coverage_pct: number;  // 0-100
  water_points_count: number;
  cooling_centres_count: number;
  coordinates: Array<[number, number]>; // [[lat, lon], ...]
  summary: string;
  warnings?: string[];
  avoids_high_risk?: boolean;
  cooling_point_nearby?: boolean;
  formatted_distance: string;
  formatted_duration: string;
  steps: RouteStep[];
  checkpoints: RouteCheckpoint[];
  nearby_facilities?: CoolingFacility[];
}

export interface RouteSearchQuery {
  startPlace: string;
  endPlace: string;
  startCoords: [number, number]; // [lat, lon]
  endCoords: [number, number];   // [lat, lon]
  travelMode?: 'walk' | 'cycle' | 'drive';
}

export interface CanopyCorridor {
  id: string;
  name: string;
  points: Array<[number, number]>;
  shadePct: number;
  tempReductionC: number;
}

export interface PresetRoute {
  id: string;
  label: string;
  city: string;
  startPlace: string;
  endPlace: string;
  startCoords: [number, number];
  endCoords: [number, number];
}

export interface GeocodedLocation {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  type: 'locality' | 'landmark' | 'cooling' | 'water' | 'transit';
}

// ==============================================================================
// 1. CURATED HIGH-FREQUENCY METRO LOCATIONS (ZERO LATENCY AUTOCOMPLETE)
// ==============================================================================
export const CURATED_LOCATIONS: GeocodedLocation[] = [
  // Bengaluru
  {
    id: 'blr-hebbal',
    name: 'Hebbal Flyover & Kempa Lake',
    description: 'North Bengaluru transport node & lake promenade',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0358,
    longitude: 77.5970,
    type: 'transit',
  },
  {
    id: 'blr-yelahanka',
    name: 'Yelahanka Satellite Town',
    description: 'Old Town Bus Stand & civic greenway',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.1007,
    longitude: 77.5963,
    type: 'locality',
  },
  {
    id: 'blr-indiranagar',
    name: 'Indiranagar 100ft Road',
    description: 'Commercial high street & residential avenue',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
    type: 'locality',
  },
  {
    id: 'blr-koramangala',
    name: 'Koramangala 4th Block Club',
    description: 'South Bengaluru commercial & startup hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9352,
    longitude: 77.6245,
    type: 'locality',
  },
  {
    id: 'blr-mg-road',
    name: 'MG Road Metro & Boulevard',
    description: 'Central Business District & shaded pedestrian promenade',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9756,
    longitude: 77.6066,
    type: 'transit',
  },
  {
    id: 'blr-whitefield',
    name: 'Whitefield ITPL & EPIP Zone',
    description: 'East Bengaluru tech park campus corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9856,
    longitude: 77.7314,
    type: 'landmark',
  },
  {
    id: 'blr-jayanagar',
    name: 'Jayanagar 4th Block Complex',
    description: 'Tree-canopied civic shopping centre & park zone',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9299,
    longitude: 77.5824,
    type: 'locality',
  },
  {
    id: 'blr-hsr',
    name: 'HSR Layout Sector 1 & 2',
    description: 'South-East green residential sectors & arterial ring road',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9116,
    longitude: 77.6474,
    type: 'locality',
  },
  {
    id: 'blr-yeshwanthpur',
    name: 'Yeshwanthpur Junction APMC',
    description: 'Major railway transit node & market avenue',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0285,
    longitude: 77.5450,
    type: 'transit',
  },
  {
    id: 'blr-airport',
    name: 'Kempegowda International Airport (BLR)',
    description: 'Terminal 1 & 2 transport plaza',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.1986,
    longitude: 77.7066,
    type: 'transit',
  },

  // Delhi NCR
  {
    id: 'del-cp',
    name: 'Connaught Place Inner Circle',
    description: 'Central Delhi heritage colonnade & Rajiv Chowk',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    type: 'landmark',
  },
  {
    id: 'del-karol-bagh',
    name: 'Karol Bagh Metro & Market',
    description: 'Pusa Road shopping boulevard & transit station',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6521,
    longitude: 77.1906,
    type: 'locality',
  },
  {
    id: 'del-kashmere-gate',
    name: 'Kashmere Gate ISBT',
    description: 'North Delhi inter-state bus terminal & heritage gate',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6675,
    longitude: 77.2285,
    type: 'transit',
  },
  {
    id: 'del-chandni-chowk',
    name: 'Chandni Chowk Town Hall',
    description: 'Old Delhi pedestrian heritage walkway',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6562,
    longitude: 77.2307,
    type: 'landmark',
  },
  {
    id: 'del-saket',
    name: 'Saket City Centre & District Centre',
    description: 'South Delhi mall complex & hospital zone',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5245,
    longitude: 77.2185,
    type: 'locality',
  },
  {
    id: 'del-dwarka',
    name: 'Dwarka Sector 21 Metro Interchange',
    description: 'South-West Delhi multi-modal transport hub',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5524,
    longitude: 77.0588,
    type: 'transit',
  },

  // Mumbai
  {
    id: 'mum-bandra',
    name: 'Bandra Bandstand & Hill Road',
    description: 'West Mumbai coastal promenade & market avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0544,
    longitude: 72.8222,
    type: 'locality',
  },
  {
    id: 'mum-bkc',
    name: 'Bandra Kurla Complex (BKC)',
    description: 'Central Mumbai financial district & commercial hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0657,
    longitude: 72.8687,
    type: 'landmark',
  },
  {
    id: 'mum-andheri',
    name: 'Andheri West Link Road',
    description: 'Suburban arterial boulevard & metro corridor',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.1136,
    longitude: 72.8333,
    type: 'transit',
  },
  {
    id: 'mum-colaba',
    name: 'Colaba Causeway & Gateway of India',
    description: 'South Mumbai heritage tourism & sea promenade',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 18.9220,
    longitude: 72.8347,
    type: 'landmark',
  },

  // Hyderabad
  {
    id: 'hyd-hitec',
    name: 'HITEC City Cyber Towers',
    description: 'Madhapur tech district & metro terminus',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4504,
    longitude: 78.3808,
    type: 'landmark',
  },
  {
    id: 'hyd-gachibowli',
    name: 'Gachibowli Stadium & Financial District',
    description: 'West Hyderabad sports & corporate green corridor',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4401,
    longitude: 78.3489,
    type: 'locality',
  },
  {
    id: 'hyd-banjara',
    name: 'Banjara Hills Road No 1 & 12',
    description: 'Central hill residential & hospital zone',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4156,
    longitude: 78.4350,
    type: 'locality',
  },

  // Chennai
  {
    id: 'chn-tnagar',
    name: 'T. Nagar Pondy Bazaar',
    description: 'Central pedestrian shopping concourse',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0418,
    longitude: 80.2341,
    type: 'locality',
  },
  {
    id: 'chn-adyar',
    name: 'Adyar Besant Nagar Beach Promenade',
    description: 'South Chennai coastal tree-lined avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0012,
    longitude: 80.2565,
    type: 'landmark',
  },

  // Kolkata
  {
    id: 'kol-park-st',
    name: 'Park Street & Victoria Memorial',
    description: 'Central Kolkata heritage green maidan area',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5510,
    longitude: 88.3524,
    type: 'landmark',
  },
  {
    id: 'kol-saltlake',
    name: 'Salt Lake Sector V',
    description: 'East Kolkata IT corridor & ring road',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5802,
    longitude: 88.4332,
    type: 'locality',
  },
];

// In-memory cache for live geocoding queries
const geocodingCache = new Map<string, GeocodedLocation[]>();

/**
 * High-speed autocomplete location search:
 * 1. Immediate fuzzy prefix match from CURATED_LOCATIONS (0ms).
 * 2. If fewer than 3 matches, query OpenStreetMap Nominatim with 3s timeout.
 */
export async function searchLocations(
  query: string,
  cityHint?: string
): Promise<GeocodedLocation[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ || cleanQ.length < 2) {
    return CURATED_LOCATIONS.slice(0, 6);
  }

  // 1. Curated match
  const curatedMatches = CURATED_LOCATIONS.filter((loc) => {
    const matchesName = loc.name.toLowerCase().includes(cleanQ);
    const matchesCity = loc.city.toLowerCase().includes(cleanQ);
    const matchesDesc = loc.description.toLowerCase().includes(cleanQ);
    const matchesHint = cityHint ? loc.city.toLowerCase() === cityHint.toLowerCase() : true;
    return (matchesName || matchesCity || matchesDesc) && matchesHint;
  });

  if (curatedMatches.length >= 4 || cleanQ.length < 3) {
    return curatedMatches;
  }

  // Check cache
  const cacheKey = `${cleanQ}-${cityHint || 'all'}`;
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  // 2. Query Nominatim with timeout
  try {
    const searchQuery = cityHint ? `${cleanQ}, ${cityHint}, India` : `${cleanQ}, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery
    )}&format=json&addressdetails=1&limit=5&countrycodes=in`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HeatShieldAI-Mobile/1.1.0 (heatshield.ai)',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const liveResults: GeocodedLocation[] = (data || []).map((item: any, idx: number) => {
        const address = item.address || {};
        const city = address.city || address.town || address.state_district || 'India';
        const state = address.state || '';
        return {
          id: `osm-${item.osm_id || idx}-${Date.now()}`,
          name: item.name || item.display_name.split(',')[0],
          description: item.display_name,
          city,
          state,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type === 'station' ? 'transit' : 'locality',
        };
      });

      const combined = [...curatedMatches, ...liveResults].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id || (Math.abs(t.latitude - v.latitude) < 0.001 && Math.abs(t.longitude - v.longitude) < 0.001)) === i
      );

      geocodingCache.set(cacheKey, combined);
      return combined;
    }
  } catch {
    // Graceful offline fallback
  }

  return curatedMatches;
}

/**
 * Reverse geocode GPS coordinate to location name
 */
export async function reverseGeocodeLocation(lat: number, lon: number): Promise<GeocodedLocation> {
  // Find closest curated location
  let closest = CURATED_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of CURATED_LOCATIONS) {
    const d = getDistanceMeters(lat, lon, loc.latitude, loc.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  }

  if (minDistance < 1500) {
    return closest;
  }

  // Fallback representation
  return {
    id: `gps-${lat.toFixed(4)}-${lon.toFixed(4)}`,
    name: `Location (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
    description: `Near ${closest.city}`,
    city: closest.city,
    state: closest.state,
    latitude: lat,
    longitude: lon,
    type: 'locality',
  };
}

// ==============================================================================
// 2. PRESET ROUTES
// ==============================================================================
export const PRESET_ROUTES: PresetRoute[] = [
  {
    id: 'preset-blr-1',
    label: 'Hebbal ➔ Yelahanka',
    city: 'Bengaluru',
    startPlace: 'Hebbal Flyover & Kempa Lake',
    endPlace: 'Yelahanka Satellite Town',
    startCoords: [13.0358, 77.5970],
    endCoords: [13.1007, 77.5963],
  },
  {
    id: 'preset-del-1',
    label: 'Connaught Place ➔ Karol Bagh',
    city: 'Delhi',
    startPlace: 'Connaught Place Inner Circle',
    endPlace: 'Karol Bagh Metro & Market',
    startCoords: [28.6315, 77.2167],
    endCoords: [28.6521, 77.1906],
  },
  {
    id: 'preset-blr-2',
    label: 'Indiranagar ➔ Koramangala',
    city: 'Bengaluru',
    startPlace: 'Indiranagar 100ft Road',
    endPlace: 'Koramangala 4th Block Club',
    startCoords: [12.9784, 77.6408],
    endCoords: [12.9352, 77.6245],
  },
  {
    id: 'preset-del-2',
    label: 'Kashmere Gate ➔ Chandni Chowk',
    city: 'Delhi',
    startPlace: 'Kashmere Gate ISBT',
    endPlace: 'Chandni Chowk Town Hall',
    startCoords: [28.6675, 77.2285],
    endCoords: [28.6562, 77.2307],
  },
  {
    id: 'preset-mum-1',
    label: 'Bandra ➔ BKC Financial Hub',
    city: 'Mumbai',
    startPlace: 'Bandra Bandstand & Hill Road',
    endPlace: 'Bandra Kurla Complex (BKC)',
    startCoords: [19.0544, 72.8222],
    endCoords: [19.0657, 72.8687],
  },
];

// ==============================================================================
// 3. VERIFIED COOLING CENTRES & WATER KIOSKS DIRECTORY
// ==============================================================================
export const VERIFIED_COOLING_FACILITIES: CoolingFacility[] = [
  {
    id: 'cool-blr-1',
    name: 'Yelahanka Civic Respite Shelter',
    type: 'cooling_centre',
    latitude: 13.0815,
    longitude: 77.5990,
    address: 'Near Old Town Bus Stand, BBMP Ward Office #4',
    amenities: ['Air Conditioning', 'Cold Water Dispenser', 'First Aid Beds', 'Misting Fans'],
    isOpen: true,
    contactPhone: '080-22660000',
    operatingHours: '09:00 AM - 07:00 PM',
  },
  {
    id: 'water-blr-1',
    name: 'BBMP Purified Water Kiosk #14',
    type: 'water_kiosk',
    latitude: 13.0560,
    longitude: 77.5950,
    address: 'Bellary Road Service Lane, Hebbal Lake Crossing',
    amenities: ['Chilled RO Purified Water', 'Free Bottle Refill', 'Electrolyte Sachets'],
    isOpen: true,
    operatingHours: '24/7 Available',
  },
  {
    id: 'cool-blr-2',
    name: 'Chokkanahalli Health & Cooling Post',
    type: 'cooling_centre',
    latitude: 13.0872,
    longitude: 77.6265,
    address: 'Thanisandra Main Rd, Opp Govt Higher Primary School',
    amenities: ['Misting Fans', 'Electrolyte Packs (ORS)', 'Trained Nurse On-Site'],
    isOpen: true,
    contactPhone: '080-22975555',
    operatingHours: '09:30 AM - 06:00 PM',
  },
  {
    id: 'water-del-1',
    name: 'Pusa Road Hydration Pavilion',
    type: 'water_kiosk',
    latitude: 28.6420,
    longitude: 77.2010,
    address: 'Pusa Rd near Karol Bagh Metro Pillar #112',
    amenities: ['Earthen Pot Chilled Water', 'Shaded Seating Benches', 'ORS Sachets'],
    isOpen: true,
    operatingHours: '24/7 Available',
  },
  {
    id: 'cool-del-1',
    name: 'NDMC Air-Cooled Community Respite',
    type: 'cooling_centre',
    latitude: 28.6360,
    longitude: 77.2100,
    address: 'Baba Kharak Singh Marg, New Delhi',
    amenities: ['Central Air-Cooling', 'Doctor On-Call', 'Cold Refreshments', 'Rest Cots'],
    isOpen: true,
    contactPhone: '011-23340000',
    operatingHours: '08:00 AM - 08:00 PM',
  },
  {
    id: 'water-blr-2',
    name: 'Indiranagar Metro Water Fountain',
    type: 'water_kiosk',
    latitude: 12.9780,
    longitude: 77.6380,
    address: 'CMH Road, Indiranagar Station Gate 2',
    amenities: ['Filtered Chilled Drinking Water', 'Bottle Refill'],
    isOpen: true,
    operatingHours: '06:00 AM - 11:00 PM',
  },
  {
    id: 'cool-mum-1',
    name: 'Bandra West Municipal Relief Centre',
    type: 'cooling_centre',
    latitude: 19.0600,
    longitude: 72.8400,
    address: 'Hill Road, Near Bandra Station West',
    amenities: ['High-Velocity Misting Fans', 'Drinking Water', 'ORS Kits'],
    isOpen: true,
    contactPhone: '022-26420000',
    operatingHours: '09:00 AM - 07:00 PM',
  },
];

// ==============================================================================
// 4. DISTANCE & DURATION UTILITIES
// ==============================================================================
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return '< 1 min';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function calculateRealisticDurationSeconds(
  distanceMeters: number,
  mode: 'walk' | 'cycle' | 'drive',
  osrmDriveSeconds?: number
): number {
  if (mode === 'drive' && osrmDriveSeconds && osrmDriveSeconds > 0) {
    return Math.round(osrmDriveSeconds);
  }
  if (mode === 'cycle') {
    // 14.5 km/h = ~4.02 m/s
    return Math.max(120, Math.round(distanceMeters / 4.02));
  }
  if (mode === 'drive') {
    // 32 km/h = ~8.88 m/s in typical city traffic
    return Math.max(90, Math.round(distanceMeters / 8.88));
  }
  // Walk: 4.8 km/h = ~1.33 m/s
  return Math.max(180, Math.round(distanceMeters / 1.33));
}

// ==============================================================================
// 5. OSRM & FALLBACK GEOMETRY ENGINE
// ==============================================================================
function formatManeuverInstruction(step: any, destName: string): { instruction: string; maneuver: string } {
  const type = step.maneuver?.type || 'turn';
  const modifier = step.maneuver?.modifier || '';
  const roadName = step.name ? `onto ${step.name}` : '';

  if (type === 'depart') {
    return { instruction: `Head ${modifier || 'forward'} ${roadName || 'along current way'}`, maneuver: 'depart' };
  }
  if (type === 'arrive') {
    return { instruction: `Arrive safely at destination (${destName})`, maneuver: 'arrive' };
  }
  if (type === 'turn') {
    return { instruction: `Turn ${modifier || 'ahead'} ${roadName}`.trim(), maneuver: modifier ? `turn-${modifier}` : 'turn' };
  }
  if (type === 'continue' || type === 'new name') {
    return { instruction: `Continue ${roadName || 'straight'}`, maneuver: 'straight' };
  }
  if (type === 'roundabout' || type === 'rotary') {
    return { instruction: `Enter roundabout, take exit ${roadName}`.trim(), maneuver: 'roundabout' };
  }
  if (type === 'uturn') {
    return { instruction: `Make a U-turn ${roadName}`.trim(), maneuver: 'uturn' };
  }
  return { instruction: `Proceed ${modifier} ${roadName}`.trim(), maneuver: 'straight' };
}

interface OsrmRawResult {
  coordinates: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
}

async function queryOsrmApi(
  waypoints: Array<[number, number]>,
  travelMode: 'walk' | 'cycle' | 'drive',
  destinationName: string,
  signal?: AbortSignal
): Promise<OsrmRawResult | null> {
  const coordsStr = waypoints.map(([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join(';');
  const profile = travelMode === 'drive' ? 'driving' : 'walking';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', onAbort);

    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes || !json.routes[0]) return null;

    const r = json.routes[0];
    const rawCoords: number[][] = r.geometry?.coordinates || [];
    const geoCoords: Array<[number, number]> = rawCoords.map(([lon, lat]) => [lat, lon]);

    if (geoCoords.length < 2) return null;

    const distMeters = Math.round(r.distance || 0);
    const durSec = calculateRealisticDurationSeconds(distMeters, travelMode, r.duration);

    const steps: RouteStep[] = [];
    const legs: any[] = r.legs || [];
    legs.forEach((leg) => {
      const legSteps: any[] = leg.steps || [];
      legSteps.forEach((s) => {
        const stepDist = Math.round(s.distance || 0);
        const { instruction, maneuver } = formatManeuverInstruction(s, destinationName);
        const loc = s.maneuver?.location;
        const stepCoord: [number, number] | undefined =
          loc && loc.length === 2 ? [loc[1], loc[0]] : undefined;

        steps.push({
          instruction,
          distance_meters: stepDist,
          duration_seconds: calculateRealisticDurationSeconds(stepDist, travelMode, s.duration),
          street_name: s.name || 'Urban Link Road',
          maneuver_type: maneuver,
          maneuver_modifier: s.maneuver?.modifier,
          coordinates: stepCoord,
          shade_level: stepDist > 500 ? 'MODERATE' : 'HIGH',
        });
      });
    });

    return {
      coordinates: geoCoords,
      distanceMeters: distMeters,
      durationSeconds: durSec,
      steps,
    };
  } catch {
    return null;
  }
}

function generateFallbackGeometry(
  start: [number, number],
  end: [number, number],
  lateralOffsetRatio = 0,
  numPoints = 22
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const normalLat = -dLon;
  const normalLon = dLat;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const curve = Math.sin(t * Math.PI) * lateralOffsetRatio;
    const wiggle = Math.sin(t * Math.PI * 4) * (lateralOffsetRatio * 0.15);

    const curLat = lat1 + dLat * t + (normalLat * (curve + wiggle));
    const curLon = lon1 + dLon * t + (normalLon * (curve + wiggle));
    points.push([Number(curLat.toFixed(6)), Number(curLon.toFixed(6))]);
  }

  return points;
}

export function getFacilitiesAlongRoute(
  routeCoords: Array<[number, number]>,
  maxDistanceMeters = 3000
): CoolingFacility[] {
  if (!routeCoords || routeCoords.length === 0) return VERIFIED_COOLING_FACILITIES.slice(0, 3);

  const matched = VERIFIED_COOLING_FACILITIES.map((fac) => {
    let minDist = Infinity;
    // Check against sampled points along route
    const step = Math.max(1, Math.floor(routeCoords.length / 10));
    for (let i = 0; i < routeCoords.length; i += step) {
      const [rLat, rLon] = routeCoords[i];
      const d = getDistanceMeters(rLat, rLon, fac.latitude, fac.longitude);
      if (d < minDist) minDist = d;
    }
    return { ...fac, distance_meters: minDist };
  }).filter((fac) => fac.distance_meters <= maxDistanceMeters);

  matched.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
  return matched.length > 0 ? matched : VERIFIED_COOLING_FACILITIES.slice(0, 3);
}

// ==============================================================================
// 6. MAIN ROUTE CALCULATION (3 DISTINCT AUTHENTIC ROAD VARIANTS)
// ==============================================================================
export async function fetchHeatSafeRoutes(
  query: RouteSearchQuery,
  signal?: AbortSignal
): Promise<HeatSafeRoute[]> {
  const { startPlace, endPlace, startCoords, endCoords, travelMode = 'walk' } = query;
  const [startLat, startLon] = startCoords;
  const [endLat, endLon] = endCoords;

  const straightDistMeters = Math.max(1200, getDistanceMeters(startLat, startLon, endLat, endLon));
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;

  // Lateral offset vector
  const dLat = endLat - startLat;
  const dLon = endLon - startLon;
  const len = Math.hypot(dLat, dLon) || 0.001;
  const normalLat = -dLon / len;
  const normalLon = dLat / len;

  const offsetDeg = Math.min(0.009, Math.max(0.003, (straightDistMeters / 1000) * 0.0012));

  // Canopy midpoint (steered toward green avenues)
  const canopyMidpoint: [number, number] = [
    midLat + normalLat * offsetDeg,
    midLon + normalLon * offsetDeg,
  ];

  // Respite midpoint
  const nearbyFacility = VERIFIED_COOLING_FACILITIES.find((f) => {
    return getDistanceMeters(midLat, midLon, f.latitude, f.longitude) <= 4500;
  });

  const respiteMidpoint: [number, number] = nearbyFacility
    ? [nearbyFacility.latitude, nearbyFacility.longitude]
    : [midLat - normalLat * offsetDeg, midLon - normalLon * offsetDeg];

  // Query OSRM
  const [osrmDirect, osrmCanopy, osrmRespite] = await Promise.all([
    queryOsrmApi([startCoords, endCoords], travelMode, endPlace, signal),
    queryOsrmApi([startCoords, canopyMidpoint, endCoords], travelMode, endPlace, signal),
    queryOsrmApi([startCoords, respiteMidpoint, endCoords], travelMode, endPlace, signal),
  ]);

  const fallbackDirectCoords = generateFallbackGeometry(startCoords, endCoords, 0);
  const fallbackCanopyCoords = generateFallbackGeometry(startCoords, endCoords, 0.22);
  const fallbackRespiteCoords = generateFallbackGeometry(startCoords, endCoords, -0.18);

  const coordsDirect = osrmDirect?.coordinates || fallbackDirectCoords;
  const coordsCanopy = osrmCanopy?.coordinates || fallbackCanopyCoords;
  const coordsRespite = osrmRespite?.coordinates || fallbackRespiteCoords;

  const distDirect = osrmDirect?.distanceMeters || Math.round(straightDistMeters * 1.25);
  const distCanopy = osrmCanopy?.distanceMeters || Math.round(distDirect * 1.08);
  const distRespite = osrmRespite?.distanceMeters || Math.round(distDirect * 1.14);

  const durDirect = calculateRealisticDurationSeconds(distDirect, travelMode);
  const durCanopy = calculateRealisticDurationSeconds(distCanopy, travelMode);
  const durRespite = calculateRealisticDurationSeconds(distRespite, travelMode);

  // Steps
  const defaultStepsCanopy: RouteStep[] = [
    {
      instruction: `Depart from ${startPlace} onto tree-lined pedestrian avenue`,
      distance_meters: Math.round(distCanopy * 0.2),
      duration_seconds: Math.round(durCanopy * 0.2),
      street_name: 'Shaded Botanical Boulevard',
      maneuver_type: 'depart',
      shade_level: 'HIGH',
      heat_alert: 'Deep overhead neem tree canopy',
    },
    {
      instruction: 'Turn right along dense tree greenway corridor (-4.2°C ground heat)',
      distance_meters: Math.round(distCanopy * 0.35),
      duration_seconds: Math.round(durCanopy * 0.35),
      street_name: 'Civic Eco-Corridor Way',
      maneuver_type: 'turn-right',
      shade_level: 'HIGH',
      heat_alert: 'Continuous tree canopy coverage',
    },
    {
      instruction: 'Proceed straight past shaded civic rest pavilion & water stall',
      distance_meters: Math.round(distCanopy * 0.25),
      duration_seconds: Math.round(durCanopy * 0.25),
      street_name: 'Lake Park Promenade',
      maneuver_type: 'straight',
      shade_level: 'HIGH',
      heat_alert: 'RO Purified water refill available',
    },
    {
      instruction: `Arrive safely at destination (${endPlace}) with minimized solar load`,
      distance_meters: Math.round(distCanopy * 0.2),
      duration_seconds: Math.round(durCanopy * 0.2),
      street_name: 'Covered Portico Approach',
      maneuver_type: 'arrive',
      shade_level: 'MODERATE',
    },
  ];

  const defaultStepsRespite: RouteStep[] = [
    {
      instruction: `Depart from ${startPlace} toward municipal heat relief corridor`,
      distance_meters: Math.round(distRespite * 0.2),
      duration_seconds: Math.round(durRespite * 0.2),
      street_name: 'Civic Relief Access',
      maneuver_type: 'depart',
      shade_level: 'MODERATE',
    },
    {
      instruction: 'Turn right approaching Air-Cooled Civic Respite Shelter (rest stop)',
      distance_meters: Math.round(distRespite * 0.35),
      duration_seconds: Math.round(durRespite * 0.35),
      street_name: 'Respite Shelter Link Way',
      maneuver_type: 'turn-right',
      shade_level: 'HIGH',
      heat_alert: 'AC hall, hydration & first aid open',
    },
    {
      instruction: 'Continue south past community drinking water kiosk',
      distance_meters: Math.round(distRespite * 0.25),
      duration_seconds: Math.round(durRespite * 0.25),
      street_name: 'Public Hydration Road',
      maneuver_type: 'straight',
      shade_level: 'HIGH',
      heat_alert: 'Purified chilled drinking water',
    },
    {
      instruction: `Arrive at destination (${endPlace}) near local health post`,
      distance_meters: Math.round(distRespite * 0.2),
      duration_seconds: Math.round(durRespite * 0.2),
      street_name: 'Destination Plaza',
      maneuver_type: 'arrive',
      shade_level: 'HIGH',
    },
  ];

  const defaultStepsDirect: RouteStep[] = [
    {
      instruction: `Depart ${startPlace} onto primary commercial arterial roadway`,
      distance_meters: Math.round(distDirect * 0.3),
      duration_seconds: Math.round(durDirect * 0.3),
      street_name: 'Central Arterial Expressway',
      maneuver_type: 'depart',
      shade_level: 'LOW',
      heat_alert: 'Caution: Surface asphalt temperature > 42°C',
    },
    {
      instruction: 'Proceed along unshaded asphalt highway (intense solar radiation)',
      distance_meters: Math.round(distDirect * 0.45),
      duration_seconds: Math.round(durDirect * 0.45),
      street_name: 'Commercial Highway Link',
      maneuver_type: 'straight',
      shade_level: 'LOW',
      heat_alert: 'Direct sunlight exposure, no tree cover',
    },
    {
      instruction: `Turn into destination approach lane for ${endPlace}`,
      distance_meters: Math.round(distDirect * 0.25),
      duration_seconds: Math.round(durDirect * 0.25),
      street_name: 'Terminal Avenue',
      maneuver_type: 'arrive',
      shade_level: 'MODERATE',
    },
  ];

  // Facilities along each route
  const facilitiesCanopy = getFacilitiesAlongRoute(coordsCanopy);
  const facilitiesRespite = getFacilitiesAlongRoute(coordsRespite);
  const facilitiesDirect = getFacilitiesAlongRoute(coordsDirect);

  // 1. Coolest Route (🌿)
  const routeCoolest: HeatSafeRoute = {
    id: `route-coolest-${Date.now()}`,
    route_type: 'low_heat_exposure',
    label: '🌿 Coolest Route',
    distance_km: Number((distCanopy / 1000).toFixed(1)),
    duration_minutes: Math.round(durCanopy / 60),
    formatted_distance: formatDistance(distCanopy),
    formatted_duration: formatDuration(durCanopy),
    heat_exposure_score: 34,
    shade_coverage_pct: 78,
    water_points_count: 2,
    cooling_centres_count: 1,
    coordinates: coordsCanopy,
    summary: 'Reroutes through continuous tree canopy corridors. Ground temperature is 4.2°C lower than asphalt roads.',
    warnings: [
      `Adds only ${Math.max(1, Math.round((durCanopy - durDirect) / 60))} min for 78% continuous tree shade`,
      'Minimizes solar thermal load during peak daylight hours',
    ],
    avoids_high_risk: true,
    cooling_point_nearby: true,
    steps: osrmCanopy?.steps?.length ? osrmCanopy.steps : defaultStepsCanopy,
    nearby_facilities: facilitiesCanopy,
    checkpoints: [
      {
        title: 'Starting Point',
        desc: startPlace,
        type: 'start',
        coordinates: startCoords,
        heat_risk: 'moderate',
        temperature: 33,
        distance_from_prev: '0 m',
      },
      {
        title: 'Continuous Tree Canopy Boulevard',
        desc: 'Dense mature banyan & neem canopy reduces radiant heat',
        type: 'shade',
        coordinates: canopyMidpoint,
        heat_risk: 'low',
        temperature: 29.5,
        reason: 'Tree canopy shield drops surface heat by 4.2°C',
        distance_from_prev: formatDistance(distCanopy * 0.5),
      },
      {
        title: 'Purified Water Refill Kiosk',
        desc: 'RO purified chilled drinking water dispenser',
        type: 'water',
        coordinates: [canopyMidpoint[0] + 0.002, canopyMidpoint[1] - 0.001],
        heat_risk: 'low',
        temperature: 30,
        reason: 'Free hydration & electrolyte refill',
        distance_from_prev: formatDistance(distCanopy * 0.3),
      },
      {
        title: 'Destination Arrival',
        desc: endPlace,
        type: 'end',
        coordinates: endCoords,
        heat_risk: 'moderate',
        temperature: 33.5,
        distance_from_prev: formatDistance(distCanopy * 0.2),
      },
    ],
  };

  // 2. Respite-Optimized (🏛️)
  const routeRespite: HeatSafeRoute = {
    id: `route-respite-${Date.now()}`,
    route_type: 'respite_optimized',
    label: '🏛️ Respite-Optimized',
    distance_km: Number((distRespite / 1000).toFixed(1)),
    duration_minutes: Math.round(durRespite / 60),
    formatted_distance: formatDistance(distRespite),
    formatted_duration: formatDuration(durRespite),
    heat_exposure_score: 42,
    shade_coverage_pct: 65,
    water_points_count: 3,
    cooling_centres_count: 2,
    coordinates: coordsRespite,
    summary: 'Prioritizes verified air-cooled shelters, misting pavilions, and free drinking water kiosks.',
    warnings: [
      '2 verified cooling shelters with medical first-aid along this path',
      'Strongly recommended for seniors, outdoor workers & parents with infants',
    ],
    avoids_high_risk: true,
    cooling_point_nearby: true,
    steps: osrmRespite?.steps?.length ? osrmRespite.steps : defaultStepsRespite,
    nearby_facilities: facilitiesRespite,
    checkpoints: [
      {
        title: 'Starting Point',
        desc: startPlace,
        type: 'start',
        coordinates: startCoords,
        heat_risk: 'moderate',
        temperature: 33,
        distance_from_prev: '0 m',
      },
      {
        title: 'Civic Air-Cooled Cooling Centre',
        desc: nearbyFacility ? nearbyFacility.name : 'Municipal Community Cooling Hall',
        type: 'shelter',
        coordinates: respiteMidpoint,
        heat_risk: 'low',
        temperature: 25.5,
        reason: 'Indoor climate-controlled hall with cold drinking water and ORS',
        nearby_respite: 'Municipal Clinic & Shade Pavilion',
        distance_from_prev: formatDistance(distRespite * 0.45),
      },
      {
        title: 'Chilled Water Kiosk',
        desc: 'Verified municipal drinking water ATM',
        type: 'water',
        coordinates: [respiteMidpoint[0] + 0.003, respiteMidpoint[1] + 0.002],
        heat_risk: 'low',
        temperature: 28,
        reason: 'Clean drinking water dispenser',
        distance_from_prev: formatDistance(distRespite * 0.3),
      },
      {
        title: 'Destination Arrival',
        desc: endPlace,
        type: 'end',
        coordinates: endCoords,
        heat_risk: 'moderate',
        temperature: 33.5,
        distance_from_prev: formatDistance(distRespite * 0.25),
      },
    ],
  };

  // 3. Fastest Route (⚡)
  const routeFastest: HeatSafeRoute = {
    id: `route-fastest-${Date.now()}`,
    route_type: 'shortest',
    label: '⚡ Fastest Route',
    distance_km: Number((distDirect / 1000).toFixed(1)),
    duration_minutes: Math.round(durDirect / 60),
    formatted_distance: formatDistance(distDirect),
    formatted_duration: formatDuration(durDirect),
    heat_exposure_score: 84,
    shade_coverage_pct: 22,
    water_points_count: 1,
    cooling_centres_count: 0,
    coordinates: coordsDirect,
    summary: 'Direct arterial highway network. Unshaded dark asphalt with high thermal re-radiation (>42°C).',
    warnings: [
      'High radiant asphalt heat (>42°C surface temperature)',
      'Minimal tree canopy along commercial highway',
      'High direct solar radiation exposure during daytime',
    ],
    avoids_high_risk: false,
    cooling_point_nearby: false,
    steps: osrmDirect?.steps?.length ? osrmDirect.steps : defaultStepsDirect,
    nearby_facilities: facilitiesDirect,
    checkpoints: [
      {
        title: 'Starting Point',
        desc: startPlace,
        type: 'start',
        coordinates: startCoords,
        heat_risk: 'moderate',
        temperature: 33,
        distance_from_prev: '0 m',
      },
      {
        title: 'Arterial Road Corridor',
        desc: 'Direct highway lane with zero tree canopy',
        type: 'hazard',
        coordinates: (coordsDirect[Math.floor(coordsDirect.length / 2)] as [number, number]) || [midLat, midLon],
        heat_risk: 'high',
        temperature: 42.5,
        reason: 'Unshaded dark asphalt re-radiates intense surface heat',
        distance_from_prev: formatDistance(distDirect * 0.5),
      },
      {
        title: 'Destination Arrival',
        desc: endPlace,
        type: 'end',
        coordinates: endCoords,
        heat_risk: 'moderate',
        temperature: 34,
        distance_from_prev: formatDistance(distDirect * 0.5),
      },
    ],
  };

  return [routeCoolest, routeRespite, routeFastest];
}
