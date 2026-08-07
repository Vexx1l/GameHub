(function (global) {
  const TatetiEngine = global.GameHub.TatetiEngine;
  const TatetiBot = global.GameHub.TatetiBot;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new TatetiEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:tateti', delay: 1800 });
    const online = config.online || null; // NetSession si es una partida online, si no null
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    const hasBots = !online && seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;

    // En online, cada dispositivo corre su propio engine pero sólo aplica una
    // jugada cuando llega confirmada por la red (ver netplay.js) — así todos
    // quedan sincronizados sin mandar el tablero entero por la red.
    if (online) {
      online.onAction((method, args) => {
        if (typeof engine[method] === 'function') engine[method](...args);
      });
    }

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Ta-Te-Ti</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="tt-speed">Velocidad bots</label>
            <input type="range" id="tt-speed" min="150" max="1600" step="50" value="${config.speed || 600}">
          </div>` : ''}
      </div>
      <div class="tateti-layout">
        <div class="panel tateti-main">
          <div class="turn-indicator" id="tt-turn"></div>
          <div class="tateti-board" id="tt-board" data-board-skin-target></div>
        </div>
        <div class="panel tateti-side">
          <h3>Puntajes</h3>
          <div id="tt-scores"></div>
          <div class="log" id="tt-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="tt-round-end" hidden>
        <div class="panel setup-card" id="tt-round-card"></div>
      </div>
    `;

    const turnEl = container.querySelector('#tt-turn');
    const boardEl = container.querySelector('#tt-board');
    const scoresEl = container.querySelector('#tt-scores');
    const logEl = container.querySelector('#tt-log');
    const speedInput = container.querySelector('#tt-speed');
    const roundEndOverlay = container.querySelector('#tt-round-end');
    const roundEndCard = container.querySelector('#tt-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function seatFor(id) { return seats.find((s) => s.id === id); }

    function renderScores() {
      scoresEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label} (${s.color.toUpperCase()})</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function renderTurn() {
      if (engine.over) { turnEl.innerHTML = ''; return; }
      const seat = seatFor(engine.turnSeatId);
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Le toca a <b>${seat.label}</b> (${seat.color.toUpperCase()}) ${seat.type === 'bot' ? '— Bot' : ''}`;
    }

    function renderBoard(winningLine) {
      boardEl.innerHTML = engine.board.map((v, i) => `
        <button type="button" class="tt-cell ${v ? `is-${v}` : ''} ${winningLine && winningLine.includes(i) ? 'is-win' : ''}"
          data-index="${i}" ${v || engine.over ? 'disabled' : ''}>${v ? (v === 'x' ? '✕' : '○') : ''}</button>
      `).join('');
      boardEl.querySelectorAll('.tt-cell').forEach((btn) => {
        btn.addEventListener('click', () => {
          const seat = seatFor(engine.turnSeatId);
          if (seat.type !== 'human') return;
          const index = Number(btn.dataset.index);
          if (online) {
            if (seat.id !== mySeatId) return; // no es tu asiento: no podés jugarlo
            online.submitAction('play', [seat.id, index]);
            return;
          }
          engine.play(seat.id, index);
        });
      });
    }

    function scheduleBotMove() {
      if (online) return; // sin bots en partidas online
      clearTimeout(botTimer);
      const seat = seatFor(engine.turnSeatId);
      if (seat.type !== 'bot') return;
      const delay = Number(speedInput ? speedInput.value : 600);
      botTimer = setTimeout(() => {
        if (destroyed || engine.over) return;
        const mark = engine.markFor(seat.id);
        const index = TatetiBot.chooseMove(engine.board, mark, seat.difficulty || 'normal');
        engine.play(seat.id, index);
      }, delay);
    }

    engine.bus.on('board-changed', () => { renderBoard(); });
    engine.bus.on('turn-changed', () => { renderTurn(); scheduleBotMove(); });

    engine.bus.on('round-ended', (result) => {
      clearTimeout(botTimer);
      renderScores();
      if (result.draw) {
        renderBoard();
        turnEl.textContent = '¡Empate!';
        log('Ronda terminada en empate.');
      } else {
        renderBoard(result.line);
        const winner = seatFor(result.winnerId);
        turnEl.innerHTML = `<span class="swatch" style="background:${winner.hex}"></span> ¡Ganó ${winner.label}!`;
        log(`¡Ganó ${winner.label} (${winner.color.toUpperCase()})!`);
        global.GameHub.Storage.recordResult('tateti', winner.type === 'human' ? 'human-win' : 'bot-win');
      }

      roundEndCard.innerHTML = `
        <h2>${result.draw ? '¡Empate!' : `¡Ganó ${seatFor(result.winnerId).label}!`}</h2>
        <div id="tt-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="tt-exit">Volver al hub</button>
          <button class="btn btn-primary" id="tt-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="tt-autoplay"></div>
      `;
      roundEndCard.querySelector('#tt-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]} rondas ganadas</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      // Alterna quién empieza la próxima ronda.
      const nextStarter = result.draw
        ? (engine.turnSeatId === engine.xSeat.id ? engine.oSeat.id : engine.xSeat.id)
        : (result.winnerId === engine.xSeat.id ? engine.oSeat.id : engine.xSeat.id);

      const startNext = () => {
        roundEndOverlay.hidden = true;
        engine.startRound(nextStarter);
        renderBoard();
        renderTurn();
        scheduleBotMove();
      };
      roundEndCard.querySelector('#tt-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#tt-next').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#tt-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNext); },
      });
      autoplay.arm(autoplayHost, startNext);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { clearTimeout(botTimer); autoplay.cancel(); config.onExit(); });

    renderScores();
    renderBoard();
    renderTurn();
    log(`— Ronda comenzada — le toca a ${seatFor(engine.turnSeatId).label} —`);
    scheduleBotMove();

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
    id: 'tateti',
    name: 'Ta-Te-Ti',
    tagline: 'El clásico tres en línea. Rápido, simple y siempre a mano para una revancha.',
    tag: 'MESA · 2 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8 V48 M36 8 V48 M8 20 H48 M8 36 H48" stroke="#F6EFDD" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M13 13 L27 27 M27 13 L13 27" stroke="#d9a441" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="41.5" cy="41.5" r="7" stroke="#c1443c" stroke-width="2.6"/>
    </svg>`,
    seatSpec: {
      fixed: true,
      seats: [
        { color: 'x', label: 'Jugador X', hex: 'var(--gold-500)' },
        { color: 'o', label: 'Jugador O', hex: 'var(--ember-500)' },
      ],
    },
    mount,
  });

  global.GameHub.Rules.registerRules('tateti', {
    title: 'Ta-Te-Ti',
    intro: '2 jugadores, tablero de 3x3.',
    bullets: [
      'Por turnos, cada jugador marca una casilla vacía con su símbolo (✕ u ○).',
      'Gana quien logre 3 de sus símbolos en línea: fila, columna o diagonal.',
      'Si se llenan las 9 casillas sin que nadie logre una línea, la ronda es empate.',
      'La ronda siguiente empieza el jugador que no empezó la anterior.',
    ],
  });
})(window);
