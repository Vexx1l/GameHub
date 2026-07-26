/**
 * naipes-bot.js — heurística simple para "Escalera y Trío".
 * No es una búsqueda exhaustiva; solo puntúa qué tan "cerca" está
 * cada carta de aportar a la combinación elegida (grupos por rango
 * para 4-4-3, o rango + vecindad de palo para la escalera del 5-3-3).
 */
(function (global) {
  function analyzeHand(hand) {
    const rankCounts = {};
    const suitRanks = {};
    let jokers = 0;
    hand.forEach((c) => {
      if (c.joker) { jokers += 1; return; }
      rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
      suitRanks[c.suit] = suitRanks[c.suit] || [];
      suitRanks[c.suit].push(c.rank);
    });

    const rankSetScore = Object.values(rankCounts)
      .reduce((sum, count) => sum + (count >= 2 ? count : 0), 0) + jokers * 1.2;

    let bestRun = 0;
    Object.values(suitRanks).forEach((ranks) => {
      const uniq = [...new Set(ranks)].sort((a, b) => a - b);
      let run = 1, best = 1;
      for (let i = 1; i < uniq.length; i++) {
        run = (uniq[i] === uniq[i - 1] + 1) ? run + 1 : 1;
        best = Math.max(best, run);
      }
      bestRun = Math.max(bestRun, best);
    });
    const straightScore = bestRun + jokers * 1.2;

    return { rankSetScore, straightScore, suggestion: straightScore > rankSetScore ? '5-3-3' : '4-4-3' };
  }

  function chooseType(hand, difficulty) {
    if (difficulty === 'facil') return Math.random() < 0.5 ? '4-4-3' : '5-3-3';
    return analyzeHand(hand).suggestion;
  }

  /** Qué tan útil es una carta para el objetivo declarado (mayor = más útil, no descartar). */
  function cardUsefulness(hand, card, type) {
    if (card.joker) return 60;
    const rankMatches = hand.filter((c) => !c.joker && c.rank === card.rank && c.uid !== card.uid).length;
    let score = 0;
    if (type === '4-4-3') {
      score += rankMatches * 14;
    } else {
      score += rankMatches * 8;
      const neighbors = hand.filter((c) => !c.joker && c.suit === card.suit
        && c.uid !== card.uid && Math.abs(c.rank - card.rank) <= 2).length;
      score += neighbors * 7;
    }
    // As y figuras valen más puntos si se quedan pegadas en la mano al perder: penalizar un poco su retención
    if (!card.joker && (card.rank >= 11 || card.rank === 1)) score -= 2;
    return score;
  }

  function chooseDiscard(hand, type, difficulty) {
    if (difficulty === 'facil') return hand[Math.floor(Math.random() * hand.length)];
    const scored = hand.map((c) => ({ c, s: cardUsefulness(hand, c, type) }));
    scored.sort((a, b) => a.s - b.s);
    if (difficulty === 'dificil') return scored[0].c;
    const bottom = scored.slice(0, Math.min(3, scored.length));
    return bottom[Math.floor(Math.random() * bottom.length)].c;
  }

  /** ¿Le conviene al bot tomar la carta visible del descarte en vez de robar del mazo a ciegas? */
  function wantsDiscard(hand, discardTop, type, difficulty) {
    if (!discardTop) return false;
    if (difficulty === 'facil') return Math.random() < 0.2;
    const usefulness = cardUsefulness(hand, discardTop, type);
    const threshold = difficulty === 'dificil' ? 7 : 13;
    return usefulness >= threshold;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.NaipesBot = { chooseType, chooseDiscard, wantsDiscard };
})(window);
