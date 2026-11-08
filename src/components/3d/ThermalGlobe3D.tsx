import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Real-world high-heat vulnerability monitoring stations
interface HeatStation {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  level: 'extreme' | 'severe' | 'high';
  code: string;
}

const HEAT_STATIONS: HeatStation[] = [
  { name: 'New Delhi Hub', lat: 28.6139, lon: 77.2090, temp: 46.8, level: 'extreme', code: 'DEL-UHI-01' },
  { name: 'Ahmedabad Grid', lat: 23.0225, lon: 72.5714, temp: 45.4, level: 'extreme', code: 'AMD-UHI-04' },
  { name: 'Dubai Station', lat: 25.2048, lon: 55.2708, temp: 47.2, level: 'extreme', code: 'DXB-MET-02' },
  { name: 'Phoenix Array', lat: 33.4484, lon: -112.0740, temp: 44.9, level: 'severe', code: 'PHX-URB-09' },
  { name: 'Seville Sentinel', lat: 37.3891, lon: -5.9845, temp: 42.1, level: 'severe', code: 'SVQ-NDMA-03' },
  { name: 'Bangkok Sensor', lat: 13.7563, lon: 100.5018, temp: 41.5, level: 'high', code: 'BKK-MET-07' },
  { name: 'Cairo Outpost', lat: 30.0444, lon: 31.2357, temp: 43.8, level: 'severe', code: 'CAI-UHI-05' },
  { name: 'Tokyo Ward Node', lat: 35.6762, lon: 139.6503, temp: 38.6, level: 'high', code: 'TYO-MET-08' },
];

/**
 * Converts Latitude/Longitude to 3D Cartesian coordinates on a sphere
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

/**
 * Generates an ultra-crisp procedural Canvas Texture of the Earth with thermal heat islands
 */
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Deep oceanic abyss gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#020714');
  oceanGrad.addColorStop(0.3, '#040d24');
  oceanGrad.addColorStop(0.7, '#061332');
  oceanGrad.addColorStop(1, '#020712');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle latitude & longitude telemetry grid lines
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.12)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw stylized continental landmass approximations with high-contrast tech contours
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const drawLandmass = (points: [number, number][], fill = '#0a1734', stroke = '#1d3568') => {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(points[0][1]), toY(points[0][0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i][1]), toY(points[i][0]));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // 1. North America
  drawLandmass([
    [70, -165], [72, -130], [60, -90], [55, -60], [45, -60], 
    [25, -80], [15, -90], [10, -84], [16, -95], [25, -105], 
    [32, -117], [48, -125], [60, -140], [65, -168]
  ]);

  // 2. South America
  drawLandmass([
    [10, -75], [5, -50], [-5, -35], [-20, -40], [-40, -60], 
    [-55, -68], [-45, -75], [-20, -70], [-5, -80], [8, -78]
  ]);

  // 3. Europe
  drawLandmass([
    [70, 25], [60, 30], [55, 38], [45, 30], [36, 28], 
    [36, -5], [43, -9], [48, -4], [55, 8], [60, 5], [70, 20]
  ]);

  // 4. Africa
  drawLandmass([
    [35, -5], [36, 12], [30, 32], [12, 45], [0, 42], 
    [-20, 35], [-34, 20], [-30, 15], [-10, 12], [5, 2], 
    [5, -5], [15, -17], [30, -10]
  ]);

  // 5. Asia & Indian Subcontinent
  drawLandmass([
    [75, 40], [75, 175], [60, 160], [40, 130], [30, 122], 
    [22, 115], [10, 105], [5, 100], [15, 95], [22, 90], 
    [8, 77], [22, 70], [25, 60], [30, 50], [40, 45], 
    [55, 60], [60, 45]
  ]);

  // 6. Australia
  drawLandmass([
    [-12, 132], [-15, 145], [-25, 152], [-38, 145], [-35, 118], 
    [-22, 114], [-15, 125]
  ]);

  // 7. Antarctica strip
  drawLandmass([
    [-65, -180], [-65, 180], [-85, 180], [-85, -180]
  ], '#051026', '#142a54');

  // Urban Thermal Heat Bloom overlays (Simulating live heatwave hotspots)
  const addHeatBloom = (lat: number, lon: number, radiusPx: number, intensity: number) => {
    const x = toX(lon);
    const y = toY(lat);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radiusPx);
    grad.addColorStop(0, `rgba(255, 240, 160, ${0.9 * intensity})`);
    grad.addColorStop(0.2, `rgba(249, 115, 22, ${0.85 * intensity})`);
    grad.addColorStop(0.5, `rgba(239, 68, 68, ${0.65 * intensity})`);
    grad.addColorStop(0.8, `rgba(220, 38, 38, ${0.25 * intensity})`);
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
    ctx.fill();
  };

  // Intense thermal anomalies
  addHeatBloom(28.6, 77.2, 55, 1.0);  // Northern India / Delhi
  addHeatBloom(23.0, 72.5, 42, 0.9);  // Gujarat
  addHeatBloom(17.4, 78.4, 38, 0.85); // Telangana / Hyderabad
  addHeatBloom(25.2, 55.3, 50, 0.95); // Arabian Peninsula
  addHeatBloom(30.0, 31.2, 45, 0.85); // Egypt / Nile
  addHeatBloom(33.4, -112.0, 45, 0.9); // Arizona / Sonoran desert
  addHeatBloom(37.4, -5.9, 36, 0.8);  // Southern Spain
  addHeatBloom(13.7, 100.5, 38, 0.8); // SE Asia

  // Subtle telemetry radar dots
  ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.beginPath();
    ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates soft procedural clouds texture
 */
