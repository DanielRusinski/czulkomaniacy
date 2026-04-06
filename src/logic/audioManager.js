class AudioManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;

    // Lista wymaganych dźwięków. Pliki muszą znajdować się w public/sounds/
    const soundFiles = {
      roll: '/sounds/roll.wav',       // Dźwięk turlania kostki
      step: '/sounds/step.mp3',       // Krótkie pyknięcie przy ruchu pionka
      success: '/sounds/success.mp3', // Poprawna odpowiedź
      error: '/sounds/error.mp3',     // Błędna odpowiedź / kara
      win: '/sounds/win.mp3',         // Fanfary na koniec gry
      click: '/sounds/click.wav',     // Standardowy klik w UI
      hover: '/sounds/hover.wav'      // Dźwięk najechania myszką
    };

    // Inicjalizacja obiektów Audio tylko po stronie klienta (window)
    if (typeof window !== 'undefined') {
      Object.entries(soundFiles).forEach(([key, path]) => {
        const audio = new Audio(path);
        audio.volume = 0.4;
        audio.preload = 'auto';
        this.sounds[key] = audio;
      });
    }
  }

  /**
   * Odtwarza dźwięk. Używa klonowania, aby dźwięki mogły na siebie nachodzić.
   */
  play(soundName) {
    if (this.isMuted) return;
    const sound = this.sounds[soundName];
    
    if (sound) {
      // Klonujemy węzeł, aby umożliwić polifonię (wiele razy ten sam dźwięk jednocześnie)
      const soundClone = sound.cloneNode();
      soundClone.volume = sound.volume;
      
      const playPromise = soundClone.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ciche ignorowanie (blokada autoplay przeglądarki)
        });
      }
    }
  }

  /**
   * Zmienia głośność wszystkich efektów (0.0 do 1.0)
   */
  setVolume(volume) {
    Object.values(this.sounds).forEach(s => {
      s.volume = volume;
    });
  }

  /**
   * Przełącza wyciszenie
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

// KLUCZOWE: Eksportujemy gotową instancję pod nazwą 'audioManager'
export const audioManager = new AudioManager();