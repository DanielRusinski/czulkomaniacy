import { useEffect, useRef } from 'react';

/**
 * Hook zarządzający płynnym śledzeniem pionka przez kamerę (scroll kontenera).
 * @param {number|string} currentModuleId - ID pola, na którym stoi gracz.
 * @param {Array} mapPath - Tablica obiektów pól mapy.
 * @param {number} triggerV - Licznik wersji stanu wymuszający aktualizację.
 */
export const useCamera = (currentModuleId, mapPath, triggerV) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Walidacja danych wejściowych (currentModuleId może być 0)
    if (currentModuleId === null || currentModuleId === undefined || !mapPath) return;

    const container = containerRef.current;
    if (!container) return;

    // 2. Znalezienie aktywnego pola (konwersja na String dla pewności porównania)
    const activeTile = mapPath.find(t => String(t.id) === String(currentModuleId));
    if (!activeTile) return;

    // 3. Stałe układu planszy (muszą być identyczne z CSS kontenera .board-grid)
    const CELL_SIZE = 60;
    const GAP = 4;
    const PADDING = 40; 

    // 4. Obliczanie współrzędnych lewego górnego rogu kafelka
    // Odejmujemy 1 od x/y, ponieważ koordynaty w mapData zazwyczaj zaczynają się od 1
    const tileLeft = PADDING + (activeTile.x - 1) * (CELL_SIZE + GAP);
    const tileTop = PADDING + (activeTile.y - 1) * (CELL_SIZE + GAP);
    
    // 5. Obliczanie fizycznej szerokości i wysokości pola (uwzględniając pola wielomodułowe)
    const w = activeTile.w || 1;
    const h = activeTile.h || 1;
    const tileWidth = w * CELL_SIZE + (w - 1) * GAP;
    const tileHeight = h * CELL_SIZE + (h - 1) * GAP;

    // 6. Wyznaczanie środka geometrycznego pola
    const tileCenterX = tileLeft + (tileWidth / 2);
    const tileCenterY = tileTop + (tileHeight / 2);

    // 7. Obliczanie docelowej pozycji przewinięcia (wyśrodkowanie w oknie)
    const scrollLeft = Math.max(0, tileCenterX - (container.clientWidth / 2));
    const scrollTop = Math.max(0, tileCenterY - (container.clientHeight / 2));

    /**
     * Skrócony timeout (50ms) pozwala na zakończenie re-renderu DOM 
     * przed wywołaniem scrolla. Jest to zsynchronizowane z pętlą ruchu 
     * w useGameLogic (450ms na krok), co daje efekt płynnego podążania 
     * kamery "krok w krok" za pionkiem.
     */
    const timeoutId = setTimeout(() => {
      try {
        container.scrollTo({
          left: scrollLeft,
          top: scrollTop,
          behavior: 'smooth'
        });
      } catch (err) {
        // Fallback dla starszych przeglądarek lub błędów DOM
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [currentModuleId, mapPath, triggerV]);

  return containerRef;
};