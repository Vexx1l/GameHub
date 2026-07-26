/**
 * SieteZeroEngine — motor puro (sin DOM) del juego "Selección de Ensueño".
 *
 * Inspirado en la mecánica pública del juego 7a0 (7a0.com.br): tirar el
 * dado para sacar una selección/Mundial al azar, elegir un jugador real de
 * esa plantilla para cada posición de tu formación, y luego simular un
 * Mundial ficticio (3 partidos de grupo + 4 de eliminación directa) para
 * ver si logras el "7 a 0": campeón, invicto y sin recibir goles.
 *
 * Esta es una reimplementación propia, con datos y código originales
 * (ver sietezero-data.js) — no usa ningún archivo del sitio original.
 *
 * Soporta un modo "Desafío del día": si se pasa un seed numérico, cada
 * asiento recibe su propio generador pseudoaleatorio determinista
 * (mulberry32) arrancando del mismo número, así todos los jugadores que
 * abren el juego el mismo día reciben exactamente las mismas tiradas.
 *
 * Simplificaciones (a diferencia del juego original):
 * - Solo 4 posiciones amplias (POR/DEF/MED/DEL), no sub-roles.
 * - El avance de grupo se decide por puntos (>=4 de 9) contra rivales
 *   generados al azar, no por una liguilla completa de 4 selecciones.
 * - Penales en empates de eliminatoria: probabilidad ajustada según la
 *   fuerza relativa de los planteles, no un mini-motor de penales.
 */
