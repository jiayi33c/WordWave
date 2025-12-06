import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Cloud, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Train } from './components/Train';
import { Trees } from './components/Trees';
import { Mountains } from './components/Mountains';
import { Station } from './components/Station';
import { HotAirBalloon } from './components/HotAirBalloon';
import { WordCloud } from './components/WordCloud';
import { Lollipop } from './components/Lollipop';
import HandInput from './components/HandInput';
import { DropZone } from './components/DropZone';
// CallResponsePlayer functionality is now integrated into DropZone
import { fetchRelatedWords } from './utils/wordApi';
import { audioService } from './services/audioService'; // Import audioService
import * as patternService from './services/patternService';
import { magentaService } from './services/magentaService';
import VoiceAgent from './components/VoiceAgent';

// ═══════════════════════════════════════════════════════════════════════════
// Dynamic Beat Generator - Step Sequencer Style
// Creates varied, musical drum patterns like a real beat maker
// ═══════════════════════════════════════════════════════════════════════════

const BEAT_CONFIG = {
  bpm: 120, // Must match TEMPO in DropZone.jsx
  // Kick settings
  kick: {
    onFour: true,        // Hit on downbeats (1, 3)
    density: 25,         // % chance of extra hits
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], // Base pattern
  },
  // Snare settings
  snare: {
    backbeat: true,      // Hit on 2 and 4
    density: 15,         // % chance of ghost notes
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // Hi-hat settings
  hat: {
    rate: '8th',         // '16th', '8th', or 'off'
    density: 80,         // % chance to play
    openPattern: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0], // Open hat accents
  },
  // Swing for groove feel
  swing: 0.02,           // Slight swing on off-beats
  };

// Generate a dynamic groove pattern (kick, snare, hi-hat)
// This creates a 1-bar (4 beats) loop that matches TEMPO in DropZone
function createFallbackGroove() {
  const events = [];
  const bpm = BEAT_CONFIG.bpm; // 120 BPM
  const beatsPerBar = 4;
  const stepsPerBeat = 4; // 16th notes
  const totalSteps = beatsPerBar * stepsPerBeat; // 16 steps
  const secondsPerBeat = 60 / bpm; // 0.5 sec at 120 BPM
  const sp16 = secondsPerBeat / stepsPerBeat; // ~0.125 sec per 16th

  console.log(`🎵 Generating groove: ${bpm} BPM, ${sp16.toFixed(3)}s per 16th, ${(sp16 * totalSteps).toFixed(2)}s loop`);

  for (let step = 0; step < totalSteps; step++) {
    let time = step * sp16;
    
    // Add swing to off-beat 16ths
    if (step % 2 === 1) {
      time += BEAT_CONFIG.swing;
    }

    // ─── KICK DRUM ───
    const kickBase = BEAT_CONFIG.kick.pattern[step];
    const kickRandom = Math.random() * 100 < BEAT_CONFIG.kick.density;
    if (kickBase || kickRandom) {
      events.push({
        time,
        drum: 'kick',
        velocity: kickBase ? 0.9 : 0.6,
        duration: 0.1
      });
    }

    // ─── SNARE DRUM ───
    const snareBase = BEAT_CONFIG.snare.pattern[step];
    const snareGhost = Math.random() * 100 < BEAT_CONFIG.snare.density;
    if (snareBase) {
      events.push({
        time,
        drum: 'snare',
        velocity: 0.85,
        duration: 0.15
      });
    } else if (snareGhost && step % 4 !== 0) {
      events.push({
        time,
        drum: 'snare',
        velocity: 0.3,
        duration: 0.08
      });
    }

    // ─── HI-HAT ───
    const hatOpen = BEAT_CONFIG.hat.openPattern[step];
    let playHat = false;
    
    if (BEAT_CONFIG.hat.rate === '16th') {
      playHat = true;
    } else if (BEAT_CONFIG.hat.rate === '8th') {
      playHat = step % 2 === 0;
    } else if (BEAT_CONFIG.hat.rate === 'off') {
      playHat = step % 4 === 2;
    }

    if (playHat && Math.random() * 100 < BEAT_CONFIG.hat.density) {
      if (hatOpen) {
        events.push({
          time,
          drum: 'hihatOpen',
          velocity: 0.5,
          duration: 0.15
        });
      } else {
        events.push({
          time,
          drum: 'hihatClosed',
          velocity: 0.4 + (step % 4 === 0 ? 0.15 : 0),
          duration: 0.05
        });
      }
    }
  }

  events.sort((a, b) => a.time - b.time);
  
  const loopDuration = sp16 * totalSteps;
  console.log(`🥁 Created groove: ${events.length} events, loop: ${loopDuration.toFixed(2)}s (kick/snare/hat)`);
  return events;
}

