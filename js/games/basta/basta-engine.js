/**
 * basta-engine.js — lógica pura (sin DOM) de Basta / Stop / Tutti Frutti,
 * para 1 a 8 jugadores.
 *
 * Cada ronda sortea una letra. Todos los jugadores escriben, para cada
 * categoría, una palabra que empiece con esa letra — mientras la ronda
 * está en la fase "writing", nadie ve lo que escriben los demás. La
 * ronda termina apenas alguien grita "¡BASTA!" (llama a stop()) o se
 * agota el tiempo (la UI decide el límite y llama a stop() ella misma).
 *
 * Puntaje por categoría:
 *   - Palabra válida (no vacía, empieza con la letra sorteada) y que
 *     nadie más repitió = 10 puntos.
 *   - Palabra válida pero repetida por otro jugador = 5 puntos.
 *   - Vacía o que no empieza con la letra = 0 puntos.
 * El puntaje se acumula entre rondas (como en Generala o Bingo), sin
 * un objetivo fijo para terminar la partida.
 */
(function (global) {
  const { CATEGORIES, LETTERS } = global.GameHub.BastaData;

  function stripAccents(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function normalize(str) {
    return stripAccents(str).trim().toLowerCase();
  }

  function BastaEngine(seats) {
    this.bus = new global.GameHub.EventBus();
    this.seats = seats;
    this.categories = CATEGORIES;
    this.scores = {};
    seats.forEach((s) => { this.scores[s.id] = 0; });
    this.lastLetter = null;
    this.startRound();
  }

  BastaEngine.prototype.pickLetter = function () {
    let letter;
    do {
      letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    } while (letter === this.lastLetter && LETTERS.length > 1);
    this.lastLetter = letter;
    return letter;
  };

  BastaEngine.prototype.startRound = function () {
    this.phase = 'writing';
    this.letter = this.pickLetter();
    this.answers = {};
    this.seats.forEach((s) => {
      this.answers[s.id] = {};
      this.categories.forEach((cat) => { this.answers[s.id][cat] = ''; });
    });
    this.roundResult = null;
    this.bus.emit('round-started', { letter: this.letter });
  };

  BastaEngine.prototype.setAnswer = function (seatId, category, value) {
    if (this.phase !== 'writing') return;
    if (!this.answers[seatId]) return;
    this.answers[seatId][category] = value;
  };

  BastaEngine.prototype.isValid = function (value) {
    const norm = normalize(value);
    if (!norm) return false;
    return norm[0] === this.letter.toLowerCase();
  };

  /** Termina la fase de escritura y calcula el puntaje de la ronda. */
  BastaEngine.prototype.stop = function (seatId) {
    if (this.phase !== 'writing') return false;
    this.phase = 'results';

    const perCategory = {};
    const roundPoints = {};
    this.seats.forEach((s) => { roundPoints[s.id] = 0; });

    this.categories.forEach((cat) => {
      const entries = this.seats.map((s) => ({
        seatId: s.id,
        text: (this.answers[s.id][cat] || '').trim(),
        valid: this.isValid(this.answers[s.id][cat]),
      }));
      const counts = {};
      entries.forEach((e) => {
        if (!e.valid) return;
        const key = normalize(e.text);
        counts[key] = (counts[key] || 0) + 1;
      });
      entries.forEach((e) => {
        if (!e.valid) { e.points = 0; return; }
        const key = normalize(e.text);
        e.points = counts[key] > 1 ? 5 : 10;
        roundPoints[e.seatId] += e.points;
      });
      perCategory[cat] = entries;
    });

    this.seats.forEach((s) => { this.scores[s.id] += roundPoints[s.id]; });

    this.roundResult = { perCategory, roundPoints, calledBy: seatId || null, letter: this.letter };
    this.bus.emit('round-ended', this.roundResult);
    return true;
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.BastaEngine = BastaEngine;
  global.GameHub.BastaHelpers = { normalize };
})(window);
