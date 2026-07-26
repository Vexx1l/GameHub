/**
 * ahorcado-engine.js — lógica pura del Ahorcado, pensado para 1 a varios
 * jugadores por turnos (en vez del clásico 1 contra el diccionario).
 *
 * Reglas:
 *   - Se elige una palabra al azar de un banco con categorías.
 *   - Por turnos, cada jugador dice UNA letra (o intenta adivinar la
 *     palabra completa). Si acierta una letra, se revela en todas sus
 *     posiciones y SIGUE jugando (para premiar los aciertos); si falla,
 *     se suma un error compartido (dibuja al ahorcado) y pasa el turno.
 *   - Quien complete la palabra (con la última letra que faltaba, o
 *     adivinándola de una) se lleva un bono y gana la ronda.
 *   - Hay un máximo de errores compartido (6, como las partes clásicas
 *     del muñeco); si se llega a ese máximo, la ronda termina sin
 *     ganador y se revela la palabra.
 *
 * Puntaje:
 *   - +5 puntos por cada letra acertada (una sola vez, multiplicado si
 *     esa letra aparece varias veces en la palabra).
 *   - +25 puntos extra a quien complete la palabra (ya sea con la
 *     última letra o adivinándola directamente).
 *   - Igual que en los demás juegos del hub, no hay puntaje objetivo
 *     para terminar la partida: se puede seguir jugando rondas.
 *
 * Simplificación: para comparar letras se ignoran tildes (á/a cuentan
 * igual), pero la "ñ" se mantiene como letra propia y distinta de "n",
 * tal como en un teclado en español.
 */
