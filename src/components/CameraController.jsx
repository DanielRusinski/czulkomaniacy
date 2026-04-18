import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CameraController - Zarządza zachowaniem kamery w zależności od trybu.
 * Tryby: 0 (Default), 1 (Zoom Out), 2 (Zone View), 3 (Cinematic Orbit).
 */
const CameraController = ({ activePlayer, mapPath, gridSize, isBossActive }) => {
  const controlsRef = useRef();
  
  // Referencje do śledzenia zmian trybu bez wywoływania zbędnych re-renderów
  const modeStartTimeRef = useRef(0);
  const lastModeRef = useRef(0);

  const targetLookAt = useMemo(() => new THREE.Vector3(), []);
  const currentOffset = useMemo(() => new THREE.Vector3(12, 12, 12), []);
  
  const [cameraMode, setCameraMode] = useState(0);

  // Obsługa klawiszy 1, 2, 3
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '1') setCameraMode(prev => (prev === 1 ? 0 : 1));
      if (e.key === '2') setCameraMode(prev => (prev === 2 ? 0 : 2));
      if (e.key === '3') setCameraMode(prev => (prev === 3 ? 0 : 3));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const zoomOutOffset = useMemo(() => new THREE.Vector3(18, 22, 18), []);
  const defaultOffset = useMemo(() => new THREE.Vector3(8, 10, 8), []);

  useFrame((state) => {
    if (!controlsRef.current) return;

    // Resetowanie czasu animacji przy zmianie trybu
    if (lastModeRef.current !== cameraMode) {
      modeStartTimeRef.current = state.clock.getElapsedTime();
      lastModeRef.current = cameraMode;
    }

    const elapsedTime = state.clock.getElapsedTime() - modeStartTimeRef.current;

    const currentTile = mapPath.find(t => String(t.id) === String(activePlayer?.currentModuleId));
    if (!currentTile) return;

    const currentCategory = currentTile.isBoss ? "darkness" : (currentTile.category || "start-meta");
    const zoneTiles = mapPath.filter(t => (t.isBoss ? "darkness" : t.category) === currentCategory);

    // --- LOGIKA OBLICZANIA CELU (TARGET) ---
    if (cameraMode === 0 || cameraMode === 1) {
      const tx = (currentTile.x + 0.5) - (gridSize / 2);
      const tz = (currentTile.y + 0.5) - (gridSize / 2);
      targetLookAt.lerp(new THREE.Vector3(tx, 0, tz), 0.15);
      
      const desiredOffset = cameraMode === 1 ? zoomOutOffset : defaultOffset;
      currentOffset.lerp(desiredOffset, 0.05);
    } 
    else if (cameraMode === 2 || cameraMode === 3) {
      if (zoneTiles.length > 0) {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        zoneTiles.forEach(t => {
          minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
          minZ = Math.min(minZ, t.y); maxZ = Math.max(maxZ, t.y);
        });

        const centerX = ((minX + maxX) / 2 + 0.5) - (gridSize / 2);
        const centerZ = ((minZ + maxZ) / 2 + 0.5) - (gridSize / 2);
        targetLookAt.lerp(new THREE.Vector3(centerX, 0, centerZ), 0.05);

        const widthX = maxX - minX;
        const depthZ = maxZ - minZ;
        const longestSide = Math.max(widthX, depthZ);

        if (cameraMode === 2) {
          const distance = longestSide * 1.5;
          const height = longestSide * 1.0;
          const desiredOffset = widthX >= depthZ 
            ? new THREE.Vector3(0, height, distance) 
            : new THREE.Vector3(distance, height, 0);
          currentOffset.lerp(desiredOffset, 0.05);
        } 
        else if (cameraMode === 3) {
          // Kinematyczna orbita z resetowanym czasem trwania
          const orbitSpeed = 0.1;
          const zoomSpeed = 0.4;
          
          const baseRadius = longestSide * 1.5;
          const dynamicRadius = baseRadius + (elapsedTime * zoomSpeed);
          const height = longestSide * 1.2;

          const ox = Math.sin(elapsedTime * orbitSpeed) * dynamicRadius;
          const oz = Math.cos(elapsedTime * orbitSpeed) * dynamicRadius;
          
          const desiredOrbitOffset = new THREE.Vector3(ox, height, oz);
          // Używamy lerp dla płynnego wejścia w orbitę z poprzedniej pozycji
          currentOffset.lerp(desiredOrbitOffset, 0.05);
        }
      }
    }

    // Aktualizacja macierzy kamery i kontrolera
    controlsRef.current.target.copy(targetLookAt);
    const idealPosition = targetLookAt.clone().add(currentOffset);
    
    if (isBossActive) {
      const shakeTime = state.clock.getElapsedTime();
      const shake = 0.08;
      idealPosition.x += Math.sin(shakeTime * 38) * shake;
      idealPosition.z += Math.cos(shakeTime * 38) * shake;
    }

    // Płynne przemieszczenie samej kamery do obliczonej pozycji idealnej
    state.camera.position.lerp(idealPosition, 0.1);
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={150}
      maxPolarAngle={Math.PI / 2.3} 
      minPolarAngle={Math.PI / 6} 
    />
  );
};

export default CameraController;