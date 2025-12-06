import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export function WordCloud({ position, word, speed = 0.5, startOffset = 0, hovered = false }) {
  const groupRef = useRef();
  // Removed internal hover state, now controlled by props

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
  const cloudColor = hovered ? '#FFF59D' : 'white'; // Yellow when hovered
  const textColor = hovered ? '#37474F' : '#546E7A'; 

  return (
    <group 
      ref={groupRef} 
      position={position}
      scale={hovered ? 1.3 : 1} // Scale up when hovered
    >
      {/* Cloud Mesh (Composition of spheres) */}
      <group scale={0.8}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} emissive={hovered ? "#FFF176" : "black"} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
        <mesh position={[1.2, 0, 0.5]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} emissive={hovered ? "#FFF176" : "black"} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
        <mesh position={[-1.2, 0, 0.2]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color={cloudColor} roughness={0.4} emissive={hovered ? "#FFF176" : "black"} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
        <mesh position={[0.5, 0.8, 0]}>
           <sphereGeometry args={[1.0, 32, 32]} />
           <meshStandardMaterial color={cloudColor} roughness={0.4} emissive={hovered ? "#FFF176" : "black"} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
        <mesh position={[-0.5, 0.5, -0.5]}>
           <sphereGeometry args={[1.1, 32, 32]} />
           <meshStandardMaterial color={cloudColor} roughness={0.4} emissive={hovered ? "#FFF176" : "black"} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
      </group>

      {/* Text */}
      <Text
        position={[0, 0, 1.6]} // Sit in front of the cloud
        fontSize={hovered ? 0.8 : 0.6} // Bigger font when hovered
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={hovered ? 0.06 : 0.04} 
        outlineColor="white"
      >
        {word}
      </Text>
    </group>
  );
}

