import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioManager } from '../logic/audioManager';
import { gameState } from '../logic/gameState';
import { MATERIAL_PROPS } from '../config/materialsConfig_ss';

// ==========================================
// KONFIGURACJA FIZYKI I ANIMACJI
// ==========================================
const JUMP_CONFIG = {
  durationShort: 0.55,    // Czas trwania zwykłego skoku
  durationLong: 0.75,     // Czas trwania długiego skoku
  heightShort: 1.2,       // Wysokość krótkiego skoku
  heightLong: 1.5,        // Wysokość długiego skoku
  hangTimePower: 5,       // Agresywność zawieszenia (5 = mocno)
  apexMovement: 0.25,     // Minimalny ruch na szczycie (zapobiega zamrożeniu)
  landSquashDuration: 0.25, // Czas trwania mlaśnięcia o kafel
  landSquashStrength: 0.4,  // Siła spłaszczenia (0.4 = 40% niższy pionek)
};

const TILE_SURFACE_Y = 1.05; 
const PAWN_RADIUS = 0.25;   
const TOTAL_Y = TILE_SURFACE_Y + PAWN_RADIUS;

const getTerrainWave = (x, z, time) => {
  return Math.sin(time * 1.5 + (x * 0.5 + z * 0.5)) * 0.04;
};

