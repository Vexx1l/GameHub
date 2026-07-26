/**
 * Rummikub — motor de reglas puras (sin DOM).
 *
 * Simplificaciones respecto al juego físico oficial, para que el
 * modo "un jugador contra bots" sea jugable y divertido sin un
 * resolutor completo de recomposición de tablero:
 *  - La jugada inicial (30 puntos) no tiene que completarse en un
 *    solo conjunto: cada grupo/escalera nueva que juegues desde tu
 *    mano se coloca en la mesa de inmediato, y en cuanto la suma
 *    acumulada en tu turno llega a 30, quedas "habilitado" para
 *    manipular el tablero en turnos futuros.
 *  - Una vez habilitado, sólo puedes AGREGAR una ficha de tu mano al
 *    final/inicio de una escalera existente, o a un grupo con menos
 *    de 4 fichas — no se permite recomponer/partir conjuntos ya
 *    armados en la mesa (la variante clásica de "mover todo el
 *    tablero" queda fuera de este mini-motor).
 *  - Si el pozo se agota, la partida termina de inmediato y gana
 *    quien tenga menor valor de fichas en mano (los comodines sin
 *    jugar valen 30 puntos cada uno).
 */
(function (global) {
  const COLORS = ['rojo', 'azul', 'negro', 'amarillo'];

  function buildDeck() {
    const tiles = [];
    let uid = 0;
    COLORS.forEach((color) => {
      for (let copy = 0; copy < 2; copy++) {
        for (let n = 1; n <= 13; n++) {
          tiles.push({ uid: uid++, color, number: n });
        }
      }
    });
    tiles.push({ uid: uid++, color: 'comodin', number: null });
    tiles.push({ uid: uid++, color: 'comodin', number: null });
    return tiles;
  }

  /** Valida si un conjunto de fichas forma un grupo o escalera válidos. */
  function evaluateSet(tiles) {
    if (!tiles || tiles.length < 3) return { valid: false };
    const jokers = tiles.filter((t) => t.color === 'comodin');
    const normals = tiles.filter((t) => t.color !== 'comodin');
    if (normals.length === 0) return { valid: false };

    // --- ¿Grupo? mismo número, colores distintos ---
    const sameNumber = normals.every((t) => t.number === normals[0].number);
    const colorSet = new Set(normals.map((t) => t.color));
    if (sameNumber && colorSet.size === normals.length && tiles.length <= 4) {
      return { valid: true, type: 'group', number: normals[0].number, value: normals[0].number * tiles.length };
    }

    // --- ¿Escalera? mismo color, números consecutivos con comodines de relleno ---
    const sameColor = normals.every((t) => t.color === normals[0].color);
    const numbers = normals.map((t) => t.number);
    const hasDup = new Set(numbers).size !== numbers.length;
    if (sameColor && !hasDup) {
      const min = Math.min(...numbers);
      const max = Math.min(13, Math.max(...numbers));
      const L = tiles.length;
      const gapsNeeded = (max - min + 1) - normals.length;
      const jokerCount = jokers.length;
      if (gapsNeeded >= 0 && gapsNeeded <= jokerCount) {
        const remaining = jokerCount - gapsNeeded;
        const loBound = Math.max(0, min + L - 1 - 13);
        const hiBound = Math.min(remaining, min - 1);
        if (loBound <= hiBound) {
          const leftExtra = loBound;
          const start = min - leftExtra;
          const value = L * start + (L * (L - 1)) / 2;
          return { valid: true, type: 'run', color: normals[0].color, start, value };
        }
      }
    }

    return { valid: false };
  }

  /** Ordena visualmente una escalera colocando cada comodín en su hueco real. */
  function resolveRunOrder(tiles, evalResult) {
    const L = tiles.length;
    const slots = new Array(L).fill(null);
    const byNumber = new Map();
    const jokers = [];
    tiles.forEach((t) => {
      if (t.color === 'comodin') jokers.push(t);
      else byNumber.set(t.number, t);
    });
    for (let i = 0; i < L; i++) {
      const n = evalResult.start + i;
      slots[i] = byNumber.get(n) || jokers.pop();
    }
    return slots;
  }

  function tileValue(tile) {
    return tile.color === 'comodin' ? 30 : tile.number;
  }

  function RummikubEngine(seats) {
    this.seats = seats;
    this.bus = new global.GameHub.EventBus();
    this.round = 1;
    this.startRound();
  }

  RummikubEngine.prototype.startRound = function () {
    const deck = global.GameHub.Dice.shuffle(buildDeck());
    this.hands = {};
    this.seats.forEach((s) => { this.hands[s.id] = []; });
    this.seats.forEach((s) => {
      for (let i = 0; i < 14; i++) this.hands[s.id].push(deck.pop());
    });
    this.pool = deck;
    this.board = []; // array de { tiles: [...] }
    this.hasMelded = {};
    this.seats.forEach((s) => { this.hasMelded[s.id] = false; });
    this.turnMeldValue = 0;
    this.turnPlayedAny = false;
    this.currentIndex = 0;
    this.roundOver = false;
    this.winnerId = null;
    this.bus.emit('round-started', {});
  };

  Object.defineProperty(RummikubEngine.prototype, 'currentSeat', {
    get() { return this.seats[this.currentIndex]; },
  });

  RummikubEngine.prototype._isCurrent = function (seatId) {
    return !this.roundOver && this.currentSeat && this.currentSeat.id === seatId;
  };

  RummikubEngine.prototype._checkWin = function (seatId) {
    if (this.hands[seatId].length === 0) {
      this.roundOver = true;
      this.winnerId = seatId;
      const remaining = {};
      this.seats.forEach((s) => {
        remaining[s.id] = this.hands[s.id].reduce((sum, t) => sum + tileValue(t), 0);
      });
      this.bus.emit('round-ended', { winnerId: seatId, reason: 'hand-empty', remaining });
      return true;
    }
    return false;
  };

  /** Juega un conjunto NUEVO (2-4 fichas) tomado enteramente de la mano. */
  RummikubEngine.prototype.playNewSet = function (seatId, uids) {
    if (!this._isCurrent(seatId)) return { ok: false, error: 'No es tu turno.' };
    const hand = this.hands[seatId];
    const tiles = uids.map((uid) => hand.find((t) => t.uid === uid)).filter(Boolean);
    if (tiles.length !== uids.length) return { ok: false, error: 'Ficha inválida.' };
    const evalResult = evaluateSet(tiles);
    if (!evalResult.valid) return { ok: false, error: 'Ese conjunto no es un grupo ni una escalera válidos.' };

    const orderedTiles = evalResult.type === 'run' ? resolveRunOrder(tiles, evalResult) : tiles;
    this.hands[seatId] = hand.filter((t) => !uids.includes(t.uid));
    this.board.push({ tiles: orderedTiles });
    this.turnPlayedAny = true;

    if (!this.hasMelded[seatId]) {
      this.turnMeldValue += evalResult.value;
      if (this.turnMeldValue >= 30) this.hasMelded[seatId] = true;
    }

    this.bus.emit('set-played', { seatId, setIndex: this.board.length - 1, melded: this.hasMelded[seatId] });
    if (this._checkWin(seatId)) return { ok: true };
    return { ok: true };
  };

  /** Agrega UNA ficha de la mano a un conjunto ya existente en la mesa. */
  RummikubEngine.prototype.extendSet = function (seatId, setIndex, uid) {
    if (!this._isCurrent(seatId)) return { ok: false, error: 'No es tu turno.' };
    if (!this.hasMelded[seatId]) return { ok: false, error: 'Primero debes completar tu jugada inicial de 30 puntos.' };
    const hand = this.hands[seatId];
    const tile = hand.find((t) => t.uid === uid);
    const set = this.board[setIndex];
    if (!tile || !set) return { ok: false, error: 'Selección inválida.' };
    const candidate = set.tiles.concat([tile]);
    const evalResult = evaluateSet(candidate);
    if (!evalResult.valid) return { ok: false, error: 'Esa ficha no encaja ahí.' };

    this.hands[seatId] = hand.filter((t) => t.uid !== uid);
    set.tiles = evalResult.type === 'run' ? resolveRunOrder(candidate, evalResult) : candidate;
    this.turnPlayedAny = true;
    this.bus.emit('set-extended', { seatId, setIndex });
    if (this._checkWin(seatId)) return { ok: true };
    return { ok: true };
  };

  /** Roba una ficha del pozo; siempre termina el turno. */
  RummikubEngine.prototype.drawTile = function (seatId) {
    if (!this._isCurrent(seatId)) return { ok: false, error: 'No es tu turno.' };
    if (this.pool.length === 0) {
      this.roundOver = true;
      const remaining = {};
      this.seats.forEach((s) => {
        remaining[s.id] = this.hands[s.id].reduce((sum, t) => sum + tileValue(t), 0);
      });
      const minVal = Math.min(...Object.values(remaining));
      const winnerId = Object.keys(remaining).find((id) => remaining[id] === minVal);
      this.winnerId = winnerId;
      this.bus.emit('round-ended', { winnerId, reason: 'pool-empty', remaining });
      return { ok: true };
    }
    const tile = this.pool.pop();
    this.hands[seatId].push(tile);
    this.bus.emit('tile-drawn', { seatId, tile });
    this.endTurn(seatId);
    return { ok: true, tile };
  };

  RummikubEngine.prototype.endTurn = function (seatId) {
    if (!this._isCurrent(seatId) || this.roundOver) return { ok: false };
    this.turnMeldValue = 0;
    this.turnPlayedAny = false;
    this.currentIndex = (this.currentIndex + 1) % this.seats.length;
    this.bus.emit('turn-changed', {});
    return { ok: true };
  };

  RummikubEngine.evaluateSet = evaluateSet;
  RummikubEngine.tileValue = tileValue;

  global.GameHub = global.GameHub || {};
  global.GameHub.RummikubEngine = RummikubEngine;
})(window);
