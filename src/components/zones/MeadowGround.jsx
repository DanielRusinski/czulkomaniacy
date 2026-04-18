import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// --- KONFIGURACJA ELEMENTU ---
const CONFIG = {
  modelPath: '/models/Ground_base001.glb',
  basePlane: -0.55,      // Wysokość, na której ląduje kafel
  scale: 1.0,           // Skala modelu
  instancesNo: 150      // Bufor dla matrycy 8x11
};

/**
 * MeadowGround - Zoptymalizowany manager instancji podłoża.
 * Rozmieszcza kafle na siatce 8x11, pomijając ścieżkę gracza.
 * Wersja zredukowana: brak modyfikacji materiałów, używamy surowego GLB.
 */
const MeadowGround = ({ mapData }) => {
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Ładowanie modelu podłoża
  const { scene } = useGLTF(CONFIG.modelPath);
  
  // 2. Pobranie geometrii i oryginalnych materiałów z modelu (bez klonowania)
  const meshesData = useMemo(() => {
    const parts = [];
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Pobieramy materiał dokładnie taki, jaki wyszedł z blendera/programu 3D
          parts.push({ geometry: child.geometry, material: child.material });
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

    return { 
      startX: minX - 1, 
      endX: minX + 7,   
      startZ: minZ - 1, 
      endZ: minZ + 10   
    };
  }, [mapData]);

  // 4. Rozmieszczanie instancji
  useLayoutEffect(() => {
    if (!groupRef.current || !zoneInfo || meshesData.length === 0) return;

    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    const transforms = [];

    // Iteracja po matrycy 8x11
    for (let x = zoneInfo.startX; x < zoneInfo.endX; x++) {
      for (let z = zoneInfo.startZ; z < zoneInfo.endZ; z++) {
        // Jeśli pole NIE jest częścią ścieżki gracza, kładziemy tam grunt
        if (!pathSet.has(`${x},${z}`)) {
          // Pozycja i skala
          dummy.position.set(x + 0.5, CONFIG.basePlane, z + 0.5);
          dummy.scale.setScalar(CONFIG.scale);
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
        }
      }
    }

    // Aplikacja macierzy do wszystkich instancji
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