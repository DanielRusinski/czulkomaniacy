import React, { useState } from 'react';
import { CombatTextOverlay } from './CombatTextOverlay';
import { ENVIRONMENT_CONFIG, EnvironmentControls } from '../config/environmentConfig'; // Dodano EnvironmentControls
import { useBoardVisibility } from './board/useBoardVisibility';
import BoardScene from './board/BoardScene';

const Board3D = ({ mapData, activePlayer, onPlayerMoveComplete, v }) => {
  const [hoveredTile, setHoveredTile] = useState(null);
  const [, setMousePos] = useState({ x: 0, y: 0 });

  // Pobieranie danych o widoczności i aktualnej strefie
  const { 
    currentCategory, 
    zoneConfig, 
    visibleTiles, 
    isBossActive 
  } = useBoardVisibility(mapData, activePlayer);
  
  const vCfg = zoneConfig.vignette;
  const safeZoneColor = zoneConfig.color;

  if (!mapData || !mapData.path) return null;

  return (
    <div 
      className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-white" 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* 1. INTERAKTYWNE KONTROLKI ŚRODOWISKA (Panel Leva) */}
      <EnvironmentControls activeZone={currentCategory} />

      {/* 2. DYNAMICZNE TŁA STREF */}
      {Object.entries(ENVIRONMENT_CONFIG.zones).filter(([key]) => key !== 'default').map(([key, config]) => (
        <div
          key={key}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ background: config.background, opacity: currentCategory === key ? 1 : 0 }}
        />
      ))}

      {/* 3. SCENA 3D */}
      <BoardScene 
        mapData={mapData}
        activePlayer={activePlayer}
        visibleTiles={visibleTiles}
        zoneColor={safeZoneColor}
        isBossActive={isBossActive}
        onPlayerMoveComplete={onPlayerMoveComplete}
        setHoveredTile={setHoveredTile}
        v={v} 
      />

      {/* 4. WARSTWA WINIETY (Vignette) */}
      <div className="absolute inset-0 pointer-events-none z-20 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at center, transparent ${vCfg.radius}%, ${safeZoneColor} ${vCfg.radius + vCfg.softness}%, ${safeZoneColor} 100%)`,
        }}
      />

      {/* 5. NAKŁADKA TEKSTOWA WALKI */}
      <div className="absolute inset-0 pointer-events-none z-[60]">
        <CombatTextOverlay />
      </div>
    </div>
  );
};

export default Board3D;