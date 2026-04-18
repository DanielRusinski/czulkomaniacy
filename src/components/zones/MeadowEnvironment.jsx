import React, { useMemo } from 'react';
import { getZoneColors } from '../../config/materialsConfig_ss'; // Import z design systemu
import MeadowGround from './MeadowGround';
import MeadowGroundDetail from './MeadowGroundDetail';
import MeadowLargeModels from './MeadowLargeModels';
import MeadowBoundary from './MeadowBoundary';
import MeadowParticles from './MeadowParticles';
import MeadowAnimation from './MeadowAnimation';

/**
 * MeadowEnvironment - Główny manager wizualny strefy Łąki.
 * Łączy warstwy podłoża, detali, dużych modeli, bariery, cząsteczek i animacji.
 */
const MeadowEnvironment = ({ mapData, activePlayer }) => {
  
  // 1. Pobieranie kolorów z centralnego pliku konfiguracyjnego
  const colors = useMemo(() => getZoneColors('meadow'), []);

  // 2. Logika sprawdzająca, czy strefa powinna być renderowana
  const hasMeadowZone = useMemo(() => {
    return mapData.path.some(t => t.category === 'meadow');
  }, [mapData.path]);

  if (!hasMeadowZone) return null;

  return (
    <group name="Meadow_Environment_Root">
      
      {/* Warstwa A: Podłoże GLB (Kafle 1x1 poza ścieżką) */}
      <MeadowGround 
        mapData={mapData} 
        activePlayer={activePlayer} 
      />

      {/* Warstwa B: Detale gruntu (Małe modele + Shader trawy) */}
      {/* Przekazujemy kolor ground zdefiniowany w materialsConfig */}
      <MeadowGroundDetail 
        mapData={mapData} 
        zoneColor={colors.ground} 
      />

      {/* Warstwa C: Duże modele (Drzewa, Skały) */}
      <MeadowLargeModels 
        mapData={mapData} 
      />

      {/* Warstwa D: Kafelki obwodowe (Rama strefy) */}
      <MeadowBoundary 
        mapData={mapData} 
      />

      {/* Warstwa E: System cząsteczek (Pyłki) */}
      {/* Używamy koloru cloud dla cząsteczek pyłków */}
      <MeadowParticles 
        mapData={mapData} 
        color={colors.cloud}
      />

      {/* Warstwa F: System animacji i interakcji (Reaktywna roślinność) */}
      <MeadowAnimation 
        mapData={mapData} 
        activePlayer={activePlayer} 
      />

    </group>
  );
};

export default MeadowEnvironment;