// Generate groove with specific style
function createGrooveWithStyle(style = 'hiphop') {
  const styles = {
    hiphop: {
      kick: { pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], density: 20 },
      snare: { pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], density: 10 },
      hat: { rate: '8th', density: 85 },
    },
    trap: {
      kick: { pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], density: 30 },
      snare: { pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], density: 5 },
      hat: { rate: '16th', density: 90 },
    },
    lofi: {
      kick: { pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0], density: 15 },
      snare: { pattern: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], density: 20 },
      hat: { rate: '8th', density: 70 },
    },
  };

  const config = styles[style] || styles.hiphop;
  Object.assign(BEAT_CONFIG.kick, config.kick);
  Object.assign(BEAT_CONFIG.snare, config.snare);
  Object.assign(BEAT_CONFIG.hat, config.hat);

  return createFallbackGroove();
}

// Helper to get position on our wobbly track
function getTrackPosition(angle) {
  const r = 15 + 2 * Math.sin(4 * angle); // Wobbly radius
  const x = Math.sin(angle) * r * 1.2; 
  const z = Math.cos(angle) * r * 0.6; 
  
  // Steeper hills and valleys
  const y = 0.1 + (Math.sin(2 * angle) + 1) * 2.0; 
  return { x, y, z, r };
}

// Component to handle scene environment transition
function EnvironmentController({ isPlaying }) {
  // Target values
  const targetBg = isPlaying ? new THREE.Color('#F8BBD0') : new THREE.Color('#81D4FA');
  const targetFog = isPlaying ? new THREE.Color('#F8BBD0') : new THREE.Color('#81D4FA');
  const targetGround = isPlaying ? new THREE.Color('#B2DFDB') : new THREE.Color('#66BB6A');
  
  // Current values (refs for direct manipulation)
  const groundMatRef = useRef();
  const skyRef = useRef();
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Calculate beat for groovy effect
    const beat = Math.sin(t * Math.PI * 4); // 120 BPM
    const bounce = isPlaying ? Math.max(0, beat) : 0;
    
    // Smooth transition speed
    const speed = delta * 2;
    
    // Lerp background with groove pulse
    if (state.scene.background instanceof THREE.Color) {
      state.scene.background.lerp(targetBg, speed);
      
      // Add brightness pulse on beat when playing
      if (isPlaying) {
        const pulseColor = state.scene.background.clone();
        pulseColor.offsetHSL(0, 0, bounce * 0.1); // Brighten on beat
        state.scene.background.copy(pulseColor);
      }
    } else {
        state.scene.background = targetBg.clone();
    }
    
    // Lerp fog with groove pulse
    if (state.scene.fog) {
      state.scene.fog.color.lerp(targetFog, speed);
      
      // Pulse fog distance for "breathing" effect
      if (isPlaying) {
        state.scene.fog.near = 60 - bounce * 10; // Fog comes closer on beat
        state.scene.fog.far = 150 - bounce * 20;
      } else {
        state.scene.fog.near = 60;
        state.scene.fog.far = 150;
      }
    }
    
    // Lerp ground color with groove pulse
    if (groundMatRef.current) {
      groundMatRef.current.color.lerp(targetGround, speed);
      
      // Ground brightness pulse
      if (isPlaying) {
        const groundPulse = groundMatRef.current.color.clone();
        groundPulse.offsetHSL(0, bounce * 0.1, bounce * 0.05);
        groundMatRef.current.color.copy(groundPulse);
      }
    }
  });

  return (
    <>
      <fog attach="fog" args={['#81D4FA', 60, 150]} />
      <color attach="background" args={['#81D4FA']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial ref={groundMatRef} color="#66BB6A" /> 
      </mesh>
      
      <Sky 
        ref={skyRef}
        sunPosition={[100, 40, 100]} 
        turbidity={isPlaying ? 12 : 8} 
        rayleigh={isPlaying ? 1 : 3} 
        mieCoefficient={isPlaying ? 0.01 : 0.005} 
        mieDirectionalG={0.8}
      />
    </>
  );
}

