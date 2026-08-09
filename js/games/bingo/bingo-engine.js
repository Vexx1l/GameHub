/**
 * bingo-engine.js — lógica pura del Bingo clásico de 75 bolas, para 1 a 8
 * jugadores.
 *
 * Cada jugador recibe un cartón de 5x5 (columnas B-I-N-G-O, centro libre)
 * y el motor va cantando bolas al azar (1 a 75) una por una. Cada cartón
 * se marca automáticamente cuando su número sale — no hay ninguna
 * decisión que tomar, así que "humano" o "bot" da igual aquí; el juego
 * es puro azar, como el Bingo real. Por eso la dificultad del bot no
 * afecta nada en este juego.
 *
 * Premios de la ronda:
 *   - "Línea" (una fila, columna o diagonal completa): +10 pts, solo
 *     para el primer cartón que la logre. No termina la ronda.
 *   - "¡Bingo!" (cartón lleno, las 25 casillas): +50 pts y termina la
 *     ronda — ese jugador es el ganador.
 * El puntaje de cada ronda se suma a un acumulado histórico entre
 * rondas (como en Generala y Trivia), sin puntaje objetivo para
 * terminar — se puede seguir jugando rondas indefinidamente.
 */
(function (global) {
  const COLUMN_RANGES = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
  const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];

  function range(a, b) {
    const arr = [];
    for (let i = a; i <= b; i++) arr.push(i);
    return arr;
  }

  function generateCard() {
    const colValues = COLUMN_RANGES.map(([a, b]) => global.GameHub.Dice.shuffle(range(a, b)).slice(0, 5));
    const grid = [];
    for (let row = 0; row < 5; row++) {
      const r = [];
      for (let col = 0; col < 5; col++) {
        r.push(row === 2 && col === 2 ? 'FREE' : colValues[col][row]);
      }
      grid.push(r);
    }
    return grid;
  }

  function initialMarks() {
    const m = [[false, false, false, false, false], [false, false, false, false, false], [false, false, true, false, false], [false, false, false, false, false], [false, false, false, false, false]];
    return m;
  }

  function checkLine(marks) {
    for (let r = 0; r < 5; r++) if (marks[r].every(Boolean)) return true;
    for (let c = 0; c < 5; c++) if (marks.every((row) => row[c])) return true;
    if ([0, 1, 2, 3, 4].every((i) => marks[i][i])) return true;
    if ([0, 1, 2, 3, 4].every((i) => marks[i][4 - i])) return true;
    return false;
  }

  function checkFull(marks) {
    return marks.every((row) => row.every(Boolean));
  }

  class BingoEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {}; // acumulado histórico entre rondas
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.startRound();
    }

    seatById(id) { return this.seats.find((s) => s.id === id); }

    startRound() {
      this.round += 1;
      this.pool = global.GameHub.Dice.shuffle(range(1, 75));
      this.drawn = [];
      this.cards = {};
      this.marks = {};
      this.matchScores = {};
      this.seats.forEach((s) => {
        this.cards[s.id] = generateCard();
        this.marks[s.id] = initialMarks();
        this.matchScores[s.id] = 0;
      });
      this.lineWinnerId = null;
      this.bingoWinnerId = null;
      this.roundOver = false;
      this.bus.emit('round-started', { round: this.round });
    }

    drawNext() {
      if (this.roundOver) return null;
      if (this.pool.length === 0) { this._endRound(null); return null; }
      const number = this.pool.pop();
      this.drawn.push(number);

      // Los cartones de los bots se marcan solos (no tienen que "estar
      // atentos"), pero los cartones humanos ya NO se marcan automáticamente
      // acá: el jugador tiene que tocar la casilla correcta él mismo con
      // markCell() cuando escuche/vea que salió su número.
      this.seats.forEach((s) => {
        if (s.type !== 'bot') return;
        const grid = this.cards[s.id];
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (grid[r][c] === number) this.marks[s.id][r][c] = true;
          }
        }
        this._checkSeat(s.id);
      });

      this.bus.emit('ball-drawn', { number, drawnCount: this.drawn.length });
      return number;
    }

    // El jugador marca a mano una casilla de SU propio cartón. Sólo se
    // acepta si el número ya fue cantado, la casilla existe, no es la
    // casilla libre y todavía no estaba marcada.
    markCell(seatId, r, c) {
      if (this.roundOver) return false;
      const grid = this.cards[seatId];
      const marks = this.marks[seatId];
      if (!grid || !marks) return false;
      const value = grid[r]?.[c];
      if (value === undefined || value === 'FREE') return false;
      if (marks[r][c]) return false;
      if (!this.drawn.includes(value)) return false;
      marks[r][c] = true;
      this.bus.emit('cell-marked', { seatId, r, c, value });
      this._checkSeat(seatId);
      return true;
    }

    _checkSeat(seatId) {
      if (this.roundOver) return;
      if (!this.lineWinnerId && checkLine(this.marks[seatId])) {
        this.lineWinnerId = seatId;
        this.matchScores[seatId] += 10;
        this.bus.emit('line-completed', { seatId });
      }
      if (checkFull(this.marks[seatId])) {
        this.matchScores[seatId] += 50;
        this._endRound(seatId);
      }
    }

    _endRound(winnerId) {
      this.roundOver = true;
      this.bingoWinnerId = winnerId;
      this.seats.forEach((s) => { this.scores[s.id] += this.matchScores[s.id]; });
      this.bus.emit('round-ended', {
        winnerId, matchScores: { ...this.matchScores }, scores: { ...this.scores }, drawnCount: this.drawn.length,
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.BingoEngine = BingoEngine;
  global.GameHub.BingoHelpers = { COLUMN_LETTERS, COLUMN_RANGES, checkLine, checkFull };
})(window);
