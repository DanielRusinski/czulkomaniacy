import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==========================================
// PARAMETRY STERUJĄCE (KONFIGURACJA)
// ==========================================
const CONFIG = {
  particleCount: 5,           // Liczba cząsteczek na wybuch
  spread: 0.7,                // Rozrzut poziomy
  startY: 0.05,               // Start nad kafelkiem
  speedMin: 0.02,             // Prędkość w górę (min)
  speedMax: 0.06,             // Prędkość w górę (max)
  decayMin: 0.01,             // Szybkość znikania (min)
  decayMax: 0.04,             // Szybkość znikania (max)
  
  // ROZMIAR
  baseSize: 0.04,             // Stały rozmiar punktu
  
  particleColor: '#ffffff',
  maxOpacity: 1.0,           // Szczytowa jasność błysku
};

// Pomocniczy obiekt do obliczeń macierzy
const tempObject = new THREE.Object3D();

const SparkleBurst = ({ onComplete }) => {
  const meshRef = useRef();
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      data.push({
        x: (Math.random() - 0.5) * CONFIG.spread,
        z: (Math.random() - 0.5) * CONFIG.spread,
        y: CONFIG.startY,
        speedY: Math.random() * (CONFIG.speedMax - CONFIG.speedMin) + CONFIG.speedMin,
        life: 1.0,
        decay: Math.random() * (CONFIG.decayMax - CONFIG.decayMin) + CONFIG.decayMin,
        size: CONFIG.baseSize * (0.8 + Math.random() * 0.4),
      });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    let anyAlive = false;
    let totalLife = 0;

    particles.forEach((p, i) => {
      if (p.life > 0) {
        anyAlive = true;
        totalLife += p.life;

        // 1. Fizyka
        p.y += p.speedY;
        p.life -= p.decay;

        // 2. Transformacja (Stały rozmiar)
        tempObject.position.set(p.x, p.y, p.z);
        tempObject.scale.set(p.size, p.size, p.size);
        tempObject.quaternion.copy(state.camera.quaternion);
        
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      } else {
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
    });

    // 3. Animacja Opacity (0 -> 1 -> 0)
    const avgLife = totalLife / CONFIG.particleCount;
    const progress = 1.0 - avgLife;
    const flashEnvelope = Math.sin(progress * Math.PI);
    
    meshRef.current.material.opacity = Math.max(1, flashEnvelope * CONFIG.maxOpacity);
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (!anyAlive) onComplete();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, CONFIG.particleCount]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={CONFIG.particleColor}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

const SparkleEffect = ({ tileId }) => {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    const handleLanding = (e) => {
      if (String(e.detail.tileId) === String(tileId)) {
        setBursts(prev => [...prev, { id: Math.random() }]);
      }
    };
    window.addEventListener('tile-landed', handleLanding);
    return () => window.removeEventListener('tile-landed', handleLanding);
  }, [tileId]);

  return (
    <>
      {bursts.map(b => (
        <SparkleBurst 
          key={b.id} 
          onComplete={() => setBursts(prev => prev.filter(item => item.id !== b.id))} 
        />
      ))}
    </>
  );
};

export default SparkleEffect;