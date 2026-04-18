import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA DUŻYCH MODELI (Reużycie modeli z Meadow) ---
const MODELS_CONFIG = [
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.0,    // Wysokość osadzenia
    scale: 0.45,       // Bazowa skala
    instancesNo: 6     // Ilość sztuk tego modelu
  },
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.05, 
    scale: 0.3, 
    instancesNo: 4 
  },
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.0, 
    scale: 0.6, 
    instancesNo: 3 
  },
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.0, 
    scale: 0.4, 
    instancesNo: 2 
  }
];

/**
 * ForestLargeModels - Zarządza dużymi dekoracjami strefy Forest.
 * Automatycznie rozmieszcza drzewa i skały wokół ścieżki leśnej.
 */
const ForestLargeModels = ({ mapData }) => {
  const groupsRef = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Ładowanie wszystkich modeli naraz
  const gltfs = useGLTF(MODELS_CONFIG.map(m => m.path));

  // 2. Obliczanie granic strefy Forest (Matryca 8x11)
  const zoneInfo = useMemo(() => {
    // Zmiana filtrowania na kategorię 'forest'
    const forestTiles = mapData.path.filter(t => t.category === 'forest');
    if (forestTiles.length === 0) return null;
    
    const minX = Math.min(...forestTiles.map(t => t.x));
    const minZ = Math.min(...forestTiles.map(t => t.y));
    
    return { 
      startX: minX - 1, 
      startZ: minZ - 1, 
      sizeX: 8, 
      sizeZ: 11 
    };
  }, [mapData]);

  // 3. Pozycjonowanie proceduralne z omijaniem ścieżki leśnej
  useLayoutEffect(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    MODELS_CONFIG.forEach((cfg, idx) => {
      const currentGroup = groupsRef.current[idx];
      if (!currentGroup) return;

      const transforms = [];
      let placed = 0;
      let attempts = 0;
      const maxAttempts = cfg.instancesNo * 10;

      while (placed < cfg.instancesNo && attempts < maxAttempts) {
        attempts++;
        // Losowanie pozycji wewnątrz matrycy 8x11 strefy Forest
        const x = zoneInfo.startX + Math.random() * zoneInfo.sizeX;
        const z = zoneInfo.startZ + Math.random() * zoneInfo.sizeZ;
        
        // Sprawdzenie czy pole pod modelem nie jest kafelkiem gry
        if (!pathSet.has(`${Math.floor(x)},${Math.floor(z)}`)) {
          dummy.position.set(x, cfg.basePlane, z);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          
          const finalScale = cfg.scale * (0.9 + Math.random() * 0.2);
          dummy.scale.setScalar(finalScale);
          
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
          placed++;
        }
      }

      // Aplikacja macierzy do instancji
      currentGroup.children.forEach(instancedMesh => {
        if (instancedMesh.isInstancedMesh) {
          transforms.forEach((mat, i) => instancedMesh.setMatrixAt(i, mat));
          instancedMesh.count = transforms.length;
          instancedMesh.instanceMatrix.needsUpdate = true;
          instancedMesh.computeBoundingSphere();
        }
      });
    });
  }, [zoneInfo, mapData.path, dummy]);

  // 4. Animacja bujania (Sway) dla lasu
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupsRef.current.forEach((group, groupIdx) => {
      if (!group) return;
      // Bujamy tylko modelami "roślinnymi" (z pominięciem indeksu 2 - kamienia)
      if (groupIdx !== 2) {
        group.rotation.x = Math.sin(t * 0.5 + groupIdx) * 0.02;
        group.rotation.z = Math.cos(t * 0.3 + groupIdx) * 0.02;
      }
    });
  });

  if (!zoneInfo) return null;

  return (
    <group>
      {MODELS_CONFIG.map((cfg, idx) => (
        <group key={idx} ref={el => groupsRef.current[idx] = el}>
          {useMemo(() => {
            const meshes = [];
            gltfs[idx].scene.traverse(child => {
              if (child.isMesh) meshes.push(child);
            });
            return meshes.map((m, mIdx) => (
              <instancedMesh 
                key={mIdx} 
                args={[m.geometry, m.material, cfg.instancesNo]} 
                castShadow 
                receiveShadow 
              />
            ));
          }, [gltfs, idx, cfg.instancesNo])}
        </group>
      ))}
    </group>
  );
};

// Pre-load dla modeli w strefie leśnej
MODELS_CONFIG.forEach(m => useGLTF.preload(m.path));

export default ForestLargeModels;