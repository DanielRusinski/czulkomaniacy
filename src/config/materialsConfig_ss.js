import * as THREE from 'three';

// ==========================================
// 1. GLOBALNA PALETA KOLORÓW (Design System)
// ==========================================
export const GAME_COLORS = {
  base: {
    white: '#ffffff',
    black: '#000000',
    grayLight: '#cccccc',
    grayMedium: '#777777',
    grayDark: '#1a1a1a',
  },
  zones: {
    meadow: { primary: '#d0ff00', ground: '#42b400', cloud: '#e2fbb9', fog: '#c8e6c9', gradientStart: '#fdffb666', gradientEnd: '#caffbf66' },
    forest: { primary: '#2d6a4f', ground: '#2d6a4f', cloud: '#2d6a4f', fog: '#a5d6a7', sky: '#a2d2ff', gradientStart: '#caffbf66', gradientEnd: '#9bf6ff66' },
    lake: { primary: '#a1c4fd', ground: '#a1c4fd', cloud: '#a2d2ff', fog: '#bae6fd', gradientStart: '#a1c4fd66', gradientEnd: '#c2e9fb66' },
    mountains: { primary: '#ced4da', ground: '#777777', cloud: '#ced4da', fog: '#d1d5db', sky: '#ffe5b4', gradientStart: '#e0c3fc66', gradientEnd: '#8ec5fc66' },
    startMeta: { primary: '#d10483', ground: '#540bdb', cloud: '#d6e2a0', fog: '#fce7f3', gradientStart: '#ffc3a066', gradientEnd: '#ffafbd66' },
    darkness: { primary: '#141e30', ground: '#111111', cloud: '#141e30', fog: '#030712', accent: '#ff0055', gradientStart: '#141e30ee', gradientEnd: '#243b55ee' },
    default: { primary: '#ffffff', ground: '#aaaaaa', cloud: '#e2fbb9', fog: '#ffffff', gradientStart: '#ffffff66', gradientEnd: '#cccccc66' }
  },
  vfx: {
    gold: '#ffd700',
    goldDark: '#d4af37',
    orange: '#ff8c00',
    magicPurple: '#8400ff',
    magicPink: '#db2777',
    energyBlue: '#4db8ff',
    dangerRed: '#f87171'
  }
};

// ==========================================
// 2. STANDARDY MATERIAŁÓW (Props dla MeshPhongMaterial)
// ==========================================
export const MATERIAL_PROPS = {
  // Pionki graczy (ładny, błyszczący plastik)
  pawn: {
    shininess: 10,          // Odpowiednik dawnego roughness (im więcej, tym ostrzejszy błysk)
    specular: '#555555',    // Kolor odbitego światła (szary daje naturalny połysk)
  },
  
  // Elementy otoczenia (matowe, ale z lekkim odcięciem światła)
  toonProps: {
    shininess: 10,
    specular: '#222222',
  },

  // Cząsteczki (świecące i półprzezroczyste)
  particles: {
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    shininess: 100,
  },

  // Morze chmur (bardzo matowe, rozpraszające światło)
  cloudBase: {
    transparent: true,
    depthWrite: false,
    shininess: 5,
    specular: '#111111',
  },

  // Siatka podłogi (Grid)
  grid: {
    transparent: true,
    opacity: 0.77,
  }
};

export const getZoneColors = (zoneName) => {
  return GAME_COLORS.zones[zoneName] || GAME_COLORS.zones.default;
};