/**
 * naipes-engine.js — lógica pura de "Escalera y Trío" (4-4-3 / 5-3-3).
 *
 * Reglas implementadas:
 *   - Se juega con 2 barajas españolas... digo, de póker (52 cartas c/u)
 *     + 2 comodines por baraja (4 comodines en total) = 108 cartas.
 *   - Cada jugador recibe 10 cartas al repartir.
 *   - Al iniciar la ronda, cada jugador elige su combinación objetivo:
 *       "4-4-3" → dos grupos de 4 cartas del mismo rango (sin importar
 *                 el palo) + un grupo de 3 del mismo rango.
 *       "5-3-3" → una escalera de 5 cartas del MISMO palo (consecutivas)
 *                 + dos grupos de 3 del mismo rango.
 *     Nota: 4+4+3 = 11 y 5+3+3 = 11 — por eso la mano "de ganar" tiene
 *     11 cartas en vez de 10.
 *   - En su turno, el jugador roba UNA carta (del mazo o del descarte
 *     del rival anterior), quedando con 11 en mano. Si esas 11 cartas
 *     arman exactamente su combinación elegida, puede cantar y ganar
 *     la ronda. Si no, debe descartar una carta para volver a 10.
 *   - Los comodines son comodín total: reemplazan cualquier carta que
 *     falte dentro de un grupo, siempre que el grupo tenga al menos
 *     una carta natural que defina el rango/palo.
 *
 * Simplificación de reglas (documentada también en el README):
 *   - El As siempre vale como carta baja (1) — no se arman escaleras
 *     tipo Q-K-A ni A-2-3 "cíclicas" con el As arriba.
 *   - No hay "bajadas" parciales a la mesa durante la ronda: todo se
 *     resuelve en la mano del jugador y se revela solo al ganar
 *     (rummy "cerrado"), tal como lo describiste.
 */
