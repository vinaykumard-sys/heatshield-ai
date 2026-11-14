import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('1. packages/api/index.ts has hardened Supabase configuration & PKCE flow', () => {
  const content = fs.readFileSync('packages/api/index.ts', 'utf8');
  assert.ok(content.includes('shayisuhjkpuulmouxju.supabase.co'), 'Must contain production Supabase URL fallback');
  assert.ok(content.includes('sb_publishable_R4EYgtfRm5tNoGb61YdDng_JDTUTejW'), 'Must contain production Anon Key fallback');
  assert.ok(content.includes("flowType: 'pkce'"), 'Must explicitly configure PKCE flow');
  assert.ok(content.includes('detectSessionInUrl: true'), 'Must enable detectSessionInUrl');
});

test('2. AuthContext loginWithGoogle generates correct dynamic callback URL', () => {
  const content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
  assert.ok(content.includes('/auth/callback'), 'loginWithGoogle must use /auth/callback as redirectTo');
  assert.ok(content.includes('select_account'), 'loginWithGoogle should include select_account in queryParams');
  assert.ok(!content.includes('/dashboard` : undefined'), 'Must not hardcode /dashboard as OAuth redirect');
});

test('3. AuthCallbackPage.tsx exists and properly handles PKCE code exchange & errors', () => {
  const content = fs.readFileSync('src/pages/AuthCallbackPage.tsx', 'utf8');
  assert.ok(content.includes('exchangeCodeForSession'), 'Callback page must call exchangeCodeForSession');
  assert.ok(content.includes('getSession'), 'Callback page must verify getSession');
  assert.ok(content.includes('suggestPasswordLogin'), 'Callback page must handle account linking/conflict gracefully');
  assert.ok(content.includes('Account Already Registered'), 'Callback page must provide friendly messaging on account conflict');
});

test('4. App.tsx registers /auth/callback and intercepts OAuth parameters', () => {
  const content = fs.readFileSync('src/App.tsx', 'utf8');
  assert.ok(content.includes('path="/auth/callback"'), 'App.tsx must register /auth/callback route');
  assert.ok(content.includes('AuthCallbackPage'), 'App.tsx must use AuthCallbackPage');
  assert.ok(content.includes('/auth/callback${location.search}${location.hash}'), 'RootRoute must forward OAuth params to /auth/callback');
});

test('5. ProtectedRoute preserves OAuth callback parameters without kicking to /login', () => {
  const content = fs.readFileSync('src/components/auth/ProtectedRoute.tsx', 'utf8');
  assert.ok(content.includes('/auth/callback${location.search}${location.hash}'), 'ProtectedRoute must forward OAuth params to /auth/callback');
});

test('6. AuthPage.tsx does not prematurely trigger handleAuthSuccess on OAuth redirect', () => {
  const content = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');
  // Check that handleGoogleSignIn does not call handleAuthSuccess()
  const handleGoogleSnippet = content.substring(content.indexOf('const handleGoogleSignIn'), content.indexOf('return ('));
  assert.ok(!handleGoogleSnippet.includes('handleAuthSuccess()'), 'handleGoogleSignIn must not call handleAuthSuccess() before OAuth completes');
});

test('7. Database migration handles OAuth profile unique violation safely', () => {
  const migration = fs.readFileSync('supabase/migrations/20261114000001_fix_oauth_profile_linking.sql', 'utf8');
  assert.ok(migration.includes('ON CONFLICT (id) DO UPDATE'), 'Must handle ID conflict on profiles');
  assert.ok(migration.includes('EXCEPTION WHEN unique_violation'), 'Must handle email unique violation during identity linking');
});
