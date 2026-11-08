import { useState, useEffect, useMemo } from 'react';

export type QualityTier = 'high' | 'medium' | 'low' | 'fallback_2d';

/**
 * Checks whether WebGL 1 or WebGL 2 is available on the client device.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!(gl && (gl instanceof WebGLRenderingContext || (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext)));
  } catch {
    return false;
  }
}

/**
 * Returns adaptive Device Pixel Ratio bounds:
 * Mobile: [1, 1.5] to preserve battery and GPU fillrate.
 * Desktop: [1, 2] for crisp rendering on high-DPI displays.
 * Low tier clamps to [1, 1] or [1, 1.25].
 */
export function getAdaptiveDpr(quality: QualityTier, isMobile: boolean): [number, number] {
  if (quality === 'fallback_2d') return [1, 1];
  if (quality === 'low') return [1, 1];
  if (isMobile) return [1, 1.5];
  if (quality === 'medium') return [1, 1.5];
  return [1, 2];
}

/**
 * Returns particle count budget per quality tier:
 * High: 1000
 * Medium: 400
 * Low: 150
 * Fallback: 0
 */
export function getParticleCount(quality: QualityTier): number {
  switch (quality) {
    case 'high':
      return 1000;
    case 'medium':
      return 400;
    case 'low':
      return 150;
    case 'fallback_2d':
    default:
      return 0;
  }
}

/**
 * Returns whether dynamic 3D shadow maps should be enabled for this tier.
 * Only enabled on 'high' tier to prevent frame drops.
 */
export function isShadowsEnabled(quality: QualityTier): boolean {
  return quality === 'high';
}

export interface ThreeQualityConfig {
  quality: QualityTier;
  isMobile: boolean;
  dpr: [number, number];
  particleCount: number;
  enableShadows: boolean;
  isWebGLSupported: boolean;
  prefersReducedMotion: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Custom hook detecting client graphics capabilities, mobile form-factor,
 * screen dimensions, and accessibility preferences.
 */
export function useThreeQuality(overrideQuality?: QualityTier | null): ThreeQualityConfig {
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window === 'undefined') return { width: 1280, height: 720 };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrowScreen = windowDimensions.width < 768;
    return isMobileUA || (hasCoarsePointer && isNarrowScreen);
  }, [windowDimensions.width]);

  const isWebGLSupported = useMemo(() => isWebGLAvailable(), []);

  const quality: QualityTier = useMemo(() => {
    if (overrideQuality) return overrideQuality;
    if (!isWebGLSupported) return 'fallback_2d';
    if (reducedMotion) return 'low';

    // Check CPU concurrency & memory (if available)
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const deviceMemory = typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4 : 4;

    if (isMobile) {
      if (cores < 6 || deviceMemory < 4 || windowDimensions.width < 400) {
        return 'low';
      }
      return 'medium';
    }

    // Desktop
    if (cores >= 8 && deviceMemory >= 6) {
      return 'high';
    }
    if (cores >= 4) {
      return 'medium';
    }
    return 'low';
  }, [overrideQuality, isWebGLSupported, reducedMotion, isMobile, windowDimensions.width]);

  const dpr = useMemo(() => getAdaptiveDpr(quality, isMobile), [quality, isMobile]);
  const particleCount = useMemo(() => getParticleCount(quality), [quality]);
  const enableShadows = useMemo(() => isShadowsEnabled(quality), [quality]);

  return {
    quality,
    isMobile,
    dpr,
    particleCount,
    enableShadows,
    isWebGLSupported,
    prefersReducedMotion: reducedMotion,
    screenWidth: windowDimensions.width,
    screenHeight: windowDimensions.height,
  };
}
