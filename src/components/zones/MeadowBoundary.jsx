import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// --- [1] KONFIGURACJA KAFELKÓW OBWODOWYCH ---
const CONFIG = {
  modelPath: '/models/meadow_groundBoundary001.glb',
  basePlane: 0.0,
  scale: 1.0,
  instancesNo: 50
};

const MeadowBoundary = ({ mapData }) => {
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Ładowanie modelu
  const { scene } = useGLTF(CONFIG.modelPath);

  // 2. Pobranie geometrii ORAZ oryginalnych materiałów
  const meshesData = useMemo(() => {
    const parts = [];
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Zachowujemy geometrię i oryginalny materiał z modelu GLB
          parts.push({ 
            geometry: child.geometry, 
            material: child.material 
          });
        }
      });
    }
    return parts;
  }, [scene]);

  // 3. Obliczanie granic matrycy strefy
  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData?.path?.filter(t => t.category === 'meadow') || [];
    if (meadowTiles.length === 0) return null;

    const minX = Math.min(...meadowTiles.map(t => t.x));
    const minZ = Math.min(...meadowTiles.map(t => t.y));

    return { 
      startX: minX - 2, 
      endX: minX + 8, 
      startZ: minZ - 2, 
      endZ: minZ + 11 
    };
  }, [mapData]);

  // 4. Logika rozmieszczania po obwodzie
  useLayoutEffect(() => {
    if (!groupRef.current || !zoneInfo || meshesData.length === 0) return;

    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    const transforms = [];

    for (let x = zoneInfo.startX; x < zoneInfo.endX; x++) {
      for (let z = zoneInfo.startZ; z < zoneInfo.endZ; z++) {
        const isEdge = (
          x === zoneInfo.startX || 
          x === zoneInfo.endX - 1 || 
          z === zoneInfo.startZ || 
          z === zoneInfo.endZ - 1
        );

        if (isEdge && !pathSet.has(`${x},${z}`)) {
          dummy.position.set(x + 0.5, CONFIG.basePlane, z + 0.5);
          dummy.scale.setScalar(CONFIG.scale);
          dummy.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
        }
      }
    }

    groupRef.current.children.forEach((instancedMesh) => {
      if (!instancedMesh.isInstancedMesh) return;
      
      transforms.forEach((matrix, i) => {
        instancedMesh.setMatrixAt(i, matrix);
      });
      
      instancedMesh.count = transforms.length;
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.computeBoundingSphere();
    });

  }, [zoneInfo, mapData, dummy, meshesData]);

  if (!zoneInfo) return null;

  return (
    <group ref={groupRef}>
      {meshesData.map((part, index) => (
        <instancedMesh 
          key={index}
          // Przekazujemy geometrię i oryginalny materiał do args
          args={[part.geometry, part.material, CONFIG.instancesNo]} 
          castShadow 
          receiveShadow 
        />
      ))}
    </group>
  );
};

useGLTF.preload(CONFIG.modelPath);

export default MeadowBoundary;