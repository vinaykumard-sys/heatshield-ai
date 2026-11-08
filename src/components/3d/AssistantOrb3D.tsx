import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Bot, Mic, Sparkles } from 'lucide-react';

export interface AssistantOrb3DProps {
  /** Callback fired when the orb is clicked */
  onClick?: () => void;
  /** Whether the assistant drawer/modal is currently open */
  isOpen?: boolean;
  /** Whether voice recognition / listening is active */
  isListening?: boolean;
  /** Whether the assistant is typing/computing a response */
  isTyping?: boolean;
  /** Whether text-to-speech audio is playing */
  isSpeaking?: boolean;
  /** Display size in pixels (width and height). Default: 72 */
  size?: number;
  /** Extra container styling */
  className?: string;
  /** Optional indicator for unread or attention */
  hasUnread?: boolean;
}

// Utility to verify WebGL capability
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

export const AssistantOrb3D: React.FC<AssistantOrb3DProps> = ({
  onClick,
  isOpen = false,
  isListening = false,
  isTyping = false,
  isSpeaking = false,
  size = 72,
  className = '',
  hasUnread = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean>(true);

  // References for Three.js animation lifecycle
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    coreMesh: THREE.Mesh;
    wireframeCage: THREE.Mesh;
    ringMesh1: THREE.Mesh;
    ringMesh2: THREE.Mesh;
    particleSystem: THREE.Points;
    particleBasePositions: Float32Array;
    animFrameId: number;
    clock: THREE.Clock;
    lights: {
      pointLight: THREE.PointLight;
      ambientLight: THREE.AmbientLight;
    };
  } | null>(null);

  // Target colors based on assistant state
  const stateColors = useMemo(() => {
    if (isListening) {
      return {
        core: 0xEF4444, // Intense Red / Coral when listening
        emissive: 0xDC2626,
        wireframe: 0xFCA5A5,
        ring: 0xF87171,
        particles: 0xFEE2E2,
        halo: 'rgba(239, 68, 68, 0.45)',
        glowCss: 'shadow-[0_0_30px_rgba(239,68,68,0.55)]',
        pulseSpeed: 3.5,
      };
    }
    if (isTyping || isSpeaking) {
      return {
        core: 0x0EA5E9, // Luminous Cyan / Sky
        emissive: 0x0284C7,
        wireframe: 0x7DD3FC,
        ring: 0x38BDF8,
        particles: 0xBAE6FD,
        halo: 'rgba(14, 165, 233, 0.45)',
        glowCss: 'shadow-[0_0_30px_rgba(14,165,233,0.55)]',
        pulseSpeed: 2.8,
      };
    }
    // Idle / Ready state - HeatShield Electric Sapphire
    return {
      core: 0x1E60F2,
      emissive: 0x184FD0,
      wireframe: 0x93C5FD,
      ring: 0x60A5FA,
      particles: 0xDBEAFE,
      halo: 'rgba(30, 96, 242, 0.35)',
      glowCss: 'shadow-[0_0_24px_rgba(30,96,242,0.45)]',
      pulseSpeed: 1.5,
    };
  }, [isListening, isTyping, isSpeaking]);

  // Initial WebGL verification
  useEffect(() => {
    setWebGLAvailable(checkWebGLSupport());
  }, []);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (!webGLAvailable || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Scene, Camera, Renderer (Low-overhead, transparent background)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 3.6;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(pixelRatio);
    } catch {
      setWebGLAvailable(false);
      return;
    }

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2.5, 15);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // 3. Central Compact Faceted Orb (Low-poly Icosahedron for 60fps performance)
    const coreGeometry = new THREE.IcosahedronGeometry(0.92, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: stateColors.core,
      emissive: stateColors.emissive,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.75,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // 4. Outer Holographic Wireframe Cage
    const wireframeGeometry = new THREE.IcosahedronGeometry(1.2, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: stateColors.wireframe,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireframeCage = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeCage);

    // 5. Dual Concentric Orbital Gyro Rings
    const ringGeometry1 = new THREE.TorusGeometry(1.35, 0.024, 8, 36);
    const ringMaterial1 = new THREE.MeshBasicMaterial({
      color: stateColors.ring,
      transparent: true,
      opacity: 0.65,
    });
    const ringMesh1 = new THREE.Mesh(ringGeometry1, ringMaterial1);
    ringMesh1.rotation.x = Math.PI / 3;
    ringMesh1.rotation.y = Math.PI / 6;
    scene.add(ringMesh1);

    const ringGeometry2 = new THREE.TorusGeometry(1.48, 0.018, 8, 36);
    const ringMaterial2 = new THREE.MeshBasicMaterial({
      color: stateColors.wireframe,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
    ringMesh2.rotation.x = -Math.PI / 4;
    ringMesh2.rotation.z = Math.PI / 5;
    scene.add(ringMesh2);

    // 6. Subtle Particle Aura (54 low-poly points orbiting in a shell)
    const particleCount = 54;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBasePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute points on sphere using Fibonacci spiral
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 1.6 + (Math.sin(i * 1.5) * 0.2);

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleBasePositions[i * 3] = x;
      particleBasePositions[i * 3 + 1] = y;
      particleBasePositions[i * 3 + 2] = z;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: stateColors.particles,
      size: 0.065,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const clock = new THREE.Clock();
    let animFrameId = 0;

    // 7. Buttery 60 FPS Render Loop with Smooth Inertia
    const renderLoop = () => {
      animFrameId = requestAnimationFrame(renderLoop);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotation & pulsation rates
      const pulseRate = stateColors.pulseSpeed;
      const rotationSpeed = isListening ? 2.2 : isTyping || isSpeaking ? 1.8 : 0.8;

      // Gentle floating bobbing effect
      const hoverTargetScale = isHovered ? 1.12 : 1.0;
      coreMesh.scale.lerp(new THREE.Vector3(hoverTargetScale, hoverTargetScale, hoverTargetScale), 0.1);

      // Core rotation
      coreMesh.rotation.y += delta * 0.7 * rotationSpeed;
      coreMesh.rotation.x += delta * 0.4 * rotationSpeed;

      // Wireframe counter-rotation
      wireframeCage.rotation.y -= delta * 0.5 * rotationSpeed;
      wireframeCage.rotation.z += delta * 0.3 * rotationSpeed;

      // Rings gyroscope precession
      ringMesh1.rotation.z += delta * 0.9 * rotationSpeed;
      ringMesh1.rotation.x += delta * 0.3;

      ringMesh2.rotation.y -= delta * 0.75 * rotationSpeed;
      ringMesh2.rotation.z -= delta * 0.4;

      // Particle system breathing & orbit
      particleSystem.rotation.y += delta * 0.25 * rotationSpeed;
      const positions = particleGeometry.attributes.position.array as Float32Array;
      const breath = 1.0 + Math.sin(elapsed * pulseRate) * (isListening ? 0.18 : 0.08);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = particleBasePositions[i3] * breath;
        positions[i3 + 1] = particleBasePositions[i3 + 1] * breath;
        positions[i3 + 2] = particleBasePositions[i3 + 2] * breath;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Pulse emissive intensity when listening or answering
      const baseEmissive = isListening ? 0.65 : isTyping ? 0.55 : 0.4;
      const pulseEmissive = baseEmissive + Math.sin(elapsed * pulseRate * 1.5) * 0.25;
      (coreMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulseEmissive;

      renderer.render(scene, camera);
    };

    renderLoop();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      coreMesh,
      wireframeCage,
      ringMesh1,
      ringMesh2,
      particleSystem,
      particleBasePositions,
      animFrameId,
      clock,
      lights: { pointLight, ambientLight },
    };

    return () => {
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      ringGeometry1.dispose();
      ringMaterial1.dispose();
      ringGeometry2.dispose();
      ringMaterial2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      sceneRef.current = null;
    };
  }, [webGLAvailable, size]);

  // Update chromatic theme in real-time when assistant state changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { coreMesh, wireframeCage, ringMesh1, ringMesh2, particleSystem } = sceneRef.current;

    const coreMat = coreMesh.material as THREE.MeshStandardMaterial;
    coreMat.color.setHex(stateColors.core);
    coreMat.emissive.setHex(stateColors.emissive);

    const wireMat = wireframeCage.material as THREE.MeshBasicMaterial;
    wireMat.color.setHex(stateColors.wireframe);

    const ringMat1 = ringMesh1.material as THREE.MeshBasicMaterial;
    ringMat1.color.setHex(stateColors.ring);

    const ringMat2 = ringMesh2.material as THREE.MeshBasicMaterial;
    ringMat2.color.setHex(stateColors.wireframe);

    const partMat = particleSystem.material as THREE.PointsMaterial;
    partMat.color.setHex(stateColors.particles);
  }, [stateColors]);

  return (
    <div
      ref={mountRef}
      className={`relative inline-flex items-center justify-center select-none group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label="Open AI Climate Assistant 3D Orb"
      title="HeatShield AI 3D Assistant - Click to consult"
    >
      {/* Outer Atmospheric Aura / Pulsing Halo */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 pointer-events-none ${
          isListening
            ? 'animate-ping opacity-60 bg-red-400 scale-125'
            : isTyping || isSpeaking
            ? 'animate-pulse opacity-50 bg-sky-400 scale-110'
            : isHovered
            ? 'opacity-40 bg-blue-500 scale-115'
            : 'opacity-25 bg-blue-400 scale-100'
        }`}
        style={{ filter: 'blur(10px)' }}
      />

      {/* Second Soft Glow Layer */}
      <div
        className={`absolute -inset-1 rounded-full blur-md transition-opacity duration-300 pointer-events-none ${
          isHovered || isListening ? 'opacity-80' : 'opacity-40'
        }`}
        style={{ background: stateColors.halo }}
      />

      {/* 3D Orb Canvas */}
      {webGLAvailable ? (
        <div
          className={`relative z-10 rounded-full overflow-visible transition-transform duration-300 flex items-center justify-center ${
            stateColors.glowCss
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block pointer-events-none"
            style={{ width: `${size}px`, height: `${size}px` }}
          />

          {/* Central AI Indicator Emblem Overlay (subtle, non-obtrusive) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
            {isListening ? (
              <Mic className="w-5 h-5 text-white drop-shadow-[0_2px_8px_rgba(239,68,68,0.9)] animate-pulse" />
            ) : isTyping ? (
              <Sparkles className="w-5 h-5 text-sky-200 drop-shadow-[0_2px_8px_rgba(14,165,233,0.9)] animate-spin" />
            ) : (
              <Bot className="w-5 h-5 text-white/90 drop-shadow-[0_2px_6px_rgba(30,96,242,0.8)]" />
            )}
          </div>
        </div>
      ) : (
        /* Resilient Pure CSS 3D Fallback if WebGL is unavailable */
        <div
          className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isListening
              ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 ring-4 ring-red-300'
              : 'bg-gradient-to-tr from-[#1E60F2] via-blue-500 to-sky-300 ring-4 ring-blue-300/40'
          }`}
          style={{ width: size, height: size }}
        >
          {isListening ? (
            <Mic className="w-6 h-6 text-white animate-bounce" />
          ) : (
            <Bot className="w-6 h-6 text-white" />
          )}
        </div>
      )}

      {/* Live Status Beacon Pill */}
      <span className="absolute -top-1 -right-1 z-20 flex h-3.5 w-3.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isListening ? 'bg-red-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${
            isListening ? 'bg-red-500' : hasUnread ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
        />
      </span>

      {/* Floating Interactive Badge (Expands on hover or during speech) */}
      <div
        className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none flex items-center gap-1.5 text-xs font-semibold ${
          isHovered || isListening || isTyping
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isListening
              ? 'bg-red-400 animate-ping'
              : isTyping
              ? 'bg-sky-400 animate-pulse'
              : 'bg-emerald-400'
          }`}
        />
        <span>
          {isListening
            ? 'Listening...'
            : isTyping
            ? 'AI Analyzing...'
            : isSpeaking
            ? 'Speaking...'
            : 'Ask HeatShield AI'}
        </span>
      </div>
    </div>
  );
};

export default AssistantOrb3D;