(function (global) {
  const Dice = global.GameHub.Dice;

  const WORD_BANK = {
    Animales: ['ELEFANTE', 'JIRAFA', 'COCODRILO', 'MURCIELAGO', 'AGUILA', 'DELFIN', 'CANGURO', 'HIPOPOTAMO', 'TIGRE', 'PINGUINO', 'ARDILLA', 'CEBRA', 'TIBURON', 'ARANA', 'MARIPOSA'],
    Frutas: ['MANZANA', 'BANANO', 'FRESA', 'SANDIA', 'PAPAYA', 'MANGO', 'PIÑA', 'UVA', 'DURAZNO', 'GUAYABA', 'MARACUYA', 'LIMON', 'COCO', 'KIWI', 'GRANADILLA'],
    Países: ['COLOMBIA', 'ARGENTINA', 'MEXICO', 'ESPAÑA', 'JAPON', 'EGIPTO', 'BRASIL', 'CANADA', 'ALEMANIA', 'PERU', 'CHILE', 'FRANCIA', 'ITALIA', 'MARRUECOS', 'VIETNAM'],
    Deportes: ['FUTBOL', 'BALONCESTO', 'NATACION', 'CICLISMO', 'TENIS', 'VOLEIBOL', 'ATLETISMO', 'BOXEO', 'ESGRIMA', 'SURF', 'PATINAJE', 'ESCALADA', 'AJEDREZ', 'RUGBY', 'GOLF'],
    Profesiones: ['MEDICO', 'INGENIERO', 'PROFESOR', 'BOMBERO', 'ABOGADO', 'PILOTO', 'CARPINTERO', 'PANADERO', 'PERIODISTA', 'ARQUITECTO', 'ENFERMERA', 'MUSICO', 'ELECTRICISTA', 'COCINERO', 'VETERINARIO'],
    Objetos: ['PARAGUAS', 'BICICLETA', 'TELEFONO', 'ESCALERA', 'LINTERNA', 'MOCHILA', 'GUITARRA', 'TIJERAS', 'ESPEJO', 'CAMARA', 'MALETA', 'BRUJULA', 'PIÑATA', 'RELOJ', 'CUADERNO'],
  };

  const ACCENTS = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U' };
  function normalizeChar(ch) {
    if (!ch) return null;
    const up = ch.toUpperCase();
    return ACCENTS[up] || up;
  }
  function normalizeWord(word) {
    return word.toUpperCase().split('').map((c) => ACCENTS[c] || c).join('');
  }

  const MAX_ERRORS = 6;

  class AhorcadoEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {};
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.usedWords = new Set();
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }
    seatById(id) { return this.seats.find((s) => s.id === id); }

    _pickWord() {
      const categories = Object.keys(WORD_BANK);
      let pool = [];
      categories.forEach((cat) => WORD_BANK[cat].forEach((w) => pool.push({ word: w, category: cat })));
      let available = pool.filter((p) => !this.usedWords.has(p.word));
      if (!available.length) { this.usedWords.clear(); available = pool; }
      const choice = available[Math.floor(Math.random() * available.length)];
      this.usedWords.add(choice.word);
      return choice;
    }

    startRound() {
      this.round += 1;
      const { word, category } = this._pickWord();
      this.word = word;
      this.category = category;
      this.letters = word.split('').map((c) => normalizeChar(c));
      this.guessedLetters = new Set();
      this.wrongLetters = [];
      this.errors = 0;
      this.maxErrors = MAX_ERRORS;
      this.roundOver = false;
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.bus.emit('round-started', { round: this.round, category, length: this.word.length });
      this.phase = 'turn';
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    isRevealed() { return this.letters.every((ch) => this.guessedLetters.has(ch)); }

    displayPattern() {
      return this.letters.map((ch) => (this.guessedLetters.has(ch) ? ch : null));
    }

    _advanceTurn() {
      this.turnPointer = (this.turnPointer + 1) % this.seats.length;
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    guessLetter(seatId, rawLetter) {
      if (this.roundOver || seatId !== this.currentSeat.id) return { ok: false };
      const letter = normalizeChar(rawLetter);
      if (!letter || !/^[A-ZÑ]$/.test(letter) || this.guessedLetters.has(letter)) {
        return { ok: false, reason: 'invalida' };
      }
      this.guessedLetters.add(letter);
      const hits = this.letters.filter((ch) => ch === letter).length;
      if (hits > 0) {
        this.scores[seatId] += hits * 5;
        this.bus.emit('letter-hit', { seatId, letter, hits, pattern: this.displayPattern() });
        if (this.isRevealed()) { this._finishRound(seatId, 'completada'); return { ok: true, correct: true, won: true }; }
        this.bus.emit('turn-changed', { seatId: this.currentSeat.id }); // acierta y sigue jugando
        return { ok: true, correct: true, won: false };
      }
      this.wrongLetters.push(letter);
      this.errors += 1;
      this.bus.emit('letter-miss', { seatId, letter, errors: this.errors });
      if (this.errors >= this.maxErrors) { this._finishRound(null, 'agotado'); return { ok: true, correct: false, over: true }; }
      this._advanceTurn();
      return { ok: true, correct: false };
    }

    guessWord(seatId, rawWord) {
      if (this.roundOver || seatId !== this.currentSeat.id || !rawWord) return { ok: false };
      const guess = normalizeWord(rawWord.trim());
      if (guess === this.word) {
        this.letters.forEach((ch) => this.guessedLetters.add(ch));
        this.scores[seatId] += 25;
        this._finishRound(seatId, 'palabra-completa');
        return { ok: true, correct: true, won: true };
      }
      this.errors += 1;
      this.bus.emit('word-miss', { seatId, guess, errors: this.errors });
      if (this.errors >= this.maxErrors) { this._finishRound(null, 'agotado'); return { ok: true, correct: false, over: true }; }
      this._advanceTurn();
      return { ok: true, correct: false };
    }

    _finishRound(winnerId, reason) {
      this.roundOver = true;
      this.bus.emit('round-ended', {
        winnerId, reason, word: this.word, category: this.category, scores: { ...this.scores },
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.AhorcadoEngine = AhorcadoEngine;
  global.GameHub.AhorcadoHelpers = { normalizeChar, normalizeWord, WORD_BANK, MAX_ERRORS };
})(window);
