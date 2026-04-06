import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../../logic/gameState';

// --- [1] KONFIGURACJA ANIMACJI I ELEMENTÓW REAKTYWNYCH ---
const CONFIG = {
  modelPath: null,            // Skrypt używa natywnych geometrii
  basePlane: 0.45,            // Wysokość zawieszenia elementów
  scale: 0.15,                // Skala bazowa kępek
  instancesNo: 30,            // Ilość interaktywnych punktów
  interactionRadius: 2.5,     // Dystans reakcji na gracza
  windSpeed: 1.0,             // Nieco wolniejszy wiatr w lesie
  windStrength: 0.08          // Subtelniejsze wychylenie dla gęstszej roślinności
};

/**
 * ForestAnimation - System zarządzający interaktywnymi animacjami środowiska leśnego.
 * Tworzy kępki roślinności reagujące na pozycję aktywnego gracza.
 */
const ForestAnimation = ({ mapData, activePlayer }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Dane o rozmieszczeniu (losowe offsety i prędkości pulsowania)
  const animData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.instancesNo; i++) {
      data.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        xPos: Math.random(), 
        zPos: Math.random()
      });
    }
    return data;
  }, []);

  // 1. Obliczanie granic matrycy Forest (8x11)
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

  // 2. Główna pętla animacji i interakcji
  useFrame((state) => {
    if (!meshRef.current || !zoneInfo) return;

    const time = state.clock.getElapsedTime();
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));
    
    // Pobranie pozycji gracza do obliczeń dystansu
    const player = gameState.getCurrentPlayer();
    const playerTile = mapData.path.find(t => t.id === player?.currentModuleId);
    const playerPos = playerTile 
      ? new THREE.Vector2(playerTile.x + 0.5, playerTile.y + 0.5) 
      : new THREE.Vector2(-99, -99);

    animData.forEach((data, i) => {
      const worldX = zoneInfo.startX + data.xPos * zoneInfo.width;
      const worldZ = zoneInfo.startZ + data.zPos * zoneInfo.depth;

      // Logika "Empty Spaces" - omijanie ścieżki gry
      if (!pathSet.has(`${Math.floor(worldX)},${Math.floor(worldZ)}`)) {
        
        const dist = playerPos.distanceTo(new THREE.Vector2(worldX, worldZ));
        
        // Efekt reakcji przy użyciu THREE.MathUtils.smoothstep
        const interaction = THREE.MathUtils.smoothstep(dist, 0, CONFIG.interactionRadius);
        const pulse = Math.sin(time * data.speed + data.phase) * 0.2 + 0.8;
        
        const finalScale = CONFIG.scale * pulse * interaction;

        dummy.position.set(worldX, CONFIG.basePlane, worldZ);
        
        // Animacja wiatru (Sway)
        const windX = Math.sin(time * CONFIG.windSpeed + worldX) * CONFIG.windStrength;
        const windZ = Math.cos(time * CONFIG.windSpeed + worldZ) * CONFIG.windStrength;
        dummy.rotation.set(windX, 0, windZ);
        
        dummy.scale.setScalar(finalScale);
      } else {
        dummy.scale.setScalar(0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!zoneInfo) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, CONFIG.instancesNo]}>
      {/* Geometria kępy (identyczna jak w Meadow dla szybkości integracji) */}
      <cylinderGeometry args={[0.5, 0.1, 1.2, 5]} /> 
      <meshStandardMaterial 
        color="#2d6a4f" // Ciemniejsza zieleń leśna
        roughness={0.7}
        emissive="#122a1f"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  );
};

export default ForestAnimation;