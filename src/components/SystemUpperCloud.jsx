import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';

const SystemUpperCloud = ({ mapData, activePlayer, baseHeight = 15, cloudCount = 22 }) => {
  const cloudsRef = useRef([]);

  // 1. ŁADOWANIE TEKSTUR CHMUR
  const textures = useTexture([
    './textures/cloud04.png',
    './textures/cloud04.png',
    './textures/cloud04.png'
  ]);

  // 2. OBLICZANIE GRANIC AKTYWNEJ STREFY I INICJALIZACJA DANYCH CHMUR
  const { bounds, cloudData } = useMemo(() => {
    const player = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
    const currentTile = mapData.path.find(t => String(t.id) === String(player?.currentModuleId));
    const category = currentTile?.isBoss ? "darkness" : (currentTile?.category || "start-meta");
    
    // Filtrowanie kafelków bieżącej strefy
    const zoneTiles = mapData.path.filter(t => (t.isBoss ? "darkness" : t.category) === category);
    
    if (zoneTiles.length === 0) {
      return { bounds: null, cloudData: [] };
    }

    // Wyznaczanie Bounding Boxa strefy
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    zoneTiles.forEach(t => {
      minX = Math.min(minX, t.x);
      maxX = Math.max(maxX, t.x);
      minZ = Math.min(minZ, t.y);
      maxZ = Math.max(maxZ, t.y);
    });

    // Margines poza obszarem mapy. 
    // FADE IN / OUT będzie zachodził na długości tego marginesu.
    const buffer = 15; 
    const extendedBounds = {
      minX: minX - buffer,
      maxX: maxX + buffer,
      minZ: minZ - (buffer / 2),
      maxZ: maxZ + (buffer / 2),
      buffer: buffer // Zapisujemy bufor do obliczeń alpha
    };

    // Generowanie parametrów początkowych dla każdej chmury
    const generatedClouds = Array.from({ length: cloudCount }).map((_, i) => {
      return {
        id: `cloud_${i}`,
        // Pozycja startowa (z poprawką na siatkę - nie potrzebujemy grid center tutaj
        // jeśli grupa wyżej w Board3D już przesuwa koordynaty, ale trzymamy bazowe minX)
        x: extendedBounds.minX + Math.random() * (extendedBounds.maxX - extendedBounds.minX),
        y: baseHeight + (Math.random() * 1 - 0.5), // Wysokość bazy +/- 2
        z: extendedBounds.minZ + Math.random() * (extendedBounds.maxZ - extendedBounds.minZ),
        // Wygląd
        scale: 2 + Math.random() * 4, // Skala
        maxOpacity: 0.4 + Math.random() * 0.4, // Max przezroczystość (kiedy jest w centrum)
        textureIndex: Math.floor(Math.random() * 3), // Wybór tekstury
        // Fizyka ruchu
        speedX: 0.3 + Math.random() * 0.2, // Prędkość wzdłuż osi X
        driftZ: (Math.random() - 0.5) * 0.2, // Delikatne znoszenie na osi Z
      };
    });

    return { bounds: extendedBounds, cloudData: generatedClouds };
  }, [mapData, activePlayer?.currentModuleId, baseHeight, cloudCount]);

  // 3. PĘTLA ANIMACJI
  useFrame((state, delta) => {
    if (!bounds || cloudData.length === 0) return;

    cloudsRef.current.forEach((cloudMesh, i) => {
      if (!cloudMesh) return;
      const data = cloudData[i];

      // Przesunięcie chmury
      cloudMesh.position.x += data.speedX * delta;
      cloudMesh.position.z += data.driftZ * delta;

      // Nieskończona pętla (Loop)
      if (cloudMesh.position.x > bounds.maxX) {
        cloudMesh.position.x = bounds.minX;
        cloudMesh.position.z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
      }

      // --- LOGIKA FADE IN / FADE OUT ---
      // 1. Domyślnie chmura ma docelową pełną widoczność (maxOpacity)
      let currentOpacity = data.maxOpacity;
      
      // 2. Odległość chmury od lewej krawędzi (Wejście - Fade In)
      const distFromStart = cloudMesh.position.x - bounds.minX;
      // 3. Odległość chmury od prawej krawędzi (Wyjście - Fade Out)
      const distFromEnd = bounds.maxX - cloudMesh.position.x;
      
      // 4. Jeśli chmura jest bliżej krawędzi niż wynosi 'buffer' (15), 
      // zaczyna tracić przezroczystość aż do zera na samej granicy minX / maxX.
      if (distFromStart < bounds.buffer) {
        // Obliczamy procent wejścia (od 0.0 na samej granicy do 1.0 po przejściu buffera)
        const progress = Math.max(0, distFromStart / bounds.buffer);
        currentOpacity = data.maxOpacity * progress;
      } else if (distFromEnd < bounds.buffer) {
        // Obliczamy procent wyjścia
        const progress = Math.max(0, distFromEnd / bounds.buffer);
        currentOpacity = data.maxOpacity * progress;
      }

      // Aktualizacja opacity w materiale
      cloudMesh.material.opacity = currentOpacity;
    });
  });

  if (!bounds || cloudData.length === 0) return null;

  return (
    <group>
      {cloudData.map((data, i) => (
        <mesh
          key={data.id}
          ref={(el) => (cloudsRef.current[i] = el)}
          position={[data.x, data.y, data.z]}
          rotation={[-Math.PI / 2, 0, 0]} // Płasko względem ziemi
          scale={[data.scale, data.scale, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            map={textures[data.textureIndex]} 
            transparent={true} 
            // Opacity inicjowane zerem - zostanie zaktualizowane w pierwszej klatce useFrame
            opacity={0} 
            depthWrite={false} 
          />
        </mesh>
      ))}
    </group>
  );
};

useTexture.preload('./textures/cloud04.png');

export default SystemUpperCloud;