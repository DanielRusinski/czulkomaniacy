import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalShadowFix from './GlobalShadowFix';
import CameraController from '../CameraController';
import WorldEnvironment from './WorldEnvironment';
import WorldContent from './WorldContent';

const BoardScene = ({ mapData, activePlayer, visibleTiles, zoneColor, isBossActive, onPlayerMoveComplete, setHoveredTile, v }) => {
  return (
    // Zmieniono z-10 na z-30, aby być nad warstwą Vignette (z-20)
    <div className="absolute inset-0 z-30">
      <Canvas
        flat
        camera={{ position: [10, 10, 10], fov: 35 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <GlobalShadowFix />

        <WorldEnvironment activePlayer={activePlayer} mapData={mapData} />

        <WorldContent
          mapData={mapData}
          activePlayer={activePlayer}
          visibleTiles={visibleTiles}
          zoneColor={zoneColor}
          onPlayerMoveComplete={onPlayerMoveComplete}
          setHoveredTile={setHoveredTile}
          v={v}
        />

        <CameraController
          activePlayer={activePlayer}
          mapPath={mapData.path}
          gridSize={mapData.gridSize}
          isBossActive={isBossActive}
        />
      </Canvas>
    </div>
  );
};

export default BoardScene;