import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';

const ThreeBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-dark pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Sparkles
                        count={300}
                        scale={3}
                        size={2}
                        speed={0.4}
                        opacity={0.5}
                        color="#8b5cf6"
                    />
                    <Sparkles
                        count={200}
                        scale={4}
                        size={3}
                        speed={0.3}
                        opacity={0.3}
                        color="#d946ef"
                    />
                </Float>
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-80" />
        </div>
    );
};

export default ThreeBackground;
