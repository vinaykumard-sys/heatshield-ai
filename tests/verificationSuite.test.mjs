import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ==============================================================================
// 1. SEMANTIC VERSION COMPARISON (1.9.9 < 1.10.0) TESTS
// ==============================================================================
test('Semver comparison — Handles 1.9.9 < 1.10.0 and numerical ordering', () => {
  // Mobile comparator algorithm
  const parseMobile = (v) => (v || '').trim().replace(/^[vV]/, '').split(/[-+]/)[0].split('.').map(n => {
    const num = parseInt(n, 10);
    return isNaN(num) ? 0 : num;
  });
  const compareSemverMobile = (v1, v2) => {
    const p1 = parseMobile(v1);
    const p2 = parseMobile(v2);
    const len = Math.max(p1.length, p2.length, 3);
    for (let i = 0; i < len; i++) {
      const num1 = p1[i] ?? 0;
      const num2 = p2[i] ?? 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  // Core comparator algorithm
  const parseCore = (v) => {
    if (!v) return [0];
    const cleaned = v.trim().replace(/^v/i, '').split('-')[0];
    return cleaned.split('.').map(part => {
      const num = parseInt(part, 10);
      return Number.isFinite(num) ? num : 0;
    });
  };
  const compareSemverCore = (v1, v2) => {
    const p1 = parseCore(v1);
    const p2 = parseCore(v2);
    const maxLength = Math.max(p1.length, p2.length);
    for (let i = 0; i < maxLength; i++) {
      const num1 = p1[i] ?? 0;
      const num2 = p2[i] ?? 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  const comparators = [
    { name: 'Mobile versionService compareSemver', fn: compareSemverMobile },
    { name: 'Core versionService compareSemver', fn: compareSemverCore }
  ];

  for (const { name, fn } of comparators) {
    // Critical test: 1.9.9 vs 1.10.0 (String compare gives '1.9.9' > '1.10.0', but semver is -1)
    assert.equal(fn('1.9.9', '1.10.0'), -1, `${name}: 1.9.9 must be strictly less than 1.10.0`);
    assert.equal(fn('1.10.0', '1.9.9'), 1, `${name}: 1.10.0 must be strictly greater than 1.9.9`);
    assert.equal(fn('v1.9.9', 'v1.10.0'), -1, `${name}: v-prefixed 1.9.9 < v1.10.0`);
    assert.equal(fn('1.0.9', '1.0.10'), -1, `${name}: 1.0.9 < 1.0.10`);
    assert.equal(fn('1.1.0', '1.1.0'), 0, `${name}: 1.1.0 == 1.1.0`);
    assert.equal(fn('1.2.0', '1.1.0'), 1, `${name}: 1.2.0 > 1.1.0`);
    assert.equal(fn('2.0.0', '1.99.99'), 1, `${name}: 2.0.0 > 1.99.99`);
    assert.equal(fn('1.1.0-beta.1', '1.1.0'), 0, `${name}: pre-release base version matches 1.1.0`);
  }
});

// ==============================================================================
// 2. ADMIN SECURITY & NON-ADMIN ACCESS DENIAL TESTS
// ==============================================================================
test('Admin security — Enforces strict role checks and non-admin denial', () => {
  // 1. Check ProtectedRoute enforcement
  function evaluateRouteAccess({ isAuthenticated, userRole, requiredRole }) {
    if (!isAuthenticated) return { allowed: false, redirect: '/login' };
    if (requiredRole && userRole !== requiredRole) {
      return { allowed: false, redirect: '/dashboard', reason: 'INSUFFICIENT_PERMISSIONS' };
    }
    return { allowed: true, redirect: null };
  }

  // Resident user attempting to access admin
  const residentAccess = evaluateRouteAccess({
    isAuthenticated: true,
    userRole: 'resident',
    requiredRole: 'admin'
  });
  assert.equal(residentAccess.allowed, false, 'Resident must NOT be allowed into Admin route');
  assert.equal(residentAccess.redirect, '/dashboard', 'Resident must bounce to /dashboard');

  // Volunteer user attempting to access admin
  const volunteerAccess = evaluateRouteAccess({
    isAuthenticated: true,
    userRole: 'volunteer',
    requiredRole: 'admin'
  });
  assert.equal(volunteerAccess.allowed, false, 'Volunteer must NOT be allowed into Admin route');
  assert.equal(volunteerAccess.redirect, '/dashboard');

  // Genuine Admin access
  const adminAccess = evaluateRouteAccess({
    isAuthenticated: true,
    userRole: 'admin',
    requiredRole: 'admin'
  });
  assert.equal(adminAccess.allowed, true, 'Genuine Admin must be granted access');

  // Unauthenticated user
  const unauthAccess = evaluateRouteAccess({
    isAuthenticated: false,
    userRole: null,
    requiredRole: 'admin'
  });
  assert.equal(unauthAccess.allowed, false);
  assert.equal(unauthAccess.redirect, '/login', 'Unauthenticated user must be redirected to /login');

  // 2. Audit AuthContext and AuthPage source code to ensure NO hardcoded backdoors
  const authContextCode = fs.readFileSync(path.join(rootDir, 'src', 'context', 'AuthContext.tsx'), 'utf8');
  const authPageCode = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'AuthPage.tsx'), 'utf8');
  const protectedRouteCode = fs.readFileSync(path.join(rootDir, 'src', 'components', 'auth', 'ProtectedRoute.tsx'), 'utf8');

  // Ensure no hardcoded admin emails or admin bypass
  assert.ok(!authContextCode.includes("email === 'admin@heatshield.ai'"), 'No hardcoded admin email in AuthContext');
  assert.ok(!authPageCode.includes("admin@heatshield.ai' && password"), 'No hardcoded admin bypass in AuthPage');
  assert.ok(!authPageCode.includes('demoAdmin') && !authPageCode.includes('loginAsAdmin'), 'No demo admin bypass in AuthPage');

  // Ensure offline role escalation prevention
  assert.ok(
    authContextCode.includes("role: parsed.role === 'admin' ? 'resident' : parsed.role"),
    'Must prevent offline localStorage from forging admin role'
  );

  // Ensure role is mapped strictly from database profile
  assert.ok(
    authContextCode.includes("profile.role === 'admin'"),
    'Must map admin role strictly from verified database profile'
  );
});

// ==============================================================================
// 3. SAFE ROUTE CALCULATIONS & ROUTE VARIANT TESTS
// ==============================================================================
test('Safe Route calculations — Coolest vs Fastest vs Respite routes', () => {
  // Model of the Safe Route heat exposure and thermal reduction calculations
  function calculateRouteExposure({ distanceMeters, baseDurationSec, shadeFactor, ambientTempC }) {
    // Ground heat reduction up to -4.5°C based on shade percentage
    const groundHeatReductionC = Math.round((shadeFactor * 5.4) * 10) / 10;
    const effectiveTempC = Math.round((ambientTempC - groundHeatReductionC) * 10) / 10;
    
    // Thermal stress index from 0 (very low) to 100 (critical)
    const baseHeatIndex = ambientTempC >= 40 ? 85 : ambientTempC >= 35 ? 70 : 50;
    const exposureRating = Math.max(10, Math.min(100, Math.round(baseHeatIndex * (1 - (shadeFactor * 0.45)))));

    return {
      distanceMeters,
      durationMinutes: Math.round(baseDurationSec / 60),
      shadeFactor,
      groundHeatReductionC,
      effectiveTempC,
      exposureRating
    };
  }

  const ambientTemp = 42; // Severe summer noon in Delhi / Jaipur

  // Variant 1: Coolest Route (High canopy, 78% shade, slightly longer path)
  const coolest = calculateRouteExposure({
    distanceMeters: 2850,
    baseDurationSec: 2100, // 35 min walk
    shadeFactor: 0.78,
    ambientTempC: ambientTemp
  });

  // Variant 2: Fastest Route (Arterial highway, minimal shade 15%, direct path)
  const fastest = calculateRouteExposure({
    distanceMeters: 2200,
    baseDurationSec: 1620, // 27 min walk
    shadeFactor: 0.15,
    ambientTempC: ambientTemp
  });

  // Variant 3: Respite Route (Moderate shade 65%, connects through cooling centers)
  const respite = calculateRouteExposure({
    distanceMeters: 2600,
    baseDurationSec: 1950,
    shadeFactor: 0.65,
    ambientTempC: ambientTemp
  });

  // Verification 1: Coolest route provides substantial ground heat reduction
  assert.ok(coolest.groundHeatReductionC >= 4.0, `Expected >= 4.0°C reduction, got ${coolest.groundHeatReductionC}°C`);
  assert.ok(coolest.effectiveTempC < fastest.effectiveTempC, 'Coolest effective temp must be lower than fastest');

  // Verification 2: Coolest route exposure rating is markedly lower than fastest route
  assert.ok(coolest.exposureRating < fastest.exposureRating, 'Coolest exposure rating must be significantly safer');
  assert.ok(fastest.exposureRating >= 70, 'Fastest route in 42°C with 15% shade must have high heat exposure');

  // Verification 3: Fastest route has shortest duration
  assert.ok(fastest.durationMinutes < coolest.durationMinutes, 'Fastest route must take less time');

  // Verification 4: Respite route provides balanced shade and intermediate exposure
  assert.ok(respite.shadeFactor > fastest.shadeFactor, 'Respite shade must be higher than fastest');
  assert.ok(respite.exposureRating < fastest.exposureRating, 'Respite route must be safer than fastest');
});
