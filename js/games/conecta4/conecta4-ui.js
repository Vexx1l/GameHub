(function (global) {
  const Conecta4Engine = global.GameHub.Conecta4Engine;
  const Conecta4Bot = global.GameHub.Conecta4Bot;
  const { ROWS, COLS } = global.GameHub.Conecta4Helpers;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new Conecta4Engine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:conecta4', delay: 1800 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    const hasBots = !online && seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;

    if (online) {
      online.onAction((method, args) => {
        if (typeof engine[method] === 'function') engine[method](...args);
      });
    }

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Conecta 4</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="c4-speed">Velocidad bots</label>
            <input type="range" id="c4-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
          </div>` : ''}
      </div>
      <div class="c4-layout">
        <div class="panel c4-main">
          <div class="turn-indicator" id="c4-turn"></div>
          <div class="c4-cols" id="c4-cols"></div>
          <div class="c4-board" id="c4-board"></div>
        </div>
        <div class="panel c4-side">
          <h3>Puntajes</h3>
          <div id="c4-scores"></div>
          <div class="log" id="c4-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="c4-round-end" hidden>
        <div class="panel setup-card" id="c4-round-card"></div>
      </div>
    `;

    const turnEl = container.querySelector('#c4-turn');
    const colsEl = container.querySelector('#c4-cols');
    const boardEl = container.querySelector('#c4-board');
    const scoresEl = container.querySelector('#c4-scores');
    const logEl = container.querySelector('#c4-log');
    const speedInput = container.querySelector('#c4-speed');
    const roundEndOverlay = container.querySelector('#c4-round-end');
    const roundEndCard = container.querySelector('#c4-round-card');

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
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function renderTurn() {
      if (engine.over) { turnEl.innerHTML = ''; return; }
      const seat = seatFor(engine.turnSeatId);
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Le toca a <b>${seat.label}</b> ${seat.type === 'bot' ? '— Bot' : ''}`;
    }

    function renderColumnButtons() {
      const valid = engine.validColumns();
      colsEl.innerHTML = Array.from({ length: COLS }, (_, c) => `
        <button type="button" class="c4-col-btn" data-col="${c}" ${!valid.includes(c) || engine.over ? 'disabled' : ''} aria-label="Soltar en columna ${c + 1}">▼</button>
      `).join('');
      colsEl.querySelectorAll('.c4-col-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const seat = seatFor(engine.turnSeatId);
          if (seat.type !== 'human') return;
          const col = Number(btn.dataset.col);
          if (online) {
            if (seat.id !== mySeatId) return;
            online.submitAction('drop', [seat.id, col]);
            return;
          }
          engine.drop(seat.id, col);
        });
      });
    }

    function renderBoard(winCells) {
      const winSet = new Set((winCells || []).map(([r, c]) => `${r}-${c}`));
      let html = '';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = engine.board[r][c];
          const cls = v === 'r' ? 'is-red' : v === 'y' ? 'is-yellow' : 'is-empty';
          const win = winSet.has(`${r}-${c}`) ? 'is-win' : '';
          html += `<div class="c4-cell ${cls} ${win}"><span class="c4-disc"></span></div>`;
        }
      }
      boardEl.innerHTML = html;
    }

    function scheduleBotMove() {
      if (online) return;
      clearTimeout(botTimer);
      const seat = seatFor(engine.turnSeatId);
      if (seat.type !== 'bot') return;
      const delay = Number(speedInput ? speedInput.value : 650);
      botTimer = setTimeout(() => {
        if (destroyed || engine.over) return;
        const mark = engine.markFor(seat.id);
        const col = Conecta4Bot.chooseColumn(engine.board, mark, seat.difficulty || 'normal');
        engine.drop(seat.id, col);
      }, delay);
    }

    engine.bus.on('board-changed', () => { renderBoard(); renderColumnButtons(); });
    engine.bus.on('turn-changed', () => { renderTurn(); renderColumnButtons(); scheduleBotMove(); });

    engine.bus.on('round-ended', (result) => {
      clearTimeout(botTimer);
      renderScores();
      renderColumnButtons();
      if (result.draw) {
        renderBoard();
        turnEl.textContent = '¡Empate! El tablero se llenó.';
        log('Ronda terminada en empate.');
      } else {
        renderBoard(result.cells);
        const winner = seatFor(result.winnerId);
        turnEl.innerHTML = `<span class="swatch" style="background:${winner.hex}"></span> ¡Ganó ${winner.label}!`;
        log(`¡Ganó ${winner.label}!`);
        global.GameHub.Storage.recordResult('conecta4', winner.type === 'human' ? 'human-win' : 'bot-win');
      }

      roundEndCard.innerHTML = `
        <h2>${result.draw ? '¡Empate!' : `¡Ganó ${seatFor(result.winnerId).label}!`}</h2>
        <div id="c4-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="c4-exit">Volver al hub</button>
          <button class="btn btn-primary" id="c4-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="c4-autoplay"></div>
      `;
      roundEndCard.querySelector('#c4-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]} rondas ganadas</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const nextStarter = engine.turnSeatId === engine.redSeat.id ? engine.yellowSeat.id : engine.redSeat.id;
      const startNext = () => {
        roundEndOverlay.hidden = true;
        engine.startRound(nextStarter);
        renderBoard();
        renderTurn();
        renderColumnButtons();
        scheduleBotMove();
      };
      roundEndCard.querySelector('#c4-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#c4-next').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#c4-autoplay');
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
    renderColumnButtons();
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
    id: 'conecta4',
    name: 'Conecta 4',
    tagline: 'Deja caer tus fichas y arma 4 en línea antes que tu rival — horizontal, vertical o en diagonal.',
    tag: 'MESA · 2 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="44" height="36" rx="6" fill="#3e6fb0"/>
      <circle cx="16" cy="20" r="5" fill="#0d1f16"/>
      <circle cx="28" cy="20" r="5" fill="#d64545"/>
      <circle cx="40" cy="20" r="5" fill="#e0b93d"/>
      <circle cx="16" cy="32" r="5" fill="#e0b93d"/>
      <circle cx="28" cy="32" r="5" fill="#d64545"/>
      <circle cx="40" cy="32" r="5" fill="#0d1f16"/>
    </svg>`,
    seatSpec: {
      fixed: true,
      seats: [
        { color: 'rojo', label: 'Jugador Rojo', hex: 'var(--player-red)' },
        { color: 'amarillo', label: 'Jugador Amarillo', hex: 'var(--player-yellow)' },
      ],
    },
    mount,
  });

  global.GameHub.Rules.registerRules('conecta4', {
    title: 'Conecta 4',
    intro: '2 jugadores, tablero de 7 columnas x 6 filas.',
    bullets: [
      'Por turnos, cada jugador suelta una ficha en una columna; cae hasta el fondo o hasta la ficha más baja disponible.',
      'Gana quien logre 4 fichas propias en línea: horizontal, vertical o diagonal.',
      'Si se llena el tablero sin que nadie logre 4 en línea, la ronda es empate.',
    ],
  });
})(window);
