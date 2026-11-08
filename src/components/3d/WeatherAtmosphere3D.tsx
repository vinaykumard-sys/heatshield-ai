import React, { useRef, useMemo, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThreeQuality, QualityTier } from './useThreeQuality';

// ==========================================
// Props & Interfaces
// ==========================================

export interface WeatherAtmosphere3DProps {
  /** WMO Weather Code (0=Clear, 1-3=Cloudy, 51-67=Rain, etc.) */
  weatherCode?: number;
  /** Whether it is daytime */
  isDay?: boolean;
  /** Ambient temperature in Celsius */
  tempC?: number;
  /** Heat risk severity category */
  riskCategory?: 'low' | 'moderate' | 'high' | 'critical' | 'extreme' | string;
  /** Quality tier override */
  quality?: QualityTier;
  /** Custom wrapper CSS class */
  className?: string;
  /** Inline CSS style */
  style?: React.CSSProperties;
  /** Enable mouse parallax / gentle tilt */
  interactive?: boolean;
  /** Show subtle visual badge in corner */
  showTelemetry?: boolean;
}

// ==========================================
// Error Boundary for WebGL Resiliency
// ==========================================

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[WeatherAtmosphere3D] WebGL rendering error caught, falling back to 2D view:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ==========================================
// 1. Sun Halo & Heat Shimmer (Clear / Hot)
// ==========================================

function SunHaloMesh({ isExtremeHeat }: { isExtremeHeat: boolean }) {
  const haloRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (haloRef.current) {
      haloRef.current.position.y = 2.8 + Math.sin(t * 0.5) * 0.08;
    }
    if (ring1Ref.current) {
      const scale1 = 1 + Math.sin(t * 1.5) * 0.06;
      ring1Ref.current.scale.set(scale1, scale1, 1);
      ring1Ref.current.rotation.z += delta * 0.1;
    }
    if (ring2Ref.current) {
      const scale2 = 1 + Math.cos(t * 2) * 0.08;
      ring2Ref.current.scale.set(scale2, scale2, 1);
      ring2Ref.current.rotation.z -= delta * 0.15;
    }
  });

  const coreColor = isExtremeHeat ? '#ff4500' : '#fbbf24';
  const coronaColor = isExtremeHeat ? '#f97316' : '#f59e0b';

  return (
    <group ref={haloRef} position={[3.2, 2.8, -3]}>
      {/* Sun Core Disc */}
      <mesh>
        <circleGeometry args={[1.1, 36]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.92} />
      </mesh>

      {/* Primary Inner Glow Halo */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[1.1, 2.0, 36]} />
        <meshBasicMaterial
          color={coronaColor}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary Outer Pulsing Corona */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[2.0, 3.2, 36]} />
        <meshBasicMaterial
          color={isExtremeHeat ? '#dc2626' : '#fed7aa'}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Heat Shimmer Particles
