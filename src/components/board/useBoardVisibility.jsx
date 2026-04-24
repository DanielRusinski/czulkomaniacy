import { useMemo } from 'react';
import { getZoneConfig } from '../../config/environmentConfig';

export const useBoardVisibility = (mapData, activePlayer) => {
  const currentTile = useMemo(() =>
    mapData?.path?.find(t => String(t.id) === String(activePlayer?.currentModuleId)),
    [mapData, activePlayer?.currentModuleId]
  );

  const isBossActive = !!currentTile?.isBoss;
  const currentCategory = isBossActive ? "darkness" : (currentTile?.category || "start-meta");
  const zoneConfig = getZoneConfig(currentCategory);

  const visibleTiles = useMemo(() => {
    if (!currentTile || !mapData?.path) return mapData?.path || [];
    const zonesInOrder = [];
    let lastZoneKey = null;
    
    mapData.path.forEach(t => {
      const zoneKey = t.isBoss ? "darkness" : t.category;
      if (zoneKey !== lastZoneKey) { zonesInOrder.push(zoneKey); lastZoneKey = zoneKey; }
    });

    const currentKey = currentTile.isBoss ? "darkness" : currentTile.category;
    const currentIndex = zonesInOrder.indexOf(currentKey);
    const allowed = new Set();
    
    if (currentIndex > 0) allowed.add(zonesInOrder[currentIndex - 1]);
    allowed.add(zonesInOrder[currentIndex]);
    if (currentIndex < zonesInOrder.length - 1) allowed.add(zonesInOrder[currentIndex + 1]);

    return mapData.path.filter(t => allowed.has(t.isBoss ? "darkness" : t.category));
  }, [mapData.path, currentTile]);

  return { currentTile, currentCategory, zoneConfig, visibleTiles, isBossActive };
};