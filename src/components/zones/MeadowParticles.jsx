import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- [1] KONFIGURACJA SYSTEMU MOTYLI ---
const CONFIG = {
  basePlane: 1.5,       // Wysokość lotu
  scale: 0.06,          // Rozmiar pojedynczego skrzydła (koła)
  butterflyCount: 15,   // Ilość motyli
  color: '#ffb3ba',     // Pastelowy róż
  speed: 0.7,           // Prędkość przemieszczania się
  flapSpeed: 18.0       // Prędkość machania (szybka)
};

/**
 * MeadowButterflies - Motyle latające nad strefą Meadow.
 * Każdy motyl to para instancji (lewe i prawe okrągłe skrzydło).
 */
const MeadowButterflies = ({ mapData }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Całkowita liczba instancji (skrzydeł)
  const totalInstances = CONFIG.butterflyCount * 2;

  // Dane lotu dla każdego motyla
  const butterflyData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.butterflyCount; i++) {
      data.push({
        t: Math.random() * 100,            // Offset czasu
        factor: 0.6 + Math.random() * 1.2, // Styl lotu
        x: Math.random(),                  // Pozycja startowa X
        z: Math.random(),                  // Pozycja startowa Z
        phase: Math.random() * Math.PI     // Faza machania
      });
    }
    return data;
  }, [CONFIG.butterflyCount]);

  // Obliczanie granic matrycy strefy
  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;

    const minX = Math.min(...meadowTiles.map(t => t.x));
    const minZ = Math.min(...meadowTiles.map(t => t.y));

    return { 
      startX: minX - 1, 
      width: 8,
      startZ: minZ - 1, 
      depth: 11
    };
  }, [mapData]);

  // --- [ZMIANA] OKRĄGŁA GEOMETRIA SKRZYDŁA Z PIVOTEM NA KRAWĘDZI ---
  const wingGeometry = useMemo(() => {
    // Używamy CircleGeometry. args: [promień, segmenty]
    // Promień 1 to baza, segmenty 12 zapewniają gładkość przy niskim koszcie wydajności.
    const geo = new THREE.CircleGeometry(1, 12);
    
    // Przesuwamy geometrię o promień (1) w prawo, 
    // aby środek koła był przesunięty, a pivot (0,0,0) znalazł się na jego krawędzi.
    geo.translate(1, 0, 0); 
    
    return geo;
  }, []);

  // Animacja lotu i machania skrzydeł
  useFrame((state) => {
    if (!meshRef.current || !zoneInfo) return;

    const time = state.clock.getElapsedTime();
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    butterflyData.forEach((b, i) => {
      // Obliczamy bazową pozycję "ciała" motyla
      const centerX = zoneInfo.startX + b.x * zoneInfo.width;
      const centerZ = zoneInfo.startZ + b.z * zoneInfo.depth;

      if (!pathSet.has(`${Math.floor(centerX)},${Math.floor(centerZ)}`)) {
        // Ruch całego motyla (płynne latanie w 3D)
        const flyY = CONFIG.basePlane + Math.sin(time * CONFIG.speed + b.t) * 0.4;
        const flyX = centerX + Math.cos(time * CONFIG.speed * 0.4 + b.t) * 1.3;
        const flyZ = centerZ + Math.sin(time * CONFIG.speed * 0.6 + b.t) * 1.3;

        // Kierunek lotu i machanie (poprawne osie z poprzedniego kroku)
        
        // 1. Kierunek (wokół osi Y)
        const ry = (time * CONFIG.speed + b.t) * b.factor; 
        
        // 2. Kąt machania (wokół osi X)
        // Używamy Math.abs, aby skrzydła machały tylko do góry (od 0 do 0.9 radiana)
        const flap = Math.abs(Math.sin(time * CONFIG.flapSpeed + b.phase)) * 0.9;

        // --- LEWE SKRZYDŁO (Okrągłe) ---
        dummy.position.set(flyX, flyY, flyZ);
        dummy.rotation.set(flap, ry, 0); // Machanie na X, Kierunek na Y
        dummy.scale.setScalar(CONFIG.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i * 2, dummy.matrix);

        // --- PRAWE SKRZYDŁO (Okrągłe) ---
        dummy.position.set(flyX, flyY, flyZ);
        dummy.rotation.set(-flap, ry, 0); // Przeciwne machanie na X
        dummy.scale.setScalar(CONFIG.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);

      } else {
        // Chowamy motyla, jeśli trafił nad ścieżkę
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i * 2, dummy.matrix);
        meshRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!zoneInfo) return null;

  return (
    <instancedMesh ref={meshRef} args={[wingGeometry, null, totalInstances]}>
      <meshStandardMaterial 
        color={CONFIG.color} 
        emissive={CONFIG.color} 
        emissiveIntensity={2} 
        transparent 
        opacity={0.85}
        side={THREE.DoubleSide} // Ważne: koła muszą być widoczne z obu stron
      />
    </instancedMesh>
  );
};

export default MeadowButterflies;