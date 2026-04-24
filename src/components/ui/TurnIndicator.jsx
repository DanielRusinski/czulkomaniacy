import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TurnIndicator = ({ activePlayer }) => {
  if (!activePlayer) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none pt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={activePlayer.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          className="flex items-center gap-4 bg-white border-4 border-black px-8 py-3 rounded-2xl shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Ozdobny "nit" po lewej */}
          <div className="w-2 h-2 bg-black rounded-full opacity-20" />

          {/* Ikona gracza w neobrutalistycznej ramce */}
          <div 
            className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            style={{ backgroundColor: activePlayer.color }}
          >
            {activePlayer.icon}
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-1">
              Aktualna Operacja
            </span>
            <h2 className="text-xl font-black text-black tracking-tighter leading-none italic uppercase">
              Tura: {activePlayer.name}
            </h2>
          </div>

          {/* Animowany wskaźnik aktywności (puls) */}
          <div className="ml-2 flex gap-1.5">
            <motion.div 
              animate={{ backgroundColor: ["#000", activePlayer.color, "#000"] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-4 border-2 border-black rounded-sm" 
            />
          </div>

          {/* Ozdobny "nit" po prawej */}
          <div className="w-2 h-2 bg-black rounded-full opacity-20" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TurnIndicator;