import React, { useRef, useEffect } from 'react';
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
  
  // Sync Refs
  const isBurningRef = useRef(false);
  const synthRef = useRef(null);
  const transportEventId = useRef(null);

  // 1. Initialize Synth (Matches Train Whistle - Triangle + Reverb)
  useEffect(() => {
    // Use Triangle oscillator for a clearer, flutey tone (like the train)
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      options: {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.2,
          release: 1.5,
        },
        volume: -12
      }
    });
    
    // Add Reverb for that "background" spacious feel
    const reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.3
    }).toDestination();
    
    synth.connect(reverb);
    
    synthRef.current = synth;

    return () => {
      synth.dispose();
      reverb.dispose();
    };
  }, []);

  // 2. Schedule Audio & Visuals together using Tone.Draw
  useEffect(() => {
    // Cleanup previous schedule if exists
    if (transportEventId.current !== null) {
      Tone.Transport.clear(transportEventId.current);
      transportEventId.current = null;
    }

    if (isPlaying) {
      // Create a repeating event every 4 measures
      
      const scheduleId = Tone.Transport.scheduleRepeat((time) => {
        // A. TRIGGER AUDIO (Scheduled ahead of time)
        if (synthRef.current) {
          // Play a chord that harmonizes with the Train's G Major
          // C Major 9 (C-E-G-B-D) sounds very dreamy and open
          const notes = Math.random() > 0.5 
            ? ["C4", "E4", "G4", "B4"] // C Maj7
            : ["F4", "A4", "C5", "E5"]; // F Maj7
            
          synthRef.current.triggerAttackRelease(notes, "2n", time);
        }

        // B. TRIGGER VISUAL (Synced to the exact frame the audio plays)
        Tone.Draw.schedule(() => {
          isBurningRef.current = true;
          
          // Burn for 2 seconds
          setTimeout(() => {
            isBurningRef.current = false;
          }, 2000);
        }, time);

      }, "4m", "0m"); // Start at 0m, repeat every 4m

      transportEventId.current = scheduleId;
    } else {
      // Reset state when stopped
      isBurningRef.current = false;
    }

    return () => {
      if (transportEventId.current !== null) {
        Tone.Transport.clear(transportEventId.current);
      }
      // Cancel any pending visual events
      Tone.Draw.cancel();
      isBurningRef.current = false;
    };
  }, [isPlaying]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speed = delta * 2;

    // Color updates
    if (balloonMatRef.current) {
      balloonMatRef.current.color.lerp(new THREE.Color(isPlaying ? macaroonColor : color), speed);
    }
    if (stripesMatRef.current) {
      stripesMatRef.current.color.lerp(new THREE.Color(isPlaying ? "#FFF9C4" : "#FFCCBC"), speed);
    }
    if (basketMatRef.current) {
      basketMatRef.current.color.lerp(new THREE.Color(isPlaying ? "#D7CCC8" : "#8D6E63"), speed);
    }

    // Visual Animation
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 0.5) * 1.5;
      ref.current.rotation.y = t * 0.05;
      
      // Check the Ref directly (updated by Tone.Draw)
      const isBurning = isBurningRef.current;
      
      if (isBurning) {
        const flicker = 0.8 + Math.random() * 0.4;
        if (lightRef.current) lightRef.current.intensity = 3 * flicker;
        if (flameRef.current) {
          flameRef.current.visible = true;
          const s = 1 + Math.random() * 0.5;
          flameRef.current.scale.set(s, s * 1.5, s);
        }
      } else {
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