function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft misty cloud streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 25 + Math.random() * 65;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Pulsing Hotspot Marker on the globe surface
 */
function HotspotMarker({ station }: { station: HeatStation }) {
  const position = useMemo(() => latLonToVector3(station.lat, station.lon, 2.02), [station]);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const color = station.level === 'extreme' ? '#EF4444' : station.level === 'severe' ? '#F97316' : '#F59E0B';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 2 + station.lat;
    if (ringRef.current) {
      const scale = 1 + (Math.sin(t) * 0.5 + 0.5) * 1.6;
      ringRef.current.scale.set(scale, scale, scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = THREE.MathUtils.clamp(1.2 - scale * 0.5, 0, 0.8);
      }
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.2;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // Calculate orientation normal so rings align tangentially to the sphere
  const orientation = useMemo(() => {
    const normal = position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(up, normal);
    return quat;
  }, [position]);

  return (
    <group position={position} quaternion={orientation}>
      {/* Central Hotspot Core */}
      <mesh ref={coreRef} position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Pulsing shockwave ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.05, 0.08, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle vertical telemetry beam */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.004, 0.008, 0.3, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Orbiting HeatShield Satellite with tracking beacon
 */
function OrbitingSatellite({ radius, tiltX, speed, color = '#38BDF8' }: { radius: number; tiltX: number; speed: number; color?: string }) {
  const satelliteRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed;
    if (satelliteRef.current) {
      satelliteRef.current.position.x = Math.cos(angle) * radius;
      satelliteRef.current.position.z = Math.sin(angle) * radius;
    }
  });

  return (
    <group rotation={[tiltX, 0, 0]}>
      {/* Orbit trajectory line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.008, radius + 0.008, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting satellite node */}
      <group ref={satelliteRef}>
        <mesh>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh>
          <ringGeometry args={[0.06, 0.09, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Drifting Atmospheric Cloud & Space Particles
 */
function AtmosphericParticles({ count = 450 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sc[i] = Math.random() * 0.035 + 0.015;
    }
    return [pos, sc];
  }, [count]);

  useFrame(({ clock }, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-scale" count={count} array={scales} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#60A5FA"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Main 3D Globe with atmosphere and interactive mouse parallax
 */
function GlobeScene({
  isTransitioning = false,
  pointerPos
}: {
  isTransitioning?: boolean;
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const transitionStartRef = useRef<number | null>(null);

  const { camera } = useThree();

  const earthTexture = useMemo(() => createProceduralEarthTexture(), []);
  const cloudTexture = useMemo(() => createCloudTexture(), []);

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      earthTexture.dispose();
      cloudTexture.dispose();
    };
  }, [earthTexture, cloudTexture]);

  // Initial camera position (offset so the globe is beautifully visible on desktop & mobile)
  const defaultCamPos = useMemo(() => new THREE.Vector3(0.5, 0.2, 4.3), []);
  // Target zoom position for cinematic login success (focused on regional heat crisis station)
  const zoomTargetCamPos = useMemo(() => new THREE.Vector3(0.15, 0.05, 1.45), []);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();

    // 1. Slow, elegant base rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;

      // 2. Mouse Parallax: Smoothly lerp rotation based on mouse coordinates
      const targetParallaxX = pointerPos.current.y * 0.25;
      const targetParallaxY = pointerPos.current.x * 0.4;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetParallaxX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -targetParallaxY * 0.15, 0.05);
    }

    // 3. Clouds drift slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.12;
    }

    // 4. Cinematic 1.5-second camera zoom transition on login success
    if (isTransitioning) {
      if (transitionStartRef.current === null) {
        transitionStartRef.current = elapsed;
      }
      const animProgress = THREE.MathUtils.clamp((elapsed - transitionStartRef.current) / 1.5, 0, 1);
      
      // Smooth easeInOutCubic curve
      const t = animProgress < 0.5 
        ? 4 * animProgress * animProgress * animProgress 
        : 1 - Math.pow(-2 * animProgress + 2, 3) / 2;

      camera.position.lerpVectors(defaultCamPos, zoomTargetCamPos, t);

      // Rotate group toward Delhi / South Asia heat station
      if (groupRef.current) {
        const targetFocusY = -Math.PI * 0.5;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetFocusY, t * 0.08);
      }
    } else {
      // Normal state: smoothly hold default camera position
      camera.position.lerp(defaultCamPos, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Earth Base Sphere ────────────────────────────────────────── */}
      <mesh ref={earthMeshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.65}
          metalness={0.2}
          emissive="#1E3A8A"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* ── Telemetry Wireframe Shield (Digital Twin overlay) ───────── */}
      <mesh>
        <sphereGeometry args={[2.016, 36, 18]} />
        <meshBasicMaterial
          color="#38BDF8"
          wireframe
          transparent
          opacity={0.09}
        />
      </mesh>

      {/* ── Drifting Cloud / Heat Vapor Layer ───────────────────────── */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.036, 48, 48]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Outer Atmosphere Radiant Halo (Fresnel effect) ──────────── */}
      <mesh>
        <sphereGeometry args={[2.09, 48, 48]} />
        <meshBasicMaterial
          color="#1E60F2"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.18, 48, 48]} />
        <meshBasicMaterial
          color="#06B6D4"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Heat Monitoring Stations & Hotspot Beacons ──────────────── */}
      {HEAT_STATIONS.map((station) => (
        <HotspotMarker key={station.code} station={station} />
      ))}

      {/* ── Orbiting Thermal Satellites ─────────────────────────────── */}
      <OrbitingSatellite radius={2.65} tiltX={Math.PI / 5} speed={0.4} color="#38BDF8" />
      <OrbitingSatellite radius={2.85} tiltX={-Math.PI / 4.5} speed={-0.3} color="#F59E0B" />
    </group>
  );
}

