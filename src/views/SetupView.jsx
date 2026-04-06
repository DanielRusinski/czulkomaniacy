import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/core/Button';
import Panel from '../components/ui/core/Panel';

const ICONS = ['🦊', '🐸', '🐨', '🐯', '🐼', '🦁', '🐷', '🐵'];
const COLORS = [
  '#ffc1cc', // Pink
  '#a2d2ff', // Blue
  '#b9fbc0', // Green
  '#fbf8cc', // Yellow
  '#cfbaf0', // Purple
  '#ffcfd2', // Coral
];

const SetupView = ({ onComplete }) => {
  const [players, setPlayers] = useState([
    { id: 1, name: 'Gracz 1', icon: '🦊', color: '#ffc1cc' },
    { id: 2, name: 'Gracz 2', icon: '🐸', color: '#a2d2ff' },
  ]);

  const addPlayer = () => {
    if (players.length < 4) {
      const nextId = players.length + 1;
      setPlayers([...players, { 
        id: nextId, 
        name: `Gracz ${nextId}`, 
        icon: ICONS[nextId % ICONS.length], 
        color: COLORS[nextId % COLORS.length] 
      }]);
    }
  };

  const removePlayer = (id) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id, field, value) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="min-h-screen w-full bg-[#fdfcf0] flex flex-col items-center justify-center p-6 font-quicksand overflow-y-auto">
      
      {/* NAGŁÓWEK */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-black text-black uppercase italic tracking-tighter leading-none mb-4">
          Przygotuj <span className="text-bubblegum-pink">Ekipę</span>
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
          Zdefiniuj parametry jednostek badawczych
        </p>
      </motion.div>

      {/* KARTY GRACZY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-12">
        <AnimatePresence>
          {players.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white border-4 border-black rounded-3xl p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative"
            >
              {/* Przycisk Usuń */}
              {players.length > 2 && (
                <button 
                  onClick={() => removePlayer(p.id)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white border-3 border-black rounded-full font-black hover:bg-red-400 transition-colors"
                >
                  ✕
                </button>
              )}

              <div className="flex flex-col gap-6">
                {/* Górna sekcja: Imię i Kolor */}
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-20 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Pseudonim Operacyjny</label>
                    <input 
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                      className="w-full bg-gray-50 border-3 border-black rounded-xl px-4 py-2 font-black uppercase italic tracking-tight focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Wybór Ikony */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Wybierz Awatara</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => updatePlayer(p.id, 'icon', icon)}
                        className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center transition-all ${p.icon === icon ? 'bg-black text-white scale-110 shadow-none' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wybór Koloru */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Paleta Identyfikacyjna</label>
                  <div className="flex gap-3">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updatePlayer(p.id, 'color', color)}
                        className={`w-8 h-8 rounded-full border-3 border-black transition-transform ${p.color === color ? 'scale-125' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Przycisk Dodaj Gracza */}
        {players.length < 4 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addPlayer}
            className="border-4 border-black border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-gray-400 hover:text-black hover:border-solid transition-all bg-black/5 min-h-[250px]"
          >
            <span className="text-5xl mb-2">+</span>
            <span className="font-black uppercase text-xs tracking-widest">Dodaj Eksploratora</span>
          </motion.button>
        )}
      </div>

      {/* STOPKA I START */}
      <div className="flex flex-col items-center gap-6">
        <Button 
          variant="pink" 
          size="lg" 
          className="px-24"
          onClick={() => onComplete(players)}
        >
          INICJUJ MISJĘ 🚀
        </Button>
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
          System gotowy do desantu
        </span>
      </div>

    </div>
  );
};

export default SetupView;