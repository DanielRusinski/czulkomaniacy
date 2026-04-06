import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getZoneConfig } from '../config/environmentConfig';

const SceneEnvironment = ({ activePlayerId, mapPath }) => {
  const { scene } = useThree();
  
  // Pobranie początkowej konfiguracji ("start-meta" jako domyślna)
  const defaultConfig = getZoneConfig("start-meta");
  const targetFog = useRef(new THREE.Color(defaultConfig.fog.color));
  const targetFogDist = useRef([defaultConfig.fog.near, defaultConfig.fog.far]);

  // Wyłączamy tło z Three.js, aby gradienty CSS z Board3D były widoczne
  useEffect(() => {
    scene.background = null;
  }, [scene]);

  useMemo(() => {
    const tile = mapPath?.find(t => String(t.id) === String(activePlayerId));
    const category = tile?.isBoss ? "darkness" : (tile?.category || "start-meta");
    const zoneConfig = getZoneConfig(category);
      
    targetFog.current.set(zoneConfig.fog.color);
    targetFogDist.current = [zoneConfig.fog.near, zoneConfig.fog.far];
  }, [activePlayerId, mapPath]);

  useFrame(() => {
    // Płynne przejście tylko dla mgły (kolor + dystans)
    if (scene.fog) {
      scene.fog.color.lerp(targetFog.current, 0.04);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, targetFogDist.current[0], 0.04);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, targetFogDist.current[1], 0.04);
    }
    
    // USUNIĘTO: scene.traverse(), które psuło oświetlenie
  });

  return null;
};

export default SceneEnvironment;