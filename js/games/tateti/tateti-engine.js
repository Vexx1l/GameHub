/**
 * tateti-engine.js — lógica pura (sin DOM) del Ta-Te-Ti (tres en línea),
 * siempre para 2 jugadores fijos: 'x' y 'o'.
 *
 * El tablero es un array de 9 casillas (0..8, fila por fila):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */
(function (global) {
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
    [0, 4, 8], [2, 4, 6],            // diagonales
  ];

  function checkWinner(board) {
    for (const line of LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { mark: board[a], line };
      }
    }
    return null;
  }

  function TatetiEngine(seats) {
    this.bus = new global.GameHub.EventBus();
    this.seats = seats; // [{id,color:'x',...}, {id,color:'o',...}]
    this.xSeat = seats.find((s) => s.color === 'x');
    this.oSeat = seats.find((s) => s.color === 'o');
    this.scores = {};
    seats.forEach((s) => { this.scores[s.id] = 0; });
    this.startRound(this.xSeat.id);
  }

  TatetiEngine.prototype.startRound = function (startingSeatId) {
    this.board = Array(9).fill(null);
    this.over = false;
    this.turnSeatId = startingSeatId || this.xSeat.id;
    this.result = null; // { winnerId, line } | { draw: true }
    this.bus.emit('round-started', {});
  };

  TatetiEngine.prototype.markFor = function (seatId) {
    return seatId === this.xSeat.id ? 'x' : 'o';
  };

  TatetiEngine.prototype.emptyCells = function () {
    const out = [];
    this.board.forEach((v, i) => { if (!v) out.push(i); });
    return out;
  };

  TatetiEngine.prototype.play = function (seatId, index) {
    if (this.over) return false;
    if (seatId !== this.turnSeatId) return false;
    if (this.board[index]) return false;

    this.board[index] = this.markFor(seatId);
    this.bus.emit('board-changed', { board: this.board.slice() });

    const win = checkWinner(this.board);
    if (win) {
      this.over = true;
      const winnerSeat = win.mark === 'x' ? this.xSeat : this.oSeat;
      this.scores[winnerSeat.id] += 1;
      this.result = { winnerId: winnerSeat.id, line: win.line };
      this.bus.emit('round-ended', this.result);
      return true;
    }
    if (this.emptyCells().length === 0) {
      this.over = true;
      this.result = { draw: true };
      this.bus.emit('round-ended', this.result);
      return true;
    }

    this.turnSeatId = seatId === this.xSeat.id ? this.oSeat.id : this.xSeat.id;
    this.bus.emit('turn-changed', { turnSeatId: this.turnSeatId });
    return true;
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.TatetiEngine = TatetiEngine;
  global.GameHub.TatetiHelpers = { checkWinner, LINES };
})(window);
