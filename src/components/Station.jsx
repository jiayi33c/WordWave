import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Station({ isPlaying, bounce = 0, ...props }) { // bounce prop is now ignored, internal calculation used
  // Material refs for smooth transition
  const platformRef = useRef();
  const roofRef = useRef();
  const pillarRef1 = useRef();
  const pillarRef2 = useRef();
  const pillarRef3 = useRef();
  const pillarRef4 = useRef();
  const benchRef1 = useRef();
  const benchRef2 = useRef();
  
  // Light refs for beat sync
  const lightRef = useRef();
  const bulbRef = useRef();

  // Sign Light refs
  const signLight1Ref = useRef();
  const signLight2Ref = useRef();
  const signLight3Ref = useRef();

  useFrame((state, delta) => {
    const speed = delta * 1.5; // Same smooth speed as trees
    const t = state.clock.getElapsedTime();
    
    // Internal bounce calculation for performance
    const beat = Math.sin(t * Math.PI * 4);
    const localBounce = isPlaying ? Math.max(0, beat) : 0;

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
    
    // 1. Hanging Lamp Animation (Warm Glow)
    if (isPlaying) {
        const intensity = 1 + localBounce * 3;
        if (lightRef.current) lightRef.current.intensity = intensity;
        if (bulbRef.current) bulbRef.current.emissiveIntensity = 0.5 + localBounce * 2;
    } else {
        if (lightRef.current) lightRef.current.intensity = 1;
        if (bulbRef.current) bulbRef.current.emissiveIntensity = 0.5;
    }

    // 2. Station Sign Lights Animation (Disco Traffic Light!)
    // We'll make them flash in sequence or pulse on the beat
    if (isPlaying) {
        const tFast = t * 10; // Fast cycle
        
        // Sequential flashing based on time + beat boost
        const intensity1 = Math.sin(tFast) > 0 ? 2 : 0.2;
        const intensity2 = Math.sin(tFast + 2) > 0 ? 2 : 0.2; 
        const intensity3 = Math.sin(tFast + 4) > 0 ? 2 : 0.2;

        // Add the "bounce" kick to make them really pop on the beat
        const beatBoost = localBounce * 3; 

        if (signLight1Ref.current) signLight1Ref.current.emissiveIntensity = intensity1 + beatBoost;
        if (signLight2Ref.current) signLight2Ref.current.emissiveIntensity = intensity2 + beatBoost;
        if (signLight3Ref.current) signLight3Ref.current.emissiveIntensity = intensity3 + beatBoost;
    } else {
        // Dim when idle
        if (signLight1Ref.current) signLight1Ref.current.emissiveIntensity = 0;
        if (signLight2Ref.current) signLight2Ref.current.emissiveIntensity = 0;
        if (signLight3Ref.current) signLight3Ref.current.emissiveIntensity = 0;
    }
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
      
      {/* Hanging Lamp - Rhythmic Light! */}
      <group position={[0, 3.8, 0]}>
          {/* Cord */}
          <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.4]} />
              <meshStandardMaterial color="#333" />
          </mesh>
          {/* Bulb/Fixture */}
          <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                ref={bulbRef} 
                color="#FFF59D" 
                emissive="#FFF59D" 
                emissiveIntensity={0.5} 
                toneMapped={false}
              />
          </mesh>
          {/* The Actual Light Source */}
          <pointLight 
            ref={lightRef} 
            color="#FFD54F" 
            intensity={1} 
            distance={15} 
            decay={2} 
          />
      </group>
      
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

      {/* Sign - NOW ANIMATED! */}
      <group position={[0, 5.5, 0]}>
        <mesh>
           <boxGeometry args={[4, 1.2, 0.2]} />
           <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Light 1: Blue */}
        <mesh position={[-1, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial 
             ref={signLight1Ref} 
             color="#42A5F5" 
             emissive="#42A5F5"
             emissiveIntensity={0}
             toneMapped={false} // Makes it look like a real light source
           />
        </mesh>
        
        {/* Light 2: Red */}
        <mesh position={[0, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial 
             ref={signLight2Ref} 
             color="#EF5350" 
             emissive="#EF5350"
             emissiveIntensity={0}
             toneMapped={false}
           />
        </mesh>
        
        {/* Light 3: Yellow */}
        <mesh position={[1, 0, 0.15]}>
           <circleGeometry args={[0.3, 32]} />
           <meshStandardMaterial 
             ref={signLight3Ref} 
             color="#FFCA28" 
             emissive="#FFCA28"
             emissiveIntensity={0}
             toneMapped={false}
           />
        </mesh>
      </group>
    </group>
  );
}