import React, { Suspense, useMemo } from 'react';
import PathOrbs from '../PathOrbs';
import ItemManager from '../ItemManager';
import Tile3D from '../Tile3D';
import PlayersGroup from './PlayersGroup';
import TileLabelTextureCreator from '../TileLabelTextureCreator';
import TileLocalizationShader from '../TileLocalizationShader';

import MeadowEnvironment from '../zones/MeadowEnvironment';
import ForestEnvironment from '../zones/ForestEnvironment';

const WorldContent = ({ 
  mapData, 
  activePlayer, 
  visibleTiles, 
  zoneColor, 
  onPlayerMoveComplete, 
  setHoveredTile, 
  v 
}) => {
  if (!mapData || !mapData.path) return null;

  const labelTexture = useMemo(() => {
    const creator = new TileLabelTextureCreator(mapData.path.length);
    return creator.generate(mapData);
  }, [mapData]);

  const visibleCategories = useMemo(() => {
    return new Set(visibleTiles.map(t => t.isBoss ? "darkness" : t.category));
  }, [visibleTiles]);

  return (
    <group position={[-mapData.gridSize / 2, 0, -mapData.gridSize / 2]}>
      <Suspense fallback={null}>
        {/* WARSTWY ŚRODOWISKOWE */}
        {visibleCategories.has('meadow') && (
          <MeadowEnvironment mapData={mapData} activePlayer={activePlayer} />
        )}
        
        {visibleCategories.has('forest') && (
          <ForestEnvironment mapData={mapData} activePlayer={activePlayer} />
        )}
        
        <PathOrbs mapData={mapData} activePlayer={activePlayer} zoneColor={zoneColor} />
        <ItemManager mapData={mapData} visibleTiles={visibleTiles} />
      </Suspense>

      {/* KAFELKI ŚCIEŻKI GRY */}
      {visibleTiles.map((tile) => (
        <Tile3D key={tile.id} tile={tile} onHover={setHoveredTile} />
      ))}

      <PlayersGroup 
        mapPath={mapData.path} 
        onMovementEnd={onPlayerMoveComplete}
        v={v} 
      />

      {/* SYNCHRONIZACJA WIDOCZNOŚCI: Przekazujemy visibleTiles do shadera */}
      <Suspense fallback={null}>
        <TileLocalizationShader 
          mapData={mapData} 
          texture={labelTexture} 
          visibleTiles={visibleTiles} 
        />
      </Suspense>
    </group>
  );
};

export default WorldContent;