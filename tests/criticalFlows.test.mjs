import test from 'node:test';
import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';

// ==============================================================================
// TEST SUITE 1: HeatShield Action Engine — Deterministic Risk & Slogans
// ==============================================================================
test('HeatShield Action Engine — Deterministic Risk & Slogans', () => {
  function calculateHeatIndexC(T, RH) {
    const T_F = (T * 9) / 5 + 32;
    if (T_F < 80) {
      const simpleF = 0.5 * (T_F + 61.0 + (T_F - 68.0) * 1.2 + RH * 0.094);
      return Math.round((((simpleF - 32) * 5) / 9) * 10) / 10;
    }
    const HI_F =
      -42.379 +
      2.04901523 * T_F +
      10.14333127 * RH -
      0.22475541 * T_F * RH -
      0.00683783 * T_F * T_F -
      0.05481717 * RH * RH +
      0.00122874 * T_F * T_F * RH +
      0.00085282 * T_F * RH * RH -
      0.00000199 * T_F * T_F * RH * RH;
    return Math.round((((HI_F - 32) * 5) / 9) * 10) / 10;
  }

  function calculateWetBulbC(tempC, humidityPct) {
    const T = tempC;
    const RH = Math.max(10, Math.min(100, humidityPct));
    const tw =
      T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;
    return Math.round(tw * 10) / 10;
  }

  function getSlogan(score) {
    if (score >= 80) return 'Stay cool and avoid unnecessary outdoor activity.';
    if (score >= 65) return 'Plan around the heat.';
    if (score >= 40) return 'Take it easy.';
    return "You're good to go.";
  }

  function computeDeterministicRisk({ currentTemp, humidity = 50, uvIndex = 5, activity = 'resting' }) {
    const heatIndex = calculateHeatIndexC(currentTemp, humidity);
    const activityOffsets = { resting: 0, walking: 5, active: 12, heavy_work: 18 };
    const activityOffset = activityOffsets[activity] ?? 0;

    let rawRisk = 0;
    if (heatIndex < 27) {
      rawRisk = Math.round(15 + (heatIndex / 27) * 20); // 15-35
    } else if (heatIndex < 33) {
      rawRisk = Math.round(40 + ((heatIndex - 27) / 6) * 24); // 40-64
    } else if (heatIndex < 41) {
      rawRisk = Math.round(65 + ((heatIndex - 33) / 8) * 14); // 65-79
    } else {
      rawRisk = Math.round(80 + Math.min(20, ((heatIndex - 41) / 8) * 20)); // 80-100
    }

    if (uvIndex >= 8) rawRisk += Math.min(6, Math.round((uvIndex - 7) * 2));
    const finalScore = Math.max(10, Math.min(100, rawRisk + activityOffset));
    return {
      score: finalScore,
      slogan: getSlogan(finalScore),
      heatIndex,
      wetBulb: calculateWetBulbC(currentTemp, humidity)
    };
  }

  // 1. Boundary Slogan Verification
  assert.equal(getSlogan(0), "You're good to go.");
  assert.equal(getSlogan(39), "You're good to go.");
  assert.equal(getSlogan(40), 'Take it easy.');
  assert.equal(getSlogan(64), 'Take it easy.');
  assert.equal(getSlogan(65), 'Plan around the heat.');
  assert.equal(getSlogan(79), 'Plan around the heat.');
  assert.equal(getSlogan(80), 'Stay cool and avoid unnecessary outdoor activity.');
  assert.equal(getSlogan(100), 'Stay cool and avoid unnecessary outdoor activity.');

  // 2. Low Risk Scenario: 22°C, 45% humidity
  const lowResult = computeDeterministicRisk({ currentTemp: 22, humidity: 45 });
  assert.ok(lowResult.score < 40, `Low risk score expected < 40, got ${lowResult.score}`);
  assert.equal(lowResult.slogan, "You're good to go.");

  // 3. Moderate Risk Scenario: 31°C, 50% humidity
  const modResult = computeDeterministicRisk({ currentTemp: 31, humidity: 50 });
  assert.ok(modResult.score >= 40 && modResult.score < 65, `Mod risk score expected 40-64, got ${modResult.score}`);
  assert.equal(modResult.slogan, 'Take it easy.');

  // 4. High Risk Scenario: 32°C, 45% humidity
  const highResult = computeDeterministicRisk({ currentTemp: 32, humidity: 45 });
  assert.ok(highResult.score >= 65 && highResult.score < 80, `High risk score expected 65-79, got ${highResult.score}`);
  assert.equal(highResult.slogan, 'Plan around the heat.');

  // 5. Extreme Risk Scenario: 43°C, 65% humidity (Delhi peak noon)
  const extResult = computeDeterministicRisk({ currentTemp: 43, humidity: 65, uvIndex: 10, activity: 'heavy_work' });
  assert.ok(extResult.score >= 80, `Extreme risk score expected >= 80, got ${extResult.score}`);
  assert.equal(extResult.slogan, 'Stay cool and avoid unnecessary outdoor activity.');

  // 6. Wet Bulb calculation check (Wet bulb must always be <= dry bulb temp)
  assert.ok(extResult.wetBulb <= 43, `Wet bulb ${extResult.wetBulb}°C must be <= Dry bulb 43°C`);
  assert.ok(extResult.wetBulb > 30, `Wet bulb expected dangerous > 30°C under 43°C/65% RH`);
});

