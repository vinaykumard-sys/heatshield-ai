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
  Crosshair, 
  Building2, 
  Navigation,
  Eye,
  Info,
  Layers,
  Sparkles,
  Loader2
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
  isLoading?: boolean;
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

// Daylight Route Profile Styling (High contrast, modern navigation feel)
const PROFILE_STYLES = {
  low_heat_exposure: {
    primary: '#059669', // Emerald
    casing: '#FFFFFF',
    highlight: '#34D399',
    pulse: '#10B981',
    label: 'Coolest Corridor (Canopy)',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Trees,
  },
  shortest: {
    primary: '#D97706', // Warm Amber
    casing: '#FFFFFF',
    highlight: '#FBBF24',
    pulse: '#F59E0B',
    label: 'Fastest Direct',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Flame,
  },
  respite_optimized: {
    primary: '#0284C7', // Sky Blue
    casing: '#FFFFFF',
    highlight: '#38BDF8',
    pulse: '#0EA5E9',
    label: 'Respite & Water Corridor',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Droplets,
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
      targetCamPos.current.set(cx, cy + safeRadius * 2.1, cz + 0.001);
    } else if (viewPreset === 'horizon') {
      targetCamPos.current.set(cx, cy + Math.max(2.5, safeRadius * 0.32), cz + safeRadius * 1.05);
    } else {
      // 3D Iso: Daylight perspective isometric framing
      targetCamPos.current.set(cx + safeRadius * 1.1, cy + safeRadius * 1.3, cz + safeRadius * 1.2);
    }

    isTransitioning.current = true;
  }, [bounds, viewPreset, resetSignal]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    const lerpFactor = Math.min(1, delta * 4.0);
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
      minDistance={6}
      maxDistance={130}
      maxPolarAngle={Math.PI / 2.08}
      autoRotate={false}
      makeDefault
    />
  );
}

// ============================================================================
// 2. High-Contrast Daylight Route Polyline with Navigation Progress Indicator
// ============================================================================

interface RouteMeshProps {
  route: HeatSafeRoute;
  isSelected: boolean;
  onSelect?: () => void;
  scaleFactor: number;
  centerLat: number;
  centerLon: number;
}

const DaylightRoutePolyline = React.memo(function DaylightRoutePolyline({
  route,
  isSelected,
  onSelect,
  scaleFactor,
  centerLat,
  centerLon
}: RouteMeshProps) {
  const pulseRef = useRef<THREE.Mesh>(null);

  // Convert GPS coordinates into 3D points
  const points = useMemo(() => {
    if (!route.coordinates || route.coordinates.length < 2) return [];

    const pts: THREE.Vector3[] = [];
    route.coordinates.forEach(([lat, lon]) => {
      const [x, , z] = projectGps(lat, lon, centerLat, centerLon, scaleFactor);
      pts.push(new THREE.Vector3(x, 0.08, z));
    });

    const filtered: THREE.Vector3[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].distanceTo(filtered[filtered.length - 1]) > 0.02) {
        filtered.push(pts[i]);
      }
    }
    return filtered;
  }, [route.coordinates, scaleFactor, centerLat, centerLon]);

  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < points.length - 1; i++) {
      path.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }
    return path;
  }, [points]);

  const style = PROFILE_STYLES[route.route_type] || PROFILE_STYLES.shortest;

  // Animate progress navigation bead along selected route
  useFrame((state) => {
    if (!curve || !isSelected || !pulseRef.current) return;
    const t = (state.clock.elapsedTime * 0.16) % 1;
    const pos = curve.getPointAt(t);
    pulseRef.current.position.copy(pos);
    pulseRef.current.position.y += 0.08;
  });

  if (!curve) return null;

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
      {/* 1. Outer Road Casing (White border casing for high contrast on light ground) */}
      <mesh position={[0, -0.02, 0]}>
        <tubeGeometry args={[curve, Math.min(260, points.length * 3), isSelected ? 0.28 : 0.16, 8, false]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent={true}
          opacity={isSelected ? 0.95 : 0.6}
        />
      </mesh>

      {/* 2. Core Navigation Route Line */}
      <mesh position={[0, 0.04, 0]}>
        <tubeGeometry args={[curve, Math.min(260, points.length * 3), isSelected ? 0.18 : 0.10, 8, false]} />
        <meshBasicMaterial
          color={style.primary}
          transparent={!isSelected}
          opacity={isSelected ? 1 : 0.45}
        />
      </mesh>

      {/* 3. Subtle Highlight Glow on Selected Route */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]}>
          <tubeGeometry args={[curve, Math.min(200, points.length * 2), 0.24, 6, false]} />
          <meshBasicMaterial
            color={style.highlight}
            transparent={true}
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 4. Animated Navigation Bead / Arrow Progress Dot */}
      {isSelected && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={style.primary}
            emissiveIntensity={1.5}
            roughness={0.2}
          />
        </mesh>
      )}
    </group>
  );
});

