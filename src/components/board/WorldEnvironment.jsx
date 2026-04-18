import React, { Suspense, useMemo } from 'react';
import { getZoneConfig } from '../../config/environmentConfig';
import GameLights from '../GameLights';
import SceneEnvironment from '../SceneEnvironment';
import SystemUpperCloud from '../SystemUpperCloud';

// --- DODANO: Import managera mgły ---
import GlobalFog from '../GlobalFog'; // Upewnij się, że ścieżka importu jest poprawna

const WorldEnvironment = ({ activePlayer, mapData }) => {
  if (!mapData) return null;

  // Wyznaczamy konfigurację strefy na podstawie bieżącej lokalizacji gracza
  const zoneConfig = useMemo(() => {
    const currentTile = mapData.path.find(t => String(t.id) === String(activePlayer?.currentModuleId));
    const currentCategory = currentTile?.isBoss ? "darkness" : (currentTile?.category || "start-meta");
    return getZoneConfig(currentCategory);
  }, [mapData, activePlayer?.currentModuleId]);

  return (
    <>
      {/* Światła strefy */}
      <GameLights
        activePlayerId={activePlayer?.id}
        mapPath={mapData.path}
        config={zoneConfig.light}
      />

      {/* --- DODANO: Globalna Mgła --- */}
      <GlobalFog mapPath={mapData.path} />

      <Suspense fallback={null}>
        <SceneEnvironment activePlayerId={activePlayer?.id} mapPath={mapData.path} />
        
        <SystemUpperCloud 
          mapData={mapData} 
          activePlayer={activePlayer} 
          baseHeight={8} 
          cloudCount={5} 
        />
      </Suspense>
    </>
  );
};

export default WorldEnvironment;