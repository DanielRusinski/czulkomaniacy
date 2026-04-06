import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';
// Importujemy ujednolicony system kolorów i właściwości materiałów
import { GAME_COLORS, MATERIAL_PROPS } from '../config/materialsConfig';

// Mapowanie kolorów chmur na podstawie centralnego pliku konfiguracyjnego
const cloudColors = {
  meadow: new THREE.Color(GAME_COLORS.zones.meadow.cloud),
  forest: new THREE.Color(GAME_COLORS.zones.forest.cloud),
  lake: new THREE.Color(GAME_COLORS.zones.lake.cloud),
  mountains: new THREE.Color(GAME_COLORS.zones.mountains.cloud),
  "start-meta": new THREE.Color(GAME_COLORS.zones.startMeta.cloud),
  darkness: new THREE.Color(GAME_COLORS.zones.darkness.cloud)
};

const CloudSea = ({ mapData }) => {
  const planeRef = useRef();

  // Konfiguracja autorskiego shadera dla efektu chmur
  const customShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      // Startujemy od koloru strefy meadow z configu
      uColor: { value: new THREE.Color(GAME_COLORS.zones.meadow.cloud) },
      uOpacity: { value: 0.7 }
    },
    onBeforeCompile: (shader) => {
      // Podpięcie uniformów pod shader Three.js
      shader.uniforms.uTime = customShader.uniforms.uTime;
      shader.uniforms.uColor = customShader.uniforms.uColor;
      shader.uniforms.uOpacity = customShader.uniforms.uOpacity;

      // Definicja zmiennej varying w fragment shaderze
      shader.fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vCloudUv; 
        ${shader.fragmentShader}
      `;

      // Wstrzyknięcie przekazywania UV w vertex shaderze
      shader.vertexShader = `
        varying vec2 vCloudUv;
        ${shader.vertexShader}
      `.replace(
        `#include <uv_vertex>`,
        `#include <uv_vertex>
         vCloudUv = uv;`
      );

      // Podmiana koloru wyjściowego na animowany szum chmur
      shader.fragmentShader = shader.fragmentShader.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
        vec2 uv = vCloudUv * 10.0 + vec2(uTime * 0.05);
        float n = sin(uv.x + uTime) * cos(uv.y + uTime * 0.5) * 0.5 + 0.5;
        float dist = distance(vCloudUv, vec2(0.5));
        float mask = smoothstep(0.5, 0.2, dist);
        vec4 diffuseColor = vec4( uColor, n * uOpacity * mask );
        `
      );
    }
  }), []);

  useFrame((state, delta) => {
    if (!planeRef.current || !mapData?.path || !gameState.players) return;

    // Pobranie aktywnego gracza
    const player = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
    if (!player) return;

    // Znalezienie kafla, na którym stoi gracz
    const currentTile = mapData.path.find(t => String(t.id) === String(player.currentModuleId));

    if (currentTile) {
      // Określenie strefy dla koloru chmur
      const zone = currentTile.isBoss ? "darkness" : currentTile.category;
      
      // Interpolacja (płynne przejście) koloru chmur
      customShader.uniforms.uColor.value.lerp(cloudColors[zone] || cloudColors.meadow, delta * 2);
      
      // Aktualizacja czasu dla animacji szumu
      customShader.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Płynne podążanie morza chmur za graczem
      planeRef.current.position.x = THREE.MathUtils.lerp(planeRef.current.position.x, currentTile.x, delta * 2);
      planeRef.current.position.z = THREE.MathUtils.lerp(planeRef.current.position.z, currentTile.y, delta * 2);
    }
  });

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.54, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      {/* ZMIANA: meshStandardMaterial -> meshPhongMaterial
          Wstrzyknięcie parametrów z MATERIALS_PROPS (shininess, specular, transparent, depthWrite)
      */}
      <meshPhongMaterial 
        {...MATERIAL_PROPS.cloudBase}
        onBeforeCompile={customShader.onBeforeCompile} 
      />
    </mesh>
  );
};

export default CloudSea;