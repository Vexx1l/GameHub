/**
 * quiniela-bot.js — heurística para la Quiniela de Fútbol.
 *
 * Como el marcador real se sortea al azar (no hay "forma" de un equipo
 * que analizar), no existe una estrategia óptima real. Para que la
 * dificultad siga significando algo, cada nivel usa una distribución de
 * goles distinta:
 *   - "facil": pronostica goles totalmente al azar (0 a 4, sin ventaja
 *     de local), así que acierta por pura casualidad.
 *   - "normal" y "dificil": usan la MISMA distribución de goles que el
 *     motor usa para generar el marcador real (con ventaja de local), así
 *     que en promedio aciertan el resultado (L/E/V) con más frecuencia
 *     que "facil" — "dificil" además favorece el empate un poco menos al
 *     azar para variar sus marcadores exactos.
 */
(function (global) {
  function choosePrediction(matches, difficulty) {
    const H = global.GameHub.QuinielaHelpers;
    return matches.map(() => {
      if (difficulty === 'facil') {
        return { local: Math.floor(Math.random() * 5), visitante: Math.floor(Math.random() * 5) };
      }
      const local = H.weightedGoals(H.GOAL_WEIGHTS_HOME);
      const visitante = H.weightedGoals(H.GOAL_WEIGHTS_AWAY);
      if (difficulty === 'dificil' && local === visitante && Math.random() < 0.4) {
        // Evita empatar en el pronóstico un poco más seguido, para variar marcadores exactos.
        return Math.random() < 0.5 ? { local: local + 1, visitante } : { local, visitante: visitante + 1 };
      }
      return { local, visitante };
    });
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.QuinielaBot = { choosePrediction };
})(window);
