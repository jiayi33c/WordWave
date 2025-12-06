import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export function WordCloud({ position, word, speed = 0.5, startOffset = 0 }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Animation: Drift horizontally (Left/Right)
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      // Move along X axis
      // Start from far right (20) to far left (-20), then wrap
      const trackWidth = 60; // Total travel distance
      let currentX = ((t * speed + startOffset) % trackWidth) - (trackWidth / 2);
      
      // If speed is negative, flip direction
      if (speed < 0) {
         currentX = -currentX;
      }
      
      groupRef.current.position.x = currentX;
      // Keep original Y and Z but add slight wobble
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + startOffset) * 0.5;
    }
  });

  // Uniform aesthetic: White fluffy clouds, dark friendly text
  const cloudColor = 'white';
  const textColor = '#546E7A'; // Soft dark blue-grey

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      {/* Cloud Mesh (Composition of spheres) */}
      <group scale={0.8}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} />
        </mesh>
        <mesh position={[1.2, 0, 0.5]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} />
        </mesh>
        <mesh position={[-1.2, 0, 0.2]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.5, 0.8, 0]}>
           <sphereGeometry args={[1.0, 32, 32]} />
           <meshStandardMaterial color={cloudColor} roughness={0.4} />
        </mesh>
        <mesh position={[-0.5, 0.5, -0.5]}>
           <sphereGeometry args={[1.1, 32, 32]} />
           <meshStandardMaterial color={cloudColor} roughness={0.4} />
        </mesh>
      </group>

      {/* Text */}
      <Text
        position={[0, 0, 1.6]} // Sit in front of the cloud
        fontSize={0.6} // Smaller font (was 1.0)
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04} // Thinner outline
        outlineColor="white"
      >
        {word}
      </Text>
    </group>
  );
}

