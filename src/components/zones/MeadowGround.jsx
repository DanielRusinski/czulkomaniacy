import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// --- KONFIGURACJA ELEMENTU ---
const CONFIG = {
  modelPath: '/models/meadow_groundA.glb',
  basePlane: 0.02,      // Wysokość, na której ląduje kafel
  scale: 1.0,           // Skala modelu
  instancesNo: 150      // Bufor dla matrycy 8x11 (88 pól)
};

/**
 * MeadowGround - Skrypt odpowiedzialny za bazowe kafle podłoża w strefie Meadow.
 * Wypełnia obszar 8x11, omijając kafelki ścieżki (gameTiles).
 */
const MeadowGround = ({ mapData, activePlayer }) => {
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Ładowanie modelu podłoża
  const { scene } = useGLTF(CONFIG.modelPath);
  
  // 2. Przygotowanie geometrii i materiałów
  const meshesData = useMemo(() => {
    const parts = [];
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          const material = child.material.clone();
          material.roughness = 0.85; // Optymalizacja pod cienie
          parts.push({ geometry: child.geometry, material: material });
        }
      });
    }
    return parts;
  }, [scene]);

  // 3. Obliczanie granic strefy Meadow (Synchronizacja do 8x11)
  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;

    let minX = Infinity;
    let minZ = Infinity;
    meadowTiles.forEach(t => {
      minX = Math.min(minX, t.x);
      minZ = Math.min(minZ, t.y);
    });

    // Skorygowano granice, aby pasowały do matrycy 8x11 używanej w innych komponentach
    return { 
      startX: minX - 1, 
      endX: minX + 7,   // minX-1 + 8 kolumn
      startZ: minZ - 1, 
      endZ: minZ + 10   // minZ-1 + 11 rzędów
    };
  }, [mapData]);

  // 4. Rozmieszczanie instancji (Logika "Empty Spaces")
  useLayoutEffect(() => {
    if (!groupRef.current || !zoneInfo || meshesData.length === 0) return;

    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    const transforms = [];

    // Iteracja po poprawionej matrycy 8x11
    for (let x = zoneInfo.startX; x < zoneInfo.endX; x++) {
      for (let z = zoneInfo.startZ; z < zoneInfo.endZ; z++) {
        // Jeśli pole NIE jest częścią ścieżki gracza, kładziemy tam grunt
        if (!pathSet.has(`${x},${z}`)) {
          dummy.position.set(x + 0.5, CONFIG.basePlane, z + 0.5);
          dummy.scale.setScalar(CONFIG.scale);
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
        }
      }
    }

    // Diagnostyka: Sprawdzenie ilości utworzonych kafli w konsoli
    console.log(`[MeadowGround] Wygenerowano ${transforms.length} kafli gruntu.`);

    // Aplikacja macierzy do instancji
    groupRef.current.children.forEach((instancedMesh) => {
      if (!instancedMesh.isInstancedMesh) return;
      
      transforms.forEach((matrix, i) => {
        instancedMesh.setMatrixAt(i, matrix);
      });
      
      instancedMesh.count = transforms.length;
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.computeBoundingSphere(); 
    });

  }, [zoneInfo, mapData.path, dummy, meshesData]);

  if (!zoneInfo) return null;

  return (
    <group ref={groupRef} name="Meadow_Ground_Instances">
      {meshesData.map((part, index) => (
        <instancedMesh 
          key={index}
          args={[part.geometry, part.material, CONFIG.instancesNo]} 
          receiveShadow={true} 
          castShadow={true}
        />
      ))}
    </group>
  );
};

// Pre-load dla wydajności
useGLTF.preload(CONFIG.modelPath);

export default MeadowGround;