import React, { useMemo, memo } from 'react';

export const Trees = memo(function Trees({ count = 10, boundary = 100 }) {
  const trees = useMemo(() => {
    const temp = [];
    const clusters = 3; // Fewer clusters for fewer trees
    
    for (let c = 0; c < clusters; c++) {
      // Random center for each cluster
      const clusterAngle = Math.random() * Math.PI * 2;
      // Place clusters closer to the track loop (radius ~20-25)
      const clusterRadius = 22 + Math.random() * 15; 
      const cx = Math.sin(clusterAngle) * clusterRadius;
      const cz = Math.cos(clusterAngle) * clusterRadius;
      
      const treesInCluster = Math.floor(count / clusters);
      
      for (let i = 0; i < treesInCluster; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distFromCenter = Math.random() * 8; // Tighter clusters (was 12)
        
        const x = cx + Math.sin(angle) * distFromCenter;
        const z = cz + Math.cos(angle) * distFromCenter;
        
        // --- SAFETY CHECKS ---
        const dist = Math.sqrt(x*x + z*z);
        const stationX = -11;
        const stationZ = -8;
        const distToStation = Math.sqrt(Math.pow(x - stationX, 2) + Math.pow(z - stationZ, 2));
        
        // Hug the track tightly (14 radius), keep station clear (12)
        if (dist < 14 || distToStation < 12) continue;
        
        const scaleFactor = 1 - (distFromCenter / 10); 
        const scale = (0.8 + Math.random() * 0.6) * Math.max(0.7, scaleFactor);
        
        temp.push({ pos: [x, 0, z], scale });
      }
    }
    return temp;
  }, [count, boundary]);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={[t.scale, t.scale, t.scale]}>
          {/* Trunk */}
          <mesh position={[0, 0.8, 0]}>
             <cylinderGeometry args={[0.3, 0.4, 1.6]} />
             <meshStandardMaterial color="#795548" />
          </mesh>
          {/* Leaves - Mixed Playful Colors */}
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#76FF03" /> {/* Bright Lime */}
          </mesh>
          <mesh position={[0.8, 1.8, 0]} scale={0.7}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#C6FF00" /> {/* Yellow-Green */}
          </mesh>
          <mesh position={[-0.8, 1.8, 0]} scale={0.7}>
             <sphereGeometry args={[1, 16, 16]} />
             <meshStandardMaterial color="#B2FF59" /> {/* Light Lime */}
          </mesh>
          {/* Maybe a fruit/flower color top? */}
          <mesh position={[0, 2.8, 0]} scale={0.8}>
             <sphereGeometry args={[1, 16, 16]} />
             <meshStandardMaterial color={i % 3 === 0 ? "#FF4081" : (i % 3 === 1 ? "#FF9100" : "#64FFDA")} /> 
          </mesh>
        </group>
      ))}
    </group>
  );
});
