import React, { useEffect } from 'react';
import { useControls, folder, button } from 'leva';

export const ENVIRONMENT_CONFIG = {
  global: {
    shadows: {
      enabled: true,
      mapSize: [2048, 2048], 
      opacity: 0.7,
      bias: -0.0001,         
      normalBias: 0.05,      
      height: 30,
      distance: 150,         
      angle: 0.8,            
      penumbra: 0.5,         
      intensity: 2.5
    }
  },

  zones: {
    'meadow': {
      color: '#ff008f',
      background: 'linear-gradient(135deg, #fdffb666 0%, #caffbf66 100%)',
      vignette: { radius: 35, softness: 60, opacity: 1.0 },
      fog: { color: '#F4FFE3', near: 14, far: 40 },
      light: { 
        ambient: { color: '#ff8600', intensity: 1.24 },     
        hemisphere: { skyColor: '#fcac00', groundColor: '#3300ff', intensity: 2.4 }, 
        directional: { color: '#ffffff', intensity: 0.45, position: [10, 20, 10] },
        point: { color: '#ffffff', intensity: 2.5, distance: 10, decay: 2, position: [0, 4, 0] }
      }
    },
    'forest': {
      color: '#2d6a4f',
      background: 'linear-gradient(135deg, #caffbf66 0%, #9bf6ff66 100%)',
      vignette: { radius: 35, softness: 60, opacity: 1.0 },
      fog: { color: '#a5d6a7', near: 15, far: 44 },
      light: { 
        ambient: { color: '#ffffff', intensity: 0.2 },
        hemisphere: { skyColor: '#a2d2ff', groundColor: '#2d6a4f', intensity: 0.8 },
        directional: { color: '#ffffff', intensity: 0.4, position: [10, 20, 10] },
        point: { color: '#4db8ff', intensity: 2.5, distance: 10, decay: 2, position: [0, 4, 0] }
      }
    },
    'lake': { color: '#a1c4fd', background: 'linear-gradient(135deg, #a1c4fd66 0%, #c2e9fb66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#bae6fd', near: 35, far: 80 }, light: { ambient: { color: '#ffffff', intensity: 0.25 }, hemisphere: { skyColor: '#ffffff', groundColor: '#a1c4fd', intensity: 0.8 }, directional: { color: '#ffffff', intensity: 0.5, position: [10, 20, 10] }, point: { color: '#80c1ff', intensity: 2.5, distance: 10, decay: 2, position: [0, 4, 0] } } },
    'mountains': { color: '#ced4da', background: 'linear-gradient(135deg, #e0c3fc66 0%, #8ec5fc66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#d1d5db', near: 40, far: 90 }, light: { ambient: { color: '#ffffff', intensity: 0.25 }, hemisphere: { skyColor: '#ffe5b4', groundColor: '#777777', intensity: 0.7 }, directional: { color: '#ffffff', intensity: 0.45, position: [10, 20, 10] }, point: { color: '#ff7e67', intensity: 2.5, distance: 10, decay: 2, position: [0, 4, 0] } } },
    'start-meta': { color: '#d10483', background: 'linear-gradient(135deg, #ffc3a066 0%, #ffafbd66 100%)', vignette: { radius: 22, softness: 35, opacity: 1.0 }, fog: { color: '#fce7f3', near: 65, far: 80 }, light: { ambient: { color: '#ffffff', intensity: 0.25 }, hemisphere: { skyColor: '#d10482', groundColor: '#540bdb', intensity: 0.9 }, directional: { color: '#ffffff', intensity: 0.5, position: [10, 20, 10] }, point: { color: '#ffffff', intensity: 2.5, distance: 10, decay: 2, position: [0, 4, 0] } } },
    'darkness': { color: '#141e30', background: 'linear-gradient(135deg, #141e30ee 0%, #243b55ee 100%)', vignette: { radius: 22, softness: 30, opacity: 1.0 }, fog: { color: '#030712', near: 15, far: 40 }, light: { ambient: { color: '#4834d4', intensity: 0.05 }, hemisphere: { skyColor: '#4834d4', groundColor: '#111111', intensity: 0.4 }, directional: { color: '#4834d4', intensity: 0.3, position: [10, 20, 10] }, point: { color: '#ff0055', intensity: 4.0, distance: 12, decay: 2, position: [0, 4, 0] } } },
    'default': { color: '#ffffff', background: 'linear-gradient(135deg, #ffffff66 0%, #cccccc66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#ffffff', near: 50, far: 100 }, light: { ambient: { color: '#ffffff', intensity: 0.3 }, hemisphere: { skyColor: '#ffffff', groundColor: '#aaaaaa', intensity: 0.5 }, directional: { color: '#ffffff', intensity: 0.5, position: [10, 20, 10] }, point: { color: '#ffffff', intensity: 2.0, distance: 8, decay: 2, position: [0, 4, 0] } } }
  }
};

export const getZoneConfig = (zoneName) => {
  return ENVIRONMENT_CONFIG.zones[zoneName] || ENVIRONMENT_CONFIG.zones['default'];
};