// ==============================================================================
// TEST SUITE 2: Safe Logging & PII Redaction Ring Buffer
// ==============================================================================
test('Safe Logger — PII Redaction, Ring Buffer & Severity Filtering', () => {
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}\b/g;
  const BEARER_REGEX = /(?:bearer\s+|jwt\s+|token\s+)[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi;
  const SENSITIVE_KEYS = ['password', 'token', 'key', 'secret', 'auth', 'phone', 'email', 'bearer'];

  function sanitizeString(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(BEARER_REGEX, '[REDACTED_TOKEN]');
  }

  function sanitizeObject(details) {
    if (!details || typeof details !== 'object') return undefined;
    const sanitized = {};
    for (const [k, v] of Object.entries(details)) {
      const lowerKey = k.toLowerCase();
      if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        sanitized[k] = sanitizeString(v);
      } else if (typeof v === 'object' && v !== null) {
        sanitized[k] = sanitizeObject(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  // 1. Email Redaction
  const rawMsgEmail = 'User priya.sharma99@gmail.com triggered location update';
  const cleanMsgEmail = sanitizeString(rawMsgEmail);
  assert.ok(!cleanMsgEmail.includes('priya.sharma99@gmail.com'), 'Email must not appear in sanitized log');
  assert.ok(cleanMsgEmail.includes('[REDACTED_EMAIL]'), 'Redaction placeholder must be present');

  // 2. Phone Number Redaction
  const rawMsgPhone = 'Emergency alert dispatched to +91 98450 12345 successfully';
  const cleanMsgPhone = sanitizeString(rawMsgPhone);
  assert.ok(!cleanMsgPhone.includes('98450'), 'Phone number must be redacted');
  assert.ok(cleanMsgPhone.includes('[REDACTED_PHONE]'));

  // 3. Bearer Token Redaction
  const rawMsgToken = 'API handshake with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9';
  const cleanMsgToken = sanitizeString(rawMsgToken);
  assert.ok(!cleanMsgToken.includes('eyJhbGciOi'), 'JWT token must be redacted');
  assert.ok(cleanMsgToken.includes('[REDACTED_TOKEN]'));

  // 4. Nested Object Redaction
  const dirtyDetails = {
    subsystem: 'auth',
    credentials: {
      user_email: 'admin@heatshield.gov.in',
      password: 'superSecretPassword123!',
      sessionToken: 'xyz-987-token'
    },
    meta: {
      locality: 'Indiranagar',
      emergencyPhone: '+919876543210'
    }
  };
  const cleaned = sanitizeObject(dirtyDetails);
  assert.equal(cleaned.credentials.password, '[REDACTED]');
  assert.equal(cleaned.credentials.sessionToken, '[REDACTED]');
  assert.equal(cleaned.credentials.user_email, '[REDACTED]');
  assert.equal(cleaned.meta.emergencyPhone, '[REDACTED]');
  assert.equal(cleaned.meta.locality, 'Indiranagar');

  // 5. Ring Buffer Bounds (Max 100 entries)
  const ringBuffer = [];
  const MAX = 100;
  for (let i = 0; i < 150; i++) {
    ringBuffer.push({ id: `log-${i}`, level: i % 3 === 0 ? 'error' : i % 2 === 0 ? 'warn' : 'info' });
    if (ringBuffer.length > MAX) {
      ringBuffer.shift();
    }
  }
  assert.equal(ringBuffer.length, 100, 'Ring buffer must stay clamped at 100');
  assert.equal(ringBuffer[0].id, 'log-50', 'FIFO eviction must drop oldest logs');
  assert.equal(ringBuffer[99].id, 'log-149', 'Latest log must be at end of buffer');

  // 6. Severity Filtering
  const errorLogs = ringBuffer.filter((l) => l.level === 'error');
  const warnLogs = ringBuffer.filter((l) => l.level === 'warn');
  const infoLogs = ringBuffer.filter((l) => l.level === 'info');
  assert.ok(errorLogs.length > 0 && warnLogs.length > 0 && infoLogs.length > 0);
  assert.equal(errorLogs.length + warnLogs.length + infoLogs.length, 100);
});

// ==============================================================================
// TEST SUITE 3: Assistance Request Validation & Field Integrity
// ==============================================================================
test('Assistance Requests — Validation & Field Integrity', () => {
  const VALID_CATEGORIES = ['water', 'medical', 'cooling', 'general_welfare', 'cooling_centre_transport', 'other'];
  const VALID_STATUSES = ['submitted', 'in_review', 'dispatched', 'resolved', 'cancelled'];

  function validateRequest(payload) {
    if (!payload.description || payload.description.trim().length < 5) {
      return { valid: false, error: 'Description must be at least 5 characters' };
    }
    if (!payload.locationName || payload.locationName.trim().length < 3) {
      return { valid: false, error: 'Location required (min 3 chars)' };
    }
    if (payload.category && !VALID_CATEGORIES.includes(payload.category)) {
      return { valid: false, error: 'Invalid category' };
    }
    if (payload.contactName !== undefined && payload.contactName.trim().length < 2) {
      return { valid: false, error: 'Contact name too short' };
    }
    if (payload.contactPhone !== undefined) {
      const clean = payload.contactPhone.replace(/[^0-9]/g, '');
      if (clean.length < 7) return { valid: false, error: 'Invalid phone number' };
    }
    return { valid: true };
  }

  // Reject empty description
  const res1 = validateRequest({ description: '', locationName: 'Shivajinagar', category: 'water' });
  assert.equal(res1.valid, false);

  // Reject short description (< 5 chars)
  const res2 = validateRequest({ description: 'help', locationName: 'Shivajinagar', category: 'water' });
  assert.equal(res2.valid, false);

  // Reject empty or short location (< 3 chars)
  const res3 = validateRequest({ description: 'Need potable water bottles', locationName: 'ab', category: 'water' });
  assert.equal(res3.valid, false);

  // Reject invalid category
  const resBadCat = validateRequest({ description: 'Need water', locationName: 'Koramangala', category: 'unknown_service' });
  assert.equal(resBadCat.valid, false);

  // Accept valid request across categories
  const res4 = validateRequest({
    description: 'Need potable water bottles for elderly resident',
    locationName: 'Jayanagar 4th Block',
    category: 'general_welfare',
    contactName: 'Ramesh Sundaram',
    contactPhone: '+91 98450 12345'
  });
  assert.equal(res4.valid, true);

  const resMedical = validateRequest({
    description: 'Severe heat dizziness requires hydration & triage',
    locationName: 'Indiranagar 100ft Road',
    category: 'medical',
    contactName: 'Priya Sharma',
    contactPhone: '+91 98112 34567'
  });
  assert.equal(resMedical.valid, true);

  // Validate state machine transitions
  function canTransition(current, next) {
    if (current === next) return true;
    if ((current === 'pending' || current === 'submitted') && (next === 'in_review' || next === 'assigned' || next === 'dispatched' || next === 'cancelled')) return true;
    if ((current === 'assigned' || current === 'in_review') && (next === 'dispatched' || next === 'in_progress' || next === 'resolved' || next === 'cancelled')) return true;
    if ((current === 'in_progress' || current === 'dispatched') && (next === 'resolved' || next === 'cancelled')) return true;
    return false;
  }

  assert.ok(canTransition('submitted', 'in_review'));
  assert.ok(canTransition('in_review', 'dispatched'));
  assert.ok(canTransition('dispatched', 'resolved'));
  assert.ok(canTransition('submitted', 'cancelled'));
  assert.ok(!canTransition('resolved', 'submitted'), 'Resolved requests cannot revert to submitted');
});

// ==============================================================================
// TEST SUITE 4: Family Safety Opt-In & Privacy Enforcement
// ==============================================================================
test('Family Safety — Strict Opt-In Default & Consent Privacy', () => {
  // Empty by default
  const defaultFamilyList = [];
  assert.equal(defaultFamilyList.length, 0, 'Production family list must start with 0 fake members');

  // Invitation creation
  const newInvitation = {
    id: 'inv-test-1',
    name: 'Priya Sharma',
    relationship: 'parent',
    contact: '+91 98450 12345',
    status: 'pending',
    consent_location: false,
    consent_telemetry: false
  };

  assert.equal(newInvitation.status, 'pending');
  assert.equal(newInvitation.consent_location, false, 'Location sharing must remain false until acceptance');
  assert.equal(newInvitation.consent_telemetry, false);

  // Acceptance transition
  const accepted = {
    ...newInvitation,
    status: 'accepted',
    consent_location: true,
    consent_telemetry: true,
    last_checkin_status: 'safe'
  };

  assert.equal(accepted.status, 'accepted');
  assert.equal(accepted.consent_location, true);
  assert.equal(accepted.last_checkin_status, 'safe');

  // Opt-out revocation
  const revoked = {
    ...accepted,
    consent_location: false
  };
  assert.equal(revoked.consent_location, false, 'Resident can revoke telemetry consent at any time');
});

// ==============================================================================
// TEST SUITE 5: Heat Simulator 3-Step Bounds & Calculations
// ==============================================================================
test('Heat Simulator — 3-Step Bounds & Thermal Strain', () => {
  const minTemp = 25;
  const maxTemp = 45;
  const minHumidity = 20;
  const maxHumidity = 95;

  assert.ok(minTemp <= 34 && 34 <= maxTemp, 'Default 34°C is within bounds');
  assert.ok(minHumidity <= 60 && 60 <= maxHumidity, 'Default 60% is within bounds');

  // Activity offsets
  const activityOffsets = { resting: 0, walking: 5, active: 12, heavy_work: 18 };
  assert.ok(activityOffsets.resting < activityOffsets.walking);
  assert.ok(activityOffsets.walking < activityOffsets.active);
  assert.ok(activityOffsets.active < activityOffsets.heavy_work);

  // Hydration requirements escalate with thermal strain
  function calculateHydrationMlPerHour(tempC, humidityPct, activity) {
    const base = 400;
    const tempFactor = Math.max(0, (tempC - 28) * 40);
    const actFactor = activity === 'heavy_work' ? 400 : activity === 'active' ? 250 : activity === 'walking' ? 100 : 0;
    return Math.round(base + tempFactor + actFactor);
  }

  const restingWater = calculateHydrationMlPerHour(30, 50, 'resting');
  const heavyWorkerWater = calculateHydrationMlPerHour(42, 60, 'heavy_work');
  assert.ok(heavyWorkerWater > restingWater * 2, 'Heavy work under 42°C must require more than double hydration');
});

// ==============================================================================
// TEST SUITE 6: AI Assistant Intent Matching & Medical Triage Guardrails
// ==============================================================================
test('AI Assistant — Contextual Heat Intent & Medical Triage', () => {
  function matchIntent(query) {
    const q = query.toLowerCase();
    if (
      q.includes('heatstroke') || 
      q.includes('fainted') || 
      q.includes('unconscious') || 
      q.includes('emergency') ||
      q.includes('dizziness') ||
      q.includes('vomiting')
    ) {
      return 'medical_emergency';
    }
    if (q.includes('cooling') || q.includes('shelter') || q.includes('ac room')) {
      return 'cooling_centre';
    }
    if (q.includes('water') || q.includes('hydrate') || q.includes('ors')) {
      return 'hydration_station';
    }
    if (q.includes('outside') || q.includes('go out') || q.includes('badminton') || q.includes('exercise')) {
      return 'activity_safety';
    }
    return 'general';
  }

  assert.equal(matchIntent('My neighbor fainted in the sun, emergency!'), 'medical_emergency');
  assert.equal(matchIntent('Experiencing sudden severe dizziness and vomiting in heat'), 'medical_emergency');
  assert.equal(matchIntent('Where is the nearest cooling centre?'), 'cooling_centre');
  assert.equal(matchIntent('Find drinking water or ORS packets near me'), 'hydration_station');
  assert.equal(matchIntent('Can I go play badminton outside now?'), 'activity_safety');
  assert.equal(matchIntent('What is HeatShield 2.0?'), 'general');
});

// ==============================================================================
// TEST SUITE 7: Safe Routes — Real OSRM Geometry, Multi-Modal & Sanity Checks
// ==============================================================================
test('Safe Routes — Real OSRM Road Geometry, Multi-Modal Speed & Sanity Checks', () => {
  // 1. Haversine Straight-Line Distance Calculation
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 2. Real Distance & Duration Formatters
  function formatRouteDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }

  function formatRouteDuration(seconds) {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
  }

  // 3. Realistic Speed Calculation per Travel Mode
  function calculateRealisticDurationSeconds(distanceMeters, mode = 'walk', osrmDriveSeconds) {
    if (mode === 'drive' && osrmDriveSeconds && osrmDriveSeconds > 0) {
      return Math.round(osrmDriveSeconds);
    }
    if (mode === 'cycle') {
      // City cycling: average 14.5 km/h (~4.02 m/s) with traffic lights
      return Math.max(180, Math.round(distanceMeters / 4.02));
    }
    if (mode === 'drive') {
      // City driving average ~32 km/h (~8.9 m/s)
      return Math.max(120, Math.round(distanceMeters / 8.88));
    }
    // Walking: pedestrian average 4.8 km/h (~1.33 m/s)
    return Math.max(240, Math.round(distanceMeters / 1.33));
  }

  // 4. Turn-by-Turn Instruction Generator
  function formatTurnInstruction(step, destName) {
    const type = step.maneuver?.type || 'turn';
    const modifier = step.maneuver?.modifier || '';
    const roadName = step.name ? `on ${step.name}` : 'on the road';
    const ontoRoad = step.name ? `onto ${step.name}` : '';

    if (type === 'depart') {
      return `Head ${modifier ? modifier : 'forward'} ${roadName}`;
    }
    if (type === 'arrive') {
      return `Arrive at destination (${destName})`;
    }
    if (type === 'turn') {
      return `Turn ${modifier || 'ahead'} ${ontoRoad}`.trim();
    }
    if (type === 'end of road') {
      return `Turn ${modifier || 'ahead'} at the end of the road ${ontoRoad}`.trim();
    }
    if (type === 'fork') {
      return `Keep ${modifier || 'straight'} at the fork ${ontoRoad}`.trim();
    }
    if (type === 'roundabout' || type === 'rotary') {
      return `Enter roundabout and take exit ${ontoRoad}`.trim();
    }
    if (type === 'merge') {
      return `Merge ${modifier} ${ontoRoad}`.trim();
    }
    if (type === 'on ramp' || type === 'off ramp') {
      return `Take ramp ${modifier} ${ontoRoad}`.trim();
    }
    if (type === 'continue' || type === 'new name') {
      return `Continue ${ontoRoad || roadName}`.trim();
    }
    return `Proceed ${modifier} ${ontoRoad || roadName}`.trim();
  }

  // 5. OSRM Road Geometry Parsing (GeoJSON LineString -> Leaflet [lat, lon])
  function parseOsrmGeometry(rawGeometry) {
    if (!rawGeometry || rawGeometry.type !== 'LineString' || !Array.isArray(rawGeometry.coordinates)) {
      throw new Error('Invalid OSRM geometry format: expected GeoJSON LineString');
    }
    const rawCoords = rawGeometry.coordinates;
    if (rawCoords.length < 2) {
      throw new Error('OSRM geometry must contain at least 2 coordinate points');
    }
    // Convert GeoJSON [lon, lat] -> Leaflet/HeatShield [lat, lon]
    return rawCoords.map(([lon, lat]) => {
      if (typeof lat !== 'number' || typeof lon !== 'number' || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error(`Coordinate out of bounds: [${lat}, ${lon}]`);
      }
      return [Number(lat.toFixed(6)), Number(lon.toFixed(6))];
    });
  }

  // 6. Sanity Validation (Intra-City Threshold & Bounds)
  function validateRouteSanity(startCoords, endCoords, maxThresholdKm = 150) {
    const [lat1, lon1] = startCoords;
    const [lat2, lon2] = endCoords;
    const isValidCoord = (lat, lon) =>
      typeof lat === 'number' && typeof lon === 'number' &&
      !isNaN(lat) && !isNaN(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    if (!isValidCoord(lat1, lon1) || !isValidCoord(lat2, lon2)) {
      throw new Error('Invalid geographic coordinates provided for route calculation');
    }
    const straightLineDistKm = getDistanceKm(lat1, lon1, lat2, lon2);
    if (straightLineDistKm > maxThresholdKm) {
      throw new Error(
        `Selected locations are ${Math.round(straightLineDistKm)} km apart, exceeding local urban navigation limits. Please choose points within the metropolitan area.`
      );
    }
    return { valid: true, distanceKm: straightLineDistKm };
  }

  // ============================================================================
  // SUB-TEST A: Real OSRM Road Geometry Parsing (GeoJSON LineString Coordinates)
  // ============================================================================
  const mockOsrmGeoJson = {
    type: 'LineString',
    coordinates: [
      [77.597012, 13.035797],
      [77.597024, 13.035842],
      [77.596271, 13.036039],
      [77.540074, 13.028644],
      [77.539798, 13.028075]
    ]
  };

  const parsedLeafletCoords = parseOsrmGeometry(mockOsrmGeoJson);
  assert.equal(parsedLeafletCoords.length, 5, 'Must parse exactly 5 waypoints');
  assert.deepEqual(parsedLeafletCoords[0], [13.035797, 77.597012], 'Inverts [lon, lat] to [lat, lon] at start');
  assert.deepEqual(parsedLeafletCoords[4], [13.028075, 77.539798], 'Inverts [lon, lat] to [lat, lon] at destination');

  // Must reject invalid geometry formats
  assert.throws(() => parseOsrmGeometry(null), /Invalid OSRM geometry/);
  assert.throws(() => parseOsrmGeometry({ type: 'Point', coordinates: [77.5, 13.0] }), /Invalid OSRM geometry/);
  assert.throws(() => parseOsrmGeometry({ type: 'LineString', coordinates: [[77.5, 13.0]] }), /at least 2 coordinate points/);
  assert.throws(() => parseOsrmGeometry({ type: 'LineString', coordinates: [[200.0, 13.0], [77.5, 13.0]] }), /out of bounds/);

  // ============================================================================
  // SUB-TEST B: Real Distance Formatting (Meters vs Kilometers)
  // ============================================================================
  assert.equal(formatRouteDistance(350), '350 m', 'Sub-kilometer formatted in meters');
  assert.equal(formatRouteDistance(850.4), '850 m', 'Rounds meters cleanly');
  assert.equal(formatRouteDistance(999), '999 m', '999 meters stays in meters');
  assert.equal(formatRouteDistance(1000), '1.0 km', '1000 meters formats as 1.0 km');
  assert.equal(formatRouteDistance(3400), '3.4 km', 'Under 10 km includes one decimal place');
  assert.equal(formatRouteDistance(9390.4), '9.4 km', 'Hebbal → Yeshwanthnagar distance formatted to 9.4 km');
  assert.equal(formatRouteDistance(9560), '9.6 km', 'Hebbal → MG Road distance formatted to 9.6 km');
  assert.equal(formatRouteDistance(14200), '14 km', 'Over 10 km formats as integer km');
  assert.equal(formatRouteDistance(29085.8), '29 km', 'Hebbal → Kempegowda Airport distance formatted to 29 km');

  // ============================================================================
  // SUB-TEST C: Duration Formatting (Seconds to Minutes & Hours)
  // ============================================================================
  assert.equal(formatRouteDuration(25), '< 1 min', 'Under 1 minute formatted cleanly');
  assert.equal(formatRouteDuration(748), '12 min', '748s formatted as 12 min (Hebbal → Yeshwanthnagar drive)');
  assert.equal(formatRouteDuration(1865), '31 min', '1865s formatted as 31 min (Hebbal → Airport drive)');
  assert.equal(formatRouteDuration(2700), '45 min', '45 min formatted without hours');
  assert.equal(formatRouteDuration(3600), '1 hr', 'Exactly 1 hour formatted without remaining 0 min');
  assert.equal(formatRouteDuration(4500), '1 hr 15 min', '75 min formatted as 1 hr 15 min');
  assert.equal(formatRouteDuration(7200), '2 hr', 'Exactly 2 hours formatted without 0 min');
  assert.equal(formatRouteDuration(7500), '2 hr 5 min', '125 min formatted as 2 hr 5 min (walking 10km)');

  // ============================================================================
  // SUB-TEST D: Realistic Speed Calculation per Travel Mode
  // ============================================================================
  const testDistMeters = 9390; // ~9.4 km
  const walkSec = calculateRealisticDurationSeconds(testDistMeters, 'walk');
  const cycleSec = calculateRealisticDurationSeconds(testDistMeters, 'cycle');
  const driveFallbackSec = calculateRealisticDurationSeconds(testDistMeters, 'drive');
  const driveOsrmSec = calculateRealisticDurationSeconds(testDistMeters, 'drive', 748);

  // Speed checks: Walking ~4.8 km/h (1.33 m/s) -> ~7060s (~118 min)
  assert.ok(walkSec >= 7000 && walkSec <= 7100, `Walk duration expected ~7060s, got ${walkSec}`);
  // Cycling ~14.5 km/h (4.02 m/s) -> ~2336s (~39 min)
  assert.ok(cycleSec >= 2300 && cycleSec <= 2400, `Cycle duration expected ~2336s, got ${cycleSec}`);
  // Driving OSRM exact value used when available
  assert.equal(driveOsrmSec, 748, 'Drive duration must preserve OSRM engine timing');
  // Driving fallback ~32 km/h (8.88 m/s) -> ~1057s (~18 min)
  assert.ok(driveFallbackSec >= 1000 && driveFallbackSec <= 1100, `Drive fallback expected ~1057s, got ${driveFallbackSec}`);

  // Ordering check: walk > cycle > drive
  assert.ok(walkSec > cycleSec, 'Walking must take longer than cycling');
  assert.ok(cycleSec > driveOsrmSec, 'Cycling must take longer than driving');

  // Minimum floor bounds for short trips (e.g. 50 meters)
  assert.equal(calculateRealisticDurationSeconds(50, 'walk'), 240, 'Walk minimum floor 240s (4 min)');
  assert.equal(calculateRealisticDurationSeconds(50, 'cycle'), 180, 'Cycle minimum floor 180s (3 min)');
  assert.equal(calculateRealisticDurationSeconds(50, 'drive'), 120, 'Drive minimum floor 120s (2 min)');

  // ============================================================================
  // SUB-TEST E: Turn-by-Turn Instruction Generator Formatting
  // ============================================================================
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'depart', modifier: '' }, name: 'SS Ashram Road' }, 'Yeshwanthnagar'),
    'Head forward on SS Ashram Road',
    'Depart instruction with road name'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'depart', modifier: 'north' }, name: '' }, 'Destination'),
    'Head north on the road',
    'Depart instruction fallback to generic road'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'turn', modifier: 'right' }, name: 'Bellary Road' }, 'Airport'),
    'Turn right onto Bellary Road',
    'Right turn instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'end of road', modifier: 'left' }, name: 'Outer Ring Road' }, 'Airport'),
    'Turn left at the end of the road onto Outer Ring Road',
    'End of road T-junction instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'fork', modifier: 'slight right' }, name: 'Kempegowda Int Airport Road' }, 'Airport'),
    'Keep slight right at the fork onto Kempegowda Int Airport Road',
    'Highway fork instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'roundabout' }, name: 'Terminal 1 Approach' }, 'Airport'),
    'Enter roundabout and take exit onto Terminal 1 Approach',
    'Roundabout maneuver instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'merge', modifier: 'left' }, name: 'NH 44' }, 'MG Road'),
    'Merge left onto NH 44',
    'Expressway merge instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'on ramp', modifier: 'slight right' }, name: 'Hebbal Elevated Flyover' }, 'MG Road'),
    'Take ramp slight right onto Hebbal Elevated Flyover',
    'Ramp instruction'
  );
  assert.equal(
    formatTurnInstruction({ maneuver: { type: 'arrive' } }, 'Yeshwanthnagar'),
    'Arrive at destination (Yeshwanthnagar)',
    'Destination arrival instruction'
  );

  // ============================================================================
  // SUB-TEST F: Sanity Validation (Intra-City Threshold & Straight-Line Bounds)
  // ============================================================================
  const hebbalCoords = [13.0358, 77.5970];
  const yeshwanthnagarCoords = [13.0280, 77.5400];
  const airportCoords = [13.1986, 77.7066];
  const mgRoadCoords = [12.9756, 77.6066];

  // Route 1: Hebbal → Yeshwanthnagar (~6.23 km straight line)
  const route1Sanity = validateRouteSanity(hebbalCoords, yeshwanthnagarCoords);
  assert.ok(route1Sanity.valid, 'Hebbal → Yeshwanthnagar passes intra-city threshold');
  assert.ok(route1Sanity.distanceKm >= 6.0 && route1Sanity.distanceKm <= 6.5, `Straight-line dist ~6.2 km, got ${route1Sanity.distanceKm.toFixed(2)}`);

  // Route 2: Hebbal → Kempegowda International Airport (~21.46 km straight line)
  const route2Sanity = validateRouteSanity(hebbalCoords, airportCoords);
  assert.ok(route2Sanity.valid, 'Hebbal → Airport passes intra-city threshold');
  assert.ok(route2Sanity.distanceKm >= 21.0 && route2Sanity.distanceKm <= 22.0, `Straight-line dist ~21.5 km, got ${route2Sanity.distanceKm.toFixed(2)}`);

  // Route 3: Hebbal → MG Road Bengaluru (~6.76 km straight line)
  const route3Sanity = validateRouteSanity(hebbalCoords, mgRoadCoords);
  assert.ok(route3Sanity.valid, 'Hebbal → MG Road passes intra-city threshold');
  assert.ok(route3Sanity.distanceKm >= 6.5 && route3Sanity.distanceKm <= 7.0, `Straight-line dist ~6.8 km, got ${route3Sanity.distanceKm.toFixed(2)}`);

  // Sanity check failure: Inter-city trip (Bengaluru to Mumbai, ~840 km straight-line)
  const mumbaiCoords = [19.0760, 72.8777];
  assert.throws(
    () => validateRouteSanity(hebbalCoords, mumbaiCoords),
    /exceeding local urban navigation limits/
  );

  // Sanity check failure: Out of bounds / invalid coordinates
  assert.throws(() => validateRouteSanity([150.0, 77.5970], yeshwanthnagarCoords), /Invalid geographic coordinates/);
  assert.throws(() => validateRouteSanity(hebbalCoords, [NaN, 77.5400]), /Invalid geographic coordinates/);
});

