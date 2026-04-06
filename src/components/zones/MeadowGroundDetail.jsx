import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA ---
const SMALL_MODELS_CONFIG = [
  { path: '/models/placeholder.glb', basePlane: 0.40, scale: 0.55, instancesNo: 40 },
  { path: '/models/placeholder.glb', basePlane: 0.40, scale: 0.77, instancesNo: 15 }
];

const SHADER_CONFIG = {
  grassCount: 30000, 
  bladeWidth: 0.06,  // Średnica tuby
  bladeHeight: 0.33,  // Wysokość części cylindrycznej
  basePlane: 0.4, 
};

// --- [2] SHADERY Z OBSŁUGĄ MGŁY ---
const vertexShader = `
  #include <common>
  #include <fog_pars_vertex>

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
    
    // Obliczanie pozycji instancji
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 worldBasePos = modelMatrix * instancePos;
    vWorldPos = worldBasePos.xyz;
    
    // Efekt wiatru (wygięcie)
    float windNoise = noise(worldBasePos.xz * 0.4 + uTime * 0.4);
    vNoise = windNoise;
    float wave = pow(uv.y, 2.0) * windNoise;
    
    vec3 pos = position;
    pos.x += wave * 0.4;
    pos.z += wave * 0.3;
    pos.y += uBaseH;
    
    // Standardowe transformacje dla mgły i projekcji
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const fragmentShader = `
  #include <common>
  #include <fog_pars_fragment>

  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vWorldPos;
  uniform vec3 uZoneColor;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Ulepszony szum 2D dla łagodniejszych przejść
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
    // Zmniejszony mnożnik (0.15) sprawia, że przejścia kolorów są dłuższe i szersze
    float noiseValue = noise(vWorldPos.xz * 0.75);
    
    // Kolory stref
    vec3 colorYellow = vec3(1.0, 0.0, 0.4); 
    vec3 colorNeon = uZoneColor * 2.5;    

    // Smoothstep ustawiony na pełny zakres (0.0 - 1.0) dla maksymalnej miękkości gradientu
    float mixFactor = smoothstep(0.0, 1.0, noiseValue);
    vec3 baseZoneColor = mix(colorYellow, colorNeon, mixFactor);
    
    // Gradient pionowy (użycie pow(vUv.y, 0.8) dla ładniejszego rozkładu cienia u dołu)
    float verticalGrad = pow(vUv.y, 0.8);
    vec3 finalColor = mix(baseZoneColor * 0.1, baseZoneColor * (1.1 + vNoise * 0.3), verticalGrad);
    
    gl_FragColor = vec4(finalColor, 1.0);

    #include <fog_fragment>
  }
`;

const MeadowGroundDetail = ({ mapData, zoneColor }) => {
  const grassRef = useRef();
  const modelsRef = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gltfs = useGLTF(SMALL_MODELS_CONFIG.map(m => m.path));

  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;
    let minX = Math.min(...meadowTiles.map(t => t.x));
    let minZ = Math.min(...meadowTiles.map(t => t.y));
    return { startX: minX - 1, startZ: minZ - 1, sizeX: 8, sizeZ: 11 };
  }, [mapData]);

  useLayoutEffect(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    // --- Modele GLB ---
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

    // --- Trawa ---
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
          dummy.scale.set(1, 0.7 + Math.random() * 0.6, 1);
        }
        dummy.updateMatrix();
        grassRef.current.setMatrixAt(i, dummy.matrix);
      }
      grassRef.current.instanceMatrix.needsUpdate = true;
      grassRef.current.position.set(zoneInfo.startX + zoneInfo.sizeX / 2, 0, zoneInfo.startZ + zoneInfo.sizeZ / 2);
    }
  }, [zoneInfo, mapData.path, dummy]);

  useFrame((state) => {
    if (grassRef.current) {
      grassRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const grassGeometry = useMemo(() => {
    const radius = SHADER_CONFIG.bladeWidth / 2;
    const geo = new THREE.CapsuleGeometry(radius, SHADER_CONFIG.bladeHeight, 3, 6);
    const totalHeight = SHADER_CONFIG.bladeHeight + 2 * radius;
    geo.translate(0, totalHeight / 2, 0);
    return geo;
  }, []);

  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsLib.fog,
      uTime: { value: 0 },
      uZoneColor: { value: new THREE.Color(zoneColor) },
      uBaseH: { value: SHADER_CONFIG.basePlane }
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    fog: true 
  }), [zoneColor]);

  if (!zoneInfo) return null;

  return (
    <group>
      {SMALL_MODELS_CONFIG.map((cfg, idx) => (
        <group key={idx} ref={el => modelsRef.current[idx] = el}>
          {gltfs[idx].scene.children.map((child, mIdx) => child.isMesh && (
            <instancedMesh 
              key={mIdx} 
              args={[child.geometry, child.material, cfg.instancesNo]} 
              castShadow 
              receiveShadow 
            />
          ))}
        </group>
      ))}
      <instancedMesh 
        ref={grassRef} 
        args={[grassGeometry, grassMaterial, SHADER_CONFIG.grassCount]} 
        frustumCulled={false} 
      />
    </group>
  );
};

export default MeadowGroundDetail;