export interface ThermalGlobe3DProps {
  isTransitioning?: boolean;
  className?: string;
}

/**
 * Full-screen 3D Climate Environment Component for HeatShield AI
 * Features:
 * - 3D Thermal Globe with continental terrain and live UHI heat blooms
 * - Responsive mouse parallax tracking
 * - Orbiting satellites & pulsing hotspot beacons
 * - 1.5s cinematic zoom transition on login success
 * - Safe WebGL detection with graceful CSS animated fallback
 */
export const ThermalGlobe3D: React.FC<ThermalGlobe3DProps> = ({
  isTransitioning = false,
  className = ''
}) => {
  const pointerPos = useRef({ x: 0, y: 0 });
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  // Check WebGL availability safely
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // Track mouse coordinates for gentle parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    pointerPos.current = {
      x: (e.clientX / innerWidth) * 2 - 1,
      y: -(e.clientY / innerHeight) * 2 + 1,
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
    >
      {hasWebGL ? (
        <Canvas
          camera={{ position: [0.5, 0.2, 4.3], fov: 42 }}
          dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          className="w-full h-full"
        >
          {/* Subtle Ambient & Dramatic Directional Lighting */}
          <ambientLight intensity={0.45} />
          {/* Main Solar Heat Vector */}
          <directionalLight position={[6, 3, 5]} intensity={1.8} color="#FFFFFF" />
          {/* Warm Solar Flare Rim light */}
          <pointLight position={[-6, 4, -3]} intensity={1.2} color="#F59E0B" />
          {/* Cool Deep Ocean fill light */}
          <pointLight position={[3, -5, -4]} intensity={0.9} color="#1E60F2" />

          {/* Atmospheric Particle Dust Field */}
          <AtmosphericParticles count={450} />

          {/* Floating World Scene */}
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
            <GlobeScene isTransitioning={isTransitioning} pointerPos={pointerPos} />
          </Float>
        </Canvas>
      ) : (
        /* CSS / SVG Fallback for low-end devices or disabled WebGL */
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#040814] via-[#091530] to-[#03060E]">
          <div className="relative w-[480px] h-[480px] rounded-full border border-blue-500/20 bg-blue-950/40 backdrop-blur-3xl shadow-[0_0_120px_rgba(30,96,242,0.35)] flex items-center justify-center animate-pulse">
            <div className="w-[360px] h-[360px] rounded-full border border-cyan-400/30 bg-gradient-to-tr from-blue-900/40 to-amber-500/20 flex items-center justify-center">
              <div className="w-[240px] h-[240px] rounded-full bg-gradient-to-br from-blue-600/30 to-red-500/20 blur-md" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-cyan-300 tracking-widest uppercase bg-slate-900/80 px-3 py-1 rounded-full border border-cyan-500/40">
                HeatShield 2D Safe Mode
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Vignette & Top/Bottom Gradient Fades */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/85 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />
    </div>
  );
};

export default ThermalGlobe3D;