// ============================================================================
// 3. Clean Daylight City Blocks & Terrain (Light Architectural Aesthetic)
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

const CityTerrain = React.memo(function CityTerrain({
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

  // Pre-project route line segments to guarantee buildings NEVER cover or clip the road
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

  // Generate lightweight, clean architectural buildings (NOT black monoliths!)
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
    }> = [];

    const gridSize = Math.ceil(radius * 1.3);
    const step = 4.0;
    const CLEARANCE_SQ = 1.8 * 1.8; // Generous 1.8 unit setback from any route road segment

    // Light modern architectural palette (clean white, off-white, soft stone, slate accent)
    const palette = ['#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#E0F2FE'];

    let id = 0;
    for (let x = cx - gridSize; x <= cx + gridSize; x += step) {
      for (let z = cz - gridSize; z <= cz + gridSize; z += step) {
        const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        if (rand < 0.42) continue; // open courtyards / avenues

        const jx = x + (rand - 0.5) * 1.6;
        const jz = z + ((rand * 3.1) % 1 - 0.5) * 1.6;

        // Check clearance against route
        let isTooClose = false;
        for (let s = 0; s < routeSegments.length; s++) {
          const seg = routeSegments[s];
          const dx = seg.x2 - seg.x1;
          const dz = seg.z2 - seg.z1;
          const l2 = dx * dx + dz * dz;

          let distSq: number;
          if (l2 === 0) {
            distSq = (jx - seg.x1) ** 2 + (jz - seg.z1) ** 2;
          } else {
            let t = ((jx - seg.x1) * dx + (jz - seg.z1) * dz) / l2;
            t = Math.max(0, Math.min(1, t));
            distSq = (jx - (seg.x1 + t * dx)) ** 2 + (jz - (seg.z1 + t * dz)) ** 2;
          }

          if (distSq < CLEARANCE_SQ) {
            isTooClose = true;
            break;
          }
        }

        if (isTooClose) continue;

        // Moderate, realistic building heights (1.2 to 3.2 units max) so they never dwarf navigation
        const h = Math.max(0.8, (rand * 2.4 + 0.8));
        const w = 1.4 + ((rand * 1.5) % 1) * 1.2;
        const d = 1.4 + ((rand * 2.1) % 1) * 1.2;
        const color = palette[Math.floor(rand * palette.length)];

        blocks.push({ id: id++, x: jx, z: jz, w, d, h, color });
        if (blocks.length > 80) break; // performance limit
      }
      if (blocks.length > 80) break;
    }

    return blocks;
  }, [cx, cz, radius, showBuildings, routeSegments]);

  return (
    <group>
      {/* Daylight Ground Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.04, cz]}>
        <planeGeometry args={[radius * 4, radius * 4]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Subtle Road Network Grid Floor */}
      <gridHelper
        args={[radius * 3.5, 32, '#CBD5E1', '#E2E8F0']}
        position={[cx, -0.03, cz]}
      />

      {/* Light Architectural Buildings */}
      {buildings.map((b) => (
        <mesh key={`bld-${b.id}`} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Subtle Heat Island Zones (if toggled) */}
      {showHeatIslands && (
        <group>
          {[-8, 8].map((offset, idx) => (
            <mesh key={`heat-${idx}`} rotation={[-Math.PI / 2, 0, 0]} position={[cx + offset, 0.01, cz + offset]}>
              <ringGeometry args={[2, 6, 24]} />
              <meshBasicMaterial color="#F97316" transparent opacity={0.12} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
});

// ============================================================================
// 4. Origin & Destination Waypoint Beacons (Daylight Pins with Anti-Collision LOD)
// ============================================================================

interface WaypointBeaconsProps {
  startPoint: [number, number, number] | null;
  endPoint: [number, number, number] | null;
  startPlace: string;
  endPlace: string;
}

const WaypointBeacons = React.memo(function WaypointBeacons({ startPoint, endPoint, startPlace, endPlace }: WaypointBeaconsProps) {
  return (
    <group>
      {/* Origin Pin (Emerald) */}
      {startPoint && (
        <group position={startPoint}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 12]} />
            <meshStandardMaterial color="#059669" />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial color="#059669" />
          </mesh>
          {/* Ground pulse ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.7, 24]} />
            <meshBasicMaterial color="#10B981" transparent opacity={0.5} />
          </mesh>
          <Html position={[0, 2.2, 0]} center distanceFactor={24}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-xl bg-white/95 border-2 border-emerald-500 shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">ORIGIN:</span>
              <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate">{startPlace}</span>
            </div>
          </Html>
        </group>
      )}

      {/* Destination Pin (Royal Blue) */}
      {endPoint && (
        <group position={endPoint}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 12]} />
            <meshStandardMaterial color="#0284C7" />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial color="#0284C7" />
          </mesh>
          {/* Ground pulse ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.7, 24]} />
            <meshBasicMaterial color="#0284C7" transparent opacity={0.5} />
          </mesh>
          <Html position={[0, 2.2, 0]} center distanceFactor={24}>
            <div className="pointer-events-none select-none px-3 py-1.5 rounded-xl bg-white/95 border-2 border-sky-500 shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="text-[10px] font-black text-sky-700 uppercase tracking-wide">DESTINATION:</span>
              <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate">{endPlace}</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
});

// ============================================================================
// 5. Verified Cooling Centres & Hydration Points along Route Corridor
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

const StationMarkers = React.memo(function StationMarkers({
  coolingCentres = [],
  waterPoints = [],
  bounds,
  scaleFactor,
  centerLat,
  centerLon,
  onSelectStation
}: StationMarkersProps) {
  // Render shelters and water points near the corridor with distinct 3D landmarks
  const visibleShelters = useMemo(() => {
    return coolingCentres.slice(0, 3).map((c) => {
      const [x, , z] = projectGps(c.latitude, c.longitude, centerLat, centerLon, scaleFactor);
      return { data: c, pos: [x, 0.1, z] as [number, number, number] };
    });
  }, [coolingCentres, centerLat, centerLon, scaleFactor]);

  const visibleWater = useMemo(() => {
    return waterPoints.slice(0, 3).map((w) => {
      const [x, , z] = projectGps(w.latitude, w.longitude, centerLat, centerLon, scaleFactor);
      return { data: w, pos: [x, 0.1, z] as [number, number, number] };
    });
  }, [waterPoints, centerLat, centerLon, scaleFactor]);

  return (
    <group>
      {/* 3D Cooling Centre Landmarks (Pavilion with Base Ring & Badge) */}
      {visibleShelters.map(({ data, pos }, idx) => (
        <group key={`cc-${data.id || idx}`} position={pos}>
          {/* 3D Pavilion Shelter Geometry */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.28, 0.36, 0.45, 8]} />
            <meshStandardMaterial color="#0284C7" roughness={0.25} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <coneGeometry args={[0.42, 0.3, 8]} />
            <meshStandardMaterial color="#0EA5E9" roughness={0.2} metalness={0.4} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.65, 20]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.45} />
          </mesh>

          {/* Clean Daylighting Pill Badge */}
          <Html position={[0, 1.45, 0]} center distanceFactor={22}>
            <button
              onClick={() => onSelectStation?.(data)}
              className="pointer-events-auto select-none px-2.5 py-1 rounded-xl bg-white/95 hover:bg-sky-50 border border-sky-300 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-sky-900 cursor-pointer transition-transform hover:scale-105 whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="text-[9px] uppercase font-black text-sky-700">Cooling:</span>
              <span className="max-w-[85px] truncate">{data.name}</span>
            </button>
          </Html>
        </group>
      ))}

      {/* 3D Water Point Landmarks (Crystal Droplet with Base Ring & Badge) */}
      {visibleWater.map(({ data, pos }, idx) => (
        <group key={`wp-${data.id || idx}`} position={pos}>
          {/* 3D Water Crystal / Teardrop Geometry */}
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.35, 8]} />
            <meshStandardMaterial color="#0891B2" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#06B6D4" roughness={0.15} metalness={0.7} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.25, 0.55, 20]} />
            <meshBasicMaterial color="#22D3EE" transparent opacity={0.45} />
          </mesh>

          {/* Clean Daylighting Pill Badge */}
          <Html position={[0, 1.4, 0]} center distanceFactor={22}>
            <button
              onClick={() => onSelectStation?.(data)}
              className="pointer-events-auto select-none px-2.5 py-1 rounded-xl bg-white/95 hover:bg-cyan-50 border border-cyan-300 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-cyan-900 cursor-pointer transition-transform hover:scale-105 whitespace-nowrap"
            >
              <Droplets className="w-3 h-3 text-cyan-600 shrink-0" />
              <span className="text-[9px] uppercase font-black text-cyan-700">Water:</span>
              <span className="max-w-[80px] truncate">{data.name}</span>
            </button>
          </Html>
        </group>
      ))}
    </group>
  );
});

// ============================================================================
// MAIN COMPONENT: RouteScene3D (Daylight Navigation Architecture)
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
  showHeatIslandsDefault = false,
  showBuildingsDefault = true,
  onSelectStation,
  isLoading = false
}) => {
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'horizon'>('iso');
  const [showHeatIslands, setShowHeatIslands] = useState(showHeatIslandsDefault);
  const [showBuildings, setShowBuildings] = useState(showBuildingsDefault);
  const [resetSignal, setResetSignal] = useState(0);

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

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#F8FAFC] border border-slate-200 shadow-sm select-none ${className}`}
      style={{ height }}
    >
      {/* Progressive Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-slate-50/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 transition-all duration-300">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-xs text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
              <Trees className="w-4 h-4 text-emerald-600 absolute" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Preparing heat-safe map...</h4>
              <p className="text-xs text-slate-500 mt-1">Analyzing shade corridors, cooling shelters & safe road segments</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-sky-500 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* 3D Daylight Viewport */}
      <Canvas
        camera={{ position: [16, 20, 20], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Soft Daylight Lighting */}
        <ambientLight color="#F1F5F9" intensity={1.2} />
        <directionalLight position={[20, 35, 15]} color="#FFFBEB" intensity={1.5} />
        <directionalLight position={[-15, 20, -10]} color="#E0F2FE" intensity={0.6} />

        {/* Camera Framer & OrbitControls */}
        <CameraController
          bounds={activeBounds}
          viewPreset={viewPreset}
          resetSignal={resetSignal}
        />

        {/* Clean Architectural City Terrain */}
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

        {/* High-Contrast Navigation Route Polylines */}
        {routes.map((route) => (
          <DaylightRoutePolyline
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

      {/* Top Left: Daylight Clean HUD */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">Safe Route 3D</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
            Daylight View
          </span>
        </div>
      </div>

      {/* Top Right: View Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <button
          onClick={() => setResetSignal((s) => s + 1)}
          className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all cursor-pointer"
          title="Reset Camera"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

        {/* Angle Presets */}
        <div className="flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          {(['iso', 'top', 'horizon'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setViewPreset(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewPreset === p
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === 'iso' ? '3D Iso' : p === 'top' ? 'Top' : 'Horizon'}
            </button>
          ))}
        </div>

        {/* Building Toggle */}
        <button
          onClick={() => setShowBuildings(!showBuildings)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer ${
            showBuildings
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title="Toggle 3D Buildings"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buildings</span>
        </button>
      </div>
    </div>
  );
};

export default RouteScene3D;
