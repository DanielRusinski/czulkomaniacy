export const categoryLabels = { 
  "meadow": "Łąka", 
  "forest": "Las", 
  "mountains": "Góry", 
  "lake": "Jezioro" 
};

export const availableCharacters = [
  { id: 1, name: 'Biedronka', icon: '🐞', color: '#ffc1cc', bonusCategory: 'meadow' },
  { id: 2, name: 'Pszczółka', icon: '🐝', color: '#fbf8cc', bonusCategory: 'meadow' },
  { id: 3, name: 'Motyl', icon: '🦋', color: '#cfbaf0', bonusCategory: 'forest' },
  { id: 4, name: 'Żabka', icon: '🐸', color: '#b9fbc0', bonusCategory: 'lake' },
  { id: 5, name: 'Ważka', icon: '🧚', color: '#a2d2ff', bonusCategory: 'lake' },
  { id: 6, name: 'Chrabąszcz', icon: '🪲', color: '#e2ece9', bonusCategory: 'forest' },
  { id: 7, name: 'Mrówka', icon: '🐜', color: '#f1c0e8', bonusCategory: 'mountains' },
  { id: 8, name: 'Ślimak', icon: '🐌', color: '#fde4cf', bonusCategory: 'mountains' }
];

export const resourcePrices = { drewno: 1, kamien: 2, miod: 3, woda: 4 };

export const buildableElements = [
  { type: 'book', label: 'Książka', icon: '📖', cost: { drewno: 1, woda: 1 } },
  { type: 'mug', label: 'Kubek Bolesławiec', icon: '☕', cost: { kamien: 2, woda: 2 } },
  { type: 'chair', label: 'Krzesło', icon: '🪑', cost: { drewno: 2 } },
  { type: 'magic_blanket', label: 'Magiczny Koc', icon: '✨', cost: { woda: 2, kamien: 1 } },
  { type: 'candies', label: 'Cukierki', icon: '🍬', cost: { miod: 3 } },
  { type: 'pillows', label: 'Poduszki', icon: '☁️', cost: { miod: 2, woda: 2 } },
  { type: 'secret_key', label: 'Sekretny Klucz', icon: '🔑', cost: { kamien: 1, drewno: 2 } },
  { type: 'crystal_ball', label: 'Kryształowa Kula', icon: '🔮', cost: { miod: 1, woda: 2 } },
  { type: 'doll', label: 'Lalka', icon: '🪆', cost: { kamien: 3 } }
];