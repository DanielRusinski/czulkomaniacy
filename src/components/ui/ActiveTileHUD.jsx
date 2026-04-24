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

  // Definicja stylów glossy dla przycisku
  const buttonStyles = {
    base: 'linear-gradient(135deg, color-mix(in srgb, #38bdf8 90%, transparent), color-mix(in srgb, #34d399 75%, transparent))',
    viewing: 'linear-gradient(135deg, color-mix(in srgb, #fb7185 85%, transparent), color-mix(in srgb, #fbbf24 75%, transparent))',
    depthBlue: '#0284c7',
    depthRose: '#be123c',
    reflection: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,.40), rgba(255,255,255,.05) 60%)'
  };

  const currentDepth = isViewing ? buttonStyles.depthRose : buttonStyles.depthBlue;
  
  const shadowNormal = `0 1px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 3px 0 ${currentDepth}, 0 4px 0 ${currentDepth}, 0 5px 0 ${currentDepth}, 0 6px 0 ${currentDepth}, 0 12px 15px rgba(0, 0, 0, 0.4)`;
  const shadowActive = `0 1px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 2px 0 ${currentDepth}, 0 5px 8px rgba(0, 0, 0, 0.4)`;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-6 pointer-events-none">
      
      {/* --- PRZYCISK RZUTU (GLOSSY STEPPER STYLE) --- */}
      <motion.button
        whileHover={isButtonActive ? { scale: 1.05, y: -2 } : {}}
        whileTap={isButtonActive ? { y: 4, boxShadow: shadowActive } : {}}
        onClick={onRollDice}
        disabled={!isButtonActive}
        style={{
          backgroundImage: `${buttonStyles.reflection}, ${isViewing ? buttonStyles.viewing : buttonStyles.base}`,
          boxShadow: isRolling ? 'none' : shadowNormal,
          backgroundSize: 'calc(100% + 2px) calc(100% + 2px)',
          backgroundPosition: 'center',
        }}
        className={`
          relative w-24 h-24 rounded-[24px] border border-white/20 pointer-events-auto
          flex items-center justify-center transition-all duration-200
          ${isRolling ? 'opacity-90 translate-y-2' : ''}
          ${isButtonActive ? 'cursor-pointer' : 'opacity-50 grayscale-[0.3]'}
        `}
      >
        <div className="relative z-10 flex flex-col items-center text-white drop-shadow-md">
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
              <span className="text-[10px] font-bold uppercase tracking-tighter leading-none mb-1 opacity-80">Skok o</span>
              <span className="text-5xl font-black leading-none">{targetValue}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-5xl mb-1">🎲</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Rzuć!</span>
            </div>
          )}
        </div>
      </motion.button>

      {/* --- PANEL INFORMACJI O POLU (GLOSSY PANEL) --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTile.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-6 pointer-events-auto"
        >
          {/* Numer pola */}
          <div className="flex flex-col items-center border-r border-white/10 pr-6">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Lokalizacja</span>
            <span className="text-xl font-bold text-white tracking-tighter leading-none italic uppercase">
              #{currentTile.id}
            </span>
          </div>
          
          {/* Nazwa strefy */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Obszar</span>
            <span className="text-lg font-bold text-white leading-none tracking-tight uppercase italic drop-shadow-sm">
                {categoryMap[currentTile.category] || currentTile.category}
            </span>
          </div>
          
          {/* Ikona typu pola (Inner Gloss) */}
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
            {currentTile.isBoss ? '👿' : currentTile.isPortal ? '🌀' : currentTile.isChance ? '⭐' : '📍'}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ActiveTileHUD;