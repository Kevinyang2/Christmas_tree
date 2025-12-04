import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture, Instance, Instances, Html } from '@react-three/drei';
import { useStore } from '../store';
import { AppState, TreeParticle } from '../types';
import { 
  TREE_HEIGHT, TREE_RADIUS_BOTTOM, TREE_Y_OFFSET, 
  FOLIAGE_COUNT, ORNAMENT_COUNT, LIGHT_COUNT, 
  CHAOS_RADIUS, LERP_SPEED, COLORS, POLAROID_COUNT, POLAROID_IMAGES
} from '../constants';

// --- Utils ---

const getRandomSpherePos = (): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = CHAOS_RADIUS * Math.cbrt(Math.random()); // Cubic root for uniform distribution
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
};

const getConePos = (heightRatio: number): [number, number, number] => {
  const y = TREE_Y_OFFSET + (heightRatio * TREE_HEIGHT);
  const r = (1 - heightRatio) * TREE_RADIUS_BOTTOM;
  const theta = Math.random() * Math.PI * 2;
  // Push particles slightly out to surface
  const radiusJitter = r * Math.sqrt(Math.random()); 
  const x = radiusJitter * Math.cos(theta);
  const z = radiusJitter * Math.sin(theta);
  return [x, y, z];
};

// --- Sub-Components ---

const Foliage: React.FC<{ particles: TreeParticle[] }> = ({ particles }) => {
  const meshRef = useRef<THREE.Points>(null);
  const appState = useStore((s) => s.appState);
  
  // Shader for Gold/Green Sparkle
  const shaderArgs = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(COLORS.EMERALD_DEEP) },
      uColorB: { value: new THREE.Color(COLORS.GOLD_HIGH) },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      attribute vec3 aTargetPos;
      attribute vec3 aChaosPos;
      attribute float aMixFactor;
      
      varying vec3 vColor;
      
      void main() {
        vec3 pos = mix(aChaosPos, aTargetPos, aMixFactor);
        
        // Slight wind effect
        pos.x += sin(uTime * 2.0 + pos.y) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if(d > 0.5) discard;
        
        // Gold center, Green edge
        vec3 color = mix(uColorB, uColorA, d * 1.5);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }), []);

  // Geometry attributes
  const { positions, chaosPositions, targetPositions, sizes } = useMemo(() => {
    const pos = new Float32Array(particles.length * 3);
    const chaos = new Float32Array(particles.length * 3);
    const target = new Float32Array(particles.length * 3);
    const s = new Float32Array(particles.length);

    particles.forEach((p, i) => {
      pos.set(p.chaosPos, i * 3);
      chaos.set(p.chaosPos, i * 3);
      target.set(p.targetPos, i * 3);
      s[i] = p.size;
    });

    return { positions: pos, chaosPositions: chaos, targetPositions: target, sizes: s };
  }, [particles]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update Uniforms
    (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    
    const geometry = meshRef.current.geometry;
    const mixAttribute = geometry.attributes.aMixFactor as THREE.BufferAttribute;

    if (!mixAttribute) {
       // Initialize mix factor
       const arr = new Float32Array(particles.length).fill(0); 
       geometry.setAttribute('aMixFactor', new THREE.BufferAttribute(arr, 1));
       return;
    }

    const targetMix = appState === AppState.FORMED ? 1 : 0;
    
    // Animate each particle's mix factor
    for (let i = 0; i < particles.length; i++) {
        const current = mixAttribute.array[i];
        // Non-linear ease for luxury feel
        mixAttribute.setX(i, THREE.MathUtils.lerp(current, targetMix, delta * (LERP_SPEED * 60 * particles[i].speed)));
    }
    mixAttribute.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={chaosPositions.length / 3} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={targetPositions.length / 3} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial attach="material" {...shaderArgs} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const Ornaments: React.FC<{ particles: TreeParticle[], color: string, geometry: THREE.BufferGeometry }> = ({ particles, color, geometry }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const appState = useStore(s => s.appState);
    const tempObj = new THREE.Object3D();

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const targetMix = appState === AppState.FORMED ? 1 : 0;

        particles.forEach((p, i) => {
            // Calculate interpolation
            const alpha = THREE.MathUtils.lerp(
                // Use a persistent mix factor stored in user data if we wanted per-instance state, 
                // but for simplicity we rely on re-calculating position based on a global time approximation or store state in a separate Float32Array if needed.
                // Here we perform the lerp on positions directly.
                0, 1, 0 // Placeholder logic, see below
            );
            
            // We need to maintain current position state. 
            // Since we can't easily store state *inside* the instanced mesh loop without a buffer,
            // We will use the 'speed' property to govern how fast they reach target from chaos.
            
            // Simplified Approach: Calculate position based on appState transition
            // In a real physics engine, we'd use velocity. Here, we interpolate directly.
            
            // NOTE: To make it smooth state-based without physics engine, we need a ref to current positions.
            // But doing that in JS for 200 instances is cheap.
        });
    });

    // Better Approach for Ornaments:
    // Use the same ShaderMaterial logic as Foliage but applied to InstancedMesh via onBeforeCompile or Drei's <Instances>
    // However, to keep it simple and robust within one file, let's use a standard JS Lerp in useFrame for the fewer ornament count (300 total).
    
    // Store current positions in a ref
    const currentPositions = useRef(particles.map(p => new THREE.Vector3(...p.chaosPos)));

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        const targetState = appState === AppState.FORMED ? 1 : 0;
        
        particles.forEach((p, i) => {
            const targetVec = targetState === 1 
                ? new THREE.Vector3(...p.targetPos) 
                : new THREE.Vector3(...p.chaosPos);
            
            // Lerp current position towards target
            currentPositions.current[i].lerp(targetVec, delta * p.speed * 2);
            
            tempObj.position.copy(currentPositions.current[i]);
            
            // Add subtle rotation
            tempObj.rotation.x += delta * 0.5;
            tempObj.rotation.y += delta * 0.5;
            
            // Scale based on "Formed" to make them pop in/out or just stay constant
            const scale = p.size; 
            tempObj.scale.set(scale, scale, scale);
            
            tempObj.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObj.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, undefined, particles.length]}>
            <meshStandardMaterial 
                color={color} 
                roughness={0.1} 
                metalness={0.9} 
                emissive={color}
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
};