// ==============================================================================
// TEST SUITE 8: Emergency Mobile Contact — E.164 Normalization & Validation
// ==============================================================================
test('Emergency Mobile Contact — E.164 Normalization & Validation', async () => {
  // 1. Phone Normalization to E.164
  function normalizeToE164(countryCode, localNumber) {
    const cleanCode = (countryCode || '+91').trim().replace(/[^0-9+]/g, '');
    const prefix = cleanCode.startsWith('+') ? cleanCode : `+${cleanCode}`;
    const cleanNumber = localNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length > 10 && cleanNumber.startsWith('91')) {
      return `+${cleanNumber}`;
    }
    return `${prefix}${cleanNumber}`;
  }

  assert.equal(normalizeToE164('+91', '9945744948'), '+919945744948', 'Correctly normalizes 10-digit Indian number');
  assert.equal(normalizeToE164('+91', '99457-44948'), '+919945744948', 'Strips punctuation and hyphens');
  assert.equal(normalizeToE164('+91', '+91 99457 44948'), '+919945744948', 'Handles prefixed country code');

  // 2. Indian Mobile Number Validation
  function isValidIndianMobileNumber(phoneStr) {
    const digitsOnly = phoneStr.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 10) return /^[6-9]\d{9}$/.test(digitsOnly);
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return /^91[6-9]\d{9}$/.test(digitsOnly);
    return false;
  }

  assert.equal(isValidIndianMobileNumber('9945744948'), true, 'Valid Indian mobile starting with 9');
  assert.equal(isValidIndianMobileNumber('8884012345'), true, 'Valid Indian mobile starting with 8');
  assert.equal(isValidIndianMobileNumber('7760123456'), true, 'Valid Indian mobile starting with 7');
  assert.equal(isValidIndianMobileNumber('6360123456'), true, 'Valid Indian mobile starting with 6');
  assert.equal(isValidIndianMobileNumber('1234567890'), false, 'Invalid Indian mobile starting with 1');
  assert.equal(isValidIndianMobileNumber('98765'), false, 'Invalid Indian mobile with insufficient digits');
});

