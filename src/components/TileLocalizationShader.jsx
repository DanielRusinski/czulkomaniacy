import React, { useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==========================================
// KONFIGURACJA KOLORU (Zmień tutaj):
// ==========================================
const LABEL_COLOR = '#b9ad5c'; // Np. #FFD700 (złoty), #B5A642 (mosiądz), #ffffff (biały)

const vertexShader = `
  #include <common>
  #include <fog_pars_vertex>

  varying vec2 vUv;
  varying vec3 vViewDirection;
  varying vec3 vWorldPos;
  attribute vec2 instanceUv;
  attribute vec2 gridPos; 
  uniform float uTime;
  uniform float uGridWidth;
  uniform vec3 uCameraPosition;

  void main() {
    vUv = (uv / uGridWidth) + instanceUv;
    
    vec3 pos = position;
    mat4 finalModelMatrix = modelMatrix * instanceMatrix;
    
    // Synchronizacja fali z Tile3D.jsx
    float wave = sin(uTime * 1.5 + (gridPos.x * 0.5 + gridPos.y * 0.5)) * 0.04;
    pos.y += wave;

    vec4 animatedWorldPos = finalModelMatrix * vec4(pos, 1.0);
    vWorldPos = animatedWorldPos.xyz;
    
    vViewDirection = normalize(uCameraPosition - animatedWorldPos.xyz);

    // Obliczenia dla mgły
    vec4 mvPosition = viewMatrix * animatedWorldPos;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const fragmentShader = `
  #include <common>
  #include <fog_pars_fragment>

  varying vec2 vUv;
  varying vec3 vViewDirection;
  varying vec3 vWorldPos;
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform vec3 uColor; // Kolor przekazywany z komponentu

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
    vec4 texMask = texture2D(uAtlas, vUv);
    
    // Maska szumu (noise)
    float n = noise(vWorldPos.xz * 38.0); 
    
    if (texMask.a < 0.1 || n < 0.42) discard;

    float viewInfluence = vViewDirection.x + vViewDirection.z;
    float glarePhase = (vUv.x * 2.0 + vUv.y * 2.0) + viewInfluence * 2.0; 

    // Intensywność gradientu (0.0 = czarny/przezroczysty, 1.0 = uColor)
    float intensity = sin(glarePhase * 36.0) * 0.5 + 0.5;

    // noiseEdge wygładza krawędzie wycięcia szumu
    float noiseEdge = smoothstep(0.05, 0.28, n);
    
    // Finalna przezroczystość: czarny kolor gradientu (intensity 0) staje się przezroczysty
    float finalAlpha = texMask.a * intensity * noiseEdge;

    // Odrzucamy ciemne partie gradientu
    if (finalAlpha < 0.04) discard;

    // Używamy uColor ustawionego na początku pliku
    vec3 finalColor = uColor; 
    
    gl_FragColor = vec4(finalColor, finalAlpha);

    #include <fog_fragment>
  }
`;

const TileLocalizationShader = ({ mapData, texture, visibleTiles }) => {
  const meshRef = useRef();
  
  if (!mapData || !texture || !visibleTiles) return null;

  const count = mapData.path.length;
  const gridWidth = Math.ceil(Math.sqrt(count));

  // Geometria i atrybuty
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 1.04, 0); 

    const uvOffsets = new Float32Array(count * 2);
    const gridPositions = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const x = i % gridWidth;
      const y = Math.floor(i / gridWidth);
      uvOffsets[i * 2] = x / gridWidth;
      uvOffsets[i * 2 + 1] = 1.0 - (y / gridWidth) - (1.0 / gridWidth);

      gridPositions[i * 2] = mapData.path[i].x;
      gridPositions[i * 2 + 1] = mapData.path[i].y;
    }
    
    geo.setAttribute('instanceUv', new THREE.InstancedBufferAttribute(uvOffsets, 2));
    geo.setAttribute('gridPos', new THREE.InstancedBufferAttribute(gridPositions, 2));
    return geo;
  }, [count, gridWidth, mapData]);

  // Materiał z wstrzykniętym kolorem LABEL_COLOR
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog, 
      {
        uTime: { value: 0 },
        uAtlas: { value: texture },
        uGridWidth: { value: gridWidth },
        uCameraPosition: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Color(LABEL_COLOR) }, 
      }
    ]),
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true 
  }), [texture, gridWidth]);

  // Synchronizacja widoczności instancji
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const visibleIds = new Set(visibleTiles.map(t => String(t.id)));
    const dummy = new THREE.Object3D();

    mapData.path.forEach((tile, i) => {
      const isVisible = visibleIds.has(String(tile.id));

      if (tile.isEnvironment || !isVisible) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.position.set(tile.x + 0.5, 0, tile.y + 0.5);
        dummy.scale.setScalar(1);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [mapData, visibleTiles]);

  // Aktualizacja klatek
  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      material.uniforms.uCameraPosition.value.copy(state.camera.position);
    }
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]} 
      frustumCulled={false} 
      renderOrder={999} 
    />
  );
};

export default TileLocalizationShader;