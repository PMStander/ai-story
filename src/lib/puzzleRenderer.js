/**
 * Puzzle Renderer
 * Converts crossword and word search data to SVG strings.
 * SVGs are self-contained and suitable for print (no external deps).
 */

// ============================================================
// CROSSWORD RENDERER
// ============================================================

/**
 * Render a crossword puzzle or answer key as an SVG data URL.
 *
 * @param {import('./puzzleEngine').CrosswordData} data - output from generateCrossword()
 * @param {{ showAnswers?: boolean, title?: string, cellSize?: number, fontSize?: number }} opts
 * @returns {string} SVG string
 */
export function renderCrossword(data, opts = {}) {
  const {
    showAnswers = false,
    title = '',
    cellSize = 30,
  } = opts;

  const { rows, cols, answerGrid, numberedCells, acrossClues, downClues } = data;

  const PADDING = 24;
  const NUMBER_FONT = Math.floor(cellSize * 0.28);
  const LETTER_FONT = Math.floor(cellSize * 0.52);
  const CLUE_FONT = 11;
  const CLUE_LINE_H = 16;
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  // Build grid cells SVG
  let gridSvg = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = PADDING + c * cellSize;
      const y = PADDING + r * cellSize;
      const isActive = answerGrid[r][c] !== '';
      const cellKey = `${r}-${c}`;
      const cellNum = numberedCells[cellKey];

      if (!isActive) {
        // Black cell
        gridSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#1a1a1a"/>`;
      } else {
        // White active cell
        gridSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white" stroke="#333" stroke-width="1.5"/>`;

        // Clue number
        if (cellNum) {
          gridSvg += `<text x="${x + 2.5}" y="${y + NUMBER_FONT + 1}" font-family="Arial" font-size="${NUMBER_FONT}" fill="#333" font-weight="bold">${cellNum}</text>`;
        }

        // Answer letter (only in answer key mode)
        if (showAnswers && answerGrid[r][c]) {
          gridSvg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + LETTER_FONT * 0.38}" font-family="Arial" font-size="${LETTER_FONT}" fill="${showAnswers ? '#c0392b' : '#333'}" text-anchor="middle" font-weight="bold">${answerGrid[r][c]}</text>`;
        }
      }
    }
  }

  // Build clues SVG
  const clueStartY = PADDING + gridHeight + 20;
  let cluesSvg = '';

  const renderClueList = (clues, label, startX, startY, maxWidth) => {
    let svg = '';
    svg += `<text x="${startX}" y="${startY}" font-family="Arial" font-size="${CLUE_FONT + 2}" font-weight="bold" fill="#1a1a1a">${label}</text>`;
    let y = startY + CLUE_LINE_H + 4;

    for (const clue of clues) {
      const text = `${clue.number}. ${clue.clue}`;
      // Wrap long clues
      const words = text.split(' ');
      let line = '';
      let lineCount = 0;
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (testLine.length > Math.floor(maxWidth / (CLUE_FONT * 0.55))) {
          svg += `<text x="${startX}" y="${y + lineCount * CLUE_LINE_H}" font-family="Arial" font-size="${CLUE_FONT}" fill="#333">${escapeXml(line)}</text>`;
          line = word;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      if (line) {
        svg += `<text x="${startX}" y="${y + lineCount * CLUE_LINE_H}" font-family="Arial" font-size="${CLUE_FONT}" fill="#333">${escapeXml(line)}</text>`;
        lineCount++;
      }
      y += (lineCount + 0.3) * CLUE_LINE_H;
    }
    return { svg, finalY: y };
  };

  const halfW = (gridWidth + PADDING) / 2;
  const acrossResult = renderClueList(acrossClues, 'ACROSS', PADDING, clueStartY, halfW - 12);
  const downResult = renderClueList(downClues, 'DOWN', PADDING + halfW, clueStartY, halfW - 12);
  cluesSvg = acrossResult.svg + downResult.svg;

  const totalH = Math.max(acrossResult.finalY, downResult.finalY) + PADDING;
  const totalW = gridWidth + 2 * PADDING;

  // Title
  const titleSvg = title
    ? `<text x="${totalW / 2}" y="${PADDING - 6}" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="#1a1a1a">${escapeXml(title)}</text>`
    : '';

  // Answer key label
  const answerLabel = showAnswers
    ? `<text x="${totalW - PADDING}" y="${PADDING - 6}" font-family="Arial" font-size="11" fill="#c0392b" text-anchor="end" font-weight="bold">ANSWER KEY</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="white"/>
  ${titleSvg}
  ${answerLabel}
  ${gridSvg}
  ${cluesSvg}
</svg>`;
}


// ============================================================
// WORD SEARCH RENDERER
// ============================================================

/**
 * Render a word search puzzle or answer key as SVG.
 *
 * @param {import('./puzzleEngine').WordSearchData} data - output from generateWordSearch()
 * @param {{ showAnswers?: boolean, title?: string, cellSize?: number }} opts
 * @returns {string} SVG string
 */
