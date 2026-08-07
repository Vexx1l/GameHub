/**
 * generala-engine.js — lógica pura de la Generala (variante latinoamericana
 * del Yahtzee), para 1 a 8 jugadores.
 *
 * Cada jugador, en su turno, tira 5 dados hasta 3 veces (puede retener los
 * dados que quiera entre tiradas) y al final debe anotar el resultado en
 * UNA de las 10 categorías que todavía tenga libres. La partida ("ronda"
 * del hub) termina cuando TODOS los jugadores completaron sus 10
 * categorías; gana quien tenga el total más alto de esa partida.
 *
 * Categorías y puntaje:
 *   - Unos..Seises: suma de los dados que muestran ese número
 *     (ej. tres 4 = 12 puntos en "Cuatros").
 *   - Escalera: 1-2-3-4-5 o 2-3-4-5-6 → 20 puntos fijos.
 *   - Full (trío + par) → 30 puntos fijos.
 *   - Póker (cuatro iguales) → 40 puntos fijos.
 *   - Generala (los 5 iguales) → 50 puntos, o 100 si es "servida"
 *     (los 5 iguales de una, en la primera tirada del turno, sin
 *     haber retenido nada todavía).
 *
 * Puedes anotar en cualquier categoría libre aunque tus dados no
 * califiquen para ella (queda en 0) — es la forma de "sacrificar" una
 * categoría difícil, igual que en el Yahtzee clásico.
 *
 * Simplificaciones: no hay "escalera corta", ni bonus por Generala doble;
 * el puntaje de cada partida se suma al acumulado histórico del jugador
 * (visible en el panel lateral), y se puede jugar partida tras partida
 * sin un puntaje objetivo para terminar, igual que los demás juegos.
 */
(function (global) {
  const CATEGORIES = [
    { id: 'unos', label: 'Unos', numberValue: 1 },
    { id: 'doses', label: 'Doses', numberValue: 2 },
    { id: 'treses', label: 'Treses', numberValue: 3 },
    { id: 'cuatros', label: 'Cuatros', numberValue: 4 },
    { id: 'cincos', label: 'Cincos', numberValue: 5 },
    { id: 'seises', label: 'Seises', numberValue: 6 },
    { id: 'escalera', label: 'Escalera' },
    { id: 'full', label: 'Full' },
    { id: 'poker', label: 'Póker' },
    { id: 'generala', label: 'Generala' },
  ];

  function tally(dice) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    dice.forEach((d) => { counts[d] += 1; });
    return counts;
  }

  function computeScore(categoryId, dice, servida) {
    const counts = tally(dice);
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    if (cat && cat.numberValue) return counts[cat.numberValue] * cat.numberValue;

    if (categoryId === 'escalera') {
      const sorted = [...dice].sort((a, b) => a - b).join(',');
      return (sorted === '1,2,3,4,5' || sorted === '2,3,4,5,6') ? 20 : 0;
    }
    if (categoryId === 'full') {
      const counts2 = Object.values(counts).filter((c) => c > 0).sort((a, b) => b - a);
      return (counts2[0] === 3 && counts2[1] === 2) ? 30 : 0;
    }
    if (categoryId === 'poker') {
      return Object.values(counts).some((c) => c >= 4) ? 40 : 0;
    }
    if (categoryId === 'generala') {
      if (Object.values(counts).some((c) => c === 5)) return servida ? 100 : 50;
      return 0;
    }
    return 0;
  }

  class GeneralaEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {}; // acumulado histórico entre partidas
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }

    startRound() {
      this.round += 1;
      this.matchScores = {};
      this.usedCategories = {};
      this.seats.forEach((s) => { this.matchScores[s.id] = 0; this.usedCategories[s.id] = {}; });
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.roundOver = false;
      this.bus.emit('round-started', { round: this.round });
      this._startPlayerTurn();
    }

    _startPlayerTurn() {
      this.dice = [1, 1, 1, 1, 1];
      this.held = [false, false, false, false, false];
      this.rollsLeft = 3;
      this.rollCount = 0;
      this.phase = 'rolling';
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    roll(seatId) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'rolling' || this.rollsLeft <= 0) return null;
      for (let i = 0; i < 5; i++) { if (!this.held[i]) this.dice[i] = global.GameHub.Dice.roll(); }
      this.rollsLeft -= 1;
      this.rollCount += 1;
      if (this.rollsLeft === 0) this.phase = 'choosing-category';
      this.bus.emit('rolled', { seatId, dice: [...this.dice], rollsLeft: this.rollsLeft });
      return [...this.dice];
    }

    toggleHold(seatId, idx) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'rolling' || this.rollCount === 0) return;
      this.held[idx] = !this.held[idx];
      this.bus.emit('held-changed', { seatId, held: [...this.held] });
    }

    stopRolling(seatId) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'rolling' || this.rollCount === 0) return;
      this.phase = 'choosing-category';
      this.bus.emit('stopped-rolling', { seatId });
    }

    openCategories(seatId) {
      return CATEGORIES.filter((c) => this.usedCategories[seatId][c.id] === undefined).map((c) => c.id);
    }

    scoreCategory(seatId, categoryId) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.phase !== 'choosing-category') return { ok: false };
      if (this.usedCategories[seatId][categoryId] !== undefined) return { ok: false, reason: 'ya-usada' };
      const servida = categoryId === 'generala' && this.rollCount === 1;
      const value = computeScore(categoryId, this.dice, servida);
      this.usedCategories[seatId][categoryId] = value;
      this.matchScores[seatId] += value;
      this.bus.emit('scored', { seatId, categoryId, value, servida });

      const allDone = this.seats.every((s) => Object.keys(this.usedCategories[s.id]).length === CATEGORIES.length);
      if (allDone) { this._endRound(); return { ok: true, matchOver: true }; }
      this._advanceTurn();
      return { ok: true, matchOver: false };
    }

    _advanceTurn() {
      const n = this.seats.length;
      let tries = 0;
      do {
        this.turnPointer = (this.turnPointer + 1) % n;
        tries += 1;
      } while (Object.keys(this.usedCategories[this.currentSeat.id]).length === CATEGORIES.length && tries <= n);
      this._startPlayerTurn();
    }

    _endRound() {
      this.roundOver = true;
      this.seats.forEach((s) => { this.scores[s.id] += this.matchScores[s.id]; });
      let best = -1;
      let winners = [];
      this.seats.forEach((s) => {
        if (this.matchScores[s.id] > best) { best = this.matchScores[s.id]; winners = [s.id]; } else if (this.matchScores[s.id] === best) { winners.push(s.id); }
      });
      this.bus.emit('round-ended', { winners, matchScores: { ...this.matchScores }, scores: { ...this.scores } });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.GeneralaEngine = GeneralaEngine;
  global.GameHub.GeneralaHelpers = { CATEGORIES, computeScore, tally };
})(window);
