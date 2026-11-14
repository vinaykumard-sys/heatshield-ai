import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Flame,
  ShieldAlert,
  Droplets,
  Trees,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Compass,
  Layers,
  Sparkles,
  Info,
  MapPin,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { CoolingCentre } from '../../types';

export type City3DLayer = 'all' | 'cooling' | 'hotspots' | 'greenery';
export type CameraPreset = 'isometric' | 'topdown' | 'street';

export interface CityHeatMap3DProps {
  /** Locality or neighborhood name */
  localityName?: string;
  /** City name (e.g. Hyderabad, Delhi) */
  cityName?: string;
  /** Current ambient temperature in °C */
  temperature?: number;
  /** Perceived feels-like temperature in °C */
  feelsLike?: number;
  /** Heat risk category */
  riskCategory?: 'low' | 'moderate' | 'high' | 'critical' | 'extreme' | string;
  /** Risk score (0 - 100) */
  riskScore?: number;
  /** Real cooling centres from database */
  coolingCentres?: CoolingCentre[];
  /** Height of the 3D viewport */
  height?: number | string;
  /** Additional container classes */
  className?: string;
  /** Callback when user clicks a shelter beacon */
  onSelectShelter?: (shelter: CoolingCentre) => void;
}

// WebGL availability probe
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

