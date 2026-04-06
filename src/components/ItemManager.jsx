import React, { useMemo } from 'react';
import { useGLTF, Float, Clone } from '@react-three/drei';
import * as THREE from 'three';

const CollectibleItem = ({ position, modelPath, scale }) => {
  const { scene } = useGLTF(modelPath);
  return (
    <Float 
      position={position} 
      speed={2.5} 
      rotationIntensity={1.5} 
      floatIntensity={1.5} 
      floatingRange={[0.2, 0.6]}
    >
      <Clone object={scene} scale={scale} castShadow />
    </Float>
  );
};

useGLTF.preload('/models/apple_piece.gltf');

const ItemManager = ({ mapData, visibleTiles }) => {
  // 1. Generujemy przedmioty stałe (co 10 pole)
  const activeItems = useMemo(() => {
    if (!mapData?.path) return [];
    
    const items = [];
    
    mapData.path.forEach((tile, index) => {
      // Co 10 pole, omijamy pole startowe (index 0) i pola bossów
      if (index > 0 && index % 10 === 0 && !tile.isBoss && tile.category !== 'start-meta') {
        items.push({
          id: `item-${tile.id}`,
          tileId: tile.id,
          x: tile.x + (tile.w || 1) / 2,
          z: tile.y + (tile.h || 1) / 2,
          modelPath: '/models/apple_piece.gltf'
        });
      }
    });
    
    return items;
  }, [mapData.path]);

  // 2. Ograniczamy renderowanie tylko do tych przedmiotów, które są w widocznej strefie
  const visibleItems = useMemo(() => {
    if (!visibleTiles) return activeItems; // Fallback
    const visibleTileIds = new Set(visibleTiles.map(t => String(t.id)));
    return activeItems.filter(item => visibleTileIds.has(String(item.tileId)));
  }, [activeItems, visibleTiles]);

  return (
    <group name="item-manager">
      {visibleItems.map((item) => (
        <CollectibleItem 
          key={item.id} 
          position={[item.x, 0.8, item.z]} // Podniesiono wysokość startową (0.8 - poziom pionka)
          modelPath={item.modelPath} 
          scale={1.5} // ZWIEKSZ TEN PARAMETR (np. do 10 lub 50) jeśli model jest nadal mikroskopijny
        />
      ))}
    </group>
  );
};

export default ItemManager;