import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('1. Mobile package.json dependencies check', () => {
  const pkgPath = path.join(rootDir, 'mobile', 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'mobile/package.json must exist');
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || {};

  assert.ok(deps['expo-notifications'], 'expo-notifications must be present');
  assert.ok(deps['expo-device'], 'expo-device must be present');
  assert.ok(deps['expo-constants'], 'expo-constants must be present');
});

test('2. Supabase push_tokens migration verification', () => {
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261108_push_notifications.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration 20261108_push_notifications.sql must exist');

  const content = fs.readFileSync(migrationPath, 'utf8');
  assert.match(content, /create table if not exists public\.push_tokens/i);
  assert.match(content, /user_id uuid references auth\.users\(id\) on delete cascade not null/i);
  assert.match(content, /expo_push_token text not null unique/i);
  assert.match(content, /platform text default 'android'/i);
  assert.match(content, /device_name text/i);
  assert.match(content, /enabled boolean default true/i);
  assert.match(content, /created_at timestamptz/i);
  assert.match(content, /updated_at timestamptz/i);
  assert.match(content, /last_seen_at timestamptz/i);
  assert.match(content, /alter table public\.push_tokens enable row level security/i);
  assert.match(content, /Users can only insert, select, update, and delete their own push tokens/i);
  assert.match(content, /auth\.uid\(\)\s*=\s*user_id/i);
});

test('3. Android notification channels in pushNotificationService.ts', () => {
  const servicePath = path.join(rootDir, 'mobile', 'src', 'services', 'pushNotificationService.ts');
  assert.ok(fs.existsSync(servicePath), 'pushNotificationService.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf8');
  // Check channels
  assert.ok(content.includes('heat-alerts'), 'Must define heat-alerts channel');
  assert.ok(content.includes('Critical Heatwave Alerts'), 'Must define Critical Heatwave Alerts name');
  assert.ok(content.includes('weather-briefings'), 'Must define weather-briefings channel');
  assert.ok(content.includes('Daily Heat Briefings'), 'Must define Daily Heat Briefings name');
  assert.ok(content.includes('safe-routes'), 'Must define safe-routes channel');
  assert.ok(content.includes('Safe Route & Air Quality Alerts'), 'Must define Safe Route name');
  
  // Check importance levels and lighting
  assert.ok(content.includes('AndroidImportance.MAX'), 'Must set MAX importance on heat-alerts');
  assert.ok(content.includes('#FF2323'), 'Must set red LED light on heat alerts');

  // Check foreground handler
  assert.ok(content.includes('setNotificationHandler'), 'Must configure setNotificationHandler');
});

