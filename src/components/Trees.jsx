import React, { useMemo, memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Tree = ({ position, scale, color, isPlaying, bounce = 0 }) => {
  const meshRef = useRef();
  const baseY = position[1];
  
  // Refs for smooth color transition
  const trunkMatRef = useRef();
  const leafMatRef0 = useRef();
  const leafMatRef1 = useRef();
  const leafMatRef2 = useRef();
  
  // Macaroon colors for leaves - Soft but visible pastels!
  const macaroonColors = useMemo(() => [
    "#FFCDD2", // Soft Rose
    "#B3E5FC", // Soft Sky Blue
    "#E1BEE7", // Soft Lavender
    "#FFF59D", // Soft Lemon
    "#C8E6C9", // Soft Mint
    "#FFE0B2", // Soft Peach
  ], []);
  
  // Standard nature colors
  const natureColors = useMemo(() => [
    "#81C784", // Medium Green
    "#AED581", // Light Green
    "#A5D6A7", // Soft Green
  ], []);
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Local bounce calculation if prop is missing, otherwise use prop
    let effectiveBounce = bounce;
    if (bounce === 0 && isPlaying) {
         effectiveBounce = Math.max(0, Math.sin(t * Math.PI * 4));
    }
    
    if (meshRef.current) {
      // Wobbly dance effect when music plays
      const wobble = Math.sin(Date.now() * 0.01) * 0.1;
      meshRef.current.rotation.z = wobble * effectiveBounce;
      
      // Jump up when bouncing
      meshRef.current.position.y = baseY + (effectiveBounce * 0.5);
      
      // Squash/stretch
      const stretch = 1 + (effectiveBounce * 0.3);
      const squash = 1 - (effectiveBounce * 0.15);
      meshRef.current.scale.set(scale * squash, scale * stretch, scale * squash);
    }
    
    // Color pulsing logic
    const speed = delta * 2.0;
    const posIndex = Math.floor(position[0] + position[2]);
    
    // Calculate color blend factor (0 = nature, 1 = macaroon)
    // When playing, oscillate between 0 and 1 based on beat
    // When not playing, stay at 0 (nature colors)
    const colorBlend = isPlaying ? (Math.sin(t * 2) + 1) / 2 : 0; // Smooth oscillation 0-1
    
    // Trunk color - pulse between browns
    const trunkNature = new THREE.Color("#795548");
    const trunkMacaroon = new THREE.Color("#A1887F");
    const trunkTarget = trunkNature.clone().lerp(trunkMacaroon, colorBlend);
    if (trunkMatRef.current) trunkMatRef.current.color.lerp(trunkTarget, speed);
    
    // Leaf colors - pulse between nature and macaroon
    const leafTargets = [0, 1, 2].map(offset => {
        const natureColor = new THREE.Color(natureColors[offset % natureColors.length]);
        const macaroonColor = new THREE.Color(macaroonColors[(Math.abs(posIndex) + offset) % macaroonColors.length]);
        return natureColor.clone().lerp(macaroonColor, colorBlend);
    });
    
    if (leafMatRef0.current) leafMatRef0.current.color.lerp(leafTargets[0], speed);
    if (leafMatRef1.current) leafMatRef1.current.color.lerp(leafTargets[1], speed);
    if (leafMatRef2.current) leafMatRef2.current.color.lerp(leafTargets[2], speed);
  });

  return (
    <group ref={meshRef} position={[position[0], baseY, position[2]]} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]}>
         <cylinderGeometry args={[0.3, 0.4, 1.6]} />
         <meshStandardMaterial ref={trunkMatRef} color="#795548" />
      </mesh>
      
      {/* Leaves - Dynamic Theme */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial ref={leafMatRef0} color="#81C784" />
      </mesh>
      <mesh position={[0.8, 1.8, 0]} scale={0.7}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial ref={leafMatRef1} color="#AED581" />
      </mesh>
      <mesh position={[-0.8, 1.8, 0]} scale={0.7}>
         <sphereGeometry args={[1, 16, 16]} />
         <meshStandardMaterial ref={leafMatRef2} color="#A5D6A7" />
      </mesh>
      
      {/* Top fruit/flower - ALWAYS colorful */}
      <mesh position={[0, 2.8, 0]} scale={0.8}>
         <sphereGeometry args={[1, 16, 16]} />
         <meshStandardMaterial color={color} /> 
      </mesh>
    </group>
  );
};

// Helper to get position along track (same as App.jsx)
function getTrackPosition(angle) {
  const r = 15 + 2 * Math.sin(4 * angle);
  const x = Math.sin(angle) * r * 1.2; 
  const z = Math.cos(angle) * r * 0.6; 
  return { x, z };
}

export const Trees = memo(function Trees({ count = 20, boundary = 100, isPlaying = false, bounce = 0 }) {
  const trees = useMemo(() => {
    const positions = [];
    // Macaroon palette for top accents
    const colors = [
      "#FF80AB", // Rose
      "#FF9E80", // Coral
      "#EA80FC", // Orchid
      "#8C9EFF", // Indigo
      "#80CBC4", // Teal
      "#F4FF81", // Lemon
    ];
    
    // Place trees along both sides of the track
    // Station is at angle ~3.74 (Math.PI + 0.6), avoid that area
    const stationAngle = Math.PI + 0.6;
    const avoidRange = 0.8; // Avoid trees near station
    
    // Increased count for more density
    const treeCount = Math.min(count, 24); 
    
    for (let i = 0; i < treeCount; i++) {
      // Distribute trees evenly around the track
      const baseAngle = (i / treeCount) * Math.PI * 2;
      
      // Skip if too close to station
      const angleDiff = Math.abs(baseAngle - stationAngle);
      const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
      if (wrappedDiff < avoidRange) continue;
      
      // Get track position at this angle
      const trackPos = getTrackPosition(baseAngle);
      
      // Place tree on outer side of track (add offset)
      const outerOffset = 6 + (i % 3) * 2.5; // 6-11 units outside track (more variety)
      const offsetX = Math.sin(baseAngle) * outerOffset;
      const offsetZ = Math.cos(baseAngle) * outerOffset * 0.5; 
      
      const x = trackPos.x + offsetX;
      const z = trackPos.z + offsetZ;
      
      const scale = 0.9 + (i % 5) * 0.15; // Larger, fluffier trees
      const color = colors[i % colors.length];
      
      positions.push({ pos: [x, 0, z], scale, color });
      
      // Add MORE inner trees for density
      if (i % 2 === 0) {
        const innerOffset = 4 + (i % 2);
        const innerX = trackPos.x - Math.sin(baseAngle) * innerOffset;
        const innerZ = trackPos.z - Math.cos(baseAngle) * innerOffset * 0.5;
        
        // Make sure inner trees aren't too close to center
        const distFromCenter = Math.sqrt(innerX * innerX + innerZ * innerZ);
        if (distFromCenter > 6) {
          positions.push({ 
            pos: [innerX, 0, innerZ], 
            scale: scale * 0.8, 
            color: colors[(i + 3) % colors.length] 
          });
        }
      }
    }
    
    return positions;
  }, [count]);

  return (
    <group>
      {trees.map((t, i) => (
        <Tree 
          key={`tree-${i}`} 
          position={t.pos} 
          scale={t.scale} 
          color={t.color} 
          isPlaying={isPlaying}
          bounce={bounce}
        />
      ))}
    </group>
  );
});