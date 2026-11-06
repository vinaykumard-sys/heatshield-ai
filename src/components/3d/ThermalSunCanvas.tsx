import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Sparkles, Flame, ShieldAlert, Sun } from 'lucide-react';

export interface ThermalSunCanvasProps {
  /**
   * Risk level determining the sun's chromatic temperature and intensity:
   * 'low' | 'moderate' | 'high' | 'critical' | 'extreme'
   */
  riskCategory?: 'low' | 'moderate' | 'high' | 'critical' | 'extreme' | string;
  /**
   * Optional numerical risk score (0 - 100) to fine-tune color interpolation & pulse speed
   */
  riskScore?: number;
  /**
   * Width/Size of the viewport in pixels or CSS units. Default: 260
   */
  size?: number | string;
  /**
   * Height of the canvas. If omitted, matches width (square).
   */
  height?: number | string;
  /**
   * Enable mouse hover interactive rotation & parallax tilt. Default: true
   */
  interactive?: boolean;
  /**
   * Render solar flare / plasma particle emissions. Default: true
   */
  showParticles?: boolean;
  /**
   * Render pulsating coronal aura atmosphere. Default: true
   */
  showCorona?: boolean;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Optional label displayed beneath or alongside
   */
  label?: string;
  /**
   * Show status badge overlay with live telemetry. Default: false
   */
  showBadge?: boolean;
}

// Utility to verify WebGL support safely
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch {
    return false;
  }
}

// Color schemes per heat risk state
const RISK_THEMES = {
  low: {
    coreColor: 0xFBBF24,       // Bright Solar Yellow
    coronaColor: 0xF59E0B,     // Golden Amber
    plasmaColor: 0xFEF3C7,     // Radiant White-Gold
    flareColor: 0xFCD34D,      // Light Golden Flare
    pulseSpeed: 1.2,
    flareSpeed: 0.8,
    name: 'Normal Thermal Solar',
    badgeText: 'Stable Heliosphere',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    cssGlow: 'radial-gradient(circle, #FDE68A 0%, #F59E0B 45%, #D97706 75%, transparent 100%)',
  },
  moderate: {
    coreColor: 0xF59E0B,       // Golden Amber
    coronaColor: 0xEA580C,     // Fiery Orange
    plasmaColor: 0xFFEDD5,     // Radiant Peach
    flareColor: 0xFB923C,      // Bright Orange Flare
    pulseSpeed: 1.6,
    flareSpeed: 1.1,
    name: 'Elevated Solar Irradiance',
    badgeText: 'Active Thermal Flux',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    cssGlow: 'radial-gradient(circle, #FED7AA 0%, #EA580C 50%, #C2410C 75%, transparent 100%)',
  },
  high: {
    coreColor: 0xEA580C,       // Intense Orange
    coronaColor: 0xEF4444,     // Fiery Red
    plasmaColor: 0xFEE2E2,     // White-Pink Hot Core
    flareColor: 0xF87171,      // Scarlet Flare
    pulseSpeed: 2.2,
    flareSpeed: 1.5,
    name: 'High Thermal Radiation',
    badgeText: 'High Heat Flux',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    cssGlow: 'radial-gradient(circle, #FECACA 0%, #EA580C 40%, #DC2626 70%, transparent 100%)',
  },
  critical: {
    coreColor: 0xDC2626,       // Deep Crimson
    coronaColor: 0x7C3AED,     // Plasma Violet Coronal Ejection
    plasmaColor: 0xFDF4FF,     // Ultra-hot Violet-White
    flareColor: 0xA855F7,      // Purple Solar Flares
    pulseSpeed: 3.0,
    flareSpeed: 2.0,
    name: 'Critical Plasma Flare',
    badgeText: 'Extreme Plasma Surge',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    cssGlow: 'radial-gradient(circle, #F5D0FE 0%, #DC2626 38%, #7C3AED 72%, #4C1D95 90%, transparent 100%)',
  },
};

