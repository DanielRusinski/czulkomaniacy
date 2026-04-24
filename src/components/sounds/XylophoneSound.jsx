import React, { useCallback, useRef } from 'react';

/**
 * Główna funkcja generująca dźwięk ksylofonu.
 */
export const playXylophoneStep = (audioCtx, reverbNode) => {
  if (!audioCtx || audioCtx.state === 'closed' || !reverbNode) {
    console.warn("🔇 Ksylofon: Brak AudioContext lub ReverbNode.");
    return;
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Harmonijna skala Pentatoniczna C-dur (C5 - A5)
  // Częstotliwości: C5, D5, E5, G5, A5
  const scale = [523.25, 587.33, 659.25, 783.99, 880.00];
  const randomIndex = Math.floor(Math.random() * scale.length);
  const selectedFreq = scale[randomIndex];

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // 'triangle' jest świetny, ale 'sine' z szybkim atakiem jeszcze bardziej przypomina czysty ksylofon
  oscillator.type = 'triangle'; 
  oscillator.frequency.setValueAtTime(selectedFreq, audioCtx.currentTime);

  // Detune dodaje naturalności (lekki losowy "rozstroj")
  oscillator.detune.setValueAtTime(Math.random() * 10 - 5, audioCtx.currentTime);

  // Obwiednia (ADSR)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  // Szybki atak
  gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.005);
  // Dłuższe, naturalne wygasanie (Ksylofon drewniany)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

  oscillator.connect(gainNode);
  
  // Połączenie równoległe (Dry/Wet)
  gainNode.connect(audioCtx.destination); // Sygnał czysty
  gainNode.connect(reverbNode);           // Sygnał z pogłosem

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.7);

  return selectedFreq;
};

const XylophoneSound = ({ children }) => {
  const audioCtx = useRef(null);
  const reverbNode = useRef(null);

  const setupInternalAudio = () => {
    if (!audioCtx.current) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioCtxClass();
      
      // Tworzenie pogłosu
      reverbNode.current = audioCtx.current.createConvolver();
      const length = audioCtx.current.sampleRate * 1.5;
      const impulse = audioCtx.current.createBuffer(2, length, audioCtx.current.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
        }
      }
      reverbNode.current.buffer = impulse;
      
      // Gain dla samego pogłosu, aby nie zdominował dźwięku
      const reverbGain = audioCtx.current.createGain();
      reverbGain.gain.value = 0.3; 
      reverbNode.current.connect(reverbGain);
      reverbGain.connect(audioCtx.current.destination);
    }

    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const handlePlay = useCallback(() => {
    setupInternalAudio();
    playXylophoneStep(audioCtx.current, reverbNode.current);
  }, []);

  return (
    <div 
      onClick={handlePlay} 
      style={{ display: 'inline-block', cursor: 'pointer' }}
    >
      {children || "Testuj Ksylofon"}
    </div>
  );
};

export default XylophoneSound;