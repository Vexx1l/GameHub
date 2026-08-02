/**
 * damas-bot.js — heurística del bot para Damas.
 *   'facil'   -> entre los movimientos legales (respetando la captura
 *                obligatoria), elige uno al azar.
 *   'normal'  -> si puede capturar, prefiere la cadena que come más
 *                fichas; si no, prefiere avanzar o coronar.
 *   'dificil' -> minimax a 2 turnos completos de profundidad sobre una
 *                evaluación de material (fichas y damas) y avance.
 */
(function (global) {
  const H = global.GameHub.DamasHelpers;
  const SIZE = H.SIZE;

  function cloneBoard(board) {
    return board.map((row) => row.map((cell) => (cell ? { color: cell.color, king: cell.king } : null)));
  }

  /** Genera todas las cadenas de captura completas posibles desde (r,c). */
  function captureChains(board, r, c, color) {
    const results = [];
    function dfs(curBoard, curR, curC, path, capturedCount) {
      const jumps = H.jumpsFor(curBoard, curR, curC);
      if (jumps.length === 0) {
        results.push({ board: curBoard, path: path.slice(), capturedCount });
        return;
      }
      jumps.forEach((j) => {
        const next = cloneBoard(curBoard);
        const piece = next[curR][curC];
        next[j.to[0]][j.to[1]] = piece;
        next[curR][curC] = null;
        next[j.captured[0]][j.captured[1]] = null;
        let promoted = false;
        const lastRow = color === 'negras' ? SIZE - 1 : 0;
        if (!piece.king && j.to[0] === lastRow) { piece.king = true; promoted = true; }
        const newPath = path.concat([j.to]);
        if (promoted) {
          results.push({ board: next, path: newPath, capturedCount: capturedCount + 1 });
        } else {
          dfs(next, j.to[0], j.to[1], newPath, capturedCount + 1);
        }
      });
    }
    dfs(board, r, c, [[r, c]], 0);
    return results;
  }

  /** Movimientos completos disponibles para `color` en `board` (simples o cadenas de captura). */
  function fullMoves(board, color) {
    const pieces = H.piecesOf(board, color);
    const mustCapture = H.anyCaptureAvailable(board, color);
    const moves = [];
    pieces.forEach(([r, c]) => {
      if (mustCapture) {
        if (H.jumpsFor(board, r, c).length > 0) {
          captureChains(board, r, c, color).forEach((chain) => moves.push({ from: [r, c], ...chain }));
        }
      } else {
        H.simpleMovesFor(board, r, c).forEach((m) => {
          const next = cloneBoard(board);
          const piece = next[r][c];
          next[m.to[0]][m.to[1]] = piece;
          next[r][c] = null;
          const lastRow = color === 'negras' ? SIZE - 1 : 0;
          if (!piece.king && m.to[0] === lastRow) piece.king = true;
          moves.push({ from: [r, c], board: next, path: [[r, c], m.to], capturedCount: 0 });
        });
      }
    });
    return moves;
  }

  function evaluate(board, color) {
    const other = color === 'blancas' ? 'negras' : 'blancas';
    let score = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = board[r][c];
        if (!p) continue;
        const value = p.king ? 3 : 1;
        const advance = p.king ? 0 : (p.color === 'negras' ? r : SIZE - 1 - r) * 0.05;
        const sign = p.color === color ? 1 : -1;
        score += sign * (value + advance);
      }
    }
    return score;
  }

  function minimaxFullMove(board, color, depth) {
    const other = color === 'blancas' ? 'negras' : 'blancas';
    function search(curBoard, turnColor, d, maximizing) {
      const moves = fullMoves(curBoard, turnColor);
      if (d === 0 || moves.length === 0) return { score: evaluate(curBoard, color) };
      let best = null;
      moves.forEach((mv) => {
        const result = search(mv.board, turnColor === 'blancas' ? 'negras' : 'blancas', d - 1, !maximizing);
        const score = result.score;
        if (best === null || (maximizing ? score > best.score : score < best.score)) {
          best = { score, move: mv };
        }
      });
      return best;
    }
    return search(board, color, depth, true);
  }

  function chooseMove(board, color, difficulty) {
    const moves = fullMoves(board, color);
    if (moves.length === 0) return null;
    if (difficulty === 'facil') return moves[Math.floor(Math.random() * moves.length)];
    if (difficulty === 'normal') {
      const maxCaptures = Math.max(...moves.map((m) => m.capturedCount));
      const best = moves.filter((m) => m.capturedCount === maxCaptures);
      return best[Math.floor(Math.random() * best.length)];
    }
    // dificil: minimax de 2 turnos completos.
    const result = minimaxFullMove(board, color, 2);
    return (result && result.move) || moves[0];
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.DamasBot = { chooseMove, fullMoves };
})(window);
