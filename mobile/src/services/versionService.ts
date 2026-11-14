import { supabase, isSupabaseConfigured } from './supabase';

export interface RemoteVersionData {
  version: string;
  minimumRequiredVersion?: string;
  forceUpdate?: boolean;
  versionCode?: number;
  releaseNotes?: string;
  downloadUrl?: string;
  releaseDate?: string;
}

export interface AppUpdateRecord {
  id?: string;
  platform: 'android' | 'ios' | 'web';
  minimum_version: string;
  latest_version: string;
  android_version_code?: number;
  update_type?: 'binary' | 'ota';
  update_url: string;
  release_notes?: string;
  is_required: boolean;
  published_at?: string;
}

export interface VersionCheckResult {
  needsUpdate: boolean;
  installedVersion: string;
  minimumRequiredVersion: string;
  latestVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
  releaseNotes?: string;
  versionCode?: number;
  source?: 'supabase' | 'remote_json' | 'cache' | 'offline_fallback';
}

export const CURRENT_APP_VERSION = '1.5.0';
export const CURRENT_VERSION_CODE = 8;
export const DEFAULT_APK_URL = 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk';
export const VERSION_JSON_URL = 'https://heatshield-ai-eight.vercel.app/downloads/version.json';

// In-memory cache to prevent infinite re-checking loops
let memoryCache: { result: VersionCheckResult; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Compares two semantic version strings (e.g., '1.0.2', '1.1.0', 'v1.1.0', '1.9.9' < '1.10.0').
 * Purely numerical comparison per segment, preventing string comparison pitfalls.
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const parse = (v: string): number[] => {
    return (v || '')
      .trim()
      .replace(/^[vV]/, '')
      .split(/[-+]/)[0]
      .split('.')
      .map((part) => {
        const num = parseInt(part, 10);
        return isNaN(num) ? 0 : num;
      });
  };

  const p1 = parse(v1);
  const p2 = parse(v2);
  const len = Math.max(p1.length, p2.length, 3);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Resets the in-memory version check cache.
 */
export function clearVersionCache(): void {
  memoryCache = null;
}

/**
 * Detects the currently installed version:
 * 1. Native JavascriptInterface: window.HeatShieldNative.getVersion()
 * 2. Injected window global: window.__HEATSHIELD_NATIVE_VERSION__
 * 3. User-Agent parsing for HeatShieldApp/X.Y.Z
 * 4. Fallback: CURRENT_APP_VERSION (1.5.0)
 */
export function getInstalledVersion(): string {
  if (typeof window !== 'undefined') {
    try {
      const nativeBridge = (window as any).HeatShieldNative;
      if (nativeBridge && typeof nativeBridge.getVersion === 'function') {
        const v = nativeBridge.getVersion();
        if (v && String(v).trim().length > 0) {
          return String(v).trim();
        }
      }
    } catch (e) {}

    const nativeVer = (window as any).__HEATSHIELD_NATIVE_VERSION__;
    if (typeof nativeVer === 'string' && nativeVer.trim().length > 0) {
      return nativeVer.trim();
    }

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const match = ua.match(/HeatShieldApp\/([0-9.]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  return CURRENT_APP_VERSION;
}

/**
 * Checks for mandatory and optional application updates:
 * 1. Checks memory cache to avoid tight update loops.
 * 2. Checks Supabase `app_updates` table (platform='android', minimum_version, latest_version, android_version_code, update_url, is_required).
 * 3. Falls back to https://heatshield-ai-eight.vercel.app/downloads/version.json if Supabase is offline or table is pending migration.
 * 4. Fallback gracefully if network is unavailable (never blocks startup with unhandled error).
 */
export async function checkAppVersion(
  installedVersion: string = getInstalledVersion(),
  forceCheck: boolean = false
): Promise<VersionCheckResult> {
  // 1. Check cache first to avoid repeating requests in tight loops
  if (!forceCheck && memoryCache && (Date.now() - memoryCache.timestamp < CACHE_TTL_MS)) {
    return {
      ...memoryCache.result,
      source: 'cache',
    };
  }

  let latestVersion = CURRENT_APP_VERSION;
  let minimumRequiredVersion = CURRENT_APP_VERSION;
  let isForceUpdateRequired = true;
  let downloadUrl = DEFAULT_APK_URL;
  let releaseNotes =
    'Critical update: Real-road safe routing, role-based security, offline heat shelters, and push notifications.';
  let androidVersionCode = CURRENT_VERSION_CODE;
  let fetchSource: 'supabase' | 'remote_json' | 'offline_fallback' = 'offline_fallback';

  // 2. Query Supabase `app_updates` table (authoritative source)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('app_updates')
        .select('platform, minimum_version, latest_version, android_version_code, update_url, is_required, release_notes')
        .eq('platform', 'android')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        minimumRequiredVersion = data.minimum_version || CURRENT_APP_VERSION;
        latestVersion = data.latest_version || minimumRequiredVersion;
        isForceUpdateRequired = data.is_required !== undefined ? Boolean(data.is_required) : true;
        downloadUrl = data.update_url || DEFAULT_APK_URL;
        if (data.release_notes) releaseNotes = data.release_notes;
        if (data.android_version_code) androidVersionCode = data.android_version_code;
        fetchSource = 'supabase';
      }
    } catch (supabaseErr) {
      console.warn('[VersionService] Supabase app_updates query skipped/failed:', supabaseErr);
    }
  }

  // 3. Fallback to production version.json endpoint if Supabase didn't provide data
  if (fetchSource === 'offline_fallback') {
    const url = `https://heatshield-ai-eight.vercel.app/downloads/version.json?t=${Date.now()}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json: RemoteVersionData = await response.json();
        latestVersion = json.version || CURRENT_APP_VERSION;
        minimumRequiredVersion = json.minimumRequiredVersion || json.version || CURRENT_APP_VERSION;
        isForceUpdateRequired = json.forceUpdate !== undefined ? Boolean(json.forceUpdate) : true;
        if (json.downloadUrl) {
          downloadUrl = json.downloadUrl.startsWith('http')
            ? json.downloadUrl
            : `https://heatshield-ai-eight.vercel.app${json.downloadUrl.startsWith('/') ? '' : '/'}${json.downloadUrl}`;
        }
        if (json.releaseNotes) releaseNotes = json.releaseNotes;
        if (json.versionCode) androidVersionCode = json.versionCode;
        fetchSource = 'remote_json';
      }
    } catch (fetchErr) {
      console.warn('[VersionService] version.json fallback fetch skipped/failed:', fetchErr);
    }
  }

  // 4. Compare installed version with minimum required version
  const isOutdated = compareSemver(installedVersion, minimumRequiredVersion) < 0;
  const needsUpdate = isOutdated && isForceUpdateRequired;

  const result: VersionCheckResult = {
    needsUpdate,
    installedVersion,
    minimumRequiredVersion,
    latestVersion,
    downloadUrl,
    forceUpdate: isForceUpdateRequired,
    releaseNotes,
    versionCode: androidVersionCode,
    source: fetchSource,
  };

  // Cache result
  memoryCache = { result, timestamp: Date.now() };

  return result;
}
