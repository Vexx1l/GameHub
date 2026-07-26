/**
 * generala-bot.js — heurística simple para Generala (no es probabilística
 * exacta, solo patrones razonables): retiene el grupo más prometedor entre
 * tiradas y, al anotar, elige la categoría libre de mayor puntaje —o
 * sacrifica primero las categorías especiales difíciles si todo da 0.
 */
(function (global) {
  function tally(dice) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    dice.forEach((d) => { counts[d] += 1; });
    return counts;
  }

  /** Devuelve un arreglo de 5 booleanos: qué dados conviene retener. */
  function chooseHoldMask(dice, difficulty) {
    const counts = tally(dice);
    const values = Object.keys(counts).map(Number).filter((v) => counts[v] > 0);
    const maxCount = Math.max(...values.map((v) => counts[v]));
    const maxValue = values.find((v) => counts[v] === maxCount);

    if (difficulty === 'facil') {
      return dice.map((d) => d === maxValue && maxCount >= 2);
    }

    const countsSorted = Object.values(counts).filter((c) => c > 0).sort((a, b) => b - a);
    const hasFullAlready = countsSorted[0] === 3 && countsSorted[1] === 2;
    if (hasFullAlready || maxCount >= 4) return dice.map(() => true); // full, póker o generala ya logrados

    if (maxCount === 3) return dice.map((d) => d === maxValue);

    // potencial de escalera
    const uniqueSorted = [...new Set(dice)].sort((a, b) => a - b);
    const candidates = [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]];
    let best = [];
    candidates.forEach((seq) => {
      const present = seq.filter((v) => uniqueSorted.includes(v));
      if (present.length > best.length) best = present;
    });
    if (best.length >= 3 && best.length >= maxCount) {
      const used = new Set();
      return dice.map((d) => {
        if (best.includes(d) && !used.has(d)) { used.add(d); return true; }
        return false;
      });
    }

    if (maxCount === 2) return dice.map((d) => d === maxValue);

    if (difficulty === 'dificil') {
      const highest = Math.max(...dice);
      return dice.map((d) => d === highest);
    }
    return dice.map(() => false);
  }

  const SACRIFICE_ORDER = ['generala', 'poker', 'full', 'escalera', 'seises', 'unos', 'doses', 'treses', 'cuatros', 'cincos'];

  /** Elige en qué categoría libre anotar, dados los dados finales. */
  function chooseCategory(dice, openCategoryIds, difficulty, computeScoreFn) {
    const scored = openCategoryIds.map((id) => ({ id, value: computeScoreFn(id, dice, false) }));
    scored.sort((a, b) => b.value - a.value);
    if (difficulty === 'facil' && Math.random() < 0.3) {
      return openCategoryIds[Math.floor(Math.random() * openCategoryIds.length)];
    }
    if (scored[0].value === 0) {
      for (const id of SACRIFICE_ORDER) { if (openCategoryIds.includes(id)) return id; }
    }
    return scored[0].id;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.GeneralaBot = { chooseHoldMask, chooseCategory };
})(window);
