import React, { forwardRef, useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Tone from 'tone';

// Smoke Particle Component
function Smoke({ position, onPuff }) {
  const ref = useRef();
  const [speed] = useState(() => 0.015 + Math.random() * 0.01); // Slower rise
  const respawnTime = useRef(0); // When to respawn

  useFrame((state) => {
    if (ref.current) {
      // If waiting for next puff
      if (state.clock.elapsedTime < respawnTime.current) {
         ref.current.visible = false;
         return;
      }
      
      // Just appeared? Trigger callback once
      if (!ref.current.visible) {
          if (onPuff) {
              try { onPuff(); } catch(e) { console.warn(e); }
          }
      }

      ref.current.visible = true;
      ref.current.position.y += speed;
      ref.current.scale.addScalar(0.003); // Slower growth
      ref.current.material.opacity -= 0.005; // Slower fade
      
      if (ref.current.material.opacity <= 0) {
        // Reset
        ref.current.position.set(0, 0, 0);
        ref.current.scale.setScalar(0.4); // Start smaller
        ref.current.material.opacity = 0.5;
        
        // Wait 3-6 seconds before next puff (Much less frequent!)
        respawnTime.current = state.clock.elapsedTime + 3.0 + Math.random() * 3.0;
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#ECEFF1" transparent opacity={0.5} />
    </mesh>
  );
}

export const Train = forwardRef(({ bounce = 0, ...props }, ref) => {
  const groupRef = useRef();
  const bodyMatRef = useRef();
  const chimneyMatRef = useRef();
  
  // Audio Synths for Harmonic Train
  const noiseSynthRef = useRef(null);
  const chugSynthRef = useRef(null); // Tonal Chug
  const whistleSynthRef = useRef(null); // Melodic Whistle
  const lastChuuTime = useRef(0);

  useEffect(() => {
    // 1. Noise Synth (Steam Hiss)
    const noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0 }
    }).toDestination();
    const filter = new Tone.Filter(800, "lowpass").toDestination();
    noiseSynth.connect(filter);
    
    // 2. Tonal Chug Synth (Rhythm Harmony - Low C Major)
    const chugSynth = new Tone.PolySynth(Tone.MembraneSynth, {
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.4 }
    }).toDestination();
    chugSynth.volume.value = -10;

    // 3. Whistle Synth (Melodic Accent - G Major)
    const whistleSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 },
        volume: -12
    }).toDestination();
    // Add Reverb to whistle for distance
    const reverb = new Tone.Reverb(3).toDestination();
    whistleSynth.connect(reverb);

    noiseSynthRef.current = noiseSynth;
    chugSynthRef.current = chugSynth;
    whistleSynthRef.current = whistleSynth;
    
    return () => {
        noiseSynth.dispose();
        filter.dispose();
        chugSynth.dispose();
        whistleSynth.dispose();
        reverb.dispose();
    };
  }, []);

  // Play sound on beat (bounce peak)
  useEffect(() => {
    if (bounce > 0.8 && Date.now() - lastChuuTime.current > 400) {
        if (Tone.Transport.state === 'started') {
            const now = Tone.now();
            
            // 1. Play Noise Hiss
            noiseSynthRef.current?.triggerAttackRelease('16n', now);
            
            // 2. Play Tonal Chug (Low C Major: C2, E2, G2)
            // This acts as the harmonic bass/rhythm
            chugSynthRef.current?.triggerAttackRelease(["C2", "G2"], "16n", now);
            
            lastChuuTime.current = Date.now();
        }
    }
  }, [bounce]);

  // Whistle Trigger
  const playWhistle = () => {
      try {
          if (whistleSynthRef.current && Tone.Transport.state === 'started') {
              // Play G Major Whistle (Dominant Chord)
              whistleSynthRef.current.triggerAttackRelease(["G4", "B4", "D5"], "4n");
          }
      } catch (e) {
          // Ignore audio errors to prevent crash
      }
  };

  // Dynamic Colors Definition
  const rainbowColors = useMemo(() => [
    new THREE.Color('#42A5F5'), // Blue
    new THREE.Color('#AB47BC'), // Purple
    new THREE.Color('#EC407A'), // Pink
    new THREE.Color('#FF7043'), // Orange
    new THREE.Color('#FFEE58'), // Yellow
    new THREE.Color('#66BB6A'), // Green
    new THREE.Color('#26C6DA'), // Cyan
  ], []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Squash and stretch
      const stretch = 1 + (bounce * 0.15);
      const squash = 1 - (bounce * 0.07);
      groupRef.current.scale.set(squash, stretch, squash);
      groupRef.current.position.y = bounce * 0.2;
      
      // Color cycling
      if (bounce > 0.01) {
          // Fast cycle based on time
          const colorIndex = Math.floor(time * 2) % rainbowColors.length;
          const nextIndex = (colorIndex + 1) % rainbowColors.length;
          const alpha = (time * 2) % 1;
          
          const targetColor = new THREE.Color().lerpColors(
              rainbowColors[colorIndex], 
              rainbowColors[nextIndex], 
              alpha
          );
          
          if (bodyMatRef.current) bodyMatRef.current.color.lerp(targetColor, 0.1);
          if (chimneyMatRef.current) chimneyMatRef.current.color.setHSL((time * 0.5) % 1, 0.8, 0.6);
      } else {
          // Reset to default Blue
          if (bodyMatRef.current) bodyMatRef.current.color.lerp(new THREE.Color('#42A5F5'), 0.05);
          if (chimneyMatRef.current) chimneyMatRef.current.color.lerp(new THREE.Color('#FFA726'), 0.05);
      }
    }
  });

  return (
    <group ref={ref} {...props}>
      <group ref={groupRef}>
        {/* Main Body */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.6, 1.4, 3.2]} />
          <meshStandardMaterial ref={bodyMatRef} color="#42A5F5" roughness={0.3} />
        </mesh>
        
        {/* Roof */}
        <mesh position={[0, 1.8, 0.5]}>
          <boxGeometry args={[1.8, 0.2, 2]} />
          <meshStandardMaterial color="#EF5350" roughness={0.3} />
        </mesh>

        {/* Chimney */}
        <mesh position={[0, 2, -1]} rotation={[0,0,0]}>
          <cylinderGeometry args={[0.4, 0.3, 1]} />
          <meshStandardMaterial ref={chimneyMatRef} color="#FFA726" roughness={0.3} />
        </mesh>
        
        {/* Smoke Particles (attached to chimney) */}
        {bounce > 0.01 && (
            <group position={[0, 2.5, -1]}>
                <Smoke position={[0, 0, 0]} onPuff={playWhistle} />
                <Smoke position={[0.1, -0.2, 0.1]} />
                <Smoke position={[-0.1, -0.4, -0.1]} />
            </group>
        )}
        
        {/* Face/Front */}
        <mesh position={[0, 1, -1.65]}>
          <circleGeometry args={[0.6, 32]} />
          <meshStandardMaterial color="#ECEFF1" />
        </mesh>
        
        {/* Wheels - Bright Yellow */}
        {[1, -1].map(side => (
          <React.Fragment key={side}>
            <mesh position={[side * 0.9, 0.6, 0.8]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.6, 0.6, 0.3, 16]} />
              <meshStandardMaterial color="#FFEE58" />
            </mesh>
            <mesh position={[side * 0.9, 0.6, -0.8]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.6, 0.6, 0.3, 16]} />
              <meshStandardMaterial color="#FFEE58" />
            </mesh>
          </React.Fragment>
        ))}
        
        {/* Cowcatcher */}
        <mesh position={[0, 0.4, -1.8]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.5, 3]} rotation={[0,0,Math.PI/2]} />
          <meshStandardMaterial color="#EF5350" />
        </mesh>
      </group>
    </group>
  );
});
