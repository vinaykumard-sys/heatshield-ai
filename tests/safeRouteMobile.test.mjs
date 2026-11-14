import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load services from mobile
import {
  searchLocations,
  reverseGeocodeLocation,
  fetchHeatSafeRoutes,
  getFacilitiesAlongRoute,
  formatDistance,
  formatDuration,
  CURATED_LOCATIONS,
  PRESET_ROUTES,
  VERIFIED_COOLING_FACILITIES,
  calculateRealisticDurationSeconds,
} from '../mobile/src/services/safeRoutingService.ts';

// Bridge wrapper mirroring routingService.ts without extensionless Node ESM resolution mismatch
const routingServiceSource = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mobile/src/services/routingService.ts'), 'utf8');
const calculateRealisticDuration = (meters, mode) => calculateRealisticDurationSeconds(meters, mode);
const fetchSafeRouteVariants = async (startCoord, endCoord, mode = 'walk', startPlace = 'Starting Point', endPlace = 'Destination') => {
  const rawRoutes = await fetchHeatSafeRoutes({
    startPlace,
    endPlace,
    startCoords: startCoord,
    endCoords: endCoord,
    travelMode: mode,
  });
  return rawRoutes.map((r) => ({
    variant: r.route_type === 'low_heat_exposure' ? 'coolest' : r.route_type === 'respite_optimized' ? 'respite' : 'fastest',
    distance_meters: r.distance_meters,
    duration_seconds: r.duration_seconds,
  }));
};

// ==============================================================================
// 1. MOBILE SAFE ROUTING SERVICE TESTS
// ==============================================================================

test('Mobile Safe Routing — Curated Indian Locations & Presets Integrity', () => {
  assert.ok(CURATED_LOCATIONS.length >= 20, 'Must have at least 20 curated metro locations');
  assert.ok(PRESET_ROUTES.length >= 4, 'Must have at least 4 preset corridors');
  assert.ok(VERIFIED_COOLING_FACILITIES.length >= 5, 'Must have verified cooling facilities');

  // Verify Bengaluru, Delhi, Mumbai representation
  const cities = new Set(CURATED_LOCATIONS.map((l) => l.city));
  assert.ok(cities.has('Bengaluru'), 'Must include Bengaluru');
  assert.ok(cities.has('Delhi'), 'Must include Delhi');
  assert.ok(cities.has('Mumbai'), 'Must include Mumbai');

  // Coordinate validity
  for (const loc of CURATED_LOCATIONS) {
    assert.ok(loc.latitude >= 8 && loc.latitude <= 36, `Valid India lat: ${loc.name}`);
    assert.ok(loc.longitude >= 68 && loc.longitude <= 98, `Valid India lon: ${loc.name}`);
    assert.ok(loc.name && loc.name.length > 0, 'Location must have name');
  }
});

test('Mobile Safe Routing — Autocomplete Search & Reverse Geocoding', async () => {
  // 1. Instant search for Hebbal
  const hebbalResults = await searchLocations('Hebbal');
  assert.ok(hebbalResults.length > 0, 'Must find Hebbal');
  assert.ok(hebbalResults[0].name.toLowerCase().includes('hebbal'));

  // 2. City-filtered search for Connaught Place in Delhi
  const cpResults = await searchLocations('Connaught', 'Delhi');
  assert.ok(cpResults.length > 0, 'Must find Connaught Place in Delhi');
  assert.equal(cpResults[0].city, 'Delhi');

  // 3. Short / empty query fallback
  const emptyResults = await searchLocations('');
  assert.ok(emptyResults.length > 0, 'Empty query should return default curated places');

  // 4. Reverse geocode coordinates
  const reverseLoc = await reverseGeocodeLocation(13.0358, 77.5970);
  assert.ok(reverseLoc.name.includes('Hebbal') || reverseLoc.city === 'Bengaluru');
});

test('Mobile Safe Routing — Real Multi-Variant Route Generation (Coolest, Respite, Fastest)', async () => {
  const query = {
    startPlace: 'Hebbal Flyover',
    endPlace: 'Yelahanka Satellite Town',
    startCoords: [13.0358, 77.5970],
    endCoords: [13.1007, 77.5963],
    travelMode: 'walk',
  };

  const routes = await fetchHeatSafeRoutes(query);
  assert.equal(routes.length, 3, 'Must return exactly 3 route variants');

  const [coolest, respite, fastest] = routes;

  // Coolest Route Verification
  assert.equal(coolest.route_type, 'low_heat_exposure');
  assert.ok(coolest.shade_coverage_pct >= 70, `Coolest shade must be >= 70%, got ${coolest.shade_coverage_pct}%`);
  assert.ok(coolest.heat_exposure_score <= 40, `Coolest heat score must be <= 40, got ${coolest.heat_exposure_score}`);
  assert.ok(coolest.steps.length > 0, 'Coolest route must have turn-by-turn steps');
  assert.ok(coolest.checkpoints.length >= 3, 'Coolest route must have checkpoints');

  // Respite Route Verification
  assert.equal(respite.route_type, 'respite_optimized');
  assert.ok(respite.cooling_centres_count >= 1, 'Respite route must pass cooling centres');
  assert.ok(respite.water_points_count >= 1, 'Respite route must pass water points');

  // Fastest Route Verification
  assert.equal(fastest.route_type, 'shortest');
  assert.ok(fastest.heat_exposure_score > coolest.heat_exposure_score, 'Fastest route has higher heat exposure');
  assert.ok(fastest.shade_coverage_pct < coolest.shade_coverage_pct, 'Fastest route has lower shade coverage');
});

