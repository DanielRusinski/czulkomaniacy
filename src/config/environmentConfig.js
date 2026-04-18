import React, { useEffect } from 'react';
import { useControls, folder, button } from 'leva';

export const ENVIRONMENT_CONFIG = {
  global: {},
  zones: {
    'meadow': {
      color: '#ff008f',
      hdrPath: '/exr/HDR_meadowBGtest5.exr',
      hdrIntensity: 1.0,
      background: 'linear-gradient(135deg, #fdffb666 0%, #caffbf66 100%)',
      vignette: { radius: 35, softness: 60, opacity: 1.0 },
      fog: { color: '#F4FFE3', near: 14, far: 40 }
    },
    'forest': {
      color: '#2d6a4f',
      hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr',
      hdrIntensity: 1.0,
      background: 'linear-gradient(135deg, #caffbf66 0%, #9bf6ff66 100%)',
      vignette: { radius: 35, softness: 60, opacity: 1.0 },
      fog: { color: '#a5d6a7', near: 15, far: 44 }
    },
    'lake': { color: '#a1c4fd', hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr', hdrIntensity: 1.0, background: 'linear-gradient(135deg, #a1c4fd66 0%, #c2e9fb66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#bae6fd', near: 35, far: 80 } },
    'mountains': { color: '#ced4da', hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr', hdrIntensity: 1.0, background: 'linear-gradient(135deg, #e0c3fc66 0%, #8ec5fc66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#d1d5db', near: 40, far: 90 } },
    'start-meta': { color: '#d10483', hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr', hdrIntensity: 1.0, background: 'linear-gradient(135deg, #ffc3a066 0%, #ffafbd66 100%)', vignette: { radius: 22, softness: 35, opacity: 1.0 }, fog: { color: '#fce7f3', near: 65, far: 80 } },
    'darkness': { color: '#141e30', hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr', hdrIntensity: 1.0, background: 'linear-gradient(135deg, #141e30ee 0%, #243b55ee 100%)', vignette: { radius: 22, softness: 30, opacity: 1.0 }, fog: { color: '#030712', near: 15, far: 40 } },
    'default': { color: '#ffffff', hdrPath: '/hdr/OPT_HDR_bubblegumMeadow.hdr', hdrIntensity: 1.0, background: 'linear-gradient(135deg, #ffffff66 0%, #cccccc66 100%)', vignette: { radius: 35, softness: 60, opacity: 1.0 }, fog: { color: '#ffffff', near: 50, far: 100 } }
  }
};

export const getZoneConfig = (zoneName) => {
  return ENVIRONMENT_CONFIG.zones[zoneName] || ENVIRONMENT_CONFIG.zones['default'];
};

export const EnvironmentControls = ({ activeZone = 'meadow' }) => {
  const zoneConfig = getZoneConfig(activeZone);

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

          // 1. Aktualizacja stałego obiektu (tylko strefy)
          Object.assign(ENVIRONMENT_CONFIG.zones, importedData.zones);

          // 2. Aktualizacja suwaków Leva
          const newZone = importedData.zones[activeZone] || importedData.zones['default'];
          setBase({
            color: newZone.color,
            fogNear: newZone.fog.near,
            fogFar: newZone.fog.far,
            vignetteRadius: newZone.vignette.radius,
            vignetteSoftness: newZone.vignette.softness
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


  const [baseSettings, setBase] = useControls(`2. Strefa: ${activeZone.toUpperCase()}`, () => ({
    color: zoneConfig.color,
    fogNear: { value: zoneConfig.fog.near, min: 0, max: 200 },
    fogFar: { value: zoneConfig.fog.far, min: 0, max: 500 },
    vignetteRadius: { value: zoneConfig.vignette.radius, min: 0, max: 100 },
    vignetteSoftness: { value: zoneConfig.vignette.softness, min: 0, max: 100 },
  }), [activeZone]);

  useEffect(() => {
    zoneConfig.color = baseSettings.color;
    zoneConfig.fog.near = baseSettings.fogNear;
    zoneConfig.fog.far = baseSettings.fogFar;
    zoneConfig.vignette.radius = baseSettings.vignetteRadius;
    zoneConfig.vignette.softness = baseSettings.vignetteSoftness;
  }, [baseSettings, zoneConfig]);

  return null;
};