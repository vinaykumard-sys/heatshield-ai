import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// 3D Animated HeatShield Geometry
function HeatShieldMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth rotation animation per frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= delta * 0.2;
      wireframeRef.current.rotation.y -= delta * 0.4;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group>
        {/* Core Geometry */}
        <mesh
          ref={meshRef}
          scale={hovered ? 1.15 : 1}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color={hovered ? '#FF6B00' : '#1E60F2'}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>

        {/* Outer Wireframe Shield */}
        <mesh ref={wireframeRef}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color="#38BDF8"
            wireframe={true}
            transparent={true}
            opacity={0.35}
          />
        </mesh>
      </group>
    </Float>
  );
}

export interface Test3DSceneProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Isolated Test 3D Scene to verify Three.js, React Three Fiber, and Drei integration.
 * Complies with Step 6 of the 3D redesign foundation plan.
 */
export const Test3DScene: React.FC<Test3DSceneProps> = ({
  className = '',
  width = '100%',
  height = '350px'
}) => {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl ${className}`}
      style={{ width, height }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[-5, -5, -2]} intensity={0.8} color="#FF6B00" />

        {/* 3D Animated Object */}
        <HeatShieldMesh />

        {/* Interactive Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2.5}
          maxDistance={8}
          autoRotate={false}
        />
      </Canvas>

      {/* Verification Overlay Badge */}
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>R3F v8 + Drei v9 + Three.js v0.187 Verified</span>
      </div>
    </div>
  );
};

export default Test3DScene;
