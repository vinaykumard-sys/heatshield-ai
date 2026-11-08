import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { Thermometer, Flame, ShieldAlert, Sparkles, Sun, Droplets } from 'lucide-react';

export interface TemperatureOrb3DProps {
  /** Current ambient temperature in °C */
  temperature: number;
  /** Perceived "feels like" temperature in °C */
  feelsLike?: number;
  /** Risk category matching the Action Engine */
  riskCategory?: 'low' | 'moderate' | 'high' | 'critical' | 'extreme' | string;
  /** Numerical risk index (0 - 100) */
  riskScore?: number;
  /** Weather condition label (e.g. 'Sunny', 'High Heat Flux') */
  condition?: string;
  /** Locality or city name to display */
  localityName?: string;
  /** Size/width of the component container (default: '100%') */
  size?: number | string;
  /** Height of the component container (default: 320) */
  height?: number | string;
  /** Whether to show the floating glass HUD telemetry card (default: true) */
  showHud?: boolean;
  /** Enable mouse parallax / interactive rotation (default: true) */
  interactive?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Click handler for quick actions or opening modal */
  onClick?: () => void;
}

// Check WebGL context availability safely
function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Color and pulse config for each thermal category
interface OrbTheme {
  primary: string;
  secondary: string;
  emissive: string;
  ambientLight: string;
  pointLight: string;
  ringColor: string;
  outerGlow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  pulseSpeed: number;
  particleColor: string;
}

const ORB_THEMES: Record<string, OrbTheme> = {
  low: {
    primary: '#10B981',
    secondary: '#06B6D4',
    emissive: '#047857',
    ambientLight: '#ECFDF5',
    pointLight: '#34D399',
    ringColor: '#6EE7B7',
    outerGlow: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'LOW RISK',
    badgeBorder: 'border-emerald-200',
    pulseSpeed: 1.0,
    particleColor: '#6EE7B7'
  },
  moderate: {
    primary: '#F59E0B',
    secondary: '#EAB308',
    emissive: '#B45309',
    ambientLight: '#FFFBEB',
    pointLight: '#FBBF24',
    ringColor: '#FDE68A',
    outerGlow: 'rgba(245, 158, 11, 0.28)',
    badgeBg: 'bg-amber-50 text-amber-800',
    badgeText: 'MODERATE RISK',
    badgeBorder: 'border-amber-200',
    pulseSpeed: 1.4,
    particleColor: '#FDE68A'
  },
  high: {
    primary: '#F97316',
    secondary: '#EA580C',
    emissive: '#C2410C',
    ambientLight: '#FFF7ED',
    pointLight: '#FB923C',
    ringColor: '#FED7AA',
    outerGlow: 'rgba(249, 115, 22, 0.32)',
    badgeBg: 'bg-orange-50 text-orange-700',
    badgeText: 'HIGH RISK',
    badgeBorder: 'border-orange-200',
    pulseSpeed: 2.0,
    particleColor: '#FB923C'
  },
  critical: {
    primary: '#EF4444',
    secondary: '#DC2626',
    emissive: '#991B1B',
    ambientLight: '#FEF2F2',
    pointLight: '#F87171',
    ringColor: '#FECACA',
    outerGlow: 'rgba(239, 68, 68, 0.38)',
    badgeBg: 'bg-red-50 text-red-700',
    badgeText: 'CRITICAL RISK',
    badgeBorder: 'border-red-200',
    pulseSpeed: 2.8,
    particleColor: '#F87171'
  },
  extreme: {
    primary: '#DC2626',
    secondary: '#991B1B',
    emissive: '#7F1D1D',
    ambientLight: '#FEF2F2',
    pointLight: '#EF4444',
    ringColor: '#FECDD3',
    outerGlow: 'rgba(220, 38, 38, 0.45)',
    badgeBg: 'bg-rose-100 text-rose-800',
    badgeText: 'EXTREME RISK',
    badgeBorder: 'border-rose-300',
    pulseSpeed: 3.4,
    particleColor: '#FB7185'
  }
};

