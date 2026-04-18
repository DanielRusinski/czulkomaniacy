import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ==========================================
// === GŁÓWNE PARAMETRY ANIMACJI (CONFIG) ===
// ==========================================
const CONFIG = {
  radius: 2.00,
  waveFreq: 6.60,
  waveSpeed: 1.20,
  waveHeight: 0.90,
  aoStrength: 0.60,
  baseOpacity: 0.88,
  maxLoops: 3,
  fadeInDuration: 0.5,
  fadeDuration: 3.0
};

const AnimationState = {
  READY: 'READY',
  FADING_IN: 'FADE_IN',
  PLAYING_LOOPS: 'PLAYING',
  FADING_HEIGHT: 'FADING_H',
  FADING_OUT: 'FADING_O'
};

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  
  void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  precision highp float;
  precision highp int;

  uniform float time;
  uniform float radius;
  uniform float waveFreq;
  uniform float waveSpeed;
  uniform float waveHeight;
  uniform float aoStrength; 
  uniform float opacity;    
  uniform sampler2D envMap;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  const float PI = 3.14159265359;
  vec2 getEquirectangularUv(vec3 dir) {
      float phi = acos(-dir.y);
      float theta = atan(dir.z, dir.x) + PI;
      return vec2(theta / (2.0 * PI), phi / PI);
  }

  vec3 ACESFilmic(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  void main() {
      vec3 worldNormal = normalize(vWorldNormal);

      vec3 origin = vec3(0.0, 0.475, 0.0);
      vec3 diff3D = vWorldPosition - origin;
      float dist = length(diff3D) / (0.475 * radius);
      
      float distForSin = pow(dist, 0.5);
      
      float rawWave = sin(distForSin * waveFreq - (time * waveSpeed));
      float waveSlope = cos(distForSin * waveFreq - (time * waveSpeed)) * waveHeight * waveFreq * 0.1;
      
      vec3 waveDir = normalize(diff3D);
      if(length(diff3D) == 0.0) waveDir = vec3(0.0);
      
      vec3 tangentDir = waveDir - worldNormal * dot(waveDir, worldNormal);
      if (length(tangentDir) > 0.001) {
          tangentDir = normalize(tangentDir);
      } else {
          tangentDir = vec3(0.0);
      }

      float waveMask = abs(rawWave); 
      float edgeMask = smoothstep(1.0, 0.8, dist); 
      float heightFactor = clamp(waveHeight * 2.0, 0.0, 1.0);
      float finalAlpha = waveMask * edgeMask * opacity * heightFactor;

      vec3 modifiedNormal = normalize(worldNormal + tangentDir * waveSlope);

      float normalizedWave = rawWave * 0.5 + 0.5;
      float cheapAO = mix(1.0 - aoStrength, 1.0, normalizedWave);
      cheapAO = mix(1.0, cheapAO, edgeMask * heightFactor); 

      vec3 bottomDir = normalize(vec3(0.0, -0.95, 0.1)); 
      vec2 bottomUv = getEquirectangularUv(bottomDir);
      vec3 sampledBaseColor = texture2D(envMap, bottomUv).rgb;
      
      vec3 baseColor = max(sampledBaseColor, vec3(0.03)); 

      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
      float ndotl = max(dot(modifiedNormal, lightDir), 0.0);
      vec3 diffuse = baseColor * (ndotl * 0.5 + 0.5) * cheapAO;

      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 reflectDir = reflect(-viewDir, modifiedNormal);
      vec2 envUv = getEquirectangularUv(reflectDir);
      
      vec3 envColor = texture2D(envMap, envUv).rgb * cheapAO;

      float fresnel = 1.0 - max(dot(viewDir, modifiedNormal), 0.0);
      fresnel = pow(fresnel, 3.0); 
      float reflectivity = mix(0.1, 0.9, fresnel);

      vec3 finalColor = mix(diffuse, envColor, reflectivity);
      finalColor = ACESFilmic(finalColor);
      finalColor = pow(finalColor, vec3(1.0 / 2.2));

      gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export default function TileRippleOverlay({ tileId, baseScene }) {
    const { scene } = useThree();
    
    // Stany animacji shadera
    const shaderState = useRef(AnimationState.READY);
    const activeTime = useRef(0);
    const fadeTimer = useRef(0);

    // Inicjalizacja materiału
    const customMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                radius: { value: CONFIG.radius },
                waveFreq: { value: CONFIG.waveFreq },
                waveSpeed: { value: CONFIG.waveSpeed },
                waveHeight: { value: CONFIG.waveHeight },
                aoStrength: { value: CONFIG.aoStrength },
                opacity: { value: 0.0 }, // Zaczyna z ukrycia
                envMap: { value: null } 
            },
            vertexShader,
            fragmentShader,
            transparent: true, 
            depthWrite: false, 
            blending: THREE.NormalBlending
        });
    }, []);

    // Ładowanie mapy środowiskowej z głównej sceny
    useEffect(() => {
        if (scene.environment) {
            customMaterial.uniforms.envMap.value = scene.environment;
        }
    }, [scene.environment, customMaterial]);

    // Nasłuchiwanie na koniec ruchu piona
    useEffect(() => {
        const handleMovementEnded = (e) => {
            if (String(e.detail.tileId) === String(tileId)) {
                activeTime.current = 0;
                fadeTimer.current = 0;
                customMaterial.uniforms.opacity.value = 0.0;
                customMaterial.uniforms.waveHeight.value = CONFIG.waveHeight;
                shaderState.current = AnimationState.FADING_IN;
            }
        };

        window.addEventListener('tile-movement-ended', handleMovementEnded);
        return () => window.removeEventListener('tile-movement-ended', handleMovementEnded);
    }, [tileId, customMaterial]);

    // Maszyna stanów (Pętla Animacji)
    useFrame((state, delta) => {
        if (shaderState.current === AnimationState.READY) return;

        const waveSpeed = customMaterial.uniforms.waveSpeed.value;
        const maxPhase = CONFIG.maxLoops * 2.0 * Math.PI;

        switch (shaderState.current) {
            case AnimationState.FADING_IN:
                activeTime.current += delta;
                customMaterial.uniforms.time.value = activeTime.current;
                
                fadeTimer.current += delta;
                let inProg = fadeTimer.current / CONFIG.fadeInDuration;
                
                if (inProg >= 1.0) {
                    inProg = 1.0;
                    shaderState.current = AnimationState.PLAYING_LOOPS;
                }
                customMaterial.uniforms.opacity.value = inProg * CONFIG.baseOpacity;
                break;

            case AnimationState.PLAYING_LOOPS:
                activeTime.current += delta;
                const currentPhase = activeTime.current * waveSpeed;
                
                if (currentPhase >= maxPhase) {
                    activeTime.current = maxPhase / waveSpeed; 
                    shaderState.current = AnimationState.FADING_HEIGHT;
                    fadeTimer.current = 0;
                }
                customMaterial.uniforms.time.value = activeTime.current;
                break;

            case AnimationState.FADING_HEIGHT:
                activeTime.current += delta;
                customMaterial.uniforms.time.value = activeTime.current;
                
                fadeTimer.current += delta;
                let progress = fadeTimer.current / CONFIG.fadeDuration;
                
                if (progress >= 1.0) {
                    progress = 1.0;
                    shaderState.current = AnimationState.FADING_OUT;
                    fadeTimer.current = 0;
                }
                customMaterial.uniforms.waveHeight.value = THREE.MathUtils.lerp(CONFIG.waveHeight, 0.0, progress);
                break;

            case AnimationState.FADING_OUT:
                activeTime.current += delta;
                customMaterial.uniforms.time.value = activeTime.current;
                
                fadeTimer.current += delta;
                let alphaProgress = fadeTimer.current / 1.0; 
                
                if (alphaProgress >= 1.0) {
                    alphaProgress = 1.0;
                    shaderState.current = AnimationState.READY;
                }
                customMaterial.uniforms.opacity.value = CONFIG.baseOpacity * (1.0 - alphaProgress);
                break;
        }
    });

    // Tworzenie powłoki
    const overlayScene = useMemo(() => {
        if (!baseScene) return null;
        const clone = baseScene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = customMaterial;
            }
        });
        clone.scale.set(1.002, 1.002, 1.002);
        return clone;
    }, [baseScene, customMaterial]);

    if (!overlayScene) return null;

    return <primitive object={overlayScene} />;
}