export const ThermalSunCanvas: React.FC<ThermalSunCanvasProps> = ({
  riskCategory = 'low',
  riskScore,
  size = 260,
  height,
  interactive = true,
  showParticles = true,
  showCorona = true,
  className = '',
  label,
  showBadge = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Normalize risk category
  const normalizedCategory = useMemo<'low' | 'moderate' | 'high' | 'critical'>(() => {
    const cat = (riskCategory || '').toLowerCase();
    if (cat.includes('crit') || cat.includes('extreme')) return 'critical';
    if (cat.includes('high')) return 'high';
    if (cat.includes('mod') || cat.includes('elevated')) return 'moderate';
    return 'low';
  }, [riskCategory]);

  const theme = RISK_THEMES[normalizedCategory];

  useEffect(() => {
    // Check WebGL availability first
    if (!checkWebGLSupport()) {
      setWebglSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isDisposed = false;

    // Dimensions
    const getWidth = () => container.clientWidth || (typeof size === 'number' ? size : 260);
    const getHeight = () => container.clientHeight || (typeof height === 'number' ? height : (typeof size === 'number' ? size : 260));

    const width = getWidth();
    const currentHeight = getHeight();

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / currentHeight, 0.1, 1000);
    camera.position.z = 5.2;

    // Renderer setup with antialias and alpha transparency
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, currentHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglSupported(false);
      return;
    }

    // Main Thermal Sun Group
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // 1. Core Sphere (Textured Thermal Surface with Displacement & Glow)
    const coreGeometry = new THREE.SphereGeometry(1.4, 48, 48);
    
    // Procedural noise texture for sun granular convection cells
    const createSunTexture = (cColor: number, pColor: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const baseColor = new THREE.Color(cColor);
        const hotColor = new THREE.Color(pColor);

        ctx.fillStyle = `#${baseColor.getHexString()}`;
        ctx.fillRect(0, 0, 512, 512);

        // Convection granule spots
        for (let i = 0; i < 240; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const radius = Math.random() * 32 + 8;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `#${hotColor.getHexString()}`);
          grad.addColorStop(0.5, `#${baseColor.getHexString()}`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return new THREE.CanvasTexture(canvas);
    };

    const sunTexture = createSunTexture(theme.coreColor, theme.plasmaColor);
    sunTexture.wrapS = THREE.RepeatWrapping;
    sunTexture.wrapT = THREE.RepeatWrapping;

    const coreMaterial = new THREE.MeshStandardMaterial({
      map: sunTexture,
      roughness: 0.35,
      metalness: 0.1,
      emissive: new THREE.Color(theme.coreColor),
      emissiveIntensity: 0.75,
    });

    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    sunGroup.add(coreMesh);

    // 2. Wireframe / Plasma Lattice (Subtle futuristic coronal wave)
    const latticeGeometry = new THREE.IcosahedronGeometry(1.46, 2);
    const latticeMaterial = new THREE.MeshBasicMaterial({
      color: theme.coronaColor,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const latticeMesh = new THREE.Mesh(latticeGeometry, latticeMaterial);
    sunGroup.add(latticeMesh);

    // 3. Coronal Atmosphere Halo (Fresnel rim glow)
    let coronaMesh: THREE.Mesh | null = null;
    if (showCorona) {
      const coronaGeometry = new THREE.SphereGeometry(1.72, 32, 32);
      const coronaMaterial = new THREE.MeshBasicMaterial({
        color: theme.coronaColor,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      sunGroup.add(coronaMesh);

      // Outer diffused ring
      const outerRingGeom = new THREE.RingGeometry(1.65, 2.3, 64);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: theme.coronaColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat);
      outerRingMesh.rotation.x = Math.PI / 2.3;
      sunGroup.add(outerRingMesh);
    }

    // 4. Solar Flare & Plasma Ejection Particle System
    let particleSystem: THREE.Points | null = null;
    let particlePositions: Float32Array;
    let particleVelocities: Float32Array;
    const particleCount = 180;

    if (showParticles) {
      const particleGeometry = new THREE.BufferGeometry();
      particlePositions = new Float32Array(particleCount * 3);
      particleVelocities = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        // Distribute randomly in a shell around the sun
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1.45 + Math.random() * 0.9;

        const sinPhi = Math.sin(phi);
        const x = r * sinPhi * Math.cos(theta);
        const y = r * sinPhi * Math.sin(theta);
        const z = r * Math.cos(phi);

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        // Velocity radiating outwards
        particleVelocities[i * 3] = (x / r) * (0.004 + Math.random() * 0.006);
        particleVelocities[i * 3 + 1] = (y / r) * (0.004 + Math.random() * 0.006);
        particleVelocities[i * 3 + 2] = (z / r) * (0.004 + Math.random() * 0.006);
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

      // Circular soft particle canvas
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, `#${new THREE.Color(theme.flareColor).getHexString()}`);
        grad.addColorStop(1, 'transparent');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 64, 64);
      }
      const particleTexture = new THREE.CanvasTexture(pCanvas);

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.16,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      sunGroup.add(particleSystem);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(theme.coreColor, 3.5, 50);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Mouse Interaction Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.75;
      targetRotationX = -y * 0.55;
    };

    const handleMouseLeave = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation Clock
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const speed = theme.pulseSpeed;

      // 1. Core rotation
      sunGroup.rotation.y += 0.004;
      latticeMesh.rotation.y -= 0.003;
      latticeMesh.rotation.x += 0.002;

      // 2. Interactive tilt smoothing (lerp)
      currentRotationX += (targetRotationX - currentRotationX) * 0.08;
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      sunGroup.rotation.x = currentRotationX;
      sunGroup.rotation.y += currentRotationY * 0.05;

      // 3. Thermal pulsating scale
      const pulse = 1.0 + Math.sin(elapsedTime * speed) * 0.035;
      coreMesh.scale.set(pulse, pulse, pulse);

      if (coronaMesh) {
        const coronaPulse = 1.0 + Math.sin(elapsedTime * speed * 0.8) * 0.06;
        coronaMesh.scale.set(coronaPulse, coronaPulse, coronaPulse);
      }

      // 4. Update Solar Flare Particles
      if (particleSystem && particlePositions && particleVelocities) {
        const positions = particleSystem.geometry.attributes.position.array as Float32Array;
        const flareMultiplier = theme.flareSpeed;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          positions[idx] += particleVelocities[idx] * flareMultiplier;
          positions[idx + 1] += particleVelocities[idx + 1] * flareMultiplier;
          positions[idx + 2] += particleVelocities[idx + 2] * flareMultiplier;

          // Compute distance from center
          const dist = Math.sqrt(
            positions[idx] * positions[idx] +
            positions[idx + 1] * positions[idx + 1] +
            positions[idx + 2] * positions[idx + 2]
          );

          // Reset particle if it drifts too far away
          if (dist > 2.8) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 1.42;

            const sinPhi = Math.sin(phi);
            positions[idx] = r * sinPhi * Math.cos(theta);
            positions[idx + 1] = r * sinPhi * Math.sin(theta);
            positions[idx + 2] = r * Math.cos(phi);
          }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer for flawless responsive scaling
    const resizeObserver = new ResizeObserver(() => {
      if (!container || isDisposed) return;
      const newWidth = getWidth();
      const newHeight = getHeight();
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });

    resizeObserver.observe(container);

    // Cleanup on unmount or risk changes
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);

      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      resizeObserver.disconnect();

      // Dispose three.js resources
      coreGeometry.dispose();
      coreMaterial.dispose();
      sunTexture.dispose();
      latticeGeometry.dispose();
      latticeMaterial.dispose();

      if (coronaMesh) {
        coronaMesh.geometry.dispose();
        (coronaMesh.material as THREE.Material).dispose();
      }

      if (particleSystem) {
        particleSystem.geometry.dispose();
        (particleSystem.material as THREE.Material).dispose();
      }

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [normalizedCategory, theme, interactive, showParticles, showCorona, size, height]);

  const containerStyle: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof height === 'number' ? `${height}px` : (typeof size === 'number' ? `${size}px` : size),
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        style={containerStyle}
        className="relative flex items-center justify-center overflow-visible cursor-grab active:cursor-grabbing"
      >
        {/* Graceful Fallback if WebGL fails */}
        {!webglSupported && (
          <div
            className="w-4/5 h-4/5 rounded-full animate-pulse transition-all duration-700 shadow-2xl relative"
            style={{
              background: theme.cssGlow,
              boxShadow: `0 0 50px 10px ${normalizedCategory === 'critical' ? '#7C3AED88' : '#F59E0B66'}`,
            }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-30" />
            <div className="absolute inset-3 rounded-full bg-white/20 blur-sm" />
          </div>
        )}

        {/* Ambient background glow ring behind canvas */}
        <div
          className="absolute inset-4 rounded-full pointer-events-none -z-10 blur-2xl opacity-40 transition-all duration-700"
          style={{
            background: theme.cssGlow,
            transform: isHovered ? 'scale(1.15)' : 'scale(1.0)',
          }}
        />
      </div>

      {/* Telemetry Status Badge */}
      {showBadge && (
        <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md shadow-sm transition-all duration-300">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                normalizedCategory === 'critical'
                  ? 'bg-purple-500'
                  : normalizedCategory === 'high'
                  ? 'bg-red-500'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                normalizedCategory === 'critical'
                  ? 'bg-purple-600'
                  : normalizedCategory === 'high'
                  ? 'bg-red-600'
                  : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-slate-800 font-mono tracking-tight text-[11px]">
            {theme.badgeText}
          </span>
          {riskScore !== undefined && (
            <span className="ml-1 text-slate-500 font-normal">
              • {Math.round(riskScore)}%
            </span>
          )}
        </div>
      )}

      {/* Optional Label */}
      {label && (
        <p className="mt-1 text-xs text-slate-600 font-medium tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
};
