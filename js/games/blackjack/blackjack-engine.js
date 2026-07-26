/**
 * blackjack-engine.js — lógica pura de Blackjack (21), para 1 a 5
 * jugadores contra la casa (el "dealer" no es un asiento, es la banca).
 *
 * Cada ronda tiene 3 fases:
 *   1. "betting" — por turnos, cada jugador apuesta fichas.
 *   2. "playing" — por turnos, cada jugador pide carta, se planta o
 *      dobla, hasta plantarse, pasarse de 21 o llegar a 21.
 *   3. "dealer" — la banca revela su carta oculta y pide carta mientras
 *      su total sea menor a 17 (se planta siempre en cualquier 17,
 *      "duro" o "blando" — simplificación de la regla oficial).
 * Al final se liquidan las apuestas: blackjack natural paga 3 a 2, una
 * mano ganadora normal paga 1 a 1, empate ("push") devuelve la apuesta.
 *
 * Simplificaciones (para que sepas qué expandir):
 * - No hay "split" de pares ni seguro contra blackjack de la banca.
 * - Doblar solo está permitido como primera acción (con las 2 cartas
 *   iniciales) y siempre reparte exactamente una carta más.
 * - El zapato tiene 6 mazos combinados y se reparte de nuevo entre
 *   rondas (no a mitad de mano) cuando quedan pocas cartas.
 * - Las fichas de cada jugador viven solo en esta sesión de juego (no
 *   se guardan en localStorage), ya que los asientos cambian de una
 *   partida a otra.
 */