test('4. Friendly NotificationPermissionModal UI verification', () => {
  const modalPath = path.join(rootDir, 'mobile', 'src', 'components', 'NotificationPermissionModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'NotificationPermissionModal.tsx must exist');

  const content = fs.readFileSync(modalPath, 'utf8');
  assert.ok(content.includes('Stay protected with HeatShield AI'), 'Must include friendly title');
  assert.ok(content.includes('Real-time heatwave alerts'), 'Must explain real-time heatwave alerts');
  assert.ok(content.includes('Morning weather briefings'), 'Must explain morning weather briefings');
  assert.ok(content.includes('Local heat emergency warnings'), 'Must explain emergency warnings');
  assert.ok(content.includes('Cooling-centre availability'), 'Must explain cooling centres');
  assert.ok(content.includes('Safe-route warnings'), 'Must explain safe-route warnings');
  assert.ok(content.includes('Enable Notifications'), 'Must provide Enable Notifications button');
  assert.ok(content.includes('Maybe Later'), 'Must provide Maybe Later button');
});

test('5. Server Push Dispatcher verification (packages/core/notifications/pushDispatcher.ts)', async () => {
  const dispatcherPath = path.join(rootDir, 'packages', 'core', 'notifications', 'pushDispatcher.ts');
  assert.ok(fs.existsSync(dispatcherPath), 'pushDispatcher.ts must exist');

  const content = fs.readFileSync(dispatcherPath, 'utf8');
  assert.ok(content.includes('https://exp.host/--/api/v2/push/send'), 'Must call Expo push endpoint');
  assert.ok(content.includes('sendExpoPushNotification'), 'Must export sendExpoPushNotification');
  assert.ok(content.includes('broadcastHeatwaveAlert'), 'Must export broadcastHeatwaveAlert');
  assert.ok(content.includes('sendMorningBriefingPush'), 'Must export sendMorningBriefingPush');
  assert.ok(content.includes('isExpoPushToken'), 'Must export isExpoPushToken');

  const { isExpoPushToken, sendHeatwaveAlertPush } = await import('../packages/core/notifications/pushDispatcher.ts');

  assert.strictEqual(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.strictEqual(isExpoPushToken('ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
  assert.strictEqual(isExpoPushToken('random-invalid-token'), false);

  const originalFetch = globalThis.fetch;
  let sentPayload = null;

  globalThis.fetch = async (url, options) => {
    if (url === 'https://exp.host/--/api/v2/push/send') {
      sentPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          data: sentPayload.map(() => ({ status: 'ok', id: 'ticket-123' })),
        }),
      };
    }
    return originalFetch(url, options);
  };

  try {
    const res = await sendHeatwaveAlertPush({
      wardName: 'Yelahanka',
      temp: 43.5,
      riskLevel: 'CRITICAL',
      slogan: 'NDMA Red Alert: Immediate shade shelter active',
      tokens: ['ExponentPushToken[device-test-token-123]'],
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.totalTokens, 1);
    assert.strictEqual(sentPayload.length, 1);
    assert.ok(sentPayload[0].title.includes('CRITICAL HEATWAVE EMERGENCY'));
    assert.ok(sentPayload[0].body.includes('43.5°C'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('6. sendExpoPushNotification — Batching, ticket parsing & DeviceNotRegistered deactivation', async () => {
  const { sendExpoPushNotification, chunkArray } = await import('../packages/core/notifications/pushDispatcher.ts');

  // Verify chunking logic
  const tokens250 = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[device_${i}]`);
  const chunks = chunkArray(tokens250, 100);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 100);
  assert.equal(chunks[1].length, 100);
  assert.equal(chunks[2].length, 50);

  // Test ticket processing with mock fetch
  const testTokens = [
    'ExponentPushToken[valid_device_alpha]',
    'ExponentPushToken[valid_device_beta]',
    'ExponentPushToken[stale_device_unregistered]',
  ];

  const mockFetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: payload.map((msg) => {
          if (msg.to.includes('stale_device_unregistered')) {
            return {
              status: 'error',
              message: '"ExponentPushToken[stale_device_unregistered]" is not registered',
              details: { error: 'DeviceNotRegistered' },
            };
          }
          return { status: 'ok', id: 'ticket-ok-99' };
        }),
      }),
    };
  };

  const dispatchResult = await sendExpoPushNotification(
    {
      tokens: testTokens,
      title: '🚨 Heat Alert',
      body: 'Extreme temperature alert',
      data: { emergency: true },
      priority: 'high',
      channelId: 'heat-alerts',
    },
    mockFetch
  );

  assert.equal(dispatchResult.totalTokens, 3);
  assert.equal(dispatchResult.sent, 2);
  assert.equal(dispatchResult.failed, 1);
  assert.equal(dispatchResult.invalidTokens.length, 1);
  assert.equal(dispatchResult.invalidTokens[0], 'ExponentPushToken[stale_device_unregistered]');
});

test('7. broadcastHeatwaveAlert — Emergency ward broadcast & automatic token deactivation', async () => {
  const { broadcastHeatwaveAlert } = await import('../packages/core/notifications/pushDispatcher.ts');

  const deactivated = [];
  const mockGetTokensForWard = async (wardName) => {
    assert.equal(wardName, 'Shivajinagar Central');
    return [
      'ExponentPushToken[resident_1]',
      'ExponentPushToken[resident_2_stale]',
    ];
  };

  const mockDeactivateTokens = async (tokens) => {
    deactivated.push(...tokens);
  };

  const mockFetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: payload.map((msg) => {
          if (msg.to.includes('resident_2_stale')) {
            return {
              status: 'error',
              message: 'DeviceNotRegistered',
              details: { error: 'DeviceNotRegistered' },
            };
          }
          return { status: 'ok', id: 'ticket-ward-ok' };
        }),
      }),
    };
  };

  const alertResult = await broadcastHeatwaveAlert(
    {
      wardName: 'Shivajinagar Central',
      temp: 44.2,
      riskLevel: 'CRITICAL',
      slogan: 'NDMA Red Alert: Avoid all direct sun between 12-4 PM.',
    },
    {
      getTokensForWard: mockGetTokensForWard,
      onDeactivateTokens: mockDeactivateTokens,
      fetchFn: mockFetch,
    }
  );

  assert.equal(alertResult.wardName, 'Shivajinagar Central');
  assert.equal(alertResult.temp, 44.2);
  assert.equal(alertResult.riskLevel, 'CRITICAL');
  assert.equal(alertResult.dispatched, 1);
  assert.deepEqual(deactivated, ['ExponentPushToken[resident_2_stale]']);
});

test('8. sendMorningBriefingPush — Daily morning briefing push notification', async () => {
  const { sendMorningBriefingPush } = await import('../packages/core/notifications/pushDispatcher.ts');

  let tokenLookedUpForUser = null;
  const mockGetTokensForUser = async (userId) => {
    tokenLookedUpForUser = userId;
    return ['ExponentPushToken[user_morning_phone]'];
  };

  let capturedMessage = null;
  const mockFetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    capturedMessage = payload[0];
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ status: 'ok', id: 'ticket-briefing' }],
      }),
    };
  };

  const briefing = await sendMorningBriefingPush(
    {
      userId: 'user-resident-888',
      highTemp: 41,
      riskLevel: 'HIGH',
    },
    {
      getTokensForUser: mockGetTokensForUser,
      fetchFn: mockFetch,
    }
  );

  assert.equal(tokenLookedUpForUser, 'user-resident-888');
  assert.equal(briefing.dispatched, 1);
  assert.equal(capturedMessage.title, '☀️ Morning Heat Briefing');
  assert.match(capturedMessage.body, /41°C/);
  assert.match(capturedMessage.body, /HIGH/);
});

test('9. Client Push Dispatcher (src/lib/pushDispatcher.ts) token registration & export integrity', async () => {
  const libDispatcherPath = path.join(rootDir, 'src', 'lib', 'pushDispatcher.ts');
  assert.ok(fs.existsSync(libDispatcherPath), 'src/lib/pushDispatcher.ts must exist');

  const content = fs.readFileSync(libDispatcherPath, 'utf8');
  assert.ok(content.includes('registerPushToken'), 'Must export registerPushToken');
  assert.ok(content.includes('sendExpoPushNotification'), 'Must export sendExpoPushNotification');
  assert.ok(content.includes('broadcastHeatwaveAlert'), 'Must export broadcastHeatwaveAlert');
  assert.ok(content.includes('sendMorningBriefingPush'), 'Must export sendMorningBriefingPush');
  assert.ok(content.includes('push_tokens'), 'Must query push_tokens table');
  assert.ok(content.includes('enabled: false'), 'Must handle deactivating invalid tokens');
});

test('10. Supabase Edge Function (supabase/functions/send-push-notification/index.ts) verification', () => {
  const funcPath = path.join(rootDir, 'supabase', 'functions', 'send-push-notification', 'index.ts');
  assert.ok(fs.existsSync(funcPath), 'Edge function index.ts must exist');

  const content = fs.readFileSync(funcPath, 'utf8');
  assert.ok(content.includes('Authorization'), 'Must validate Authorization header');
  assert.ok(content.includes('https://exp.host/--/api/v2/push/send'), 'Must post to Expo Push API');
  assert.ok(content.includes('DeviceNotRegistered'), 'Must check DeviceNotRegistered');
  assert.ok(content.includes('push_tokens'), 'Must interact with push_tokens table');
  assert.ok(content.includes('enabled: false'), 'Must deactivate invalid tokens in database');
});
