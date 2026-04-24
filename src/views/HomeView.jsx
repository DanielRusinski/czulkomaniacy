import React from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/core/Button';

const HomeView = ({ onStart, onResume }) => {
  const hasSavedGame = !!localStorage.getItem('eco-quest-save');

  return (
    <div className="min-h-screen w-full bg-[#fdfcf0] flex flex-col items-center justify-center p-8 font-quicksand overflow-hidden relative">
      
      {/* ELEMENTY DEKORACYJNE W TLE */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        {[...Array(12)].map((_, i) => (
          <motion.span
            key={i}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3 + i, 
              delay: i * 0.2 
            }}
            className="absolute text-6xl"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          >
            {['🌱', '🌲', '🏔️', '🌊', '♻️', '🌍'][i % 6]}
          </motion.span>
        ))}
      </div>

      {/* GŁÓWNY KONTENER */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* LOGO / TYTUŁ */}
        <div className="relative mb-16">
          <motion.div
            initial={{ rotate: -5 }}
            animate={{ rotate: [-5, -3, -5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="bg-black border-4 border-black px-12 py-6 rounded-2xl shadow-[12px_12px_0px_0px_#ffc1cc]"
          >
            <h1 className="text-7xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-none">
              EKO<span className="text-bubblegum-pink">Wyprawa</span>
            </h1>
          </motion.div>
          
          <div className="absolute -bottom-4 -right-4 bg-bubblegum-yellow border-4 border-black px-4 py-1 rounded-lg shadow-[4px_4px_0px_0px_#000] rotate-6">
            <span className="text-xs font-black uppercase tracking-widest">Wersja 2026.1</span>
          </div>
        </div>

        {/* PANEL AKCJI */}
        <div className="bg-white border-4 border-black p-10 rounded-[40px] shadow-[15px_15px_0px_0px_#000] w-full max-w-md flex flex-col gap-6">
          <div className="text-center mb-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">System Operacyjny Bazy</p>
            <h2 className="text-xl font-black text-black uppercase italic">Menu Główne</h2>
          </div>

          <Button 
            variant="pink" 
            size="lg" 
            className="w-full text-xl py-6"
            onClick={onStart}
          >
            NOWA EKSPEDYCJA 🚀
          </Button>

          {hasSavedGame && (
            <Button 
              variant="blue" 
              size="lg" 
              className="w-full text-xl py-6"
              onClick={onResume}
            >
              KONTYNUUJ MISJĘ 💾
            </Button>
          )}

          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1 text-xs">O Projekcie</Button>
            <Button variant="ghost" className="flex-1 text-xs">Ranking</Button>
          </div>

          {/* STOPKA PANELU */}
          <div className="mt-4 pt-6 border-t-2 border-black/5 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wszystkie systemy sprawne</span>
          </div>
        </div>

        {/* DODATKOWE INFO */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] text-center"
        >
          Eko-Logic OS • Powered by Neobrutalism UI
        </motion.p>
      </motion.div>

    </div>
  );
};

export default HomeView;