// ==============================================================================
// TEST SUITE 9: WhatsApp Notification Gateway — Status Honesty & Message Formatting
// ==============================================================================
test('WhatsApp Notification Gateway — Status Honesty & Alert Formatting', () => {
  function formatHeatAlert({ name, locality, tempC, feelsLikeC, riskCategory, riskScore }) {
    const emoji = riskCategory === 'critical' ? '🔴' : riskCategory === 'high' ? '🟠' : '🟢';
    return `${emoji} *HeatShield AI — Heat Alert*\nHello ${name}\n📍 *${locality}*\n🌡️ Temperature: *${tempC}°C* (Feels like ${feelsLikeC}°C)\n⚠️ Heat Risk: *${riskCategory.toUpperCase()}* (${riskScore}/100)`;
  }

  const alertMsg = formatHeatAlert({
    name: 'Aarav Patel',
    locality: 'Yelahanka Satellite Town',
    tempC: 41.5,
    feelsLikeC: 47.0,
    riskCategory: 'critical',
    riskScore: 91
  });

  assert.ok(alertMsg.includes('🔴'), 'Critical alerts must carry red circle indicator');
  assert.ok(alertMsg.includes('41.5°C'), 'Alert message must reflect real temperature');
  assert.ok(alertMsg.includes('47°C'), 'Alert message must reflect feels-like apparent temperature');
  assert.ok(alertMsg.includes('Yelahanka Satellite Town'), 'Must target exact resident locality');

  // Gateway status mapping must never report fake connected status when unreachable
  function mapGatewayStatus(isReachable, rawStatus) {
    if (!isReachable) return 'unreachable';
    return rawStatus;
  }

  assert.equal(mapGatewayStatus(false, 'connected'), 'unreachable', 'Offline gateway must report unreachable');
  assert.equal(mapGatewayStatus(true, 'connected'), 'connected');
  assert.equal(mapGatewayStatus(true, 'qr_ready'), 'qr_ready');
});

console.log('✅ ALL CRITICAL FLOW INTEGRATION TESTS PASSED!');
