import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../../logic/gameState';

// --- [1] KONFIGURACJA ANIMACJI I ELEMENTÓW REAKTYWNYCH ---
const CONFIG = {
  modelPath: null,            // Skrypt używa natywnych geometrii lub może ładować GLB
  basePlane: 0.45,            // Wysokość zawieszenia elementów
  scale: 0.15,                // Skala bazowa kępek
  instancesNo: 30,            // Ilość interaktywnych punktów
  interactionRadius: 2.5,     // Dystans, przy którym rośliny reagują na gracza
  windSpeed: 1.2,             // Globalna prędkość wiatru w strefie
  windStrength: 0.1           // Siła wychylenia
};

/**
 * MeadowAnimation - System zarządzający interaktywnymi animacjami środowiska.
 * Tworzy kępki "czułej" roślinności, która reaguje na pozycję aktywnego gracza.
 */
const MeadowAnimation = ({ mapData, activePlayer }) => {
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

  // 1. Obliczanie granic matrycy Meadow (8x11)
  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;

    const minX = Math.min(...meadowTiles.map(t => t.x));
    const minZ = Math.min(...meadowTiles.map(t => t.y));

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

      // Logika "Empty Spaces"
      if (!pathSet.has(`${Math.floor(worldX)},${Math.floor(worldZ)}`)) {
        
        // Obliczanie dystansu od gracza
        const dist = playerPos.distanceTo(new THREE.Vector2(worldX, worldZ));
        
        // Efekt reakcji: roślina "chowa się" lub pulsuje mocniej, gdy gracz jest blisko
        // Zmieniono Math.smoothstep na THREE.MathUtils.smoothstep, aby naprawić TypeError
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
      {/* Geometria kępy (np. 3 skrzyżowane płaszczyzny dla efektu 3D) */}
      <cylinderGeometry args={[0.5, 0.1, 1.2, 5]} /> 
      <meshStandardMaterial 
        color="#88cc44" 
        roughness={0.6}
        emissive="#224411"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
};

export default MeadowAnimation;