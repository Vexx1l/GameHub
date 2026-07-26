/**
 * quiniela-engine.js — lógica pura de la Quiniela de Fútbol, para 1 a 8
 * jugadores.
 *
 * Cada "jornada" (ronda) sortea 5 partidos entre un plantel de 16 equipos
 * ficticios. Por turnos, cada jugador arma su pronóstico para los 5
 * partidos (marcador exacto de goles locales y visitantes) y lo envía —
 * un poco al estilo de Escalera y Trío, "en privado" dentro de lo que da
 * jugar todos en la misma pantalla: mientras no se revele la jornada, no
 * se muestran los pronósticos ya enviados de los demás.
 *
 * Cuando todos enviaron su pronóstico, se "juegan" los 5 partidos (marcador
 * real generado al azar con una ligera ventaja de local) y se reparten
 * puntos:
 *   - 3 puntos si acertaste el marcador exacto de un partido.
 *   - 1 punto si acertaste el resultado (local/empate/visitante) pero no
 *     el marcador exacto.
 *   - 0 puntos si fallaste el resultado.
 * La suma de los 5 partidos es el puntaje de la jornada, que se acumula
 * a un histórico entre jornadas (como en Generala y Trivia), sin puntaje
 * objetivo para terminar — se puede seguir jugando jornada tras jornada.
 */
(function (global) {
  const TEAMS = [
    'Tigres FC', 'Real Cordillera', 'Atlético Andino', 'Deportivo Caribe',
    'Unión Pacífico', 'Club Andes', 'Bravos del Sur', 'Estrella Roja',
    'Halcones FC', 'Rayo Dorado', 'Cóndores FC', 'Marea Azul',
    'Sporting Llanero', 'Independiente Sabana', 'Puma Real', 'Titanes del Valle',
  ];

  // Pesos de goles 0..5 — el local tiene una ligera ventaja de cancha.
  const GOAL_WEIGHTS_HOME = [22, 30, 24, 14, 7, 3];
  const GOAL_WEIGHTS_AWAY = [28, 30, 21, 12, 6, 3];

  function weightedGoals(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i;
      r -= weights[i];
    }
    return weights.length - 1;
  }

  function simulateScore() {
    return { local: weightedGoals(GOAL_WEIGHTS_HOME), visitante: weightedGoals(GOAL_WEIGHTS_AWAY) };
  }

  function resultadoDe(score) {
    if (score.local > score.visitante) return 'L';
    if (score.local < score.visitante) return 'V';
    return 'E';
  }

  function pickMatches() {
    const shuffled = global.GameHub.Dice.shuffle(TEAMS).slice(0, 10);
    const matches = [];
    for (let i = 0; i < 10; i += 2) {
      matches.push({ home: shuffled[i], away: shuffled[i + 1] });
    }
    return matches;
  }

  function scoreGuess(guess, actual) {
    if (guess.local === actual.local && guess.visitante === actual.visitante) return { points: 3, exact: true, correctResult: true };
    if (resultadoDe(guess) === resultadoDe(actual)) return { points: 1, exact: false, correctResult: true };
    return { points: 0, exact: false, correctResult: false };
  }

  class QuinielaEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {}; // acumulado histórico entre jornadas
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }
    seatById(id) { return this.seats.find((s) => s.id === id); }

    startRound() {
      this.round += 1;
      this.matches = pickMatches();
      this.predictions = {};
      this.matchScores = {};
      this.roundOver = false;
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.bus.emit('round-started', { round: this.round, matches: this.matches });
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    predict(seatId, guesses) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.predictions[seatId]) return { ok: false };
      if (!Array.isArray(guesses) || guesses.length !== this.matches.length) return { ok: false };
      const clean = guesses.map((g) => ({
        local: Math.max(0, Math.min(9, Math.round(Number(g.local) || 0))),
        visitante: Math.max(0, Math.min(9, Math.round(Number(g.visitante) || 0))),
      }));
      this.predictions[seatId] = clean;
      this.bus.emit('predicted', { seatId, guesses: clean });

      const allDone = this.seats.every((s) => this.predictions[s.id]);
      if (allDone) { this._reveal(); return { ok: true, roundOver: true }; }
      this._advanceTurn();
      return { ok: true, roundOver: false };
    }

    _advanceTurn() {
      const n = this.seats.length;
      let tries = 0;
      do {
        this.turnPointer = (this.turnPointer + 1) % n;
        tries += 1;
      } while (this.predictions[this.currentSeat.id] && tries <= n);
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    _reveal() {
      this.roundOver = true;
      this.actualResults = this.matches.map(() => simulateScore());
      const details = {};
      this.seats.forEach((s) => {
        const guesses = this.predictions[s.id];
        const perMatch = guesses.map((g, i) => scoreGuess(g, this.actualResults[i]));
        const total = perMatch.reduce((sum, d) => sum + d.points, 0);
        details[s.id] = perMatch;
        this.matchScores[s.id] = total;
        this.scores[s.id] += total;
      });
      this.bus.emit('round-ended', {
        actualResults: this.actualResults,
        details,
        matchScores: { ...this.matchScores },
        scores: { ...this.scores },
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.QuinielaEngine = QuinielaEngine;
  global.GameHub.QuinielaHelpers = { TEAMS, simulateScore, resultadoDe, scoreGuess, GOAL_WEIGHTS_HOME, GOAL_WEIGHTS_AWAY, weightedGoals };
})(window);