export function renderWordSearch(data, opts = {}) {
  const { showAnswers = false, title = '', cellSize = 26 } = opts;
  const { size, grid, answerGrid, wordList } = data;
  const PADDING = 24;
  const LETTER_FONT = Math.floor(cellSize * 0.5);
  const CLUE_FONT = 11;
  const CLUE_LINE_H = 16;
  const COLS_WORDS = 3;

  // Highlight colors for answer mode
  const HIGHLIGHT_COLORS = [
    '#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#20c997','#f783ac'
  ];
  const wordColorMap = {};
  wordList.forEach((w, i) => {
    wordColorMap[w.word] = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
  });

  const gridPx = size * cellSize;
  let gridSvg = '';

  // Draw cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = PADDING + c * cellSize;
      const y = PADDING + r * cellSize;
      const letter = grid[r][c];
      const wordHere = answerGrid[r][c];
      const highlight = showAnswers && wordHere;
      const color = highlight ? wordColorMap[wordHere] : null;

      if (highlight) {
        gridSvg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" opacity="0.35"/>`;
      }
      gridSvg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + LETTER_FONT * 0.38}" font-family="Courier New, monospace" font-size="${LETTER_FONT}" font-weight="bold" fill="${highlight ? '#1a1a1a' : '#222'}" text-anchor="middle">${letter}</text>`;
    }
  }

  // Draw grid lines
  gridSvg += `<rect x="${PADDING}" y="${PADDING}" width="${gridPx}" height="${gridPx}" fill="none" stroke="#ccc" stroke-width="1"/>`;
  for (let r = 0; r <= size; r++) {
    gridSvg += `<line x1="${PADDING}" y1="${PADDING + r * cellSize}" x2="${PADDING + gridPx}" y2="${PADDING + r * cellSize}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  }
  for (let c = 0; c <= size; c++) {
    gridSvg += `<line x1="${PADDING + c * cellSize}" y1="${PADDING}" x2="${PADDING + c * cellSize}" y2="${PADDING + gridPx}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  }

  // Word list below grid
  const wordListY = PADDING + gridPx + 20;
  let wordListSvg = '';
  wordListSvg += `<text x="${PADDING}" y="${wordListY}" font-family="Arial" font-size="${CLUE_FONT + 1}" font-weight="bold" fill="#1a1a1a">FIND THE WORDS:</text>`;

  const colWidth = (gridPx + PADDING) / COLS_WORDS;
  wordList.forEach(({ word, hint }, i) => {
    const col = i % COLS_WORDS;
    const row = Math.floor(i / COLS_WORDS);
    const x = PADDING + col * colWidth;
    const y = wordListY + CLUE_LINE_H * 1.6 + row * CLUE_LINE_H;
    const matchColor = showAnswers ? wordColorMap[word] : '#1a1a1a';
    wordListSvg += `<text x="${x}" y="${y}" font-family="Arial" font-size="${CLUE_FONT}" fill="${matchColor}" font-weight="${showAnswers ? 'bold' : 'normal'}">${escapeXml(word)}${hint && hint !== word ? ` — ${escapeXml(hint)}` : ''}</text>`;
  });

  const wordRows = Math.ceil(wordList.length / COLS_WORDS);
  const totalH = wordListY + CLUE_LINE_H * 1.6 + wordRows * CLUE_LINE_H + PADDING;
  const totalW = gridPx + 2 * PADDING;

  const titleSvg = title
    ? `<text x="${totalW / 2}" y="${PADDING - 6}" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="#1a1a1a">${escapeXml(title)}</text>`
    : '';

  const answerLabel = showAnswers
    ? `<text x="${totalW - PADDING}" y="${PADDING - 6}" font-family="Arial" font-size="11" fill="#c0392b" text-anchor="end" font-weight="bold">ANSWER KEY</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="white"/>
  ${titleSvg}
  ${answerLabel}
  ${gridSvg}
  ${wordListSvg}
</svg>`;
}


// ============================================================
// SVG → Data URL
// ============================================================

/**
 * Convert an SVG string to a PNG data URL (via Canvas API).
 * Falls back to SVG data URL if canvas is unavailable.
 * @param {string} svgString
 * @param {{ width?: number, height?: number, scale?: number }} opts
 * @returns {Promise<string>} data URL
 */
export async function svgToDataUrl(svgString, opts = {}) {
  const { scale = 2 } = opts;

  // Parse dimensions from SVG
  const wMatch = svgString.match(/width="(\d+)"/);
  const hMatch = svgString.match(/height="(\d+)"/);
  const svgW = wMatch ? parseInt(wMatch[1]) : 800;
  const svgH = hMatch ? parseInt(hMatch[1]) : 600;

  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, svgW, svgH);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: return SVG as data URL
      resolve('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString));
    };

    img.src = url;
  });
}

// ============================================================
// Utilities
// ============================================================

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