/**
 * Procedural 3D Thermal Orb with Coronal Plasma Rings & Orbiting Thermal Flares
 */
function FloatingThermalOrb({
  theme,
  tempC
}: {
  theme: OrbTheme;
  tempC: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Dynamic particle cloud orbiting the thermal core
  const particleCount = 70;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.6 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  // Animate thermal pulsation, coronal gyro-rings, and plasma swirl
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime() * theme.pulseSpeed;

    // Core organic pulsating breath
    if (coreRef.current) {
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.04;
      coreRef.current.scale.set(pulse, pulse, pulse);
      coreRef.current.rotation.y += delta * 0.25;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }

    // Outer plasma atmosphere breathing
    if (atmosphereRef.current) {
      const atmoPulse = 1.15 + Math.sin(t * 2.0 + 1.2) * 0.05;
      atmosphereRef.current.scale.set(atmoPulse, atmoPulse, atmoPulse);
      atmosphereRef.current.rotation.y -= delta * 0.15;
    }

    // Coronal rings spinning on distinct axes like a gyro-shield
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.6;
      ring1Ref.current.rotation.x = 0.5 + Math.sin(t) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.8;
      ring2Ref.current.rotation.z = -0.4 + Math.cos(t * 0.8) * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 0.5;
      ring3Ref.current.rotation.y += delta * 0.4;
    }

    // Floating particles drift and swirl
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.18;
      particlesRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
    }
  });

  return (
    <Float speed={2.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group>
        {/* Central Core Thermal Sphere */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[1.1, 48, 48]} />
          <meshStandardMaterial
            color={theme.primary}
            emissive={theme.emissive}
            emissiveIntensity={0.65}
            roughness={0.15}
            metalness={0.3}
          />
        </mesh>

        {/* Semi-transparent Coronal Plasma Atmosphere */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial
            color={theme.secondary}
            emissive={theme.primary}
            emissiveIntensity={0.35}
            transparent={true}
            opacity={0.38}
            roughness={0.1}
            wireframe={false}
          />
        </mesh>

        {/* Coronal Ring 1: Primary Equator Ring */}
        <mesh ref={ring1Ref} rotation={[0.4, 0.2, 0]}>
          <torusGeometry args={[1.65, 0.022, 16, 80]} />
          <meshStandardMaterial
            color={theme.ringColor}
            emissive={theme.primary}
            emissiveIntensity={0.8}
            transparent={true}
            opacity={0.75}
          />
        </mesh>

        {/* Coronal Ring 2: Tilted Gyro-Ring */}
        <mesh ref={ring2Ref} rotation={[-0.6, 0.3, 0.5]}>
          <torusGeometry args={[1.85, 0.016, 16, 80]} />
          <meshStandardMaterial
            color={theme.secondary}
            emissive={theme.secondary}
            emissiveIntensity={0.6}
            transparent={true}
            opacity={0.6}
          />
        </mesh>

        {/* Coronal Ring 3: Distant Thin Halo */}
        <mesh ref={ring3Ref} rotation={[1.1, -0.4, 0.2]}>
          <torusGeometry args={[2.08, 0.012, 16, 64]} />
          <meshStandardMaterial
            color={theme.ringColor}
            emissive={theme.primary}
            emissiveIntensity={0.4}
            transparent={true}
            opacity={0.45}
          />
        </mesh>

        {/* Orbiting Thermal Sparks / Solar Dust Particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particlePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            color={theme.particleColor}
            transparent={true}
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </Float>
  );
}

/**
 * Elegant 2D Fallback for environments where WebGL is unsupported or reduced-motion is requested.
 */
function Fallback2DOrb({
  temperature,
  feelsLike,
  theme,
  riskCategory
}: {
  temperature: number;
  feelsLike?: number;
  theme: OrbTheme;
  riskCategory: string;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div 
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center text-center shadow-xl relative transition-all"
        style={{
          background: `radial-gradient(circle at 35% 35%, #FFFFFF 0%, ${theme.primary} 45%, ${theme.secondary} 100%)`,
          boxShadow: `0 0 35px ${theme.outerGlow}`
        }}
      >
        <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-md tracking-tighter">
          {Math.round(temperature)}°C
        </span>
        {feelsLike !== undefined && (
          <span className="text-xs font-bold text-white/90 drop-shadow-sm mt-0.5">
            Feels like {Math.round(feelsLike)}°C
          </span>
        )}
        <div className="absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white shadow-md border border-slate-200 text-slate-800">
          {theme.badgeText}
        </div>
      </div>
    </div>
  );
}

export const TemperatureOrb3D: React.FC<TemperatureOrb3DProps> = ({
  temperature,
  feelsLike,
  riskCategory = 'moderate',
  riskScore = 50,
  condition = 'Active Telemetry',
  localityName,
  size = '100%',
  height = 320,
  showHud = true,
  interactive = true,
  className = '',
  onClick
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    setHasWebGL(isWebGLSupported());
  }, []);

  const normalizedCategory = useMemo(() => {
    const cat = (riskCategory || 'moderate').toLowerCase();
    if (cat.includes('extreme')) return 'extreme';
    if (cat.includes('critical')) return 'critical';
    if (cat.includes('high')) return 'high';
    if (cat.includes('low')) return 'low';
    return 'moderate';
  }, [riskCategory]);

  const theme = ORB_THEMES[normalizedCategory] || ORB_THEMES.moderate;
  const feelsLikeVal = feelsLike ?? (temperature + 2);
  const delta = Math.round(feelsLikeVal - temperature);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative rounded-3xl overflow-hidden border border-slate-100 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 shadow-sm shadow-blue-500/5 group select-none ${
        onClick ? 'cursor-pointer hover:border-blue-300 transition-all duration-200' : ''
      } ${className}`}
      style={{ width: size, height }}
    >
      {/* Background radial glow matching the thermal intensity */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-40 group-hover:opacity-60"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.outerGlow} 0%, transparent 68%)`
        }}
      />

      {/* 3D WebGL Canvas or 2D graceful fallback */}
      {hasWebGL ? (
        <Canvas
          camera={{ position: [0, 0, 4.4], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          className="w-full h-full"
        >
          {/* Natural & Thermal Accent Lighting */}
          <ambientLight intensity={0.8} color={theme.ambientLight} />
          <directionalLight position={[4, 5, 4]} intensity={1.6} color="#FFFFFF" />
          <pointLight position={[-4, -3, 2]} intensity={1.2} color={theme.pointLight} />
          <pointLight position={[0, 4, -2]} intensity={0.6} color={theme.ringColor} />

          {/* The 3D Thermal Orb */}
          <FloatingThermalOrb theme={theme} tempC={temperature} />
        </Canvas>
      ) : (
        <Fallback2DOrb
          temperature={temperature}
          feelsLike={feelsLikeVal}
          theme={theme}
          riskCategory={normalizedCategory}
        />
      )}

      {/* Prominent Overlay HUD: Temperature + Feels Like + Live Heat Risk Badge */}
      {showHud && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
          {/* Top Bar: Locality / Condition & Risk Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              {localityName && (
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  {localityName}
                </span>
              )}
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{condition}</span>
              </span>
            </div>

            {/* Glowing Live Risk Badge */}
            <div className={`px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider shadow-2xs flex items-center gap-1.5 ${theme.badgeBg} ${theme.badgeBorder}`}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
              <span>{theme.badgeText}</span>
            </div>
          </div>

          {/* Bottom Bar: Huge Centered Temperature + Feels Like Indicator */}
          <div className="flex items-end justify-between gap-3 bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-slate-200/60 shadow-2xs">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                {Math.round(temperature)}°C
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Air Temp
              </span>
            </div>

            <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                <span>Feels {Math.round(feelsLikeVal)}°C</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {delta >= 0 ? `+${delta}°C` : `${delta}°C`} humidity index
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
