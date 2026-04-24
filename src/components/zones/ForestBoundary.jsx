import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// --- [1] KONFIGURACJA KAFELKÓW OBWODOWYCH ---
const CONFIG = {
  modelPath: '/models/placeholder.glb', // Użycie tego samego modelu dla szybkiej integracji
  basePlane: 1.0,       // Wysokość osadzenia
  scale: 1.0,           // Skala obiektu
  instancesNo: 40       // Rezerwacja instancji (obwód 8x11 to ok. 34-38 pól)
};

/**
 * ForestBoundary - Odpowiada za kafelki otaczające strefę Forest.
 * Automatycznie identyfikuje skrajne pola matrycy i wypełnia je modelami.
 */
const ForestBoundary = ({ mapData }) => {
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Ładowanie modelu
  const { scene } = useGLTF(CONFIG.modelPath);
  
  // 2. Przygotowanie danych mesha (obsługa wielu części modelu)
  const meshesData = useMemo(() => {
    const parts = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const material = child.material.clone();
        material.roughness = 0.9; // Matowe wykończenie
        parts.push({ geometry: child.geometry, material: material });
      }
    });
    return parts;
  }, [scene]);

  // 3. Obliczanie granic matrycy strefy
  const zoneInfo = useMemo(() => {
    // Zmiana filtrowania na kategorię 'forest'
    const forestTiles = mapData.path.filter(t => t.category === 'forest');
    if (forestTiles.length === 0) return null;

    const minX = Math.min(...forestTiles.map(t => t.x));
    const minZ = Math.min(...forestTiles.map(t => t.y));

    // Definiujemy granice matrycy 8x11 wokół strefy leśnej
    return { 
      startX: minX - 1, 
      endX: minX + 7,   // minX-1 + 8 kolumn
      startZ: minZ - 1, 
      endZ: minZ + 10   // minZ-1 + 11 rzędów
    };
  }, [mapData]);

  // 4. Logika rozmieszczania po obwodzie (Perimeter Logic)
  useLayoutEffect(() => {
    if (!groupRef.current || !zoneInfo) return;

    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    const transforms = [];

    // Przeszukujemy matrycę 8x11
    for (let x = zoneInfo.startX; x < zoneInfo.endX; x++) {
      for (let z = zoneInfo.startZ; z < zoneInfo.endZ; z++) {
        
        // Sprawdzamy czy pole leży na krawędzi (Boundary)
        const isEdge = (
          x === zoneInfo.startX || 
          x === zoneInfo.endX - 1 || 
          z === zoneInfo.startZ || 
          z === zoneInfo.endZ - 1
        );

        if (isEdge) {
          // Sprawdzamy, czy nie stoi tam kafelek ścieżki gracza
          if (!pathSet.has(`${x},${z}`)) {
            dummy.position.set(x + 0.5, CONFIG.basePlane, z + 0.5);
            dummy.scale.setScalar(CONFIG.scale);
            
            // Losowy obrót co 90 stopni dla naturalnego zróżnicowania krawędzi
            dummy.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
            
            dummy.updateMatrix();
            transforms.push(dummy.matrix.clone());
          }
        }
      }
    }

    // Aplikacja do InstancedMesh
    groupRef.current.children.forEach((instancedMesh) => {
      if (!instancedMesh.isInstancedMesh) return;
      
      transforms.forEach((matrix, i) => {
        instancedMesh.setMatrixAt(i, matrix);
      });
      
      instancedMesh.count = transforms.length;
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.computeBoundingSphere();
    });

  }, [zoneInfo, mapData.path, dummy]);

  if (!zoneInfo) return null;

  return (
    <group ref={groupRef}>
      {meshesData.map((part, index) => (
        <instancedMesh 
          key={index}
          args={[part.geometry, part.material, CONFIG.instancesNo]} 
          castShadow 
          receiveShadow 
        />
      ))}
    </group>
  );
};

useGLTF.preload(CONFIG.modelPath);

export default ForestBoundary;