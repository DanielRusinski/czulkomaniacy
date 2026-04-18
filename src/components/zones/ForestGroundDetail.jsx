import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA ELEMENTÓW ---
const SMALL_MODELS_CONFIG = [
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.80, 
    scale: 0.55, 
    instancesNo: 40 
  },
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.80, 
    scale: 0.77, 
    instancesNo: 15 
  }
];

const SHADER_CONFIG = {
  grassCount: 50000, 
  bladeWidth: 0.06,  // Nieco szerszy, aby lepiej wyeksponować kształt liścia
  bladeHeight: 0.4,  
  basePlane: 0.4, 
};

// --- [2] SHADERY ---
const vertexShader = `
  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uBaseH;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
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
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 worldBasePos = modelMatrix * instancePos;
    vWorldPos = worldBasePos.xyz;
    
    float windNoise = noise(worldBasePos.xz * 0.4 + uTime * 0.6);
    vNoise = windNoise;
    float wave = pow(uv.y, 1.5) * windNoise;
    
    vec3 pos = position;

    // --- NOWY KSZTAŁT: LIŚĆ (ZAOKRĄGLONY I ZWĘŻONY NA KOŃCACH) ---
    float leafShape = pow(sin(uv.y * 3.14159), 0.4);
    pos.x *= leafShape;

    // Przesunięcie (wiatr)
    pos.x += wave * 0.22;
    pos.z += wave * 0.22;
    pos.y += uBaseH;
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vWorldPos;
  uniform vec3 uZoneColor;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(1.0, 1.0)); 
    return mix(a, b, f.x);
  }
  
  void main() {
    float noiseValue = noise(vWorldPos.xz * 0.6);
    
    // KOLORY: Dostosowane do klimatu leśnego (uZoneColor z materialsConfig dla Forest)
    vec3 colorYellow = vec3(0.1, 0.4, 0.2); // Ciemniejsza zieleń jako baza
    vec3 colorNeon = uZoneColor * 1.5;     // Rozświetlenie kolorem strefy

    float mixFactor = smoothstep(0.2, 0.8, noiseValue);
    vec3 baseZoneColor = mix(colorYellow, colorNeon, mixFactor);
    
    // Gradient pionowy
    vec3 finalColor = mix(baseZoneColor * 0.15, baseZoneColor * (1.2 + vNoise * 0.4), vUv.y);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const ForestGroundDetail = ({ mapData, zoneColor }) => {
  const modelsRef = useRef([]);
  const grassRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gltfs = useGLTF(SMALL_MODELS_CONFIG.map(m => m.path));

  // --- [ZMIANA]: Filtrowanie dla kategorii FOREST ---
  const zoneInfo = useMemo(() => {
    const forestTiles = mapData.path.filter(t => t.category === 'forest');
    if (forestTiles.length === 0) return null;
    let minX = Math.min(...forestTiles.map(t => t.x));
    let minZ = Math.min(...forestTiles.map(t => t.y));
    return { startX: minX - 1, startZ: minZ - 1, sizeX: 8, sizeZ: 11 };
  }, [mapData]);

  useLayoutEffect(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    SMALL_MODELS_CONFIG.forEach((cfg, idx) => {
      const meshGroup = modelsRef.current[idx];
      if (!meshGroup) return;
      const transforms = [];
      for (let i = 0; i < cfg.instancesNo; i++) {
        const x = zoneInfo.startX + Math.random() * zoneInfo.sizeX;
        const z = zoneInfo.startZ + Math.random() * zoneInfo.sizeZ;
        if (!pathSet.has(`${Math.floor(x)},${Math.floor(z)}`)) {
          dummy.position.set(x, cfg.basePlane, z);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.scale.setScalar(cfg.scale * (0.8 + Math.random() * 0.4));
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
        }
      }
      meshGroup.children.forEach(mesh => {
        if (mesh.isInstancedMesh) {
          transforms.forEach((m, i) => mesh.setMatrixAt(i, m));
          mesh.count = transforms.length;
          mesh.instanceMatrix.needsUpdate = true;
        }
      });
    });

    if (grassRef.current) {
      for (let i = 0; i < SHADER_CONFIG.grassCount; i++) {
        const lx = (Math.random() - 0.5) * zoneInfo.sizeX;
        const lz = (Math.random() - 0.5) * zoneInfo.sizeZ;
        const wx = lx + zoneInfo.startX + zoneInfo.sizeX / 2;
        const wz = lz + zoneInfo.startZ + zoneInfo.sizeZ / 2;
        if (pathSet.has(`${Math.floor(wx)},${Math.floor(wz)}`)) {
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.position.set(lx, 0, lz);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.scale.set(1, 0.6 + Math.random() * 0.8, 1);
        }
        dummy.updateMatrix();
        grassRef.current.setMatrixAt(i, dummy.matrix);
      }
      grassRef.current.instanceMatrix.needsUpdate = true;
      grassRef.current.position.set(zoneInfo.startX + zoneInfo.sizeX / 2, 0, zoneInfo.startZ + zoneInfo.sizeZ / 2);
    }
  }, [zoneInfo, mapData.path]);

  useFrame((state) => {
    if (grassRef.current) {
      grassRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const grassGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SHADER_CONFIG.bladeWidth, SHADER_CONFIG.bladeHeight, 1, 7);
    geo.translate(0, SHADER_CONFIG.bladeHeight / 2, 0);
    return geo;
  }, []);

  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uZoneColor: { value: new THREE.Color(zoneColor) },
      uBaseH: { value: SHADER_CONFIG.basePlane }
    },
    vertexShader, fragmentShader, side: THREE.DoubleSide
  }), [zoneColor]);

  if (!zoneInfo) return null;

  return (
    <group>
      {SMALL_MODELS_CONFIG.map((cfg, idx) => (
        <group key={idx} ref={el => modelsRef.current[idx] = el}>
          {gltfs[idx].scene.children.map((child, mIdx) => child.isMesh && (
            <instancedMesh key={mIdx} args={[child.geometry, child.material, cfg.instancesNo]} castShadow receiveShadow />
          ))}
        </group>
      ))}
      <instancedMesh ref={grassRef} args={[grassGeometry, grassMaterial, SHADER_CONFIG.grassCount]} frustumCulled={false} />
    </group>
  );
};

export default ForestGroundDetail;