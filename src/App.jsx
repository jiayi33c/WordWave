import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Train } from './components/Train';
import { Trees } from './components/Trees';
import HandInput from './components/HandInput';

function Scene({ handPos }) {
  const trainRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate train in a circle
    if (trainRef.current) {
      const radius = 25;
      const speed = 0.4;
      const angle = time * speed;
      trainRef.current.position.x = Math.sin(angle) * radius;
      trainRef.current.position.z = Math.cos(angle) * radius;
      trainRef.current.rotation.y = angle + Math.PI; // Face forward
    }
    
    // Camera control
    if (handPos) {
      // handPos.x: 0 (left) -> 1 (right)
      // handPos.y: 0 (top) -> 1 (bottom)
      
      // Map X to azimuth angle (around Y axis)
      // Map Y to height or distance
      
      const targetX = (0.5 - handPos.x) * 60; // -30 to 30 horizontal
      const targetY = (handPos.y) * 20 + 5;   // 5 to 25 vertical
      const targetZ = 40; // constant distance from center roughly
      
      // We want to move the camera on a sphere or plane
      // Simple approach: Lerp position
      
      const lerpSpeed = 0.05;
      state.camera.position.x += (targetX - state.camera.position.x) * lerpSpeed;
      state.camera.position.y += (targetY - state.camera.position.y) * lerpSpeed;
      state.camera.position.z += (targetZ - state.camera.position.z) * lerpSpeed;
      
      state.camera.lookAt(0, 0, 0);
    } else {
      // Auto rotate if no hand detected
      const camRadius = 45;
      const camSpeed = 0.1;
      state.camera.position.x = Math.sin(time * camSpeed) * camRadius;
      state.camera.position.z = Math.cos(time * camSpeed) * camRadius;
      state.camera.position.y = 15;
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={1.5} />
      <directionalLight position={[-10, 20, 5]} intensity={1} castShadow />
      
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={6} />
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7CB342" />
      </mesh>
      
      {/* Simple circular track visual */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[24, 26, 64]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      <Train ref={trainRef} />
      <Trees count={80} boundary={90} />
      
      <Cloud position={[-10, 15, -10]} speed={0.2} opacity={0.6} />
      <Cloud position={[10, 12, 10]} speed={0.2} opacity={0.6} />
    </>
  );
}

function App() {
  const [handPos, setHandPos] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <HandInput onHandMove={setHandPos} />
      
      <Canvas shadows camera={{ position: [0, 15, 45], fov: 50 }}>
        <Scene handPos={handPos} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        pointerEvents: 'none',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '20px',
        backdropFilter: 'blur(5px)'
      }}>
        <h2 style={{ margin: '0 0 5px 0' }}>Choo Choo 3D World</h2>
        <p style={{ margin: 0, fontSize: '14px' }}>
          {handPos ? "Hand detected! Move hand to look around." : "Show your hand to control the camera!"}
        </p>
      </div>
    </div>
  );
}

export default App;