const Polaroids: React.FC<{ particles: TreeParticle[] }> = ({ particles }) => {
    return (
        <group>
            {particles.map((p, i) => (
                <PolaroidItem key={p.id} particle={p} />
            ))}
        </group>
    );
};

const PolaroidItem: React.FC<{ particle: TreeParticle }> = ({ particle }) => {
    const ref = useRef<THREE.Group>(null);
    const appState = useStore(s => s.appState);
    const texture = useTexture(particle.imgUrl || 'https://picsum.photos/200');
    
    // State for smooth animation
    const currentPos = useRef(new THREE.Vector3(...particle.chaosPos));
    
    useFrame((state, delta) => {
        if (!ref.current) return;
        
        const targetVec = appState === AppState.FORMED 
            ? new THREE.Vector3(...particle.targetPos) 
            : new THREE.Vector3(...particle.chaosPos);
            
        currentPos.current.lerp(targetVec, delta * particle.speed * 1.5);
        ref.current.position.copy(currentPos.current);
        
        // Look at center when formed
        if (appState === AppState.FORMED) {
            ref.current.lookAt(0, currentPos.current.y, 0);
        } else {
            ref.current.rotation.x += delta;
            ref.current.rotation.z += delta;
        }
    });

    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[1.2, 1.5, 0.05]} />
                <meshStandardMaterial color="#fff" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.1, 0.03]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={texture} />
            </mesh>
        </group>
    );
};

// --- Main System Component ---

export const TreeSystem: React.FC = () => {
    // Generate Data Once
    const systemData = useMemo(() => {
        const foliage: TreeParticle[] = [];
        const ornamentsRed: TreeParticle[] = [];
        const ornamentsGold: TreeParticle[] = [];
        const polaroids: TreeParticle[] = [];

        // Foliage
        for (let i = 0; i < FOLIAGE_COUNT; i++) {
            const h = Math.random();
            foliage.push({
                id: i,
                chaosPos: getRandomSpherePos(),
                targetPos: getConePos(h),
                color: COLORS.EMERALD_DEEP,
                size: Math.random() * 0.15 + 0.05,
                speed: Math.random() + 0.5,
                type: 'LEAF'
            });
        }

        // Ornaments
        for (let i = 0; i < ORNAMENT_COUNT; i++) {
            const h = Math.random();
            const p: TreeParticle = {
                id: i + FOLIAGE_COUNT,
                chaosPos: getRandomSpherePos(),
                targetPos: getConePos(h), // slightly offset in shader/render usually, but here same logic
                color: i % 2 === 0 ? COLORS.RED_VELVET : COLORS.GOLD_MUTED,
                size: Math.random() * 0.3 + 0.2,
                speed: Math.random() * 0.5 + 0.2, // Heavier/Slower
                type: 'ORNAMENT'
            };
            if (i % 2 === 0) ornamentsRed.push(p);
            else ornamentsGold.push(p);
        }

        // Polaroids
        for (let i = 0; i < POLAROID_COUNT; i++) {
             // Spiral distribution
             const h = i / POLAROID_COUNT;
             const y = TREE_Y_OFFSET + (h * TREE_HEIGHT);
             const r = (1 - h) * TREE_RADIUS_BOTTOM + 0.5; // stick out
             const theta = h * Math.PI * 6; // Spiral
             const x = r * Math.cos(theta);
             const z = r * Math.sin(theta);

             polaroids.push({
                 id: i + 10000,
                 chaosPos: getRandomSpherePos(),
                 targetPos: [x, y, z],
                 color: '#FFF',
                 size: 1,
                 speed: 0.8,
                 type: 'POLAROID',
                 imgUrl: POLAROID_IMAGES[i % POLAROID_IMAGES.length]
             });
        }

        return { foliage, ornamentsRed, ornamentsGold, polaroids };
    }, []);

    const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

    return (
        <group>
            <Foliage particles={systemData.foliage} />
            <Ornaments particles={systemData.ornamentsRed} color={COLORS.RED_VELVET} geometry={sphereGeo} />
            <Ornaments particles={systemData.ornamentsGold} color={COLORS.GOLD_HIGH} geometry={sphereGeo} />
            <Polaroids particles={systemData.polaroids} />
        </group>
    );
};
