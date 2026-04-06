import React from 'react';
import { motion } from 'framer-motion';
import { gameState } from '../logic/gameState';
import Panel from './ui/core/Panel';
import Button from './ui/core/Button';

const GameOverModal = ({ onRestart, onExit }) => {
  // Sortujemy graczy od największej liczby punktów
  const rankedPlayers = [...gameState.players].sort((a, b) => b.points - a.points);
  const winner = rankedPlayers[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md pointer-events-auto overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        className="w-full max-w-2xl my-auto"
      >
        <Panel title="Raport Końcowy Misji" icon="🏁" className="shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          
          {/* SEKCJA ZWYCIĘZCY */}
          <div className="text-center mb-10 relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-7xl mb-4"
            >
              🏆
            </motion.div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Dominacja Środowiskowa</h2>
            <div className="inline-block bg-bubblegum-yellow border-4 border-black px-10 py-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-4xl font-black text-black uppercase italic tracking-tighter">
                {winner.name}
              </span>
            </div>
            <p className="mt-4 text-xl font-bold text-black uppercase">
              Wynik końcowy: <span className="text-bubblegum-pink text-3xl font-black">{winner.points}</span> PKT
            </p>
          </div>

          {/* TABELA RANKINGOWA */}
          <div className="space-y-4 mb-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Klasyfikacja Jednostek:</h3>
            {rankedPlayers.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * idx }}
                className={`flex items-center gap-4 p-4 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="w-10 h-10 border-2 border-black rounded-lg flex items-center justify-center font-black bg-black text-white">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 border-2 border-black rounded-lg flex items-center justify-center text-2xl bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {p.icon}
                </div>
                <div className="flex-1">
                  <span className="font-black text-black uppercase italic">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black text-gray-400 uppercase">Punkty</span>
                  <span className="font-black text-xl">{p.points}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* PRZYCISKI AKCJI */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-black">
            <Button 
              variant="green" 
              className="flex-1" 
              onClick={onRestart}
            >
              RESTART SYMULACJI 🔄
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1" 
              onClick={onExit}
            >
              WYJŚCIE DO MENU 🏠
            </Button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
              Wszystkie dane zostały zarchiwizowane • Eko-Logic OS v3.0
            </span>
          </div>

        </Panel>
      </motion.div>
    </div>
  );
};

export default GameOverModal;