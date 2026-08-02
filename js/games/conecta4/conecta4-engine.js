/**
 * conecta4-engine.js — lógica pura (sin DOM) de Conecta 4, para 2
 * jugadores fijos ('rojo' y 'amarillo').
 *
 * Tablero: matriz de ROWS x COLS, board[row][col]. row 0 es la fila de
 * arriba; las fichas "caen" hasta la fila libre más baja de su columna
 * (gravedad), como en el juego físico.
 */
(function (global) {
  const ROWS = 6;
  const COLS = 7;

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  /** Devuelve { mark, cells:[[r,c]x4] } si hay 4 en línea, o null. */
  function checkWinner(board) {
    const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const mark = board[r][c];
        if (!mark) continue;
        for (const [dr, dc] of DIRS) {
          const cells = [[r, c]];
          for (let k = 1; k < 4; k++) {
            const rr = r + dr * k;
            const cc = c + dc * k;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== mark) break;
            cells.push([rr, cc]);
          }
          if (cells.length === 4) return { mark, cells };
        }
      }
    }
    return null;
  }

  function lowestEmptyRow(board, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) return r;
    }
    return -1;
  }

  function isBoardFull(board) {
    return board[0].every((v) => v);
  }

  function Conecta4Engine(seats) {
    this.bus = new global.GameHub.EventBus();
    this.seats = seats;
    this.redSeat = seats.find((s) => s.color === 'rojo');
    this.yellowSeat = seats.find((s) => s.color === 'amarillo');
    this.scores = {};
    seats.forEach((s) => { this.scores[s.id] = 0; });
    this.startRound(this.redSeat.id);
  }

  Conecta4Engine.prototype.startRound = function (startingSeatId) {
    this.board = emptyBoard();
    this.over = false;
    this.turnSeatId = startingSeatId || this.redSeat.id;
    this.result = null;
    this.bus.emit('round-started', {});
  };

  Conecta4Engine.prototype.markFor = function (seatId) {
    return seatId === this.redSeat.id ? 'r' : 'y';
  };

  Conecta4Engine.prototype.validColumns = function () {
    const out = [];
    for (let c = 0; c < COLS; c++) if (lowestEmptyRow(this.board, c) !== -1) out.push(c);
    return out;
  };

  Conecta4Engine.prototype.drop = function (seatId, col) {
    if (this.over) return false;
    if (seatId !== this.turnSeatId) return false;
    const row = lowestEmptyRow(this.board, col);
    if (row === -1) return false;

    this.board[row][col] = this.markFor(seatId);
    this.bus.emit('board-changed', { board: this.board, row, col });

    const win = checkWinner(this.board);
    if (win) {
      this.over = true;
      const winnerSeat = win.mark === 'r' ? this.redSeat : this.yellowSeat;
      this.scores[winnerSeat.id] += 1;
      this.result = { winnerId: winnerSeat.id, cells: win.cells };
      this.bus.emit('round-ended', this.result);
      return true;
    }
    if (isBoardFull(this.board)) {
      this.over = true;
      this.result = { draw: true };
      this.bus.emit('round-ended', this.result);
      return true;
    }

    this.turnSeatId = seatId === this.redSeat.id ? this.yellowSeat.id : this.redSeat.id;
    this.bus.emit('turn-changed', { turnSeatId: this.turnSeatId });
    return true;
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Conecta4Engine = Conecta4Engine;
  global.GameHub.Conecta4Helpers = { ROWS, COLS, checkWinner, lowestEmptyRow, isBoardFull, emptyBoard };
})(window);
