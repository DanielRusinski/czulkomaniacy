import React from 'react';
import { motion } from 'framer-motion';
import { gameState } from '../../logic/gameState';
import Button from './core/Button';

const GameHUD = ({ onOpenBase, onOpenSettings }) => {
  return (
    <div className="w-full lg:w-[380px] flex flex-col gap-6 text-left pointer-events-auto max-h-screen overflow-y-auto hide-scrollbar pb-10">
      
      {/* NAGŁÓWEK SYSTEMOWY */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-4 border-black rounded-2xl py-3 px-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center"
      >
        <h1 className="text-xl font-black text-black tracking-tighter uppercase italic leading-none">
          Eko<span className="text-bubblegum-pink">Wyprawa</span>
        </h1>
        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onOpenSettings}
          className="text-2xl cursor-pointer"
        >
          ⚙️
        </motion.button>
      </motion.div>
      
      {/* LISTA GRACZY */}
      <div className="flex flex-col gap-5">
        {gameState.players.map((p, idx) => {
          const isActive = gameState.getCurrentPlayer().id === p.id;
          const isDead = p.lives <= 0; // Poprawiono z p.health na p.lives zgodnie z modelem

          return (
            <motion.div 
              key={p.id}
              layout
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`
                relative bg-white border-4 border-black rounded-3xl transition-all duration-300
                ${isActive ? 'shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] -translate-y-1 z-20' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-90 z-10'}
                ${isDead ? 'grayscale opacity-60' : ''}
              `}
              style={{ backgroundColor: isActive ? '#fff' : '#fafafa' }}
            >
              <div 
                className="h-3 border-b-4 border-black rounded-t-[20px]" 
                style={{ backgroundColor: p.color }}
              />

              <div className="flex items-center gap-4 p-5 border-b-4 border-black">
                <div className="w-16 h-16 rounded-xl bg-white border-4 border-black flex items-center justify-center text-4xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {isDead ? '💀' : p.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Jednostka: {idx + 1}
                  </span>
                  <h3 className="font-black text-black text-2xl leading-tight tracking-tighter uppercase italic">{p.name}</h3>
                </div>
                {isActive && (
                  <div className="ml-auto bg-black text-white text-[8px] font-black px-3 py-1.5 rounded-lg animate-pulse uppercase tracking-tighter">
                    Aktywny
                  </div>
                )}
              </div>

              {/* Statystyki: Neobrutalist Grid (4 kolumny) */}
              <div className="grid grid-cols-4 bg-white border-b-4 border-black">
                <div className="p-3 flex flex-col items-center border-r-4 border-black">
                  <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Punkty</span>
                  <span className="text-xl font-black text-black leading-none">{p.points}</span>
                </div>
                <div className="p-3 flex flex-col items-center border-r-4 border-black">
                  <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Wiedza</span>
                  <span className="text-xl font-black text-black leading-none">{p.correctAnswers || 0}</span>
                </div>
                {/* NOWOŚĆ: Licznik Ruchów (Action Economy) */}
                <div className={`p-3 flex flex-col items-center border-r-4 border-black ${p.movesLeft > 1 ? 'bg-yellow-100' : ''}`}>
                  <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Ruchy</span>
                  <span className={`text-xl font-black leading-none ${p.movesLeft > 0 ? 'text-black' : 'text-red-500'}`}>
                    x{p.movesLeft}
                  </span>
                </div>
                <div className="p-3 flex flex-col items-center">
                  <span className="text-[8px] font-black text-gray-400 uppercase mb-1">HP</span>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2.5 h-2.5 rounded-full border-2 border-black ${i < p.lives ? 'bg-red-500' : 'bg-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-white rounded-b-3xl">
                <div className="flex -space-x-2">
                  {p.baseGrid.filter(c => c !== null).map((built, i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-xl"
                    >
                      {built.icon}
                    </div>
                  ))}
                  {p.baseGrid.filter(c => c !== null).length === 0 && (
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest pl-2">Pusta Baza</span>
                  )}
                </div>
                
                <Button 
                  variant={isActive && !isDead ? 'pink' : 'ghost'} 
                  size="sm"
                  disabled={!isActive || isDead}
                  onClick={() => onOpenBase(p)}
                  className="px-5"
                >
                  BAZA
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* DZIENNIK ZDARZEŃ */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="bg-black p-2 flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-bubblegum-pink animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Console_Output</span>
          </div>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto max-h-40 custom-scrollbar bg-gray-50">
          {gameState.logs.map((l, i) => (
            <motion.p 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className={`text-[11px] font-bold tracking-tight leading-snug ${i === 0 ? 'text-black' : 'text-gray-400'}`}
            >
              <span className="text-bubblegum-pink mr-2">❯</span>{l}
            </motion.p>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GameHUD;