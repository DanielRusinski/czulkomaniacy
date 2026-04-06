import { useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';
import { ENVIRONMENT_CONFIG, getZoneConfig } from '../config/environmentConfig'; // Import konfiguracji

/**
 * GlobalFog - Zsynchronizowany manager mgły.
 * Pobiera parametry (kolor, dystans) z ENVIRONMENT_CONFIG i płynnie je animuje.
 */
const GlobalFog = ({ mapPath }) => {
  const { scene } = useThree();

  // 1. Inicjalizacja mgły na scenie
  useLayoutEffect(() => {
    if (!scene.fog) {
      // Pobieramy domyślne wartości startowe
      const defaultConfig = ENVIRONMENT_CONFIG.zones.default.fog;
      scene.fog = new THREE.Fog(
        defaultConfig.color, 
        defaultConfig.near, 
        defaultConfig.far
      );
    }
    return () => { scene.fog = null; };
  }, [scene]);

  // 2. Dynamiczna aktualizacja i synchronizacja w każdej klatce
  useFrame((state, delta) => {
    if (!scene.fog || !mapPath || mapPath.length === 0) return;

    // Pobranie aktualnej strefy gracza
    const player = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
    const currentTile = mapPath.find(t => String(t.id) === String(player?.currentModuleId));

    if (currentTile) {
      // Określenie klucza strefy (np. 'meadow', 'forest', 'darkness')
      const zoneKey = currentTile.isBoss ? "darkness" : (currentTile.category || "default");
      
      // Pobranie dynamicznej konfiguracji dla danej strefy
      const cfg = getZoneConfig(zoneKey);
      const targetFog = cfg.fog;

      // PŁYNNA SYNCHRONIZACJA KOLORU
      // Lerpujemy kolor w stronę wartości zdefiniowanej w panelu Leva / pliku JSON
      scene.fog.color.lerp(new THREE.Color(targetFog.color), delta * 1.5);

      // PŁYNNA SYNCHRONIZACJA DYSTANSU (Near / Far)
      // Dodajemy mały efekt pulsowania do wartości bazowych z konfiguracji
      const time = state.clock.getElapsedTime();
      const pulse = Math.sin(time * 0.4);

      // Interpolacja wartości near/far w stronę celów z environmentConfig
      scene.fog.near = THREE.MathUtils.lerp(
        scene.fog.near, 
        targetFog.near + pulse * 1.0, 
        delta * 2.0
      );
      
      scene.fog.far = THREE.MathUtils.lerp(
        scene.fog.far, 
        targetFog.far + pulse * 1.5, 
        delta * 2.0
      );
    }
  });

  return null;
};

export default GlobalFog;