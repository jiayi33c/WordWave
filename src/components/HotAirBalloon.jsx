import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function HotAirBalloon({ position = [0, 20, 0], color = "#FF7043" }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 2;
    ref.current.rotation.y = t * 0.1;
  });

  return (
    <group ref={ref} position={position}>
      {/* Balloon */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Stripes */}
      <mesh position={[0, 2, 0]} scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[3, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial color="#FFCCBC" wireframe />
      </mesh>
      
      {/* Basket */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      
      {/* Ropes */}
      <mesh position={[0.3, 0, 0.3]} rotation={[0,0,-0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 2.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[-0.3, 0, 0.3]} rotation={[0,0,0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 2.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0.3, 0, -0.3]} rotation={[0,0,-0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 2.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[-0.3, 0, -0.3]} rotation={[0,0,0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 2.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
}

