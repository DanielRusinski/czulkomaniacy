const CATEGORIES = [
  { id: "meadow", label: "Łąka", offset: { x: 5, y: 5 } },
  { id: "forest", label: "Las", offset: { x: 18, y: 5 } },
  { id: "mountains", label: "Góry", offset: { x: 18, y: 20 } },
  { id: "lake", label: "Jezioro", offset: { x: 5, y: 20 } }
];

const ZONE_W = 6; // Pole gry: 6 kolumn
const ZONE_H = 9; // Pole gry: 9 rzędów
const FIELDS_PER_ZONE = 32;

export const generateMap = () => {
  const GRID_SIZE = 60;
  let globalPath = [];
  let environmentTiles = [];
  const globalPathSet = new Set();

  // --- KROK 1: ŚCIEŻKA (Playable Area: 6x9) ---
  CATEGORIES.forEach((cat, catIdx) => {
    let zonePath = [];
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3000) {
      attempts++;
      zonePath = [];
      let localOccupied = new Set();
      
      let curX = cat.offset.x + Math.floor(Math.random() * ZONE_W);
      let curY = cat.offset.y + (Math.random() > 0.5 ? 0 : ZONE_H - 1);

      for (let i = 0; i < FIELDS_PER_ZONE; i++) {
        zonePath.push({ x: curX, y: curY });
        localOccupied.add(`${curX},${curY}`);

        if (i === FIELDS_PER_ZONE - 1) {
          success = true;
          break;
        }

        const candidates = [
          { x: curX + 1, y: curY }, { x: curX - 1, y: curY },
          { x: curX, y: curY + 1 }, { x: curX, y: curY - 1 }
        ].filter(n => {
          const inBounds = n.x >= cat.offset.x && n.x < cat.offset.x + ZONE_W &&
                           n.y >= cat.offset.y && n.y < cat.offset.y + ZONE_H;
          if (!inBounds) return false;
          if (localOccupied.has(`${n.x},${n.y}`)) return false;

          const neighborsOfCandidate = [
            { x: n.x + 1, y: n.y }, { x: n.x - 1, y: n.y },
            { x: n.x, y: n.y + 1 }, { x: n.x, y: n.y - 1 }
          ].filter(sn => localOccupied.has(`${sn.x},${sn.y}`));

          return neighborsOfCandidate.length === 1;
        });

        if (candidates.length === 0) break;
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        curX = next.x;
        curY = next.y;
      }
    }

    const tiles = zonePath.map((p, i) => {
      const globalIdx = (catIdx * FIELDS_PER_ZONE) + i;
      globalPathSet.add(`${p.x},${p.y}`);
      
      return {
        id: globalIdx,
        x: p.x,
        y: p.y,
        category: cat.id,
        isBoss: i === 12,
        isChance: [6, 16, 26].includes(i),
        isPortal: i === 22,
        isStartMeta: i === 0,
        isZoneEnd: i === FIELDS_PER_ZONE - 1,
        label: globalIdx === 0 ? "START" : (catIdx === 3 && i === FIELDS_PER_ZONE - 1 ? "META" : "")
      };
    });
    globalPath = [...globalPath, ...tiles];
  });

  // --- KROK 2: OTOCZENIE (Strict Total Area: 8x11) ---
  CATEGORIES.forEach((cat) => {
    // dx od -1 do 6 daje 8 kolumn: [-1, 0, 1, 2, 3, 4, 5, 6]
    for (let dx = -1; dx <= ZONE_W; dx++) {
      // dy od -1 do 9 daje 11 rzędów: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      for (let dy = -1; dy <= ZONE_H; dy++) {
        const targetX = cat.offset.x + dx;
        const targetY = cat.offset.y + dy;
        const coords = `${targetX},${targetY}`;
        
        if (!globalPathSet.has(coords)) {
          environmentTiles.push({
            id: `env-${coords}`,
            x: targetX,
            y: targetY,
            category: cat.id,
            isEnvironment: true
          });
        }
      }
    }
  });

  return { path: globalPath, environment: environmentTiles, gridSize: GRID_SIZE };
};