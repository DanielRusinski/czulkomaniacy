import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryMap = {
  "meadow": "Łąka",
  "forest": "Las",
  "mountains": "Góry",
  "lake": "Jezioro",
  "start-meta": "Start / Meta"
};

const ActiveTileHUD = ({ activePlayer, mapPath, onRollDice, diceState, disabledControls }) => {
  const currentTile = mapPath.find(t => t.id === activePlayer.currentModuleId);
  const { isRolling, isViewing, targetValue } = diceState;

  if (!currentTile) return null;

  const isButtonActive = !disabledControls && !isRolling && !isViewing;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-none">
      
      {/* --- PRZYCISK RZUTU (STYL NEOBRUTALIST) --- */}
      <motion.button
        whileHover={isButtonActive ? { y: -4, x: -4, boxShadow: "10px 10px 0px 0px #000" } : {}}
        whileTap={isButtonActive ? { y: 2, x: 2, boxShadow: "0px 0px 0px 0px #000" } : {}}
        onClick={onRollDice}
        disabled={!isButtonActive}
        className={`
          relative w-24 h-24 rounded-2xl border-4 border-black pointer-events-auto
          flex items-center justify-center transition-all duration-200
          ${isRolling ? 'bg-gray-200 shadow-none translate-y-1' : isViewing ? 'bg-bubblegum-pink' : 'bg-bubblegum-yellow'}
          ${isButtonActive ? 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer' : 'opacity-80 grayscale-[0.5]'}
        `}
      >
        <div className="relative z-10 flex flex-col items-center text-black">
          {isRolling ? (
            <motion.span 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 0.4, ease: "linear" }}
              className="text-5xl"
            >
              🎲
            </motion.span>
          ) : isViewing ? (
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Skok o</span>
              <span className="text-5xl font-black leading-none">{targetValue}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-5xl mb-1">🎲</span>
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Rzuć!</span>
            </div>
          )}
        </div>
      </motion.button>

      {/* --- PANEL INFORMACJI O POLU (NEOBRUTALIST PANEL) --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTile.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border-4 border-black px-6 py-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6 pointer-events-auto"
        >
          {/* Numer pola */}
          <div className="flex flex-col items-center border-r-2 border-black/10 pr-6">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-center">Lokalizacja</span>
            <span className="text-xl font-black text-black tracking-tighter leading-none italic uppercase">
              #{currentTile.id}
            </span>
          </div>
          
          {/* Nazwa strefy */}
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Obszar</span>
            <span className="text-lg font-black text-black leading-none tracking-tight uppercase italic">
                {categoryMap[currentTile.category] || currentTile.category}
            </span>
          </div>
          
          {/* Ikona typu pola */}
          <div className="w-12 h-12 bg-white border-3 border-black rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {currentTile.isBoss ? '👿' : currentTile.isPortal ? '🌀' : currentTile.isChance ? '⭐' : '📍'}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ActiveTileHUD;