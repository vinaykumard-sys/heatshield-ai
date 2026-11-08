import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Sun, 
  Trees, 
  Droplets, 
  Flame, 
  MapPin, 
  Layers, 
  Crosshair, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Navigation,
  Eye,
  Info
} from 'lucide-react';
import { HeatSafeRoute, CoolingCentre, PublicWaterPoint } from '../../types';

// ============================================================================
// Types & Projection Helpers
// ============================================================================

export interface RouteScene3DProps {
  routes: HeatSafeRoute[];
  selectedRouteId: string;
  onSelectRoute?: (routeId: string) => void;
  startPlace?: string;
  endPlace?: string;
  coolingCentres?: CoolingCentre[];
  waterPoints?: PublicWaterPoint[];
  travelMode?: 'walk' | 'cycle' | 'drive';
  departureTimeHour?: number; // 0 - 23
  className?: string;
  height?: string | number;
  showHeatIslandsDefault?: boolean;
  showBuildingsDefault?: boolean;
  onSelectStation?: (station: CoolingCentre | PublicWaterPoint) => void;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
}

const SCENE_SPAN = 38; // Target bounding scale in 3D units

// Projects GPS lat/lon to tangent plane ENU coordinates (X = East, Z = -North)
function projectGps(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  scale: number
): [number, number, number] {
  const x = (lon - centerLon) * 111320 * Math.cos((centerLat * Math.PI) / 180) * scale;
  const z = -(lat - centerLat) * 111320 * scale;
  return [x, 0, z];
}

// Route profile styling configuration
const PROFILE_COLORS = {
  low_heat_exposure: {
    primary: '#10B981', // Emerald
    emissive: '#059669',
    glow: '#34D399',
    label: 'Coolest Corridor (Canopy)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Trees,
    shadowColor: '#064E3B'
  },
  shortest: {
    primary: '#F97316', // Amber / Flame
    emissive: '#EA580C',
    glow: '#FB923C',
    label: 'Fastest Direct (Arterial)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Flame,
    shadowColor: '#7C2D12'
  },
  respite_optimized: {
    primary: '#06B6D4', // Cyan / Aqua
    emissive: '#0891B2',
    glow: '#38BDF8',
    label: 'Water & Respite Corridor',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Droplets,
    shadowColor: '#164E63'
  }
};

// ============================================================================
// 1. Camera Controller with Smooth Framing & Presets
// ============================================================================

interface CameraControllerProps {
  bounds: { center: [number, number, number]; radius: number };
  viewPreset: 'iso' | 'top' | 'horizon';
  resetSignal: number;
}

function CameraController({ bounds, viewPreset, resetSignal }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetCamPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isTransitioning = useRef(true);

  useEffect(() => {
    const { center, radius } = bounds;
    const [cx, cy, cz] = center;
    targetLookAt.current.set(cx, cy, cz);

    const safeRadius = Math.max(10, Math.min(65, radius));

    if (viewPreset === 'top') {
      // Top Down: bird's-eye 90 degree plan view directly above the route
      targetCamPos.current.set(cx, cy + safeRadius * 2.3, cz + 0.001);
    } else if (viewPreset === 'horizon') {
      // Horizon: street-level forward horizon framing the route
      targetCamPos.current.set(cx, cy + Math.max(2.5, safeRadius * 0.28), cz + safeRadius * 1.05);
    } else {
      // 3D Iso: cinematic perspective isometric framing
      targetCamPos.current.set(cx + safeRadius * 1.15, cy + safeRadius * 1.35, cz + safeRadius * 1.25);
    }

    isTransitioning.current = true;
  }, [bounds, viewPreset, resetSignal]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    const lerpFactor = Math.min(1, delta * 3.8);
    camera.position.lerp(targetCamPos.current, lerpFactor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
      controlsRef.current.update();
    }

    if (camera.position.distanceTo(targetCamPos.current) < 0.08) {
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      onStart={() => {
        isTransitioning.current = false;
      }}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2.05} // prevent going underneath ground
      autoRotate={false}
      makeDefault
    />
  );
}

// ============================================================================
// 2. Animated Glowing Route Polyline with Flowing Energy Particle
// ============================================================================

interface RouteMeshProps {
  route: HeatSafeRoute;
  isSelected: boolean;
  onSelect?: () => void;
  scaleFactor: number;
  centerLat: number;
  centerLon: number;
}