(function (global) {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const NUM_DECKS = 6;
  const START_BALANCE = 1000;
  const RESHUFFLE_THRESHOLD = 20;

  function buildShoe() {
    const cards = [];
    for (let d = 0; d < NUM_DECKS; d++) {
      SUITS.forEach((suit) => RANKS.forEach((rank) => cards.push({ rank, suit })));
    }
    return global.GameHub.Dice.shuffle(cards);
  }

  function cardValue(card) {
    if (card.rank === 'A') return 11;
    if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
    return Number(card.rank);
  }

  function handValue(cards) {
    let total = cards.reduce((sum, c) => sum + cardValue(c), 0);
    let aces = cards.filter((c) => c.rank === 'A').length;
    let soft = aces > 0;
    while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
    if (aces === 0) soft = false;
    return { total, soft };
  }

  function isBlackjack(cards) { return cards.length === 2 && handValue(cards).total === 21; }

  class BlackjackEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.balances = {};
      seats.forEach((s) => { this.balances[s.id] = START_BALANCE; });
      this.round = 0;
      this.shoe = buildShoe();
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }
    seatById(id) { return this.seats.find((s) => s.id === id); }

    _draw() {
      if (this.shoe.length === 0) this.shoe = buildShoe();
      return this.shoe.pop();
    }

    startRound() {
      this.round += 1;
      if (this.shoe.length < RESHUFFLE_THRESHOLD) this.shoe = buildShoe();
      this.bets = {};
      this.hands = {};
      this.status = {}; // 'pending' | 'active' | 'stand' | 'bust' | 'blackjack'
      this.matchScores = {};
      this.dealerHand = [];
      this.seats.forEach((s) => { this.hands[s.id] = []; this.status[s.id] = 'pending'; this.matchScores[s.id] = 0; });
      this.roundOver = false;
      this.phase = 'betting';
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.bus.emit('round-started', { round: this.round });
      this.bus.emit('turn-changed', {});
    }

    placeBet(seatId, amount) {
      if (this.roundOver || this.phase !== 'betting' || seatId !== this.currentSeat.id || this.bets[seatId] !== undefined) return { ok: false };
      const balance = this.balances[seatId];
      const bet = balance <= 0 ? 0 : Math.max(0, Math.min(balance, Math.round(amount)));
      this.bets[seatId] = bet;
      this.bus.emit('bet-placed', { seatId, bet });
      const allBet = this.seats.every((s) => this.bets[s.id] !== undefined);
      if (allBet) { this._deal(); return { ok: true }; }
      this._advanceBettingTurn();
      return { ok: true };
    }

    _advanceBettingTurn() {
      const n = this.seats.length;
      let tries = 0;
      do {
        this.turnPointer = (this.turnPointer + 1) % n;
        tries += 1;
      } while (this.bets[this.currentSeat.id] !== undefined && tries <= n);
      this.bus.emit('turn-changed', {});
    }

    _deal() {
      this.seats.forEach((s) => { this.hands[s.id] = [this._draw(), this._draw()]; });
      this.dealerHand = [this._draw(), this._draw()];
      this.seats.forEach((s) => {
        if (this.bets[s.id] === 0) { this.status[s.id] = 'sin-ficha'; return; }
        this.status[s.id] = isBlackjack(this.hands[s.id]) ? 'blackjack' : 'active';
      });
      this.phase = 'playing';
      this.bus.emit('dealt', { hands: { ...this.hands }, dealerUp: this.dealerHand[0] });
      const firstActive = this.seats.findIndex((s) => this.status[s.id] === 'active');
      if (firstActive === -1) { this._dealerPlay(); return; }
      this.turnPointer = firstActive;
      this.bus.emit('turn-changed', {});
    }

    hit(seatId) {
      if (this.roundOver || this.phase !== 'playing' || seatId !== this.currentSeat.id || this.status[seatId] !== 'active') return { ok: false };
      this.hands[seatId].push(this._draw());
      const { total } = handValue(this.hands[seatId]);
      if (total > 21) this.status[seatId] = 'bust';
      else if (total === 21) this.status[seatId] = 'stand';
      this.bus.emit('hand-changed', { seatId, hand: [...this.hands[seatId]] });
      if (this.status[seatId] !== 'active') this._advancePlayTurn();
      return { ok: true };
    }

    stand(seatId) {
      if (this.roundOver || this.phase !== 'playing' || seatId !== this.currentSeat.id || this.status[seatId] !== 'active') return { ok: false };
      this.status[seatId] = 'stand';
      this.bus.emit('hand-changed', { seatId, hand: [...this.hands[seatId]] });
      this._advancePlayTurn();
      return { ok: true };
    }

    double(seatId) {
      if (this.roundOver || this.phase !== 'playing' || seatId !== this.currentSeat.id || this.status[seatId] !== 'active') return { ok: false };
      if (this.hands[seatId].length !== 2 || this.balances[seatId] < this.bets[seatId] * 2) return { ok: false };
      this.bets[seatId] *= 2;
      this.hands[seatId].push(this._draw());
      const { total } = handValue(this.hands[seatId]);
      this.status[seatId] = total > 21 ? 'bust' : 'stand';
      this.bus.emit('hand-changed', { seatId, hand: [...this.hands[seatId]] });
      this._advancePlayTurn();
      return { ok: true };
    }

    _advancePlayTurn() {
      const n = this.seats.length;
      let tries = 0;
      do {
        this.turnPointer = (this.turnPointer + 1) % n;
        tries += 1;
      } while (this.status[this.currentSeat.id] !== 'active' && tries <= n);
      if (this.status[this.currentSeat.id] !== 'active') { this._dealerPlay(); return; }
      this.bus.emit('turn-changed', {});
    }

    _dealerPlay() {
      this.phase = 'dealer';
      this.bus.emit('dealer-turn', { dealerHand: [...this.dealerHand] });
      const anyoneStillIn = this.seats.some((s) => this.status[s.id] === 'stand' || this.status[s.id] === 'blackjack');
      if (anyoneStillIn) {
        while (handValue(this.dealerHand).total < 17) this.dealerHand.push(this._draw());
      }
      this._resolve();
    }

    _resolve() {
      const dealerTotal = handValue(this.dealerHand).total;
      const dealerBJ = isBlackjack(this.dealerHand);
      const dealerBust = dealerTotal > 21;
      const results = {};
      this.seats.forEach((s) => {
        const bet = this.bets[s.id] || 0;
        let net = 0;
        let outcome = 'push';
        if (this.status[s.id] === 'sin-ficha') {
          outcome = 'sin-ficha';
        } else if (this.status[s.id] === 'blackjack') {
          if (dealerBJ) { net = 0; outcome = 'push'; } else { net = Math.round(bet * 1.5); outcome = 'blackjack'; }
        } else if (this.status[s.id] === 'bust') {
          net = -bet; outcome = 'bust';
        } else {
          const playerTotal = handValue(this.hands[s.id]).total;
          if (dealerBJ) { net = -bet; outcome = 'pierde'; } else if (dealerBust || playerTotal > dealerTotal) { net = bet; outcome = 'gana'; } else if (playerTotal === dealerTotal) { net = 0; outcome = 'push'; } else { net = -bet; outcome = 'pierde'; }
        }
        this.balances[s.id] += net;
        this.matchScores[s.id] = net;
        results[s.id] = { outcome, net, total: handValue(this.hands[s.id]).total };
      });
      this.roundOver = true;
      this.bus.emit('round-ended', {
        dealerHand: [...this.dealerHand], dealerTotal, dealerBust, dealerBJ,
        results, balances: { ...this.balances },
      });
    }

    resetBalance(seatId) {
      this.balances[seatId] = START_BALANCE;
      this.bus.emit('balance-reset', { seatId });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.BlackjackEngine = BlackjackEngine;
  global.GameHub.BlackjackHelpers = { handValue, isBlackjack, cardValue, START_BALANCE };
})(window);
