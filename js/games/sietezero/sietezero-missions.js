/**
 * Misiones extra de "Selección de Ensueño" — inspiradas en la idea de logros
 * opcionales del juego 7a0 (aparte del objetivo principal de ganar 7 a 0).
 * Reimplementación propia: lista y condiciones originales, no tomadas de
 * ningún archivo del sitio original.
 *
 * Cada misión define check(result, draft) -> boolean, evaluada una vez
 * termina la simulación de un asiento.
 */
(function (global) {
  const MISSIONS = [
    {
      id: 'poliglota',
      icon: '🌍',
      label: 'Poliglota',
      desc: 'Convocaste jugadores de 4 selecciones distintas o más.',
      check(result, draft) {
        const countries = new Set(draft.filled.filter(Boolean).map((f) => f.team.country));
        return countries.size >= 4;
      },
    },
    {
      id: 'maquina-del-tiempo',
      icon: '🕰️',
      label: 'Máquina del tiempo',
      desc: 'Tu once mezcla Mundiales con 30 años o más de diferencia.',
      check(result, draft) {
        const years = draft.filled.filter(Boolean).map((f) => f.team.year);
        if (!years.length) return false;
        return Math.max(...years) - Math.min(...years) >= 30;
      },
    },
    {
      id: 'muralla',
      icon: '🧱',
      label: 'Muralla',
      desc: 'No recibiste goles en la fase de grupos.',
      check(result) {
        return result.games.slice(0, 3).every((g) => g.golsOpp === 0);
      },
    },
    {
      id: 'goleada',
      icon: '💥',
      label: 'Goleada',
      desc: 'Metiste 4 goles o más en un mismo partido.',
      check(result) {
        return result.games.some((g) => g.golsMy >= 4);
      },
    },
    {
      id: 'al-limite',
      icon: '😅',
      label: 'Al límite',
      desc: 'Avanzaste de grupos con lo justo (4 de 9 puntos).',
      check(result) {
        const pts = result.games.slice(0, 3).reduce((acc, g) => {
          if (g.golsMy > g.golsOpp) return acc + 3;
          if (g.golsMy === g.golsOpp) return acc + 1;
          return acc;
        }, 0);
        return result.advanced && pts === 4;
      },
    },
    {
      id: 'once-metros',
      icon: '🥅',
      label: 'Héroe de los once metros',
      desc: 'Ganaste una tanda de penales.',
      check(result) {
        return result.games.some((g) => g.decidedByPenalties && g.wonPenalties);
      },
    },
    {
      id: 'campeon',
      icon: '🏆',
      label: 'Campeón del Mundial',
      desc: 'Levantaste el trofeo.',
      check(result) {
        return result.champion;
      },
    },
    {
      id: 'siete-a-cero',
      icon: '⭐',
      label: '7 a 0',
      desc: 'Campeón, invicto y sin recibir un solo gol.',
      check(result) {
        return result.perfect7a0;
      },
    },
  ];

  function evaluate(result, draft) {
    return MISSIONS.filter((m) => {
      try { return m.check(result, draft); } catch (e) { return false; }
    }).map((m) => ({ id: m.id, icon: m.icon, label: m.label, desc: m.desc }));
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.SieteZeroMissions = { MISSIONS, evaluate };
})(window);
