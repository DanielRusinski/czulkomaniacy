import confetti from 'canvas-confetti';

class VfxManager {
  constructor() {
    this.listeners = [];
    this.flashListeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeFlash(listener) {
    this.flashListeners.push(listener);
    return () => {
      this.flashListeners = this.flashListeners.filter(l => l !== listener);
    };
  }

  spawn(playerId, text, color = '#ffffff') {
    this.listeners.forEach(listener => listener({ playerId, text, color, id: Date.now() + Math.random() }));
  }

  triggerDamageFlash() {
    this.flashListeners.forEach(listener => listener(Date.now()));
  }

  // NOWE: Mały wystrzał po zwykłej odpowiedzi
  triggerSmallConfetti() {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: ['#ffc1cc', '#fbf8cc', '#cfbaf0', '#b9fbc0']
    });
  }

  // Ciągły wystrzał dla Bossa / Wygranej
  triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        zIndex: 9999,
        colors: ['#ffc1cc', '#fbf8cc', '#cfbaf0', '#b9fbc0']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        zIndex: 9999,
        colors: ['#ffc1cc', '#fbf8cc', '#cfbaf0', '#b9fbc0']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }
}

export const vfxManager = new VfxManager();