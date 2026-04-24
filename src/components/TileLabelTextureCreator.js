import * as THREE from 'three';

/**
 * TileLabelTextureCreator - Tworzy maskę tekstury dla efektu Glare shadera.
 * Wszystkie napisy są białe (1.0 w kanale kolorów), aby shader mógł nałożyć na nie efekt.
 */
class TileLabelTextureCreator {
  constructor(totalTiles) {
    this.totalTiles = totalTiles;
    this.cellSize = 256; // Wyższa rozdzielczość
    this.gridWidth = Math.ceil(Math.sqrt(totalTiles));
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.gridWidth * this.cellSize;
    this.canvas.height = this.gridWidth * this.cellSize;
    this.ctx = this.canvas.getContext('2d');
  }

  generate(mapData) {
    if (!mapData || !mapData.path) return null; //

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //
    this.ctx.textAlign = 'center'; //
    this.ctx.textBaseline = 'middle'; //

    // --- KLUCZOWE: Używamy białego dla maski glare ---
    this.ctx.fillStyle = 'white'; 

    mapData.path.forEach((tile, index) => {
      const x = index % this.gridWidth;
      const y = Math.floor(index / this.gridWidth);
      
      const centerX = (x * this.cellSize) + (this.cellSize / 2);
      const centerY = (y * this.cellSize) + (this.cellSize / 2);

      const symbol = this.getSymbol(tile);

      if (symbol) {
        // Scenariusz: Pole Specjalne (Tylko Symbol)
        // Złoty kolor usunięty w teksturze
        this.ctx.font = '700 160px "Quicksand"'; 
        this.ctx.fillText(symbol, centerX, centerY);
      } else {
        // Scenariusz: Pole Zwykłe (Tylko Numer)
        this.ctx.font = '600 100px "Quicksand"'; 
        this.ctx.fillText(`${tile.id + 1}`, centerX, centerY);
      }
    });

    const texture = new THREE.CanvasTexture(this.canvas); //
    texture.minFilter = THREE.LinearFilter; //
    texture.magFilter = THREE.LinearFilter; //
    texture.needsUpdate = true; //
    return texture;
  }

  getSymbol(tile) {
    if (tile.isEnvironment) return null; //
    if (tile.id === 0) return "S"; //
    if (tile.label === "META") return "M"; //
    if (tile.isBoss) return "B"; //
    if (tile.isStartMeta || tile.isZoneEnd) return "✦"; //
    return null; //
  }
}

export default TileLabelTextureCreator;