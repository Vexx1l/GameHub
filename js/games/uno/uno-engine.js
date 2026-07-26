/**
 * uno-engine.js — lógica pura del clásico juego de cartas UNO (2 a 8 jugadores).
 *
 * Mazo estándar (108 cartas):
 *   - 4 colores (rojo, amarillo, verde, azul), cada uno con:
 *       un 0, dos de cada número 1-9, dos "salta turno", dos "reversa",
 *       dos "+2"  →  25 cartas por color = 100 cartas.
 *   - 4 comodines de cambio de color + 4 comodines "+4"  = 8 cartas.
 *
 * Simplificaciones de reglas (documentadas también en el README):
 *   - La carta inicial del descarte siempre se elige entre las cartas
 *     numéricas del mazo (nunca una carta especial ni un comodín), así
 *     no hay que resolver el caso "el primer turno empieza con +4".
 *   - Un comodín "+4" se puede jugar en cualquier momento (no se exige
 *     demostrar que no tenías cartas del color vigente).
 *   - "Cantar UNO": al quedarte con 1 carta debes marcarlo con el botón
 *     ¡UNO! antes de que empiece tu siguiente turno. Si no lo haces,
 *     te castigas solo con +2 cartas apenas te vuelva el turno (no hay
 *     "cachar" al rival: como se juega en una sola pantalla compartida,
 *     todas las manos son visibles, así que la mecánica de "cachar a
 *     otro" no aporta nada — cada quien vigila la suya).
 *   - No hay puntaje objetivo para terminar la partida: cada ronda que
 *     alguien se queda sin cartas suma los puntos de las manos rivales
 *     y se puede seguir jugando rondas indefinidamente (igual que
 *     Dominó y Escalera y Trío).
 */
