import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';

// --- FUNKCJA HASHUJĄCA (Do deterministycznego losowania) ---
const hash = (x, z, s) => {
  const p = x * 12.34 + z * 45.32 + s;
  const v = Math.sin(p) * 43758.5453;
  return v - Math.floor(v);
};

// --- GENERATOR TEKSTURY POŚWIATY ---
const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
};

// --- SHADER DLA PROMIENIA (BEAM) ---
const BeamMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('white') },
    uOpacity: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float fade = pow(1.0 - vUv.y, 2.0);
      float pulse = 0.7 + (sin(uTime * 1.6) * 0.5 + 0.5) * 0.3;
      float alpha = fade * uOpacity * pulse;
      gl_FragColor = vec4(uColor, alpha * 0.6);
    }
  `
};

const PathOrbs = ({ mapData, activePlayer, zoneColor, minOrbs = 2, maxOrbs = 6, baseHeight = 0.9 }) => {
  const groupRef = useRef();
  const glowTexture = useMemo(() => createGlowTexture(), []);
  
  // Wspólny stały seed do spójnego losowania układu orbów
  const ORB_SEED = 99.99; 

  // --- GEOMETRIE Z IDEALNYM CENTROWANIEM ---
  const sphereGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.15, 12, 12); 
    geo.translate(0, 0.3, 0); // Środek na Y = 0.3
    return geo;
  }, []);

  const beamGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.01, 0.066, 4, 8, 1, true);
    // Podniesienie o 2.3 sprawia, że podstawa cylindra jest równo na Y = 0.3, 
    // czyli dokładnie pokrywa się ze środkiem kuli zdefiniowanym wyżej.
    geo.translate(0, 2.3, 0); 
    return geo;
  }, []);

  // Logika filtrowania i losowania kafelków
  const pathTiles = useMemo(() => {
    const player = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
    const currentTile = mapData.path.find(t => String(t.id) === String(player?.currentModuleId));
    const category = currentTile?.isBoss ? "darkness" : (currentTile?.category || "start-meta");
    
    // 1. FILTROWANIE (Odrzucamy kafelki specjalne)
    const availableTiles = mapData.path.filter(t => {
      const tCategory = t.isBoss ? "darkness" : t.category;
      if (tCategory !== category) return false;
      
      if (t.isBoss) return false;
      if (t.isStartMeta) return false;
      if (t.isZoneEnd) return false;
      if (t.isChance || t.isPortal || t.type === 'special') return false; 
      
      return true;
    });

    if (availableTiles.length === 0) return [];

    // 2. OBLICZANIE ILOŚCI
    const zoneHash = Math.abs(hash(availableTiles.length, category.length, ORB_SEED));
    const targetCount = Math.floor(zoneHash * (maxOrbs - minOrbs + 1)) + minOrbs;
    
    // 3. LOSOWANIE MIEJSC
    const shuffledTiles = availableTiles.map(t => ({
      ...t,
      pseudoRandom: Math.abs(hash(t.x, t.y, ORB_SEED))
    })).sort((a, b) => a.pseudoRandom - b.pseudoRandom);

    const selectedTiles = shuffledTiles.slice(0, targetCount);

    return selectedTiles.map((t, index) => ({
      id: t.id,
      x: t.x + 0.5, 
      z: t.y + 0.5,
      gridX: t.x, 
      gridZ: t.y,
      delay: index * 0.15,
      baseScale: 1.0
    }));
  }, [mapData, activePlayer?.currentModuleId, minOrbs, maxOrbs]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    groupRef.current.children.forEach((child, i) => {
      const data = pathTiles[i];
      if (!data) return;

      const canShow = time > data.delay;
      const targetScale = canShow ? data.baseScale : 0;
      child.scale.setScalar(THREE.MathUtils.lerp(child.scale.y, targetScale, delta * 4));

      // Synchronizacja Y z falami kafelka (identyczna do Tile3D)
      const tileWaveOffset = Math.sin(time * 1.5 + (data.gridX * 0.5 + data.gridZ * 0.5)) * 0.04;
      child.position.y = tileWaveOffset + baseHeight;

      // Aktualizacja Beam
      const beam = child.children[2];
      if (beam) {
        beam.material.uniforms.uTime.value = time;
        beam.material.uniforms.uOpacity.value = child.scale.y;
      }

      // Aktualizacja Glow
      const glow = child.children[1];
      if (glow) {
        glow.material.opacity = (0.5 + Math.sin(time * 4 + i) * 0.2) * child.scale.y;
      }

      child.visible = child.scale.y > 0.01;
    });
  });

  if (pathTiles.length === 0) return null;

  return (
    <group ref={groupRef}>
      {pathTiles.map((item) => (
        <group key={`path_orb_${item.id}`} position={[item.x, baseHeight, item.z]} scale={0}>
           {/* 0. KULA (Srodek przesunięty na Y=0.3 geometrii) */}
           <mesh geometry={sphereGeo}>
             <meshStandardMaterial color={zoneColor} emissive={zoneColor} emissiveIntensity={4} toneMapped={false} />
           </mesh>
           
           {/* 1. POŚWIATA (Środek wymuszony na Y=0.3, idealnie otula kulę i początek promienia) */}
           <sprite position={[0, 0.3, 0]} scale={2.2} renderOrder={999}>
             <spriteMaterial map={glowTexture} color={zoneColor} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
           </sprite>

           {/* 2. PROMIEŃ (Dzięki translate(0, 2.3, 0) dół cylindra zaczyna się idealnie na Y=0.3) */}
           <mesh geometry={beamGeo} renderOrder={998}>
             <shaderMaterial 
                args={[BeamMaterial]} 
                uniforms-uColor-value={new THREE.Color(zoneColor)}
                transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
             />
           </mesh>
        </group>
      ))}
    </group>
  );
};

export default PathOrbs;