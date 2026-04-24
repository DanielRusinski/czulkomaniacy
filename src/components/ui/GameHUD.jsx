import React from 'react';
import { motion } from 'framer-motion';
import { gameState } from '../../logic/gameState';

const GameHUD = ({ onOpenBase, onOpenSettings }) => {
  const currentPlayerId = gameState.getCurrentPlayer()?.id;

  const rainbowColors = [
    '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8b00ff'
  ];

  return (
    <div key={currentPlayerId} className="w-full lg:w-[350px] flex flex-col gap-4 text-left pointer-events-auto max-h-screen overflow-y-auto hide-scrollbar pb-6 px-3 relative z-10">
      
      <style>{`
        :root {
          --btn1-grad1: #38bdf8;
          --btn1-grad2: #34d399;
          --btn1-depth: #0284c7;
        }

        .glossy-stepper-btn {
          width: 38px; 
          height: 38px; 
          border-radius: 14px;
          background-image: radial-gradient(circle at 30% 25%, rgba(255,255,255,.40), rgba(255,255,255,.05) 60%),
                          linear-gradient(135deg, color-mix(in srgb, var(--btn1-grad1) 90%, transparent), color-mix(in srgb, var(--btn1-grad2) 75%, transparent));
          background-size: calc(100% + 2px) calc(100% + 2px);
          background-position: center;
          border: 1px solid rgba(255,255,255,.14);
          cursor: pointer;
          position: relative;
          z-index: 2;
          outline: none;
          box-shadow: 0 1px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 3px 0 var(--btn1-depth), 0 4px 0 var(--btn1-depth), 0 5px 0 var(--btn1-depth), 0 6px 0 var(--btn1-depth), 0 12px 15px rgba(0, 0, 0, 0.4);
          transition: transform 0.05s ease, box-shadow 0.05s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: white;
        }

        .glossy-stepper-btn:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 2px 0 var(--btn1-depth), 0 5px 8px rgba(0, 0, 0, 0.4);
        }

        .glossy-stepper-btn:disabled {
          filter: grayscale(1);
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Klasa dla ostrego, delikatnego, przezroczystego cienia tekstu */
        .sharp-text-shadow {
          text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
        }
      `}</style>
      
      {/* HEADER SYSTEMOWY */}
      <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-xl py-3 px-4 flex justify-between items-center shadow-lg">
        <h1 className="text-base font-black text-white uppercase italic tracking-tighter sharp-text-shadow">
          Eko<span className="text-blue-400">Wyprawa</span>
        </h1>
        <button onClick={onOpenSettings} className="text-xl hover:scale-110 transition-transform opacity-70 hover:opacity-100 sharp-text-shadow">⚙️</button>
      </div>
      
      {/* LISTA GRACZY */}
      <div className="flex flex-col gap-10 pt-10">
        {gameState.players.map((p, idx) => {
          const isActive = currentPlayerId === p.id;
          const isDead = p.lives <= 0;

          return (
            <motion.div 
              key={`${p.id}-${isActive}`}
              className={`flex flex-col transition-all duration-500 relative ${isActive ? 'opacity-100 z-10' : 'opacity-60'}`}
            >
              {/* HEADER: KULA + IMIĘ + PRZYCISK */}
              <div className="flex items-center justify-between px-2 pb-3 relative w-full">
                <div className="flex items-center gap-3 flex-grow pr-4 min-w-0">
                  {isActive && (
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1], backgroundColor: rainbowColors, boxShadow: ['0 0 5px #ff0000', '0 0 15px #00ff00', '0 0 5px #0000ff', '0 0 5px #ff0000'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-[2px] border-white shrink-0"
                    />
                  )}
                  <div className="flex flex-col min-w-0 overflow-visible">
                    <h3 className="font-black text-white text-lg uppercase leading-none pr-2 truncate sharp-text-shadow">
                      {p.name}
                    </h3>
                  </div>
                </div>

                <div className="relative z-30 translate-y-5 mr-3">
                  <button disabled={!isActive || isDead} onClick={() => onOpenBase(p)} className="glossy-stepper-btn sharp-text-shadow">B</button>
                </div>
              </div>

              {/* KAPSULA STATYSTYK */}
              <div style={{ backgroundColor: '#FDE08D' }} className="relative border-[3px] border-white rounded-[24px] grid grid-cols-[100px_1fr] overflow-visible z-10 shadow-lg">
                <div className="absolute -top-12 -left-6 z-20 pointer-events-none">
                  <div className="text-[110px] drop-shadow-[0_15px_20px_rgba(0,0,0,0.5)] select-none relative">
                    {isDead ? '💀' : p.icon}
                  </div>
                </div>

                <div className="w-[100px] h-[100px]" />

                {/* GRID STATS - Kolor na #a67c52 + dodany ostry cień */}
                <div className="flex flex-col relative bg-transparent pr-4" style={{ color: '#a67c52' }}>
                  <div className="flex border-b border-white/40 h-full">
                    <div className="flex-1 py-3 flex flex-col items-center border-r border-white/40">
                      <span className="text-[10px] font-bold opacity-60 uppercase leading-none mb-1 sharp-text-shadow">Pts</span>
                      <span className="text-xl font-black leading-none sharp-text-shadow">{p.points}</span>
                    </div>
                    <div className="flex-1 py-3 flex flex-col items-center">
                      <span className="text-[10px] font-bold opacity-60 uppercase leading-none mb-1 sharp-text-shadow">Int</span>
                      <span className="text-xl font-black leading-none sharp-text-shadow">{p.correctAnswers || 0}</span>
                    </div>
                  </div>
                  <div className="flex h-full">
                    <div className="flex-1 py-3 flex flex-col items-center border-r border-white/40">
                      <span className="text-[10px] font-bold opacity-60 uppercase leading-none mb-1 sharp-text-shadow">Mvs</span>
                      <span className="text-xl font-black leading-none sharp-text-shadow">x{p.movesLeft}</span>
                    </div>
                    <div className="flex-1 py-3 flex flex-col items-center justify-center gap-1">
                      {/* HP ZOSTAJE CZERWONE, cień też dodany */}
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter leading-none mb-0.5 sharp-text-shadow">HP</span>
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full border border-black/5 ${i < p.lives ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-black/10'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STOPKA: PLACEHOLDERY */}
              <div className="p-3 pt-0 flex flex-col items-center relative">
                <div className="grid grid-cols-9 gap-1.5 w-full -mt-4 relative z-20 px-2">
                  {[...Array(9)].map((_, i) => {
                    const built = p.baseGrid[i];
                    return (
                      <div key={i} className={`aspect-square rounded-lg border backdrop-blur-md flex items-center justify-center text-sm transition-all ${built ? 'bg-white/30 border-white/50' : 'bg-white/10 border-white/30 shadow-sm'}`}>
                        {built ? <span className="drop-shadow-sm sharp-text-shadow">{built.icon}</span> : <div className="w-1 h-1 rounded-full bg-white/20" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GameHUD;