function ShimmerParticles({ count, isExtreme }: { count: number; isExtreme: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, initialY } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const initY = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 16;
      pos[i3 + 1] = (Math.random() - 0.5) * 8;
      pos[i3 + 2] = (Math.random() - 0.5) * 8 - 2;

      initY[i] = pos[i3 + 1];

      vel[i3] = (Math.random() - 0.5) * 0.3; // drift X
      vel[i3 + 1] = (isExtreme ? 0.8 : 0.4) + Math.random() * 0.4; // rise Y
      vel[i3 + 2] = (Math.random() - 0.5) * 0.2; // drift Z
    }
    return { positions: pos, velocities: vel, initialY: initY };
  }, [count, isExtreme]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += velocities[i3 + 1] * delta;
      arr[i3] += Math.sin(arr[i3 + 1] * 2) * delta * 0.3;

      // Wrap around from top to bottom
      if (arr[i3 + 1] > 6) {
        arr[i3 + 1] = -5;
        arr[i3] = (Math.random() - 0.5) * 16;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isExtreme ? 0.08 : 0.05}
        color={isExtreme ? '#f97316' : '#fde047'}
        transparent
        opacity={isExtreme ? 0.7 : 0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ==========================================
// 2. Procedural Floating Cloud Layers
// ==========================================

function ProceduralCloudCluster({ position, speed, scale = 1 }: { position: [number, number, number]; speed: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += delta * speed;
      // Loop across horizon
      if (groupRef.current.position.x > 14) {
        groupRef.current.position.x = -14;
      }
    }
  });

  // Compose multiple soft puffs to form an organic cloud silhouette
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh position={[1.1, -0.2, 0.1]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.95} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-1.0, -0.15, -0.1]}>
        <sphereGeometry args={[0.95, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.95} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.4, 0.5, 0.2]}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.4, -0.15]}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function CloudLayers() {
  return (
    <group position={[0, 0, -2]}>
      <ProceduralCloudCluster position={[-7, 2.2, -3]} speed={0.25} scale={1.2} />
      <ProceduralCloudCluster position={[1, 1.4, -2]} speed={0.35} scale={1.0} />
      <ProceduralCloudCluster position={[8, 2.8, -4]} speed={0.2} scale={1.4} />
      <ProceduralCloudCluster position={[-3, 0.8, -1]} speed={0.4} scale={0.85} />
    </group>
  );
}

// ==========================================
// 3. Rain Streak Particles & Splash Ripples
// ==========================================

