/**
 * penales-engine.js — lógica pura de la Tanda de Penales, 1 a 2 jugadores
 * (Local contra Visitante — con bot si falta alguno de los dos).
 *
 * Cada "tanda" (ronda) simula una tanda de penales real: 5 disparos por
 * lado, alternando siempre Local-Visitante-Local-Visitante… Si terminan
 * empatados, se pasa a muerte súbita: una ronda más de un disparo por
 * lado hasta que los totales difieran al cerrar una ronda.
 *
 * Simplificaciones (para que sepas qué expandir):
 * - Local patea siempre primero en cada ronda (no hay sorteo de moneda).
 * - Si un lado ya no puede alcanzar al otro aunque acierte todos sus
 *   disparos restantes, la tanda se corta ahí mismo (regla real de
 *   "definición matemática anticipada").
 * - Cada disparo elige una de 6 zonas del arco (alto/bajo × izquierda/
 *   centro/derecha). Si el arquero adivina la misma zona, casi siempre
 *   ataja — pero queda un 22% de probabilidad de que la potencia del
 *   disparo lo supere igual. Si no adivina la zona, es gol salvo un 8%
 *   de probabilidad de que el disparo se vaya afuera de cualquier forma.
 * Los triunfos de cada tanda se acumulan en un marcador histórico entre
 * tandas, sin límite para seguir jugando tanda tras tanda.
 */
(function (global) {
  const ZONES = [
    { id: 'AI', label: 'Alto — Izquierda' },
    { id: 'AC', label: 'Alto — Centro' },
    { id: 'AD', label: 'Alto — Derecha' },
    { id: 'BI', label: 'Bajo — Izquierda' },
    { id: 'BC', label: 'Bajo — Centro' },
    { id: 'BD', label: 'Bajo — Derecha' },
  ];

  class PenalesEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // seats[0] = Local, seats[1] = Visitante
      this.scores = {}; // tandas ganadas, acumulado histórico
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.startShootout();
    }

    get homeSeat() { return this.seats[0]; }
    get awaySeat() { return this.seats[1]; }
    get shooterSeat() { return this.sideIdx === 0 ? this.homeSeat : this.awaySeat; }
    get keeperSeat() { return this.sideIdx === 0 ? this.awaySeat : this.homeSeat; }

    startShootout() {
      this.round += 1;
      this.stage = 'regular';
      this.roundIndex = 1;
      this.sideIdx = 0;
      this.kicks = [];
      this.pendingShot = null;
      this.phase = 'aiming';
      this.over = false;
      this.winnerId = null;
      this.bus.emit('shootout-started', { round: this.round });
      this.bus.emit('phase-changed', {});
    }

    goalsFor(side) { return this.kicks.filter((k) => k.side === side && k.result === 'gol').length; }
    takenFor(side) { return this.kicks.filter((k) => k.side === side).length; }
    historyFor(side) { return this.kicks.filter((k) => k.side === side).map((k) => k.zone); }

    chooseShot(seatId, zone) {
      if (this.over || this.phase !== 'aiming' || seatId !== this.shooterSeat.id) return { ok: false };
      this.pendingShot = zone;
      this.phase = 'keeping';
      this.bus.emit('shot-aimed', { seatId, zone });
      this.bus.emit('phase-changed', {});
      return { ok: true };
    }

    chooseKeep(seatId, zone) {
      if (this.over || this.phase !== 'keeping' || seatId !== this.keeperSeat.id) return { ok: false };
      const shotZone = this.pendingShot;
      const isMiss = Math.random() < 0.08;
      let result;
      if (isMiss) result = 'fuera';
      else if (shotZone === zone) result = Math.random() < 0.22 ? 'gol' : 'atajada';
      else result = 'gol';

      const side = this.sideIdx === 0 ? 'home' : 'away';
      const kick = {
        stage: this.stage, roundIndex: this.roundIndex, side, zone: shotZone, keeperZone: zone, result,
      };
      this.kicks.push(kick);
      this.pendingShot = null;
      this.bus.emit('kick-resolved', { kick, shooterId: this.shooterSeat.id, keeperId: this.keeperSeat.id });
      this._advance();
      return { ok: true };
    }

    _advance() {
      const goalsHome = this.goalsFor('home');
      const goalsAway = this.goalsFor('away');

      if (this.stage === 'regular') {
        const remHome = 5 - this.takenFor('home');
        const remAway = 5 - this.takenFor('away');
        if (goalsHome > goalsAway + remAway) { this._end('home'); return; }
        if (goalsAway > goalsHome + remHome) { this._end('away'); return; }
      }

      if (this.sideIdx === 0) {
        this.sideIdx = 1;
        this.phase = 'aiming';
        this.bus.emit('phase-changed', {});
        return;
      }

      // El visitante acaba de patear — la ronda está completa.
      if (this.stage === 'sudden' && goalsHome !== goalsAway) {
        this._end(goalsHome > goalsAway ? 'home' : 'away');
        return;
      }

      if (this.stage === 'regular' && this.roundIndex >= 5) {
        this.stage = 'sudden';
        this.roundIndex = 1;
      } else {
        this.roundIndex += 1;
      }
      this.sideIdx = 0;
      this.phase = 'aiming';
      this.bus.emit('phase-changed', {});
    }

    _end(winnerSide) {
      this.over = true;
      this.phase = 'over';
      const winnerSeat = winnerSide === 'home' ? this.homeSeat : this.awaySeat;
      this.winnerId = winnerSeat.id;
      this.scores[winnerSeat.id] += 1;
      this.bus.emit('shootout-ended', {
        winnerId: winnerSeat.id,
        winnerSide,
        goalsHome: this.goalsFor('home'),
        goalsAway: this.goalsFor('away'),
        scores: { ...this.scores },
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.PenalesEngine = PenalesEngine;
  global.GameHub.PenalesHelpers = { ZONES };
})(window);
