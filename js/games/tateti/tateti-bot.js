/**
 * tateti-bot.js — heurística del bot para Ta-Te-Ti.
 *   'facil'   -> casilla vacía al azar.
 *   'normal'  -> gana si puede, bloquea si el rival puede ganar, si no, azar
 *                (con preferencia por el centro y las esquinas).
 *   'dificil' -> minimax perfecto (nunca pierde).
 */
(function (global) {
  const { checkWinner } = global.GameHub.TatetiHelpers;

  function randomCell(board) {
    const empties = [];
    board.forEach((v, i) => { if (!v) empties.push(i); });
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function winningMove(board, mark) {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const copy = board.slice();
      copy[i] = mark;
      if (checkWinner(copy)) return i;
    }
    return -1;
  }

  const PREFERRED = [4, 0, 2, 6, 8, 1, 3, 5, 7];

  function heuristicMove(board, mark, otherMark) {
    const win = winningMove(board, mark);
    if (win !== -1) return win;
    const block = winningMove(board, otherMark);
    if (block !== -1) return block;
    return PREFERRED.find((i) => !board[i]);
  }

  function minimax(board, mark, otherMark, isMaximizing) {
    const win = checkWinner(board);
    if (win) return win.mark === mark ? { score: 10 } : { score: -10 };
    if (board.every((v) => v)) return { score: 0 };

    let best = null;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const copy = board.slice();
      copy[i] = isMaximizing ? mark : otherMark;
      const result = minimax(copy, mark, otherMark, !isMaximizing);
      const score = result.score - (isMaximizing ? 0 : 0);
      if (best === null
        || (isMaximizing && score > best.score)
        || (!isMaximizing && score < best.score)) {
        best = { score, index: i };
      }
    }
    return best;
  }

  function chooseMove(board, mark, difficulty) {
    const otherMark = mark === 'x' ? 'o' : 'x';
    if (difficulty === 'facil') return randomCell(board);
    if (difficulty === 'normal') {
      const move = heuristicMove(board, mark, otherMark);
      return move !== undefined ? move : randomCell(board);
    }
    // dificil: minimax perfecto
    const result = minimax(board, mark, otherMark, true);
    return result && result.index !== undefined ? result.index : randomCell(board);
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.TatetiBot = { chooseMove };
})(window);
