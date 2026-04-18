import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';
import { getZoneConfig } from '../config/environmentConfig';

/**
 * GameLights - Zastępuje tradycyjne światła i cienie oświetleniem opartym na mapach EXR (IBL).
 * Każda strefa posiada dedykowaną mapę .exr zdefiniowaną w environmentConfig.
 */
const GameLights = ({ activePlayerId, mapPath, config }) => {
  const { scene } = useThree();

  // Wyznaczamy aktualną strefę podczas renderowania, aby React mógł zaktualizować <Environment>
  const player = gameState.players?.find(p => p.id === activePlayerId) || gameState.players?.[0];
  const tile = mapPath?.find(t => String(t.id) === String(player?.currentModuleId)) || mapPath?.[0];
  const currentCategory = tile?.isBoss ? "darkness" : (tile?.category || "start-meta");
  const zoneConfig = getZoneConfig(currentCategory);

  useFrame((state, delta) => {
    if (!mapPath || mapPath.length === 0) return;

    // Płynna zmiana intensywności oświetlenia otoczenia
    if (scene.environment) {
      // Pobieramy intensywność dla EXR (z fallbackiem do starej nazwy hdrIntensity)
      const targetIntensity = zoneConfig?.light?.exrIntensity ?? zoneConfig?.light?.hdrIntensity ?? 1.0;
      scene.environmentIntensity = THREE.MathUtils.lerp(
        scene.environmentIntensity || 1, 
        targetIntensity, 
        delta * 2
      );
    }
  });

  // Pobieramy ścieżkę do pliku EXR. 
  // <Environment> z @react-three/drei automatycznie używa THREE.EXRLoader 
  // w momencie, gdy wykryje rozszerzenie .exr.
  // Priorytet: props config -> konfiguracja strefy (exr) -> konfiguracja strefy (hdr fallback) -> nazwa kategorii.
  const exrPath = config?.exrPath || zoneConfig?.exrPath || config?.hdrPath || zoneConfig?.hdrPath || `/exr/${currentCategory}.exr`;

  return (
    <Environment 
      files={exrPath} 
      background={false} 
      blur={0.5} 
    />
  );
};

export default GameLights;