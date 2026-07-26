/**
 * uno-bot.js — heurística simple para UNO (no es búsqueda tipo minimax).
 * Prioriza soltar cartas numéricas/de acción y reservarse los comodines
 * para cuando de verdad los necesite; en difícil además prefiere jugar
 * el color del que tiene más copias en mano, para mantener flexibilidad.
 */
(function (global) {
  function colorCounts(hand) {
    const counts = {};
    hand.forEach((c) => { if (c.color !== 'negro') counts[c.color] = (counts[c.color] || 0) + 1; });
    return counts;
  }

  /** Elige qué carta jugar de entre las jugables (o null si prefiere no elegir, nunca pasa). */
  function chooseCard(hand, playable, difficulty) {
    if (!playable.length) return null;
    if (difficulty === 'facil') return playable[Math.floor(Math.random() * playable.length)];

    const counts = colorCounts(hand);
    const scored = playable.map((card) => {
      let score = 0;
      if (card.color === 'negro') score += 1; // reservar comodines para el final
      else if (/^[0-9]$/.test(card.value)) score += 4;
      else score += 6; // salta / reversa / +2: buena para incomodar al rival

      if (difficulty === 'dificil' && card.color !== 'negro') {
        score += (counts[card.color] || 0) * 1.5; // soltar el color que más abunda
      }
      return { card, score };
    });
    scored.sort((a, b) => b.score - a.score);
    // un poco de variedad entre las mejores opciones para que no sea 100% predecible
    const top = scored.filter((s) => s.score >= scored[0].score - 1);
    return top[Math.floor(Math.random() * top.length)].card;
  }

  /** Elige el color a declarar al jugar un comodín. */
  function chooseColor(hand, difficulty) {
    const counts = colorCounts(hand);
    const colors = Object.keys(counts);
    if (difficulty !== 'facil' && colors.length) {
      colors.sort((a, b) => counts[b] - counts[a]);
      return colors[0];
    }
    const all = ['rojo', 'amarillo', 'verde', 'azul'];
    return all[Math.floor(Math.random() * all.length)];
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.UnoBot = { chooseCard, chooseColor };
})(window);
