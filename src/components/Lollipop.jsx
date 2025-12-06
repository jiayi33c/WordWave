import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Lollipop = ({ startPos, endPos, onComplete }) => {
  const groupRef = useRef();
  const [completed, setCompleted] = useState(false);
  
  // Time tracking
  const startTimeRef = useRef(null);
  const duration = 1.0; // Flight time in seconds

  useFrame((state) => {
    if (completed) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    if (groupRef.current) {
      // Lerp position
      const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, progress);
      
      // Add arc (parabola)
      const arcHeight = 5;
      currentPos.y += Math.sin(progress * Math.PI) * arcHeight;
      
      groupRef.current.position.copy(currentPos);
      
      // Spin the lollipop
      groupRef.current.rotation.z += 0.1;
      groupRef.current.rotation.y += 0.1;
    }

    if (progress >= 1 && !completed) {
      setCompleted(true);
      if (onComplete) onComplete();
    }
  });

  if (completed) return null;

  return (
    <group ref={groupRef} position={startPos.toArray()}>
      {/* Stick */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Candy */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FF4081" /> {/* Hot pink candy */}
      </mesh>
      {/* Swirl decal (simulated with torus) */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.2, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

