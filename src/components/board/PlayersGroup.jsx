import React, { useMemo } from 'react';
import { gameState } from '../../logic/gameState';
import PlayerPawn from '../PlayerPawn';

const PlayersGroup = ({ mapPath, onMovementEnd, v }) => {
  if (!mapPath || mapPath.length === 0) return null;

  // Renderujemy WSZYSTKICH graczy z listy
  return useMemo(() => {
    const tileCounts = {};
    return (
      <group>
        {gameState.players.map(p => {
          const tid = p.currentModuleId;
          if (tileCounts[tid] === undefined) tileCounts[tid] = 0;
          const currentIndex = tileCounts[tid]++;
          return (
            <PlayerPawn 
              key={`pawn-${p.id}`} 
              player={p} 
              mapPath={mapPath} 
              stackIndex={currentIndex} 
              onMovementEnd={onMovementEnd} 
            />
          );
        })}
      </group>
    );
  }, [v, mapPath, onMovementEnd]); // Kluczowe: v wymusza reaktywność
};

export default PlayersGroup;