import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StartMetaParticles = ({ baseHeight = 0.8, color = "#8400ff" }) => {
  const meshRef = useRef();
  const count = 4;

  // 1. GENEROWANIE DANYCH CZĄSTECZEK
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        t: Math.random() * 100,
        speed: 0.08 + Math.random() * 0.08,
        radius: 0.15 + Math.random() * 0.4,
        baseScale: Math.random() * 0.06 + 0.04
      });
    }
    return data;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 2. ANIMACJA CZĄSTECZEK
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const timeScale = delta * 1.5; 

    particles.forEach((p, i) => {
      p.t += timeScale;
      const travelDistance = 1.2;
      const height = (p.t * p.speed) % travelDistance;
      
      const x = Math.sin(p.t + i * 1.8) * p.radius;
      const z = Math.cos(p.t + i * 1.8) * p.radius;

      dummy.position.set(x, baseHeight + height, z);

      // Efekt zanikania i pojawiania się (skalowanie)
      const scaleEffect = Math.sin((height / travelDistance) * Math.PI);
      dummy.scale.setScalar(p.baseScale * scaleEffect);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[null, null, count]} 
      // --- OPTYMALIZACJA CIENI ---
      castShadow={false}    // Cząsteczki nie obciążają mapy cieni
      receiveShadow={false} // Cząsteczki nie przyjmują cieni od innych obiektów
      frustumCulled={true}
    >
      <sphereGeometry args={[1, 16, 16]} /> 
      <meshStandardMaterial 
        color={color} 
        metalness={0.6}  
        roughness={0.2}  
        emissive={color} 
        emissiveIntensity={0.2}
        transparent={true}
        opacity={0.8}
      />
    </instancedMesh>
  );
};

export default StartMetaParticles;