import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Tone from 'tone';

export function HotAirBalloon({ position = [0, 20, 0], color = "#FF7043", isPlaying = false }) {
  const ref = useRef();
  const lightRef = useRef();
  const flameRef = useRef();
  
  // Material refs for color transition
  const balloonMatRef = useRef();
  const stripesMatRef = useRef();
  const basketMatRef = useRef();
  
  // Macaroon colors for balloons
  const macaroonColors = ["#FFB7B2", "#B2EBF2", "#E1BEE7", "#FFF9C4", "#C8E6C9", "#FFCCBC"];
  const macaroonColor = macaroonColors[Math.floor(position[0] + position[1]) % macaroonColors.length];
  
  // State for interaction
  const [isBurning, setIsBurning] = useState(false);
  const nextBurnTime = useRef(0);
  const synthRef = useRef(null);
  const hasSoundPlayed = useRef(false); // Track if sound played for current burn

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
    
    // Initialize tracker
    nextBurnTime.current = -1; 

    return () => {
        synth.dispose();
        reverb.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const now = Date.now();
    const speed = delta * 2; // Color transition speed

    // Color transition to macaroon when playing
    if (balloonMatRef.current) {
      const targetColor = new THREE.Color(isPlaying ? macaroonColor : color);
      balloonMatRef.current.color.lerp(targetColor, speed);
    }
    if (stripesMatRef.current) {
      const targetStripe = new THREE.Color(isPlaying ? "#FFF9C4" : "#FFCCBC"); // Lemon yellow when playing
      stripesMatRef.current.color.lerp(targetStripe, speed);
    }
    if (basketMatRef.current) {
      const targetBasket = new THREE.Color(isPlaying ? "#D7CCC8" : "#8D6E63"); // Lighter brown when playing
      basketMatRef.current.color.lerp(targetBasket, speed);
    }

    // 1. Check if it's time to BURN (Synced to Beat)
    // 120 BPM = 0.5s per beat, 2.0s per bar (4/4)
    if (isPlaying && Tone.Transport.state === 'started') {
       const time = Tone.Transport.seconds;
       const barDuration = 2.0; // 4 beats * 0.5s
       const currentBar = Math.floor(time / barDuration);
       
       // Burn every 4 bars (on the "1")
       // Use a ref to ensure we only trigger once per cycle
       if (currentBar % 4 === 0 && currentBar !== nextBurnTime.current) {
           nextBurnTime.current = currentBar; // Use this ref to store "last triggered bar" instead of time
           
           setIsBurning(true);
           hasSoundPlayed.current = false;
           
           // Burn for 1 bar (2 seconds)
           setTimeout(() => setIsBurning(false), 2000);
       }
    } else if (!isPlaying && isBurning) {
        // Stop burning immediately if music stops
        setIsBurning(false);
        nextBurnTime.current = -1; // Reset tracker
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
            
            // Play sound ONLY when fire is visible and hasn't played yet
            if (!hasSoundPlayed.current && synthRef.current && Tone.Transport.state === 'started') {
                hasSoundPlayed.current = true;
                const nowTime = Tone.now();
                const notes = Math.random() > 0.5 
                    ? ["C4", "G4", "E5"] 
                    : ["F4", "C5", "A5"];
                synthRef.current.triggerAttackRelease(notes[0], "1n", nowTime, 0.6);
                synthRef.current.triggerAttackRelease(notes[1], "1n", nowTime + 0.05, 0.5);
                synthRef.current.triggerAttackRelease(notes[2], "1n", nowTime + 0.1, 0.4);
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
        <meshStandardMaterial ref={balloonMatRef} color={color} roughness={0.4} />
      </mesh>
      {/* Stripes */}
      <mesh position={[0, 2, 0]} scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[3, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        <meshStandardMaterial ref={stripesMatRef} color="#FFCCBC" wireframe transparent opacity={0.3} />
      </mesh>
      
      {/* Basket */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={basketMatRef} color="#8D6E63" />
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
