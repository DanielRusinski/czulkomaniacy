import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EnvironmentParticles = ({ items }) => {
  const meshRef = useRef();
  const particlesPerItem = 4; // Liczba drobinek na każdy obiekt dekoracyjny
  const totalCount = items.length * particlesPerItem;

  // 1. INICJALIZACJA STAŁYCH CECH CZĄSTECZEK
  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < totalCount; i++) {
      data.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        radius: 0.15 + Math.random() * 0.3,
        yOffset: Math.random() * 0.8, // Zwiększony lekko zakres pionowy
        scale: Math.random() * 0.03 + 0.01
      });
    }
    return data;
  }, [totalCount]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 2. AKTUALIZACJA POZYCJI W KAŻDEJ KLATCE
  useFrame((state) => {
    if (!meshRef.current || items.length === 0) return;
    const time = state.clock.elapsedTime;

    items.forEach((item, itemIdx) => {
      // Optymalizacja: jeśli obiekt macierzysty jest niewidoczny, ukrywamy jego cząsteczki
      const isVisible = item.baseScale > 0.01;

      for (let p = 0; p < particlesPerItem; p++) {
        const idx = itemIdx * particlesPerItem + p;
        const data = particleData[idx];

        if (isVisible) {
          // Obliczamy orbitowanie wokół pozycji obiektu (np. drzewa/trawy)
          const angle = time * data.speed + data.phase;
          const x = item.x + Math.sin(angle) * data.radius;
          const z = item.z + Math.cos(angle) * data.radius;
          // item.y w nowym systemie to stała 0.02
          const y = item.y + data.yOffset + Math.sin(time * 0.5 + data.phase) * 0.1;

          dummy.position.set(x, y, z);
          
          // Migotanie poprzez pulsowanie skali
          const flicker = (Math.sin(time * 4 + data.phase) + 1) / 2;
          dummy.scale.setScalar(data.scale * flicker);
        } else {
          // Jeśli obiekt znika, chowamy cząsteczki pod "podłogę" lub zerujemy skalę
          dummy.scale.setScalar(0);
        }

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[null, null, totalCount]} 
      // --- OPTYMALIZACJA CIENI I RENDEROWANIA ---
      castShadow={false}      // Cząsteczki nie rzucają cieni
      receiveShadow={false}   // Cząsteczki nie przyjmują cieni
      frustumCulled={true}    // Włączone dla lepszej wydajności przy dużej mapie
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.4} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

export default EnvironmentParticles;