import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const CONFIG = {
  modelPath: '/models/meadow_groundA.glb',
  basePlane: 0.02,
  scale: 1.0,
  instancesNo: 150 
};

const ForestGround = ({ mapData }) => {
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { scene } = useGLTF(CONFIG.modelPath);
  
  const meshesData = useMemo(() => {
    const parts = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const material = child.material.clone();
        material.roughness = 0.85;
        parts.push({ geometry: child.geometry, material: material });
      }
    });
    return parts;
  }, [scene]);

  const zoneInfo = useMemo(() => {
    const zoneTiles = mapData.path.filter(t => t.category === 'forest');
    if (zoneTiles.length === 0) return null;
    let minX = Infinity, minZ = Infinity;
    zoneTiles.forEach(t => {
      minX = Math.min(minX, t.x);
      minZ = Math.min(minZ, t.y);
    });
    return { startX: minX - 1, endX: minX + 7, startZ: minZ - 1, endZ: minZ + 10 };
  }, [mapData]);

  useLayoutEffect(() => {
    if (!groupRef.current || !zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    const transforms = [];

    for (let x = zoneInfo.startX; x < zoneInfo.endX; x++) {
      for (let z = zoneInfo.startZ; z < zoneInfo.endZ; z++) {
        if (!pathSet.has(`${x},${z}`)) {
          dummy.position.set(x + 0.5, CONFIG.basePlane, z + 0.5);
          dummy.scale.setScalar(CONFIG.scale);
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
        }
      }
    }

    groupRef.current.children.forEach((instancedMesh) => {
      if (!instancedMesh.isInstancedMesh) return;
      transforms.forEach((matrix, i) => instancedMesh.setMatrixAt(i, matrix));
      instancedMesh.count = transforms.length;
      instancedMesh.instanceMatrix.needsUpdate = true;
    });
  }, [zoneInfo, mapData.path]);

  if (!zoneInfo) return null;

  return (
    <group ref={groupRef}>
      {meshesData.map((part, index) => (
        <instancedMesh key={index} args={[part.geometry, part.material, CONFIG.instancesNo]} receiveShadow castShadow />
      ))}
    </group>
  );
};

export default ForestGround;