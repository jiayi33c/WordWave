import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Tone from 'tone';

export function HotAirBalloon({ position = [0, 20, 0], color = "#FF7043", isPlaying = false }) {
  const ref = useRef();
  const lightRef = useRef();
  const flameRef = useRef();
  
  // State for interaction
  const [isBurning, setIsBurning] = useState(false);
  const nextBurnTime = useRef(0);
  const synthRef = useRef(null);

  useEffect(() => {
    // Initialize AMSynth for "Piano/Bell" sound
    const synth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.5,
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.2,
        release: 1.5,
      },
      modulation: { type: "square" },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 1.5,
      },
      volume: -10
    }).toDestination();
    
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();
    synth.connect(reverb);
    
    synthRef.current = synth;
    
    // Start loop soon
    nextBurnTime.current = Date.now() + 1000; 

    return () => {
        synth.dispose();
        reverb.dispose();
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const now = Date.now();

    // 1. Check if it's time to BURN (Only if playing!)
    if (isPlaying && now > nextBurnTime.current) {
       // Trigger burner
       setIsBurning(true);
       
       // Play Sound (Piano/Bell Chord) - HARMONIC UPDATE
       if (synthRef.current && Tone.Transport.state === 'started') {
           const nowTime = Tone.now();
           // Use "Spread Voicings" for a more open, harmonic orchestral sound
           // C Major Spread: C4 (Root), G4 (5th), E5 (10th)
           // F Major Spread: F4 (Root), C5 (5th), A5 (10th)
           const notes = Math.random() > 0.5 
               ? ["C4", "G4", "E5"] 
               : ["F4", "C5", "A5"];
               
           // Play softly with a slight stagger (strum)
           synthRef.current.triggerAttackRelease(notes[0], "1n", nowTime, 0.6);
           synthRef.current.triggerAttackRelease(notes[1], "1n", nowTime + 0.05, 0.5);
           synthRef.current.triggerAttackRelease(notes[2], "1n", nowTime + 0.1, 0.4);
       }

       // Burn for 1-2 seconds
       const duration = 1000 + Math.random() * 1000;
       setTimeout(() => setIsBurning(false), duration); 
       
       // Schedule next burn (random 4-8 seconds)
       nextBurnTime.current = now + 4000 + Math.random() * 4000;
    } else if (!isPlaying && isBurning) {
        // Stop burning immediately if music stops
        setIsBurning(false);
    }

    // 2. Visual Animation
    if (ref.current) {
        // Smooth floating movement (No shaking/jumping)
        ref.current.position.y = position[1] + Math.sin(t * 0.5) * 1.5;
        ref.current.rotation.y = t * 0.05;
        
        // 3. Flame & Light Logic
        if (isBurning) {
            // Flicker intensity
            const flicker = 0.8 + Math.random() * 0.4;
            
            if (lightRef.current) {
                lightRef.current.intensity = 3 * flicker;
            }
            
            if (flameRef.current) {
                flameRef.current.visible = true;
                // Scale flame with flicker
                const s = 1 + Math.random() * 0.5;
                flameRef.current.scale.set(s, s * 1.5, s);
            }
        } else {
            // Off state
            if (lightRef.current) lightRef.current.intensity = 0;
            if (flameRef.current) flameRef.current.visible = false;
        }
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Balloon Body */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Stripes */}
      <mesh position={[0, 2, 0]} scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[3, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial color="#FFCCBC" wireframe transparent opacity={0.3} />
      </mesh>
      
      {/* Basket */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      
      {/* Burner / Flame Area (Just above basket) */}
      <group position={[0, -1.2, 0]}>
          {/* The Light Source */}
          <pointLight ref={lightRef} color="#FF9800" distance={8} decay={2} intensity={0} />
          
          {/* The Visible Flame Mesh */}
          <mesh ref={flameRef} visible={false}>
              <coneGeometry args={[0.3, 0.6, 8]} />
              <meshBasicMaterial color="#FF5722" transparent opacity={0.8} />
          </mesh>
      </group>
      
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
