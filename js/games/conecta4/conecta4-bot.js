/**
 * conecta4-bot.js — heurística del bot para Conecta 4.
 *   'facil'   -> columna válida al azar.
 *   'normal'  -> gana si puede, bloquea si el rival puede ganar, si no,
 *                prefiere columnas centrales.
 *   'dificil' -> minimax con poda alfa-beta (profundidad 4) sobre una
 *                función de evaluación por "ventanas" de 4 casillas.
 */
(function (global) {
  const { ROWS, COLS, checkWinner, lowestEmptyRow, isBoardFull } = global.GameHub.Conecta4Helpers;

  function cloneBoard(board) { return board.map((row) => row.slice()); }

  function dropSim(board, col, mark) {
    const copy = cloneBoard(board);
    const row = lowestEmptyRow(copy, col);
    if (row === -1) return null;
    copy[row][col] = mark;
    return copy;
  }

  function validColumns(board) {
    const out = [];
    for (let c = 0; c < COLS; c++) if (lowestEmptyRow(board, c) !== -1) out.push(c);
    return out;
  }

  function randomColumn(board) {
    const cols = validColumns(board);
    return cols[Math.floor(Math.random() * cols.length)];
  }

  const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];

  function winningColumn(board, mark) {
    for (const c of validColumns(board)) {
      const copy = dropSim(board, c, mark);
      if (copy && checkWinner(copy)) return c;
    }
    return -1;
  }

  function heuristicColumn(board, mark, otherMark) {
    const win = winningColumn(board, mark);
    if (win !== -1) return win;
    const block = winningColumn(board, otherMark);
    if (block !== -1) return block;
    const valid = validColumns(board);
    return CENTER_ORDER.find((c) => valid.includes(c));
  }

  // --- Evaluación por ventanas de 4 (heurística clásica de Conecta 4) ---
  function scoreWindow(cells, mark, otherMark) {
    const my = cells.filter((v) => v === mark).length;
    const opp = cells.filter((v) => v === otherMark).length;
    const empty = cells.filter((v) => !v).length;
    if (my === 4) return 10000;
    if (my === 3 && empty === 1) return 50;
    if (my === 2 && empty === 2) return 8;
    if (opp === 3 && empty === 1) return -60;
    return 0;
  }

  function evaluateBoard(board, mark, otherMark) {
    let score = 0;
    // Preferencia por el centro.
    for (let r = 0; r < ROWS; r++) if (board[r][3] === mark) score += 3;

    const lines = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) lines.push([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]]);
    }
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) lines.push([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]]);
    }
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        lines.push([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]]);
        lines.push([board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]]);
      }
    }
    lines.forEach((w) => { score += scoreWindow(w, mark, otherMark); });
    return score;
  }

  function minimax(board, depth, alpha, beta, maximizing, mark, otherMark) {
    const win = checkWinner(board);
    if (win) return { score: win.mark === mark ? 1000000 - depth : -1000000 + depth };
    const valid = validColumns(board);
    if (depth === 0 || valid.length === 0) return { score: evaluateBoard(board, mark, otherMark) };

    let best = null;
    const order = CENTER_ORDER.filter((c) => valid.includes(c));
    for (const c of order) {
      const copy = dropSim(board, c, maximizing ? mark : otherMark);
      const result = minimax(copy, depth - 1, alpha, beta, !maximizing, mark, otherMark);
      const score = result.score;
      if (best === null || (maximizing ? score > best.score : score < best.score)) {
        best = { score, col: c };
      }
      if (maximizing) alpha = Math.max(alpha, best.score); else beta = Math.min(beta, best.score);
      if (alpha >= beta) break;
    }
    return best;
  }

  function chooseColumn(board, mark, difficulty) {
    const otherMark = mark === 'r' ? 'y' : 'r';
    if (difficulty === 'facil') return randomColumn(board);
    if (difficulty === 'normal') return heuristicColumn(board, mark, otherMark);
    const result = minimax(board, 4, -Infinity, Infinity, true, mark, otherMark);
    return result && result.col !== undefined ? result.col : heuristicColumn(board, mark, otherMark);
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.Conecta4Bot = { chooseColumn };
})(window);
