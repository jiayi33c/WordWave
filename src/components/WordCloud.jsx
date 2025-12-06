import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function WordCloud({ position, word, type, isPlaying, isActive, speed = 0.5, startOffset = 0, hovered = false, onClick }) {
  const groupRef = useRef();
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  
  // Combined hover state (from hand tracking OR mouse)
  const isHovered = hovered || isLocalHovered;

  // Animation: Drift horizontally (Left/Right)
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      
      // If speed is 0 (Stage Mode), use the fixed position from props + gentle floating
      if (Math.abs(speed) < 0.01) {
          // Gentle floating around the fixed position
          groupRef.current.position.x = position[0] + Math.sin(t * 0.3 + startOffset) * 0.5; // Slow horizontal sway
          groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + startOffset * 0.7) * 0.4; // Gentle vertical bob
          groupRef.current.position.z = position[2] + Math.sin(t * 0.2 + startOffset * 0.3) * 0.2; // Subtle depth
      } else {
          // Normal flying mode (Sky Mode)
          const trackWidth = 60; 
          let currentX = ((t * speed + startOffset) % trackWidth) - (trackWidth / 2);
          if (speed < 0) currentX = -currentX;
          groupRef.current.position.x = currentX;
          groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + startOffset) * 0.5;
      }
      
      // Extra wobble if active!
      const activeWobble = isActive ? Math.sin(t * 10) * 0.15 : 0;
      if (isActive) groupRef.current.position.y += activeWobble;
      
      // Gentle rotation for all clouds, more spin if active
      if (isActive) {
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.1;
        groupRef.current.rotation.y = Math.sin(t * 3) * 0.05;
      } else {
        // Very subtle idle rotation
        groupRef.current.rotation.z = Math.sin(t * 0.3 + startOffset) * 0.02;
        groupRef.current.rotation.y = 0;
      }
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Visual Styling Logic
  // ───────────────────────────────────────────────────────────────────────────

  let cloudColor = 'white';
  let textColor = '#546E7A';
  let emissiveColor = 'black';
  let emissiveIntensity = 0;
  let scale = isPlaying ? 0.9 : 1; // Slightly smaller in Stage Mode but still clear

  if (isPlaying) {
    // Color code based on type (Synonym vs Antonym)
    if (type === 'synonym') {
       cloudColor = '#FFAB91'; // Warm Orange/Peach
    } else if (type === 'antonym') {
       cloudColor = '#9FA8DA'; // Cool Indigo/Blue
    } else {
       cloudColor = '#CFD8DC'; // Neutral Grey
    }
  } else {
     // Default IDLE state
     cloudColor = isHovered ? '#FFF59D' : 'white'; 
  }

  if (isActive) {
     // SHINY ACTIVE STATE! ✨
     cloudColor = '#FFFF00'; // Bright Yellow
     emissiveColor = '#FFD700'; // Golden Glow
     emissiveIntensity = 0.8;
     scale = 1.2; // Slightly bigger but not too much
     textColor = '#E65100';
  } else if (isHovered) {
     scale = 1.15; // Slight pop on hover
     cloudColor = isPlaying ? cloudColor : '#FFF59D';
     emissiveColor = '#FFF176';
     emissiveIntensity = 0.3;
     textColor = '#37474F';
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  
  // Shared material for all cloud puffs
  const cloudMaterial = (
    <meshStandardMaterial 
        color={cloudColor} 
        roughness={isActive ? 0.1 : 0.4} // Shiny (0.1) when active!
        metalness={isActive ? 0.3 : 0}   // Metallic when active
        emissive={emissiveColor} 
        emissiveIntensity={emissiveIntensity} 
    />
  );

  return (
    <group 
      ref={groupRef} 
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsLocalHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setIsLocalHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Cloud Mesh (Composition of spheres) */}
      <group scale={0.8}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          {cloudMaterial}
        </mesh>
        <mesh position={[1.2, 0, 0.5]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          {cloudMaterial}
        </mesh>
        <mesh position={[-1.2, 0, 0.2]}>
          <sphereGeometry args={[1.2, 32, 32]} />
          {cloudMaterial}
        </mesh>
        <mesh position={[0.5, 0.8, 0]}>
           <sphereGeometry args={[1.0, 32, 32]} />
           {cloudMaterial}
        </mesh>
        <mesh position={[-0.5, 0.5, -0.5]}>
           <sphereGeometry args={[1.1, 32, 32]} />
           {cloudMaterial}
        </mesh>
      </group>

      {/* Text */}
      <Text
        position={[0, 0, 1.6]} // Sit in front of the cloud
        fontSize={isHovered || isActive ? 0.8 : 0.6} 
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={isHovered || isActive ? 0.06 : 0.04} 
        outlineColor="white"
      >
        {word}
      </Text>
      
      {/* Sparkles when active */}
      {isActive && (
         <group>
            <mesh position={[1.5, 1.5, 1]}>
               <octahedronGeometry args={[0.3]} />
               <meshBasicMaterial color="white" />
            </mesh>
             <mesh position={[-1.5, -1, 1]}>
               <octahedronGeometry args={[0.2]} />
               <meshBasicMaterial color="white" />
            </mesh>
         </group>
      )}
    </group>
  );
}
