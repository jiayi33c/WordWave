import React from 'react';

export function Train(props) {
  return (
    <group {...props}>
      {/* Engine Body */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.5, 1.5, 3]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 2.2, 1]}>
        <boxGeometry args={[1.6, 1.5, 1.2]} />
        <meshStandardMaterial color="darkred" />
      </mesh>
      {/* Chimney */}
      <mesh position={[0, 2.5, -1]}>
        <cylinderGeometry args={[0.3, 0.3, 1.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Wheels */}
      <mesh position={[0.8, 0.5, 1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.8, 0.5, 1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.8, 0.5, -1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.8, 0.5, -1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Cowcatcher (front) */}
      <mesh position={[0, 0.5, -1.8]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[1.6, 0.5, 0.5]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
}

