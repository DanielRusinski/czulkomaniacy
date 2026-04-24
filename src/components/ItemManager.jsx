import React, { useMemo, useRef } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoarderGelGlitterMaterial } from '../shaders/Boarder_GelGlitterMaterial';

const tempObject = new THREE.Object3D();

const ItemManager = ({ mapData, visibleTiles }) => {
  const { nodes } = useGLTF('/models/Items_star001.glb');
  const meshRef = useRef();

  // Pobieramy domyślną mapę otoczenia dla odbić (opcjonalnie możesz podać ścieżkę do własnej)
  const envMap = useEnvironment({ preset: 'city' });

  // 1. Wyciągamy geometrię z modelu
  const geometry = useMemo(() => {
    const mesh = Object.values(nodes).find(node => node.isMesh);
    return mesh ? mesh.geometry : null;
  }, [nodes]);

  // 2. Filtrowanie i przygotowanie pozycji gwiazdek
  const items = useMemo(() => {
    if (!mapData?.path || !visibleTiles) return [];
    
    const visibleTileIds = new Set(visibleTiles.map(t => String(t.id)));
    
    return mapData.path
      .filter((tile, index) => 
        index > 0 && 
        index % 10 === 0 && 
        !tile.isBoss && 
        tile.category !== 'start-meta' &&
        visibleTileIds.has(String(tile.id))
      )
      .map(tile => ({
        id: tile.id,
        x: tile.x + (tile.w || 1) / 2,
        z: tile.y + (tile.h || 1) / 2,
      }));
  }, [mapData.path, visibleTiles]);

  // 3. Animacja instancji
  useFrame((state) => {
    if (!meshRef.current) return;

    items.forEach((item, i) => {
      const t = state.clock.elapsedTime * 1.1;
      const yOffset = 1.2 + Math.sin(t + i) * 0.2;
      
      tempObject.position.set(item.x, yOffset, item.z);
      tempObject.rotation.y = t * 0.5;
      tempObject.scale.setScalar(0.7);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, null, items.length]} 
      castShadow
    >
      <BoarderGelGlitterMaterial 
        uEnv={envMap}
        uColorTop="#ffffff"
        uColorMid="#e65400"
        uColorBot="#00ffaa"
        uGradientStretch={20.0}
        uGlitterDensity={50.0}
        uGlitterSize={0.2}
        uRefractionRatio={1.6}
        uGlassThickness={0.6}
        uEnvReflection={0.5}
      />
    </instancedMesh>
  );
};

export default ItemManager;