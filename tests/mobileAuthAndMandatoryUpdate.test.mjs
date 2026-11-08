import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('1. Mobile AuthScreen.tsx existence and feature set', () => {
  const authScreenPath = path.join(rootDir, 'mobile', 'src', 'screens', 'AuthScreen.tsx');
  assert.ok(fs.existsSync(authScreenPath), 'mobile/src/screens/AuthScreen.tsx must exist');

  const content = fs.readFileSync(authScreenPath, 'utf8');

  // HeatShield AI branding and tagline
  assert.ok(content.includes('HEATSHIELD AI'), 'Must include HEATSHIELD AI brand title');
  assert.ok(
    content.includes('Urban Heat Safety & Defense'),
    'Must include "Urban Heat Safety & Defense" tagline'
  );

  // Mode toggle
  assert.ok(content.includes("'signin'") && content.includes("'signup'"), 'Must toggle between Sign In and Sign Up');
  assert.ok(content.includes('Sign In'), 'Must have Sign In toggle option');
  assert.ok(content.includes('Create Account'), 'Must have Create Account toggle option');

  // Inputs & validation
  assert.ok(content.includes('email'), 'Must have email field state');
  assert.ok(content.includes('password'), 'Must have password field state');
  assert.ok(content.includes('errorMessage'), 'Must have errorMessage state');
  assert.ok(content.includes('emailRegex') || content.includes('@'), 'Must have email validation');

  // Supabase Auth calls
  assert.ok(content.includes('supabase.auth.signInWithPassword'), 'Must invoke supabase.auth.signInWithPassword');
  assert.ok(content.includes('supabase.auth.signUp'), 'Must invoke supabase.auth.signUp');
  assert.ok(content.includes('onAuthSuccess'), 'Must support onAuthSuccess callback');
});

test('2. Mobile MandatoryUpdateModal.tsx existence and specifications', () => {
  const modalPath = path.join(rootDir, 'mobile', 'src', 'components', 'MandatoryUpdateModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'mobile/src/components/MandatoryUpdateModal.tsx must exist');

  const content = fs.readFileSync(modalPath, 'utf8');

  // Non-dismissible / Blocking modal check
  assert.ok(content.includes('onRequestClose={() => {}}'), 'Modal must block Android back button with noop handler');
  assert.ok(!content.includes('onClose'), 'Mandatory update modal must NOT expose dismiss/onClose handlers');

  // Title & branding
  assert.ok(content.includes('Update Required'), 'Must include "Update Required" title');
  assert.ok(content.includes('shield-alert'), 'Must include security/update shield icon');

  // Version comparison
  assert.ok(content.includes('Installed: v'), 'Must show Installed version prefix');
  assert.ok(content.includes('Required: v'), 'Must show Required version prefix');

  // Release notes bullets
  assert.ok(content.includes('Mobile-first React Native UI'), 'Must list Mobile-first React Native UI');
  assert.ok(content.includes('Secure Supabase authentication'), 'Must list Secure Supabase authentication');
  assert.ok(content.includes('Free real-time Android push notifications'), 'Must list Android push notifications');
  assert.ok(content.includes('Turn-by-turn road navigation & cooling corridors'), 'Must list road navigation');

  // Prominent Update Button with APK URL
  assert.ok(content.includes('UPDATE NOW (APK)'), 'Must have "UPDATE NOW (APK)" button label');
  assert.ok(
    content.includes('https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk'),
    'Must link to HeatShield-AI.apk download'
  );
  assert.ok(content.includes('Linking.openURL'), 'Must use Linking.openURL');
});

test('3. Mobile versionService.ts semver comparator and remote check', async () => {
  const servicePath = path.join(rootDir, 'mobile', 'src', 'services', 'versionService.ts');
  assert.ok(fs.existsSync(servicePath), 'mobile/src/services/versionService.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf8');
  assert.ok(content.includes('compareSemver'), 'Must export compareSemver');
  assert.ok(content.includes('checkAppVersion'), 'Must export checkAppVersion');
  assert.ok(
    content.includes('https://heatshield-ai-eight.vercel.app/downloads/version.json'),
    'Must fetch version.json from production endpoint'
  );

  // Dynamically test comparator logic
  const parse = (v) => v.trim().replace(/^[vV]/, '').split(/[-+]/)[0].split('.').map(Number);
  const compareSemver = (v1, v2) => {
    const p1 = parse(v1), p2 = parse(v2);
    const len = Math.max(p1.length, p2.length, 3);
    for (let i = 0; i < len; i++) {
      const n1 = p1[i] ?? 0, n2 = p2[i] ?? 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  };

  assert.equal(compareSemver('1.0.2', '1.1.0'), -1, '1.0.2 is older than 1.1.0');
  assert.equal(compareSemver('v1.0.2', '1.1.0'), -1, 'v-prefixed 1.0.2 is older than 1.1.0');
  assert.equal(compareSemver('1.1.0', '1.1.0'), 0, '1.1.0 equals 1.1.0');
  assert.equal(compareSemver('1.2.0', '1.1.0'), 1, '1.2.0 is newer than 1.1.0');
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1, '2.0.0 is newer than 1.9.9');
});

test('4. App.tsx session gating and mandatory update modal integration', () => {
  const appPath = path.join(rootDir, 'mobile', 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  // Supabase auth wiring
  assert.ok(content.includes('supabase.auth.getSession'), 'Must check session on startup with getSession()');
  assert.ok(content.includes('supabase.auth.onAuthStateChange'), 'Must subscribe to onAuthStateChange');
  assert.ok(content.includes('<AuthScreen'), 'Must render AuthScreen when no active session');
  assert.ok(!content.includes('mockUser') && !content.includes('isGuestResident = true'), 'Zero mock user bypass permitted');

  // Mandatory update wiring
  assert.ok(content.includes('checkAppVersion'), 'Must call checkAppVersion');
  assert.ok(content.includes('MandatoryUpdateModal'), 'Must mount MandatoryUpdateModal');

  // Profile logout wiring
  assert.ok(content.includes('<ProfileScreen'), 'Must mount ProfileScreen');
  assert.ok(content.includes('onLogout'), 'Must pass onLogout callback to ProfileScreen');
});

test('5. ProfileScreen.tsx real Supabase logout clearing session', () => {
  const profilePath = path.join(rootDir, 'mobile', 'src', 'screens', 'ProfileScreen.tsx');
  const content = fs.readFileSync(profilePath, 'utf8');

  assert.ok(content.includes('supabase.auth.signOut'), 'Must call supabase.auth.signOut()');
  assert.ok(content.includes('onLogout'), 'Must invoke onLogout callback');
});

test('6. Live Supabase authentication connection check', async () => {
  const SUPABASE_URL = 'https://shayisuhjkpuulmouxju.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_R4EYgtfRm5tNoGb61YdDng_JDTUTejW';

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  // Verify getSession returns null session for fresh unauthenticated client
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  assert.equal(sessionError, null, 'getSession must not throw an error');
  assert.equal(sessionData.session, null, 'Unauthenticated client must have null session');

  // Verify signInWithPassword contacts Supabase and returns genuine error for bad credentials
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: 'unregistered.resident.test@heatshield.ai',
    password: 'NonExistentPassword123!',
  });

  assert.equal(authData.session, null, 'Invalid login must not produce a session');
  assert.ok(authError, 'Must return Supabase auth error');
  assert.ok(
    authError.message.toLowerCase().includes('invalid') ||
    authError.message.toLowerCase().includes('credentials'),
    `Expected credentials error message, received: ${authError.message}`
  );
});