function GlowingRoutePolyline({
  route,
  isSelected,
  onSelect,
  scaleFactor,
  centerLat,
  centerLon
}: RouteMeshProps) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const glowOuterRef = useRef<THREE.Mesh>(null);

  // Generate 3D Vector3 points from real road geometry
  const points = useMemo(() => {
    if (!route.coordinates || route.coordinates.length < 2) return [];

    const pts: THREE.Vector3[] = [];
    route.coordinates.forEach(([lat, lon]) => {
      const [x, , z] = projectGps(lat, lon, centerLat, centerLon, scaleFactor);
      // Strictly hug road level (no artificial upward parabolic dome)
      pts.push(new THREE.Vector3(x, 0.08, z));
    });

    // Remove microscopic duplicate points
    const filtered: THREE.Vector3[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].distanceTo(filtered[filtered.length - 1]) > 0.02) {
        filtered.push(pts[i]);
      }
    }
    return filtered;
  }, [route.coordinates, scaleFactor, centerLat, centerLon]);

  // Construct piecewise linear curve path following actual street turns and intersections
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < points.length - 1; i++) {
      path.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }
    return path;
  }, [points]);

  // Styling based on route profile
  const style = PROFILE_COLORS[route.route_type] || PROFILE_COLORS.shortest;

  // Animate the traveling energy pulse bead along the curve
  useFrame((state) => {
    if (!curve) return;

    if (isSelected && pulseRef.current) {
      const t = (state.clock.elapsedTime * (route.route_type === 'shortest' ? 0.25 : 0.18)) % 1;
      const pos = curve.getPointAt(t);
      pulseRef.current.position.copy(pos);
      pulseRef.current.position.y += 0.08;

      // Pulsing scale
      const s = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.18;
      pulseRef.current.scale.set(s, s, s);
    }

    if (glowOuterRef.current && isSelected) {
      const p = 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
      (glowOuterRef.current.material as THREE.MeshStandardMaterial).opacity = p;
    }
  });

  if (!curve) return null;

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {/* 1. Underlying Dark Road Bed Ribbon */}
      <mesh position={[0, -0.04, 0]}>
        <tubeGeometry args={[curve, Math.min(300, points.length * 4), isSelected ? 0.36 : 0.22, 6, false]} />
        <meshStandardMaterial
          color="#0B1329"
          roughness={0.9}
          metalness={0.2}
          transparent={true}
          opacity={isSelected ? 0.85 : 0.4}
        />
      </mesh>

      {/* 2. Core Glowing Neon Tube */}
      <mesh position={[0, 0.02, 0]}>
        <tubeGeometry args={[curve, Math.min(300, points.length * 4), isSelected ? 0.18 : 0.10, 8, false]} />
        <meshStandardMaterial
          color={style.primary}
          emissive={style.emissive}
          emissiveIntensity={isSelected ? 2.2 : 0.6}
          roughness={0.15}
          metalness={0.8}
          transparent={!isSelected}
          opacity={isSelected ? 1 : 0.45}
        />
      </mesh>

      {/* 3. Outer Volumetric Atmosphere Glow Tube (Selected Only) */}
      {isSelected && (
        <mesh ref={glowOuterRef} position={[0, 0.02, 0]}>
          <tubeGeometry args={[curve, Math.min(240, points.length * 3), 0.42, 6, false]} />
          <meshStandardMaterial
            color={style.glow}
            emissive={style.primary}
            emissiveIntensity={0.8}
            transparent={true}
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 4. Moving Energy Drone Bead (Selected Only) */}
      {isSelected && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={style.glow}
            emissiveIntensity={4}
            roughness={0.1}
          />
          {/* Inner Light Source */}
          <pointLight color={style.primary} intensity={2.5} distance={4} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 3. Stylized Procedural City Block Terrain & Heat Islands
// ============================================================================

interface CityTerrainProps {
  bounds: { center: [number, number, number]; radius: number };
  activeRoute: HeatSafeRoute;
  showBuildings: boolean;
  showHeatIslands: boolean;
  scaleFactor: number;
  centerLat: number;
  centerLon: number;
}

function CityTerrain({
  bounds,
  activeRoute,
  showBuildings,
  showHeatIslands,
  scaleFactor,
  centerLat,
  centerLon
}: CityTerrainProps) {
  const [cx, , cz] = bounds.center;
  const radius = Math.max(14, bounds.radius);

  // Pre-project route line segments for accurate road corridor clearance calculation
  const routeSegments = useMemo(() => {
    if (!activeRoute.coordinates || activeRoute.coordinates.length < 2) return [];
    const pts = activeRoute.coordinates.map(([lat, lon]) => {
      const [x, , z] = projectGps(lat, lon, centerLat, centerLon, scaleFactor);
      return [x, z] as [number, number];
    });

    const segs: Array<{ x1: number; z1: number; x2: number; z2: number }> = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push({
        x1: pts[i][0],
        z1: pts[i][1],
        x2: pts[i + 1][0],
        z2: pts[i + 1][1]
      });
    }
    return segs;
  }, [activeRoute.coordinates, centerLat, centerLon, scaleFactor]);

  // Generate procedural city blocks flanking the route area
  const buildings = useMemo(() => {
    if (!showBuildings) return [];

    const blocks: Array<{
      id: number;
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      color: string;
      hasAntenna: boolean;
    }> = [];

    // Deterministic pseudo-random based on grid coordinate
    const gridSize = Math.ceil(radius * 1.5);
    const step = 4.2;
    const CLEARANCE_THRESHOLD_SQ = 1.4 * 1.4; // Strict 1.4 units minimum clearance to route segments

    let id = 0;
    for (let x = cx - gridSize; x <= cx + gridSize; x += step) {
      for (let z = cz - gridSize; z <= cz + gridSize; z += step) {
        // Jitter position
        const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        const rand = (seed - Math.floor(seed));

        if (rand < 0.38) continue; // create realistic street corridors / open spaces

        const jx = x + (rand - 0.5) * 1.8;
        const jz = z + ((rand * 3.1) % 1 - 0.5) * 1.8;

        // Ensure procedural buildings are not rendered within 1.4 units of any route segment points
        let isTooCloseToRoad = false;
        for (let s = 0; s < routeSegments.length; s++) {
          const seg = routeSegments[s];
          const dx = seg.x2 - seg.x1;
          const dz = seg.z2 - seg.z1;
          const l2 = dx * dx + dz * dz;

          let distSq: number;
          if (l2 === 0) {
            const ex = jx - seg.x1;
            const ez = jz - seg.z1;
            distSq = ex * ex + ez * ez;
          } else {
            let t = ((jx - seg.x1) * dx + (jz - seg.z1) * dz) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = seg.x1 + t * dx;
            const projZ = seg.z1 + t * dz;
            const ex = jx - projX;
            const ez = jz - projZ;
            distSq = ex * ex + ez * ez;
          }

          if (distSq < CLEARANCE_THRESHOLD_SQ) {
            isTooCloseToRoad = true;
            break;
          }
        }

        if (isTooCloseToRoad) continue;

        // Height variation
        const heightMultiplier = 1 - Math.min(1, Math.hypot(jx - cx, jz - cz) / (gridSize * 1.2));
        const h = Math.max(1.2, (rand * 6.5 + 1.2) * (0.6 + heightMultiplier * 0.8));
        const w = 1.6 + ((rand * 1.7) % 1) * 1.4;
        const d = 1.6 + ((rand * 2.3) % 1) * 1.4;

        // Subtle color tones: sleek dark slate glass, metallic navy
        const palette = ['#0F172A', '#1E293B', '#111E38', '#172554'];
        const color = palette[Math.floor(rand * palette.length)];

        blocks.push({
          id: id++,
          x: jx,
          z: jz,
          w,
          d,
          h,
          color,
          hasAntenna: rand > 0.85 && h > 4.5
        });

        if (blocks.length > 120) break; // performance limit
      }
      if (blocks.length > 120) break;
    }

    return blocks;
  }, [cx, cz, radius, showBuildings, routeSegments]);

  // Heat island zones (areas along unshaded arterial sectors)
  const heatIslandLocations = useMemo(() => {
    if (!showHeatIslands || !activeRoute.coordinates) return [];
    const zones: Array<{ x: number; z: number; temp: string; radius: number }> = [];

    // Sample midpoints of route with high heat score
    if (activeRoute.heat_exposure_score > 55) {
      const step = Math.max(6, Math.floor(activeRoute.coordinates.length / 3));
      for (let i = step; i < activeRoute.coordinates.length - 2; i += step) {
        const [x, , z] = projectGps(
          activeRoute.coordinates[i][0],
          activeRoute.coordinates[i][1],
          centerLat,
          centerLon,
          scaleFactor
        );
        zones.push({
          x: x + 1.2,
          z: z - 0.8,
          temp: `${(42.5 + (i % 3) * 1.8).toFixed(1)}°C`,
          radius: 3.5 + (i % 2) * 1.5
        });
      }
    }
    return zones;
  }, [showHeatIslands, activeRoute, centerLat, centerLon, scaleFactor]);

  // Shaded canopy zones (along coolest routes)
  const canopyZones = useMemo(() => {
    if (activeRoute.shade_coverage_pct < 50 || !activeRoute.coordinates) return [];
    const zones: Array<{ x: number; z: number; text: string; radius: number }> = [];

    const step = Math.max(5, Math.floor(activeRoute.coordinates.length / 3));
    for (let i = step; i < activeRoute.coordinates.length - 2; i += step) {
      const [x, , z] = projectGps(
        activeRoute.coordinates[i][0],
        activeRoute.coordinates[i][1],
        centerLat,
        centerLon,
        scaleFactor
      );
      zones.push({
        x: x - 0.9,
        z: z + 0.6,
        text: '-4.5°C Canopy',
        radius: 3.2
      });
    }
    return zones;
  }, [activeRoute, centerLat, centerLon, scaleFactor]);

  return (
    <group>
      {/* 1. Reflective Dark Ground Plane with Subtle Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.1, cz]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial
          color="#060A14"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* 2. Neon Coordinate Grid Helper */}
      <gridHelper
        args={[180, 90, '#1E3A8A', '#0F1E36']}
        position={[cx, -0.05, cz]}
      />

      {/* 3. Procedural City Block Buildings */}
      {showBuildings && buildings.map((b) => (
        <group key={b.id} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.color}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          {/* Glowing Rooftop Rim Edge */}
          <lineSegments position={[0, b.h / 2 + 0.02, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(b.w, 0.05, b.d)]} />
            <lineBasicMaterial color="#38BDF8" transparent opacity={0.35} />
          </lineSegments>
          {/* Spire / Antenna on high towers */}
          {b.hasAntenna && (
            <mesh position={[0, b.h / 2 + 0.7, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 1.4, 6]} />
              <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} />
            </mesh>
          )}
        </group>
      ))}

      {/* 4. Thermal Heat Island Domes */}
      {showHeatIslands && heatIslandLocations.map((zone, idx) => (
        <group key={`heat-${idx}`} position={[zone.x, 0.1, zone.z]}>
          {/* Pulsing Thermal Disc on Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[zone.radius, 32]} />
            <meshStandardMaterial
              color="#EF4444"
              emissive="#DC2626"
              emissiveIntensity={0.8}
              transparent
              opacity={0.32}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Volumetric Thermal Dome */}
          <mesh position={[0, zone.radius * 0.35, 0]}>
            <sphereGeometry args={[zone.radius * 0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#F97316"
              emissive="#EA580C"
              emissiveIntensity={0.5}
              transparent
              opacity={0.2}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* 3D Thermal Label */}
          <Html position={[0, zone.radius * 0.65, 0]} center distanceFactor={28} occlude={false}>
            <div className="pointer-events-none px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 backdrop-blur-md text-[10px] font-bold text-red-300 flex items-center gap-1 shadow-lg whitespace-nowrap">
              <Flame className="w-3 h-3 text-red-400 animate-pulse" />
              <span>Heat Island: {zone.temp}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* 5. Tree Canopy Respite Corridors */}
      {canopyZones.map((canopy, idx) => (
        <group key={`canopy-${idx}`} position={[canopy.x, 0.1, canopy.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[canopy.radius, 28]} />
            <meshStandardMaterial
              color="#10B981"
              emissive="#059669"
              emissiveIntensity={0.6}
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <Html position={[0, 1.4, 0]} center distanceFactor={28} occlude={false}>
            <div className="pointer-events-none px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 backdrop-blur-md text-[10px] font-bold text-emerald-300 flex items-center gap-1 shadow-lg whitespace-nowrap">
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>{canopy.text}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 4. Origin & Destination 3D Beacons
// ============================================================================

interface WaypointBeaconsProps {
  startPoint: [number, number, number] | null;
  endPoint: [number, number, number] | null;
  startPlace: string;
  endPlace: string;
}

function WaypointBeacons({ startPoint, endPoint, startPlace, endPlace }: WaypointBeaconsProps) {
  const startRingRef = useRef<THREE.Mesh>(null);
  const endRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (startRingRef.current) {
      startRingRef.current.rotation.z = t * 0.8;
      const s = 1 + Math.sin(t * 3) * 0.15;
      startRingRef.current.scale.set(s, s, s);
    }
    if (endRingRef.current) {
      endRingRef.current.rotation.z = -t * 0.8;
      const s = 1 + Math.cos(t * 3) * 0.15;
      endRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      {/* --- ORIGIN (START) BEACON --- */}
      {startPoint && (
        <group position={startPoint}>
          {/* Concentric Pulsing Base Ring */}
          <mesh ref={startRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.5, 1.0, 32]} />
            <meshStandardMaterial
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={2.5}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Vertical Laser Pillar */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.08, 0.15, 4.0, 16]} />
            <meshStandardMaterial
              color="#34D399"
              emissive="#10B981"
              emissiveIntensity={3}
              transparent
              opacity={0.5}
            />
          </mesh>

          {/* Floating Origin Pin / 3D HTML Badge */}
          <Html position={[0, 4.4, 0]} center distanceFactor={26}>
            <div className="flex flex-col items-center pointer-events-auto select-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border-2 border-emerald-400 backdrop-blur-md shadow-2xl flex items-center gap-1.5 text-white whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">START:</span>
                <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">{startPlace}</span>
              </div>
              <div className="w-0.5 h-3 bg-emerald-400" />
            </div>
          </Html>
        </group>
      )}

      {/* --- DESTINATION (GOAL) BEACON --- */}
      {endPoint && (
        <group position={endPoint}>
          {/* Concentric Pulsing Base Ring */}
          <mesh ref={endRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.5, 1.0, 32]} />
            <meshStandardMaterial
              color="#F59E0B"
              emissive="#D97706"
              emissiveIntensity={2.5}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Vertical Laser Pillar */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.08, 0.15, 4.0, 16]} />
            <meshStandardMaterial
              color="#FBBF24"
              emissive="#F59E0B"
              emissiveIntensity={3}
              transparent
              opacity={0.5}
            />
          </mesh>

          {/* Floating Destination Pin / 3D HTML Badge */}
          <Html position={[0, 4.4, 0]} center distanceFactor={26}>
            <div className="flex flex-col items-center pointer-events-auto select-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border-2 border-amber-400 backdrop-blur-md shadow-2xl flex items-center gap-1.5 text-white whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">DESTINATION:</span>
                <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">{endPlace}</span>
              </div>
              <div className="w-0.5 h-3 bg-amber-400" />
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// 5. 3D Cooling Shelters & Water Station Markers
// ============================================================================

interface StationMarkersProps {
  coolingCentres?: CoolingCentre[];
  waterPoints?: PublicWaterPoint[];
  bounds: { center: [number, number, number]; radius: number };
  scaleFactor: number;
  centerLat: number;
  centerLon: number;
  onSelectStation?: (station: CoolingCentre | PublicWaterPoint) => void;
}

function StationMarkers({
  coolingCentres = [],
  waterPoints = [],
  bounds,
  scaleFactor,
  centerLat,
  centerLon,
  onSelectStation
}: StationMarkersProps) {
  const [selectedStation, setSelectedStation] = useState<CoolingCentre | PublicWaterPoint | null>(null);

  // Filter stations within 3D bounding box radius
  const visibleCooling = useMemo(() => {
    return coolingCentres.slice(0, 10).map((c) => {
      const [x, , z] = projectGps(c.latitude, c.longitude, centerLat, centerLon, scaleFactor);
      return { data: c, pos: [x, 0.4, z] as [number, number, number] };
    });
  }, [coolingCentres, centerLat, centerLon, scaleFactor]);

  const visibleWater = useMemo(() => {
    return waterPoints.slice(0, 12).map((w) => {
      const [x, , z] = projectGps(w.latitude, w.longitude, centerLat, centerLon, scaleFactor);
      return { data: w, pos: [x, 0.35, z] as [number, number, number] };
    });
  }, [waterPoints, centerLat, centerLon, scaleFactor]);

  return (
    <group>
      {/* Cooling Shelter Domes */}
      {visibleCooling.map(({ data, pos }, idx) => (
        <group
          key={`cc-${data.id || idx}`}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStation(data);
            onSelectStation?.(data);
          }}
        >
          {/* 3D Shelter Dome Mesh */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
            <mesh position={[0, 0.6, 0]}>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial
                color="#0284C7"
                emissive="#0EA5E9"
                emissiveIntensity={2}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          </Float>

          {/* Pulsing Ground Halo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
            <ringGeometry args={[0.4, 0.8, 16]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.4} />
          </mesh>

          {/* Interactive Tag */}
          <Html position={[0, 1.6, 0]} center distanceFactor={24}>
            <button
              onClick={() => {
                setSelectedStation(data);
                onSelectStation?.(data);
              }}
              className="px-2 py-0.5 rounded-lg bg-sky-950/85 hover:bg-sky-900 border border-sky-400/60 backdrop-blur-md shadow-lg flex items-center gap-1 text-[10px] font-bold text-sky-200 transition-transform hover:scale-110"
            >
              <Building2 className="w-3 h-3 text-sky-400" />
              <span className="max-w-[90px] truncate">{data.name}</span>
            </button>
          </Html>
        </group>
      ))}

      {/* Water Kiosks */}
      {visibleWater.map(({ data, pos }, idx) => (
        <group
          key={`wp-${data.id || idx}`}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStation(data);
            onSelectStation?.(data);
          }}
        >
          {/* 3D Water Droplet / Crystal */}
          <Float speed={3} rotationIntensity={0.3} floatIntensity={0.5}>
            <mesh position={[0, 0.5, 0]}>
              <coneGeometry args={[0.3, 0.7, 8]} />
              <meshStandardMaterial
                color="#06B6D4"
                emissive="#22D3EE"
                emissiveIntensity={2.5}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>
          </Float>

          {/* Interactive Tag */}
          <Html position={[0, 1.4, 0]} center distanceFactor={24}>
            <button
              onClick={() => {
                setSelectedStation(data);
                onSelectStation?.(data);
              }}
              className="px-1.5 py-0.5 rounded-lg bg-cyan-950/85 hover:bg-cyan-900 border border-cyan-400/60 backdrop-blur-md shadow-lg flex items-center gap-1 text-[9px] font-bold text-cyan-200 transition-transform hover:scale-110"
            >
              <Droplets className="w-2.5 h-2.5 text-cyan-300" />
              <span className="max-w-[80px] truncate">{data.name}</span>
            </button>
          </Html>
        </group>
      ))}

      {/* Detail Popover Card when clicked */}
      {selectedStation && (
        <Html position={[0, 4, 0]} center>
          <div className="w-64 p-3 rounded-2xl bg-slate-900/95 border border-sky-400/60 backdrop-blur-xl shadow-2xl text-white select-none">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs uppercase tracking-wider">
                {'capacity_estimate' in selectedStation ? (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Cooling Respite Centre</span>
                  </>
                ) : (
                  <>
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Public Water Kiosk</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-1.5 font-bold text-sm text-slate-100">{selectedStation.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {'address' in selectedStation ? (selectedStation as any).address : selectedStation.locality_name}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              {'air_conditioned' in selectedStation && (selectedStation as any).air_conditioned && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                  ✓ Air Conditioned
                </span>
              )}
              {'water_quality_verified' in selectedStation && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold text-[10px]">
                  ✓ Clean Drinking Water
                </span>
              )}
              <span className="text-slate-400 text-[10px] ml-auto">
                {('operating_hours' in selectedStation ? (selectedStation as any).operating_hours : null) || 'Open Daily'}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 6. Dynamic Sunlight & Atmosphere based on Departure Time
// ============================================================================

interface DynamicLightingProps {
  departureHour: number; // 0 - 23
}

function DynamicLighting({ departureHour }: DynamicLightingProps) {
  const lightConfig = useMemo(() => {
    // 06:00 - 11:00 Morning Sun
    if (departureHour >= 6 && departureHour < 11) {
      return {
        sunPos: [25, 20, -15] as [number, number, number],
        sunColor: '#FED7AA',
        sunIntensity: 2.2,
        ambientColor: '#1E293B',
        ambientIntensity: 0.8
      };
    }
    // 11:00 - 15:30 Peak Midday Sun (Intense overhead solar radiation)
    if (departureHour >= 11 && departureHour < 16) {
      return {
        sunPos: [5, 45, 5] as [number, number, number],
        sunColor: '#FFFBEB',
        sunIntensity: 3.5,
        ambientColor: '#334155',
        ambientIntensity: 1.1
      };
    }
    // 16:00 - 19:00 Golden Hour / Late Afternoon
    if (departureHour >= 16 && departureHour < 19) {
      return {
        sunPos: [-30, 16, 20] as [number, number, number],
        sunColor: '#F59E0B',
        sunIntensity: 2.5,
        ambientColor: '#1E1B4B',
        ambientIntensity: 0.75
      };
    }
    // Night (19:00 - 05:00): Midnight Cool Mood with Streetlight Beacons
    return {
      sunPos: [0, 30, -20] as [number, number, number],
      sunColor: '#60A5FA',
      sunIntensity: 0.9,
      ambientColor: '#090D16',
      ambientIntensity: 0.55
    };
  }, [departureHour]);

  return (
    <>
      <ambientLight color={lightConfig.ambientColor} intensity={lightConfig.ambientIntensity} />
      <directionalLight
        position={lightConfig.sunPos}
        color={lightConfig.sunColor}
        intensity={lightConfig.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      {/* Cyan Rim Light for Cyber-Modern Contrast */}
      <pointLight position={[-25, -5, -25]} color="#06B6D4" intensity={1.2} />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT: RouteScene3D
// ============================================================================

export const RouteScene3D: React.FC<RouteScene3DProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  startPlace = 'Origin',
  endPlace = 'Destination',
  coolingCentres = [],
  waterPoints = [],
  travelMode = 'walk',
  departureTimeHour = 13,
  className = '',
  height = '620px',
  showHeatIslandsDefault = true,
  showBuildingsDefault = true,
  onSelectStation
}) => {
  // Scene HUD & View State
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'horizon'>('iso');
  const [showHeatIslands, setShowHeatIslands] = useState(showHeatIslandsDefault);
  const [showBuildings, setShowBuildings] = useState(showBuildingsDefault);
  const [resetSignal, setResetSignal] = useState(0);

  // Active route reference
  const activeRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // Compute geographical center and scale for coordinate normalization
  const geoBounds = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;

    routes.forEach((r) => {
      if (!r.coordinates) return;
      r.coordinates.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });
    });

    if (minLat === Infinity) {
      return {
        centerLat: 13.0600,
        centerLon: 77.6000,
        scaleFactor: 0.005,
        bounds3D: { center: [0, 0, 0] as [number, number, number], radius: 20 }
      };
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const latDistMeters = Math.max(200, (maxLat - minLat) * 111320);
    const lonDistMeters = Math.max(200, (maxLon - minLon) * 111320 * Math.cos((centerLat * Math.PI) / 180));
    const maxSpanMeters = Math.max(latDistMeters, lonDistMeters, 600);

    const scaleFactor = SCENE_SPAN / maxSpanMeters;

    // Calculate 3D bounding sphere
    let maxDist3D = 5;
    routes.forEach((r) => {
      r.coordinates?.forEach(([lat, lon]) => {
        const [x, , z] = projectGps(lat, lon, centerLat, centerLon, scaleFactor);
        const d = Math.hypot(x, z);
        if (d > maxDist3D) maxDist3D = d;
      });
    });

    return {
      centerLat,
      centerLon,
      scaleFactor,
      bounds3D: { center: [0, 0, 0] as [number, number, number], radius: maxDist3D + 4 }
    };
  }, [routes]);

  // Dynamically calculate camera bounds framing origin, entire road route, and destination
  const activeBounds = useMemo(() => {
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) {
      return geoBounds.bounds3D;
    }

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    activeRoute.coordinates.forEach(([lat, lon]) => {
      const [x, , z] = projectGps(lat, lon, geoBounds.centerLat, geoBounds.centerLon, geoBounds.scaleFactor);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.hypot(maxX - minX, maxZ - minZ);
    const radius = Math.max(span / 2 + 2, 8);

    return {
      center: [cx, 0, cz] as [number, number, number],
      radius
    };
  }, [activeRoute, geoBounds]);

  // Start & End Point in 3D (positioned at exact projected road level y=0.08)
  const { start3D, end3D } = useMemo(() => {
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length < 2) {
      return { start3D: null, end3D: null };
    }
    const startCoord = activeRoute.coordinates[0];
    const endCoord = activeRoute.coordinates[activeRoute.coordinates.length - 1];

    const [sx, , sz] = projectGps(startCoord[0], startCoord[1], geoBounds.centerLat, geoBounds.centerLon, geoBounds.scaleFactor);
    const [ex, , ez] = projectGps(endCoord[0], endCoord[1], geoBounds.centerLat, geoBounds.centerLon, geoBounds.scaleFactor);

    return {
      start3D: [sx, 0.08, sz] as [number, number, number],
      end3D: [ex, 0.08, ez] as [number, number, number]
    };
  }, [activeRoute, geoBounds]);

  const handleResetCamera = () => {
    setResetSignal((s) => s + 1);
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-[#060D1E] to-slate-950 border border-slate-800 shadow-2xl select-none ${className}`}
      style={{ height }}
    >
      {/* 3D Canvas Viewport */}
      <Canvas
        camera={{ position: [18, 22, 22], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Dynamic Sun & Atmosphere */}
        <DynamicLighting departureHour={departureTimeHour} />

        {/* Camera Framer & OrbitControls - bounds fitting to active route */}
        <CameraController
          bounds={activeBounds}
          viewPreset={viewPreset}
          resetSignal={resetSignal}
        />

        {/* Stylized Urban Terrain, City Blocks & Heat Islands */}
        {activeRoute && (
          <CityTerrain
            bounds={geoBounds.bounds3D}
            activeRoute={activeRoute}
            showBuildings={showBuildings}
            showHeatIslands={showHeatIslands}
            scaleFactor={geoBounds.scaleFactor}
            centerLat={geoBounds.centerLat}
            centerLon={geoBounds.centerLon}
          />
        )}

        {/* 3D Route Polylines (Renders all 3 profiles; active is highlighted) */}
        {routes.map((route) => (
          <GlowingRoutePolyline
            key={route.id}
            route={route}
            isSelected={route.id === selectedRouteId}
            onSelect={() => onSelectRoute?.(route.id)}
            scaleFactor={geoBounds.scaleFactor}
            centerLat={geoBounds.centerLat}
            centerLon={geoBounds.centerLon}
          />
        ))}

        {/* Origin & Destination Beacons */}
        <WaypointBeacons
          startPoint={start3D}
          endPoint={end3D}
          startPlace={startPlace}
          endPlace={endPlace}
        />

        {/* Verified Cooling & Hydration Station Markers */}
        <StationMarkers
          coolingCentres={coolingCentres}
          waterPoints={waterPoints}
          bounds={geoBounds.bounds3D}
          scaleFactor={geoBounds.scaleFactor}
          centerLat={geoBounds.centerLat}
          centerLon={geoBounds.centerLon}
          onSelectStation={onSelectStation}
        />
      </Canvas>

      {/* ------------------------------------------------------------- */}
      {/* 3D HUD OVERLAY: Profile Switcher & Viewport Controls           */}
      {/* ------------------------------------------------------------- */}

      {/* Top Left: 3D City Route Mode Badge */}
      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 shadow-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-black tracking-wide text-white">3D City Route Canvas</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
            Interactive
          </span>
        </div>
      </div>

      {/* Top Right: View Controls & Toggles */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
        {/* Reset Camera to Route Bounds */}
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition-all"
          title="Reset Camera to Route Center"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        {/* View Angle Preset Pills */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-slate-900/85 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-lg">
          <button
            onClick={() => setViewPreset('iso')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              viewPreset === 'iso'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            3D Iso
          </button>
          <button
            onClick={() => setViewPreset('top')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              viewPreset === 'top'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Top Down
          </button>
          <button
            onClick={() => setViewPreset('horizon')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              viewPreset === 'horizon'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Horizon
          </button>
        </div>

        {/* Toggle 3D City Buildings */}
        <button
          onClick={() => setShowBuildings(!showBuildings)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg transition-all ${
            showBuildings
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-900/85 text-slate-400 border-slate-700/80 hover:text-slate-200'
          }`}
          title="Toggle 3D City Block Buildings"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Blocks</span>
        </button>

        {/* Toggle Heat Island Thermal Domes */}
        <button
          onClick={() => setShowHeatIslands(!showHeatIslands)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg transition-all ${
            showHeatIslands
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : 'bg-slate-900/85 text-slate-400 border-slate-700/80 hover:text-slate-200'
          }`}
          title="Toggle Asphalt Heat Island Thermal Zones"
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Heat Islands</span>
        </button>
      </div>

      {/* Bottom Center: Quick Route Multi-Modal Profile Switcher Strip */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl">
        <div className="p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-1 sm:gap-2">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const style = PROFILE_COLORS[route.route_type] || PROFILE_COLORS.shortest;
            const Icon = style.icon;

            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute?.(route.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-lg ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: style.primary }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-xs font-bold truncate">
                      {route.route_type === 'low_heat_exposure'
                        ? 'Coolest'
                        : route.route_type === 'shortest'
                        ? 'Fastest'
                        : 'Water Stops'}
                    </span>
                    {route.route_type === 'low_heat_exposure' && (
                      <span className="hidden lg:inline text-[9px] font-black uppercase text-emerald-400">
                        (-4.2°C)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {route.duration_minutes} min • {route.distance_km} km
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interaction Help Hint (Bottom Right) */}
      <div className="hidden lg:flex absolute bottom-4 right-4 z-10 items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 backdrop-blur-md pointer-events-none">
        <span>Drag to rotate • Scroll to zoom • Click route to inspect</span>
      </div>
    </div>
  );
};
