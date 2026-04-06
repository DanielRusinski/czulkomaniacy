import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { resourcePrices, buildableElements } from '../config/gameConfig';
import { gameState } from '../logic/gameState';

// Ścieżki dopasowane do struktury src/views/ -> src/components/
import Button from '../components/ui/core/Button';
import Panel from '../components/ui/core/Panel';
import StatBadge from '../components/ui/core/StatBadge';

const BaseView = ({ player, onBack, forceUpdate }) => {
  const [selectedElement, setSelectedElement] = useState(null);

  const handleBuild = (i) => {
    if (selectedElement && gameState.buildElement(i, selectedElement)) {
      setSelectedElement(null);
      forceUpdate();
    }
  };

  const handleBuy = (res, price) => {
    if (gameState.buyResource(res, price)) {
      forceUpdate();
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-bubblegum-cream p-8 overflow-hidden">
      <div className="relative w-full max-w-6xl h-[85vh]">
        
        {/* PRZYCISK WYJŚCIA (X) */}
        <button 
          onClick={onBack}
          className="absolute -top-4 -right-4 z-50 w-12 h-12 bg-white border-4 border-bubblegum-pink text-bubblegum-pink rounded-full font-black text-xl shadow-xl hover:scale-110 hover:bg-bubblegum-pink hover:text-white transition-all flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        <Panel 
          title={`Baza: ${player.name}`} 
          icon={player.icon}
          className="w-full h-full flex flex-col"
        >
          <div className="flex gap-10 h-full items-stretch overflow-hidden">
            
            {/* LEWA: POWIĘKSZONY MAGAZYN */}
            <div className="w-1/4 flex flex-col justify-between border-r-4 border-gray-50 pr-6 pb-4">
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest shrink-0">Magazyn Surowców</h3>
                
                {/* Zwiększona wysokość przewijania (60vh) */}
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {Object.entries(player.resources).map(([res, val]) => {
                    const price = resourcePrices[res];
                    const canBuy = player.points >= price;
                    return (
                      <div key={res} className="bg-gray-50 p-3 rounded-[24px] border-2 border-white shadow-sm shrink-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-gray-700 uppercase text-[10px]">{res}</span>
                          <span className="font-black text-lg text-bubblegum-blue leading-none">{val}</span>
                        </div>
                        <Button 
                          variant="yellow" 
                          size="sm" 
                          className="w-full text-[9px] py-1.5 h-auto"
                          disabled={!canBuy}
                          onClick={() => handleBuy(res, price)}
                        >
                          KUP ({price} PKT)
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 shrink-0">
                <StatBadge 
                  label="Twoje Środki" 
                  value={`${player.points} PKT`} 
                  icon="✨" 
                  color="pink" 
                />
              </div>
            </div>

            {/* ŚRODEK: SIATKA BAZY (Zrównana pośrodku) */}
            <div className="flex-1 flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-700 tracking-tighter uppercase italic">Sektory Budowy</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kliknij w pole, aby postawić konstrukcję</p>
              </div>

              <div className="grid grid-cols-3 grid-rows-3 gap-4 p-8 bg-gray-50 rounded-[50px] shadow-inner border-4 border-white">
                {player.baseGrid.map((cell, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={selectedElement && !cell ? { scale: 1.05 } : {}}
                    onClick={() => handleBuild(i)} 
                    className={`w-24 h-24 lg:w-28 lg:h-28 bg-white border-4 rounded-[30px] flex items-center justify-center text-5xl transition-all shadow-sm ${
                      selectedElement && !cell 
                        ? 'border-bubblegum-pink border-dashed cursor-pointer bg-pink-50 animate-pulse' 
                        : 'border-white'
                    }`}
                  >
                    {cell ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        {cell.icon}
                      </motion.span>
                    ) : (
                      <span className="text-gray-100 font-black opacity-20">{selectedElement ? '?' : '+'}</span>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <Button variant="blue" onClick={onBack} className="mt-8 px-12">
                POWRÓT DO EKSPLORACJI
              </Button>
            </div>

            {/* PRAWA: DOSTĘPNE BUDOWLE */}
            <div className="w-1/4 border-l-4 border-gray-50 pl-6 flex flex-col h-full overflow-hidden">
              <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-4 text-center shrink-0">Schematy</h3>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {buildableElements.map((el) => {
                  const canAfford = Object.keys(el.cost).every(res => player.resources[res] >= el.cost[res]);
                  const isAlreadyBuilt = player.baseGrid.some(cell => cell !== null && cell.type === el.type);
                  const isSelected = selectedElement?.type === el.type;

                  return (
                    <button 
                      key={el.type} 
                      onClick={() => setSelectedElement(el)} 
                      disabled={!canAfford || isAlreadyBuilt}
                      className={`
                        w-full p-4 rounded-[24px] border-4 text-left transition-all relative overflow-hidden shrink-0
                        ${isSelected ? 'border-bubblegum-pink bg-pink-50 shadow-md scale-[1.02]' : 'bg-white border-white shadow-sm'} 
                        ${(isAlreadyBuilt || !canAfford) ? 'opacity-50 grayscale' : 'hover:border-bubblegum-blue hover:scale-[1.02]'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{el.icon}</span>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase leading-tight ${isAlreadyBuilt ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {el.label}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase leading-none">
                            {isAlreadyBuilt 
                              ? "✅ OPERACYJNY" 
                              : Object.entries(el.cost).map(([k,v])=> `${v}x ${k}`).join(' ')}
                          </p>
                        </div>
                      </div>
                      {isSelected && <div className="absolute top-0 right-0 w-2 h-full bg-bubblegum-pink" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
};

export default BaseView;