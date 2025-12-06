import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Station({ isPlaying, ...props }) {
  // Material refs for smooth transition
  const platformRef = useRef();
  const roofRef = useRef();
  const pillarRef1 = useRef();
  const pillarRef2 = useRef();
  const pillarRef3 = useRef();
  const pillarRef4 = useRef();
  const benchRef1 = useRef();
  const benchRef2 = useRef();

  useFrame((state, delta) => {
    const speed = delta * 1.5; // Same smooth speed as trees

    // Target Colors (Classic vs Macaroon)
    const platformTarget = new THREE.Color(isPlaying ? "#F8BBD0" : "#F5F5F5"); // Pink vs White
    const roofTarget = new THREE.Color(isPlaying ? "#8C9EFF" : "#FF5252");     // Periwinkle vs Red
    const pillarTarget = new THREE.Color(isPlaying ? "#B2DFDB" : "#42A5F5");   // Mint vs Blue
    const benchTarget = new THREE.Color(isPlaying ? "#FFCCBC" : "#FFEB3B");    // Peach vs Yellow

    if (platformRef.current) platformRef.current.color.lerp(platformTarget, speed);
    if (roofRef.current) roofRef.current.color.lerp(roofTarget, speed);
    
    if (pillarRef1.current) pillarRef1.current.color.lerp(pillarTarget, speed);
    if (pillarRef2.current) pillarRef2.current.color.lerp(pillarTarget, speed);
    if (pillarRef3.current) pillarRef3.current.color.lerp(pillarTarget, speed);
    if (pillarRef4.current) pillarRef4.current.color.lerp(pillarTarget, speed);
    
    if (benchRef1.current) benchRef1.current.color.lerp(benchTarget, speed);
    if (benchRef2.current) benchRef2.current.color.lerp(benchTarget, speed);
  });

  return (
    <group {...props}>
      {/* Platform */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[12, 1, 6]} />
        <meshStandardMaterial ref={platformRef} color="#F5F5F5" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
         <boxGeometry args={[11.8, 0.1, 5.8]} />
         <meshStandardMaterial color="#FFCCBC" /> {/* Always peach top */}
      </mesh>

      {/* Pillars */}
      <mesh position={[-5, 2, 2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial ref={pillarRef1} color="#42A5F5" />
      </mesh>
      <mesh position={[5, 2, 2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial ref={pillarRef2} color="#42A5F5" />
      </mesh>
      <mesh position={[-5, 2, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial ref={pillarRef3} color="#42A5F5" />
      </mesh>
      <mesh position={[5, 2, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial ref={pillarRef4} color="#42A5F5" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[14, 0.4, 8]} />
        <meshStandardMaterial ref={roofRef} color="#FF5252" />
      </mesh>
      
      {/* Bench */}
      <group position={[0, 1.5, -1]}>
         <mesh position={[-2, 0, 0]}>
            <boxGeometry args={[2, 0.1, 0.8]} />
            <meshStandardMaterial ref={benchRef1} color="#FFEB3B" />
         </mesh>
         <mesh position={[2, 0, 0]}>
            <boxGeometry args={[2, 0.1, 0.8]} />
            <meshStandardMaterial ref={benchRef2} color="#FFEB3B" />
         </mesh>
      </group>

      {/* Sign - Static colors for contrast */}
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
