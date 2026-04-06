import React, { useMemo } from 'react';
import { getZoneColors } from '../../config/materialsConfig';
import ForestGround from './ForestGround';
import ForestGroundDetail from './ForestGroundDetail';
import ForestLargeModels from './ForestLargeModels';
import ForestBoundary from './ForestBoundary';
import ForestParticles from './ForestParticles';
import ForestAnimation from './ForestAnimation';

const ForestEnvironment = ({ mapData, activePlayer }) => {
  const colors = useMemo(() => getZoneColors('forest'), []);

  const hasForestZone = useMemo(() => {
    return mapData.path.some(t => t.category === 'forest');
  }, [mapData.path]);

  if (!hasForestZone) return null;

  return (
    <group name="Forest_Environment_Root">
      <ForestGround mapData={mapData} activePlayer={activePlayer} />
      <ForestGroundDetail mapData={mapData} zoneColor={colors.ground} />
      <ForestLargeModels mapData={mapData} />
      <ForestBoundary mapData={mapData} />
      <ForestParticles mapData={mapData} color={colors.cloud} />
      <ForestAnimation mapData={mapData} activePlayer={activePlayer} />
    </group>
  );
};

export default ForestEnvironment;