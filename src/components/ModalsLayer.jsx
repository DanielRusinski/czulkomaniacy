import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Widoki i Modale
import BaseView from '../views/BaseView'; 
import QuestionModal from './QuestionModal';
import ChanceModal from './ChanceModal';
import SecretPassageModal from './SecretPassageModal';
import GameOverModal from './GameOverModal'; // Import nowego komponentu

// Komponenty UI
import DiceOverlay from './ui/DiceOverlay';
import Button from './ui/core/Button';
import Panel from './ui/core/Panel';

// Logika
import { gameState } from '../logic/gameState';
import { audioManager } from '../logic/audioManager';

const ModalsLayer = ({ gameStateView, setGameStateView, activeBasePlayer, logic }) => {
  const { states, setters, actions } = logic;
  const { 
    activeQ, activeChance, activeSecretPassage, deckAlert, 
    isDiceRolling, isViewingDice, diceResult 
  } = states;
  const { setDeckAlert, setV } = setters;
  const { 
    handleDiceComplete, handleCloseQuestion, handleCloseChance, handleSecretPassageSelect 
  } = actions;

  // Stan dla suwaków w panelu ustawień
  const [volumes, setVolumes] = useState({ master: 0.8, music: 0.5, sfx: 0.7 });

  return (
    <>
      {/* 1. PANEL USTAWIEŃ (NEOBRUTALIST) */}
      <AnimatePresence>
        {gameStateView === 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-md pointer-events-auto p-6"
          >
            <Panel title="Centrum Kontroli" icon="⚙️" className="w-full max-w-md shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Konfiguracja Systemu Audio</h4>
                  {['master', 'music', 'sfx'].map(type => (
                    <div key={type} className="flex flex-col gap-2">
                      <div className="flex justify-between text-[11px] font-black uppercase text-black">
                        <span>{type}</span>
                        <span>{Math.round(volumes[type] * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={volumes[type]}
                        onChange={(e) => setVolumes(prev => ({ ...prev, [type]: parseFloat(e.target.value) }))}
                        className="w-full h-4 bg-gray-100 border-2 border-black rounded-lg appearance-none cursor-pointer accent-bubblegum-pink"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t-4 border-black flex flex-col gap-4">
                  <Button variant="pink" size="md" onClick={() => setGameStateView('game')}>
                    ZAPISZ USTAWIENIA
                  </Button>
                  <button 
                    onClick={() => { if(confirm("TWARDY RESET? WSZYSTKIE DANE ZOSTANĄ USUNIĘTE.")) { localStorage.clear(); window.location.reload(); }}}
                    className="text-[10px] font-black text-red-500 hover:scale-105 uppercase tracking-widest transition-transform"
                  >
                    ☢️ WYCZYŚĆ PAMIĘĆ PODRĘCZNĄ
                  </button>
                </div>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAKŁADKA BAZY */}
      <AnimatePresence>
        {gameStateView === 'base' && activeBasePlayer && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[80] pointer-events-auto"
          >
            <BaseView 
              player={activeBasePlayer} 
              onBack={() => { audioManager.play('click'); setGameStateView('game'); }} 
              forceUpdate={() => { audioManager.play('success'); setV(v => v + 1); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. EKRAN KOŃCOWY (ZAAWANSOWANY) */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <GameOverModal 
            onRestart={() => {
              audioManager.play('click');
              if (gameState.clearStorage) gameState.clearStorage();
              window.location.reload();
            }}
            onExit={() => {
              audioManager.play('click');
              setGameStateView('home');
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>

      {/* 4. NAKŁADKA KOSTKI */}
      <AnimatePresence>
        {isViewingDice && (
          <DiceOverlay 
            key="diceoverlay"
            isRolling={isDiceRolling} 
            targetValue={diceResult} 
            onFinish={handleDiceComplete} 
          />
        )}
      </AnimatePresence>

      {/* 5. MODALE EVENTÓW */}
      <div className="relative z-[120]">
        <AnimatePresence>
          {deckAlert && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto p-6"
            >
              <Panel title="System Alert" icon="🔀" className="max-w-sm text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-black font-bold mb-8 leading-tight uppercase tracking-tighter italic">
                  {deckAlert}
                </p>
                <Button variant="pink" className="w-full" onClick={() => setDeckAlert(null)}>
                  ROZUMIEM
                </Button>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeQ && (
            <motion.div 
              key="qmodal" 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto fixed inset-0 z-[130]"
            >
              <QuestionModal 
                question={activeQ} 
                isBoss={activeQ.isBoss} 
                onClose={(corr) => handleCloseQuestion(corr, activeQ.id, activeQ.isBoss)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeChance && (
            <motion.div 
              key="cmodal" 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="pointer-events-auto fixed inset-0 z-[130]"
            >
              <ChanceModal card={activeChance} onClose={handleCloseChance} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSecretPassage && (
            <motion.div 
              key="smodal" 
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="pointer-events-auto fixed inset-0 z-[130]"
            >
              <SecretPassageModal onSelect={handleSecretPassageSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ModalsLayer;