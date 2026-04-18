import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameState } from '../logic/gameState';
import { playXylophoneStep } from './sounds/XylophoneSound';

const ZONE_AUDIO = {
  meadow: '/audio/meadow.mp3',
  forest: '/audio/forest.mp3',
  lake: '/audio/lake.mp3',
  mountains: '/audio/mountains.mp3',
  "start-meta": '/audio/start.mp3',
  darkness: '/audio/boss.mp3'
};

const AudioManager = ({ mapData }) => {
  const [activeTrack, setActiveTrack] = useState("start-meta");
  const audioRefs = useRef({});
  const synthContext = useRef(null);
  const synthReverb = useRef(null);
  const lastModuleIdRef = useRef(null);

  useEffect(() => {
    // 1. Ładowanie muzyki tła
    Object.entries(ZONE_AUDIO).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0;
      audioRefs.current[key] = audio;
    });

    const initSynth = () => {
      console.log("🖱️ Interakcja wykryta - inicjalizacja audio...");
      if (!synthContext.current) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        synthContext.current = new AudioCtxClass();
        
        const ctx = synthContext.current;
        synthReverb.current = ctx.createConvolver();
        
        const length = ctx.sampleRate * 1.5;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
          }
        }
        synthReverb.current.buffer = impulse;
        synthReverb.current.connect(ctx.destination);
      }

      if (synthContext.current.state === 'suspended') {
        synthContext.current.resume().then(() => {
          console.log("🔊 AudioContext AKTYWNY (running)");
        });
      }
    };

    window.addEventListener('mousedown', initSynth);
    window.addEventListener('touchstart', initSynth); // Dla telefonów

    return () => {
      window.removeEventListener('mousedown', initSynth);
      window.removeEventListener('touchstart', initSynth);
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = ""; });
    };
  }, []);

  useFrame(() => {
    // DIAGNOSTYKA 1: Czy useFrame w ogóle działa?
    // console.log("Frame tick"); // Odkomentuj tylko jeśli nic nie widzisz

    const player = gameState.players?.[gameState.currentPlayerIndex];
    if (!player) return;

    const currentPos = player.currentModuleId;

    // DIAGNOSTYKA 2: Czy pozycja się zmienia?
    if (lastModuleIdRef.current !== currentPos) {
      console.log(`📍 Zmiana pozycji: ${lastModuleIdRef.current} -> ${currentPos}`);
      
      // Wywołujemy ksylofon bez względu na stan (funkcja sama spróbuje zrobić resume)
      if (synthContext.current) {
         playXylophoneStep(synthContext.current, synthReverb.current);
      } else {
         console.warn("⚠️ Próba zagrania ksylofonu, ale synthContext jeszcze nie istnieje (kliknij w ekran!)");
      }
    }

    lastModuleIdRef.current = currentPos;

    // --- LOGIKA BGM (Muzyka) ---
    if (!mapData?.path) return;
    const currentTile = mapData.path.find(t => String(t.id) === String(currentPos));

    if (currentTile) {
      const targetZone = currentTile.isBoss ? "darkness" : currentTile.category;
      if (targetZone && targetZone !== activeTrack) {
        setActiveTrack(targetZone);
      }
    }

    const fadeSpeed = 0.01;
    Object.keys(audioRefs.current).forEach(key => {
      const audio = audioRefs.current[key];
      if (key === activeTrack) {
        if (audio.paused) audio.play().catch(() => {});
        if (audio.volume < 0.4) audio.volume = Math.min(0.4, audio.volume + fadeSpeed);
      } else {
        if (audio.volume > 0) {
          audio.volume = Math.max(0, audio.volume - fadeSpeed);
        } else if (!audio.paused) {
          audio.pause();
        }
      }
    });
  });

  return null;
};

export default AudioManager;