// Risk color palette definition
const RISK_PALETTE = {
  low: {
    primary: '#10B981', // Emerald
    secondary: '#34D399',
    heatGlow: '#059669',
    shimmer: '#A7F3D0',
    asphalt: '#F1F5F9',
    buildingBase: '#FFFFFF',
    buildingHot: '#F59E0B',
    label: 'Low Risk',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  moderate: {
    primary: '#F59E0B', // Amber
    secondary: '#FBBF24',
    heatGlow: '#D97706',
    shimmer: '#FDE68A',
    asphalt: '#F1F5F9',
    buildingBase: '#F8FAFC',
    buildingHot: '#EA580C',
    label: 'Moderate Risk',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  high: {
    primary: '#F97316', // Orange
    secondary: '#FB923C',
    heatGlow: '#C2410C',
    shimmer: '#FED7AA',
    asphalt: '#F1F5F9',
    buildingBase: '#F1F5F9',
    buildingHot: '#EF4444',
    label: 'High Risk',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  critical: {
    primary: '#EF4444', // Red
    secondary: '#F87171',
    heatGlow: '#991B1B',
    shimmer: '#FECACA',
    asphalt: '#F1F5F9',
    buildingBase: '#E2E8F0',
    buildingHot: '#DC2626',
    label: 'Critical Risk',
    badgeClass: 'bg-red-50 text-red-700 border-red-200'
  },
  extreme: {
    primary: '#DC2626', // Deep Red
    secondary: '#EF4444',
    heatGlow: '#7F1D1D',
    shimmer: '#FECDD3',
    asphalt: '#F1F5F9',
    buildingBase: '#CBD5E1',
    buildingHot: '#B91C1C',
    label: 'Extreme Risk',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
  }
};

interface POIPoint {
  id: string;
  name: string;
  type: 'cooling' | 'water' | 'hotspot' | 'park';
  position: [number, number, number];
  temperature: number;
  details: string;
  capacity?: string;
  hours?: string;
  sourceData?: CoolingCentre;
}

/**
 * High-performance procedural instanced buildings with thermal coloration
 */
function InstancedCityBuildings({
  riskLevel,
  activeLayer,
  onHoverPOI
}: {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'extreme';
  activeLayer: City3DLayer;
  onHoverPOI: (poi: POIPoint | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const palette = RISK_PALETTE[riskLevel] || RISK_PALETTE.moderate;

  // Generate procedural city layout: Grid blocks with roads, variation in heights, and thermal zones
  const cityData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const gridSize = 12; // 12x12 grid
    const spacing = 2.4;
    const instances: {
      matrix: THREE.Matrix4;
      color: THREE.Color;
      x: number;
      z: number;
      height: number;
      isHotspot: boolean;
    }[] = [];

    // Hotspot epicenter near (2, 2) and (-3, 1)
    const hotEpicenter1 = new THREE.Vector2(3.5, 3.0);
    const hotEpicenter2 = new THREE.Vector2(-4.0, -2.5);
    // Park green zone near (-3, 3)
    const parkEpicenter = new THREE.Vector2(-4.5, 4.5);

    const baseColor = new THREE.Color('#CBD5E1'); // cool slate-white
    const warmColor = new THREE.Color(palette.buildingHot);
    const lowRiskColor = new THREE.Color('#94A3B8');

    for (let i = -gridSize / 2; i < gridSize / 2; i++) {
      for (let j = -gridSize / 2; j < gridSize / 2; j++) {
        // Leave avenues/streets empty every 3rd line
        if (i % 3 === 0 || j % 3 === 0) continue;

        // Leave park zone clear of buildings
        const pos2D = new THREE.Vector2(i * spacing, j * spacing);
        if (pos2D.distanceTo(parkEpicenter) < 3.8) continue;

        // Pseudo-random pseudo-deterministic height based on position
        const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        const distFromCenter = Math.sqrt(i * i + j * j);

        // Center has taller corporate/commercial towers
        let height = 0.8 + (1 - Math.min(1, distFromCenter / 7)) * 3.5 + rand * 1.8;
        if (rand > 0.85) height *= 1.4; // Occasional landmark skyscrapers

        const width = 1.3 + (rand * 0.4);
        const depth = 1.3 + ((1 - rand) * 0.4);
        const posX = i * spacing + (rand - 0.5) * 0.3;
        const posZ = j * spacing + (rand - 0.5) * 0.3;
        const posY = height / 2;

        dummy.position.set(posX, posY, posZ);
        dummy.scale.set(width, height, depth);
        dummy.rotation.y = (rand > 0.5 ? 0 : Math.PI / 2);
        dummy.updateMatrix();

        // Check thermal heat exposure
        const distToHot1 = pos2D.distanceTo(hotEpicenter1);
        const distToHot2 = pos2D.distanceTo(hotEpicenter2);
        const heatInfluence = Math.max(
          0,
          1 - Math.min(distToHot1, distToHot2) / 7.5
        );

        // Interpolate building facade color based on thermal risk
        const finalColor = new THREE.Color().copy(baseColor);
        if (heatInfluence > 0.45) {
          finalColor.lerp(warmColor, heatInfluence * 0.85);
        } else {
          finalColor.lerp(lowRiskColor, 0.3);
        }

        instances.push({
          matrix: dummy.matrix.clone(),
          color: finalColor,
          x: posX,
          z: posZ,
          height,
          isHotspot: heatInfluence > 0.65
        });
      }
    }

    return instances;
  }, [palette]);

  // Apply instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    cityData.forEach((item, index) => {
      mesh.setMatrixAt(index, item.matrix);
      mesh.setColorAt(index, item.color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cityData]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, cityData.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.25}
      />
    </instancedMesh>
  );
}

/**
 * Animated Thermal Shimmer / Rising Heatwave Particles over High-Risk Zones
 */
function ThermalHeatwaveShimmer({
  riskLevel
}: {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'extreme';
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const palette = RISK_PALETTE[riskLevel] || RISK_PALETTE.high;

  // High-temp particle cloud hovering above hotspot zones
  const particleCount = riskLevel === 'low' ? 30 : riskLevel === 'moderate' ? 60 : 120;
  const { positions, initialY } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const inits = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Clustered over primary hotspot zone around (3.5, 3.0)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 5.5;
      const x = 3.5 + Math.cos(angle) * radius;
      const z = 3.0 + Math.sin(angle) * radius;
      const y = 0.5 + Math.random() * 4.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      inits[i] = y;
    }
    return { positions: pos, initialY: inits };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    const speed = riskLevel === 'extreme' ? 1.8 : riskLevel === 'critical' ? 1.4 : 1.0;

    for (let i = 0; i < particleCount; i++) {
      // Float upward like rising thermal convection currents
      array[i * 3 + 1] += delta * speed * 0.9;
      // Oscillate horizontally (heat shimmer wave)
      array[i * 3] += Math.sin(state.clock.elapsedTime * 2.5 + i) * 0.008;

      // Wrap around when reaching sky ceiling
      if (array[i * 3 + 1] > 6.0) {
        array[i * 3 + 1] = 0.4 + Math.random() * 0.5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={palette.primary}
        transparent={true}
        opacity={riskLevel === 'low' ? 0.3 : 0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * 3D Ground Surface with Road Network, Green Parks, and Radial Heatmap Overlay
 */
function CityGroundPlane({
  riskLevel
}: {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'extreme';
}) {
  const palette = RISK_PALETTE[riskLevel] || RISK_PALETTE.moderate;
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Concentric animated thermal pulse ring from hotspot
  useFrame((state) => {
    if (pulseRingRef.current) {
      const scale = 1.0 + (state.clock.elapsedTime % 3) * 1.5;
      pulseRingRef.current.scale.set(scale, scale, 1);
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.45 - (scale - 1.0) * 0.15);
      }
    }
  });

  return (
    <group>
      {/* Base City Daylight Urban Ground Foundation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial
          color="#F1F5F9" // Clean daylight urban ground surface
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* Road Grid Pattern (Cross streets) */}
      <gridHelper
        args={[36, 24, '#CBD5E1', '#E2E8F0']}
        position={[0, 0.01, 0]}
      />

      {/* Park Green Oasis Patch (-4.5, 4.5) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-4.5, 0.02, 4.5]}
        receiveShadow
      >
        <circleGeometry args={[3.2, 32]} />
        <meshStandardMaterial
          color="#059669" // Emerald park canopy grass
          roughness={0.9}
        />
      </mesh>

      {/* Low-Poly Trees in Park Oasis */}
      {[-5.2, -4.0, -4.8, -3.8, -5.5].map((x, idx) => {
        const z = [4.2, 4.8, 5.2, 3.8, 4.0][idx];
        return (
          <group key={idx} position={[x, 0, z]}>
            {/* Trunk */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.6, 8]} />
              <meshStandardMaterial color="#78350F" />
            </mesh>
            {/* Foliage */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.42, 12, 12]} />
              <meshStandardMaterial color="#10B981" roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Primary Thermal Hotspot Ground Disk (Radiation Zone) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[3.5, 0.03, 3.0]}
      >
        <circleGeometry args={[4.2, 36]} />
        <meshBasicMaterial
          color={palette.primary}
          transparent={true}
          opacity={riskLevel === 'low' ? 0.18 : 0.35}
        />
      </mesh>

      {/* Radiating Expanding Heatwave Ring */}
      <mesh
        ref={pulseRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[3.5, 0.035, 3.0]}
      >
        <ringGeometry args={[1.2, 1.45, 36]} />
        <meshBasicMaterial
          color={palette.primary}
          transparent={true}
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Interactive Beacon / Pin Marker
 */
function BeaconMarker({
  poi,
  isHovered,
  onPointerOver,
  onPointerOut,
  onClick
}: {
  poi: POIPoint;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}) {
  const pinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const colors = {
    cooling: '#06B6D4', // Cyan
    water: '#3B82F6',   // Blue
    hotspot: '#EF4444', // Red
    park: '#10B981'     // Emerald
  };
  const color = colors[poi.type] || '#3B82F6';

  useFrame((state, delta) => {
    // Bobbing float animation
    if (pinRef.current) {
      pinRef.current.position.y = poi.position[1] + Math.sin(state.clock.elapsedTime * 3 + poi.position[0]) * 0.15;
    }
    // Rotating marker head
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  return (
    <group position={[poi.position[0], 0, poi.position[2]]}>
      {/* Base target ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.3, 0.42, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Vertical Light Ray / Beacon Stem */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Floating Interactive Beacon Head */}
      <group
        ref={pinRef}
        position={[0, poi.position[1], 0]}
        scale={isHovered ? 1.35 : 1.0}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Diamond / Polyhedron Head */}
        <mesh castShadow>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isHovered ? 0.9 : 0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Orbiting Halo Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.5, 0.025, 12, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Camera View Controller for Presets
 */
function CameraController({ preset }: { preset: CameraPreset }) {
  const { camera } = useThree();

  useEffect(() => {
    switch (preset) {
      case 'isometric':
        camera.position.set(16, 18, 16);
        camera.lookAt(0, 0, 0);
        break;
      case 'topdown':
        camera.position.set(0, 26, 0.1);
        camera.lookAt(0, 0, 0);
        break;
      case 'street':
        camera.position.set(0, 3.5, 12);
        camera.lookAt(0, 1.5, 0);
        break;
    }
  }, [preset, camera]);

  return null;
}

/**
 * High-Fidelity 2D Isometric Fallback when WebGL is unavailable
 */
function Fallback2DCityMap({
  localityName,
  cityName,
  temperature,
  riskCategory,
  coolingCentres,
  onSelectShelter
}: {
  localityName: string;
  cityName: string;
  temperature: number;
  riskCategory: string;
  coolingCentres: CoolingCentre[];
  onSelectShelter?: (station: CoolingCentre) => void;
}) {
  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-sm">
      {/* Background Stylized City Grid SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
            2D Neighborhood Heat Overlay
          </span>
          <h4 className="text-xl font-black text-slate-800">{localityName}, {cityName}</h4>
        </div>
        <div className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-black">
          {temperature}°C · {riskCategory.toUpperCase()} RISK
        </div>
      </div>

      {/* Interactive Shelters List */}
      <div className="relative z-10 space-y-2.5 my-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Nearby Cooling Shelters & Relief Hubs
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coolingCentres.slice(0, 4).map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectShelter?.(c)}
              className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 block transition-colors">
                  {c.name}
                </span>
                <span className="text-[11px] text-slate-500 block">{c.address}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-[11px] text-slate-500 text-center border-t border-slate-200 pt-3">
        WebGL acceleration disabled or unavailable. Displaying 2D safety fallback.
      </div>
    </div>
  );
}

/**
 * Main 3D City & Heat Risk Visualization Component
 */
export const CityHeatMap3D: React.FC<CityHeatMap3DProps> = ({
  localityName = 'Banjara Hills',
  cityName = 'Hyderabad',
  temperature = 32,
  feelsLike = 35,
  riskCategory = 'moderate',
  riskScore = 55,
  coolingCentres = [],
  height = 480,
  className = '',
  onSelectShelter
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<City3DLayer>('all');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [hoveredPOI, setHoveredPOI] = useState<POIPoint | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POIPoint | null>(null);
  const [showShimmer, setShowShimmer] = useState<boolean>(true);
  const controlsRef = useRef<any>(null);

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

  const palette = RISK_PALETTE[normalizedCategory] || RISK_PALETTE.moderate;

  // Build POI points combining real cooling centres + procedural hotspots & parks
  const poiPoints: POIPoint[] = useMemo(() => {
    const list: POIPoint[] = [];

    // Real or synthetic cooling centers
    if (coolingCentres && coolingCentres.length > 0) {
      coolingCentres.slice(0, 3).forEach((c, idx) => {
        // Place around perimeter or open streets
        const coords: [number, number, number][] = [
          [-3.0, 2.2, -3.0],
          [2.0, 2.2, -4.5],
          [-1.5, 2.2, 3.5]
        ];
        list.push({
          id: c.id,
          name: c.name,
          type: 'cooling',
          position: coords[idx] || [-2, 2.2, -2],
          temperature: 24.5, // AC chilled indoor temp
          details: `${c.air_conditioned ? 'Air-Conditioned' : 'Fan-Cooled'} Shelter · Free Potable Water`,
          capacity: `${c.capacity_estimate ?? 120} Persons`,
          hours: c.operating_hours || '24/7 Active',
          sourceData: c
        });
      });
    } else {
      // Default fallback cooling centers if db empty
      list.push({
        id: 'c1',
        name: `${localityName} Relief & Cooling Center`,
        type: 'cooling',
        position: [-3.0, 2.2, -3.0],
        temperature: 24.0,
        details: 'Air Conditioned Ward Shelter · Cold Water Dispensers',
        capacity: '150 Persons',
        hours: '08:00 AM - 08:00 PM'
      });
    }

    // Public Drinking Water Station
    list.push({
      id: 'w1',
      name: 'Municipal RO Cold Water Kiosk',
      type: 'water',
      position: [0.5, 2.0, -1.0],
      temperature: 18.0,
      details: 'Free Chilled Drinking Water & ORS Sachets',
      capacity: 'Continuous Flow'
    });

    // High Heat Hotspot Zone (Asphalt & glass reflection epicenter)
    list.push({
      id: 'h1',
      name: 'Asphalt & Commercial Heat Island Epicenter',
      type: 'hotspot',
      position: [3.5, 2.5, 3.0],
      temperature: Math.round(temperature + 4.5),
      details: 'Dense Concrete Albedo & High Heat Flux Absorption'
    });

    // Green Oasis Park
    list.push({
      id: 'p1',
      name: `${localityName} Canopy Shade Grove`,
      type: 'park',
      position: [-4.5, 2.0, 4.5],
      temperature: Math.round(temperature - 3.2),
      details: 'Dense Tree Canopy · Natural Evaporative Cooling'
    });

    return list;
  }, [coolingCentres, localityName, temperature]);

  // Filter POIs based on active layer
  const visiblePOIs = useMemo(() => {
    if (activeLayer === 'all') return poiPoints;
    if (activeLayer === 'cooling') return poiPoints.filter(p => p.type === 'cooling');
    if (activeLayer === 'hotspots') return poiPoints.filter(p => p.type === 'hotspot');
    if (activeLayer === 'greenery') return poiPoints.filter(p => p.type === 'park');
    return poiPoints;
  }, [poiPoints, activeLayer]);

  // Reset camera view
  const handleResetCamera = useCallback(() => {
    setCameraPreset('isometric');
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  if (!hasWebGL) {
    return (
      <Fallback2DCityMap
        localityName={localityName}
        cityName={cityName}
        temperature={temperature}
        riskCategory={normalizedCategory}
        coolingCentres={coolingCentres}
        onSelectShelter={onSelectShelter}
      />
    );
  }

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm select-none group ${className}`}
      style={{ height }}
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [16, 18, 16], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        className="w-full h-full"
      >
        {/* Natural & Sun Lighting */}
        <ambientLight intensity={1.1} color="#F8FAFC" />
        <directionalLight
          position={[12, 22, 10]}
          intensity={1.6}
          color="#FFFBEB"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Warm thermal accent light over the hotspot */}
        <pointLight
          position={[3.5, 6, 3.0]}
          intensity={1.2}
          color={palette.primary}
          distance={16}
        />
        {/* Cool soothing accent light over the park oasis */}
        <pointLight
          position={[-4.5, 4, 4.5]}
          intensity={0.8}
          color="#10B981"
          distance={10}
        />

        {/* Dynamic Camera Preset Manager */}
        <CameraController preset={cameraPreset} />

        {/* City Ground with Roads & Parks */}
        <CityGroundPlane riskLevel={normalizedCategory} />

        {/* Instanced Procedural Buildings */}
        <InstancedCityBuildings
          riskLevel={normalizedCategory}
          activeLayer={activeLayer}
          onHoverPOI={setHoveredPOI}
        />

        {/* Thermal Heatwave Shimmer Particles */}
        {showShimmer && <ThermalHeatwaveShimmer riskLevel={normalizedCategory} />}

        {/* 3D Floating Beacons */}
        {visiblePOIs.map((poi) => (
          <BeaconMarker
            key={poi.id}
            poi={poi}
            isHovered={hoveredPOI?.id === poi.id || selectedPOI?.id === poi.id}
            onPointerOver={() => setHoveredPOI(poi)}
            onPointerOut={() => setHoveredPOI(null)}
            onClick={() => {
              setSelectedPOI(poi);
              if (poi.sourceData && onSelectShelter) {
                onSelectShelter(poi.sourceData);
              }
            }}
          />
        ))}

        {/* Orbit Controls with Damping & Limits */}
        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.08}
          minDistance={6}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2.05} // Prevent camera from slipping under ground
          autoRotate={false}
        />
      </Canvas>

      {/* TOP HUD BAR: Locality & Live Risk Status */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: palette.primary }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800 tracking-tight">
                {localityName}
              </span>
              <span className="text-slate-400 text-[10px]">·</span>
              <span className="text-slate-500 text-xs font-semibold">{cityName}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 block">
              3D Procedural Digital Twin & Heat Risk Model
            </span>
          </div>
        </div>

        {/* Risk Badge & Heat Index */}
        <div className="flex items-center gap-2">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-black">
            <span className="text-slate-800">{temperature}°C</span>
            <span className="text-slate-500 font-medium">Feels {feelsLike}°C</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${palette.badgeClass}`}>
              {palette.label}
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING CONTROLS: Camera Presets & Layer Toggles */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex flex-wrap items-end justify-between gap-3">
        {/* Layer Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm text-[11px] font-bold">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activeLayer === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Points
          </button>
          <button
            onClick={() => setActiveLayer('cooling')}
            className={`px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayer === 'cooling'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-cyan-600" />
            <span>Cooling</span>
          </button>
          <button
            onClick={() => setActiveLayer('hotspots')}
            className={`px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayer === 'hotspots'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3 h-3 text-red-500" />
            <span>Hotspots</span>
          </button>
          <button
            onClick={() => setActiveLayer('greenery')}
            className={`px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayer === 'greenery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trees className="w-3 h-3 text-emerald-600" />
            <span>Parks</span>
          </button>
        </div>

        {/* Camera Views & Shimmer Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700">
          <button
            onClick={() => setCameraPreset('isometric')}
            className={`px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              cameraPreset === 'isometric' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="3D Isometric Orbit View"
          >
            Iso 3D
          </button>
          <button
            onClick={() => setCameraPreset('topdown')}
            className={`px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              cameraPreset === 'topdown' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Overhead Heatmap Grid"
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraPreset('street')}
            className={`px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              cameraPreset === 'street' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Ground Street Horizon"
          >
            Street
          </button>

          <span className="w-px h-3.5 bg-slate-200 mx-0.5" />

          {/* Shimmer Toggle */}
          <button
            onClick={() => setShowShimmer(!showShimmer)}
            className={`px-2 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
              showShimmer ? 'text-amber-600' : 'text-slate-400'
            }`}
            title="Toggle Heat Shimmer Particles"
          >
            <Sparkles className="w-3 h-3" />
            <span>Shimmer</span>
          </button>

          {/* Reset Camera Button */}
          <button
            onClick={handleResetCamera}
            className="p-1 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Reset Orbit Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* POI HOVER / CLICK DETAIL CARD */}
      {(hoveredPOI || selectedPOI) && (
        <div className="absolute top-20 right-4 w-72 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-3.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {(() => {
            const item = selectedPOI || hoveredPOI!;
            const isCooling = item.type === 'cooling';
            const isHot = item.type === 'hotspot';
            const isWater = item.type === 'water';

            return (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                      style={{
                        backgroundColor: isCooling
                          ? 'rgba(6, 182, 212, 0.15)'
                          : isHot
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isWater
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: isCooling
                          ? '#0284C7'
                          : isHot
                          ? '#DC2626'
                          : isWater
                          ? '#2563EB'
                          : '#059669'
                      }}
                    >
                      {isCooling && <ShieldAlert className="w-3.5 h-3.5" />}
                      {isHot && <Flame className="w-3.5 h-3.5" />}
                      {isWater && <Droplets className="w-3.5 h-3.5" />}
                      {item.type === 'park' && <Trees className="w-3.5 h-3.5" />}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 leading-tight">
                        {item.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {selectedPOI && (
                    <button
                      onClick={() => setSelectedPOI(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p>{item.details}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px]">Surface Temp:</span>
                  <span
                    className="font-extrabold"
                    style={{
                      color: isCooling
                        ? '#0284C7'
                        : isHot
                        ? '#DC2626'
                        : '#059669'
                    }}
                  >
                    {item.temperature}°C
                  </span>
                </div>

                {item.sourceData && onSelectShelter && (
                  <button
                    onClick={() => onSelectShelter(item.sourceData!)}
                    className="w-full mt-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>View Shelter Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
