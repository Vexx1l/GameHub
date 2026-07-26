/**
 * domino-bot.js — heurística simple de selección de ficha.
 */
(function (global) {
  function scoreMove(engine, seatId, move) {
    const [a, b] = move.tile;
    let score = 0;

    score += (a + b) * 2;               // preferir soltar fichas pesadas primero
    if (a === b) score += 6;            // los dobles estorban, mejor jugarlos pronto

    const hand = engine.hands[seatId];
    if (hand.length === 1) score += 100; // esta jugada gana la ronda

    // Preferir el valor que más se repite en la mano (para no quedar bloqueado)
    const freq = {};
    hand.forEach(([x, y]) => { freq[x] = (freq[x] || 0) + 1; freq[y] = (freq[y] || 0) + 1; });
    const otherEnd = a === move.tile[0] ? b : a;
    score += (freq[otherEnd] || 0) * 1.5;

    return score;
  }

  function chooseMove(engine, seatId, moves, difficulty) {
    if (!moves.length) return null;
    if (difficulty === 'facil') {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const scored = moves.map((m) => ({ m, s: scoreMove(engine, seatId, m) }));
    scored.sort((a, b) => b.s - a.s);
    if (difficulty === 'dificil') return scored[0].m;
    const top = scored.slice(0, Math.min(2, scored.length));
    return top[Math.floor(Math.random() * top.length)].m;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.DominoBot = { chooseMove };
})(window);
