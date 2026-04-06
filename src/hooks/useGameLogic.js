import { useState, useCallback, useEffect } from 'react';
import { gameState } from '../logic/gameState';
import { audioManager } from '../logic/audioManager';
import { vfxManager } from '../logic/vfxManager';
import { actionManager } from '../logic/actionManager';

export const GAME_PHASES = {
  IDLE: 'IDLE',
  ROLLING: 'ROLLING',
  MOVING: 'MOVING',
  ACTION: 'ACTION',
  ANNOUNCING: 'ANNOUNCING' 
};

export const useGameLogic = (mapData) => {
  const [activeQ, setActiveQ] = useState(null);
  const [activeChance, setActiveChance] = useState(null);
  const [activeSecretPassage, setActiveSecretPassage] = useState(false);
  const [turnNotification, setTurnNotification] = useState(null);
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.IDLE);
  
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isViewingDice, setIsViewingDice] = useState(false);
  const [diceResult, setDiceResult] = useState(1);
  const [v, setV] = useState(0); 

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * SEKWENCJA KOŃCOWA TURY
   * Zaktualizowano: Dodano sprawdzenie isGameOver, aby nie ogłaszać nowej tury po zakończeniu gry.
   */
  const finalizeTurnSequence = async () => {
    // Jeśli gra się skończyła w międzyczasie, przerywamy sekwencję
    if (gameState.isGameOver) return;

    setGamePhase(GAME_PHASES.ANNOUNCING);
    
    gameState.nextTurn(); 
    const nextPlayer = gameState.getCurrentPlayer();
    
    setV(v => v + 1); 
    await wait(1200); 

    // Ponowne sprawdzenie przed wyświetleniem powiadomienia
    if (gameState.isGameOver) return;

    setTurnNotification({ 
      name: nextPlayer.name, 
      message: `Czas na turę ${nextPlayer.name}! Rzuć kostką lub sprawdź bazę.` 
    });

    await wait(2500); 
    
    setTurnNotification(null);
    setGamePhase(GAME_PHASES.IDLE);
  };

  /**
   * SPRAWDZENIE LICZNIKA RUCHÓW (Action Economy)
   * Zaktualizowano: Dodano blokadę kończącą logicę, jeśli gra jest zakończona.
   */
  const checkTurnEnd = async () => {
    // KLUCZOWA POPRAWKA: Jeśli gra jest zakończona, nie robimy nic (pozwalamy wyświetlić się GameOverModal)
    if (gameState.isGameOver) {
      setGamePhase(GAME_PHASES.IDLE);
      return;
    }

    const player = gameState.getCurrentPlayer();
    
    if (player.movesLeft > 0) {
      setGamePhase(GAME_PHASES.IDLE);
      gameState.addLog(`⚡ ${player.name} posiada jeszcze rzut (${player.movesLeft}).`);
      setV(v => v + 1);
    } else {
      await finalizeTurnSequence();
    }
  };

  const handleDiceComplete = useCallback(async () => {
    setIsDiceRolling(false);
    await wait(800);
    setIsViewingDice(false);
    
    setGamePhase(GAME_PHASES.MOVING);
    const maxTiles = mapData.path.length;
    
    for (let i = 0; i < diceResult; i++) {
      if (gameState.isGameOver) break; // Przerwij ruch, jeśli gra się skończyła
      gameState.movePlayer(1, maxTiles);
      setV(v => v + 1); 
      await wait(450);
    }

    if (gameState.isGameOver) {
      setGamePhase(GAME_PHASES.IDLE);
      return;
    }

    await wait(600);
    evaluateFieldAction(mapData.path[gameState.getCurrentPlayer().currentModuleId]);
  }, [diceResult, mapData]);

  const evaluateFieldAction = useCallback((tile) => {
    if (gameState.isGameOver) return;

    if (!tile || tile.category === "start-meta") {
      checkTurnEnd();
      return;
    }

    setGamePhase(GAME_PHASES.ACTION);

    if (tile.isBoss) {
      const bossQ = gameState.getNextBossQuestion();
      setActiveQ({ ...bossQ, isBoss: true });
    } else if (tile.isChance) {
      const chanceCard = gameState.getNextChanceCard();
      setActiveChance(chanceCard);
    } else {
      const q = gameState.getNextQuestion(tile.category);
      if (q) setActiveQ({ ...q, isBoss: false });
      else checkTurnEnd();
    }
  }, [checkTurnEnd]);

  const handleCloseQuestion = useCallback(async (correct) => {
    const player = gameState.getCurrentPlayer();
    
    actionManager.processQuestionResult(player, activeQ, correct);

    if (correct) {
      audioManager.play('success');
    } else {
      audioManager.play('error');
    }

    setActiveQ(null);
    setV(v => v + 1); 
    await wait(1500); 
    
    // Sprawdzenie tury po akcji (uwzględnia czy akcja nie zakończyła gry)
    await checkTurnEnd();
  }, [activeQ]);

  const roll = useCallback(() => {
    const player = gameState.getCurrentPlayer();
    if (gamePhase !== GAME_PHASES.IDLE || player.movesLeft <= 0 || gameState.isGameOver) return;
    
    player.movesLeft -= 1; 
    setGamePhase(GAME_PHASES.ROLLING);
    
    audioManager.play('roll');
    setDiceResult(Math.floor(Math.random() * 6) + 1);
    setIsDiceRolling(true); 
    setIsViewingDice(true);
    setV(v => v + 1);
  }, [gamePhase]);

  const handleCloseChance = useCallback(async () => {
    if (activeChance) {
      const player = gameState.getCurrentPlayer();
      actionManager.processChanceResult(player, activeChance);
    }
    setActiveChance(null);
    setV(v => v + 1);
    await wait(1000);
    await checkTurnEnd();
  }, [activeChance]);

  return {
    states: { 
      activeQ, activeChance, activeSecretPassage, 
      turnNotification, gamePhase, isDiceRolling, 
      isViewingDice, diceResult, v 
    },
    actions: { 
      roll, 
      handleDiceComplete, 
      handleCloseQuestion, 
      handleCloseChance,
      handleSecretPassageSelect: async (targetId) => {
        gameState.getCurrentPlayer().currentModuleId = targetId;
        setActiveSecretPassage(false);
        setV(v => v + 1);
        await wait(600);
        await checkTurnEnd();
      }
    },
    setters: { setV }
  };
};