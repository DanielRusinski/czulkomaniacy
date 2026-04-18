import React, { useEffect, useRef, useState } from 'react';

// --- STSTYLE (Zgodne z Twoim CSS) ---
const styles = {
  bg: '#B2B19F',
  stroke: '#001c1f',
  activeFill: 'rgba(0, 28, 31, 0.08)',
  confirm: 'rgba(80, 200, 120, 0.85)',
};

const UiCardSelector = () => {
  const trackRef = useRef(null);
  const itemsRef = useRef([]);
  
  // --- STATE DANYCH ---
  const [decks, setDecks] = useState({
    1: ['imgs/UI_1_001.svg', 'imgs/UI_1_002.svg', 'imgs/UI_1_003.svg'],
    2: ['imgs/UI_2_001.svg', 'imgs/UI_2_002.svg', 'imgs/UI_2_003.svg'],
    3: ['imgs/UI_3_001.svg'],
  });
  
  const [cursors, setCursors] = useState({ 1: 0, 2: 0, 3: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  // --- FIZYKA (Refs zapobiegają re-renderom w pętli animate) ---
  const physics = useRef({
    position: 0,
    velocity: 0,
    target: 0,
    RESPONSE: 0.92,
    DAMPING: 0.54,
    IMPULSE: 24,
    SNAP_POS_EPS: 0.5,
    SNAP_VEL_EPS: 0.5
  });

  // --- LOGIKA CENTROWANIA ---
  const recalcTarget = () => {
    if (!trackRef.current || !itemsRef.current[activeIndex]) return;
    const item = itemsRef.current[activeIndex];
    const trackRect = trackRef.current.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    
    // Obliczamy przesunięcie tak, aby środek itemu był na środku ekranu
    const newTarget = physics.current.position + (window.innerWidth / 2 - (itemRect.left + itemRect.width / 2));
    physics.current.target = newTarget;
  };

  // --- PĘTLA ANIMACJI ---
  useEffect(() => {
    let frameId;
    const animate = () => {
      const p = physics.current;
      const d = p.target - p.position;
      
      p.velocity += d * p.RESPONSE;
      p.velocity *= p.DAMPING;
      p.position += p.velocity;

      if (Math.abs(d) < p.SNAP_POS_EPS && Math.abs(p.velocity) < p.SNAP_VEL_EPS) {
        p.position = p.target;
        p.velocity = 0;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${p.position}px)`;
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Aktualizacja celu przy zmianie indeksu lub resize
  useEffect(() => {
    recalcTarget();
    window.addEventListener('resize', recalcTarget);
    return () => window.removeEventListener('resize', recalcTarget);
  }, [activeIndex]);

  // --- OBSŁUGA INPUTU ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const p = physics.current;

      // Strzałki
      if (e.key === 'ArrowRight' && activeIndex < 2) {
        setActiveIndex(prev => prev + 1);
        p.velocity -= p.IMPULSE;
      }
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
        p.velocity += p.IMPULSE;
      }

      // Skróty numeryczne
      if (['1', '2', '3'].includes(e.key)) {
        const targetIdx = Number(e.key) - 1;
        if (targetIdx !== activeIndex) {
          p.velocity += (targetIdx > activeIndex ? -p.IMPULSE : p.IMPULSE);
          setActiveIndex(targetIdx);
        }
      }

      // Spacja - Przełączanie karty wewnątrz decku
      if (e.code === 'Space') {
        const currentDeckKey = activeIndex + 1;
        if (decks[currentDeckKey].length > 1) {
          setCursors(prev => ({
            ...prev,
            [currentDeckKey]: (prev[currentDeckKey] + 1) % decks[currentDeckKey].length
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, decks]);

  // --- RENDER POMOCNICZY DLA ITEMÓW ---
  const getItemClass = (idx) => {
    const base = "relative border-[3px] border-[#001c1f] flex items-center justify-center transition-all duration-200 ";
    const active = idx === activeIndex ? "bg-[rgba(0,28,31,0.08)] opacity-100 scale-110" : "grayscale blur-[1.2px] opacity-35 scale-100";
    
    if (idx === 0) return base + active + " w-[26px] h-[26px] rounded-full";
    if (idx === 1) return base + active + " w-[52px] h-[26px] rounded-full";
    return base + active + " w-[78px] h-[26px] rounded-full";
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#B2B19F] overflow-hidden select-none">
      
      {/* Celownik (Crosshair) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-black/20 -translateX-1/2" />
        <div className="absolute top-1/2 left-0 h-[1px] w-full bg-black/20 -translateY-1/2" />
      </div>

      {/* Menu Viewport */}
      <div className="absolute bottom-20 w-full h-[180px] flex items-center justify-center z-20">
        <div 
          ref={trackRef} 
          className="flex gap-[6px] will-change-transform"
        >
          {[1, 2, 3].map((num, i) => (
            <div 
              key={num}
              ref={el => itemsRef.current[i] = el}
              className={getItemClass(i)}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {decks[num].length > 0 && (
                  <img 
                    src={decks[num][cursors[num]]} 
                    className="w-full h-full object-contain p-1"
                    alt={`card-${num}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Debug/Klawisze (Opcjonalne) */}
      <div className="absolute bottom-4 w-full text-center text-[#001c1f]/40 text-[10px] uppercase tracking-widest">
        Arrows / 1-2-3 to Align • Space to Cycle Cards
      </div>
    </div>
  );
};

export default UiCardSelector;