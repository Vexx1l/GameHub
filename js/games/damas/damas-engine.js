/**
 * damas-engine.js — lógica pura (sin DOM) de Damas (checkers) en tablero
 * de 8x8, para 2 jugadores fijos: 'blancas' y 'negras'.
 *
 * Reglas implementadas:
 *   - Solo se usan las 32 casillas oscuras, con (fila+col) impar.
 *   - Las negras empiezan arriba (filas 0-2) y avanzan hacia abajo;
 *     las blancas empiezan abajo (filas 5-7) y avanzan hacia arriba.
 *   - Movimiento simple: 1 paso en diagonal, solo hacia adelante para
 *     una ficha normal; en cualquier dirección para una dama (reina).
 *   - Captura: siempre en cualquiera de las 4 diagonales (adelante o
 *     atrás), saltando una ficha rival hacia una casilla vacía.
 *   - Captura obligatoria: si algún jugador puede capturar, DEBE
 *     hacerlo (no puede hacer un movimiento simple ese turno).
 *   - Captura múltiple: si tras un salto la misma ficha puede volver
 *     a capturar, debe seguir capturando con esa ficha (el turno no
 *     pasa hasta que no haya más saltos posibles).
 *   - Una ficha que llega a la última fila del rival se corona dama;
 *     la coronación termina el turno (no sigue encadenando capturas).
 *   - Se pierde si te quedas sin fichas o sin movimientos legales.
 */
(function (global) {
  const SIZE = 8;
  const DIRS_ALL = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }
  function isDark(r, c) { return (r + c) % 2 === 1; }

  function initialBoard() {
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!isDark(r, c)) continue;
        if (r <= 2) board[r][c] = { color: 'negras', king: false };
        else if (r >= 5) board[r][c] = { color: 'blancas', king: false };
      }
    }
    return board;
  }

  function forwardDirs(color) {
    return color === 'negras' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
  }

  function simpleMovesFor(board, r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    const dirs = piece.king ? DIRS_ALL : forwardDirs(piece.color);
    const out = [];
    dirs.forEach(([dr, dc]) => {
      const tr = r + dr; const tc = c + dc;
      if (inBounds(tr, tc) && !board[tr][tc]) out.push({ to: [tr, tc] });
    });
    return out;
  }

  function jumpsFor(board, r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    const out = [];
    DIRS_ALL.forEach(([dr, dc]) => {
      const mr = r + dr; const mc = c + dc;
      const lr = r + dr * 2; const lc = c + dc * 2;
      if (!inBounds(lr, lc)) return;
      const mid = board[mr] && board[mr][mc];
      if (mid && mid.color !== piece.color && !board[lr][lc]) {
        out.push({ to: [lr, lc], captured: [mr, mc] });
      }
    });
    return out;
  }

  function piecesOf(board, color) {
    const out = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] && board[r][c].color === color) out.push([r, c]);
      }
    }
    return out;
  }

  function anyCaptureAvailable(board, color) {
    return piecesOf(board, color).some(([r, c]) => jumpsFor(board, r, c).length > 0);
  }

  function hasAnyLegalMove(board, color) {
    return piecesOf(board, color).some(([r, c]) => (
      jumpsFor(board, r, c).length > 0 || simpleMovesFor(board, r, c).length > 0
    ));
  }

  function DamasEngine(seats) {
    this.bus = new global.GameHub.EventBus();
    this.seats = seats;
    this.whiteSeat = seats.find((s) => s.color === 'blancas');
    this.blackSeat = seats.find((s) => s.color === 'negras');
    this.scores = {};
    seats.forEach((s) => { this.scores[s.id] = 0; });
    this.startRound(this.blackSeat.id);
  }

  DamasEngine.prototype.startRound = function (startingSeatId) {
    this.board = initialBoard();
    this.over = false;
    this.turnSeatId = startingSeatId || this.blackSeat.id;
    this.chainFrom = null; // [r,c] si estamos en medio de una captura múltiple
    this.result = null;
    this.bus.emit('round-started', {});
  };

  DamasEngine.prototype.colorFor = function (seatId) {
    return seatId === this.whiteSeat.id ? 'blancas' : 'negras';
  };

  DamasEngine.prototype.seatForColor = function (color) {
    return color === 'blancas' ? this.whiteSeat : this.blackSeat;
  };

  DamasEngine.prototype.countPieces = function (color) {
    return piecesOf(this.board, color).length;
  };

  /** Casillas con fichas que el jugador en turno puede mover ahora mismo. */
  DamasEngine.prototype.selectablePieces = function () {
    const color = this.colorFor(this.turnSeatId);
    if (this.chainFrom) return [this.chainFrom];
    const mustCapture = anyCaptureAvailable(this.board, color);
    return piecesOf(this.board, color).filter(([r, c]) => (
      mustCapture ? jumpsFor(this.board, r, c).length > 0 : true
    ));
  };

  /** Destinos legales para la ficha en (r,c), respetando la captura obligatoria. */
  DamasEngine.prototype.destinationsFor = function (r, c) {
    const color = this.colorFor(this.turnSeatId);
    if (this.chainFrom) {
      if (this.chainFrom[0] !== r || this.chainFrom[1] !== c) return [];
      return jumpsFor(this.board, r, c);
    }
    const mustCapture = anyCaptureAvailable(this.board, color);
    if (mustCapture) return jumpsFor(this.board, r, c);
    return simpleMovesFor(this.board, r, c);
  };

  DamasEngine.prototype.move = function (seatId, from, to) {
    if (this.over) return false;
    if (seatId !== this.turnSeatId) return false;
    const [r, c] = from;
    const piece = this.board[r][c];
    if (!piece) return false;

    const dest = this.destinationsFor(r, c).find((m) => m.to[0] === to[0] && m.to[1] === to[1]);
    if (!dest) return false;

    this.board[to[0]][to[1]] = piece;
    this.board[r][c] = null;
    let captured = null;
    if (dest.captured) {
      captured = dest.captured;
      this.board[captured[0]][captured[1]] = null;
    }

    let promoted = false;
    const lastRow = piece.color === 'negras' ? SIZE - 1 : 0;
    if (!piece.king && to[0] === lastRow) { piece.king = true; promoted = true; }

    this.bus.emit('board-changed', { board: this.board, from, to, captured });

    // ¿Sigue la cadena de capturas con la misma ficha?
    if (dest.captured && !promoted && jumpsFor(this.board, to[0], to[1]).length > 0) {
      this.chainFrom = [to[0], to[1]];
      this.bus.emit('chain-continues', { at: this.chainFrom });
      return true;
    }

    this.chainFrom = null;
    const otherColor = piece.color === 'blancas' ? 'negras' : 'blancas';
    const otherSeat = this.seatForColor(otherColor);

    if (this.countPieces(otherColor) === 0 || !hasAnyLegalMove(this.board, otherColor)) {
      this.over = true;
      const winnerSeat = this.seatForColor(piece.color);
      this.scores[winnerSeat.id] += 1;
      this.result = { winnerId: winnerSeat.id };
      this.bus.emit('round-ended', this.result);
      return true;
    }

    this.turnSeatId = otherSeat.id;
    this.bus.emit('turn-changed', { turnSeatId: this.turnSeatId });
    return true;
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.DamasEngine = DamasEngine;
  global.GameHub.DamasHelpers = {
    SIZE, isDark, simpleMovesFor, jumpsFor, piecesOf, anyCaptureAvailable, hasAnyLegalMove, initialBoard,
  };
})(window);
