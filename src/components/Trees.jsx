import React, { useMemo } from 'react';

export function Trees({ count = 50, boundary = 100 }) {
  const trees = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * boundary * 2;
      const z = (Math.random() - 0.5) * boundary * 2;
      // Avoid center track area (width 10)
      if (Math.abs(x) < 8) continue; 
      temp.push({ pos: [x, 0, z], scale: 0.5 + Math.random() * 0.5 });
    }
    return temp;
  }, [count, boundary]);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={[t.scale, t.scale, t.scale]}>
          {/* Trunk */}
          <mesh position={[0, 1, 0]}>
             <cylinderGeometry args={[0.4, 0.6, 2]} />
             <meshStandardMaterial color="#5D4037" />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 3, 0]}>
            <coneGeometry args={[1.5, 4, 8]} />
            <meshStandardMaterial color="#2E7D32" />
          </mesh>
          <mesh position={[0, 4.5, 0]}>
            <coneGeometry args={[1.2, 3.5, 8]} />
            <meshStandardMaterial color="#388E3C" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

