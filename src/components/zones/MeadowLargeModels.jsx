import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA DUŻYCH MODELI ---
const MODELS_CONFIG = [
  { path: '/models/drzewko.glb', basePlane: 0.4, scale: 0.2, instancesNo: 2 },
  { path: '/models/drzewko.glb', basePlane: 0.4, scale: 0.2, instancesNo: 1 },
  { path: '/models/drzewko.glb', basePlane: 0.4, scale: 0.2, instancesNo: 2 },
  { path: '/models/drzewko.glb', basePlane: 0.4, scale: 0.2, instancesNo: 1 }
];

const MeadowLargeModels = ({ mapData }) => {
  const groupsRef = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Przechowywanie danych o instancjach (pozycja, rotacja, parametry animacji)
  const instanceDataRef = useRef(MODELS_CONFIG.map(() => []));

  const gltfs = useGLTF(MODELS_CONFIG.map(m => m.path));

  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;
    
    const minX = Math.min(...meadowTiles.map(t => t.x));
    const minZ = Math.min(...meadowTiles.map(t => t.y));
    
    return { startX: minX - 1, startZ: minZ - 1, sizeX: 8, sizeZ: 11 };
  }, [mapData]);

  // 1. Inicjalizacja pozycji i danych animacji
  useLayoutEffect(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    MODELS_CONFIG.forEach((cfg, idx) => {
      const currentGroup = groupsRef.current[idx];
      if (!currentGroup) return;

      const instances = [];
      let placed = 0;
      let attempts = 0;
      const maxAttempts = cfg.instancesNo * 20;

      while (placed < cfg.instancesNo && attempts < maxAttempts) {
        attempts++;
        const x = zoneInfo.startX + Math.random() * zoneInfo.sizeX;
        const z = zoneInfo.startZ + Math.random() * zoneInfo.sizeZ;
        
        if (!pathSet.has(`${Math.floor(x)},${Math.floor(z)}`)) {
          instances.push({
            pos: new THREE.Vector3(x, cfg.basePlane, z),
            rotY: Math.random() * Math.PI * 2,
            scale: cfg.scale * (0.9 + Math.random() * 0.2),
            phase: Math.random() * Math.PI * 2,
            swaySpeed: 0.4 + Math.random() * 0.4, // Indywidualna prędkość bujania
            swayIntensity: 0.02 + Math.random() * 0.12 // Indywidualna siła przechyłu
          });
          placed++;
        }
      }
      
      instanceDataRef.current[idx] = instances;

      // Pierwotne ustawienie macierzy
      currentGroup.children.forEach(instancedMesh => {
        if (instancedMesh.isInstancedMesh) {
          instances.forEach((data, i) => {
            dummy.position.copy(data.pos);
            dummy.rotation.set(0, data.rotY, 0);
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
          });
          instancedMesh.count = instances.length;
          instancedMesh.instanceMatrix.needsUpdate = true;
        }
      });
    });
  }, [zoneInfo, mapData.path, dummy]);

  // 2. Animacja bujania (Sway) dla WSZYSTKICH modeli
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    MODELS_CONFIG.forEach((cfg, groupIdx) => {
      const group = groupsRef.current[groupIdx];
      const instances = instanceDataRef.current[groupIdx];
      
      if (!group || !instances || instances.length === 0) return;

      group.children.forEach(instancedMesh => {
        if (instancedMesh.isInstancedMesh) {
          instances.forEach((data, i) => {
            // Obliczamy unikalne wychylenie dla każdej instancji
            const angleX = Math.sin(t * data.swaySpeed + data.phase) * data.swayIntensity;
            const angleZ = Math.cos(t * (data.swaySpeed * 0.8) + data.phase) * data.swayIntensity;

            dummy.position.copy(data.pos);
            // Nakładamy bujanie na osie X i Z, zachowując stały obrót wokół Y
            dummy.rotation.set(angleX, data.rotY, angleZ);
            dummy.scale.setScalar(data.scale);
            
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
          });
          instancedMesh.instanceMatrix.needsUpdate = true;
        }
      });
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
                frustumCulled={false} // Zapobiega znikaniu modeli przy krawędziach
              />
            ));
          }, [gltfs, idx, cfg.instancesNo])}
        </group>
      ))}
    </group>
  );
};

MODELS_CONFIG.forEach(m => useGLTF.preload(m.path));

export default MeadowLargeModels;