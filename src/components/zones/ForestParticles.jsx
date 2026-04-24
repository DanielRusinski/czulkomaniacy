import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- [1] KONFIGURACJA SYSTEMU CZĄSTECZEK ---
const CONFIG = {
  basePlane: 1.2,       // Średnia wysokość zawieszenia cząsteczek
  scale: 0.05,          // Rozmiar pojedynczej cząsteczki
  instancesNo: 100,     // Ilość cząsteczek w strefie
  color: '#2d6a4f',     // Domyślny kolor leśny (może być nadpisany przez prop color)
  speed: 0.4            // Nieco wolniejsza animacja dla gęstego lasu
};

/**
 * ForestParticles - System cząsteczek (zarodników/pyłków) unoszących się w strefie Forest.
 * Rozmieszczane proceduralnie z omijaniem ścieżki gracza.
 */
const ForestParticles = ({ mapData, color }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Dane do animacji (indywidualne przesunięcia dla każdej cząsteczki)
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.instancesNo; i++) {
      data.push({
        t: Math.random() * 100, // Losowy offset czasu
        factor: 0.2 + Math.random() * 1.5, // Indywidualny mnożnik ruchu
        x: Math.random(), // Procentowa pozycja wewnątrz strefy
        z: Math.random()
      });
    }
    return data;
  }, []);

  // 1. Obliczanie granic matrycy strefy leśnej (8x11)
  const zoneInfo = useMemo(() => {
    // Filtrowanie dla kategorii 'forest'
    const forestTiles = mapData.path.filter(t => t.category === 'forest');
    if (forestTiles.length === 0) return null;

    const minX = Math.min(...forestTiles.map(t => t.x));
    const minZ = Math.min(...forestTiles.map(t => t.y));

    return { 
      startX: minX - 1, 
      endX: minX + 7, 
      startZ: minZ - 1, 
      endZ: minZ + 10,
      width: 8,
      depth: 11
    };
  }, [mapData]);

  // 2. Inicjalizacja i pozycjonowanie (Empty Spaces)
  useMemo(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    particles.forEach((p, i) => {
      const worldX = zoneInfo.startX + p.x * zoneInfo.width;
      const worldZ = zoneInfo.startZ + p.z * zoneInfo.depth;

      // Sprawdzenie, czy pod cząsteczką nie ma kafelka gry
      if (!pathSet.has(`${Math.floor(worldX)},${Math.floor(worldZ)}`)) {
        dummy.position.set(worldX, CONFIG.basePlane, worldZ);
        dummy.scale.setScalar(CONFIG.scale);
      } else {
        dummy.scale.setScalar(0);
      }
      
      dummy.updateMatrix();
    });
  }, [zoneInfo, mapData.path]);

  // 3. Animacja unoszenia i falowania
  useFrame((state) => {
    if (!meshRef.current || !zoneInfo) return;

    const time = state.clock.getElapsedTime();
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    particles.forEach((p, i) => {
      const worldX = zoneInfo.startX + p.x * zoneInfo.width;
      const worldZ = zoneInfo.startZ + p.z * zoneInfo.depth;

      if (!pathSet.has(`${Math.floor(worldX)},${Math.floor(worldZ)}`)) {
        // Ruch sinusoidalny
        const curY = CONFIG.basePlane + Math.sin(time * CONFIG.speed + p.t) * 0.3 * p.factor;
        const curX = worldX + Math.cos(time * CONFIG.speed * 0.5 + p.t) * 0.2;
        const curZ = worldZ + Math.sin(time * CONFIG.speed * 0.7 + p.t) * 0.2;

        dummy.position.set(curX, curY, curZ);
        dummy.quaternion.copy(state.camera.quaternion); // Billboard effect
        dummy.scale.setScalar(CONFIG.scale * (0.8 + Math.sin(time + p.t) * 0.2));
      } else {
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!zoneInfo) return null;

  const finalColor = color || CONFIG.color; // Użycie propa color przekazanego z Environment

  return (
    <instancedMesh ref={meshRef} args={[null, null, CONFIG.instancesNo]}>
      <circleGeometry args={[1, 6]} /> 
      <meshStandardMaterial 
        color={finalColor} 
        emissive={finalColor} 
        emissiveIntensity={1.5} 
        transparent 
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

export default ForestParticles;