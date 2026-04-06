import questionsData from '../data/questions.json';
import chanceCardsData from '../data/chanceCards.json';
import bossData from '../data/bossQuestions.json';

const createInitialPlayerState = (id, name, color, icon, bonusCategory) => ({
  id,
  name,
  color,
  icon,
  bonusCategory,
  currentModuleId: 0,
  points: 0,
  lives: 3,
  movesLeft: 1, // Licznik rzutów/ruchów na turę
  correctAnswers: 0,
  isSkippingTurn: false,
  resources: { drewno: 0, kamien: 0, miod: 0, woda: 0 },
  baseGrid: Array(9).fill(null),
  isWinner: false
});

export const gameState = {
  players: [],
  currentPlayerIndex: 0,
  isGameOver: false,
  winner: null,
  logs: ["Witaj w Eko-Wyprawie!"],
  
  availableQuestions: [],
  availableChanceCards: [],
  availableBossQuestions: [],

  initGame(playerConfigs) {
    this.players = playerConfigs.map((config, index) => 
      createInitialPlayerState(index, config.name, config.color, config.icon, config.bonusCategory)
    );
    this.currentPlayerIndex = 0;
    this.isGameOver = false;
    this.winner = null;
    this.resetQuestions();
    this.resetChanceCards();
    this.resetBossQuestions();
  },

  resetQuestions() { 
    this.availableQuestions = [...questionsData.questions]; 
  },
  resetChanceCards() { 
    this.availableChanceCards = [...chanceCardsData.chanceCards]; 
  },
  resetBossQuestions() { 
    this.availableBossQuestions = [...bossData.bossQuestions]; 
  },

  addLog(message) {
    this.logs.unshift(message);
    if (this.logs.length > 10) this.logs.pop();
  },

  getCurrentPlayer() { return this.players[this.currentPlayerIndex]; },

  /**
   * POBIERANIE PYTANIA ZE STREFY (Mechanika bez powtórek)
   * Losuje pytanie z danej kategorii i usuwa je z puli. 
   * Jeśli pula danej strefy jest pusta, resetuje tylko tę kategorię.
   */
  getNextQuestion(category) {
    let pool = this.availableQuestions.filter(q => q.category === category);

    if (pool.length === 0) {
      this.addLog(`♻️ Pytania ze strefy ${category} wyczerpały się. Tasowanie...`);
      // Pobieramy świeży zestaw pytań dla tej kategorii z oryginalnych danych
      const freshSet = questionsData.questions.filter(q => q.category === category);
      this.availableQuestions.push(...freshSet);
      pool = freshSet;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedQuestion = pool[randomIndex];

    // Usuwamy wybrane pytanie z głównej listy dostępnych
    this.availableQuestions = this.availableQuestions.filter(q => q.id !== selectedQuestion.id);

    return selectedQuestion;
  },

  /**
   * POBIERANIE PYTANIA BOSSA (Bez powtórek)
   */
  getNextBossQuestion() {
    if (this.availableBossQuestions.length === 0) {
      this.addLog("♻️ Odświeżono pulę wyzwań Bossa!");
      this.resetBossQuestions();
    }
    const randomIndex = Math.floor(Math.random() * this.availableBossQuestions.length);
    const selected = this.availableBossQuestions[randomIndex];
    this.availableBossQuestions = this.availableBossQuestions.filter(q => q.id !== selected.id);
    return selected;
  },

  /**
   * POBIERANIE KARTY SZANSY (Bez powtórek)
   */
  getNextChanceCard() {
    if (this.availableChanceCards.length === 0) {
      this.addLog("♻️ Tasowanie talii kart Szansy...");
      this.resetChanceCards();
    }
    const randomIndex = Math.floor(Math.random() * this.availableChanceCards.length);
    const selected = this.availableChanceCards[randomIndex];
    this.availableChanceCards = this.availableChanceCards.filter(c => c.id !== selected.id);
    return selected;
  },

  movePlayer(steps, maxTiles) {
    if (this.isGameOver) return;
    const player = this.getCurrentPlayer();
    
    if (player.lives <= 0 || player.isSkippingTurn) return player.currentModuleId;
    
    let newPosition = (player.currentModuleId + steps) % maxTiles;
    if (newPosition < 0) newPosition += maxTiles;
    
    player.currentModuleId = newPosition;
    return newPosition;
  },

  applyBossPenalty() {
    const player = this.getCurrentPlayer();
    const builtIndexes = player.baseGrid.map((c, i) => c !== null ? i : null).filter(v => v !== null);
    
    if (builtIndexes.length > 0) {
      player.baseGrid[builtIndexes[Math.floor(Math.random() * builtIndexes.length)]] = null;
      this.addLog(`🔥 BOSS niszczy budowlę gracza ${player.name}!`);
    } else {
      player.lives -= 1;
      this.addLog(`${player.name} traci życie przez atak Bossa!`);
      if (player.lives <= 0) this.checkSurvivalWin();
    }
  },

  buyResource(resourceType, cost) {
    const player = this.getCurrentPlayer();
    if (player.points >= cost) {
      player.points -= cost;
      player.resources[resourceType] += 1;
      return true;
    }
    return false;
  },

  buildElement(gridIndex, element) {
    const player = this.getCurrentPlayer();
    if (player.baseGrid[gridIndex] !== null) return false;
    const canAfford = Object.keys(element.cost).every(res => player.resources[res] >= element.cost[res]);
    
    if (canAfford) {
      Object.keys(element.cost).forEach(res => player.resources[res] -= element.cost[res]);
      player.baseGrid[gridIndex] = { type: element.type, icon: element.icon };
      if (player.baseGrid.every(cell => cell !== null)) this.announceWinner(player, "Baza pełna!");
      return true;
    }
    return false;
  },

  checkSurvivalWin() {
    const alive = this.players.filter(p => p.lives > 0);
    if (alive.length === 1) this.announceWinner(alive[0], "Ostatni ocalały!");
  },

  announceWinner(player, reason) {
    this.isGameOver = true;
    this.winner = player;
    this.addLog(`🏆 KONIEC GRY: ${player.name} zwycięża (${reason})!`);
  },

  nextTurn() {
    if (this.isGameOver) return;
    let attempts = 0;
    const playerCount = this.players.length;

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playerCount;
      attempts++;
      
      const nextPlayer = this.players[this.currentPlayerIndex];
      
      if (nextPlayer.isSkippingTurn) {
        nextPlayer.isSkippingTurn = false;
        this.addLog(`${nextPlayer.name} pauzuje w tej turze.`);
        continue;
      }
      
      if (nextPlayer.lives <= 0) continue;

      nextPlayer.movesLeft = 1; 
      break;
    } while (attempts < playerCount);
  },

  saveToStorage() {
    const dataToSave = {
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      logs: this.logs,
      isGameOver: this.isGameOver,
      winner: this.winner,
      availableQuestions: this.availableQuestions,
      availableChanceCards: this.availableChanceCards,
      availableBossQuestions: this.availableBossQuestions
    };
    localStorage.setItem('ekoWyprawaSave', JSON.stringify(dataToSave));
  },

  loadFromStorage() {
    const saved = localStorage.getItem('ekoWyprawaSave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.assign(this, data);
        return true;
      } catch (e) {
        console.error("Błąd podczas ładowania stanu gry:", e);
        return false;
      }
    }
    return false;
  },

  clearStorage() {
    localStorage.removeItem('ekoWyprawaSave');
  }
};