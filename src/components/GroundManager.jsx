import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';

const GRASS_COUNT = 50000; 
const BLADE_WIDTH = 0.11;
const BLADE_HEIGHT = 0.7;
const EDGE_FADE_POWER = 2.0; 

const vertexShader = `
  varying vec2 vUv;
  varying float vNoise;
  uniform float uTime;
  uniform float uMinH;
  uniform float uMaxH;
  uniform float uSeed;

  // IDENTYCZNY HASH I NOISE CO W DYNAMIC GROUND
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21) + uSeed);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    
    // Pozycja instancji (środek podstawy trawy)
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 worldBasePos = modelMatrix * instancePos;
    
    // 1. Obliczamy wysokość pagórka w miejscu, gdzie stoi kępka
    float h = noise(worldBasePos.xz * 0.2);
    float heightOffset = mix(uMinH, uMaxH, h);
    
    // 2. Wiatr (używamy uv.y, aby tylko góra trawy falowała)
    float windNoise = noise(worldBasePos.xz * 0.3 + uTime * 0.2);
    vNoise = windNoise;
    float wave = pow(uv.y, 1.5) * windNoise;
    
    vec3 pos = position;
    pos.x += wave * 0.2;
    pos.z += wave * 0.1;
    
    // 3. KLUCZ: Dodajemy heightOffset do pozycji Y każdego vertexa trawy
    // Trawa wyrasta z punktu h
    pos.y += heightOffset;
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vNoise;
  uniform vec3 uZoneColor;
  
  void main() {
    // Trawa ciemniejsza u dołu (vUv.y = 0)
    vec3 baseColor = uZoneColor * 0.15;
    vec3 tipColor = uZoneColor * (1.1 + vNoise * 0.15);
    vec3 color = mix(baseColor, tipColor, vUv.y);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const GroundManager = ({ mapData, activePlayer, currentZoneColor, minH, maxH, seed }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const zoneBounds = useMemo(() => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const currentTile = mapData.path.find(t => String(t.id) === String(player?.currentModuleId));
    const category = currentTile?.isBoss ? "darkness" : (currentTile?.category || "start-meta");
    const zoneTiles = mapData.path.filter(t => (t.isBoss ? "darkness" : t.category) === category);

    if (zoneTiles.length === 0) return { center: [0, 0], size: [1, 1], category: 'none' };

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    zoneTiles.forEach(t => {
      minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x + (t.w || 1));
      minZ = Math.min(minZ, t.y); maxZ = Math.max(maxZ, t.y + (t.h || 1));
    });

    const buffer = 4.0; 
    return {
      center: [(minX + maxX) / 2, (minZ + maxZ) / 2],
      size: [(maxX - minX) + buffer * 2, (maxZ - minZ) + buffer * 2],
      category
    };
  }, [mapData, activePlayer?.currentModuleId]);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(BLADE_WIDTH, BLADE_HEIGHT, 1, 3);
    // Przesuwamy geometrię tak, aby Y=0 było podstawą źdźbła
    geo.translate(0, BLADE_HEIGHT / 2, 0); 
    
    const mat = new THREE.ShaderMaterial({
      uniforms: { 
        uTime: { value: 0 }, 
        uZoneColor: { value: new THREE.Color(currentZoneColor) },
        uMinH: { value: minH },
        uMaxH: { value: maxH },
        uSeed: { value: seed }
      },
      vertexShader, fragmentShader, side: THREE.DoubleSide
    });
    return { geometry: geo, material: mat };
  }, [minH, maxH, seed]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const [sizeX, sizeZ] = zoneBounds.size;
    const [centerX, centerZ] = zoneBounds.center;

    for (let i = 0; i < GRASS_COUNT; i++) {
      const x = (Math.random() - 0.5) * sizeX;
      const z = (Math.random() - 0.5) * sizeZ;
      const worldX = x + centerX;
      const worldZ = z + centerZ;

      const isUnderTile = mapData.path.some(t => 
        worldX >= t.x - 0.2 && worldX <= t.x + (t.w || 1) + 0.2 &&
        worldZ >= t.y - 0.2 && worldZ <= t.y + (t.h || 1) + 0.2
      );

      if (isUnderTile) {
        dummy.scale.set(0, 0, 0);
      } else {
        const normX = Math.abs(x) / (sizeX / 2);
        const normZ = Math.abs(z) / (sizeZ / 2);
        const falloff = Math.max(0, 1.0 - Math.pow(Math.max(normX, normZ), EDGE_FADE_POWER));

        dummy.position.set(x, 0, z); // Y musi być 0, wysokość doda shader
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.set(1, (0.7 + Math.random() * 0.5) * falloff, 1);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Ustawiamy bazę trawy na dokładnie tej samej wysokości co DynamicGround
    meshRef.current.position.set(centerX, -0.05, centerZ); 
  }, [zoneBounds.category, zoneBounds.size, mapData.path]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (currentZoneColor) {
      material.uniforms.uZoneColor.value.lerp(new THREE.Color(currentZoneColor), delta * 2);
    }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, GRASS_COUNT]} frustumCulled={false} />;
};

export default GroundManager;