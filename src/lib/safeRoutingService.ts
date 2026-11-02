import { HeatSafeRoute } from '../types';
import { mockDb } from './mockDb';

export interface RouteSearchQuery {
  startPlace: string;
  endPlace: string;
  startCoords: [number, number];
  endCoords: [number, number];
}

export function calculateHeatSafeRoutes(query: RouteSearchQuery): HeatSafeRoute[] {
  const [startLat, startLon] = query.startCoords;
  const [endLat, endLon] = query.endCoords;

  // Straight line base distance
  const dLat = endLat - startLat;
  const dLon = endLon - startLon;
  const baseKm = Math.max(0.8, Math.hypot(dLat, dLon) * 111);

  // Midpoint variants
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;

  // Route A: Shortest direct
  const routeA: HeatSafeRoute = {
    id: `route-shortest-${Date.now()}`,
    route_type: 'shortest',
    label: `Direct Arterial: ${query.startPlace} → ${query.endPlace}`,
    distance_km: Number(baseKm.toFixed(1)),
    duration_minutes: Math.round(baseKm * 13),
    heat_exposure_score: 82, // Higher heat exposure on unshaded asphalt
    shade_coverage_pct: 15,
    water_points_count: 1,
    cooling_centres_count: 0,
    coordinates: [
      [startLat, startLon],
      [midLat, midLon],
      [endLat, endLon]
    ],
    summary: 'Most direct path along vehicular arterial road. High solar irradiance and asphalt heat re-radiation (>45°C).',
    warnings: ['Heavy afternoon asphalt heat', 'Limited tree canopy']
  };

  // Route B: Lower heat exposure (Park and Tree-canopy detour)
  const routeB: HeatSafeRoute = {
    id: `route-canopy-${Date.now()}`,
    route_type: 'low_heat_exposure',
    label: `Canopy Protected Route (Tree-lined Corridor)`,
    distance_km: Number((baseKm * 1.12).toFixed(1)),
    duration_minutes: Math.round(baseKm * 1.12 * 13),
    heat_exposure_score: 41, // Significant reduction
    shade_coverage_pct: 72,
    water_points_count: 2,
    cooling_centres_count: 1,
    coordinates: [
      [startLat, startLon],
      [midLat + 0.002, midLon - 0.003],
      [midLat + 0.004, midLon + 0.002],
      [endLat, endLon]
    ],
    summary: 'Reroutes through neighborhood park walkways and tree-lined avenues. Estimated apparent temperature is 3.5°C lower.',
    warnings: ['Slightly longer distance (+12%)']
  };

  // Route C: Respite & Water Optimized
  const routeC: HeatSafeRoute = {
    id: `route-respite-${Date.now()}`,
    route_type: 'respite_optimized',
    label: `Hydration & Respite Corridor`,
    distance_km: Number((baseKm * 1.18).toFixed(1)),
    duration_minutes: Math.round(baseKm * 1.18 * 14),
    heat_exposure_score: 36,
    shade_coverage_pct: 64,
    water_points_count: 3,
    cooling_centres_count: 2,
    coordinates: [
      [startLat, startLon],
      [midLat - 0.003, midLon + 0.004],
      [midLat + 0.001, midLon + 0.005],
      [endLat, endLon]
    ],
    summary: 'Intersects 3 operational water refill stations and a verified municipal cooling shelter. Ideal for elderly walkers and couriers.',
    warnings: []
  };

  return [routeA, routeB, routeC];
}
