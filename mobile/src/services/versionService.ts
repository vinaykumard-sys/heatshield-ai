export interface RemoteVersionData {
  version: string;
  minimumRequiredVersion?: string;
  forceUpdate?: boolean;
  versionCode?: number;
  releaseNotes?: string;
  downloadUrl?: string;
  releaseDate?: string;
}

export interface VersionCheckResult {
  needsUpdate: boolean;
  installedVersion: string;
  minimumRequiredVersion: string;
  latestVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
  releaseNotes?: string;
}

export const CURRENT_APP_VERSION = '1.1.0';
export const DEFAULT_APK_URL = 'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk';

/**
 * Compares two semantic version strings (e.g., '1.0.2', '1.1.0', 'v1.1.0').
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
 * Checks remote version endpoint and determines if mandatory update is required.
 * If installedVersion < minimumRequiredVersion and forceUpdate === true,
 * needsUpdate is true.
 */
export async function checkAppVersion(
  installedVersion: string = CURRENT_APP_VERSION
): Promise<VersionCheckResult> {
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

    if (!response.ok) {
      throw new Error(`Failed to fetch version info: HTTP ${response.status}`);
    }

    const data: RemoteVersionData = await response.json();
    const latestVersion = data.version || '1.1.0';
    const minimumRequiredVersion = data.minimumRequiredVersion || data.version || '1.1.0';

    const isForceUpdateRequired =
      data.forceUpdate !== undefined ? Boolean(data.forceUpdate) : true;

    const isOutdated = compareSemver(installedVersion, minimumRequiredVersion) < 0;
    const needsUpdate = isOutdated && isForceUpdateRequired;

    let downloadUrl = DEFAULT_APK_URL;
    if (data.downloadUrl) {
      downloadUrl = data.downloadUrl.startsWith('http')
        ? data.downloadUrl
        : `https://heatshield-ai-eight.vercel.app${data.downloadUrl.startsWith('/') ? '' : '/'}${data.downloadUrl}`;
    }

    return {
      needsUpdate,
      installedVersion,
      minimumRequiredVersion,
      latestVersion,
      downloadUrl,
      forceUpdate: isForceUpdateRequired,
      releaseNotes: data.releaseNotes,
    };
  } catch {
    // Graceful fallback if offline or network unavailable - do not crash or block startup
    return {
      needsUpdate: false,
      installedVersion,
      minimumRequiredVersion: installedVersion,
      latestVersion: installedVersion,
      downloadUrl: DEFAULT_APK_URL,
      forceUpdate: false,
    };
  }
}
