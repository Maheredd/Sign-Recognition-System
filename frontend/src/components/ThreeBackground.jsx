import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';

const ThreeBackground = ({ reduceEffects = false }) => {
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const shouldRender3D = !reduceEffects && !prefersReducedMotion;
  const isPaused = !isTabVisible || !shouldRender3D;

  if (!shouldRender3D) {
    return (
      <div className="fixed inset-0 z-0 bg-[#050511] pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-blue-950/20" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-[#050511] pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1.5]}
        frameloop={isPaused ? 'never' : 'always'}
        gl={{ powerPreference: 'low-power', antialias: false }}
      >
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.4}>
          <Sparkles
            count={180}
            scale={3}
            size={2}
            speed={0.3}
            opacity={0.45}
            color="#8b5cf6"
          />
          <Sparkles
            count={120}
            scale={4}
            size={2.5}
            speed={0.25}
            opacity={0.3}
            color="#ec4899"
          />
        </Float>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050511] via-transparent to-transparent opacity-85" />
    </div>
  );
};

export default ThreeBackground;
