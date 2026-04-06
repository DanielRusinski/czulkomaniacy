import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import StartMetaParticles from './particles/StartMetaParticles';
// Importujemy SparkleEffect z Twojej lokalizacji (src/effects)
import SparkleEffect from '../effects/SparkleEffect';

// --- GLOBALNY SYNTEZATOR (Singleton) ---
let globalAudioCtx = null;
let globalReverb = null;

const initSynth = () => {
  if (globalAudioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  globalAudioCtx = new AudioContextClass();

  // Konfiguracja pogłosu
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

// Funkcja grająca, którą wywołamy przy lądowaniu
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
  standard:  '/models/boxy.glb',
  startMeta: '/models/smBoxy.glb',
  boss:      '/models/bBoxy.glb',
  special:   '/models/boxy.glb',
  zoneEnd:   '/models/ezBoxy.glb',
};

const HIGHLIGHT_COLOR = new THREE.Color('#ffffff');
const HIGHLIGHT_INTENSITY = 1.8; 
const ANIM_SPEED = 6.0; 

const Tile3D = ({ tile, onHover }) => {
  const meshRef = useRef();
  const hoverFactor = useRef(0);
  const isAnimating = useRef(false);
  const phase = useRef('up');
  
  const models = useGLTF([
    MODELS.standard,
    MODELS.startMeta,
    MODELS.boss,
    MODELS.special,
    MODELS.zoneEnd
  ]);

  useEffect(() => {
    const handleLanding = (e) => {
      if (String(e.detail.tileId) === String(tile.id)) {
        // 1. Graj dźwięk ksylofonu
        playXylophone(); 

        // 2. Uruchom animację wizualną (flash/press)
        if (!isAnimating.current) {
          isAnimating.current = true;
          phase.current = 'up';
        }
      }
    };

    window.addEventListener('tile-landed', handleLanding);
    window.addEventListener('mousedown', initSynth, { once: true });

    return () => {
      window.removeEventListener('tile-landed', handleLanding);
      window.removeEventListener('mousedown', initSynth);
    };
  }, [tile.id]);

  const clonedScene = useMemo(() => {
    let selectedScene;
    if (tile.isBoss) selectedScene = models[2].scene;
    else if (tile.isZoneEnd) selectedScene = models[4].scene;
    else if (tile.isStartMeta) selectedScene = models[1].scene;
    else if (tile.isChance || tile.isPortal || tile.type === 'special') selectedScene = models[3].scene;
    else selectedScene = models[0].scene;

    const clone = selectedScene.clone();
    clone.traverse((child) => {
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
    return clone;
  }, [models, tile]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

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
  });

  return (
    <group 
      ref={meshRef}
      position={[tile.x + 0.5, 0, tile.y + 0.5]}
    >
      <primitive object={clonedScene} />

      {/* Lokalny efekt iskier 3D dla każdego kafelka.
          Pozycja [0, 1.05, 0] umieszcza punkt startowy iskier dokładnie 
          na powierzchni kafelka.
      */}
      <group position={[0, 1.05, 0]}>
        <SparkleEffect tileId={tile.id} />
      </group>

      {tile.isStartMeta && <StartMetaParticles />}
    </group>
  );
};

Object.values(MODELS).forEach(path => useGLTF.preload(path));

export default Tile3D;