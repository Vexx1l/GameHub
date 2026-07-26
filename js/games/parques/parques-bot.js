/**
 * parques-bot.js — heurística simple para elegir jugada.
 * No es un motor de búsqueda; son reglas de sentido común que dan
 * una sensación razonable de "el bot sabe jugar", suficientes para
 * un proyecto que se puede seguir afinando después.
 */
(function (global) {
  const Board = global.GameHub.ParquesBoard;

  function scoreMove(engine, move) {
    let score = 0;

    if (move.isCapture) score += 60;          // capturar es prioritario
    if (move.to === 57) score += 50;           // llegar a la meta
    if (move.isExit) score += 25;              // sacar ficha de la casa vale bastante

    // Preferir avanzar más casillas
    score += (move.to - Math.max(move.from, 0)) * 1.5;

    // Preferir aterrizar en casilla segura
    if (move.to <= 50 && move.to >= 0) {
      const meta = Board.COLOR_META[move.color];
      const gIdx = (meta.startIndex + move.to) % 52;
      if (Board.SAFE_INDICES.has(gIdx)) score += 12;
    }

    // Preferir mover fichas que ya van avanzadas (cerca de casa)
    if (move.from >= 40) score += 8;

    return score;
  }

  /**
   * @param {'facil'|'normal'|'dificil'} difficulty
   */
  function chooseMove(engine, moves, difficulty) {
    if (!moves.length) return null;
    if (difficulty === 'facil') {
      // mayormente aleatorio, con ligera preferencia por capturar/llegar a meta
      const easyBias = moves.filter((m) => m.isCapture || m.to === 57);
      const pool = easyBias.length && Math.random() < 0.5 ? easyBias : moves;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const scored = moves.map((m) => ({ m, s: scoreMove(engine, m) }));
    scored.sort((a, b) => b.s - a.s);

    if (difficulty === 'dificil') {
      return scored[0].m; // siempre la mejor jugada según la heurística
    }

    // 'normal': elige entre las 2 mejores para no ser perfecto
    const top = scored.slice(0, Math.min(2, scored.length));
    return top[Math.floor(Math.random() * top.length)].m;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.ParquesBot = { chooseMove };
})(window);
