import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeSystem } from './TreeSystem';
import { useStore } from '../store';
import { COLORS } from '../constants';

const CameraController: React.FC = () => {
    const { gesture, manualMode } = useStore();
    const vec = new THREE.Vector3();

    useFrame((state) => {
        // Base Position
        const baseX = 0;
        const baseY = 4;
        const baseZ = 20;

        // Target Position modifiers based on hand
        let targetX = baseX;
        let targetY = baseY;

        if (gesture.isHandDetected && !manualMode) {
            // Invert X for mirror feel
            targetX += gesture.handPosition.x * 10; 
            targetY -= gesture.handPosition.y * 5; 
        } else {
            // Idle animation
            const time = state.clock.getElapsedTime();
            targetX += Math.sin(time * 0.2) * 5;
        }

        state.camera.position.lerp(vec.set(targetX, targetY, baseZ), 0.05);
        state.camera.lookAt(0, 0, 0);
    });

    return null;
};

export const Scene: React.FC = () => {
    return (
        <Canvas gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}>
            <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
            <CameraController />
            
            <color attach="background" args={['#010502']} />
            <fog attach="fog" args={['#010502', 10, 50]} />

            {/* Lights */}
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} color={COLORS.GOLD_HIGH} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} color={COLORS.EMERALD_LIGHT} />
            
            <TreeSystem />

            <Environment preset="lobby" background={false} blur={0.8} />

            <EffectComposer disableNormalPass>
                <Bloom 
                    luminanceThreshold={0.8} 
                    mipmapBlur 
                    intensity={1.2} 
                    radius={0.4}
                />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

            {/* Fallback controls if gesture fails or user wants manual */}
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} />
        </Canvas>
    );
};