(function (global) {
  const STYLE_MOD = {
    ofensiva: { atk: 6, def: -6 },
    equilibrada: { atk: 0, def: 0 },
    defensiva: { atk: -6, def: 6 },
  };

  const KNOCKOUT_STAGES = ['Octavos de final', 'Cuartos de final', 'Semifinal', 'Final'];

  function avg(arr, fallback) {
    if (!arr.length) return fallback;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /** PRNG determinista (mulberry32): misma semilla -> misma secuencia siempre. */
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t |= 0; t = (t + 0x6D2B79F5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Convierte un string (p. ej. la fecha de hoy) en un entero para usar como semilla. */
  function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  function poissonSample(lambda, rng) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= rng();
    } while (p > L);
    return k - 1;
  }

  function SieteZeroEngine(seats, opts) {
    this.bus = new global.GameHub.EventBus();
    this.seats = seats;
    this.data = global.GameHub.SieteZeroData;
    this.draft = {};
    this.results = {};
    this.seed = opts && typeof opts.seed === 'number' ? opts.seed : null;
  }

  SieteZeroEngine.prototype.setSeed = function (seed) {
    this.seed = typeof seed === 'number' ? seed : null;
  };

  SieteZeroEngine.prototype.rngFor = function (d) {
    return (d && d.rng) || Math.random;
  };

  SieteZeroEngine.prototype.buildSlots = function (formation) {
    const spec = this.data.FORMATIONS[formation];
    const slots = ['POR'];
    for (let i = 0; i < spec.DEF; i++) slots.push('DEF');
    for (let i = 0; i < spec.MED; i++) slots.push('MED');
    for (let i = 0; i < spec.DEL; i++) slots.push('DEL');
    return slots;
  };

  SieteZeroEngine.prototype.configureSeat = function (seatId, { formation, style, difficulty }) {
    const slots = this.buildSlots(formation);
    this.draft[seatId] = {
      formation, style, difficulty,
      slots,
      filled: new Array(slots.length).fill(null),
      currentIndex: 0,
      rerollsLeft: difficulty === 'almanaque' ? 1 : 3,
      currentDraw: null,
      usedPlayerIds: new Set(),
      status: 'drafting',
      log: [],
      rng: this.seed != null ? mulberry32(this.seed) : null,
    };
    this.bus.emit('seat-configured', { seatId });
    this.rollForSlot(seatId);
  };

  SieteZeroEngine.prototype.rollForSlot = function (seatId, attempts) {
    attempts = attempts || 0;
    const d = this.draft[seatId];
    if (!d || d.status !== 'drafting') return;
    const rng = this.rngFor(d);
    const neededPos = d.slots[d.currentIndex];
    const teams = this.data.TEAMS;
    const team = teams[Math.floor(rng() * teams.length)];
    const candidates = team.players.filter((p) => p.pos === neededPos && !d.usedPlayerIds.has(p.id));
    if (candidates.length === 0 && attempts < 40) {
      this.rollForSlot(seatId, attempts + 1);
      return;
    }
    d.currentDraw = { team, candidates, neededPos };
    this.bus.emit('draw', { seatId });
  };

  SieteZeroEngine.prototype.reroll = function (seatId) {
    const d = this.draft[seatId];
    if (!d || d.rerollsLeft <= 0) return false;
    d.rerollsLeft -= 1;
    this.rollForSlot(seatId);
    return true;
  };

  SieteZeroEngine.prototype.pickPlayer = function (seatId, playerId) {
    const d = this.draft[seatId];
    if (!d || !d.currentDraw) return;
    const player = d.currentDraw.candidates.find((p) => p.id === playerId);
    if (!player) return;
    d.filled[d.currentIndex] = { player, team: d.currentDraw.team };
    d.usedPlayerIds.add(player.id);
    d.log.push({ slotIndex: d.currentIndex, pos: d.slots[d.currentIndex], player, team: d.currentDraw.team });
    d.currentIndex += 1;
    d.currentDraw = null;
    if (d.currentIndex >= d.slots.length) {
      d.status = 'ready';
      this.bus.emit('seat-ready', { seatId });
    } else {
      this.rollForSlot(seatId);
      this.bus.emit('pick', { seatId });
    }
  };

  SieteZeroEngine.prototype.allReady = function () {
    return this.seats.every((s) => this.draft[s.id] && this.draft[s.id].status === 'ready');
  };

  /** Auto-draft para bots: siempre toma el mejor candidato disponible. */
  SieteZeroEngine.prototype.autoDraftSeat = function (seatId) {
    const d = this.draft[seatId];
    let guard = 0;
    while (d.status === 'drafting' && guard < 200) {
      guard += 1;
      if (d.currentDraw && d.currentDraw.candidates.length) {
        const best = d.currentDraw.candidates.reduce((a, b) => (b.rating > a.rating ? b : a));
        this.pickPlayer(seatId, best.id);
      } else {
        break;
      }
    }
  };

  SieteZeroEngine.prototype.myRatings = function (d) {
    const mod = STYLE_MOD[d.style] || STYLE_MOD.equilibrada;
    const atk = [];
    const def = [];
    d.slots.forEach((pos, i) => {
      const f = d.filled[i];
      if (!f) return;
      if (pos === 'MED' || pos === 'DEL') atk.push(f.player.rating);
      if (pos === 'POR' || pos === 'DEF') def.push(f.player.rating);
    });
    return { attack: avg(atk, 70) + mod.atk, defense: avg(def, 70) + mod.def };
  };

  SieteZeroEngine.prototype.opponentRatings = function (team) {
    const atk = team.players.filter((p) => p.pos === 'MED' || p.pos === 'DEL').map((p) => p.rating);
    const def = team.players.filter((p) => p.pos === 'POR' || p.pos === 'DEF').map((p) => p.rating);
    return { attack: avg(atk, 75), defense: avg(def, 75), team };
  };

  SieteZeroEngine.prototype.randomOpponent = function (usedSet, rng) {
    rng = rng || Math.random;
    const teams = this.data.TEAMS;
    let t;
    let attempts = 0;
    do {
      t = teams[Math.floor(rng() * teams.length)];
      attempts += 1;
    } while (usedSet.has(t.id) && attempts < 25);
    usedSet.add(t.id);
    return t;
  };

  SieteZeroEngine.prototype.pickScorers = function (d, count) {
    if (count <= 0) return [];
    const rng = this.rngFor(d);
    const attackers = [];
    d.slots.forEach((pos, i) => {
      const f = d.filled[i];
      if (f && (pos === 'MED' || pos === 'DEL')) attackers.push(f.player);
    });
    const pool = attackers.length ? attackers : d.filled.filter(Boolean).map((f) => f.player);
    const minutes = [];
    for (let i = 0; i < count; i++) minutes.push(1 + Math.floor(rng() * 90));
    minutes.sort((a, b) => a - b);
    const totalW = pool.reduce((a, p) => a + p.rating, 0) || 1;
    return minutes.map((min) => {
      let r = rng() * totalW;
      let chosen = pool[0];
      for (const p of pool) {
        r -= p.rating;
        if (r <= 0) { chosen = p; break; }
      }
      return { name: chosen.name, minute: min };
    });
  };

  SieteZeroEngine.prototype.pickOpponentScorers = function (team, count, rng) {
    rng = rng || Math.random;
    if (count <= 0) return [];
    const attackers = team.players.filter((p) => p.pos === 'MED' || p.pos === 'DEL');
    const pool = attackers.length ? attackers : team.players;
    const minutes = [];
    for (let i = 0; i < count; i++) minutes.push(1 + Math.floor(rng() * 90));
    minutes.sort((a, b) => a - b);
    const totalW = pool.reduce((a, p) => a + p.rating, 0) || 1;
    return minutes.map((min) => {
      let r = rng() * totalW;
      let chosen = pool[0];
      for (const p of pool) {
        r -= p.rating;
        if (r <= 0) { chosen = p; break; }
      }
      return { name: chosen.name, minute: min };
    });
  };

  SieteZeroEngine.prototype.playMatch = function (d, myR, opp) {
    const rng = this.rngFor(d);
    const oppR = this.opponentRatings(opp);
    const expMy = Math.max(0.2, 1.15 + (myR.attack - oppR.defense) / 18);
    const expOpp = Math.max(0.2, 1.15 + (oppR.attack - myR.defense) / 18);
    const golsMy = poissonSample(expMy, rng);
    const golsOpp = poissonSample(expOpp, rng);
    return {
      opponent: opp,
      golsMy,
      golsOpp,
      scorersMy: this.pickScorers(d, golsMy),
      scorersOpp: this.pickOpponentScorers(opp, golsOpp, rng),
    };
  };

  /** Partido "neutral" entre dos selecciones rivales (sin el jugador),
   * usado para completar la liguilla de grupo entre los 3 equipos con
   * los que se midió cada asiento. */
  SieteZeroEngine.prototype.simulateNeutralMatch = function (teamA, teamB, rng) {
    const rA = this.opponentRatings(teamA);
    const rB = this.opponentRatings(teamB);
    const expA = Math.max(0.2, 1.05 + (rA.attack - rB.defense) / 18);
    const expB = Math.max(0.2, 1.05 + (rB.attack - rA.defense) / 18);
    return { teamA, teamB, golsA: poissonSample(expA, rng), golsB: poissonSample(expB, rng) };
  };

  /** Completa la liguilla de grupo: cruza entre sí a los 3 rivales que
   * enfrentó el asiento, para que las 4 selecciones (jugador + 3 rivales)
   * terminen con el mismo número de partidos jugados, como un grupo real. */
  SieteZeroEngine.prototype.simulateOpponentCrossMatches = function (opponents, rng) {
    const pairs = [];
    for (let i = 0; i < opponents.length; i++) {
      for (let j = i + 1; j < opponents.length; j++) {
        pairs.push(this.simulateNeutralMatch(opponents[i], opponents[j], rng));
      }
    }
    return pairs;
  };

  SieteZeroEngine.prototype.simulateSeat = function (seatId) {
    const d = this.draft[seatId];
    const rng = this.rngFor(d);
    const myR = this.myRatings(d);
    const usedOpponents = new Set();
    const games = [];
    let pts = 0;
    let gf = 0;
    let ga = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (let i = 0; i < 3; i++) {
      const opp = this.randomOpponent(usedOpponents, rng);
      const g = this.playMatch(d, myR, opp);
      g.stage = 'Fase de grupos ' + (i + 1) + '/3';
      games.push(g);
      gf += g.golsMy; ga += g.golsOpp;
      if (g.golsMy > g.golsOpp) { pts += 3; wins += 1; }
      else if (g.golsMy === g.golsOpp) { pts += 1; draws += 1; }
      else { losses += 1; }
    }

    const groupOpponents = games.map((g) => g.opponent);
    const groupCrossMatches = this.simulateOpponentCrossMatches(groupOpponents, rng);

    const advanced = pts >= 4;
    let stageReached = 'Eliminado en fase de grupos';
    let champion = false;

    if (advanced) {
      for (const stage of KNOCKOUT_STAGES) {
        const opp = this.randomOpponent(usedOpponents, rng);
        const g = this.playMatch(d, myR, opp);
        g.stage = stage;
        if (g.golsMy === g.golsOpp) {
          g.decidedByPenalties = true;
          const strengthDiff = (myR.attack + myR.defense) - (this.opponentRatings(opp).attack + this.opponentRatings(opp).defense);
          const pWin = Math.max(0.2, Math.min(0.8, 0.5 + strengthDiff / 300));
          const won = rng() < pWin;
          g.wonPenalties = won;
          g.penMy = won ? 4 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 3);
          g.penOpp = won ? 2 + Math.floor(rng() * 3) : 4 + Math.floor(rng() * 3);
          games.push(g);
          gf += g.golsMy; ga += g.golsOpp;
          stageReached = stage + (won ? ' (ganado por penales)' : ' (eliminado por penales)');
          if (!won) { losses += 1; break; }
          wins += 1;
          if (stage === 'Final') champion = true;
        } else {
          games.push(g);
          gf += g.golsMy; ga += g.golsOpp;
          if (g.golsMy > g.golsOpp) {
            wins += 1;
            stageReached = stage + ' (ganado)';
            if (stage === 'Final') champion = true;
          } else {
            losses += 1;
            stageReached = stage + ' (eliminado)';
            break;
          }
        }
      }
    }

    const perfect7a0 = champion && losses === 0 && ga === 0;
    const result = {
      seatId, games, advanced, stageReached, champion,
      wins, draws, losses, gf, ga, perfect7a0,
      formation: d.formation, style: d.style, difficulty: d.difficulty,
      slots: d.slots, filled: d.filled,
      groupCrossMatches,
    };
    if (global.GameHub.SieteZeroMissions) {
      result.missions = global.GameHub.SieteZeroMissions.evaluate(result, d);
    }
    this.results[seatId] = result;
    return result;
  };

  SieteZeroEngine.prototype.simulateAll = function () {
    this.seats.forEach((s) => this.simulateSeat(s.id));
    this.bus.emit('simulation-done', {});
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.SieteZeroEngine = SieteZeroEngine;
  global.GameHub.SieteZeroEngine.hashSeed = hashSeed;
})(window);
