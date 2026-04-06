import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// --- [1] KONFIGURACJA ELEMENTÓW ---
const SMALL_MODELS_CONFIG = [
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.40, 
    scale: 0.55, 
    instancesNo: 40 
  },
  { 
    path: '/models/placeholder.glb', 
    basePlane: 0.40, 
    scale: 0.77, 
    instancesNo: 15 
  }
];

const SHADER_CONFIG = {
  // Zwiększona liczba instancji dla lepszego efektu pola półkul
  objectCount: 40000, 
  objectScale: 0.06,  // Promień półkuli
  basePlane: 0.4, 
};

// --- [2] SHADERY ---
// Vertex Shader: Przenosi pozycję instancji do Fragment Shadera
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    // Obliczanie pozycji instancji w świecie
    vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 worldBasePos = modelMatrix * instancePos;
    vWorldPos = worldBasePos.xyz;
    
    // Proste przypisanie pozycji bez ruchu wiatru
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader: Tworzy drastyczne strefy kolorów
const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform vec3 uZoneColor;

  // Prosty szum oparty na pozycji
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
    // Szum strefowy (częstotliwość 0.6)
    float noiseValue = noise(vWorldPos.xz * 0.6);
    
    // Drastyczne kolory: Jaskrawy Żółty i Neonowy Zielony/Błękit
    vec3 colorYellow = vec3(1.0, 1.0, 0.0); 
    vec3 colorNeon = uZoneColor * 2.5;    

    // Ostre granice stref przy użyciu smoothstep
    float mixFactor = smoothstep(0.2, 0.8, noiseValue);
    vec3 finalColor = mix(colorYellow, colorNeon, mixFactor);
    
    // Proste oświetlenie, aby półkula była czytelna
    finalColor *= (0.8 + 0.2 * vUv.y);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * HemispheresGroundDetail - Obsługuje instancjonowanie prostych półkul z drastycznym shaderem strefowym.
 */
const HemispheresGroundDetail = ({ mapData, zoneColor }) => {
  const modelsRef = useRef([]);
  const hemispheresRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gltfs = useGLTF(SMALL_MODELS_CONFIG.map(m => m.path));

  // Obliczanie granic (Matryca 8x11)
  const zoneInfo = useMemo(() => {
    const meadowTiles = mapData.path.filter(t => t.category === 'meadow');
    if (meadowTiles.length === 0) return null;
    let minX = Math.min(...meadowTiles.map(t => t.x));
    let minZ = Math.min(...meadowTiles.map(t => t.y));
    return { startX: minX - 1, startZ: minZ - 1, sizeX: 8, sizeZ: 11 };
  }, [mapData]);

  // Logika Rozmieszczania
  useLayoutEffect(() => {
    if (!zoneInfo) return;
    const pathSet = new Set(mapData.path.map(t => `${t.x},${t.y}`));

    // --- Małe Modele ---
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

    // --- Półkule ---
    if (hemispheresRef.current) {
      for (let i = 0; i < SHADER_CONFIG.objectCount; i++) {
        const lx = (Math.random() - 0.5) * zoneInfo.sizeX;
        const lz = (Math.random() - 0.5) * zoneInfo.sizeZ;
        const wx = lx + zoneInfo.startX + zoneInfo.sizeX / 2;
        const wz = lz + zoneInfo.startZ + zoneInfo.sizeZ / 2;

        if (pathSet.has(`${Math.floor(wx)},${Math.floor(wz)}`)) {
          // Skaluj do zera, jeśli obiekt jest na ścieżce
          dummy.scale.set(0, 0, 0);
        } else {
          // Losowa pozycja w obrębie strefy łąki
          dummy.position.set(lx, 0, lz);
          dummy.rotation.y = Math.random() * Math.PI;
          // Subtelna losowa skala
          dummy.scale.setScalar(0.8 + Math.random() * 0.4);
        }
        dummy.updateMatrix();
        hemispheresRef.current.setMatrixAt(i, dummy.matrix);
      }
      hemispheresRef.current.instanceMatrix.needsUpdate = true;
      // Ustaw grupę w centrum strefy łąki
      hemispheresRef.current.position.set(zoneInfo.startX + zoneInfo.sizeX / 2, SHADER_CONFIG.basePlane, zoneInfo.startZ + zoneInfo.sizeZ / 2);
    }
  }, [zoneInfo, mapData.path]);

  // Geometria: Prosta Hemisfera (półkula)
  const hemiGeometry = useMemo(() => {
    // THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
    // Tworzymy uproszczoną półkulę (promień 0.3, siatka 10x8)
    const geo = new THREE.SphereGeometry(SHADER_CONFIG.objectScale, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    // Orientujemy ją, aby płaska baza leżała na ziemi (obrót o 90 stopni)
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  // Materiał Shaderowy dla stref kolorów
  const hemiMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uZoneColor: { value: new THREE.Color(zoneColor) },
    },
    vertexShader, fragmentShader, side: THREE.DoubleSide
  }), [zoneColor]);

  if (!zoneInfo) return null;

  return (
    <group>
      {/* Warstwa Małych Modeli */}
      {SMALL_MODELS_CONFIG.map((cfg, idx) => (
        <group key={idx} ref={el => modelsRef.current[idx] = el}>
          {gltfs[idx].scene.children.map((child, mIdx) => child.isMesh && (
            <instancedMesh key={mIdx} args={[child.geometry, child.material, cfg.instancesNo]} castShadow receiveShadow />
          ))}
        </group>
      ))}

      {/* Warstwa Półkul (InstancedMesh z shaderem strefowym) */}
      <instancedMesh ref={hemispheresRef} args={[hemiGeometry, hemiMaterial, SHADER_CONFIG.objectCount]} frustumCulled={false} />
    </group>
  );
};

export default HemispheresGroundDetail;