import React from 'react';

export function Station(props) {
  return (
    <group {...props}>
      {/* Platform */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[12, 1, 6]} />
        <meshStandardMaterial color="#D7CCC8" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
         <boxGeometry args={[11.8, 0.1, 5.8]} />
         <meshStandardMaterial color="#A1887F" />
      </mesh>

      {/* Pillars */}
      <mesh position={[-5, 2, 2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[5, 2, 2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[-5, 2, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[5, 2, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[14, 0.4, 8]} />
        <meshStandardMaterial color="#EF5350" />
      </mesh>
      
      {/* Bench */}
      <group position={[0, 1.5, -1]}>
         <mesh position={[-2, 0, 0]}>
            <boxGeometry args={[2, 0.1, 0.8]} />
            <meshStandardMaterial color="#8D6E63" />
         </mesh>
         <mesh position={[2, 0, 0]}>
            <boxGeometry args={[2, 0.1, 0.8]} />
            <meshStandardMaterial color="#8D6E63" />
         </mesh>
      </group>

      {/* Sign */}
      <group position={[0, 5.5, 0]}>
        <mesh>
           <boxGeometry args={[4, 1.2, 0.2]} />
           <meshStandardMaterial color="white" />
        </mesh>
        {/* Text placeholder (simple shapes) */}
        <mesh position={[-1, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial color="#42A5F5" />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial color="#EF5350" />
        </mesh>
        <mesh position={[1, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial color="#FFCA28" />
        </mesh>
      </group>
    </group>
  );
}

