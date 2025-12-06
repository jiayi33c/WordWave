import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import { Train } from './components/Train';
import { Trees } from './components/Trees';
import { Mountains } from './components/Mountains';
import { Station } from './components/Station';
import { HotAirBalloon } from './components/HotAirBalloon';
import { WordCloud } from './components/WordCloud';
import HandInput from './components/HandInput';
import { fetchRelatedWords } from './utils/wordApi';

// Helper to get position on our wobbly track
// Flattened track: reduced Z scale to save vertical screen space
function getTrackPosition(angle) {
  const r = 15 + 2 * Math.sin(4 * angle); 
  const x = Math.sin(angle) * r * 1.2; // Widen X slightly
  const z = Math.cos(angle) * r * 0.6; // Flatten Z (depth)
  
  // Steeper hills and valleys
  // Base height 0.1 + amplified sine wave (range 0.1 to 4.1)
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
          <boxGeometry args={[0.5, 0.3, 1.0]} /> {/* Thicker and wider track segments */}
          <meshStandardMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ handPos, words }) {
  const trainRef = useRef();
  const [isMoving, setIsMoving] = useState(false); // State to track if train should move
  const startTimeRef = useRef(null); // To track when movement starts

  // Check if hand is detected to start train
  useEffect(() => {
    if (handPos && !isMoving) {
      setIsMoving(true);
      startTimeRef.current = Date.now();
    }
  }, [handPos, isMoving]);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (trainRef.current) {
      const startAngle = Math.PI + 0.6; // Start slightly to the left
      let angle = startAngle; 

      if (isMoving) {
         // Calculate time since start
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
    if (handPos) {
      const targetX = (0.5 - handPos.x) * 40; 
      const targetY = (handPos.y) * 15 + 5;   
      const targetZ = 25; 
      
      const lerpSpeed = 0.05;
      state.camera.position.x += (targetX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (targetY - state.camera.position.y) * lerpSpeed;
      state.camera.position.z += (targetZ - state.camera.position.z) * lerpSpeed;
      state.camera.lookAt(0, 8, 0); // Look much higher at the sky
    } else {
      // Static camera position
      const defaultX = 0;
      const defaultY = 8; // Lower camera slightly to look up
      const defaultZ = 35; // Pull back a bit
      const lerpSpeed = 0.02;
      
      state.camera.position.x += (defaultX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (defaultY - state.camera.position.y) * lerpSpeed;
      state.camera.position.z += (defaultZ - state.camera.position.z) * lerpSpeed;
      state.camera.lookAt(0, 8, 0); // Look up at the sky
    }
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
      
      <group>
         <Train ref={trainRef} />
      </group>

      {/* Station repositioned to the left side */}
      {/* Angle ~ 3.74 (PI + 0.6). Calculated manually: */}
      {/* Pos: x ~ -9.5, z ~ -12.5, y ~ 2.0 */}
      <Station position={[-11, 4.0, -8]} rotation={[0, 0.6, 0]} />

      <Trees count={30} boundary={100} />
      <Mountains count={2} boundary={140} />
      <HotAirBalloon position={[40, 30, -40]} color="#FF7043" />
      <HotAirBalloon position={[-40, 35, 40]} color="#42A5F5" />
      
      {/* Word Clouds scattered in the sky - Drifting horizontally */}
      {words.map((item, i) => {
        // Stagger start offsets to spread clouds out broadly
        // Range -40 to 40 in X to cover more width and prevent clumping
        const startOffset = (i / words.length) * 80 - 40;
        
        // Random height between 9 and 16 (more vertical spread)
        const y = 9 + (i % 3) * 3 + Math.random() * 2; 
        
        // Layer depth: distinct layers to avoid overlap
        const z = -8 - (i % 2) * 8 - Math.random() * 5;
        
        // Randomize speed slightly
        const speed = 0.8 + Math.random() * 0.4;

        return (
          <WordCloud 
            key={i} 
            word={item.text} 
            speed={speed}
            startOffset={startOffset}
            position={[0, y, z]} // Initial X is handled by animation
          />
        );
      })}
    </>
  );
}

function App() {
  const [handPos, setHandPos] = useState(null);
  const [words, setWords] = useState([]);
  const [topic, setTopic] = useState("Happy"); // Default topic

  useEffect(() => {
    const loadWords = async () => {
      const data = await fetchRelatedWords(topic);
      const newWords = [];
      
      // Add synonyms
      if (data.synonyms) {
        data.synonyms.slice(0, 5).forEach(w => newWords.push({ text: w, type: 'synonym' }));
      }
      // Add antonyms
      if (data.antonyms) {
        data.antonyms.slice(0, 5).forEach(w => newWords.push({ text: w, type: 'antonym' }));
      }
      
      setWords(newWords);
    };
    loadWords();
  }, [topic]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#B3E5FC' }}>
      <HandInput onHandMove={setHandPos} />
      
      <Canvas shadows camera={{ position: [0, 12, 30], fov: 45 }}>
        <Scene handPos={handPos} words={words} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#333',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
        pointerEvents: 'none',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.85)',
        padding: '15px 30px',
        borderRadius: '30px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        border: '4px solid #FFB74D'
      }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#FF7043', fontSize: '28px', textShadow: '2px 2px 0px #FFF' }}>Word Cloud Sky</h1>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#555' }}>
          {handPos ? "Topic: " + topic : "👋 Wave to explore!"}
        </p>
      </div>
    </div>
  );
}

export default App;