function Track({ isPlaying }) {
  const groupRef = useRef();
  
  const segments = useMemo(() => {
    const temp = [];
    const count = 600; 
    // Classic Wood Theme 🪵
    const colors = [
      new THREE.Color('#D7CCC8'), // Very Light Wood
      new THREE.Color('#BCAAA4'), // Light Wood
      new THREE.Color('#A1887F'), // Medium Wood
      new THREE.Color('#8D6E63')  // Warm Wood
    ];
    
    // Macaroon Theme 🍬
    const macaroonColors = [
      new THREE.Color('#FFCDD2'), // Pink
      new THREE.Color('#F8BBD0'), // Light Pink
      new THREE.Color('#E1BEE7'), // Purple
      new THREE.Color('#D1C4E9'), // Indigo
      new THREE.Color('#C5CAE9'), // Blue
      new THREE.Color('#B2DFDB'), // Teal
      new THREE.Color('#C8E6C9'), // Green
      new THREE.Color('#DCEDC8'), // Light Green
      new THREE.Color('#F0F4C3'), // Lime
      new THREE.Color('#FFF9C4'), // Yellow
      new THREE.Color('#FFECB3'), // Amber
      new THREE.Color('#FFE0B2'), // Orange
      new THREE.Color('#FFCCBC'), // Deep Orange
    ];
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2;
      const { x, y, z } = getTrackPosition(angle);
      
      const nextAngle = angle + 0.005; 
      const nextPos = getTrackPosition(nextAngle);
      const dx = nextPos.x - x;
      const dy = nextPos.y - y;
      const dz = nextPos.z - z;
      
      const rotationY = Math.atan2(dx, dz); 
      const dist = Math.sqrt(dx*dx + dz*dz);
      const rotationX = -Math.atan2(dy, dist);

      temp.push({ 
        pos: [x, y, z], 
        rot: [rotationX, rotationY + Math.PI/2, 0], 
        color: colors[i % colors.length],
        macaroonColor: macaroonColors[i % macaroonColors.length]
      });
    }
    return temp;
  }, []);

  // Animate track colors
  useFrame((state, delta) => {
    const speed = delta * 2; // Fade speed
    if (groupRef.current) {
        groupRef.current.children.forEach((mesh, i) => {
            if (mesh.material) {
                const targetColor = isPlaying ? segments[i].macaroonColor : segments[i].color;
                mesh.material.color.lerp(targetColor, speed);
            }
        });
    }
  });

  return (
    <group ref={groupRef}>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot}>
          <boxGeometry args={[0.5, 0.3, 1.0]} />
          <meshStandardMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ handPos, isPinching, words, onWordGrab, onWordDrop, onWordClick, isPlaying, musicDuration, activeWordText, droppedWords, onGestureSing, currentPhase, sessionPhase }) {
  const trainRef = useRef();
  const [isMoving, setIsMoving] = useState(false);  
  
  // Gesture state
  const pinchStartTime = useRef(0);
  const gestureProgress = useRef(0);
  const gestureRingRef = useRef();
  const phaseTextRef = useRef(); // Ref for animating the 3D text
  const GESTURE_THRESHOLD = 1.5; // hold for 1.5s to start
  
  // Train movement state
  const startAngle = Math.PI + 0.6;
  const trainAngleRef = useRef(startAngle);
  const trainStartTimeRef = useRef(null); // When train started moving
  
  // Access the audio service to get the beat
  // Removed bounce state for performance
  // const [bounce, setBounce] = useState(0);
  
  // Determine which words to show
  // If playing, show the dropped words (lyrics) in a stage formation
  // If idle, show the uncollected words in the sky
  const visibleWords = useMemo(() => {
    if (isPlaying) {
      // Map dropped words to stage positions - Broad Arc in the Sky
      const count = droppedWords.length;
      return droppedWords.map((w, i) => {
        // Broad arc: -50 to 50 degrees (100 degrees total)
        const totalSpread = Math.PI * 0.55; 
        const startAngle = -totalSpread / 2;
        // If only 1 item, center it. Else distribute.
        const angle = count === 1 ? 0 : startAngle + (i / (count - 1)) * totalSpread;
        
        // Push further back (Z = -15) so we can have a wider visible area
        const radius = 25; 
        const x = Math.sin(angle) * radius; 
        const z = Math.cos(angle) * radius * 0.5 - 20; // Deep in the sky (approx z = -10 to -20)
        
        // High Y positions with wave (Lowered from 18 to 14)
        const y = 14 + Math.sin(i * 1.5) * 2; 
        
        return {
          ...w,
          position: [x, y, z],
          startOffset: i * 7
        };
      });
    } else {
      return words;
    }
  }, [isPlaying, words, droppedWords]);

  // Projectile system state
  const [projectiles, setProjectiles] = useState([]);
  const prevActiveWordRef = useRef(null);

  // Detect when active word changes to trigger projectile
  useEffect(() => {
     if (activeWordText && activeWordText !== prevActiveWordRef.current) {
        // Search in visibleWords because that's what is rendered!
        const prevWordObj = visibleWords.find(w => w.text === prevActiveWordRef.current);
        const currWordObj = visibleWords.find(w => w.text === activeWordText);
        
        if (prevWordObj && currWordObj) {
            // Use the pre-calculated positions if available, or calculate
            const getPos = (w) => {
                if (w.position) return new THREE.Vector3(...w.position);
                // Fallback for idle words (shouldn't happen during play)
                return new THREE.Vector3(0, 10, 0); 
            };

            const startPos = getPos(prevWordObj);
            const endPos = getPos(currWordObj);
            
            const id = Date.now();
            setProjectiles(prev => [...prev, { id, startPos, endPos }]);
        }
        
        prevActiveWordRef.current = activeWordText;
     }
  }, [activeWordText, visibleWords]);

  const removeProjectile = (id) => {
      setProjectiles(prev => prev.filter(p => p.id !== id));
  };
  
  useFrame((state, delta) => {
    // Beat calculation logic moved to individual components for performance!
  });
  
  const recentlyGrabbed = useRef(new Set());
  const { camera } = useThree();
  
  // Smoothed hand position to reduce jitter
  const smoothedHandPos = useRef({ x: 0.5, y: 0.5 });
  const [hoveredWordIdx, setHoveredWordIdx] = useState(-1); // Track hovered word
  
  useEffect(() => {
    if (handPos && !isMoving) {
      setIsMoving(true);
    }
  }, [handPos, isMoving]);

  // Update smoothed hand position every frame
  useFrame(() => {
    if (handPos) {
      // Lerp towards actual hand position for smoother movement
      const smoothFactor = 0.15; // Lower = smoother but laggier
      smoothedHandPos.current.x += (handPos.x - smoothedHandPos.current.x) * smoothFactor;
      smoothedHandPos.current.y += (handPos.y - smoothedHandPos.current.y) * smoothFactor;
    }
  });

  // Grab Logic & Gesture Detection
  useFrame((state, delta) => {
    // Always calculate hover state if hand is present
    // AND only if NOT playing (can't grab words during song)
    if (handPos && !isPlaying) {
      const time = performance.now() / 1000;
      const handScreenX = handPos.x;
      const handScreenY = handPos.y;
      
      let closestCloud = null;
      let minDst = 1000;
      let closestIdx = -1;
      
      for (let i = 0; i < visibleWords.length; i++) {
        const w = visibleWords[i];
        if (recentlyGrabbed.current.has(w.text)) continue;
        
        // Calculate position (Logic duplicated from render - ideal to consolidate)
        let cloudPos3D;
        if (w.position) {
             cloudPos3D = new THREE.Vector3(...w.position);
        } else {
            const startOffset = (i / visibleWords.length) * 80 - 40;
            const y = 9 + (i % 3) * 3 + (i * 0.7) % 2; 
            const z = -8 - (i % 2) * 8 - (i * 1.3) % 5;
            const speed = 0.8 + (i * 0.13) % 0.4;
            const trackWidth = 60;
            let currentX = ((time * speed + startOffset) % trackWidth) - (trackWidth / 2);
            if (speed < 0) currentX = -currentX;
            cloudPos3D = new THREE.Vector3(currentX, y, z);
        }
        
        const cloudScreenPos = cloudPos3D.clone().project(camera);
        
        const cloudScreenX = (cloudScreenPos.x + 1) / 2;
        const cloudScreenY = (-cloudScreenPos.y + 1) / 2; 
        
        const dx = handScreenX - cloudScreenX;
        const dy = handScreenY - cloudScreenY;
        const screenDist = Math.sqrt(dx*dx + dy*dy);
        
        // Grab if within ~5% of screen (Must be RIGHT ON the cloud)
        if (screenDist < 0.05) {
          if (screenDist < minDst) {
            minDst = screenDist;
            closestCloud = w;
            closestIdx = i;
          }
        }
      }
      
      // Update hover state
      if (closestIdx !== hoveredWordIdx) {
        setHoveredWordIdx(closestIdx);
      }

      // Check for grab vs Sing Gesture
      if (isPinching) {
          if (closestCloud) {
              // Grabbing a word
              recentlyGrabbed.current.add(closestCloud.text);
              setTimeout(() => {
                recentlyGrabbed.current.delete(closestCloud.text);
              }, 500);
              
              onWordGrab(closestCloud);
              onWordDrop(closestCloud);
              
              // Reset gesture if grabbing
              gestureProgress.current = 0;
          } else {
              // Pinching EMPTY AIR -> Sing Gesture!
              // Only if we have collected words
              if (droppedWords.length > 0) {
                  gestureProgress.current += delta;
                  if (gestureProgress.current > GESTURE_THRESHOLD) {
                      onGestureSing();
                      gestureProgress.current = 0;
                  }
              }
          }
      } else {
          // Not pinching
          gestureProgress.current = 0;
      }

      // Update Gesture Ring Visual
      if (gestureRingRef.current && handPos) {
          // Position: Unproject smoothed hand pos to 3D space in front of camera
          // We need a position that follows the cursor but exists in 3D world
          const vec = new THREE.Vector3(
            (smoothedHandPos.current.x * 2) - 1,
            -(smoothedHandPos.current.y * 2) + 1,
            0.5 
          );
          vec.unproject(camera);
          const dir = vec.sub(camera.position).normalize();
          const distance = 10; // Fixed distance
          const pos = camera.position.clone().add(dir.multiplyScalar(distance));
          
          gestureRingRef.current.position.copy(pos);
          gestureRingRef.current.lookAt(camera.position);
          
          const progress = Math.min(gestureProgress.current / GESTURE_THRESHOLD, 1);
          const scale = progress * 0.8 + 0.01; // Grow from 0
          gestureRingRef.current.scale.setScalar(scale);
          gestureRingRef.current.visible = progress > 0.01;
          
          // Color pulse
          if (gestureRingRef.current.material) {
             gestureRingRef.current.material.opacity = 0.5 + progress * 0.5;
             gestureRingRef.current.material.color.setHSL(progress * 0.3, 1, 0.5); // Red to Green
          }
      }
    } else {
      if (hoveredWordIdx !== -1) setHoveredWordIdx(-1);
      gestureProgress.current = 0;
      if (gestureRingRef.current) gestureRingRef.current.visible = false;
    }
  });
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime(); // Define time variable for groove animations

    if (trainRef.current) {
      const loopLength = Math.PI * 2;

      // Movement Logic - Synchronized with music duration
      if (isPlaying && musicDuration) {
         // Start tracking time when music begins
         if (trainStartTimeRef.current === null) {
            trainStartTimeRef.current = Date.now();
            trainAngleRef.current = startAngle;
         }
         
         // Calculate progress based on elapsed time vs total duration
         const elapsed = (Date.now() - trainStartTimeRef.current) / 1000;
         const progress = Math.min(elapsed / musicDuration, 1); // 0 to 1
         
         // Train completes exactly one loop over the music duration
         trainAngleRef.current = startAngle + (progress * loopLength);
         
      } else if (!isPlaying && trainStartTimeRef.current !== null) {
         // Music stopped - snap to station
         trainAngleRef.current = startAngle;
         trainStartTimeRef.current = null;
      } else {
         // Resting at station (no music playing)
         trainAngleRef.current = startAngle;
      }
      
      const angle = trainAngleRef.current;
      const { x, y, z } = getTrackPosition(angle);
      trainRef.current.position.x = x;
      trainRef.current.position.y = y + 0.1; 
      trainRef.current.position.z = z;
      
      const nextAngle = angle + 0.05; 
      const nextPos = getTrackPosition(nextAngle);
      const dx = nextPos.x - x;
      const dy = nextPos.y - y;
      const dz = nextPos.z - z;
      
      const rotationY = Math.atan2(dx, dz) + Math.PI;
      const dist = Math.sqrt(dx*dx + dz*dz);
      const rotationX = -Math.atan2(dy, dist); 

      trainRef.current.rotation.y = rotationY;
      trainRef.current.rotation.x = rotationX;
    }
    
    // Animate Phase Text
    if (phaseTextRef.current) {
         // Float up and down
         phaseTextRef.current.position.y = 3.5 + Math.sin(t * 2) * 0.3;
         // Gentle rotation wobble
         phaseTextRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
         // Scale pulse
         const scale = 1 + Math.sin(t * 4) * 0.05;
         phaseTextRef.current.scale.set(scale, scale, scale);
    }
    
    // Camera control
    // 1. Hand Tracking Control
    // Only move camera if hand detected AND NOT pinching
    // This prevents "shaky screen" while trying to drag words
    // Uses smoothed hand position for smoother camera movement
    
    // Groove Factors
    const grooveBob = isPlaying ? Math.sin(t * 8) * 0.15 : 0; // Vertical bounce
    const grooveSway = isPlaying ? Math.sin(t * 4) * 0.01 : 0; // Slight tilt
    
    if (handPos && !isPinching) {
      const targetX = (0.5 - smoothedHandPos.current.x) * 40; 
      const targetY = (smoothedHandPos.current.y) * 15 + 5;   
      const targetZ = 25; 
      
      const lerpSpeed = 0.05;
      state.camera.position.x += (targetX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (targetY - state.camera.position.y + grooveBob) * lerpSpeed; // Add groove
      state.camera.position.z += (targetZ - state.camera.position.z) * lerpSpeed;
      
      state.camera.lookAt(0, 6, 0); 
      // state.camera.rotation.z = grooveSway; // Removed sway to ensure stable interactions
      
    } else if (!handPos) {
      // Only return to default if hand is NOT detected at all
      // If pinching, we do nothing (hold current view stable)
      const defaultX = 0;
      const defaultY = 14; 
      const defaultZ = 34; 
      const lerpSpeed = 0.02;
      
      state.camera.position.x += (defaultX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (defaultY - state.camera.position.y + grooveBob) * lerpSpeed; // Add groove
      state.camera.position.z += (defaultZ - state.camera.position.z) * lerpSpeed;
      
      state.camera.lookAt(0, 6, 0); 
      // state.camera.rotation.z = grooveSway; 
    }
    // If pinching (handPos && isPinching), we skip updates to keep camera steady
  });

  return (
    <>
      <EnvironmentController isPlaying={isPlaying} />
      
      <ambientLight intensity={1.2} />
      <pointLight position={[20, 40, 20]} intensity={1.5} />
      <directionalLight position={[-30, 50, 20]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
      
      <Track isPlaying={isPlaying} />
      <group>
        <Train ref={trainRef} isPlaying={isPlaying} />
      </group>
      <Station isPlaying={isPlaying} position={[-11.3, 3.0, -7.9]} rotation={[0, 0.6, 0]} />
      {/* Trees closer to track (boundary reduced from 100 to 60) */}
      <Trees count={10} boundary={60} isPlaying={isPlaying} />
      <Mountains count={2} boundary={140} isPlaying={isPlaying} />
      
      {/* Adjusted balloons to be visible in the camera frustum (y=14, z=34 view) */}
      {/* Previous positions were [40, 30, -40] and [-40, 35, 40]. Too high/far. */}
      {/* Bring them closer and lower. Camera looks at (0, 6, 0). */}
      <HotAirBalloon position={[25, 18, -15]} color="#FF7043" isPlaying={isPlaying} />
      <HotAirBalloon position={[-20, 22, 5]} color="#42A5F5" isPlaying={isPlaying} />
      
      {/* Active Projectiles (Lollipops) */}
      {projectiles.map(p => (
          <Lollipop 
            key={p.id} 
            startPos={p.startPos} 
            endPos={p.endPos} 
            onComplete={() => removeProjectile(p.id)} 
          />
      ))}

      {/* Word Clouds - positions are now stable (computed inside component) */}
      {visibleWords.map((item, i) => {
        // Use deterministic values based on index, NOT Math.random()
        // If position is pre-calculated (for stage mode), pass it directly
        // Otherwise pass null and let WordCloud component handle it (for sky mode)
        // Actually, WordCloud expects [x,y,z] via position prop.
        
        let position = item.position;
        let startOffset = item.startOffset;
        let speed = 0.8 + (i * 0.13) % 0.4;

        if (!position) {
             // Fallback logic for uncollected words (sky mode) - same as before
             const sOffset = (i / visibleWords.length) * 80 - 40;
             const y = 9 + (i % 3) * 3 + (i * 0.7) % 2; 
             const z = -8 - (i % 2) * 8 - (i * 1.3) % 5;
             position = [0, y, z]; // WordCloud handles X movement
             startOffset = sOffset;
        } else {
             // For stage mode, we keep X fixed but allow slight wobble for life
             // My WordCloud component moves X based on time: `currentX = ((t * speed + startOffset) % trackWidth)...`
             // To keep it largely fixed but alive, we set a very low speed or modify WordCloud logic.
             // Setting speed to 0 stops the track logic but keeps the Y wobble.
             if (isPlaying) {
                 speed = 0; 
                 // The Y wobble in WordCloud.jsx uses `t * 0.5` so it will still bob up and down!
             }
        }

        return (
          <WordCloud 
            key={item.text} 
            word={item.text} 
            type={item.type} // Pass type for coloring
            speed={speed}
            startOffset={startOffset}
            position={position} 
            hovered={i === hoveredWordIdx}
            isPlaying={isPlaying}
            isActive={item.text === activeWordText}
            onClick={() => onWordClick(item)}
          />
        );
      })}

      {/* 3D Phase Text on Track - ONLY for "Your Turn" */}
      {currentPhase === 'playing' && sessionPhase === 'YOUR_TURN' && (
        <group ref={phaseTextRef} position={[0, 3.5, 5]}> 
           {/* Shadow/Depth Layer */}
           <Text
             fontSize={2.0}
             color="#EC407A"
             position={[0.15, -0.15, -0.05]}
             anchorX="center"
             anchorY="middle"
           >
             Your Turn!
           </Text>
           
           {/* Main Layer */}
           <Text
             fontSize={2.0}
             color="#F8BBD0" 
             anchorX="center"
             anchorY="middle"
             outlineWidth={0.15}
             outlineColor="white"
           >
             Your Turn!
           </Text>
        </group>
      )}
      
      {/* Gesture Feedback Ring */}
      <mesh ref={gestureRingRef} visible={false}>
         <ringGeometry args={[0.5, 0.7, 32]} />
         <meshBasicMaterial color="#FFD700" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function App() {
  const [handPos, setHandPos] = useState(null);
  const [isPinching, setIsPinching] = useState(false);
  const [words, setWords] = useState([]);
  const [topic, setTopic] = useState("Happy");
  const [isHoveringDropZone, setIsHoveringDropZone] = useState(false);
  const [droppedWords, setDroppedWords] = useState([]); // Collected words = lyrics
  const [isPlaying, setIsPlaying] = useState(false); // Controls "Sing Mode" (including loading)
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false); // True only when music starts (post-loading)
  const [musicDuration, setMusicDuration] = useState(null); // Total duration of music for train sync
  const [cameraEnabled, setCameraEnabled] = useState(false); // Camera disabled by default
  
  // Track which word is currently being sung for visuals
  const [activeWordText, setActiveWordText] = useState(null);
  
  // Phase state for 3D text
  const [currentPhase, setCurrentPhase] = useState('idle');
  const [sessionPhase, setSessionPhase] = useState(null);

  // Magenta model state - loaded at app startup
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading AI models...');
  const backgroundGrooveRef = useRef(null);

  // Initialize Magenta models on app startup
  useEffect(() => {
    const initModels = async () => {
      try {
        setModelsLoading(true);
        setLoadingMessage('Loading AI models...');

        // Initialize Magenta models
        await magentaService.initialize((progress, message) => {
          setLoadingProgress(progress);
          setLoadingMessage(message);
        });

        // Generate background groove (kick/snare/hat pattern)
        setLoadingMessage('Generating background beat...');
        
        try {
          // Try Magenta AI first
          const groove = await magentaService.generateBackgroundGroove(0.4);
          const events = magentaService.noteSequenceToToneEvents(groove);
          
          // Scale timing to match 120 BPM (2 seconds per bar)
          // Magenta outputs 2 bars at ~120 BPM, so scale to 1 bar
          const scaledEvents = events.map(e => ({
            ...e,
            time: (e.time % 2) // Keep within 2 seconds (1 bar at 120 BPM)
          }));
          
          if (scaledEvents.length > 0) {
            backgroundGrooveRef.current = scaledEvents;
            console.log('✅ AI background groove:', scaledEvents.length, 'events (kick/snare/hat)');
          } else {
            throw new Error('Empty groove from Magenta');
          }
        } catch (grooveError) {
          console.warn('AI groove failed, using fallback:', grooveError);
        }

        // Always ensure we have a working groove
        if (!backgroundGrooveRef.current || backgroundGrooveRef.current.length === 0) {
          console.log('🥁 Creating fallback groove (kick/snare/hat)...');
          const styles = ['hiphop', 'trap', 'lofi'];
          const style = styles[Math.floor(Math.random() * styles.length)];
          backgroundGrooveRef.current = createGrooveWithStyle(style);
          console.log('✅ Fallback groove created:', style, backgroundGrooveRef.current.length, 'events');
        }

        setLoadingProgress(100);
        setModelsReady(true);
        setModelsLoading(false);
        setLoadingMessage('Ready!');
        console.log('✅ Magenta models ready, groove has', backgroundGrooveRef.current?.length, 'events');

      } catch (error) {
        console.error('Failed to initialize Magenta:', error);
        // Still create a fallback groove so music plays
        const styles = ['hiphop', 'trap', 'lofi'];
        const style = styles[Math.floor(Math.random() * styles.length)];
        backgroundGrooveRef.current = createGrooveWithStyle(style);
        console.log('🎵 Using', style, 'beat style');
        setLoadingMessage('Using basic beats');
        setModelsReady(true);
        setModelsLoading(false);
      }
    };

    initModels();
  }, []);

  // Load words based on topic
  useEffect(() => {
    const loadWords = async () => {
      const data = await fetchRelatedWords(topic);
      const newWords = [];
      if (data.synonyms) data.synonyms.slice(0, 5).forEach(w => newWords.push({ text: w, type: 'synonym' }));
      if (data.antonyms) data.antonyms.slice(0, 5).forEach(w => newWords.push({ text: w, type: 'antonym' }));
      setWords(newWords);
      setDroppedWords([]); // Clear dropped words when topic changes
    };
    loadWords();
  }, [topic]);

  const handleWordGrab = (word) => {
     // Optional: sound effect or visual cue
  };

  const handleWordDrop = (word) => {
     // Auto-collect - no need to check drop zone hover
     console.log("Collected word:", word);
     
     // Play pop sound! 🎵
     // Use woodblock or bongo for a satisfying "pop"
     // Initialize audio first just in case
     audioService.initialize().then(() => {
        audioService.triggerDrum('woodblock', 0.8); 
        audioService.triggerDrum('bongo', 0.5);
     }).catch(() => {
        // Silent fail if not initialized
     });

     setWords(prev => prev.filter(w => w.text !== word.text));
     setDroppedWords(prev => [...prev, word]);
     // Don't auto-play - word goes to lyrics area for selection
  };

  // Called when all words finish playing
  const handlePlaybackComplete = () => {
    console.log("✅ All words completed!");
    setIsPlaying(false);
    setIsActuallyPlaying(false);
    setActiveWordText(null); // Reset active word
    setDroppedWords([]); // Clear words to start fresh!
  };

  // Called when playback is stopped early
  const handlePlaybackStop = () => {
    console.log("⏹ Playback stopped");
    setIsPlaying(false);
    setIsActuallyPlaying(false);
    setActiveWordText(null);
  };

  // Start singing all collected words (lyrics)
  const handleSing = () => {
    if (droppedWords.length === 0) return;
    if (!modelsReady) {
      alert('AI models still loading, please wait...');
      return;
    }
    setIsPlaying(true);
    // Don't set isActuallyPlaying yet - wait for DropZone to tell us it started
  };

  // Stop singing
  const handleStopSing = () => {
    setIsPlaying(false);
    setIsActuallyPlaying(false);
  };
  
  // Handler for DropZone status updates
  const handlePlaybackStatusChange = (isNowPlaying) => {
    setIsActuallyPlaying(isNowPlaying);
    if (!isNowPlaying) {
      // Reset duration when music stops
      setMusicDuration(null);
      setActiveWordText(null);
    }
  };
  
  // Handler for music duration (for train sync)
  const handleMusicDurationCalculated = (duration) => {
    console.log('🚂 Music duration for train sync:', duration, 'seconds');
    setMusicDuration(duration);
  };

  // Handler for when a specific word starts playing (for visual effects)
  const handleWordActive = (wordText) => {
    setActiveWordText(wordText);
  };
  
  const handlePhaseChange = (phase, sPhase) => {
      setCurrentPhase(phase);
      setSessionPhase(sPhase);
  };
  
  useEffect(() => {
     if (handPos && handPos.y > 0.8) {
        setIsHoveringDropZone(true);
     } else {
        setIsHoveringDropZone(false);
     }
  }, [handPos]);

  // Handle word click (mouse selection)
  const handleWordClick = (word) => {
    console.log("Clicked word:", word);
    handleWordDrop(word);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#B3E5FC' }}>
      {/* Loading overlay while Magenta models initialize */}
      {modelsLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #81D4FA 0%, #B2DFDB 100%)', // Sky blue to mint
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚂</div>
          <h1 style={{
            color: '#546E7A',
            fontFamily: '"Nunito", sans-serif',
            fontSize: '32px',
            marginBottom: '15px',
            fontWeight: 'bold',
            textShadow: '2px 2px 0px white'
          }}>
            WordWave
          </h1>
          <div style={{
            width: '300px',
            height: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '15px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #FF80AB 0%, #8C9EFF 100%)', // Macaroon gradient
              borderRadius: '6px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{
            color: '#455A64',
            fontFamily: '"Nunito", sans-serif',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {loadingMessage}
          </p>
        </div>
      )}

      {/* Only render HandInput when camera is enabled */}
      {cameraEnabled && <HandInput onHandMove={setHandPos} onPinch={setIsPinching} />}

      <Canvas shadows camera={{ position: [0, 12, 30], fov: 45 }}>
        <Scene 
           handPos={cameraEnabled ? handPos : null} 
           isPinching={cameraEnabled ? isPinching : false} 
           words={words} 
           onWordGrab={handleWordGrab}
           onWordDrop={handleWordDrop}
           onWordClick={handleWordClick}
           isPlaying={isActuallyPlaying}
           musicDuration={musicDuration}
           activeWordText={activeWordText}
           droppedWords={droppedWords}
           onGestureSing={handleSing}
           currentPhase={currentPhase}
           sessionPhase={sessionPhase}
        />
      </Canvas>
      
      {/* Word Sky Input */}
      {!isPlaying && ( // Hide when playing
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        pointerEvents: 'auto' 
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '12px 20px',
          borderRadius: '25px', // Soft cloud shape
          // border: '4px solid #4FC3F7', // Removed hard border
          backdropFilter: 'blur(10px)',
          textAlign: 'left',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)', // Glassmorphism shadow
          border: '1px solid rgba(255, 255, 255, 0.18)',
          minWidth: '180px'
        }}>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            color: '#FF9800', 
            fontSize: '20px', 
            fontFamily: '"Nunito", sans-serif',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <span>🌤️</span> Word Sky
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#90A4AE' }}>Topic</span>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              style={{
                border: 'none', // No border
                borderRadius: '12px',
                padding: '6px 12px',
                fontFamily: 'inherit',
                fontSize: '15px',
                color: '#546E7A',
                outline: 'none',
                width: '110px',
                background: '#F0F4C3', // Soft yellow/green background
                fontWeight: 'bold',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', // Subtle inner shadow
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.background = '#FFF9C4'}
              onBlur={(e) => e.target.style.background = '#F0F4C3'}
            />
          </div>
        </div>
      </div>
      )}
      
      <DropZone
        droppedWords={droppedWords}
        onSing={handleSing}
        onStopSing={handleStopSing}
        isPlaying={isPlaying}
        modelsReady={modelsReady}
        backgroundGroove={backgroundGrooveRef.current}
        onPlaybackComplete={handlePlaybackComplete}
        onPlaybackStatusChange={handlePlaybackStatusChange}
        onMusicDurationCalculated={handleMusicDurationCalculated}
        onWordActive={handleWordActive}
        cameraEnabled={cameraEnabled}
        onPhaseChange={handlePhaseChange}
      />

      {/* ElevenLabs Voice Agent (bottom-right) */}
      <VoiceAgent 
        droppedWords={droppedWords}
        topic={topic}
        isPlaying={isActuallyPlaying}
        onSing={handleSing}
        onClearLyrics={() => setDroppedWords([])}
      />
      
      {/* Camera toggle button - Moved to Top Right to avoid overlap */}
      <button
        onClick={() => setCameraEnabled(!cameraEnabled)}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '12px 20px',
          borderRadius: '20px',
          border: 'none',
          background: cameraEnabled 
            ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' 
            : 'linear-gradient(135deg, #78909C 0%, #546E7A 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: cameraEnabled 
            ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
            : '0 4px 12px rgba(84, 110, 122, 0.4)',
          fontFamily: '"Nunito", sans-serif',
          zIndex: 100,
          pointerEvents: 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        {cameraEnabled ? '📷 Camera ON' : '🖱️ Mouse Mode'}
      </button>

      {/* Instructions removed as per request */}
    </div>
  );
}

export default App;