(function (global) {
  const Dice = global.GameHub.Dice;
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RED_SUITS = ['♥', '♦'];

  function buildDeck() {
    const cards = [];
    let uid = 0;
    for (let d = 0; d < 2; d++) {
      SUITS.forEach((suit) => {
        for (let r = 1; r <= 13; r++) cards.push({ uid: uid++, rank: r, suit, joker: false });
      });
      cards.push({ uid: uid++, rank: 0, suit: null, joker: true });
      cards.push({ uid: uid++, rank: 0, suit: null, joker: true });
    }
    return cards; // 108 cartas
  }

  function rankLabel(r) {
    if (r === 1) return 'A';
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    return String(r);
  }

  function cardPoints(card) {
    if (card.joker) return 20;
    if (card.rank === 1) return 1;
    if (card.rank >= 11) return 10;
    return card.rank;
  }

  function combinations(list, k) {
    const results = [];
    const n = list.length;
    if (k > n) return results;
    const idx = [];
    function backtrack(start) {
      if (idx.length === k) { results.push(idx.map((i) => list[i])); return; }
      for (let i = start; i < n; i++) { idx.push(i); backtrack(i + 1); idx.pop(); }
    }
    backtrack(0);
    return results;
  }

  /** Grupo de N cartas del mismo rango (palo libre), comodines rellenan lo que falte. */
  function isSameRankSet(cards) {
    const naturals = cards.filter((c) => !c.joker);
    if (naturals.length === 0) return false; // no se permite un grupo 100% comodines
    const rank = naturals[0].rank;
    return naturals.every((c) => c.rank === rank);
  }

  /** Escalera de `size` cartas consecutivas del mismo palo (As solo como carta baja). */
  function isSuitedStraight(cards, size) {
    const naturals = cards.filter((c) => !c.joker);
    if (naturals.length === 0) return false;
    const suit = naturals[0].suit;
    if (!naturals.every((c) => c.suit === suit)) return false;
    const ranks = naturals.map((c) => c.rank);
    if (new Set(ranks).size !== ranks.length) return false; // rango repetido en el mismo palo, imposible en escalera
    const span = Math.max(...ranks) - Math.min(...ranks) + 1;
    return span <= size;
  }

  function validateGroup(cards, kind) {
    return kind === 'set' ? isSameRankSet(cards) : isSuitedStraight(cards, cards.length);
  }

  function tryPartition(cards, sizes, kinds) {
    if (sizes.length === 0) return cards.length === 0 ? [] : null;
    const size = sizes[0];
    const kind = kinds[0];
    const combos = combinations(cards, size);
    for (const combo of combos) {
      if (validateGroup(combo, kind)) {
        const comboUids = new Set(combo.map((c) => c.uid));
        const remaining = cards.filter((c) => !comboUids.has(c.uid));
        const rest = tryPartition(remaining, sizes.slice(1), kinds.slice(1));
        if (rest) return [combo, ...rest];
      }
    }
    return null;
  }

  /** Devuelve los 3 grupos ganadores (arrays de cartas) o null si la mano de 11 no cierra. */
  function findWinningGroups(hand, type) {
    if (hand.length !== 11) return null;
    if (type === '4-4-3') return tryPartition(hand, [4, 4, 3], ['set', 'set', 'set']);
    return tryPartition(hand, [5, 3, 3], ['straight', 'set', 'set']);
  }

  class NaipesEngine {
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
      const deck = Dice.shuffle(buildDeck());
      this.hands = {};
      this.declaredType = {};
      this.seats.forEach((s) => { this.declaredType[s.id] = null; });

      let cursor = 0;
      this.seats.forEach((s) => {
        this.hands[s.id] = deck.slice(cursor, cursor + 10);
        cursor += 10;
      });
      this.discardPile = [deck[cursor]];
      cursor += 1;
      this.stock = deck.slice(cursor);

      this.turnPointer = 0;
      this.roundOver = false;
      this.phase = 'choosing-type'; // choosing-type -> drawing -> holding11 -> drawing (siguiente turno)...
      this.bus.emit('round-started', { round: this.round });
    }

    /** Cada asiento debe llamar esto una vez al inicio de ronda para fijar su combinación objetivo. */
    setDeclaredType(seatId, type) {
      if (this.declaredType[seatId]) return;
      this.declaredType[seatId] = type;
      this.bus.emit('type-chosen', { seatId, type });
      if (this.seats.every((s) => this.declaredType[s.id])) {
        this.phase = 'drawing';
        this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
      }
    }

    topDiscard() { return this.discardPile.length ? this.discardPile[this.discardPile.length - 1] : null; }

    _ensureStock() {
      if (this.stock.length === 0 && this.discardPile.length > 1) {
        const top = this.discardPile.pop();
        this.stock = Dice.shuffle(this.discardPile);
        this.discardPile = [top];
        this.bus.emit('stock-reshuffled', { count: this.stock.length });
      }
    }

    canDrawFromStock() { this._ensureStock(); return this.stock.length > 0; }

    drawFromStock(seatId) {
      this._ensureStock();
      if (!this.stock.length) return null;
      const card = this.stock.pop();
      this.hands[seatId].push(card);
      this.phase = 'holding11';
      this.bus.emit('drew-card', { seatId, source: 'stock', card });
      return card;
    }

    drawFromDiscard(seatId) {
      if (!this.discardPile.length) return null;
      const card = this.discardPile.pop();
      this.hands[seatId].push(card);
      this.phase = 'holding11';
      this.bus.emit('drew-card', { seatId, source: 'discard', card });
      return card;
    }

    /** Devuelve los grupos ganadores si la mano de 11 del asiento cierra, o null. */
    checkWin(seatId) {
      const hand = this.hands[seatId];
      if (hand.length !== 11) return null;
      return findWinningGroups(hand, this.declaredType[seatId]);
    }

    declareWin(seatId, groups) {
      this.roundOver = true;
      const type = this.declaredType[seatId];
      let pointsWon = 0;
      this.seats.forEach((s) => {
        if (s.id !== seatId) pointsWon += this.hands[s.id].reduce((sum, c) => sum + cardPoints(c), 0);
      });
      this.scores[seatId] += pointsWon;
      this.bus.emit('round-ended', {
        winnerId: seatId,
        type,
        groups,
        pointsWon,
        scores: { ...this.scores },
        hands: JSON.parse(JSON.stringify(this.hands)),
      });
    }

    discardCard(seatId, card) {
      const hand = this.hands[seatId];
      const idx = hand.findIndex((c) => c.uid === card.uid);
      if (idx < 0) return;
      hand.splice(idx, 1);
      this.discardPile.push(card);
      this.phase = 'drawing';
      this.bus.emit('discarded', { seatId, card });
      this._advanceTurn();
    }

    _advanceTurn() {
      if (this.roundOver) return;
      this.turnPointer = (this.turnPointer + 1) % this.seats.length;
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.NaipesEngine = NaipesEngine;
  global.GameHub.NaipesHelpers = { rankLabel, cardPoints, findWinningGroups, buildDeck, SUITS, RED_SUITS };
})(window);
