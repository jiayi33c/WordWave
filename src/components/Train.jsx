import React, { forwardRef } from 'react';

export const Train = forwardRef((props, ref) => {
  return (
    <group ref={ref} {...props}>
      {/* Main Body - Blue Toy Engine */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.6, 1.4, 3.2]} />
        <meshStandardMaterial color="#42A5F5" roughness={0.3} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 1.8, 0.5]}>
        <boxGeometry args={[1.8, 0.2, 2]} />
        <meshStandardMaterial color="#EF5350" roughness={0.3} />
      </mesh>

      {/* Chimney */}
      <mesh position={[0, 2, -1]} rotation={[0,0,0]}>
        <cylinderGeometry args={[0.4, 0.3, 1]} />
        <meshStandardMaterial color="#FFA726" roughness={0.3} />
      </mesh>
      
      {/* Smoke puffs (static for now) */}
      <mesh position={[0, 2.8, -1]} scale={0.5}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>

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
  );
});