const PlayerPawn = ({ player, mapPath, stackIndex = 0, onMovementEnd }) => {
  const meshRef = useRef();

  // --- SENSOR BEZPIECZEŃSTWA ---
  if (!player || !mapPath || mapPath.length === 0) return null;

  const getIndexById = (id) => mapPath.findIndex(t => String(t.id) === String(id));
  const targetIndex = useMemo(() => getIndexById(player.currentModuleId), [player.currentModuleId, mapPath]);
  const [visualIndex, setVisualIndex] = useState(() => getIndexById(player.currentModuleId));
  const [moving, setMoving] = useState(false);

  const hopProgress = useRef(1); 
  const landAnim = useRef(1); // Licznik animacji uderzenia (0 -> 1)
  
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const currentInternalOffset = useRef(new THREE.Vector3(0, 0, 0));
  const isLongJump = useRef(false);
  const idleSeed = useMemo(() => Math.random() * Math.PI * 2, []);

  const playerTag = `Gracz ${player?.name || player?.id || '?'}`;

  useEffect(() => {
    const tile = mapPath[visualIndex] || mapPath[0];
    if (meshRef.current && tile) {
      meshRef.current.position.set(tile.x + 0.5, TOTAL_Y, tile.y + 0.5);
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || targetIndex === -1) return;
    const time = state.clock.getElapsedTime();

    // --- 1. GŁÓWNA LOGIKA SKOKU ---
    if (hopProgress.current < 1) {
      const duration = isLongJump.current ? JUMP_CONFIG.durationLong : JUMP_CONFIG.durationShort;
      hopProgress.current += delta / duration;
      const rawProgress = Math.min(hopProgress.current, 1);
      
      const p = rawProgress;
      const power = JUMP_CONFIG.hangTimePower;
      const factor = Math.pow(2, power - 1);
      const baseEased = factor * Math.pow(p - 0.5, power) + 0.5;
      
      const alpha = JUMP_CONFIG.apexMovement;
      const easedProgress = (1.0 - alpha) * baseEased + alpha * p;
      
      const currentHeight = isLongJump.current ? JUMP_CONFIG.heightLong : JUMP_CONFIG.heightShort;
      const arc = Math.sin(easedProgress * Math.PI); 

      meshRef.current.position.x = THREE.MathUtils.lerp(startPos.current.x, endPos.current.x, easedProgress);
      meshRef.current.position.z = THREE.MathUtils.lerp(startPos.current.z, endPos.current.z, easedProgress);
      meshRef.current.position.y = TOTAL_Y + (arc * currentHeight);
      
      meshRef.current.scale.set(1 - arc * 0.1, 1 + arc * 0.2, 1 - arc * 0.1);

      if (rawProgress >= 1) {
        const diffToFinish = targetIndex - visualIndex;
        const reachedIdx = visualIndex + (diffToFinish > 0 ? 1 : -1);
        const reachedTile = mapPath[reachedIdx];
        
        // --- DIAGNOSTYKA LĄDOWANIA ---
        console.log(`[${playerTag}] 🎯 Lądowanie wykryte na polu: ${reachedTile?.id}`);
        
        landAnim.current = 0; 

        if (reachedTile) {
          // A. Efekt błysku kafelka i dźwięk ksylofonu
          window.dispatchEvent(new CustomEvent('tile-landed', { 
            detail: { tileId: reachedTile.id } 
          }));

          // B. Efekt iskier 3D
          const sparklePos = { 
            x: reachedTile.x + 0.5, 
            y: TILE_SURFACE_Y, 
            z: reachedTile.y + 0.5 
          };
          
          console.log(`[${playerTag}] 📡 Wysyłam trigger-sparkle:`, sparklePos);
          
          window.dispatchEvent(new CustomEvent('trigger-sparkle', { 
            detail: sparklePos 
          }));
        }
        
        setVisualIndex(reachedIdx);
      }
    } 
    else if (visualIndex !== targetIndex) {
      const diff = targetIndex - visualIndex;
      const nextIdx = visualIndex + (diff > 0 ? 1 : -1);
      const currentTile = mapPath[visualIndex];
      const nextTile = mapPath[nextIdx];

      if (nextTile) {
        startPos.current.copy(meshRef.current.position);
        endPos.current.set(nextTile.x + 0.5, TOTAL_Y, nextTile.y + 0.5);
        isLongJump.current = Math.abs(diff) > 1 || startPos.current.distanceTo(endPos.current) > 2;
        hopProgress.current = 0;
        setMoving(true);
      }
    } 
    else {
      if (moving) {
        const finalTile = mapPath[targetIndex];
        console.log(`[${playerTag}] 🏁 Ruch zakończony na: ${finalTile?.id}`);
        setMoving(false);
        
        // --- WYZWALANIE SHADERA RIPPLE PO ZAKOŃCZENIU RUCHU ---
        if (finalTile) {
          window.dispatchEvent(new CustomEvent('tile-movement-ended', { 
            detail: { tileId: finalTile.id } 
          }));
        }

        if (onMovementEnd) onMovementEnd(player, finalTile);
      }
      
      const tile = mapPath[targetIndex];
      if (tile) {
        const pawnsOnSameTile = gameState.players.filter(p => p.currentModuleId === player.currentModuleId).length;
        const targetOffX = pawnsOnSameTile > 1 ? [ -0.22, 0.22, 0.22, -0.22 ][stackIndex % 4] : 0;
        const targetOffZ = pawnsOnSameTile > 1 ? [ -0.22, 0.22, -0.22, 0.22 ][stackIndex % 4] : 0;

        currentInternalOffset.current.x = THREE.MathUtils.lerp(currentInternalOffset.current.x, targetOffX, 0.1);
        currentInternalOffset.current.z = THREE.MathUtils.lerp(currentInternalOffset.current.z, targetOffZ, 0.1);

        const currentWave = getTerrainWave(tile.x + 0.5, tile.y + 0.5, time);
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, tile.x + 0.5 + currentInternalOffset.current.x, 0.1);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, tile.y + 0.5 + currentInternalOffset.current.z, 0.1);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, TOTAL_Y + currentWave, 0.2);

        if (landAnim.current >= 1) {
          const pulse = Math.sin(time * 2.5 + idleSeed) * 0.03;
          meshRef.current.scale.lerp(new THREE.Vector3(1 - pulse, 1 + pulse, 1 - pulse), 0.1);
        }
      }
    }

    if (landAnim.current < 1) {
      landAnim.current += delta / JUMP_CONFIG.landSquashDuration;
      const lp = Math.min(landAnim.current, 1);
      const squash = Math.sin(lp * Math.PI) * JUMP_CONFIG.landSquashStrength;
      
      meshRef.current.scale.set(
        1 + squash * 0.5, 
        1 - squash, 
        1 + squash * 0.5
      );
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[PAWN_RADIUS, 32, 32]} />
        <meshPhongMaterial color={player?.color || '#ffffff'} {...MATERIAL_PROPS.pawn} />
      </mesh>
    </group>
  );
};

export default PlayerPawn;