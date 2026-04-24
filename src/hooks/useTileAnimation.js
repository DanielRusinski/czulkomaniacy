import { useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hook zarządzający fizyką "uderzenia" i wizualnym rozbłyskiem kafelka.
 * @param {Object} meshRef - Referencja do grupy/mesha kafelka.
 * @param {Object} clonedScene - Sklonowana scena GLTF (do zmiany emissive).
 */
export const useTileAnimation = (meshRef, clonedScene) => {
  const [impact, setImpact] = useState(0);

  // Funkcja, którą wywołamy, gdy będziemy chcieli "uderzyć" w kafel
  const triggerImpact = useCallback(() => {
    setImpact(1.0);
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 1. Logika zanikania (Linear decay)
    // Wartość 3.5 oznacza, że animacja trwa ok. 280ms
    if (impact > 0) {
      const nextValue = Math.max(0, impact - delta * 3.5);
      setImpact(nextValue);
    }

    // 2. Obliczanie przesunięcia Y (Obniżenie)
    // impact * -0.15 oznacza maksymalne zapadnięcie o 0.15 jednostki
    const impactOffset = impact * -0.15;

    // 3. Aplikacja koloru (Emissive / Glow)
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh && child.material) {
          // Ustawiamy biały blask, którego siła zależy od stanu impact
          if (impact > 0) {
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = impact * 1.0;
          } else if (child.material.emissiveIntensity !== 0) {
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }

    // Zwracamy offset, aby Tile3D mógł go dodać do swojego falowania (wave)
    meshRef.current.impactOffset = impactOffset;
  });

  return { triggerImpact, impactOffset: impact * -0.15 };
};