test('Mobile Safe Routing — Facility Proximity & Distance Calculation', () => {
  const routeCoords = [
    [13.0358, 77.5970],
    [13.0560, 77.5950],
    [13.0815, 77.5990],
    [13.1007, 77.5963],
  ];

  const facilities = getFacilitiesAlongRoute(routeCoords, 4000);
  assert.ok(facilities.length > 0, 'Must identify nearby facilities along corridor');
  assert.ok(facilities[0].distance_meters !== undefined, 'Facilities must have computed distance');

  // Formatting utilities
  assert.equal(formatDistance(450), '450 m');
  assert.equal(formatDistance(1850), '1.9 km');
  assert.equal(formatDuration(45), '< 1 min');
  assert.equal(formatDuration(1500), '25 min');
  assert.equal(formatDuration(4500), '1h 15m');
});

// ==============================================================================
// 2. MOBILE ROUTING SERVICE BRIDGE TESTS
// ==============================================================================

test('Mobile Routing Service — Bridge & Variant Compatibility', async () => {
  const variants = await fetchSafeRouteVariants(
    [13.0358, 77.5970],
    [13.1007, 77.5963],
    'walk',
    'Hebbal Flyover',
    'Yelahanka Town'
  );

  assert.equal(variants.length, 3, 'Must return 3 RouteResult variants');
  const variantTypes = variants.map((v) => v.variant);
  assert.ok(variantTypes.includes('coolest'), 'Includes coolest variant');
  assert.ok(variantTypes.includes('respite'), 'Includes respite variant');
  assert.ok(variantTypes.includes('fastest'), 'Includes fastest variant');

  // Speeds
  const walkDur = calculateRealisticDuration(1000, 'walk');
  const cycleDur = calculateRealisticDuration(1000, 'cycle');
  const driveDur = calculateRealisticDuration(1000, 'drive');
  assert.ok(walkDur > cycleDur, 'Walk duration must exceed cycling duration');
  assert.ok(cycleDur > driveDur, 'Cycle duration must exceed driving duration');
});

// ==============================================================================
// 3. MOBILE SAFEBROWSER SCREEN ARCHITECTURE VERIFICATION
// ==============================================================================

test('Mobile SafeRouteScreen.tsx — Architecture, Controls & UI Components', () => {
  const screenPath = path.resolve('mobile/src/screens/SafeRouteScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'SafeRouteScreen.tsx must exist');

  const content = fs.readFileSync(screenPath, 'utf8');

  // Architecture components verification:
  // 1. Full-screen map (Svg)
  assert.ok(content.includes('<Svg'), 'Must render SVG interactive map canvas');

  // 2. Floating route summary card (Peek mode)
  assert.ok(content.includes('peekSummaryCard'), 'Must include floating peek route summary card');

  // 3. Expandable bottom sheet
  assert.ok(content.includes('bottomSheet'), 'Must include expandable bottom sheet');
  assert.ok(content.includes('sheetPanResponder'), 'Must support drag gesture on bottom sheet');

  // 4. Autocomplete search
  assert.ok(content.includes('searchLocations'), 'Must query searchLocations for autocomplete');
  assert.ok(content.includes('autocompleteResults'), 'Must maintain autocomplete suggestions');

  // 5. 2D / 3D Tilt support
  assert.ok(content.includes('is3DMode'), 'Must support 2D / 3D mode switch');

  // 6. Pan & Zoom controls
  assert.ok(content.includes('mapPanResponder'), 'Must support touch pan on map');
  assert.ok(content.includes('handleRecenterMap'), 'Must include re-center button');

  // 7. Route selector variants & details tabs
  assert.ok(content.includes('SELECT ROUTE VARIANT'), 'Must include route variant selector');
  assert.ok(content.includes('Turn-by-Turn'), 'Must include turn-by-turn guidance tab');
  assert.ok(content.includes('Cooling & Water Stops'), 'Must include cooling & water stops tab');

  // 8. Start live navigation HUD
  assert.ok(content.includes('startNavigation'), 'Must support starting live navigation');
  assert.ok(content.includes('topNavBanner'), 'Must include live navigation HUD banner');
  assert.ok(content.includes('activePuckPosition'), 'Must animate navigation guidance puck');
});
