import { gameState } from './gameState';
import { audioManager } from './audioManager';
import { vfxManager } from './vfxManager';

export const actionManager = {
  /**
   * Przetwarza wynik odpowiedzi na pytanie (Normalne lub Boss)
   */
  processQuestionResult(player, question, isCorrect) {
    if (!question) return;

    const idx = isCorrect ? 0 : 1;
    
    // Bezpieczne pobieranie wartości z tablic lub wartości domyślne
    // Jeśli parametr jest tablicą [0, 1], bierze odpowiedni indeks. 
    // Jeśli jest pojedynczą liczbą, bierze ją (dla sukcesu) lub 0 (dla porażki).
    const pointsChange = this._safeGet(question.points, idx, 0);
    const lifeChange = this._safeGet(question.life, idx, 0);
    const moveImpact = this._safeGet(question.movement_impact, idx, 0);

    this._applyChanges(player, pointsChange, lifeChange, moveImpact, isCorrect);
  },

  /**
   * Przetwarza natychmiastowy rezultat karty szansy
   */
  processChanceResult(player, card) {
    if (!card) return;
    
    this._applyChanges(
      player, 
      card.points || 0, 
      card.life || 0, 
      card.movement_impact || 0, 
      null 
    );
  },

  /**
   * Pomocnicza metoda do bezpiecznego wyciągania danych z JSONa
   */
  _safeGet(param, idx, defaultValue) {
    if (Array.isArray(param)) {
      return param[idx] !== undefined ? param[idx] : defaultValue;
    }
    // Jeśli to nie tablica, a liczba - zwróć ją tylko przy sukcesie (idx 0)
    if (typeof param === 'number') {
      return idx === 0 ? param : 0;
    }
    return defaultValue;
  },

  _applyChanges(player, pDelta, lDelta, mDelta, isCorrect) {
    if (!player) return;

    // 1. Punkty Wiedzy
    if (pDelta !== 0) {
      player.points = Math.max(0, player.points + pDelta);
      const color = pDelta > 0 ? '#4ade80' : '#f87171';
      vfxManager.spawn(player.id, `${pDelta > 0 ? '+' : ''}${pDelta} PKT`, color);
    }

    // 2. Punkty Życia
    if (lDelta !== 0) {
      player.lives = Math.min(3, Math.max(0, player.lives + lDelta));
      const color = lDelta > 0 ? '#fbbf24' : '#ef4444';
      vfxManager.spawn(player.id, `${lDelta > 0 ? '+' : ''}${lDelta} HP`, color);
      
      if (player.lives <= 0) gameState.checkSurvivalWin();
    }

    // 3. Movement Impact (Licznik rzutów/ruchów)
    if (mDelta !== 0) {
      player.movesLeft = Math.max(0, player.movesLeft + mDelta);
      
      if (mDelta > 0) {
        gameState.addLog(`🎁 Bonus! ${player.name} +${mDelta} rzut.`);
      } else {
        // Jeśli impact jest ujemny (np. -1 w szansie), resetujemy ruchy i pauzujemy
        player.movesLeft = 0;
        player.isSkippingTurn = true;
        gameState.addLog(`⏳ ${player.name} pauzuje.`);
      }
    }

    // Logowanie do konsoli gry
    if (isCorrect !== null) {
      const status = isCorrect ? "✅" : "❌";
      gameState.addLog(`${status} ${player.name}: ${pDelta} PKT, ${lDelta} HP, ${mDelta} RZUT.`);
    }
  }
};