/**
 * HeatShield AI — Device & Runtime Environment Detector
 * Accurately distinguishes between the Native Android App (WebView container)
 * and the Web Application (Desktop / Mobile browsers).
 */

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check synchronous Android Java bridge
  const hasBridge = Boolean(
    (window as any).HeatShieldNative && 
    typeof (window as any).HeatShieldNative.getVersion === 'function'
  );
  if (hasBridge) return true;

  // 2. Check injected window global
  if ((window as any).__HEATSHIELD_NATIVE_APP__ === true) return true;

  // 3. Check User-Agent tag
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  if (ua.includes('HeatShieldApp')) return true;

  // 4. Check file:// protocol (local asset packaging)
  if (window.location.protocol === 'file:') return true;

  return false;
}

export function isWebApp(): boolean {
  return !isNativeApp();
}
