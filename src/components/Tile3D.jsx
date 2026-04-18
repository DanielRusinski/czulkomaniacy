import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import StartMetaParticles from './particles/StartMetaParticles';
import SparkleEffect from '../effects/SparkleEffect';

// --- IMPORT GLOBALNEGO STANU GRY ---
import { gameState } from '../logic/gameState';

// --- CONFIG I SHADERY RIPPLE ---
const CONFIG = {
  radius: 2.00,
  waveFreq: 10.20,
  waveSpeed: 3.20,
  waveHeight: 0.90,
  aoStrength: 0.60,
  baseOpacity: 0.88,
  // maxLoops usunięte - fala gra w nieskończoność dopóki gracz stoi na polu
  fadeInDuration: 0.5,
  fadeDuration: 3.0
};

const AnimationState = {
  READY: 'READY',
  FADING_IN: 'FADE_IN',
  ACTIVE: 'ACTIVE',          // <-- NOWY STAN: Nieskończona pętla
  FADING_HEIGHT: 'FADING_H',
  FADING_OUT: 'FADING_O'
};

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition; 
  varying vec3 vWorldNormal;
  
  void main() {
      vUv = uv;
      vLocalPosition = position; 
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
  varying vec3 vLocalPosition; 
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
      
      vec3 diff3D = vLocalPosition - origin; 
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

const dummyEnvMap = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
dummyEnvMap.needsUpdate = true;

// --- GLOBALNY SYNTEZATOR (Singleton) ---
let globalAudioCtx = null;
let globalReverb = null;

const initSynth = () => {
  if (globalAudioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  globalAudioCtx = new AudioContextClass();

  globalReverb = globalAudioCtx.createConvolver();
  const length = globalAudioCtx.sampleRate * 1.5;
  const impulse = globalAudioCtx.createBuffer(2, length, globalAudioCtx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  globalReverb.buffer = impulse;
  globalReverb.connect(globalAudioCtx.destination);
};

const playXylophone = () => {
  if (!globalAudioCtx) initSynth();
  if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();

  const scale = [410, 490, 570, 650, 730];
  const freq = scale[Math.floor(Math.random() * scale.length)];

  const osc = globalAudioCtx.createOscillator();
  const gain = globalAudioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, globalAudioCtx.currentTime);

  gain.gain.setValueAtTime(0, globalAudioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, globalAudioCtx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(globalReverb);
  gain.connect(globalAudioCtx.destination);

  osc.start();
  osc.stop(globalAudioCtx.currentTime + 0.5);
};

// --- KOMPONENT TILE3D ---
const MODELS = {
  standard: '/models/boxy2.glb',
  startMeta: '/models/tile3D_StartEnd001.glb',
  boss: '/models/tile3D_Boss001.glb',
  special: '/models/boxy2.glb',
  zoneEnd: '/models/tile3D_endOfZone001.glb',
};

const HIGHLIGHT_COLOR = new THREE.Color('#ffffff');
const HIGHLIGHT_INTENSITY = 1.8;
const ANIM_SPEED = 6.0;

const Tile3D = ({ tile, onHover }) => {
  const meshRef = useRef();
  const hoverFactor = useRef(0);
  const isAnimating = useRef(false);
  const phase = useRef('up');
  const { scene } = useThree();

  const shaderState = useRef(AnimationState.READY);
  const activeTime = useRef(0);
  const fadeTimer = useRef(0);

  const models = useGLTF([
    MODELS.standard,
    MODELS.startMeta,
    MODELS.boss,
    MODELS.special,
    MODELS.zoneEnd
  ]);

  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            radius: { value: CONFIG.radius },
            waveFreq: { value: CONFIG.waveFreq },
            waveSpeed: { value: CONFIG.waveSpeed },
            waveHeight: { value: CONFIG.waveHeight },
            aoStrength: { value: CONFIG.aoStrength },
            opacity: { value: 0.0 },
            envMap: { value: dummyEnvMap } 
        },
        vertexShader,
        fragmentShader,
        transparent: true, 
        depthWrite: false, 
        blending: THREE.NormalBlending
    });
  }, []);

  useEffect(() => {
    if (scene.environment) {
      customMaterial.uniforms.envMap.value = scene.environment;
    }
  }, [scene.environment, customMaterial]);

  useEffect(() => {
    const handleLanding = (e) => {
      if (String(e.detail.tileId) === String(tile.id)) {
        playXylophone();
        if (!isAnimating.current) {
          isAnimating.current = true;
          phase.current = 'up';
        }
      }
    };

    const handleMovementEnded = (e) => {
      if (String(e.detail.tileId) === String(tile.id)) {
        // Zabezpieczenie: odpalaj tylko jeśli jeszcze nie gramy fali
        if (shaderState.current !== AnimationState.ACTIVE && shaderState.current !== AnimationState.FADING_IN) {
            activeTime.current = 0;
            fadeTimer.current = 0;
            customMaterial.uniforms.opacity.value = 0.0;
            customMaterial.uniforms.waveHeight.value = CONFIG.waveHeight;
            shaderState.current = AnimationState.FADING_IN;
            console.log(`[Shader] Zakończono ruch, odpalam nieskończoną falę na polu ${tile.id}!`);
        }
      }
    };

    window.addEventListener('tile-landed', handleLanding);
    window.addEventListener('tile-movement-ended', handleMovementEnded);
    window.addEventListener('mousedown', initSynth, { once: true });

    return () => {
      window.removeEventListener('tile-landed', handleLanding);
      window.removeEventListener('tile-movement-ended', handleMovementEnded);
      window.removeEventListener('mousedown', initSynth);
    };
  }, [tile.id, customMaterial]);

  const { clonedScene, overlayScene } = useMemo(() => {
    let selectedScene;
    if (tile.isBoss) selectedScene = models[2].scene;
    else if (tile.isZoneEnd) selectedScene = models[4].scene;
    else if (tile.isStartMeta) selectedScene = models[1].scene;
    else if (tile.isChance || tile.isPortal || tile.type === 'special') selectedScene = models[3].scene;
    else selectedScene = models[0].scene;

    const baseClone = selectedScene.clone();
    baseClone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color('#000000');
          child.material.emissiveIntensity = 0;
          if (child.material.roughness !== undefined) child.material.roughness = 0.8;
        }
      }
    });

    const overlayClone = selectedScene.clone();
    overlayClone.traverse((child) => {
        if (child.isMesh) {
            child.material = customMaterial;
        }
    });
    overlayClone.scale.set(1.002, 1.002, 1.002);

    return { clonedScene: baseClone, overlayScene: overlayClone };
  }, [models, tile, customMaterial]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // --- 1. Logika wciskania Kafelka ---
    const t = state.clock.getElapsedTime();
    const wave = Math.sin(t * 1.5 + (tile.x * 0.5 + tile.y * 0.5)) * 0.04;

    if (isAnimating.current) {
      if (phase.current === 'up') {
        hoverFactor.current += delta * ANIM_SPEED;
        if (hoverFactor.current >= 1) {
          hoverFactor.current = 1;
          phase.current = 'down';
        }
      } else {
        hoverFactor.current -= delta * (ANIM_SPEED * 0.5);
        if (hoverFactor.current <= 0) {
          hoverFactor.current = 0;
          isAnimating.current = false;
          phase.current = 'up';
        }
      }
    }

    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.emissive.lerpColors(
          new THREE.Color('#000000'),
          HIGHLIGHT_COLOR,
          hoverFactor.current
        );
        child.material.emissiveIntensity = hoverFactor.current * HIGHLIGHT_INTENSITY;
      }
    });

    const pressEffect = hoverFactor.current * 0.15;
    meshRef.current.position.y = wave - pressEffect;

    // --- 2. Maszyna Stanów Shadera Ripple ---
    // Sprawdzamy czy na tym kafelku stoi aktualnie jakiś gracz (jego celem jest ten kafel)
    const hasPlayers = gameState?.players?.some(p => String(p.currentModuleId) === String(tile.id));

    // Jeżeli nie ma tu graczy, a fala działa lub się pojawia, nakazujemy wygaszenie
    if (!hasPlayers && (shaderState.current === AnimationState.FADING_IN || shaderState.current === AnimationState.ACTIVE)) {
        shaderState.current = AnimationState.FADING_HEIGHT;
        fadeTimer.current = 0;
    }
    
    switch (shaderState.current) {
        case AnimationState.READY:
            break;

        case AnimationState.FADING_IN:
            activeTime.current += delta;
            customMaterial.uniforms.time.value = activeTime.current;
            
            fadeTimer.current += delta;
            let inProg = fadeTimer.current / CONFIG.fadeInDuration;
            
            if (inProg >= 1.0) {
                inProg = 1.0;
                shaderState.current = AnimationState.ACTIVE;
            }
            customMaterial.uniforms.opacity.value = inProg * CONFIG.baseOpacity;
            break;

        case AnimationState.ACTIVE:
            // Nieskończona pętla - fala po prostu gra
            activeTime.current += delta;
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
            // Opacity fade wygasa przez 1 sekundę
            let alphaProgress = fadeTimer.current / 1.0; 
            
            if (alphaProgress >= 1.0) {
                alphaProgress = 1.0;
                shaderState.current = AnimationState.READY;
            }
            customMaterial.uniforms.opacity.value = CONFIG.baseOpacity * (1.0 - alphaProgress);
            break;
    }
  });

  return (
    <group
      ref={meshRef}
      position={[tile.x + 0.5, 0, tile.y + 0.5]}
    >
      <primitive object={clonedScene} />
      <primitive object={overlayScene} />

      <group position={[0, 1.05, 0]}>
        <SparkleEffect tileId={tile.id} />
      </group>

      {tile.isStartMeta && <StartMetaParticles />}
    </group>
  );
};

Object.values(MODELS).forEach(path => useGLTF.preload(path));

export default Tile3D;