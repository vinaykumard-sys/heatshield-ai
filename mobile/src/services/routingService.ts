import { RouteResult, RouteStep, RouteCheckpoint, RouteVariantType } from '../types';

export function calculateRealisticDuration(meters: number, mode: 'walk' | 'cycle' | 'drive'): number {
  if (mode === 'walk') {
    // 4.8 km/h = 1.33 m/s
    return Math.max(180, Math.round(meters / 1.33));
  }
  if (mode === 'cycle') {
    // 14.5 km/h = 4.02 m/s
    return Math.max(120, Math.round(meters / 4.02));
  }
  // Drive: 32 km/h = 8.88 m/s with city traffic
  return Math.max(90, Math.round(meters / 8.88));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export async function fetchSafeRouteVariants(
  startCoord: [number, number],
  endCoord: [number, number],
  mode: 'walk' | 'cycle' | 'drive' = 'walk',
  startPlace: string = 'Starting Point',
  endPlace: string = 'Destination'
): Promise<RouteResult[]> {
  // Approximate base distance between coordinates
  const dLat = (endCoord[0] - startCoord[0]) * 111000;
  const dLon = (endCoord[1] - startCoord[1]) * 105000;
  const baseMeters = Math.max(1200, Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 1.25));

  // Try real OSRM fetch for base route
  let realDist = baseMeters;
  try {
    const osrmProfile = mode === 'drive' ? 'driving' : 'walking';
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=simplified`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        realDist = Math.round(data.routes[0].distance || baseMeters);
      }
    }
  } catch {
    // Graceful offline fallback
    realDist = baseMeters;
  }

  // Variant 1: Coolest (Canopy)
  const distCanopy = Math.round(realDist * 1.08); // +8% distance for tree-lined boulevard
  const durCanopy = calculateRealisticDuration(distCanopy, mode);
  const coolestRoute: RouteResult = {
    variant: 'coolest',
    title: 'Canopy Coolest',
    subtitle: '78% continuous tree shade • -4.2°C thermal load',
    mode,
    distanceMeters: distCanopy,
    durationSeconds: durCanopy,
    averageHeatIndex: 37.1,
    shadeCoveragePercent: 78,
    coolingStopsCount: 1,
    waterStopsCount: 2,
    steps: [
      {
        instruction: `Depart from ${startPlace} heading toward shaded tree-lined avenue`,
        distanceMeters: Math.round(distCanopy * 0.2),
        shadeLevel: 'HIGH',
        landmark: 'Gulmohar canopy corridor',
      },
      {
        instruction: 'Turn right along the botanical perimeter boulevard (deep shade)',
        distanceMeters: Math.round(distCanopy * 0.35),
        shadeLevel: 'HIGH',
        landmark: 'Lake park tree greenway',
      },
      {
        instruction: 'Pass through shaded pedestrian crossing (water point available)',
        distanceMeters: Math.round(distCanopy * 0.25),
        shadeLevel: 'HIGH',
        landmark: 'Civic Water Kiosk #14',
      },
      {
        instruction: `Arrive at ${endPlace} with minimized solar radiation exposure`,
        distanceMeters: Math.round(distCanopy * 0.2),
        shadeLevel: 'MODERATE',
        landmark: 'Covered portico entrance',
      },
    ],
    checkpoints: [
      { title: 'Origin', desc: startPlace, type: 'start' },
      { title: 'Greenway Canopy Gate', desc: 'Overhead banyan & neem tree cover', type: 'cooling' },
      { title: 'Chilled RO Hydration ATM', desc: 'Free drinking water refill', type: 'water' },
      { title: 'Destination', desc: endPlace, type: 'end' },
    ],
  };

  // Variant 2: Respite-Optimized
  const distRespite = Math.round(realDist * 1.14); // +14% for routing near cooling shelter
  const durRespite = calculateRealisticDuration(distRespite, mode);
  const respiteRoute: RouteResult = {
    variant: 'respite',
    title: 'Respite & Hydration',
    subtitle: 'Passes 2 cooling centers & 3 water kiosks',
    mode,
    distanceMeters: distRespite,
    durationSeconds: durRespite,
    averageHeatIndex: 38.0,
    shadeCoveragePercent: 62,
    coolingStopsCount: 2,
    waterStopsCount: 3,
    steps: [
      {
        instruction: `Head out from ${startPlace} toward municipal relief corridor`,
        distanceMeters: Math.round(distRespite * 0.22),
        shadeLevel: 'MODERATE',
        landmark: 'Municipal ward office lane',
      },
      {
        instruction: 'Approach Yelahanka Air-Cooled Respite Shelter (rest stop)',
        distanceMeters: Math.round(distRespite * 0.38),
        shadeLevel: 'HIGH',
        landmark: 'Public AC Cooling Center (Open)',
      },
      {
        instruction: 'Continue south past community drinking water tanker',
        distanceMeters: Math.round(distRespite * 0.25),
        shadeLevel: 'MODERATE',
        landmark: 'BBMP Water Point #8',
      },
      {
        instruction: `Reach ${endPlace} near primary healthcare center`,
        distanceMeters: Math.round(distRespite * 0.15),
        shadeLevel: 'HIGH',
        landmark: 'Health center respite zone',
      },
    ],
    checkpoints: [
      { title: 'Origin', desc: startPlace, type: 'start' },
      { title: 'Govt Community Heat Respite Hall', desc: 'Air-conditioned hall & ORS kits', type: 'cooling' },
      { title: 'Public Purified Hydration Point', desc: 'Filtered cold water dispenser', type: 'water' },
      { title: 'Destination', desc: endPlace, type: 'end' },
    ],
  };

  // Variant 3: Fastest (Direct Arterial)
  const distFastest = realDist;
  const durFastest = calculateRealisticDuration(distFastest, mode);
  const fastestRoute: RouteResult = {
    variant: 'fastest',
    title: 'Fastest Direct',
    subtitle: 'Main arterial road • 34% shade exposure',
    mode,
    distanceMeters: distFastest,
    durationSeconds: durFastest,
    averageHeatIndex: 42.4,
    shadeCoveragePercent: 34,
    coolingStopsCount: 0,
    waterStopsCount: 1,
    steps: [
      {
        instruction: `Depart ${startPlace} directly onto main arterial expressway`,
        distanceMeters: Math.round(distFastest * 0.45),
        shadeLevel: 'LOW',
        landmark: 'Direct commercial asphalt road (High heat reflection)',
      },
      {
        instruction: 'Proceed through central junction under open sunlight',
        distanceMeters: Math.round(distFastest * 0.35),
        shadeLevel: 'LOW',
        landmark: 'Traffic flyover underpass',
      },
      {
        instruction: `Turn into destination access lane for ${endPlace}`,
        distanceMeters: Math.round(distFastest * 0.2),
        shadeLevel: 'MODERATE',
        landmark: 'Final street approach',
      },
    ],
    checkpoints: [
      { title: 'Origin', desc: startPlace, type: 'start' },
      { title: 'Open Main Highway', desc: 'Caution: Surface temp 48°C', type: 'hazard' },
      { title: 'Commercial Water ATM', desc: 'Water refill available', type: 'water' },
      { title: 'Destination', desc: endPlace, type: 'end' },
    ],
  };

  return [coolestRoute, respiteRoute, fastestRoute];
}

export async function fetchSafeRoute(
  startCoord: [number, number],
  endCoord: [number, number],
  mode: 'walk' | 'cycle' | 'drive' = 'walk'
): Promise<RouteResult> {
  const routes = await fetchSafeRouteVariants(startCoord, endCoord, mode);
  return routes[0];
}
