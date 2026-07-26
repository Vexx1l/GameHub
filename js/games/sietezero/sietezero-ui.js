(function (global) {
  const Data = global.GameHub.SieteZeroData;
  const POS_LABEL = Data.POS_LABEL;
  const FORMATION_KEYS = Object.keys(Data.FORMATIONS);
  const STYLE_KEYS = [
    { id: 'defensiva', label: 'Defensiva' },
    { id: 'equilibrada', label: 'Equilibrada' },
    { id: 'ofensiva', label: 'Ofensiva' },
  ];

  const SPEED_LEVELS = [
    { id: 'lenta', label: 'Lenta', ms: 95 },
    { id: 'normal', label: 'Normal', ms: 55 },
    { id: 'rapida', label: 'Rápida', ms: 28 },
    { id: 'turbo', label: 'Turbo', ms: 10 },
  ];
  const DEFAULT_SPEED_INDEX = 1;

  function penTickMsFor(minuteMs) {
    // Los penales se ven mal si van tan rápido como los minutos del partido:
    // se mantiene un piso legible incluso en modo Turbo.
    return Math.max(260, Math.min(900, minuteMs * 7));
  }

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Arma una tanda de penales pateador-a-pateador que respeta el resultado
   * final ya calculado por el motor (penMy/penOpp aciertos), repartiendo
   * aciertos/fallos entre suficientes rondas (mínimo 5, más si hubo muerte
   * súbita) en orden aleatorio para que se sienta orgánico.
   */
  function buildShootoutRounds(penMy, penOpp) {
    const totalRounds = Math.max(5, penMy, penOpp);
    const myOutcomes = shuffleArr([
      ...new Array(penMy).fill(true),
      ...new Array(totalRounds - penMy).fill(false),
    ]);
    const oppOutcomes = shuffleArr([
      ...new Array(penOpp).fill(true),
      ...new Array(totalRounds - penOpp).fill(false),
    ]);
    const rounds = [];
    for (let i = 0; i < totalRounds; i++) rounds.push({ mine: myOutcomes[i], opp: oppOutcomes[i] });
    return rounds;
  }

  function mount(container, config) {
    const seats = config.seats;
    const Engine = global.GameHub.SieteZeroEngine;
    const engine = new Engine(seats);
    let destroyed = false;
    let seatIndex = 0;
    let unsubs = [];
    let dailyMode = false;
    let dailyKey = null;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Selección de Ensueño</h2>
        </div>
      </div>
      <div class="sz-stage panel" id="sz-stage"></div>
    `;
    const stage = container.querySelector('#sz-stage');
    container.querySelector('.back-btn').addEventListener('click', () => { config.onExit(); });

    function on(event, handler) { unsubs.push(engine.bus.on(event, handler)); }

    function todayKey() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function msUntilMidnight() {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      return next.getTime() - now.getTime();
    }

    function formatCountdown(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      return `${h}:${m}:${sec}`;
    }

    function getDailyHistory() { return global.GameHub.Storage.get('sietezero:daily', {}); }

    function saveDailyResult(key, entry) {
      const history = getDailyHistory();
      history[key] = entry;
      global.GameHub.Storage.set('sietezero:daily', history);
      return history;
    }

    function computeStreak(history) {
      let streak = 0;
      const cursor = new Date();
      // Si hoy todavía no se jugó, la racha se cuenta desde ayer hacia atrás.
      for (;;) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (history[key]) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else if (streak === 0 && key === todayKey()) {
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }

    function renderModeSelect() {
      const key = todayKey();
      const history = getDailyHistory();
      const alreadyPlayed = !!history[key];
      const streak = computeStreak(history);
      let countdownTimer = null;

      stage.innerHTML = `
        <div class="sz-setup">
          <p class="sub">Elige cómo quieres jugar hoy.</p>
          <div class="sz-mode-grid">
            <button class="sz-mode-card" id="sz-mode-free">
              <span class="sz-mode-icon">🎲</span>
              <span class="sz-mode-title">Modo libre</span>
              <span class="sz-mode-desc">Tiradas nuevas cada vez, sin límites.</span>
            </button>
            <button class="sz-mode-card ${alreadyPlayed ? 'sz-mode-done' : ''}" id="sz-mode-daily">
              <span class="sz-mode-icon">📅</span>
              <span class="sz-mode-title">Desafío del día</span>
              <span class="sz-mode-desc">Todos los asientos de hoy reciben exactamente las mismas tiradas. Próxima seed en <b class="mono" id="sz-mode-countdown">--:--:--</b></span>
              ${streak > 0 ? `<span class="pill sz-badge-perfect">🔥 Racha: ${streak} día${streak === 1 ? '' : 's'}</span>` : ''}
              ${alreadyPlayed ? '<span class="pill">Ya jugado hoy — puedes repetirlo</span>' : ''}
            </button>
          </div>
        </div>
      `;

      const countdownEl = stage.querySelector('#sz-mode-countdown');
      const tickCountdown = () => { if (countdownEl) countdownEl.textContent = formatCountdown(msUntilMidnight()); };
      tickCountdown();
      countdownTimer = setInterval(tickCountdown, 1000);
      const stopCountdown = () => { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } };

      stage.querySelector('#sz-mode-free').addEventListener('click', () => {
        stopCountdown();
        dailyMode = false;
        dailyKey = null;
        engine.setSeed(null);
        runSeat(seats[0]);
      });
      stage.querySelector('#sz-mode-daily').addEventListener('click', () => {
        stopCountdown();
        dailyMode = true;
        dailyKey = key;
        engine.setSeed(global.GameHub.SieteZeroEngine.hashSeed('sietezero-daily-' + key));
        runSeat(seats[0]);
      });
    }

    function advance() {
      seatIndex += 1;
      if (seatIndex < seats.length) {
        runSeat(seats[seatIndex]);
      } else {
        runSimulation();
      }
    }

    function runSeat(seat) {
      if (seat.type === 'bot') {
        const formation = FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)];
        const style = STYLE_KEYS[Math.floor(Math.random() * STYLE_KEYS.length)].id;
        engine.configureSeat(seat.id, { formation, style, difficulty: 'clasico' });
        engine.autoDraftSeat(seat.id);
        advance();
        return;
      }
      renderSetup(seat);
    }

    function renderSetup(seat) {
      stage.innerHTML = `
        <div class="sz-setup">
          <p class="sub">Turno de <b style="color:${seat.hex}">${seat.label}</b> — arma tu formación antes de tirar el dado. ${dailyMode ? '<span class="pill">📅 Desafío del día</span>' : ''}</p>
          <div class="sz-choice-group">
            <h4>Formación</h4>
            <div class="sz-chip-row" id="sz-formation-row">
              ${FORMATION_KEYS.map((f, i) => `<button class="sz-chip ${i === 0 ? 'active' : ''}" data-formation="${f}">${f}</button>`).join('')}
            </div>
          </div>
          <div class="sz-choice-group">
            <h4>Estilo</h4>
            <div class="sz-chip-row" id="sz-style-row">
              ${STYLE_KEYS.map((s, i) => `<button class="sz-chip ${i === 1 ? 'active' : ''}" data-style="${s.id}">${s.label}</button>`).join('')}
            </div>
          </div>
          <div class="sz-choice-group">
            <h4>Dificultad</h4>
            <div class="sz-chip-row" id="sz-diff-row">
              <button class="sz-chip active" data-diff="clasico">Clásico — ves las valoraciones</button>
              <button class="sz-chip" data-diff="almanaque">De Almanaque — sin valoraciones</button>
            </div>
          </div>
          <div class="setup-actions">
            <button class="btn btn-primary" id="sz-start">Tirar el dado 🎲</button>
          </div>
        </div>
      `;
      let formation = FORMATION_KEYS[0];
      let style = STYLE_KEYS[1].id;
      let difficulty = 'clasico';
      stage.querySelectorAll('#sz-formation-row .sz-chip').forEach((btn) => btn.addEventListener('click', () => {
        formation = btn.dataset.formation;
        stage.querySelectorAll('#sz-formation-row .sz-chip').forEach((b) => b.classList.toggle('active', b === btn));
      }));
      stage.querySelectorAll('#sz-style-row .sz-chip').forEach((btn) => btn.addEventListener('click', () => {
        style = btn.dataset.style;
        stage.querySelectorAll('#sz-style-row .sz-chip').forEach((b) => b.classList.toggle('active', b === btn));
      }));
      stage.querySelectorAll('#sz-diff-row .sz-chip').forEach((btn) => btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        stage.querySelectorAll('#sz-diff-row .sz-chip').forEach((b) => b.classList.toggle('active', b === btn));
      }));
      stage.querySelector('#sz-start').addEventListener('click', () => {
        engine.configureSeat(seat.id, { formation, style, difficulty });
        renderDraft(seat);
      });
    }

    function renderDraft(seat) {
      const d = engine.draft[seat.id];

      function paint() {
        if (!d.currentDraw) return;
        const { team, candidates, neededPos } = d.currentDraw;
        const hideRatings = d.difficulty === 'almanaque';
        stage.innerHTML = `
          <div class="sz-draft">
            <div class="sz-draft-top">
              <div class="sz-progress">
                ${d.slots.map((pos, i) => `<span class="sz-slot ${i < d.currentIndex ? 'filled' : ''} ${i === d.currentIndex ? 'current' : ''}" title="${POS_LABEL[pos]}">${d.filled[i] ? '●' : POS_LABEL[pos][0]}</span>`).join('')}
              </div>
              <div class="pill">Rerolls: ${d.rerollsLeft}</div>
            </div>
            <div class="sz-roll-card">
              <div class="sz-roll-team">
                <span class="sz-flag">${team.flag}</span>
                <div>
                  <div class="sz-team-name">${team.country} ${team.year}</div>
                  <div class="sz-team-sub">${team.result} · posición necesitada: <b>${POS_LABEL[neededPos]}</b></div>
                </div>
              </div>
              <button class="btn btn-ghost" id="sz-reroll" ${d.rerollsLeft <= 0 ? 'disabled' : ''}>Tirar de nuevo 🎲</button>
            </div>
            <div class="sz-candidates">
              ${candidates.map((p) => `
                <button class="sz-player-card" data-id="${p.id}">
                  <span class="sz-player-num">${p.num}</span>
                  <span class="sz-player-name">${p.name}</span>
                  <span class="sz-player-pos">${POS_LABEL[p.pos]}</span>
                  <span class="sz-player-rating">${hideRatings ? '?' : p.rating}</span>
                </button>`).join('')}
            </div>
            <div class="sz-xi-list">
              <h4>Tu once hasta ahora</h4>
              <div class="sz-xi-grid">
                ${d.filled.map((f, i) => f ? `<div class="sz-xi-item"><b>${POS_LABEL[d.slots[i]]}</b> ${f.player.name} <span class="mono">(${f.team.country} ${f.team.year})</span></div>` : '').join('')}
              </div>
            </div>
          </div>
        `;
        stage.querySelector('#sz-reroll').addEventListener('click', () => engine.reroll(seat.id));
        stage.querySelectorAll('.sz-player-card').forEach((btn) => btn.addEventListener('click', () => {
          engine.pickPlayer(seat.id, btn.dataset.id);
        }));
      }

      on('draw', ({ seatId }) => { if (seatId === seat.id && !destroyed) paint(); });
      on('seat-ready', ({ seatId }) => {
        if (seatId !== seat.id || destroyed) return;
        renderSeatDone(seat);
      });
      paint();
    }

    function renderSeatDone(seat) {
      const d = engine.draft[seat.id];
      stage.innerHTML = `
        <div class="sz-setup">
          <h3>¡Once titular listo, ${seat.label}!</h3>
          <div class="sz-xi-grid">
            ${d.filled.map((f, i) => `<div class="sz-xi-item"><b>${POS_LABEL[d.slots[i]]}</b> ${f.player.name} <span class="mono">(${f.team.country} ${f.team.year})</span></div>`).join('')}
          </div>
          <div class="setup-actions">
            <button class="btn btn-primary" id="sz-continue">${seatIndex + 1 < seats.length ? 'Siguiente jugador' : 'Simular el Mundial'}</button>
          </div>
        </div>
      `;
      stage.querySelector('#sz-continue').addEventListener('click', advance);
    }

    const GROUP_ROUNDS = 3;
    let speedIndex = DEFAULT_SPEED_INDEX;
    let liveSpeedMs = SPEED_LEVELS[speedIndex].ms;
    let autoAdvance = true;
    let liveTimer = null;
    let liveAutoAdvance = null;

    function clearLiveTimers() {
      if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
      if (liveAutoAdvance) { clearTimeout(liveAutoAdvance); liveAutoAdvance = null; }
    }

    function runSimulation() {
      stage.innerHTML = `<div class="sz-setup"><h3>Simulando el Mundial…</h3></div>`;
      setTimeout(() => {
        if (destroyed) return;
        engine.simulateAll();
        startLivePlayback();
      }, 400);
    }

    /**
     * Reproduce el torneo "en vivo": ronda por ronda (igual índice de partido
     * para cada asiento — 3 de grupos + eliminatorias), con un reloj
     * compartido de 1' a 90' que va revelando los goles ya calculados por el
     * motor en el minuto en que ocurrieron.
     */
    function startLivePlayback() {
      const maxRounds = Math.max(0, ...seats.map((s) => engine.results[s.id].games.length));
      let round = 0;

      function playRound() {
        if (destroyed) return;
        if (round >= maxRounds) { renderResults(); return; }
        const matches = seats
          .map((s) => ({ seat: s, result: engine.results[s.id] }))
          .filter((x) => round < x.result.games.length)
          .map((x) => ({ seat: x.seat, game: x.result.games[round] }));
        if (!matches.length) { round += 1; playRound(); return; }
        const isLastGroupRound = round === GROUP_ROUNDS - 1;
        renderLiveRound(matches, () => {
          round += 1;
          if (isLastGroupRound) {
            renderGroupStandings(() => playRound());
          } else {
            playRound();
          }
        });
      }

      playRound();
    }

    /**
     * Arma la "tabla de grupo" de un asiento: su selección + los 3 rivales
     * que enfrentó en la fase de grupos, como un grupo real de Mundial.
     * Los rivales solo jugaron ese único partido (contra este asiento), así
     * que sus PJ/W/D/L/GF/GC salen de ese cruce.
     */
    function buildSeatGroupRows(seat) {
      const r = engine.results[seat.id];
      const groupGames = r.games.slice(0, GROUP_ROUNDS);
      const opponents = groupGames.map((g) => g.opponent);

      // Fila propia: los 3 partidos que realmente jugó el jugador.
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      groupGames.forEach((g) => {
        gf += g.golsMy; ga += g.golsOpp;
        if (g.golsMy > g.golsOpp) w += 1;
        else if (g.golsMy === g.golsOpp) d += 1;
        else l += 1;
      });
      const selfRow = {
        isSelf: true,
        label: seat.label,
        hex: seat.hex,
        pj: groupGames.length, w, d, l, gf, ga, dg: gf - ga, pts: w * 3 + d,
      };

      // Cada rival arranca con lo que sacó frente al jugador...
      const oppStats = opponents.map((team) => ({ team, w: 0, d: 0, l: 0, gf: 0, ga: 0 }));
      groupGames.forEach((g, i) => {
        const s = oppStats[i];
        s.gf += g.golsOpp; s.ga += g.golsMy;
        if (g.golsOpp > g.golsMy) s.w += 1;
        else if (g.golsOpp === g.golsMy) s.d += 1;
        else s.l += 1;
      });
      // ...y suma lo que sacó en los cruces contra los otros 2 rivales del
      // grupo, para que las 4 selecciones terminen con 3 partidos jugados.
      (r.groupCrossMatches || []).forEach((m) => {
        const iA = opponents.indexOf(m.teamA);
        const iB = opponents.indexOf(m.teamB);
        if (iA === -1 || iB === -1) return;
        oppStats[iA].gf += m.golsA; oppStats[iA].ga += m.golsB;
        oppStats[iB].gf += m.golsB; oppStats[iB].ga += m.golsA;
        if (m.golsA > m.golsB) { oppStats[iA].w += 1; oppStats[iB].l += 1; }
        else if (m.golsA === m.golsB) { oppStats[iA].d += 1; oppStats[iB].d += 1; }
        else { oppStats[iB].w += 1; oppStats[iA].l += 1; }
      });

      const oppRows = oppStats.map((s) => ({
        isSelf: false,
        label: `${s.team.flag} ${s.team.country} ${s.team.year}`,
        pj: s.w + s.d + s.l,
        w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga, dg: s.gf - s.ga, pts: s.w * 3 + s.d,
      }));

      const rows = [selfRow, ...oppRows].sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
      return { seat, r, rows };
    }

    function renderSeatGroupCard(seat) {
      const { r, rows } = buildSeatGroupRows(seat);
      return `
        <div class="panel sz-group-card">
          <div class="sz-group-card-head">
            <span class="swatch" style="background:${seat.hex}"></span>
            <b>${seat.label}</b>
            <span class="pill">${r.formation} · ${r.style}</span>
            <span class="sz-st-status">${r.advanced ? '<span class="pill sz-badge-advance">Avanza ✅</span>' : '<span class="pill">Eliminado ❌</span>'}</span>
          </div>
          <div class="sz-standings-table">
            <div class="sz-standings-row sz-standings-header">
              <span class="sz-st-pos">#</span>
              <span class="sz-st-team">Equipo</span>
              <span>PJ</span><span>G</span><span>E</span><span>P</span>
              <span>GF</span><span>GC</span><span>DG</span><span>Pts</span>
              <span class="sz-st-status"></span>
            </div>
            ${rows.map((row, i) => `
              <div class="sz-standings-row ${row.isSelf ? 'is-self' : ''}">
                <span class="sz-st-pos mono">${i + 1}</span>
                <span class="sz-st-team">${row.isSelf ? `<span class="swatch" style="background:${seat.hex}"></span>` : ''}${row.label}</span>
                <span class="mono">${row.pj}</span><span class="mono">${row.w}</span><span class="mono">${row.d}</span><span class="mono">${row.l}</span>
                <span class="mono">${row.gf}</span><span class="mono">${row.ga}</span><span class="mono">${row.dg > 0 ? '+' : ''}${row.dg}</span>
                <span class="mono sz-st-pts">${row.pts}</span>
                <span class="sz-st-status">${row.isSelf ? '<span class="sz-you-tag">TÚ</span>' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    /** Nueva ventana al cierre de la fase de grupos, antes de octavos:
     *  el grupo propio de cada jugador (su selección + los equipos que enfrentó). */
    function renderGroupStandings(onContinue) {
      const anyAdvances = seats.some((seat) => engine.results[seat.id].advanced);

      stage.innerHTML = `
        <div class="sz-standings">
          <h3>Fin de la fase de grupos</h3>
          <p class="sz-standings-note">Así quedó cada grupo: tu selección junto a los equipos con los que te mediste.</p>
          <div class="sz-groups-list">
            ${seats.map((seat) => renderSeatGroupCard(seat)).join('')}
          </div>
          <p class="sz-standings-note">Avanzan a octavos de final quienes suman al menos 4 puntos en la fase de grupos.</p>
          <div class="setup-actions">
            <button class="btn btn-primary" id="sz-standings-continue">${anyAdvances ? 'Continuar a octavos de final →' : 'Ver resultados finales →'}</button>
          </div>
        </div>
      `;

      const go = () => { clearLiveTimers(); onContinue(); };
      stage.querySelector('#sz-standings-continue').addEventListener('click', go);
      if (autoAdvance) liveAutoAdvance = setTimeout(go, 4200 + seats.length * 600);
    }

    function renderLiveRound(matches, onContinue) {
      const stageLabel = matches[0].game.stage.replace(/ \(.*\)$/, '');
      let minute = 0;
      let finished = false;
      let activeTickFn = null;
      const scoreState = matches.map(() => ({ my: 0, opp: 0 }));

      stage.innerHTML = `
        <div class="sz-live">
          <div class="sz-live-head">
            <h3>${stageLabel}</h3>
            <div class="sz-live-controls">
              <span class="sz-live-clock mono" id="sz-live-clock">0'</span>
              <button class="btn btn-ghost sz-btn-sm" id="sz-live-speed">⏩ ${SPEED_LEVELS[speedIndex].label}</button>
              <button class="btn btn-ghost sz-btn-sm" id="sz-live-auto">${autoAdvance ? '🔁 Auto' : '✋ Manual'}</button>
              <button class="btn btn-ghost sz-btn-sm" id="sz-live-skip">Saltar ronda ⏭</button>
            </div>
          </div>
          <div class="sz-live-grid">
            ${matches.map((m, i) => `
              <div class="sz-live-card" id="sz-live-card-${i}">
                <div class="sz-live-teams">
                  <div class="sz-live-side">
                    <span class="swatch" style="background:${m.seat.hex}"></span>
                    <span class="sz-live-name">${m.seat.label}</span>
                  </div>
                  <div class="sz-live-score mono" id="sz-live-score-${i}">0 - 0</div>
                  <div class="sz-live-side sz-live-side-right">
                    <span class="sz-live-name">${m.game.opponent.flag} ${m.game.opponent.country} ${m.game.opponent.year}</span>
                  </div>
                </div>
                <div class="sz-live-status" id="sz-live-status-${i}"></div>
                <div class="sz-live-feed" id="sz-live-feed-${i}"></div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const clockEl = stage.querySelector('#sz-live-clock');
      const cardRoot = stage.querySelector('.sz-live');
      const speedBtn = stage.querySelector('#sz-live-speed');
      const autoBtn = stage.querySelector('#sz-live-auto');

      const goNext = () => { clearLiveTimers(); onContinue(); };

      stage.querySelector('#sz-live-skip').addEventListener('click', finishInstant);

      speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % SPEED_LEVELS.length;
        liveSpeedMs = SPEED_LEVELS[speedIndex].ms;
        speedBtn.textContent = `⏩ ${SPEED_LEVELS[speedIndex].label}`;
        if (liveTimer && activeTickFn) {
          clearInterval(liveTimer);
          const ms = activeTickFn === tick ? liveSpeedMs : penTickMsFor(liveSpeedMs);
          liveTimer = setInterval(activeTickFn, ms);
        }
      });

      autoBtn.addEventListener('click', () => {
        autoAdvance = !autoAdvance;
        autoBtn.textContent = autoAdvance ? '🔁 Auto' : '✋ Manual';
        if (finished) {
          if (autoAdvance && !liveAutoAdvance) liveAutoAdvance = setTimeout(goNext, 1400);
          if (!autoAdvance && liveAutoAdvance) { clearTimeout(liveAutoAdvance); liveAutoAdvance = null; }
        }
      });

      function addGoal(i, side, g) {
        const st = scoreState[i];
        if (side === 'my') st.my += 1; else st.opp += 1;
        const scoreEl = stage.querySelector(`#sz-live-score-${i}`);
        if (scoreEl) {
          scoreEl.textContent = `${st.my} - ${st.opp}`;
          scoreEl.classList.remove('goal-flash');
          void scoreEl.offsetWidth;
          scoreEl.classList.add('goal-flash');
        }
        const feed = stage.querySelector(`#sz-live-feed-${i}`);
        if (feed) {
          const row = document.createElement('div');
          row.className = `sz-goal-row ${side === 'my' ? 'mine' : 'theirs'}`;
          row.innerHTML = `<span class="sz-goal-min mono">${g.minute}'</span> ⚽ ${g.name}`;
          feed.prepend(row);
        }
      }

      function applyMinute(min) {
        matches.forEach((m, i) => {
          m.game.scorersMy.filter((g) => g.minute === min).forEach((g) => addGoal(i, 'my', g));
          m.game.scorersOpp.filter((g) => g.minute === min).forEach((g) => addGoal(i, 'opp', g));
        });
      }

      function tick() {
        minute += 1;
        if (clockEl) clockEl.textContent = `${minute}'`;
        applyMinute(minute);
        if (minute >= 90) {
          clearInterval(liveTimer);
          liveTimer = null;
          handlePostFullTime();
        }
      }

      function handlePostFullTime() {
        const needsPen = matches.filter((m) => m.game.decidedByPenalties);
        if (!needsPen.length) { return finishRound(); }
        if (clockEl) clockEl.textContent = 'Penales';

        const penData = new Map();
        needsPen.forEach((m) => {
          const i = matches.indexOf(m);
          penData.set(m, { rounds: buildShootoutRounds(m.game.penMy, m.game.penOpp), idx: 0, my: 0, opp: 0 });
          const statusEl = stage.querySelector(`#sz-live-status-${i}`);
          if (statusEl) statusEl.textContent = '🥅 Empate — se define por penales…';
          const feed = stage.querySelector(`#sz-live-feed-${i}`);
          if (feed) feed.innerHTML = `<div class="sz-pen-track" id="sz-pen-track-${i}"></div>`;
          const scoreEl = stage.querySelector(`#sz-live-score-${i}`);
          if (scoreEl) scoreEl.textContent = `${m.game.golsMy} - ${m.game.golsOpp} (pen. 0-0)`;
        });

        function tickPenalty() {
          let allDone = true;
          needsPen.forEach((m) => {
            const i = matches.indexOf(m);
            const pd = penData.get(m);
            if (pd.idx >= pd.rounds.length) return;
            allDone = false;
            const r = pd.rounds[pd.idx];
            pd.idx += 1;
            if (r.mine) pd.my += 1;
            if (r.opp) pd.opp += 1;
            const scoreEl = stage.querySelector(`#sz-live-score-${i}`);
            if (scoreEl) {
              scoreEl.textContent = `${m.game.golsMy} - ${m.game.golsOpp} (pen. ${pd.my}-${pd.opp})`;
              scoreEl.classList.remove('goal-flash');
              void scoreEl.offsetWidth;
              scoreEl.classList.add('goal-flash');
            }
            const track = stage.querySelector(`#sz-pen-track-${i}`);
            if (track) {
              const kick = document.createElement('div');
              kick.className = 'sz-pen-kick';
              kick.innerHTML = `<span class="sz-pen-dot ${r.mine ? 'made' : 'missed'}" title="${m.seat.label}"></span><span class="sz-pen-num mono">${pd.idx}</span><span class="sz-pen-dot ${r.opp ? 'made' : 'missed'}" title="${m.game.opponent.country}"></span>`;
              track.appendChild(kick);
              track.scrollLeft = track.scrollWidth;
            }
          });
          if (allDone) {
            clearInterval(liveTimer);
            liveTimer = null;
            needsPen.forEach((m) => {
              const i = matches.indexOf(m);
              const statusEl = stage.querySelector(`#sz-live-status-${i}`);
              if (statusEl) statusEl.textContent = m.game.wonPenalties ? '✅ Gana en penales' : '❌ Pierde en penales';
            });
            finishRound();
          }
        }

        activeTickFn = tickPenalty;
        liveTimer = setInterval(tickPenalty, penTickMsFor(liveSpeedMs));
      }

      function describeOutcome(m) {
        const g = m.game;
        if (g.golsMy > g.golsOpp) return '✅ Ganado';
        if (g.golsMy < g.golsOpp) return '❌ Perdido';
        return g.decidedByPenalties ? '' : '➖ Empate';
      }

      function finishRound() {
        if (finished) return;
        finished = true;
        matches.forEach((m, i) => {
          const statusEl = stage.querySelector(`#sz-live-status-${i}`);
          if (statusEl && !statusEl.textContent) statusEl.textContent = describeOutcome(m);
        });
        if (clockEl) clockEl.textContent = 'Final';
        const actions = document.createElement('div');
        actions.className = 'setup-actions';
        actions.innerHTML = `<button class="btn btn-primary" id="sz-live-continue">Continuar</button>`;
        cardRoot.appendChild(actions);
        stage.querySelector('#sz-live-continue').addEventListener('click', goNext);
        if (autoAdvance) liveAutoAdvance = setTimeout(goNext, 2200);
      }

      function finishInstant() {
        clearLiveTimers();
        matches.forEach((m, i) => {
          const st = scoreState[i];
          st.my = m.game.golsMy; st.opp = m.game.golsOpp;
          const scoreEl = stage.querySelector(`#sz-live-score-${i}`);
          if (scoreEl) {
            scoreEl.textContent = m.game.decidedByPenalties
              ? `${m.game.golsMy} - ${m.game.golsOpp} (pen. ${m.game.penMy}-${m.game.penOpp})`
              : `${m.game.golsMy} - ${m.game.golsOpp}`;
          }
          const feed = stage.querySelector(`#sz-live-feed-${i}`);
          if (feed) {
            feed.innerHTML = '';
            const all = [
              ...m.game.scorersMy.map((g) => ({ ...g, side: 'mine' })),
              ...m.game.scorersOpp.map((g) => ({ ...g, side: 'theirs' })),
            ].sort((a, b) => b.minute - a.minute);
            all.forEach((g) => {
              const row = document.createElement('div');
              row.className = `sz-goal-row ${g.side}`;
              row.innerHTML = `<span class="sz-goal-min mono">${g.minute}'</span> ⚽ ${g.name}`;
              feed.appendChild(row);
            });
          }
        });
        if (clockEl) clockEl.textContent = 'Final';
        finishRound();
      }

      activeTickFn = tick;
      liveTimer = setInterval(tick, liveSpeedMs);
    }

    function stageRank(result) {
      const order = ['Eliminado en fase de grupos', 'Octavos de final', 'Cuartos de final', 'Semifinal', 'Final'];
      let idx = 0;
      for (let i = 0; i < order.length; i++) if (result.stageReached.indexOf(order[i]) === 0) idx = i;
      return (result.champion ? 100 : 0) + idx * 10 + (result.gf - result.ga);
    }

    function renderResults() {
      const results = seats.map((s) => engine.results[s.id]);
      const ranked = seats.map((s, i) => ({ seat: s, result: results[i] })).sort((a, b) => stageRank(b.result) - stageRank(a.result));
      const anyHumanWon = ranked.length && ranked[0].seat.type === 'human';
      global.GameHub.Storage.recordResult('sietezero', anyHumanWon ? 'human-win' : 'bot-win');

      let dailyBlock = '';
      if (dailyMode && dailyKey) {
        const humanSeat = seats.find((s) => s.type === 'human') || seats[0];
        const humanResult = engine.results[humanSeat.id];
        const history = saveDailyResult(dailyKey, {
          champion: humanResult.champion,
          stageReached: humanResult.stageReached,
          perfect7a0: humanResult.perfect7a0,
          formation: humanResult.formation,
          style: humanResult.style,
          missions: (humanResult.missions || []).map((m) => m.id),
        });
        const streak = computeStreak(history);
        dailyBlock = `
          <div class="panel sz-daily-summary">
            <b>📅 Desafío del día guardado</b> — racha actual: 🔥 ${streak} día${streak === 1 ? '' : 's'}.
            <div class="sz-daily-note">Vuelve mañana para una nueva tirada compartida.</div>
          </div>`;
      }

      stage.innerHTML = `
        <div class="sz-results">
          <h3>Resultados del Mundial</h3>
          ${dailyBlock}
          ${seats.length > 1 ? `
            <div class="sz-leaderboard">
              ${ranked.map((r, i) => `
                <div class="seat-row">
                  <span class="mono">#${i + 1}</span>
                  <span class="swatch" style="background:${r.seat.hex}"></span>
                  <span class="seat-name">${r.seat.label}</span>
                  <span class="pill">${r.result.champion ? '🏆 Campeón' : r.result.stageReached}</span>
                  <span class="mono">${r.result.gf}-${r.result.ga}</span>
                  ${r.result.perfect7a0 ? '<span class="pill sz-badge-perfect">7 a 0 ⭐</span>' : ''}
                </div>`).join('')}
            </div>` : ''}
          <div class="sz-team-results">
            ${seats.map((seat) => renderSeatResultCard(seat, engine.results[seat.id])).join('')}
          </div>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="sz-exit">Volver al hub</button>
            <button class="btn btn-primary" id="sz-again">Jugar de nuevo</button>
          </div>
        </div>
      `;

      stage.querySelector('#sz-exit').addEventListener('click', () => config.onExit());
      stage.querySelector('#sz-again').addEventListener('click', () => {
        unsubs.forEach((off) => off());
        unsubs = [];
        engine.bus.clear();
        seatIndex = 0;
        const fresh = new Engine(seats);
        Object.assign(engine, fresh);
        renderModeSelect();
      });
    }

    function renderSeatResultCard(seat, r) {
      return `
        <div class="panel sz-result-card">
          <div class="sz-result-header">
            <span class="swatch" style="background:${seat.hex}"></span>
            <b>${seat.label}</b>
            <span class="pill">${r.formation} · ${r.style}</span>
            ${r.perfect7a0 ? '<span class="pill sz-badge-perfect">¡7 a 0! ⭐</span>' : ''}
          </div>
          <div class="sz-result-summary">
            ${r.champion ? '🏆 Campeón del Mundial' : r.stageReached} · ${r.wins}V ${r.draws}E ${r.losses}D · goles ${r.gf}-${r.ga}
          </div>
          ${r.missions && r.missions.length ? `
            <div class="sz-missions-row">
              ${r.missions.map((m) => `<span class="pill sz-mission-pill" title="${m.desc}">${m.icon} ${m.label}</span>`).join('')}
            </div>` : ''}
          <div class="sz-games">
            ${r.games.map((g) => `
              <div class="sz-game-row">
                <span class="sz-game-stage">${g.stage}</span>
                <span>vs ${g.opponent.flag} ${g.opponent.country} ${g.opponent.year}</span>
                <span class="mono">${g.golsMy}-${g.golsOpp}${g.decidedByPenalties ? ` (pen. ${g.penMy}-${g.penOpp})` : ''}</span>
              </div>`).join('')}
          </div>
        </div>
      `;
    }

    renderModeSelect();

    return {
      destroy() {
        destroyed = true;
        clearLiveTimers();
        unsubs.forEach((off) => off());
        engine.bus.clear();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'sietezero',
    name: 'Selección de Ensueño',
    tagline: 'Tira el dado, arma tu once con cracks reales de distintos Mundiales y simula el torneo — ¿logras el 7 a 0?',
    tag: 'FÚTBOL · 1 A 4 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="22" fill="#12291d" stroke="var(--gold-500)" stroke-width="2.5"/>
      <path d="M28 14l6 4.5-2.3 7-7.4 0-2.3-7z" fill="var(--gold-500)"/>
      <path d="M28 14V9M20.5 18.5l-4-3M35.5 18.5l4-3M24.3 25.5l-5 3.5M31.7 25.5l5 3.5M24.3 25.5L21 36M31.7 25.5L35 36" stroke="var(--gold-500)" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4] },
    mount,
  });
})(window);
