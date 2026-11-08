/**
 * HeatShield AI — Version & Mandatory Update Service
 * Handles client semver comparison, native Android WebView detection,
 * and enforcement of mandatory version updates.
 */

export const CURRENT_APP_VERSION = '1.1.0';
export const CURRENT_VERSION_CODE = 4;
export const DEFAULT_DOWNLOAD_URL = 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk';

export interface RemoteVersionConfig {
  version: string;
  versionCode: number;
  minimumRequiredVersion: string;
  forceUpdate: boolean;
  releaseDate?: string;
  releaseNotes?: string;
  minAndroidVersion?: string;
  targetAndroidVersion?: string;
  downloadUrl?: string;
}

export interface VersionCheckResult {
  isOutdated: boolean;
  installedVersion: string;
  latestVersion: string;
  minimumVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  isNativeWebView: boolean;
  checkedAt: number;
}

/**
 * Compare two semver strings:
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const sanitize = (v: string): number[] => {
    if (!v) return [0];
    const cleaned = v.trim().replace(/^v/i, '').split('-')[0]; // Strip build metadata/prerelease for base semver
    return cleaned
      .split('.')
      .map((part) => {
        const num = parseInt(part, 10);
        return Number.isFinite(num) ? num : 0;
      });
  };

  const p1 = sanitize(v1);
  const p2 = sanitize(v2);
  const maxLength = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Detect whether the current environment is running inside the native Android WebView.
 */
export function isAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;

  const isFileProtocol = window.location.protocol === 'file:';
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isHeatShieldApp = ua.includes('HeatShieldApp');
  const isAndroidWv = ua.includes('wv') || (ua.includes('Android') && ua.includes('Version/'));

  return isFileProtocol || isHeatShieldApp || isAndroidWv;
}

/**
 * Detect currently installed version.
 * - Checks window.__HEATSHIELD_NATIVE_VERSION__
 * - Checks if in Android WebView without version flag (older build v1.0.2)
 * - Defaults to CURRENT_APP_VERSION for web clients
 */
export function getInstalledVersion(): string {
  if (typeof window === 'undefined') {
    return CURRENT_APP_VERSION;
  }

  const nativeVersion = (window as any).__HEATSHIELD_NATIVE_VERSION__;
  if (typeof nativeVersion === 'string' && nativeVersion.trim().length > 0) {
    return nativeVersion.trim();
  }

  // If in Android WebView and no explicit native version is set,
  // it signifies an older APK build prior to v1.1.0 (such as v1.0.2)
  if (isAndroidWebView()) {
    return '1.0.2';
  }

  return CURRENT_APP_VERSION;
}

/**
 * Fetch remote version configuration and check if the installed app is outdated.
 */
export async function checkAppVersion(): Promise<VersionCheckResult> {
  const inWebView = isAndroidWebView();
  const installedVersion = getInstalledVersion();

  // Resolve base URL: In WebView with file:// protocol, relative URLs fail, so use the hosted domain
  const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
  const baseUrl = !isFile && typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file')
    ? window.location.origin
    : 'https://heatshield-ai-eight.vercel.app';

  const versionEndpoint = `${baseUrl}/downloads/version.json?t=${Date.now()}`;

  let remoteConfig: RemoteVersionConfig | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(versionEndpoint, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      remoteConfig = await response.json();
    }
  } catch (err) {
    console.warn('[VersionService] Failed to fetch remote version.json:', err);
  }

  const latestVersion = remoteConfig?.version || CURRENT_APP_VERSION;
  const minimumVersion = remoteConfig?.minimumRequiredVersion || CURRENT_APP_VERSION;
  const forceUpdate = remoteConfig?.forceUpdate !== undefined ? remoteConfig.forceUpdate : true;
  const downloadUrl = remoteConfig?.downloadUrl || DEFAULT_DOWNLOAD_URL;
  const releaseNotes = remoteConfig?.releaseNotes || 
    'Major production update: Fully responsive mobile layout, secure login-first authentication, real-road OSRM heat navigation, and broad Android compatibility.';

  // Determine if outdated
  // 1. If installedVersion < minimumVersion and forceUpdate is active
  // 2. Or if running inside Android WebView and installedVersion is older than 1.1.0
  const isBelowMinimum = compareSemver(installedVersion, minimumVersion) < 0;
  const isOutdated = (isBelowMinimum && forceUpdate) || (inWebView && compareSemver(installedVersion, '1.1.0') < 0);

  return {
    isOutdated,
    installedVersion,
    latestVersion,
    minimumVersion,
    downloadUrl,
    releaseNotes,
    isNativeWebView: inWebView,
    checkedAt: Date.now()
  };
}
