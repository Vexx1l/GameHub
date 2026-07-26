/**
 * penales-bot.js — heurística para la Tanda de Penales.
 *
 * Disparo: en "facil" el bot patea a cualquiera de las 6 zonas por
 * igual; en "normal" y "dificil" favorece las esquinas (más difíciles
 * de atajar) sobre el centro, como haría un pateador real.
 *
 * Atajada: en "facil" el arquero vuela a cualquier zona al azar; en
 * "normal" favorece las esquinas (ahí patea la mayoría); en "dificil"
 * además revisa el historial de disparos de ese rival en la tanda y,
 * la mitad de las veces que hay un patrón claro, se tira a la zona que
 * ese rival más ha usado — una lectura de patrones simple, no infalible.
 */
(function (global) {
  const CORNER_ZONES = ['AI', 'AD', 'BI', 'BD'];
  const CENTER_ZONES = ['AC', 'BC'];
  const ALL_ZONES = [...CORNER_ZONES, ...CENTER_ZONES];

  function weightedZone() {
    // Esquinas con el doble de peso que el centro.
    const pool = [...CORNER_ZONES, ...CORNER_ZONES, ...CENTER_ZONES];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function chooseShotZone(difficulty) {
    if (difficulty === 'facil') return ALL_ZONES[Math.floor(Math.random() * ALL_ZONES.length)];
    return weightedZone();
  }

  function chooseKeepZone(difficulty, opponentHistory) {
    if (difficulty === 'facil') return ALL_ZONES[Math.floor(Math.random() * ALL_ZONES.length)];
    if (difficulty === 'dificil' && opponentHistory.length >= 2 && Math.random() < 0.5) {
      const freq = {};
      opponentHistory.forEach((z) => { freq[z] = (freq[z] || 0) + 1; });
      const best = Object.keys(freq).reduce((a, b) => (freq[a] >= freq[b] ? a : b));
      return best;
    }
    return weightedZone();
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.PenalesBot = { chooseShotZone, chooseKeepZone };
})(window);
