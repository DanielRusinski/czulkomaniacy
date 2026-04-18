import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA ---
const SMALL_MODELS_CONFIG = [
  { path: '/models/placeholder.glb', basePlane: 1.40, scale: 0.55, instancesNo: 4 },
  { path: '/models/placeholder.glb', basePlane: 1.40, scale: 0.77, instancesNo: 1 }
];

// Generuje unikalne ziarno (seed) przy każdym uruchomieniu gry
const GLOBAL_SEED = Math.random() * 10000.0;

// Konfiguracja trawy 
const GRASS_CONFIG = {
  grassCount: 30000, 
  bladeWidth: 0.06,   
  bladeHeight: 0.33,  
  basePlane: 0.4, 
  aoMaxDistance: 25.0,
  
  // -- Parametry wizualne i zachowanie --
  colorBottom: '#ff0066', // Kolor cienia/dołu
  colorTop: '#7affd9',    // Kolor wierzchołków
  colorShadow: '#9900ff', // <-- NOWY PARAMETR: Kolor głębokiego cienia (AO)//// #0EE1D3
  windSpeed: 0.4,         // Jak szybko fale wiatru przemieszczają się po trawie
  windStrength: 0.4,      // Jak mocno trawa kładzie się na wietrze
  noiseScale: 0.75,       // Skala plam kolorystycznych
  gradientPower: 0.6      // Krzywa gradientu (1.0 = liniowo, >1.0 = więcej ciemnego dołu, <1.0 = więcej jasnej góry)
};

// --- [2] SHADERY Z OBSŁUGĄ MGŁY I ODLEGŁOŚCIOWEGO AO ---
const vertexShader = `
  #include <common>
  #include <fog_pars_vertex>

  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDistance; 

  uniform float uTime;
  uniform float uBaseH;
  uniform float uSeed;
  uniform float uWindSpeed;
  uniform float uWindStrength;
  uniform vec3 uCameraPosition; 

  float hash(vec2 p) {
    p += uSeed;
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
    vNormal = normalize(normalMatrix * normal);
    
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 worldBasePos = modelMatrix * instancePos;
    vWorldPos = worldBasePos.xyz;

    vDistance = length(uCameraPosition - worldBasePos.xyz);
    
    // Efekt wiatru
    float windNoise = noise(worldBasePos.xz * uWindSpeed + uTime * uWindSpeed);
    vNoise = windNoise;
    float wave = pow(uv.y, 2.0) * windNoise;
    
    vec3 pos = position;
    pos.x += wave * uWindStrength;
    pos.z += wave * (uWindStrength * 0.75); 
    pos.y += uBaseH;
    
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
  varying vec3 vNormal;
  varying float vDistance; 

  uniform vec3 uColorBottom;
  uniform vec3 uColorTop;
  uniform vec3 uColorShadow; // <-- Dodany uniform cienia
  uniform float uSeed;
  uniform float uNoiseScale;
  uniform float uGradientPower;
  uniform float uAoMaxDistance; 

  float hash(vec2 p) {
    p += uSeed;
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
    float noiseValue = noise(vWorldPos.xz * uNoiseScale);
    
    float mixFactor = smoothstep(0.0, 1.0, noiseValue);
    vec3 baseZoneColor = mix(uColorBottom, uColorTop, mixFactor);
    
    float verticalGrad = pow(vUv.y, uGradientPower);
    
    // --- [ODLEGŁOŚCIOWE AO (Ambient Occlusion)] ---
    float aoIntensity = 1.0 - smoothstep(0.0, uAoMaxDistance, vDistance);
    
    // Głęboki cień to teraz dedykowany kolor uColorShadow z konfiguracji
    vec3 deepShadow = uColorShadow;
    
    // Płytki cień (dalej od kamery) to mieszanka koloru strefy i koloru cienia
    vec3 softShadow = mix(baseZoneColor, uColorShadow, 0.4);
    
    // Im bliżej kamery, tym ciemniejszy, dedykowany cień u podstawy trawy
    vec3 darkBottom = mix(softShadow, deepShadow, aoIntensity);
    
    vec3 lightTop = baseZoneColor * (1.15 + vNoise * 0.2);
    
    vec3 finalColor = mix(darkBottom, lightTop, verticalGrad);
    
    gl_FragColor = vec4(finalColor, 1.0);

    #include <fog_fragment>
  }
`;

const MeadowGroundDetail = ({ mapData }) => {
  const { camera } = useThree(); 
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
      for (let i = 0; i < GRASS_CONFIG.grassCount; i++) {
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
      const uniforms = grassRef.current.material.uniforms;
      uniforms.uTime.value = state.clock.getElapsedTime();
      uniforms.uCameraPosition.value.copy(state.camera.position);
    }
  });

  const grassGeometry = useMemo(() => {
    const radius = GRASS_CONFIG.bladeWidth / 2;
    const geo = new THREE.CapsuleGeometry(radius, GRASS_CONFIG.bladeHeight, 3, 6);
    const totalHeight = GRASS_CONFIG.bladeHeight + 2 * radius;
    geo.translate(0, totalHeight / 2, 0);
    return geo;
  }, []);

  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsLib.fog,
      uTime: { value: 0 },
      uBaseH: { value: GRASS_CONFIG.basePlane },
      uCameraPosition: { value: new THREE.Vector3() }, 
      uAoMaxDistance: { value: GRASS_CONFIG.aoMaxDistance },
      
      uSeed: { value: GLOBAL_SEED },
      uColorBottom: { value: new THREE.Color(GRASS_CONFIG.colorBottom) },
      uColorTop: { value: new THREE.Color(GRASS_CONFIG.colorTop) },
      uColorShadow: { value: new THREE.Color(GRASS_CONFIG.colorShadow) }, // <-- Wstrzyknięcie koloru cienia
      uWindSpeed: { value: GRASS_CONFIG.windSpeed },
      uWindStrength: { value: GRASS_CONFIG.windStrength },
      uNoiseScale: { value: GRASS_CONFIG.noiseScale },
      uGradientPower: { value: GRASS_CONFIG.gradientPower } 
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    fog: true 
  }), []);

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
        args={[grassGeometry, grassMaterial, GRASS_CONFIG.grassCount]} 
        frustumCulled={false} 
      />
    </group>
  );
};

export default MeadowGroundDetail;