export const EnvironmentControls = ({ activeZone = 'meadow' }) => {
  const zoneConfig = getZoneConfig(activeZone);
  const globalShadows = ENVIRONMENT_CONFIG.global.shadows;

  const handleExport = () => {
    const dataStr = JSON.stringify(ENVIRONMENT_CONFIG, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `env_config_${activeZone}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          // --- WALIDACJA (To tutaj naprawiamy Twój błąd) ---
          if (!importedData) throw new Error("Plik jest pusty.");
          if (importedData.path) throw new Error("UWAGA: Próbujesz wczytać plik MAPY (MapData) do ustawień ŚRODOWISKA!");
          if (!importedData.zones || !importedData.global) throw new Error("Nieprawidłowa struktura pliku ustawień.");

          // 1. Aktualizacja stałego obiektu
          Object.assign(ENVIRONMENT_CONFIG.global, importedData.global);
          Object.assign(ENVIRONMENT_CONFIG.zones, importedData.zones);

          // 2. Aktualizacja suwaków Leva (Używamy setterów)
          setShadows(importedData.global.shadows);
          const newZone = importedData.zones[activeZone] || importedData.zones['default'];
          setBase({
            color: newZone.color,
            fogNear: newZone.fog.near,
            fogFar: newZone.fog.far,
            vignetteRadius: newZone.vignette.radius,
            vignetteSoftness: newZone.vignette.softness
          });
          setLights({
            ambColor: newZone.light.ambient.color,
            ambIntensity: newZone.light.ambient.intensity,
            hemiSky: newZone.light.hemisphere.skyColor,
            hemiGround: newZone.light.hemisphere.groundColor,
            hemiIntensity: newZone.light.hemisphere.intensity,
            dirColor: newZone.light.directional.color,
            dirIntensity: newZone.light.directional.intensity,
            ptIntensity: newZone.light.point.intensity,
            ptDistance: newZone.light.point.distance
          });
          
          alert('Ustawienia zaimportowane pomyślnie!');
        } catch (err) {
          alert('Błąd podczas importu: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  useControls('💾 System', {
    'Eksportuj JSON': button(handleExport),
    'Importuj JSON': button(handleImport)
  });

  // Składnia funkcyjna Leva: () => ({ ... }) pozwala na użycie [values, set]
  const [shadowSettings, setShadows] = useControls('1. Cienie (Globalne)', () => ({
    enabled: { value: globalShadows.enabled },
    opacity: { value: globalShadows.opacity, min: 0, max: 1, step: 0.05 },
    intensity: { value: globalShadows.intensity, min: 0, max: 10, step: 0.1 },
    height: { value: globalShadows.height, min: 5, max: 100 },
    distance: { value: globalShadows.distance, min: 10, max: 500 },
    angle: { value: globalShadows.angle, min: 0.1, max: 1.5 },
    penumbra: { value: globalShadows.penumbra, min: 0, max: 1 },
    bias: { value: globalShadows.bias, min: -0.01, max: 0.01, step: 0.0001 },
    normalBias: { value: globalShadows.normalBias, min: -0.1, max: 0.1, step: 0.001 },
  }));

  const [baseSettings, setBase] = useControls(`2. Strefa: ${activeZone.toUpperCase()}`, () => ({
    color: zoneConfig.color,
    fogNear: { value: zoneConfig.fog.near, min: 0, max: 200 },
    fogFar: { value: zoneConfig.fog.far, min: 0, max: 500 },
    vignetteRadius: { value: zoneConfig.vignette.radius, min: 0, max: 100 },
    vignetteSoftness: { value: zoneConfig.vignette.softness, min: 0, max: 100 },
  }), [activeZone]);

  const [lightSettings, setLights] = useControls(`3. Światła: ${activeZone.toUpperCase()}`, () => ({
    Ambient: folder({
      ambColor: zoneConfig.light.ambient.color,
      ambIntensity: { value: zoneConfig.light.ambient.intensity, min: 0, max: 2, step: 0.01 },
    }),
    Hemisphere: folder({
      hemiSky: zoneConfig.light.hemisphere.skyColor,
      hemiGround: zoneConfig.light.hemisphere.groundColor,
      hemiIntensity: { value: zoneConfig.light.hemisphere.intensity, min: 0, max: 5, step: 0.1 },
    }),
    Directional: folder({
      dirColor: zoneConfig.light.directional.color,
      dirIntensity: { value: zoneConfig.light.directional.intensity, min: 0, max: 2, step: 0.01 },
    }),
    Point: folder({
      ptIntensity: { value: zoneConfig.light.point.intensity, min: 0, max: 10, step: 0.1 },
      ptDistance: { value: zoneConfig.light.point.distance, min: 0, max: 50 },
    })
  }), [activeZone]);

  useEffect(() => {
    Object.assign(globalShadows, shadowSettings);
    zoneConfig.color = baseSettings.color;
    zoneConfig.fog.near = baseSettings.fogNear;
    zoneConfig.fog.far = baseSettings.fogFar;
    zoneConfig.vignette.radius = baseSettings.vignetteRadius;
    zoneConfig.vignette.softness = baseSettings.vignetteSoftness;
    zoneConfig.light.ambient.color = lightSettings.ambColor;
    zoneConfig.light.ambient.intensity = lightSettings.ambIntensity;
    zoneConfig.light.hemisphere.skyColor = lightSettings.hemiSky;
    zoneConfig.light.hemisphere.groundColor = lightSettings.hemiGround;
    zoneConfig.light.hemisphere.intensity = lightSettings.hemiIntensity;
    zoneConfig.light.directional.color = lightSettings.dirColor;
    zoneConfig.light.directional.intensity = lightSettings.dirIntensity;
    zoneConfig.light.point.intensity = lightSettings.ptIntensity;
    zoneConfig.light.point.distance = lightSettings.ptDistance;
  }, [shadowSettings, baseSettings, lightSettings, globalShadows, zoneConfig]);

  return null;
};