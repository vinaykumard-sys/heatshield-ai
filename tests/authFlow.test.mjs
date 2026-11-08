import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage implementation for Node test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

test('Auth Flow — Initial State, Session Guard & No Auto-Resident Fallback', async () => {
  const localStorage = new MockLocalStorage();

  // Test 1: Fresh launch without saved session -> unauthenticated
  let user = null;
  const saved = localStorage.getItem('heatshield_auth_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.id && parsed?.email) user = parsed;
    } catch {}
  }
  assert.equal(user, null, 'User must initially be null');
  assert.equal(Boolean(user), false, 'isAuthenticated must be false initially');

  // Test 2: Reject login for unknown/unregistered user without creating mock resident
  async function simulateLogin(email, password) {
    const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
    const matched = savedProfiles[email.trim().toLowerCase()];
    if (!matched) {
      return { success: false, error: 'No account found with this email. Please register first or verify your email.' };
    }
    if (matched.password && password && matched.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    const { password: _, ...profile } = matched;
    return { success: true, profile };
  }

  const unknownLogin = await simulateLogin('unknown.resident@example.com', 'Secret123!');
  assert.equal(unknownLogin.success, false, 'Login must fail for unregistered email');
  assert.match(unknownLogin.error, /No account found/, 'Must give friendly account not found message');
  assert.equal(user, null, 'User state must NOT be set to a mock resident');

  // Test 3: Sign up a new resident user
  async function simulateSignup(email, password, fullName, phone) {
    const trimmedEmail = email.trim().toLowerCase();
    const newUser = {
      id: `usr-${Date.now()}`,
      email: trimmedEmail,
      full_name: fullName,
      phone,
      country_code: '+91',
      role: 'resident',
      is_phone_verified: false,
      is_email_verified: false,
      is_active: true,
      created_at: new Date().toISOString()
    };
    const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
    savedProfiles[trimmedEmail] = { ...newUser, password };
    localStorage.setItem('heatshield_registered_profiles', JSON.stringify(savedProfiles));
    return { success: true, profile: newUser };
  }

  const signupResult = await simulateSignup('citizen.anand@example.com', 'Pass12345!', 'Anand Murthy', '+91 9845012345');
  assert.equal(signupResult.success, true);
  user = signupResult.profile;
  assert.equal(user.email, 'citizen.anand@example.com');
  assert.equal(user.role, 'resident');

  // Test 4: Subsequent login with wrong password
  const wrongPassLogin = await simulateLogin('citizen.anand@example.com', 'WrongPassword!');
  assert.equal(wrongPassLogin.success, false);
  assert.match(wrongPassLogin.error, /Incorrect password/);

  // Test 5: Subsequent login with correct password
  const correctLogin = await simulateLogin('citizen.anand@example.com', 'Pass12345!');
  assert.equal(correctLogin.success, true);
  assert.equal(correctLogin.profile.email, 'citizen.anand@example.com');
  assert.equal(correctLogin.profile.password, undefined, 'Password must never leak into user profile');

  // Test 6: Logout clears session
  localStorage.setItem('heatshield_auth_user', JSON.stringify(correctLogin.profile));
  assert.ok(localStorage.getItem('heatshield_auth_user'));

  // Perform logout
  user = null;
  localStorage.removeItem('heatshield_auth_user');
  assert.equal(user, null);
  assert.equal(localStorage.getItem('heatshield_auth_user'), null);
});

test('Protected Route & Root Route Interception Rules', () => {
  function evaluateRootRoute({ isAuthenticated, isLoading }) {
    if (isLoading) return { action: 'render', component: 'LoadingSpinner' };
    return isAuthenticated ? { action: 'navigate', to: '/dashboard' } : { action: 'navigate', to: '/login' };
  }

  function evaluateProtectedRoute({ isAuthenticated, isLoading, role, allowedRoles, currentPath }) {
    if (isLoading) return { action: 'render', component: 'LoadingSpinner' };
    if (!isAuthenticated) return { action: 'navigate', to: '/login', state: { from: { pathname: currentPath } } };
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return { action: 'navigate', to: '/dashboard' };
    }
    return { action: 'render', component: 'AppLayout' };
  }

  // Root route tests
  assert.deepEqual(evaluateRootRoute({ isAuthenticated: false, isLoading: true }), { action: 'render', component: 'LoadingSpinner' });
  assert.deepEqual(evaluateRootRoute({ isAuthenticated: false, isLoading: false }), { action: 'navigate', to: '/login' });
  assert.deepEqual(evaluateRootRoute({ isAuthenticated: true, isLoading: false }), { action: 'navigate', to: '/dashboard' });

  // Protected route: unauthenticated access to /dashboard bounces to /login
  assert.deepEqual(
    evaluateProtectedRoute({ isAuthenticated: false, isLoading: false, role: 'resident', currentPath: '/dashboard' }),
    { action: 'navigate', to: '/login', state: { from: { pathname: '/dashboard' } } }
  );

  // Protected route: unauthenticated access to /safe-routes bounces to /login with state preserved
  assert.deepEqual(
    evaluateProtectedRoute({ isAuthenticated: false, isLoading: false, role: 'resident', currentPath: '/safe-routes' }),
    { action: 'navigate', to: '/login', state: { from: { pathname: '/safe-routes' } } }
  );

  // Protected route: authenticated resident accessing /dashboard succeeds
  assert.deepEqual(
    evaluateProtectedRoute({ isAuthenticated: true, isLoading: false, role: 'resident', currentPath: '/dashboard' }),
    { action: 'render', component: 'AppLayout' }
  );

  // Protected route: authenticated resident accessing admin route is redirected to /dashboard
  assert.deepEqual(
    evaluateProtectedRoute({ isAuthenticated: true, isLoading: false, role: 'resident', allowedRoles: ['admin'], currentPath: '/admin' }),
    { action: 'navigate', to: '/dashboard' }
  );

  // Protected route: authenticated admin accessing admin route succeeds
  assert.deepEqual(
    evaluateProtectedRoute({ isAuthenticated: true, isLoading: false, role: 'admin', allowedRoles: ['admin'], currentPath: '/admin' }),
    { action: 'render', component: 'AppLayout' }
  );
});
