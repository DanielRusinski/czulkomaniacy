import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/bubblegum.css';

// Widoki
import HomeView from './views/HomeView';
import SetupView from './views/SetupView';

// Komponenty UI
import GameHUD from './components/ui/GameHUD';
import ActiveTileHUD from './components/ui/ActiveTileHUD';
import TurnIndicator from './components/ui/TurnIndicator';
import ModalsLayer from './components/ModalsLayer';
import UiTurns from './components/ui/uiTurns_ss';

// Plansza 3D
import Board3D from './components/Board3D';

// Developer
import FpsStats from './components/developer/FpsStats'; // Import licznika FPS

// Logika
import { gameState } from './logic/gameState';
import { generateMap } from './logic/mapGenerator';
import { audioManager } from './logic/audioManager';
import { useGameLogic, GAME_PHASES } from './hooks/useGameLogic';

function App() {
  const mapData = useMemo(() => generateMap(), []);
  const [gameStateView, setGameStateView] = useState('home'); 
  const [activeBasePlayer, setActiveBasePlayer] = useState(null);
  
  const gameLogic = useGameLogic(mapData);
  const { states, actions } = gameLogic;

  useEffect(() => {
    const isPlaying = gameStateView === 'game' || gameStateView === 'base' || gameStateView === 'settings';
    if (isPlaying && gameState.saveToStorage) {
      gameState.saveToStorage();
    }
  }, [states.v, gameStateView]);

  if (gameStateView === 'home') return (
    <HomeView 
      onStart={() => { 
        audioManager.play('click');
        if (gameState.clearStorage) gameState.clearStorage(); 
        setGameStateView('setup'); 
      }} 
      onResume={() => {
        audioManager.play('click');
        if (gameState.loadFromStorage && gameState.loadFromStorage()) {
          setGameStateView('game');
          gameLogic.setters.setV(v => v + 1);
        }
      }}
    />
  );
  
  if (gameStateView === 'setup') return (
    <SetupView onComplete={(players) => {
      audioManager.play('click');
      gameState.initGame(players);
      setGameStateView('game');
      gameLogic.setters.setV(v => v + 1);
    }} />
  );

  const currentPlayer = gameState.getCurrentPlayer();
  const controlsDisabled = 
    states.gamePhase !== GAME_PHASES.IDLE || 
    (currentPlayer && currentPlayer.movesLeft <= 0) ||
    !!states.turnNotification ||
    !!states.deckAlert || 
    gameState.isGameOver;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f0f9ff] font-quicksand">
      {/* Licznik FPS - renderuje się globalnie */}
      <FpsStats />

      <UiTurns />
      <TurnIndicator activePlayer={currentPlayer} />

      <Board3D 
        mapData={mapData} 
        activePlayer={currentPlayer} 
        onPlayerMoveComplete={actions.handleMoveComplete}
        v={states.v} 
      />

      <AnimatePresence>
        {states.turnNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-lg border-[6px] border-[#5d9cec] p-10 rounded-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] text-center max-w-lg mx-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-7xl mb-5"
              >
                {currentPlayer?.icon || '👤'}
              </motion.div>
              <h2 className="text-4xl font-black text-[#5d9cec] mb-3 uppercase tracking-tight italic">
                {states.turnNotification.name}
              </h2>
              <p className="text-2xl font-bold text-slate-600 leading-tight">
                {states.turnNotification.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ActiveTileHUD 
        activePlayer={currentPlayer} 
        mapPath={mapData.path} 
        onRollDice={actions.roll}
        diceState={{ 
          isRolling: states.isDiceRolling, 
          isViewing: states.isViewingDice, 
          targetValue: states.diceResult 
        }}
        disabledControls={controlsDisabled}
      />
      
      <div className="absolute inset-0 z-10 p-8 flex flex-col lg:flex-row gap-10 items-start pointer-events-none">
        <GameHUD 
          onOpenBase={(p) => { 
            audioManager.play('click');
            setActiveBasePlayer(p); 
            setGameStateView('base'); 
          }}
          onOpenSettings={() => {
            audioManager.play('click');
            setGameStateView('settings');
          }}
        />
      </div>

      <ModalsLayer 
        gameStateView={gameStateView} 
        setGameStateView={setGameStateView} 
        activeBasePlayer={activeBasePlayer} 
        logic={gameLogic} 
      />
    </div>
  );
}

export default App;