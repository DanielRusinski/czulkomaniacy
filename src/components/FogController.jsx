import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState } from '../logic/gameState';
import { globalFogUniforms, GAME_COLORS } from '../config/materialsConfig';

const FogController = ({ mapData }) => {
  const zoneFogColors = {
    meadow: new THREE.Color(GAME_COLORS.zones.meadow.fog),
    forest: new THREE.Color(GAME_COLORS.zones.forest.fog),
    lake: new THREE.Color(GAME_COLORS.zones.lake.fog),
    mountains: new THREE.Color(GAME_COLORS.zones.mountains.fog),
    "start-meta": new THREE.Color(GAME_COLORS.zones.startMeta.fog),
    darkness: new THREE.Color(GAME_COLORS.zones.darkness.fog)
  };

  useFrame((state, delta) => {
    if (!mapData?.path || !gameState.players) return;

    const player = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];
    if (!player) return;

    const currentTile = mapData.path.find(t => String(t.id) === String(player.currentModuleId));

    if (currentTile) {
      const zone = currentTile.isBoss ? "darkness" : currentTile.category;
      const targetColor = zoneFogColors[zone] || zoneFogColors.meadow;

      // 1. Płynna zmiana koloru mgły w shaderach
      globalFogUniforms.uFogColor.value.lerp(targetColor, delta * 2);

      // 2. Krytyczna poprawka tła:
      // Jeśli tło nie istnieje, stwórzmy je. Jeśli istnieje, lerpujmy.
      if (!state.scene.background) {
        state.scene.background = new THREE.Color(targetColor);
      } else if (state.scene.background.isColor) {
        state.scene.background.lerp(targetColor, delta * 2);
      }
      
      // 3. Opcjonalnie: Synchronizacja koloru Clear Color renderera
      state.gl.setClearColor(globalFogUniforms.uFogColor.value);
    }
  });

  return null;
};

export default FogController;