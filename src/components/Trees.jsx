import React, { useMemo } from 'react';

export function Trees({ count = 50, boundary = 100 }) {
  const trees = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * boundary * 2;
      const z = (Math.random() - 0.5) * boundary * 2;
      // Avoid center track area
      if (Math.sqrt(x*x + z*z) < 30) continue; 
      temp.push({ pos: [x, 0, z], scale: 0.8 + Math.random() * 0.6 });
    }
    return temp;
  }, [count, boundary]);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={[t.scale, t.scale, t.scale]}>
          {/* Trunk */}
          <mesh position={[0, 0.8, 0]}>
             <cylinderGeometry args={[0.3, 0.4, 1.6]} />
             <meshStandardMaterial color="#8D6E63" />
          </mesh>
          {/* Leaves - Spherical/Bubble style */}
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#66BB6A" />
          </mesh>
          <mesh position={[0.8, 1.8, 0]} scale={0.7}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#81C784" />
          </mesh>
          <mesh position={[-0.8, 1.8, 0]} scale={0.7}>
             <sphereGeometry args={[1, 16, 16]} />
             <meshStandardMaterial color="#4CAF50" />
          </mesh>
          <mesh position={[0, 2.8, 0]} scale={0.8}>
             <sphereGeometry args={[1, 16, 16]} />
             <meshStandardMaterial color="#A5D6A7" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
