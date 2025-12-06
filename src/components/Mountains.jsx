import React, { useMemo } from 'react';

export function Mountains({ count = 4, boundary = 120 }) {
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
      temp.push({ pos: [x, -5, z], scale: [scale * 2.5, scale * 2, scale * 2.5] });
    }
    return temp;
  }, [count, boundary]);

  return (
    <group>
      {mountains.map((m, i) => (
        <mesh key={i} position={m.pos} scale={m.scale}>
          {/* Use a slightly flattened sphere for a hill look */}
          <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          {/* Pastel Rainbow Mountains */}
          <meshStandardMaterial 
            color={i % 3 === 0 ? "#CE93D8" : (i % 3 === 1 ? "#90CAF9" : "#FFCC80")} 
            roughness={0.9} 
          />
        </mesh>
      ))}
      {/* A few extra distant hills for depth without clutter - REMOVED for sparse look */}
      {/* 
      <mesh position={[-100, -10, -100]} scale={[60, 40, 60]}>
         <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
         <meshStandardMaterial color="#AED581" />
      </mesh>
       <mesh position={[100, -10, 80]} scale={[50, 35, 50]}>
         <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
         <meshStandardMaterial color="#AED581" />
      </mesh> 
      */}
    </group>
  );
}
