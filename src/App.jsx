import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Train } from './components/Train';
import { Trees } from './components/Trees';
import { Mountains } from './components/Mountains';
import { Station } from './components/Station';
import { HotAirBalloon } from './components/HotAirBalloon';
import { WordCloud } from './components/WordCloud';
import HandInput from './components/HandInput';
import { DropZone } from './components/DropZone';
import { fetchRelatedWords } from './utils/wordApi';

// Helper to get position on our wobbly track
function getTrackPosition(angle) {
  const r = 15 + 2 * Math.sin(4 * angle); // Wobbly radius
  const x = Math.sin(angle) * r * 1.2; 
  const z = Math.cos(angle) * r * 0.6; 
  
  // Steeper hills and valleys
  const y = 0.1 + (Math.sin(2 * angle) + 1) * 2.0; 
  return { x, y, z, r };
}

function Track() {
  const segments = useMemo(() => {
    const temp = [];
    const count = 600; 
    const colors = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC'];
    
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
        color: colors[i % colors.length] 
      });
    }
    return temp;
  }, []);

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot}>
          <boxGeometry args={[0.5, 0.3, 1.0]} />
          <meshStandardMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ handPos, isPinching, words, onWordGrab, onWordDrop }) {
  const trainRef = useRef();
  const [isMoving, setIsMoving] = useState(false); 
  const startTimeRef = useRef(null); 
  
  // Track recently grabbed words to prevent rapid re-grabbing
  const recentlyGrabbed = useRef(new Set());
  const { camera } = useThree();
  
  // Smoothed hand position to reduce jitter
  const smoothedHandPos = useRef({ x: 0.5, y: 0.5 });
  const [hoveredWordIdx, setHoveredWordIdx] = useState(-1); // Track hovered word

  useEffect(() => {
    if (handPos && !isMoving) {
      setIsMoving(true);
      startTimeRef.current = Date.now();
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

  // Grab Logic - Uses SCREEN SPACE comparison (2D) for accurate visual overlap
  useFrame(() => {
    // Always calculate hover state if hand is present
    if (handPos) {
      const time = performance.now() / 1000;
      const handScreenX = handPos.x;
      const handScreenY = handPos.y;
      
      let closestCloud = null;
      let minDst = 1000;
      let closestIdx = -1;
      
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (recentlyGrabbed.current.has(w.text)) continue;
        
        // ... (same position calculation logic) ...
        const startOffset = (i / words.length) * 80 - 40;
        const y = 9 + (i % 3) * 3 + (i * 0.7) % 2; 
        const z = -8 - (i % 2) * 8 - (i * 1.3) % 5;
        const speed = 0.8 + (i * 0.13) % 0.4;
        
        const trackWidth = 60;
        let currentX = ((time * speed + startOffset) % trackWidth) - (trackWidth / 2);
        if (speed < 0) currentX = -currentX;
        
        const cloudPos3D = new THREE.Vector3(currentX, y, z);
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

      // Check for grab
      if (isPinching && closestCloud) {
          recentlyGrabbed.current.add(closestCloud.text);
          setTimeout(() => {
            recentlyGrabbed.current.delete(closestCloud.text);
          }, 500);
          
          onWordGrab(closestCloud);
          onWordDrop(closestCloud);
      }
    } else {
      if (hoveredWordIdx !== -1) setHoveredWordIdx(-1);
    }
  });
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (trainRef.current) {
      const startAngle = Math.PI + 0.6; 
      let angle = startAngle; 

      if (isMoving) {
         const elapsed = (Date.now() - startTimeRef.current) / 1000;
         const speed = 0.15; 
         angle = elapsed * speed + startAngle; 
      }
      
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
    
    // Camera control
    // Only move camera if hand detected AND NOT pinching
    // This prevents "shaky screen" while trying to drag words
    // Uses smoothed hand position for smoother camera movement
    if (handPos && !isPinching) {
      const targetX = (0.5 - smoothedHandPos.current.x) * 40; 
      const targetY = (smoothedHandPos.current.y) * 15 + 5;   
      const targetZ = 25; 
      
      const lerpSpeed = 0.05;
      state.camera.position.x += (targetX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (targetY - state.camera.position.y) * lerpSpeed;
      state.camera.position.z += (targetZ - state.camera.position.z) * lerpSpeed;
      state.camera.lookAt(0, 6, 0); 
    } else if (!handPos) {
      // Only return to default if hand is NOT detected at all
      // If pinching, we do nothing (hold current view stable)
      const defaultX = 0;
      const defaultY = 14; 
      const defaultZ = 34; 
      const lerpSpeed = 0.02;
      
      state.camera.position.x += (defaultX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (defaultY - state.camera.position.y) * lerpSpeed;
      state.camera.position.z += (defaultZ - state.camera.position.z) * lerpSpeed;
      state.camera.lookAt(0, 6, 0); 
    }
    // If pinching (handPos && isPinching), we skip updates to keep camera steady
  });

  return (
    <>
      <color attach="background" args={['#B3E5FC']} />
      <fog attach="fog" args={['#B3E5FC', 60, 150]} />
      <ambientLight intensity={1.0} />
      <pointLight position={[20, 40, 20]} intensity={1.2} />
      <directionalLight position={[-30, 50, 20]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <Sky sunPosition={[100, 40, 100]} turbidity={5} rayleigh={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#A5D6A7" />
      </mesh>
      
      <Track />
      <group><Train ref={trainRef} /></group>
      <Station position={[-11.3, 3.0, -7.9]} rotation={[0, 0.6, 0]} />
      <Trees count={30} boundary={100} />
      <Mountains count={2} boundary={140} />
      
      {/* Adjusted balloons to be visible in the camera frustum (y=14, z=34 view) */}
      {/* Previous positions were [40, 30, -40] and [-40, 35, 40]. Too high/far. */}
      {/* Bring them closer and lower. Camera looks at (0, 6, 0). */}
      <HotAirBalloon position={[25, 18, -15]} color="#FF7043" />
      <HotAirBalloon position={[-20, 22, 5]} color="#42A5F5" />
      
      {/* Word Clouds - positions are now stable (computed inside component) */}
      {words.map((item, i) => {
        // Use deterministic values based on index, NOT Math.random()
        const startOffset = (i / words.length) * 80 - 40;
        const y = 9 + (i % 3) * 3 + (i * 0.7) % 2; 
        const z = -8 - (i % 2) * 8 - (i * 1.3) % 5;
        const speed = 0.8 + (i * 0.13) % 0.4;

        return (
          <WordCloud 
            key={item.text} 
            word={item.text} 
            speed={speed}
            startOffset={startOffset}
            position={[0, y, z]} 
            hovered={i === hoveredWordIdx}
          />
        );
      })}
    </>
  );
}

function App() {
  const [handPos, setHandPos] = useState(null);
  const [isPinching, setIsPinching] = useState(false);
  const [words, setWords] = useState([]);
  const [topic, setTopic] = useState("Happy");
  const [isHoveringDropZone, setIsHoveringDropZone] = useState(false);
  const [droppedWords, setDroppedWords] = useState([]);

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
     setWords(prev => prev.filter(w => w.text !== word.text));
     setDroppedWords(prev => [...prev, word]);
  };
  
  useEffect(() => {
     if (handPos && handPos.y > 0.8) {
        setIsHoveringDropZone(true);
     } else {
        setIsHoveringDropZone(false);
     }
  }, [handPos]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#B3E5FC' }}>
      <HandInput onHandMove={setHandPos} onPinch={setIsPinching} />
      
      <Canvas shadows camera={{ position: [0, 12, 30], fov: 45 }}>
        <Scene 
           handPos={handPos} 
           isPinching={isPinching} 
           words={words} 
           onWordGrab={handleWordGrab}
           onWordDrop={handleWordDrop}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 140, 
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'auto' // Enable interaction for input
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px 20px',
          borderRadius: '20px',
          border: '3px solid #FFB74D',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#FF7043', fontSize: '20px' }}>Word Cloud Sky</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Topic:</span>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              style={{
                border: '2px solid #B3E5FC',
                borderRadius: '10px',
                padding: '5px 10px',
                fontFamily: 'inherit',
                fontSize: '14px',
                color: '#546E7A',
                outline: 'none',
                width: '100px'
              }}
            />
          </div>
        </div>
      </div>
      
      <DropZone hovered={isHoveringDropZone} droppedWords={droppedWords} />
    </div>
  );
}

export default App;
