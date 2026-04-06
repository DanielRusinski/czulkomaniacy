import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import { Vector3 } from 'three';

export const CameraEffects = ({ activePlayerId, mapPath, gridSize }) => {
  // Przechowujemy wektor celu dla obiektywu oraz wektor pomocniczy dla optymalizacji GC
  const targetVec = useMemo(() => new Vector3(), []);
  const tempVec = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!mapPath || activePlayerId === undefined || activePlayerId === null) return;

    const tile = mapPath.find(t => t.id === activePlayerId);
    
    if (tile) {
      const cx = (tile.x + tile.w / 2) - gridSize / 2;
      const cz = (tile.y + tile.h / 2) - gridSize / 2;
      
      // Ustawiamy docelową pozycję kafelka
      tempVec.set(cx, 0, cz);
      
      // Płynne śledzenie punktu ostrości obiektywu
      targetVec.lerp(tempVec, 0.);
    }
  });
};