(function (global) {
  const Dice = global.GameHub.Dice;
  const COLORS = ['rojo', 'amarillo', 'verde', 'azul'];

  function buildDeck() {
    const cards = [];
    let uid = 0;
    COLORS.forEach((color) => {
      cards.push({ uid: uid++, color, value: '0' });
      for (let n = 1; n <= 9; n++) {
        cards.push({ uid: uid++, color, value: String(n) });
        cards.push({ uid: uid++, color, value: String(n) });
      }
      ['salta', 'reversa', 'mas2'].forEach((v) => {
        cards.push({ uid: uid++, color, value: v });
        cards.push({ uid: uid++, color, value: v });
      });
    });
    for (let i = 0; i < 4; i++) cards.push({ uid: uid++, color: 'negro', value: 'comodin' });
    for (let i = 0; i < 4; i++) cards.push({ uid: uid++, color: 'negro', value: 'mas4' });
    return cards; // 108 cartas
  }

  function isNumberValue(v) { return /^[0-9]$/.test(v); }

  function valueLabel(value) {
    switch (value) {
      case 'salta': return '⦸';
      case 'reversa': return '⇄';
      case 'mas2': return '+2';
      case 'comodin': return '★';
      case 'mas4': return '+4';
      default: return value;
    }
  }

  function cardPoints(card) {
    if (card.color === 'negro') return 50;
    if (isNumberValue(card.value)) return Number(card.value);
    return 20; // salta, reversa, +2
  }

  class UnoEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {};
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.turnPointer = 0;
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }
    get activeColor() { return this._activeColor; }
    topDiscard() { return this.discardPile[this.discardPile.length - 1]; }
    seatById(id) { return this.seats.find((s) => s.id === id); }

    startRound() {
      this.round += 1;
      const deck = Dice.shuffle(buildDeck());
      this.hands = {};
      this.unoCalled = {};
      this.seats.forEach((s) => { this.unoCalled[s.id] = false; });

      let cursor = 0;
      this.seats.forEach((s) => {
        this.hands[s.id] = deck.slice(cursor, cursor + 7);
        cursor += 7;
      });

      const rest = deck.slice(cursor);
      // Simplificación: la carta inicial siempre es numérica (ver cabecera del archivo).
      const startIdx = rest.findIndex((c) => c.color !== 'negro' && isNumberValue(c.value));
      const startCard = rest.splice(startIdx, 1)[0];
      this.discardPile = [startCard];
      this.stock = rest;
      this._activeColor = startCard.color;
      this.direction = 1;
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.roundOver = false;
      this.bus.emit('round-started', { round: this.round });
      this._beginTurn();
    }

    isPlayable(card) {
      if (card.color === 'negro') return true;
      const top = this.topDiscard();
      if (card.color === this._activeColor) return true;
      if (top && card.value === top.value) return true;
      return false;
    }

    hasPlayableCard(hand) { return hand.some((c) => this.isPlayable(c)); }

    _ensureStock(needed) {
      if (this.stock.length >= needed) return;
      if (this.discardPile.length <= 1) return; // no hay de dónde reponer
      const top = this.discardPile.pop();
      this.stock = this.stock.concat(Dice.shuffle(this.discardPile));
      this.discardPile = [top];
      this.bus.emit('stock-reshuffled', { count: this.stock.length });
    }

    _dealFromStock(seatId, n) {
      const dealt = [];
      for (let i = 0; i < n; i++) {
        this._ensureStock(1);
        if (!this.stock.length) break; // mazo y descarte agotados (caso extremo)
        const card = this.stock.pop();
        this.hands[seatId].push(card);
        dealt.push(card);
      }
      this.unoCalled[seatId] = false;
      return dealt;
    }

    _calcIndex(steps) {
      const n = this.seats.length;
      return ((this.turnPointer + this.direction * steps) % n + n) % n;
    }

    _goToSeat(steps) {
      this.turnPointer = this._calcIndex(steps);
      this._beginTurn();
    }

    _beginTurn() {
      if (this.roundOver) return;
      const seat = this.currentSeat;
      const hand = this.hands[seat.id];
      if (hand.length === 1 && !this.unoCalled[seat.id]) {
        this._dealFromStock(seat.id, 2);
        this.bus.emit('uno-penalty', { seatId: seat.id });
      }
      this.phase = 'turn';
      this.bus.emit('turn-changed', { seatId: seat.id });
    }

    drawCard(seatId) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'turn') return null;
      this._ensureStock(1);
      if (!this.stock.length) { this._goToSeat(1); return null; }
      const card = this.stock.pop();
      this.hands[seatId].push(card);
      this.unoCalled[seatId] = false;
      this.phase = 'drawn';
      this.bus.emit('card-drawn', { seatId, card, playable: this.isPlayable(card) });
      return card;
    }

    passAfterDraw(seatId) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'drawn') return;
      this._goToSeat(1);
    }

    callUno(seatId) {
      const hand = this.hands[seatId];
      if (hand && hand.length <= 2 && !this.unoCalled[seatId]) {
        this.unoCalled[seatId] = true;
        this.bus.emit('uno-called', { seatId });
      }
    }

    playCard(seatId, cardUid, chosenColor) {
      if (this.roundOver || seatId !== this.currentSeat.id) return { ok: false };
      const hand = this.hands[seatId];
      const idx = hand.findIndex((c) => c.uid === cardUid);
      if (idx < 0) return { ok: false, reason: 'no-existe' };
      const card = hand[idx];
      if (!this.isPlayable(card)) return { ok: false, reason: 'no-jugable' };
      if (card.color === 'negro' && !chosenColor) return { ok: false, reason: 'falta-color' };

      hand.splice(idx, 1);
      this.discardPile.push(card);
      this._activeColor = card.color === 'negro' ? chosenColor : card.color;
      this.bus.emit('card-played', {
        seatId, card, chosenColor: card.color === 'negro' ? chosenColor : null, handLeft: hand.length,
      });

      if (hand.length === 0) { this._endRound(seatId); return { ok: true, won: true }; }
      this.unoCalled[seatId] = hand.length === 1 ? this.seatById(seatId).type === 'bot' : false;

      switch (card.value) {
        case 'salta':
          this._goToSeat(2);
          break;
        case 'reversa':
          this.direction *= -1;
          this._goToSeat(this.seats.length === 2 ? 2 : 1);
          break;
        case 'mas2': {
          const target = this.seats[this._calcIndex(1)];
          this._dealFromStock(target.id, 2);
          this.bus.emit('forced-draw', { seatId: target.id, count: 2 });
          this._goToSeat(2);
          break;
        }
        case 'mas4': {
          const target = this.seats[this._calcIndex(1)];
          this._dealFromStock(target.id, 4);
          this.bus.emit('forced-draw', { seatId: target.id, count: 4 });
          this._goToSeat(2);
          break;
        }
        default:
          this._goToSeat(1);
      }
      return { ok: true, won: false };
    }

    _endRound(winnerId) {
      this.roundOver = true;
      let pointsWon = 0;
      this.seats.forEach((s) => {
        if (s.id !== winnerId) pointsWon += this.hands[s.id].reduce((sum, c) => sum + cardPoints(c), 0);
      });
      this.scores[winnerId] += pointsWon;
      this.bus.emit('round-ended', {
        winnerId, pointsWon, scores: { ...this.scores }, hands: JSON.parse(JSON.stringify(this.hands)),
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.UnoEngine = UnoEngine;
  global.GameHub.UnoHelpers = { valueLabel, cardPoints, buildDeck, COLORS, isNumberValue };
})(window);
