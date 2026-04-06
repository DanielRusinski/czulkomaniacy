import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';
import { getZoneConfig, ENVIRONMENT_CONFIG } from '../config/environmentConfig';

const GameLights = ({ activePlayerId, mapPath }) => {
  const ambientRef = useRef();
  const hemiRef = useRef();
  const dirRef = useRef();
  const pointRef = useRef();
  const shadowSpotRef = useRef();
  const shadowTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    // 1. Podstawowe dane mapy muszą być, ale gracza możemy "udawać" na starcie
    if (!mapPath || mapPath.length === 0) return;

    const player = gameState.players?.find(p => p.id === activePlayerId) || gameState.players?.[0];
    
    // Znajdź kafel gracza, a jeśli go nie ma - weź pierwszy kafel z mapy (Fallback)
    const tile = mapPath.find(t => String(t.id) === String(player?.currentModuleId)) || mapPath[0];
    
    // Ustal kategorię (jeśli brak kafla, dajemy domyślną strefę startową)
    const category = tile?.isBoss ? "darkness" : (tile?.category || "start-meta");
    const { light: cfg } = getZoneConfig(category);
    const shadowCfg = ENVIRONMENT_CONFIG.global.shadows;
    const lerpSpeed = 3.0; // Szybsze lerpowanie dla lepszej responsywności

    // --- HEMISPHERE LIGHT (Niebo i Ziemia) ---
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, cfg.hemisphere.intensity, delta * lerpSpeed);
      hemiRef.current.color.lerp(new THREE.Color(cfg.hemisphere.skyColor), delta * lerpSpeed);
      hemiRef.current.groundColor.lerp(new THREE.Color(cfg.hemisphere.groundColor), delta * lerpSpeed);
    }

    // --- AMBIENT & DIRECTIONAL ---
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, cfg.ambient.intensity, delta * lerpSpeed);
      ambientRef.current.color.lerp(new THREE.Color(cfg.ambient.color), delta * lerpSpeed);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, cfg.directional.intensity, delta * lerpSpeed);
    }

    // --- SHADOW SPOTLIGHT (Logika pozycjonowania) ---
    if (shadowSpotRef.current && tile) {
      const zoneTiles = mapPath.filter(t => (t.isBoss ? "darkness" : t.category) === category);
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      zoneTiles.forEach(t => {
        minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
        minZ = Math.min(minZ, t.y); maxZ = Math.max(maxZ, t.y);
      });

      // Uaktualnienie parametrów fizycznych Spotlighta z configu
      shadowSpotRef.current.intensity = shadowCfg.intensity;
      shadowSpotRef.current.position.set(minX - 5, shadowCfg.height, minZ - 5);
      shadowTarget.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      shadowSpotRef.current.target = shadowTarget;
      shadowTarget.updateMatrixWorld();
    }

    // --- POINT LIGHT (Światło pod pionkiem) ---
    if (pointRef.current && tile) {
      pointRef.current.intensity = THREE.MathUtils.lerp(pointRef.current.intensity, cfg.point.intensity, delta * lerpSpeed);
      pointRef.current.position.set(
        THREE.MathUtils.lerp(pointRef.current.position.x, tile.x + 0.5, delta * 3),
        3, 
        THREE.MathUtils.lerp(pointRef.current.position.z, tile.y + 0.5, delta * 3)
      );
    }
  });

  // Skrót do globalnych ustawień cieni
  const sCfg = ENVIRONMENT_CONFIG.global.shadows;

  return (
    <>
      <ambientLight ref={ambientRef} />
      
      {/* HemisphereLight z domyślnymi kolorami na start */}
      <hemisphereLight ref={hemiRef} args={[0xffffff, 0xffffff, 1]} />
      
      <directionalLight ref={dirRef} position={[15, 30, 15]} castShadow={false} />
      
      {/* Target dla Spotlighta */}
      <primitive object={shadowTarget} />
      
      <spotLight
        ref={shadowSpotRef}
        // UAKTUALNIONO: Dynamiczny włącznik cieni rzucanych przez to światło
        castShadow={sCfg.enabled} 
        shadow-mapSize={sCfg.mapSize}
        shadow-camera-near={1}
        shadow-camera-far={400}
        // UAKTUALNIONO: Parametry bias połączone z configiem dla precyzji
        shadow-bias={sCfg.bias}
        shadow-normalBias={sCfg.normalBias}
      />

      <pointLight ref={pointRef} distance={12} decay={2} />
    </>
  );
};

export default GameLights;