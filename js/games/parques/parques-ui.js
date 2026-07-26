(function (global) {
  const Board = global.GameHub.ParquesBoard;
  const ParquesEngine = global.GameHub.ParquesEngine;
  const ParquesBot = global.GameHub.ParquesBot;

  const PIP_LAYOUTS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };

  function diceFaceHTML(value) {
    const cells = Array(9).fill('<span></span>');
    (PIP_LAYOUTS[value] || []).forEach((i) => {
      cells[i] = '<span class="pip"></span>';
    });
    return `<div class="die-face">${cells.join('')}</div>`;
  }

  function buildCellTypeLookup() {
    const trackByCell = new Map();
    Board.GLOBAL_PATH.forEach(([r, c], idx) => trackByCell.set(`${r},${c}`, idx));

    const homeByCell = new Map();
    Board.COLORS.forEach((color) => {
      Board.HOME_COLUMNS[color].forEach(([r, c], i) => homeByCell.set(`${r},${c}`, { color, i }));
    });

    return { trackByCell, homeByCell };
  }

  function classifyCell(r, c, lookups) {
    if (r === 7 && c === 7) return { zone: 'center' };
    if (r <= 5 && c <= 5) return { zone: 'yard', color: 'red' };
    if (r <= 5 && c >= 9) return { zone: 'yard', color: 'green' };
    if (r >= 9 && c >= 9) return { zone: 'yard', color: 'yellow' };
    if (r >= 9 && c <= 5) return { zone: 'yard', color: 'blue' };

    const key = `${r},${c}`;
    if (lookups.homeByCell.has(key)) {
      const info = lookups.homeByCell.get(key);
      return { zone: 'home', color: info.color };
    }
    if (lookups.trackByCell.has(key)) {
      const idx = lookups.trackByCell.get(key);
      return { zone: 'track', safe: Board.SAFE_INDICES.has(idx) };
    }
    return { zone: 'void' };
  }

  function cellForStep(color, step) {
    if (step === -1) return null; // se resuelve aparte (slots de casa)
    if (step <= 50) return Board.GLOBAL_PATH[(Board.COLOR_META[color].startIndex + step) % 52];
    if (step <= 56) return Board.HOME_COLUMNS[color][step - 51];
    return Board.CENTER;
  }

  function mount(container, config) {
    const bus = new global.GameHub.EventBus();
    const seats = config.seats; // [{color,type,difficulty,label}]
    const engine = new ParquesEngine(seats);
    const lookups = buildCellTypeLookup();
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Parqués</h2>
        </div>
        <div class="speed-control">
          <label class="pill" for="pq-speed">Velocidad bots</label>
          <input type="range" id="pq-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
        </div>
      </div>
      <div class="parques-layout">
        <div class="panel parques-board-wrap">
          <div class="parques-board" id="pq-board"></div>
        </div>
        <div class="panel parques-side">
          <div class="turn-indicator" id="pq-turn"></div>
          <div class="dice-tray" id="pq-dice"></div>
          <button class="btn btn-primary" id="pq-roll">Tirar dados</button>
          <div class="move-list" id="pq-moves"></div>
          <div class="log" id="pq-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="pq-victory" hidden>
        <div class="panel setup-card" id="pq-victory-card"></div>
      </div>
    `;

    const boardEl = container.querySelector('#pq-board');
    const turnEl = container.querySelector('#pq-turn');
    const diceEl = container.querySelector('#pq-dice');
    const rollBtn = container.querySelector('#pq-roll');
    const movesEl = container.querySelector('#pq-moves');
    const logEl = container.querySelector('#pq-log');
    const speedInput = container.querySelector('#pq-speed');
    const victoryOverlay = container.querySelector('#pq-victory');
    const victoryCard = container.querySelector('#pq-victory-card');

    // --- Construcción de la cuadrícula (una sola vez) ---
    const cellEls = new Map();
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const info = classifyCell(r, c, lookups);
        const div = document.createElement('div');
        div.className = `pq-cell zone-${info.zone}` + (info.color ? ` color-${info.color}` : '') + (info.safe ? ' safe' : '');
        div.style.gridRow = String(r + 1);
        div.style.gridColumn = String(c + 1);
        if (info.safe) div.title = 'Casilla segura';
        boardEl.appendChild(div);
        cellEls.set(`${r},${c}`, div);
      }
    }
    // Slots de casa (se dibujan encima de la zona de casa correspondiente)
    Board.COLORS.forEach((color) => {
      Board.YARD_SLOTS[color].forEach(([r, c]) => {
        const el = cellEls.get(`${r},${c}`);
        el.classList.add('yard-slot');
      });
    });

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function seatByColor(color) {
      return seats.find((s) => s.color === color);
    }

    function renderTurnIndicator() {
      const seat = engine.currentSeat;
      turnEl.innerHTML = `
        <span class="swatch" style="background:${Board.COLOR_META[seat.color].hex}"></span>
        Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}
      `;
    }

    function renderDice(dice) {
      if (!dice) { diceEl.innerHTML = ''; return; }
      diceEl.innerHTML = dice.map(diceFaceHTML).join('');
    }

    function renderTokens() {
      // limpiar fichas previas
      cellEls.forEach((el) => {
        el.querySelectorAll('.token').forEach((t) => t.remove());
      });
      Board.COLORS.forEach((color) => {
        engine.tokens[color].forEach((step, idx) => {
          let cell;
          if (step === -1) {
            cell = Board.YARD_SLOTS[color][idx];
          } else {
            cell = cellForStep(color, step);
          }
          const el = cellEls.get(`${cell[0]},${cell[1]}`);
          if (!el) return;
          const tok = document.createElement('div');
          tok.className = 'token';
          tok.style.background = Board.COLOR_META[color].hex;
          tok.dataset.color = color;
          tok.dataset.index = String(idx);
          if (step === 57) tok.classList.add('is-home');
          el.appendChild(tok);
        });
      });
    }

    function clearMoves() { movesEl.innerHTML = ''; }

    function describeMove(m) {
      const originLabel = m.isExit ? 'Casa' : m.from;
      const captureLabel = m.isCapture ? ' · ¡Captura!' : '';
      const exitLabel = m.isExit ? ' · Sale de casa' : '';
      const dest = m.to === 57 ? 'Meta' : m.to;
      return `Ficha ${m.tokenIndex + 1}: ${originLabel} → ${dest}${exitLabel}${captureLabel}`;
    }

    function showHumanMoves(moves) {
      clearMoves();
      if (!moves.length) return;
      moves.forEach((m) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost move-btn' + (m.isCapture ? ' is-capture' : '');
        btn.textContent = describeMove(m);
        btn.addEventListener('click', () => {
          clearMoves();
          engine.applyMove(m);
        });
        movesEl.appendChild(btn);
      });
    }

    function scheduleBotRoll() {
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed) return;
        engine.rollDice();
      }, delay);
    }

    function handleTurnStart() {
      renderTurnIndicator();
      clearMoves();
      const seat = engine.currentSeat;
      if (seat.type === 'bot') {
        rollBtn.disabled = true;
        scheduleBotRoll();
      } else {
        rollBtn.disabled = false;
      }
    }

    bus.clear();
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('extra-turn', () => {
      log(`${engine.currentSeat.label} sacó doble: tira de nuevo.`);
      handleTurnStart();
    });
    engine.bus.on('dice-rolled', ({ color, dice, moves }) => {
      renderDice(dice);
      const seat = seatByColor(color);
      log(`${seat.label} tiró ${dice[0]} y ${dice[1]}.`);
      if (seat.type === 'bot') {
        rollBtn.disabled = true;
        if (moves.length) {
          const move = ParquesBot.chooseMove(engine, moves, seat.difficulty || 'normal');
          const delay = Number(speedInput.value);
          botTimer = setTimeout(() => {
            if (destroyed) return;
            engine.applyMove(move);
          }, delay);
        }
      } else {
        rollBtn.disabled = true;
        showHumanMoves(moves);
      }
    });
    engine.bus.on('no-moves', ({ color }) => {
      log(`${seatByColor(color).label} no tiene jugadas posibles.`);
    });
    engine.bus.on('move-applied', ({ move, capturedColor }) => {
      renderTokens();
      if (capturedColor) log(`¡${seatByColor(move.color).label} capturó una ficha de ${seatByColor(capturedColor).label}!`);
    });
    engine.bus.on('token-captured', () => { /* ya registrado en move-applied */ });
    engine.bus.on('color-finished', ({ color, place }) => {
      log(`${seatByColor(color).label} llevó todas sus fichas a la meta (puesto ${place}).`);
    });
    engine.bus.on('triple-double-penalty', ({ color }) => {
      log(`${seatByColor(color).label} sacó tres dobles seguidos: una ficha vuelve a casa.`);
    });
    engine.bus.on('game-won', ({ order }) => {
      rollBtn.disabled = true;
      const humanSeats = seats.filter((s) => s.type === 'human');
      const winnerIsHuman = humanSeats.some((s) => s.color === order[0]);
      global.GameHub.Storage.recordResult('parques', winnerIsHuman ? 'human-win' : 'bot-win');
      victoryCard.innerHTML = `
        <h2>¡Partida terminada!</h2>
        <p class="sub">Orden de llegada</p>
        ${order.map((c, i) => `
          <div class="seat-row">
            <span class="swatch" style="background:${Board.COLOR_META[c].hex}"></span>
            <span class="seat-name">${i + 1}. ${seatByColor(c).label}</span>
          </div>`).join('')}
        <div class="setup-actions">
          <button class="btn btn-ghost" id="pq-again">Jugar otra vez</button>
          <button class="btn btn-primary" id="pq-exit">Volver al hub</button>
        </div>
      `;
      victoryOverlay.hidden = false;
      victoryCard.querySelector('#pq-exit').addEventListener('click', () => config.onExit());
      victoryCard.querySelector('#pq-again').addEventListener('click', () => {
        victoryOverlay.hidden = true;
        instance.destroy();
        const next = mount(container, config);
        Object.assign(instance, next);
      });
    });

    rollBtn.addEventListener('click', () => {
      rollBtn.disabled = true;
      engine.rollDice();
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderTokens();
    handleTurnStart();

    const instance = {
      destroy() {
        destroyed = true;
        clearTimeout(botTimer);
        engine.bus.clear();
      },
    };
    return instance;
  }

  global.GameHub.registerGame({
    id: 'parques',
    name: 'Parqués',
    tagline: 'El clásico juego de mesa de tablero cruzado, dados y capturas.',
    tag: 'CLÁSICO · 2-4 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="48" height="48" rx="10" fill="#3B2A20"/>
      <rect x="10" y="10" width="16" height="16" rx="4" fill="var(--player-red)"/>
      <rect x="30" y="10" width="16" height="16" rx="4" fill="var(--player-green)"/>
      <rect x="10" y="30" width="16" height="16" rx="4" fill="var(--player-blue)"/>
      <rect x="30" y="30" width="16" height="16" rx="4" fill="var(--player-yellow)"/>
      <circle cx="28" cy="28" r="6" fill="#F6EFDD"/>
    </svg>`,
    seatSpec: {
      fixed: true,
      seats: Board.COLORS.map((color) => ({ color, label: Board.COLOR_META[color].label, hex: Board.COLOR_META[color].hex })),
    },
    mount,
  });
})(window);
