import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import { Train } from './components/Train';
import { Trees } from './components/Trees';
import { Mountains } from './components/Mountains';
import { Station } from './components/Station';
import { HotAirBalloon } from './components/HotAirBalloon';
import HandInput from './components/HandInput';

// Helper to get position on our wobbly track
function getTrackPosition(angle) {
  const r = 15 + 2 * Math.sin(4 * angle); // Reduced wobble frequency for smoother curves
  const x = Math.sin(angle) * r;
  const z = Math.cos(angle) * r;
  
  // Gentler hills
  const y = 0.1 + (Math.sin(2 * angle) + 1) * 1.0; 
  
  return { x, y, z, r };
}

function Track() {
  const segments = useMemo(() => {
    const temp = [];
    const count = 600; // High resolution for smooth track
    const colors = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC'];
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2;
      
      const { x, y, z } = getTrackPosition(angle);
      
      // Calculate rotation to face along track
      // We look slightly ahead to find tangent
      const nextAngle = angle + 0.005; // Smaller step for precision
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
          <boxGeometry args={[0.4, 0.1, 0.8]} /> {/* Smaller segments to form curve */}
          <meshStandardMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ handPos }) {
  const trainRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (trainRef.current) {
      const speed = 0.15; 
      // Start at PI (back)
      const angle = time * speed + Math.PI; 
      
      const { x, y, z } = getTrackPosition(angle);
      trainRef.current.position.x = x;
      trainRef.current.position.y = y + 0.1; // Lowered offset to stick to track
      trainRef.current.position.z = z;
      
      // Calculate rotation to face forward
      const nextAngle = angle + 0.05; // Look slightly ahead
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
      state.camera.lookAt(0, 1, 0); 
    } else {
      const camRadius = 30; 
      const camSpeed = 0.05; 
      state.camera.position.x = Math.sin(time * camSpeed) * camRadius;
      state.camera.position.z = Math.cos(time * camSpeed) * camRadius;
      state.camera.position.y = 12; 
      state.camera.lookAt(0, 1, 0); 
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
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#A5D6A7" />
      </mesh>
      
      <Track />
      
      <group>
         <Train ref={trainRef} />
      </group>

      {/* Adjusted station to be near the wobbly track at back (approx PI) */}
      {/* At PI, sin(4PI)=0, so r=15. pos=[0, -15]. */}
      {/* Height at PI: y = 0.1 + (sin(2PI) + 1)*1.0 = 0.1 + 1.0 = 1.1 */}
      <Station position={[0, 1.1, -19]} rotation={[0, 0, 0]} />

      <Trees count={40} boundary={120} />
      
      <Mountains count={2} boundary={140} />
      
      <HotAirBalloon position={[40, 30, -40]} color="#FF7043" />
      <HotAirBalloon position={[-40, 35, 40]} color="#42A5F5" />
      
      <Cloud position={[-30, 25, -30]} speed={0.1} opacity={0.8} segments={10} bounds={[10, 2, 10]} volume={6} color="white" />
      <Cloud position={[30, 20, 30]} speed={0.1} opacity={0.8} segments={10} bounds={[10, 2, 10]} volume={6} color="white" />
      <Cloud position={[0, 35, -50]} speed={0.05} opacity={0.8} segments={15} bounds={[15, 3, 5]} volume={8} color="white" />
    </>
  );
}

function App() {
  const [handPos, setHandPos] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#B3E5FC' }}>
      <HandInput onHandMove={setHandPos} />
      
      <Canvas shadows camera={{ position: [0, 12, 30], fov: 45 }}>
        <Scene handPos={handPos} />
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
        <h1 style={{ margin: '0 0 5px 0', color: '#FF7043', fontSize: '28px', textShadow: '2px 2px 0px #FFF' }}>Choo Choo Station</h1>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#555' }}>
          {handPos ? "✨ Exploring! ✨" : "👋 Wave to control! 👋"}
        </p>
      </div>
    </div>
  );
}

export default App;
