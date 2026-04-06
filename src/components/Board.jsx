import React from 'react';
import { gameState } from '../logic/gameState';
import { useCamera } from '../hooks/useCamera'; 

const Board = ({ mapData, activePlayer, triggerV }) => {
  const { path, gridSize } = mapData;
  const containerRef = useCamera(activePlayer?.currentModuleId, path, triggerV);

  return (
    <div 
      ref={containerRef}
      className="game-board-container w-full h-full overflow-auto bg-bubblegum-cream rounded-[60px] shadow-inner border-[10px] border-white p-10"
    >
      <div 
        className="game-board-matrix"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 60px)`,
          gridTemplateRows: `repeat(${gridSize}, 60px)`,
          gap: '4px',
          width: 'max-content'
        }}
      >
        {path.map((tile) => {
          const playersHere = gameState.players.filter(p => p.currentModuleId === tile.id);
          const isSpecial = tile.isBoss || tile.isChance || tile.isPortal;

          return (
            <div 
              key={tile.id}
              id={`module-${tile.id}`}
              className={`module ${tile.category} ${isSpecial ? 'animate-pulse-slow shadow-xl z-20' : 'z-10'} relative`}
              style={{
                // Usunięto 'span', kafelki zajmują teraz domyślnie 1x1 komórkę
                gridColumnStart: tile.x,
                gridRowStart: tile.y,
              }}
            >
              {/* Pomocnicze ID i koordynaty - przydatne do weryfikacji siatki 1x1 */}
              <div className="absolute top-1 left-1 text-[8px] font-mono font-black text-black/40 leading-none z-50 pointer-events-none">
                {tile.id}<br/>{tile.x},{tile.y}
              </div>

              <span className="module-label">
                {tile.isBoss ? '👿' : tile.isPortal ? '🌀' : tile.isChance ? '⭐' : (tile.label || '')}
              </span>
              
              <div className="flex flex-wrap justify-center items-center gap-1 absolute w-full h-full p-1 pointer-events-none">
                {playersHere.map(p => (
                  <div 
                    key={p.id} 
                    className="player-token shadow-md animate-bounce" 
                    style={{ 
                      borderColor: p.color, 
                      backgroundColor: p.color, 
                      width: '18px', 
                      height: '18px' 
                    }} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;