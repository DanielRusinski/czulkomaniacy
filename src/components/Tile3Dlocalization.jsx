import React from 'react';
import { Html } from '@react-three/drei';

/**
 * Tile3Dlocalization - Renderuje etykiety nad kafelkami ścieżki.
 * Wykorzystuje dane z mapGenerator.js do identyfikacji pól specjalnych.
 */
const Tile3Dlocalization = ({ tile }) => {
  // Ignorujemy pola otoczenia
  if (tile.isEnvironment) return null;

  // Logika wyboru symbolu
  const getSymbol = () => {
    if (tile.id === 0) return "S"; // Start gry
    if (tile.label === "META") return "M"; // Meta gry
    if (tile.isBoss) return "B"; // Boss
    if (tile.isStartMeta || tile.isZoneEnd) return "✦"; // Granice stref
    return null;
  };

  const symbol = getSymbol();

  return (
    // Pozycja [0, 0.7, 0] umieszcza napis dokładnie nad modelem kafelka
    <group position={[0, 0.7, 0]}>
      <Html
        center
        distanceFactor={8}
        occlude={false}
        style={{
          fontFamily: "'Quicksand', sans-serif",
          userSelect: 'none',
          pointerEvents: 'none',
          textAlign: 'center',
          color: 'white',
          textShadow: '0px 0px 4px rgba(0,0,0,0.8)',
          zIndex: 100 // Gwarantuje widoczność nad elementami Canvas
        }}
      >
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');`}
        </style>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {symbol && (
            <span style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#FFD700', 
              lineHeight: '1' 
            }}>
              {symbol}
            </span>
          )}
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            opacity: 0.9,
            marginTop: symbol ? '0px' : '4px'
          }}>
            {tile.id + 1}
          </span>
        </div>
      </Html>
    </group>
  );
};

export default Tile3Dlocalization;