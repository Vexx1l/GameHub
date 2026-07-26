(function (global) {
  const PenalesEngine = global.GameHub.PenalesEngine;
  const PenalesBot = global.GameHub.PenalesBot;
  const H = global.GameHub.PenalesHelpers;
  const RESULT_LABEL = { gol: '¡GOL!', atajada: '¡ATAJADA!', fuera: '¡SE FUE AFUERA!' };

  function mount(container, config) {
    const seats = config.seats;
    const engine = new PenalesEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:penales', delay: 2400 });
    const hasBots = seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Tanda de Penales</h2>
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="pn-speed">Velocidad bots</label>
            <input type="range" id="pn-speed" min="150" max="1600" step="50" value="${config.speed || 700}">
          </div>` : ''}
      </div>
      <div class="penales-layout">
        <div class="panel penales-scoreboard">
          <div class="pn-team">
            <span class="swatch" style="background:${engine.homeSeat.hex}"></span>
            <span class="seat-name">${engine.homeSeat.label}</span>
            <div class="pn-dots" id="pn-dots-home"></div>
          </div>
          <div class="pn-stage" id="pn-stage"></div>
          <div class="pn-team pn-team-away">
            <div class="pn-dots" id="pn-dots-away"></div>
            <span class="seat-name">${engine.awaySeat.label}</span>
            <span class="swatch" style="background:${engine.awaySeat.hex}"></span>
          </div>
        </div>
        <div class="panel penales-main">
          <div class="pn-phase" id="pn-phase"></div>
          <div class="pn-goal" id="pn-goal"></div>
          <p class="pn-result" id="pn-result"></p>
        </div>
        <div class="panel penales-side">
          <h3>Tandas ganadas</h3>
          <div id="pn-scores"></div>
          <div class="log" id="pn-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="pn-round-end" hidden>
        <div class="panel setup-card" id="pn-round-card"></div>
      </div>
    `;

    const dotsHomeEl = container.querySelector('#pn-dots-home');
    const dotsAwayEl = container.querySelector('#pn-dots-away');
    const stageEl = container.querySelector('#pn-stage');
    const phaseEl = container.querySelector('#pn-phase');
    const goalEl = container.querySelector('#pn-goal');
    const resultEl = container.querySelector('#pn-result');
    const scoresEl = container.querySelector('#pn-scores');
    const logEl = container.querySelector('#pn-log');
    const speedInput = container.querySelector('#pn-speed');
    const roundEndOverlay = container.querySelector('#pn-round-end');
    const roundEndCard = container.querySelector('#pn-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function renderScores() {
      scoresEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function dotsFor(side) {
      const kicks = engine.kicks.filter((k) => k.side === side);
      return kicks.map((k) => `<span class="pn-dot ${k.result === 'gol' ? 'is-goal' : 'is-miss'}"></span>`).join('')
        || '<span class="pn-dot-empty">—</span>';
    }

    function renderScoreboard() {
      dotsHomeEl.innerHTML = dotsFor('home');
      dotsAwayEl.innerHTML = dotsFor('away');
      stageEl.textContent = engine.stage === 'regular' ? `Ronda ${engine.roundIndex} de 5` : `Muerte súbita — ronda ${engine.roundIndex}`;
    }

    function renderGoalGrid(mode, seat) {
      goalEl.innerHTML = `
        <div class="pn-grid">
          ${H.ZONES.map((z) => `<button class="pn-zone" data-zone="${z.id}" title="${z.label}"></button>`).join('')}
        </div>`;
      const buttons = goalEl.querySelectorAll('.pn-zone');
      if (seat.type === 'human') {
        buttons.forEach((btn) => {
          btn.addEventListener('click', () => {
            if (mode === 'shoot') engine.chooseShot(seat.id, btn.dataset.zone);
            else engine.chooseKeep(seat.id, btn.dataset.zone);
          });
        });
      } else {
        buttons.forEach((btn) => { btn.disabled = true; });
      }
    }

    function renderPhase() {
      resultEl.textContent = '';
      if (engine.over) { phaseEl.innerHTML = ''; goalEl.innerHTML = ''; return; }
      if (engine.phase === 'aiming') {
        const seat = engine.shooterSeat;
        phaseEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> <b>${seat.label}</b> patea — elige la zona ${seat.type === 'bot' ? '(Bot)' : ''}`;
        renderGoalGrid('shoot', seat);
      } else if (engine.phase === 'keeping') {
        const seat = engine.keeperSeat;
        phaseEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> <b>${seat.label}</b> ataja — elige dónde volar ${seat.type === 'bot' ? '(Bot)' : ''}`;
        renderGoalGrid('keep', seat);
      }
    }

    function scheduleBotAction() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.over) return;
        if (engine.phase === 'aiming' && engine.shooterSeat.type === 'bot') {
          const zone = PenalesBot.chooseShotZone(engine.shooterSeat.difficulty || 'normal');
          engine.chooseShot(engine.shooterSeat.id, zone);
        } else if (engine.phase === 'keeping' && engine.keeperSeat.type === 'bot') {
          const history = engine.historyFor(engine.sideIdx === 0 ? 'home' : 'away');
          const zone = PenalesBot.chooseKeepZone(engine.keeperSeat.difficulty || 'normal', history);
          engine.chooseKeep(engine.keeperSeat.id, zone);
        }
      }, delay);
    }

    engine.bus.on('phase-changed', () => {
      renderPhase();
      renderScoreboard();
      if (!engine.over) {
        const actor = engine.phase === 'aiming' ? engine.shooterSeat : engine.keeperSeat;
        if (actor.type === 'bot') scheduleBotAction();
      }
    });

    engine.bus.on('kick-resolved', ({ kick, shooterId, keeperId }) => {
      const shooter = seats.find((s) => s.id === shooterId);
      resultEl.textContent = `${RESULT_LABEL[kick.result]} — ${shooter.label} disparó y ${kick.result === 'gol' ? 'convirtió' : kick.result === 'atajada' ? 'el arquero atajó' : 'el balón se fue afuera'}.`;
      log(`${shooter.label}: ${RESULT_LABEL[kick.result]}`);
      renderScoreboard();
    });

    engine.bus.on('shootout-ended', ({ winnerId, goalsHome, goalsAway, scores }) => {
      clearTimeout(botTimer);
      renderScores();
      renderScoreboard();
      phaseEl.innerHTML = '';
      goalEl.innerHTML = '';
      const winner = seats.find((s) => s.id === winnerId);
      log(`¡Tanda terminada! Ganó ${winner.label} (${goalsHome}-${goalsAway}).`);

      global.GameHub.Storage.recordResult('penales', winner.type === 'human' ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>¡Ganó ${winner.label}!</h2>
        <p class="sub">Marcador final de la tanda: ${goalsHome} — ${goalsAway}</p>
        <div id="pn-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="pn-exit">Volver al hub</button>
          <button class="btn btn-primary" id="pn-next">Jugar otra tanda</button>
        </div>
        <div class="autoplay-row" id="pn-autoplay"></div>
      `;
      roundEndCard.querySelector('#pn-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${scores[s.id]} tandas ganadas</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNext = () => {
        roundEndOverlay.hidden = true;
        engine.startShootout();
        renderScoreboard();
        renderPhase();
        resultEl.textContent = '';
        if (engine.shooterSeat.type === 'bot') scheduleBotAction();
      };
      roundEndCard.querySelector('#pn-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#pn-next').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#pn-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar tandas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNext); },
      });
      autoplay.arm(autoplayHost, startNext);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { clearTimeout(botTimer); autoplay.cancel(); config.onExit(); });

    renderScores();
    renderScoreboard();
    renderPhase();
    log(`— Tanda ${engine.round} comenzada — patea ${engine.homeSeat.label} —`);
    if (engine.shooterSeat.type === 'bot') scheduleBotAction();

    return {
      destroy() {
        destroyed = true;
        clearTimeout(botTimer);
        autoplay.cancel();
        engine.bus.clear();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'penales',
    name: 'Tanda de Penales',
    tagline: 'Definí el partido a puro penal: elige la zona para patear o volá a atajarla cuando te toque el arco.',
    tag: 'FÚTBOL · 1 A 2 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12 H50 V16 H46 V44 H10 V16 H6 Z" fill="none" stroke="#F6EFDD" stroke-width="2.4"/>
      <line x1="6" y1="16" x2="10" y2="16" stroke="#F6EFDD" stroke-width="2"/>
      <line x1="50" y1="16" x2="46" y2="16" stroke="#F6EFDD" stroke-width="2"/>
      <circle cx="28" cy="34" r="6.5" fill="#F6EFDD"/>
      <path d="M28 29.5 L31 32 L30 36 L26 36 L25 32 Z" fill="#171310"/>
    </svg>`,
    seatSpec: {
      fixed: true,
      seats: [
        { color: 'home', label: 'Local', hex: 'var(--player-blue)' },
        { color: 'away', label: 'Visitante', hex: 'var(--player-red)' },
      ],
    },
    mount,
  });
})(window);
