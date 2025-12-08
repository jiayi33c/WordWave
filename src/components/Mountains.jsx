import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Mountains({ count = 4, boundary = 120, bounce = 0, isPlaying = false }) {
  // Create refs for each mountain to animate them individually
  const mountainRefs = useMemo(() => Array.from({ length: count }, () => React.createRef()), [count]);

  const mountains = useMemo(() => {
    const temp = [];
    // Place mountains further out and sparse
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Push them far back
      const radius = boundary + (Math.random() * 20); 
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const scale = 25 + Math.random() * 15;
      
      // Assign static colors (Classic) vs Dynamic targets are handled in useFrame
      const color = i % 3 === 0 ? "#CE93D8" : (i % 3 === 1 ? "#90CAF9" : "#FFCC80");
      
      temp.push({ 
        pos: [x, -5, z], 
        scale: [scale * 2.5, scale * 2, scale * 2.5],
        baseScaleY: scale * 2,
        color
      });
    }
    return temp;
  }, [count, boundary]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = delta * 2;

    mountains.forEach((m, i) => {
       const ref = mountainRefs[i];
       if (!ref.current) return;

       // 1. BOUNCE: Squash and stretch to the beat
       // Use bounce (0..1) to modify Y scale
       // Slight delay per mountain for "wave" effect across horizon
       const wave = Math.sin(i + t); 
       const bounceEffect = isPlaying ? (bounce * 0.1) + (wave * 0.02) : 0;
       
       ref.current.scale.y = THREE.MathUtils.lerp(
           ref.current.scale.y, 
           m.baseScaleY * (1 + bounceEffect), 
           0.1
       );

       // 2. COLOR: Shift to Soft Macaroon Pink/Purple when playing
       const targetColor = isPlaying 
           ? (i % 3 === 0 ? "#F8BBD0" : (i % 3 === 1 ? "#E1BEE7" : "#FFCCBC")) // Soft Pink/Lavender/Peach
           : m.color; // Original Pastel
           
       ref.current.material.color.lerp(new THREE.Color(targetColor), speed);
    });
  });

  return (
    <group>
      {mountains.map((m, i) => (
        <mesh 
            key={i} 
            ref={mountainRefs[i]}
            position={m.pos} 
            scale={m.scale}
        >
          {/* Use a slightly flattened sphere for a hill look */}
          <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial 
            color={m.color} 
            roughness={0.9} 
          />
        </mesh>
      ))}
    </group>
  );
}
