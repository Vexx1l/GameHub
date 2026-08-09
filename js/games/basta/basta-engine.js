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
 *   - Palabra válida (no vacía, de al menos 2 letras, empieza con la
 *     letra sorteada) y que nadie más repitió = 10 puntos.
 *   - Palabra válida pero repetida por otro jugador = 5 puntos.
 *   - Vacía, de una sola letra o que no empieza con la letra sorteada = 0
 *     puntos (esto último no se puede votar, es un chequeo objetivo).
 * El puntaje se acumula entre rondas (como en Generala o Bingo), sin
 * un objetivo fijo para terminar la partida.
 *
 * No hay diccionario incorporado para verificar si una palabra "existe"
 * de verdad (muchas respuestas válidas son nombres propios, marcas,
 * etc. que no estarían en ningún diccionario). En su lugar, terminada
 * la ronda cualquier palabra que pasó el chequeo automático puede ser
 * objetada: si una MAYORÍA de los demás jugadores humanos de la mesa
 * vota "no vale", esa palabra pasa a valer 0 puntos (ver voteAnswer).
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
    const Dice = global.GameHub.Dice;
    let letter;
    do {
      letter = Dice.shuffle(LETTERS)[0];
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
    if (norm[0] !== this.letter.toLowerCase()) return false;
    // Sólo escribió la letra sorteada (o algo de un solo carácter) sin
    // ninguna palabra real detrás — no cuenta como respuesta.
    if (norm.length < 2) return false;
    return true;
  };

  /** Jugadores humanos que pueden votar sobre la palabra de `authorSeatId`
   * (cualquier humano de la mesa menos quien la escribió; los bots no votan). */
  BastaEngine.prototype._eligibleVoters = function (authorSeatId) {
    return this.seats.filter((s) => s.type === 'human' && s.id !== authorSeatId).map((s) => s.id);
  };

  /** Una palabra queda invalidada por votación sólo si una MAYORÍA
   * estricta de los que pueden votar (todos los humanos de la mesa
   * salvo el autor) dice que no vale. Sin objeciones (o en minoría),
   * se le da el beneficio de la duda y vale como si nadie hubiera dicho nada. */
  BastaEngine.prototype._entryEffectiveValid = function (entry) {
    if (!entry.valid) return false;
    const votes = entry.votes || {};
    const eligible = this._eligibleVoters(entry.seatId);
    if (!eligible.length) return true;
    const invalidCount = eligible.filter((id) => votes[id] === 'invalid').length;
    return !(invalidCount > eligible.length / 2);
  };

  BastaEngine.prototype._recomputeCategory = function (category) {
    const entries = this.roundResult.perCategory[category];
    const counts = {};
    entries.forEach((e) => {
      e.effectiveValid = this._entryEffectiveValid(e);
      if (!e.effectiveValid) return;
      const key = normalize(e.text);
      counts[key] = (counts[key] || 0) + 1;
    });
    entries.forEach((e) => {
      const oldPoints = e.points;
      e.points = e.effectiveValid ? (counts[normalize(e.text)] > 1 ? 5 : 10) : 0;
      if (e.points !== oldPoints) {
        const delta = e.points - oldPoints;
        this.roundResult.roundPoints[e.seatId] += delta;
        this.scores[e.seatId] += delta;
      }
    });
  };

  /** Un jugador vota si la palabra de otro (`targetSeatId`) en `category`
   * vale o no. `vote` es 'valid', 'invalid', o null para retirar el voto.
   * Sólo se puede votar sobre palabras que ya pasaron el chequeo
   * automático (empiezan con la letra y no están vacías) — el chequeo de
   * letra/vacío no se vota, es objetivo. */
  BastaEngine.prototype.voteAnswer = function (voterSeatId, category, targetSeatId, vote) {
    if (this.phase !== 'results' || !this.roundResult) return false;
    if (vote !== 'valid' && vote !== 'invalid' && vote !== null) return false;
    const entries = this.roundResult.perCategory[category];
    if (!entries) return false;
    const entry = entries.find((e) => e.seatId === targetSeatId);
    if (!entry || !entry.valid) return false;
    if (!this._eligibleVoters(targetSeatId).includes(voterSeatId)) return false;
    entry.votes = entry.votes || {};
    if (vote === null) delete entry.votes[voterSeatId];
    else entry.votes[voterSeatId] = vote;
    this._recomputeCategory(category);
    this.bus.emit('vote-updated', {
      category, targetSeatId, votes: { ...entry.votes }, points: entry.points, effectiveValid: entry.effectiveValid,
    });
    return true;
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
        votes: {},
      }));
      const counts = {};
      entries.forEach((e) => {
        if (!e.valid) return;
        const key = normalize(e.text);
        counts[key] = (counts[key] || 0) + 1;
      });
      entries.forEach((e) => {
        if (!e.valid) { e.points = 0; e.effectiveValid = false; return; }
        const key = normalize(e.text);
        e.points = counts[key] > 1 ? 5 : 10;
        e.effectiveValid = true;
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
