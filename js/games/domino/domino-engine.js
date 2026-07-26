/**
 * domino-engine.js — lógica pura de Dominó (doble-seis, 28 fichas).
 *
 * Modo de juego:
 *   - 4 jugadores: se reparten las 28 fichas completas (7 cada uno),
 *     "dominó cerrado" al estilo colombiano — no hay pozo para robar.
 *   - 2 jugadores: se reparten 7 fichas cada uno y las 14 restantes
 *     quedan en el pozo para robar cuando no haya jugada posible.
 *
 * Una ficha se representa como [a, b] con a <= b (forma canónica) tal
 * como vive en la mano del jugador. Sobre el tablero, cada ficha
 * colocada se guarda ya orientada como { left, right } según cómo
 * quedó puesta, para saber qué valores quedan abiertos en cada punta.
 */
(function (global) {
  const Dice = global.GameHub.Dice;

  function buildFullSet() {
    const tiles = [];
    for (let a = 0; a <= 6; a++) {
      for (let b = a; b <= 6; b++) tiles.push([a, b]);
    }
    return tiles; // 28 fichas
  }

  class DominoEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,type,difficulty}]
      this.scores = {};
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }

    startRound() {
      this.round += 1;
      const deck = Dice.shuffle(buildFullSet());
      this.hands = {};
      this.seats.forEach((s) => { this.hands[s.id] = []; });

      const perPlayer = 7;
      let cursor = 0;
      this.seats.forEach((s) => {
        this.hands[s.id] = deck.slice(cursor, cursor + perPlayer);
        cursor += perPlayer;
      });
      this.boneyard = this.seats.length === 2 ? deck.slice(cursor) : [];

      this.board = []; // lista de {left, right}
      this.passStreak = 0;
      this.roundOver = false;

      // Empieza quien tenga el doble más alto
      let starter = 0, bestDouble = -1;
      this.seats.forEach((s, idx) => {
        this.hands[s.id].forEach(([a, b]) => {
          if (a === b && a > bestDouble) { bestDouble = a; starter = idx; }
        });
      });
      this.turnPointer = starter;
      this.forcedOpeningDouble = bestDouble >= 0 ? bestDouble : null;

      this.bus.emit('round-started', { round: this.round, starter: this.currentSeat.id });
    }

    leftEnd() { return this.board.length ? this.board[0].left : null; }
    rightEnd() { return this.board.length ? this.board[this.board.length - 1].right : null; }

    /** Jugadas legales para la mano del turno actual */
    getAvailableMoves(seatId) {
      const hand = this.hands[seatId];
      const moves = [];
      if (this.board.length === 0) {
        hand.forEach((tile, tileIndex) => {
          // Si hay un doble obligatorio de apertura (mayor doble en juego), solo esa ficha es válida
          if (this.forcedOpeningDouble !== null) {
            if (tile[0] === tile[1] && tile[0] === this.forcedOpeningDouble) {
              moves.push({ tileIndex, tile, side: 'right' });
            }
          } else {
            moves.push({ tileIndex, tile, side: 'right' });
          }
        });
        return moves;
      }
      const L = this.leftEnd(), R = this.rightEnd();
      hand.forEach((tile, tileIndex) => {
        const [a, b] = tile;
        if (a === L || b === L) moves.push({ tileIndex, tile, side: 'left' });
        if (a === R || b === R) moves.push({ tileIndex, tile, side: 'right' });
      });
      return moves;
    }

    /** Intenta robar del pozo hasta encontrar ficha jugable o vaciarlo. Devuelve fichas robadas. */
    drawUntilPlayable(seatId) {
      const drawn = [];
      while (this.boneyard.length && this.getAvailableMoves(seatId).length === 0) {
        const tile = this.boneyard.pop();
        this.hands[seatId].push(tile);
        drawn.push(tile);
      }
      if (drawn.length) this.bus.emit('drew-tiles', { seatId, count: drawn.length });
      return drawn;
    }

    playMove(seatId, move) {
      const hand = this.hands[seatId];
      const [a, b] = move.tile;
      let oriented;
      if (this.board.length === 0) {
        oriented = { left: a, right: b };
        this.board.push(oriented);
      } else if (move.side === 'left') {
        const L = this.leftEnd();
        oriented = (a === L) ? { left: b, right: a } : { left: a, right: b };
        this.board.unshift(oriented);
      } else {
        const R = this.rightEnd();
        oriented = (a === R) ? { left: a, right: b } : { left: b, right: a };
        this.board.push(oriented);
      }
      // eliminar de la mano
      const idx = hand.findIndex((t) => t[0] === move.tile[0] && t[1] === move.tile[1]);
      if (idx >= 0) hand.splice(idx, 1);

      this.passStreak = 0;
      this.forcedOpeningDouble = null;
      this.bus.emit('move-played', { seatId, move });

      if (hand.length === 0) {
        this._endRound({ type: 'domino', winnerId: seatId });
        return;
      }
      this._advanceTurn();
    }

    pass(seatId) {
      this.passStreak += 1;
      this.bus.emit('passed', { seatId });
      if (this.passStreak >= this.seats.length) {
        this._endRound({ type: 'blocked' });
        return;
      }
      this._advanceTurn();
    }

    _advanceTurn() {
      if (this.roundOver) return;
      this.turnPointer = (this.turnPointer + 1) % this.seats.length;
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    _pipSum(seatId) {
      return this.hands[seatId].reduce((sum, [a, b]) => sum + a + b, 0);
    }

    _endRound(result) {
      this.roundOver = true;
      let winnerId = result.winnerId;
      let pointsWon = 0;

      if (result.type === 'domino') {
        pointsWon = this.seats
          .filter((s) => s.id !== winnerId)
          .reduce((sum, s) => sum + this._pipSum(s.id), 0);
      } else {
        // Bloqueado: gana quien tenga menos puntos en la mano
        let best = null, bestSum = Infinity;
        this.seats.forEach((s) => {
          const sum = this._pipSum(s.id);
          if (sum < bestSum) { bestSum = sum; best = s.id; }
        });
        winnerId = best;
        pointsWon = this.seats
          .filter((s) => s.id !== winnerId)
          .reduce((sum, s) => sum + this._pipSum(s.id), 0);
      }

      this.scores[winnerId] += pointsWon;
      this.bus.emit('round-ended', {
        type: result.type,
        winnerId,
        pointsWon,
        scores: { ...this.scores },
        hands: JSON.parse(JSON.stringify(this.hands)),
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.DominoEngine = DominoEngine;
})(window);
