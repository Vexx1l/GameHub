/**
 * parques-engine.js — lógica pura del juego (sin DOM).
 *
 * Representación de una ficha: un número "step":
 *   -1        -> en la casa (aún no ha salido)
 *    0 .. 50  -> sobre la pista compartida, relativo a su propio punto
 *                de salida (step 0 = su casilla de salida)
 *   51 .. 56  -> en su columna final (privada, sin capturas)
 *    57       -> en la meta (ficha ya llegó)
 *
 * Simplificaciones deliberadas frente al Parqués tradicional completo
 * (documentadas también en el README para quien quiera extenderlo):
 *   - Con dobles solo puede salir UNA ficha de la casa (no dos).
 *   - No se implementa el "bloqueo" de paso por dos fichas propias en
 *     una misma casilla (sí se permite apilar, pero no bloquea el paso).
 *   - Tres dobles seguidos castigan la última ficha movida por ese
 *     jugador, como en las variantes más comunes.
 */
(function (global) {
  const Board = global.GameHub.ParquesBoard;
  const Dice = global.GameHub.Dice;

  function createTokens() {
    const tokens = {};
    Board.COLORS.forEach((c) => { tokens[c] = [-1, -1, -1, -1]; });
    return tokens;
  }

  class ParquesEngine {
    /**
     * @param {Array<{color:string, type:'human'|'bot', difficulty?:string}>} seats
     */
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // orden de turno
      this.tokens = createTokens();
      this.turnPointer = 0;
      this.dice = null;
      this.diceUsed = [];
      this.doublesStreak = 0;
      this.winnerOrder = [];
      this.active = seats.map((s) => s.color); // colores que siguen en juego
      this.finished = false;
    }

    get currentSeat() {
      return this.seats[this.turnPointer];
    }

    isColorFinished(color) {
      return this.tokens[color].every((s) => s === 57);
    }

    /** Tira los dados para el jugador en turno y calcula movimientos disponibles */
    rollDice() {
      if (this.finished) return null;
      this.dice = Dice.rollPair();
      this.diceUsed = [];
      const moves = this.getAvailableMoves(this.currentSeat.color, this.dice);
      this.bus.emit('dice-rolled', { color: this.currentSeat.color, dice: this.dice.slice(), moves });
      if (moves.length === 0) {
        this.bus.emit('no-moves', { color: this.currentSeat.color, dice: this.dice.slice() });
        this._afterTurnResolved(false);
      }
      return moves;
    }

    /**
     * Calcula todas las jugadas legales para "color" dado un par de dados.
     * Cada jugada es: { tokenIndex, from, to, dieValue(s) usados, isExit, isCapture, capturedColor }
     */
    getAvailableMoves(color, dice) {
      const [d1, d2] = dice;
      const isDouble = d1 === d2;
      const canExit = isDouble || d1 === 5 || d2 === 5;
      const moves = [];
      const tokens = this.tokens[color];

      // Salir de la casa
      if (canExit) {
        tokens.forEach((step, idx) => {
          if (step === -1) {
            moves.push({
              tokenIndex: idx, color, from: -1, to: 0,
              dieValues: [isDouble ? d1 : 5], isExit: true,
              isCapture: this._wouldCapture(color, 0),
            });
          }
        });
      }

      // Mover fichas ya en pista, con cada dado por separado
      [d1, d2].forEach((die) => {
        tokens.forEach((step, idx) => {
          if (step >= 0 && step < 57) {
            const to = step + die;
            if (to <= 57) {
              moves.push({
                tokenIndex: idx, color, from: step, to,
                dieValues: [die], isExit: false,
                isCapture: to <= 50 ? this._wouldCapture(color, to) : false,
              });
            }
          }
        });
      });

      // Mover una ficha usando la suma de ambos dados (si no son iguales;
      // si son iguales ya se cubre arriba con cada dado individual, pero
      // añadimos también d1+d2 como opción de "doble avance").
      const sum = d1 + d2;
      tokens.forEach((step, idx) => {
        if (step >= 0 && step < 57) {
          const to = step + sum;
          if (to <= 57) {
            moves.push({
              tokenIndex: idx, color, from: step, to,
              dieValues: [d1, d2], isExit: false,
              isCapture: to <= 50 ? this._wouldCapture(color, to) : false,
            });
          }
        }
      });

      // Elimina duplicados exactos (mismo tokenIndex+to+dieValues)
      const seen = new Set();
      return moves.filter((m) => {
        const key = `${m.tokenIndex}|${m.to}|${m.dieValues.join(',')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    _globalIndexFor(color, step) {
      const meta = Board.COLOR_META[color];
      return (meta.startIndex + step) % 52;
    }

    _wouldCapture(color, step) {
      if (step > 50) return false; // columna final es privada
      const gIdx = this._globalIndexFor(color, step);
      if (Board.SAFE_INDICES.has(gIdx)) return false;
      let captures = false;
      Board.COLORS.forEach((other) => {
        if (other === color) return;
        this.tokens[other].forEach((s) => {
          if (s >= 0 && s <= 50 && this._globalIndexFor(other, s) === gIdx) captures = true;
        });
      });
      return captures;
    }

    /** Aplica una jugada elegida (por humano o bot) */
    applyMove(move) {
      const { color, tokenIndex, to } = move;
      this.tokens[color][tokenIndex] = to;

      let capturedColor = null;
      if (to <= 50 && to >= 0) {
        const gIdx = this._globalIndexFor(color, to);
        if (!Board.SAFE_INDICES.has(gIdx)) {
          Board.COLORS.forEach((other) => {
            if (other === color) return;
            this.tokens[other] = this.tokens[other].map((s) => {
              if (s >= 0 && s <= 50 && this._globalIndexFor(other, s) === gIdx) {
                capturedColor = other;
                return -1;
              }
              return s;
            });
          });
        }
      }

      this.diceUsed.push(move.dieValues);
      this.bus.emit('move-applied', { move, capturedColor });

      if (capturedColor) {
        this.bus.emit('token-captured', { capturedColor, byColor: color });
      }

      if (to === 57 && this.isColorFinished(color)) {
        this.winnerOrder.push(color);
        this.active = this.active.filter((c) => c !== color);
        this.bus.emit('color-finished', { color, place: this.winnerOrder.length });
        if (this.active.length <= 1) {
          this.finished = true;
          this.bus.emit('game-won', { order: this.winnerOrder.concat(this.active) });
          return;
        }
      }

      const usedAllDice = this.diceUsed.length >= (this.dice[0] === this.dice[1] ? 1 : 1);
      // Un turno normal consume UNA jugada (que puede usar 1 o 2 dados);
      // si fue doble, se vuelve a tirar (extra turno) salvo castigo.
      this._afterTurnResolved(true);
    }

    _afterTurnResolved(_movedSomething) {
      const isDouble = this.dice && this.dice[0] === this.dice[1];
      if (isDouble) {
        this.doublesStreak += 1;
        if (this.doublesStreak >= 3) {
          // Castigo: la última ficha movida por este jugador vuelve a casa
          const seat = this.currentSeat;
          const lastMove = this._lastMoveOf(seat.color);
          if (lastMove !== null) {
            this.tokens[seat.color][lastMove] = -1;
            this.bus.emit('triple-double-penalty', { color: seat.color });
          }
          this.doublesStreak = 0;
          this._advanceTurn();
        } else {
          this.bus.emit('extra-turn', { color: this.currentSeat.color });
          // mismo jugador vuelve a tirar; no avanzamos el puntero
        }
      } else {
        this.doublesStreak = 0;
        this._advanceTurn();
      }
    }

    _lastMoveOf(color) {
      // Aproximación simple: busca la ficha de mayor step (probablemente la
      // última movida) — suficiente para el propósito del castigo.
      const steps = this.tokens[color];
      let best = -1, bestVal = -Infinity;
      steps.forEach((s, i) => { if (s > bestVal && s < 57) { bestVal = s; best = i; } });
      return best === -1 ? null : best;
    }

    _advanceTurn() {
      if (this.finished) return;
      do {
        this.turnPointer = (this.turnPointer + 1) % this.seats.length;
      } while (!this.active.includes(this.currentSeat.color));
      this.dice = null;
      this.diceUsed = [];
      this.bus.emit('turn-changed', { color: this.currentSeat.color });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.ParquesEngine = ParquesEngine;
})(window);
