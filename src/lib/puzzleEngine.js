/**
 * Puzzle Engine
 * Generates real, valid crossword and word search grids.
 *
 * Crossword: wraps crossword-layout-generator npm package
 * Word Search: custom placement algorithm (H/V/diagonal, with random fill)
 */

// ============================================================
// CROSSWORD ENGINE
// ============================================================

/**
 * Generate a crossword grid from a list of words and clues.
 * Uses crossword-layout-generator to produce a connected layout.
 *
 * @param {Array<{ word: string, clue: string }>} wordList
 * @param {{ cols?: number, rows?: number }} opts
 * @returns {{ grid: string[][], acrossClues: Clue[], downClues: Clue[], wordPlacements: any[], placedCount: number, totalCount: number }}
 */
export function generateCrossword(wordList) {
  // Dynamic import for browser compatibility
  const generateLayout = loadCrosswordGenerator();

  // Prepare input: words must be uppercase, no spaces
  const cleanedInput = wordList
    .filter(({ word }) => word && word.trim().length > 1)
    .map(({ word, clue }) => ({
      answer: word.toUpperCase().replace(/\s+/g, ''),
      clue: clue || word,
    }));

  if (cleanedInput.length === 0) throw new Error('No valid words to generate crossword');

  const result = generateLayout(cleanedInput);

  if (!result || !result.result || result.result.length === 0) {
    throw new Error('Crossword generator could not build a layout with these words');
  }

  const rows = result.rows;
  const cols = result.cols;

  // Build the answer grid (filled with letters)
  const answerGrid = Array.from({ length: rows }, () => Array(cols).fill(''));

  for (const placement of result.result) {
    const { starty, startx, orientation } = placement;
    if (orientation === 'none') continue;
    const word = placement.answer;

    for (let i = 0; i < word.length; i++) {
      let r = starty;
      let c = startx;
      if (orientation === 'across') c += i;
      else if (orientation === 'down') r += i;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        answerGrid[r][c] = word[i];
      }
    }
  }

  // Build the blank puzzle grid (only mark which cells are active)
  const puzzleGrid = answerGrid.map((row) => row.map((cell) => (cell ? '#' : '')));

  // Assign clue numbers
  const numberedCells = {};
  let clueNumber = 1;
  const acrossClues = [];
  const downClues = [];

  for (const placement of result.result) {
    if (placement.orientation === 'none') continue;
    const key = `${placement.starty}-${placement.startx}`;
    if (!numberedCells[key]) {
      numberedCells[key] = clueNumber++;
    }
    const num = numberedCells[key];
    const clueObj = {
      number: num,
      clue: placement.clue,
      answer: placement.answer,
      startRow: placement.starty,
      startCol: placement.startx,
      length: placement.answer.length,
      orientation: placement.orientation,
    };
    if (placement.orientation === 'across') acrossClues.push(clueObj);
    else if (placement.orientation === 'down') downClues.push(clueObj);
  }

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return {
    rows,
    cols,
    answerGrid,   // full with letters — for answer key
    puzzleGrid,   // '#' for active cells, '' for black
    numberedCells, // { 'row-col': clueNumber }
    acrossClues,
    downClues,
    wordPlacements: result.result,
    placedCount: result.result.filter((r) => r.orientation !== 'none').length,
    totalCount: cleanedInput.length,
  };
}

/** Lazily load the crossword layout generator (works in both Node and browser) */
function loadCrosswordGenerator() {
  try {
    // eslint-disable-next-line no-undef
    const mod = require('crossword-layout-generator');
    return mod.generateLayout || mod.default?.generateLayout || mod;
  } catch {
    throw new Error('crossword-layout-generator not installed. Run: npm install crossword-layout-generator');
  }
}


// ============================================================
// WORD SEARCH ENGINE
// ============================================================

const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [1, -1],  // diagonal down-left
  [0, -1],  // left (backward)
  [-1, 0],  // up (backward)
  [-1, -1], // diagonal up-left
  [-1, 1],  // diagonal up-right
];

// Directions used in easier puzzles (no backward/diagonal-back)
const EASY_DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
];

/**
 * Generate a word search grid.
 *
 * @param {Array<{ word: string, hint?: string }>} wordList
 * @param {{ size?: number, difficulty?: 'easy'|'medium'|'hard', allowBackward?: boolean, allowDiagonal?: boolean }} opts
 * @returns {{ grid: string[][], answerGrid: (string|null)[][], wordList: PlacedWord[], size: number, notPlaced: string[] }}
 */
export function generateWordSearch(wordList, opts = {}) {
  const { size: preferredSize, difficulty = 'medium' } = opts;

  // Clean words
  const words = wordList
    .filter(({ word }) => word && word.trim().length >= 2)
    .map(({ word, hint }) => ({
      word: word.toUpperCase().replace(/\s+/g, ''),
      hint: hint || word,
    }))
    .sort((a, b) => b.word.length - a.word.length); // longest first for better placement

  if (words.length === 0) throw new Error('No valid words for word search');

  // Calculate appropriate grid size
  const longestWord = Math.max(...words.map((w) => w.word.length));
  const minSize = Math.max(longestWord + 2, Math.ceil(Math.sqrt(words.length * 5)));
  const gridSize = preferredSize || Math.min(Math.max(minSize, 12), 20);

  // Choose available directions based on difficulty
  const dirs = difficulty === 'easy' ? EASY_DIRECTIONS : DIRECTIONS;

  // Initialize empty grid
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

  // answerGrid tracks which cells belong to which word (for highlighting)
  const answerGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

  const placedWords = [];
  const notPlaced = [];

  for (const wordObj of words) {
    const { word } = wordObj;
    let placed = false;
    const attempts = 200;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const [dr, dc] = dir;

      // Random starting position — biased to fit the word
      const maxR = dr > 0 ? gridSize - word.length : dr < 0 ? word.length - 1 : gridSize - 1;
      const maxC = dc > 0 ? gridSize - word.length : dc < 0 ? word.length - 1 : gridSize - 1;
      const minR = dr < 0 ? word.length - 1 : 0;
      const minC = dc < 0 ? word.length - 1 : 0;

      if (maxR < minR || maxC < minC) continue;

      const startR = minR + Math.floor(Math.random() * (maxR - minR + 1));
      const startC = minC + Math.floor(Math.random() * (maxC - minC + 1));

      // Check if placement is valid (no conflicts — only matching letters allowed)
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = startR + dr * i;
        const c = startC + dc * i;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { canPlace = false; break; }
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) { canPlace = false; break; }
      }

      if (canPlace) {
        // Place the word
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          grid[r][c] = word[i];
          answerGrid[r][c] = word;
          cells.push([r, c]);
        }
        placedWords.push({ ...wordObj, cells, direction: dr === 0 ? (dc > 0 ? 'right' : 'left') : dc === 0 ? (dr > 0 ? 'down' : 'up') : `diagonal` });
        placed = true;
        break;
      }
    }

    if (!placed) notPlaced.push(word);
  }

  // Fill remaining empty cells with random uppercase letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return {
    size: gridSize,
    grid,       // filled grid with random letters — same for puzzle and answer key
    answerGrid, // null for filler, word string for word cells
    wordList: placedWords,
    notPlaced,
  };
}
