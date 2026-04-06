import React, { useCallback, useRef } from 'react';

/**
 * Główna funkcja generująca dźwięk.
 * Wyodrębniona, aby AudioManager mógł z niej korzystać w pętli useFrame.
 */
export const playXylophoneStep = (audioCtx, reverbNode) => {
  // 1. Zabezpieczenie przed niezaładowanym kontekstem
  if (!audioCtx || audioCtx.state === 'closed' || !reverbNode) {
    console.warn("🔇 Ksylofon: Brak AudioContext lub ReverbNode.");
    return;
  }

  // 2. Próba wybudzenia kontekstu (na wypadek uśpienia przez przeglądarkę)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // 3. Skala i losowanie
  const scale = [410, 490, 570, 650, 730];
  const randomIndex = Math.floor(Math.random() * scale.length);
  const selectedFreq = scale[randomIndex];

  // LOG DLA DEBUGOWANIA - zobaczysz to w konsoli F12
  console.log(`🎹 Ksylofon gra: ${selectedFreq}Hz`);

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // 4. Parametry brzmienia
  oscillator.type = 'triangle'; // triangle = drewniane brzmienie
  oscillator.frequency.setValueAtTime(selectedFreq, audioCtx.currentTime);

  // 5. Obwiednia (Atak -> Zanikanie)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

  // 6. Routing (Połączenia)
  oscillator.connect(gainNode);
  gainNode.connect(reverbNode); // Efekt pogłosu
  gainNode.connect(audioCtx.destination); // Czysty sygnał (dry)

  // 7. Start i Stop
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);

  return selectedFreq;
};

const XylophoneSound = ({ children }) => {
  const audioCtx = useRef(null);
  const reverbNode = useRef(null);

  /**
   * Inicjalizacja wewnętrzna dla komponentu (np. przy kliknięciu w "PLAY")
   */
  const setupInternalAudio = () => {
    if (!audioCtx.current) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioCtxClass();
      
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
      reverbNode.current.connect(audioCtx.current.destination);
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
      title="Kliknij, aby przetestować dźwięk ksylofonu"
    >
      {children || "Testuj Ksylofon"}
    </div>
  );
};

export default XylophoneSound;