function RainSystem({ count = 300 }: { count?: number }) {
  const lineMeshRef = useRef<THREE.LineSegments>(null);
  const rippleGroupRef = useRef<THREE.Group>(null);

  // Rain lines buffer (each drop is a line segment with top & bottom vertices)
  const { linePositions, lineVelocities } = useMemo(() => {
    const totalVertices = count * 2;
    const pos = new Float32Array(totalVertices * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = Math.random() * 12 - 4;
      const z = (Math.random() - 0.5) * 8 - 1;
      const length = 0.35 + Math.random() * 0.35;

      const idx = i * 6;
      // Top vertex
      pos[idx] = x;
      pos[idx + 1] = y + length;
      pos[idx + 2] = z;

      // Bottom vertex
      pos[idx + 3] = x - 0.05; // slight wind slant
      pos[idx + 4] = y;
      pos[idx + 5] = z;

      vel[i] = 12 + Math.random() * 8; // fall speed
    }

    return { linePositions: pos, lineVelocities: vel };
  }, [count]);

  // Interactive splash ripples at ground
  const ripples = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 4 - 1,
      speed: 0.8 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state, delta) => {
    if (lineMeshRef.current) {
      const posAttr = lineMeshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const topYIdx = i * 6 + 1;
        const botYIdx = i * 6 + 4;
        const speed = lineVelocities[i];

        arr[topYIdx] -= speed * delta;
        arr[botYIdx] -= speed * delta;

        // Reset if bottom crosses ground level (-3.5)
        if (arr[botYIdx] < -3.5) {
          const resetY = 6 + Math.random() * 3;
          const length = 0.35 + Math.random() * 0.35;
          const newX = (Math.random() - 0.5) * 16;
          const newZ = (Math.random() - 0.5) * 8 - 1;

          arr[i * 6] = newX;
          arr[topYIdx] = resetY + length;
          arr[i * 6 + 2] = newZ;

          arr[i * 6 + 3] = newX - 0.05;
          arr[botYIdx] = resetY;
          arr[i * 6 + 5] = newZ;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Animate splash ripples
    if (rippleGroupRef.current) {
      const t = state.clock.getElapsedTime();
      rippleGroupRef.current.children.forEach((child, index) => {
        const r = ripples[index];
        const progress = (t * r.speed + r.phase) % 1;
        const scale = 0.1 + progress * 0.9;
        child.scale.set(scale, scale, 1);
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = (1 - progress) * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Rain Streaks */}
      <lineSegments ref={lineMeshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#93c5fd" transparent opacity={0.55} />
      </lineSegments>

      {/* Ground Splash Ripples */}
      <group ref={rippleGroupRef} position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {ripples.map((r) => (
          <mesh key={r.id} position={[r.x, r.z, 0]}>
            <ringGeometry args={[0.1, 0.18, 16]} />
            <meshBasicMaterial color="#bfdbfe" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// 4. Night Sky & Scintillating Stars
// ==========================================

function NightSkySystem({ count = 250 }: { count?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const moonRef = useRef<THREE.Group>(null);

  const starPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 18;
      pos[i3 + 1] = Math.random() * 8 - 2;
      pos[i3 + 2] = (Math.random() - 0.5) * 6 - 3;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.55 + Math.sin(t * 1.5) * 0.25;
    }
    if (moonRef.current) {
      moonRef.current.position.y = 2.6 + Math.sin(t * 0.4) * 0.05;
      moonRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Stars Field */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#e0f2fe" transparent opacity={0.7} />
      </points>

      {/* Stylized Moon */}
      <group ref={moonRef} position={[-3.5, 2.6, -3]}>
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#38bdf8"
            emissiveIntensity={0.25}
            roughness={0.7}
          />
        </mesh>
        {/* Soft Lunar Halo */}
        <mesh>
          <ringGeometry args={[0.92, 1.6, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 5. Extreme Heat Pulsing Thermal Waves
// ==========================================

function ThermalHeatWaves() {
  const waveGroupRef = useRef<THREE.Group>(null);

  const waveRings = useMemo(() => [0, 1, 2, 3], []);

  useFrame((state) => {
    if (!waveGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    waveGroupRef.current.children.forEach((child, index) => {
      const offset = (t * 0.8 + index * 0.6) % 2.4;
      const progress = offset / 2.4; // 0 to 1
      const scale = 1 + progress * 2.5;
      const y = -2.5 + progress * 5.0;

      child.position.y = y;
      child.scale.set(scale, scale * 0.5, scale);

      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - progress) * 0.35;
      }
    });
  });

  return (
    <group ref={waveGroupRef} position={[0, -1, -1]}>
      {waveRings.map((id) => (
        <mesh key={id} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// Internal Scene Composition
// ==========================================

interface SceneInternalProps {
  weatherCode: number;
  isDay: boolean;
  tempC: number;
  riskCategory: string;
  quality: QualityTier;
  interactive: boolean;
}

function WeatherScene({
  weatherCode,
  isDay,
  tempC,
  riskCategory,
  quality,
  interactive,
}: SceneInternalProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const targetTilt = useRef({ x: 0, y: 0 });

  // Interpret weather state
  const isNight = !isDay;
  const isExtremeHeat =
    tempC >= 38 ||
    riskCategory === 'extreme' ||
    riskCategory === 'critical' ||
    riskCategory === 'high';
  const isRain =
    (weatherCode >= 50 && weatherCode <= 69) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99);
  const isCloudy =
    !isRain && (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48);
  const isSunny = !isNight && !isRain && !isCloudy;

  // Mouse tilt interaction
  useEffect(() => {
    if (!interactive || typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetTilt.current.x = ny * 0.08;
      targetTilt.current.y = nx * 0.12;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  useFrame((_, delta) => {
    if (rootGroupRef.current && interactive) {
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        targetTilt.current.x,
        delta * 3
      );
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        targetTilt.current.y,
        delta * 3
      );
    }
  });

  // Lighting parameters
  const ambientProps = useMemo(() => {
    if (isNight) return { color: '#0f172a', intensity: 0.4 };
    if (isRain) return { color: '#64748b', intensity: 0.5 };
    if (isCloudy) return { color: '#94a3b8', intensity: 0.7 };
    if (isExtremeHeat) return { color: '#ffedd5', intensity: 1.0 };
    return { color: '#fef3c7', intensity: 0.85 };
  }, [isNight, isRain, isCloudy, isExtremeHeat]);

  const dirLightProps = useMemo(() => {
    if (isNight) return { position: [-4, 6, 2] as [number, number, number], color: '#93c5fd', intensity: 0.8 };
    if (isRain) return { position: [2, 6, 2] as [number, number, number], color: '#cbd5e1', intensity: 0.6 };
    if (isCloudy) return { position: [3, 7, 2] as [number, number, number], color: '#e2e8f0', intensity: 0.8 };
    if (isExtremeHeat) return { position: [4, 6, 3] as [number, number, number], color: '#ea580c', intensity: 2.2 };
    return { position: [4, 6, 3] as [number, number, number], color: '#f59e0b', intensity: 1.6 };
  }, [isNight, isRain, isCloudy, isExtremeHeat]);

  const shimmerCount = quality === 'high' ? 350 : quality === 'medium' ? 150 : 60;
  const rainCount = quality === 'high' ? 400 : quality === 'medium' ? 200 : 80;

  return (
    <group ref={rootGroupRef}>
      <ambientLight color={ambientProps.color} intensity={ambientProps.intensity} />
      <directionalLight
        position={dirLightProps.position}
        color={dirLightProps.color}
        intensity={dirLightProps.intensity}
      />

      {/* Sunny or Heat Sun Halo */}
      {isSunny && <SunHaloMesh isExtremeHeat={isExtremeHeat} />}

      {/* Floating gentle heat shimmer */}
      {(isSunny || isExtremeHeat) && (
        <ShimmerParticles count={shimmerCount} isExtreme={isExtremeHeat} />
      )}

      {/* Cloudy Sky layers */}
      {(isCloudy || (isRain && quality !== 'low')) && <CloudLayers />}

      {/* Rain system */}
      {isRain && <RainSystem count={rainCount} />}

      {/* Night Sky & Stars */}
      {isNight && <NightSkySystem count={shimmerCount} />}

      {/* Extreme Heat Waves */}
      {isExtremeHeat && <ThermalHeatWaves />}
    </group>
  );
}

// ==========================================
// Graceful 2D Fallback Component
// ==========================================

export const WeatherAtmosphere2DFallback: React.FC<WeatherAtmosphere3DProps> = ({
  weatherCode = 0,
  isDay = true,
  tempC = 30,
  riskCategory = 'moderate',
  className = '',
  style,
}) => {
  const isNight = !isDay;
  const isExtreme = tempC >= 38 || riskCategory === 'extreme' || riskCategory === 'critical';
  const isRain =
    (weatherCode >= 50 && weatherCode <= 69) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99);
  const isCloudy = !isRain && (weatherCode >= 2 && weatherCode <= 48);

  const bgGradient = useMemo(() => {
    if (isNight) return 'from-slate-950 via-indigo-950 to-slate-900';
    if (isExtreme) return 'from-amber-950 via-rose-950/80 to-slate-950';
    if (isRain) return 'from-slate-900 via-blue-950 to-slate-900';
    if (isCloudy) return 'from-slate-800 via-slate-700/60 to-slate-900';
    return 'from-amber-500/10 via-orange-500/5 to-slate-950';
  }, [isNight, isExtreme, isRain, isCloudy]);

  return (
    <div
      className={`relative w-full h-full min-h-[160px] overflow-hidden rounded-xl bg-gradient-to-b ${bgGradient} flex items-center justify-center pointer-events-none select-none ${className}`}
      style={style}
    >
      {/* Visual glowing aura */}
      <div
        className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 animate-pulse ${
          isExtreme
            ? 'bg-rose-500'
            : isNight
            ? 'bg-blue-600'
            : isRain
            ? 'bg-cyan-600'
            : isCloudy
            ? 'bg-slate-400'
            : 'bg-amber-400'
        }`}
      />

      {/* SVG Iconography & Indicators */}
      <div className="relative z-10 flex flex-col items-center gap-2 text-center text-xs text-white/70">
        <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-lg">
          {isNight ? (
            <span className="text-xl">🌙</span>
          ) : isRain ? (
            <span className="text-xl">🌧️</span>
          ) : isCloudy ? (
            <span className="text-xl">☁️</span>
          ) : isExtreme ? (
            <span className="text-xl animate-bounce">🔥</span>
          ) : (
            <span className="text-xl">☀️</span>
          )}
        </div>
        <div className="font-semibold tracking-wide uppercase text-[10px] text-white/60">
          {isExtreme
            ? 'Extreme Heat'
            : isNight
            ? 'Clear Night'
            : isRain
            ? 'Precipitation'
            : isCloudy
            ? 'Overcast'
            : 'Clear Sky'}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main WeatherAtmosphere3D Component
// ==========================================

export const WeatherAtmosphere3D: React.FC<WeatherAtmosphere3DProps> = ({
  weatherCode = 0,
  isDay = true,
  tempC = 30,
  riskCategory = 'moderate',
  quality: overrideQuality,
  className = '',
  style,
  interactive = true,
  showTelemetry = false,
}) => {
  const qualityConfig = useThreeQuality(overrideQuality);
  const effectiveQuality = qualityConfig.quality;

  // Fallback to 2D view if WebGL is unavailable or quality tier is 'fallback_2d'
  if (effectiveQuality === 'fallback_2d' || !qualityConfig.isWebGLSupported) {
    return (
      <WeatherAtmosphere2DFallback
        weatherCode={weatherCode}
        isDay={isDay}
        tempC={tempC}
        riskCategory={riskCategory}
        className={className}
        style={style}
      />
    );
  }

  // Dynamic background style based on time and heat
  const isNight = !isDay;
  const isExtreme = tempC >= 38 || riskCategory === 'extreme' || riskCategory === 'critical';
  const isRain =
    (weatherCode >= 50 && weatherCode <= 69) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99);
  const isCloudy = !isRain && (weatherCode >= 2 && weatherCode <= 48);

  const containerBg = isNight
    ? 'bg-gradient-to-b from-[#060b18] via-[#091224] to-[#040711]'
    : isExtreme
    ? 'bg-gradient-to-b from-[#2a0b06] via-[#1a0805] to-[#0d0403]'
    : isRain
    ? 'bg-gradient-to-b from-[#0b1322] via-[#0e192c] to-[#070b14]'
    : isCloudy
    ? 'bg-gradient-to-b from-[#111827] via-[#1e293b] to-[#0f172a]'
    : 'bg-gradient-to-b from-[#1e1509] via-[#15100a] to-[#0c0906]';

  return (
    <div
      className={`relative w-full h-full min-h-[200px] overflow-hidden ${containerBg} ${className}`}
      style={style}
    >
      <ThreeErrorBoundary
        fallback={
          <WeatherAtmosphere2DFallback
            weatherCode={weatherCode}
            isDay={isDay}
            tempC={tempC}
            riskCategory={riskCategory}
            className={className}
            style={style}
          />
        }
      >
        <Canvas
          camera={{ position: [0, 0, 7.5], fov: 50 }}
          dpr={qualityConfig.dpr}
          gl={{
            antialias: effectiveQuality !== 'low',
            alpha: true,
            powerPreference: 'high-performance',
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <WeatherScene
            weatherCode={weatherCode}
            isDay={isDay}
            tempC={tempC}
            riskCategory={riskCategory}
            quality={effectiveQuality}
            interactive={interactive}
          />
        </Canvas>
      </ThreeErrorBoundary>

      {/* Optional Telemetry Badge */}
      {showTelemetry && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80 flex items-center gap-1.5 pointer-events-none">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isExtreme
                ? 'bg-rose-500 animate-ping'
                : isRain
                ? 'bg-cyan-400'
                : isNight
                ? 'bg-indigo-400'
                : 'bg-amber-400'
            }`}
          />
          <span>{tempC.toFixed(1)}°C</span>
          <span className="text-white/40">|</span>
          <span className="capitalize">{riskCategory}</span>
        </div>
      )}
    </div>
  );
};
