import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../../logic/gameState';

// --- SHADER DLA GWIEZDNEGO PYŁU ---
const StarDustMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffdd00') },
    uSpeed: { value: 1.5 },
    uHeight: { value: 15.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vInstanceId;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uHeight;
    
    float random(float seed) {
      return fract(sin(seed * 12.9898) * 43758.5453);
    }

    void main() {
      vUv = uv;
      vInstanceId = float(gl_InstanceID);
      
      vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      
      float randomY = random(vInstanceId); 
      float timeProgress = (uTime * uSpeed) / uHeight;
      float currentY = fract(randomY - timeProgress); 
      
      instancePos.y = currentY * uHeight;
      
      float randomDrift = random(vInstanceId + 100.0) * 6.28; 
      instancePos.x += sin(uTime * 1.0 + randomDrift) * 0.15;
      instancePos.z += cos(uTime * 0.8 + randomDrift) * 0.15;
      
      gl_Position = projectionMatrix * modelViewMatrix * instancePos;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vInstanceId;
    uniform vec3 uColor;
    uniform float uTime;
    
    float random(float seed) {
      return fract(sin(seed * 12.9898) * 43758.5453);
    }

    void main() {
      float dist = distance(vUv, vec2(0.5, 0.5));
      if (dist > 0.5) discard; 
      
      float baseAlpha = smoothstep(0.5, 0.1, dist);
      float flickerSpeed = 2.0 + random(vInstanceId) * 3.0; 
      float flicker = 0.4 + (sin(uTime * flickerSpeed + random(vInstanceId) * 6.28) * 0.5 + 0.5) * 0.6;
      
      gl_FragColor = vec4(uColor, baseAlpha * flicker * 0.8);
    }
  `
};

const StarDustField = ({ mapData, activePlayer }) => {
  const meshRef = useRef();
  const materialRef = useRef();

  // Geometria zorientowana poziomo
  const particleGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.12, 0.12); 
    geo.rotateX(-Math.PI / 2); 
    return geo;
  }, []);

  // Generowanie stałych pozycji (X i Z) dla cząsteczek
  const { count, matrices } = useMemo(() => {
    const player = gameState.players.find(p => p.id === activePlayer?.id) || gameState.players[0];
    const currentTile = mapData.path.find(t => String(t.id) === String(player?.currentModuleId));
    
    if (!currentTile?.isBoss) return { count: 0, matrices: [] };

    const zoneTiles = mapData.path.filter(t => t.isBoss);
    if (zoneTiles.length === 0) return { count: 0, matrices: [] };

    let baseX = Infinity, baseZ = Infinity;
    zoneTiles.forEach(t => { 
      baseX = Math.min(baseX, t.x); 
      baseZ = Math.min(baseZ, t.y); 
    });
    
    const startX = baseX - 1, startZ = baseZ - 1;
    const instanceCount = 4000; 
    const matArray = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < instanceCount; i++) {
      const rx = startX + Math.random() * 8;
      const rz = startZ + Math.random() * 11;
      
      dummy.position.set(rx, 0, rz);
      dummy.scale.setScalar(0.4 + Math.random() * 0.8);
      dummy.updateMatrix();
      matArray.push(dummy.matrix.clone());
    }

    return { count: instanceCount, matrices: matArray };
  }, [mapData, activePlayer?.id]);

  // Jednorazowe przypisanie macierzy po wygenerowaniu danych
  useLayoutEffect(() => {
    if (meshRef.current && matrices.length > 0) {
      matrices.forEach((mat, i) => meshRef.current.setMatrixAt(i, mat));
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Aktualizacja czasu w shaderze
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[particleGeo, null, count]} 
      castShadow={false} 
      receiveShadow={false}
      frustumCulled={true}
    >
      <shaderMaterial
        ref={materialRef}
        side={THREE.DoubleSide}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={useMemo(() => ({
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#ffdd00') },
          uSpeed: { value: 1.5 },
          uHeight: { value: 15.0 },
        }), [])}
        vertexShader={StarDustMaterial.vertexShader}
        fragmentShader={StarDustMaterial.fragmentShader}
      />
    </instancedMesh>
  );
};

export default StarDustField;