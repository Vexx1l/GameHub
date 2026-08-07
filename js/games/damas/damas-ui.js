(function (global) {
  const DamasEngine = global.GameHub.DamasEngine;
  const DamasBot = global.GameHub.DamasBot;
  const SIZE = global.GameHub.DamasHelpers.SIZE;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new DamasEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:damas', delay: 2000 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    const hasBots = !online && seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;
    let selected = null; // [r,c] pieza humana seleccionada

    if (online) {
      online.onAction((method, args) => {
        if (typeof engine[method] === 'function') engine[method](...args);
      });
    }

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Damas</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="dm-speed">Velocidad bots</label>
            <input type="range" id="dm-speed" min="150" max="1600" step="50" value="${config.speed || 700}">
          </div>` : ''}
      </div>
      <div class="dm-layout">
        <div class="panel dm-main">
          <div class="turn-indicator" id="dm-turn"></div>
          <div class="dm-board" id="dm-board"></div>
        </div>
        <div class="panel dm-side">
          <h3>Puntajes</h3>
          <div id="dm-scores"></div>
          <div class="dm-piece-count" id="dm-count"></div>
          <div class="log" id="dm-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="dm-round-end" hidden>
        <div class="panel setup-card" id="dm-round-card"></div>
      </div>
    `;

    const turnEl = container.querySelector('#dm-turn');
    const boardEl = container.querySelector('#dm-board');
    const scoresEl = container.querySelector('#dm-scores');
    const countEl = container.querySelector('#dm-count');
    const logEl = container.querySelector('#dm-log');
    const speedInput = container.querySelector('#dm-speed');
    const roundEndOverlay = container.querySelector('#dm-round-end');
    const roundEndCard = container.querySelector('#dm-round-card');

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

    function renderCount() {
      const w = engine.countPieces('blancas');
      const b = engine.countPieces('negras');
      countEl.textContent = `Fichas en tablero — Blancas: ${w} · Negras: ${b}`;
    }

    function renderTurn() {
      if (engine.over) { turnEl.innerHTML = ''; return; }
      const seat = seatFor(engine.turnSeatId);
      const chaining = engine.chainFrom ? ' — ¡debe seguir capturando!' : '';
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Le toca a <b>${seat.label}</b> ${seat.type === 'bot' ? '— Bot' : ''}${chaining}`;
    }

    function renderBoard(highlightCaptured) {
      const selectable = new Set(engine.over ? [] : engine.selectablePieces().map(([r, c]) => `${r}-${c}`));
      const destinations = selected ? engine.destinationsFor(selected[0], selected[1]) : [];
      const destSet = new Set(destinations.map((d) => `${d.to[0]}-${d.to[1]}`));

      let html = '';
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const dark = (r + c) % 2 === 1;
          const piece = engine.board[r][c];
          const isSelected = selected && selected[0] === r && selected[1] === c;
          const isSelectable = selectable.has(`${r}-${c}`);
          const isDest = destSet.has(`${r}-${c}`);
          let cellHtml = '';
          if (piece) {
            cellHtml = `<span class="dm-piece is-${piece.color} ${piece.king ? 'is-king' : ''}"></span>`;
          }
          html += `<button type="button" class="dm-square ${dark ? 'is-dark' : 'is-light'} ${isSelected ? 'is-selected' : ''} ${isSelectable && !isDest ? 'is-selectable' : ''} ${isDest ? 'is-dest' : ''}"
            data-r="${r}" data-c="${c}" ${dark ? '' : 'disabled tabindex="-1"'}>${cellHtml}</button>`;
        }
      }
      boardEl.innerHTML = html;

      boardEl.querySelectorAll('.dm-square.is-dark').forEach((btn) => {
        btn.addEventListener('click', () => handleSquareClick(Number(btn.dataset.r), Number(btn.dataset.c)));
      });
    }

    function handleSquareClick(r, c) {
      const seat = seatFor(engine.turnSeatId);
      if (seat.type !== 'human' || engine.over) return;
      if (online && seat.id !== mySeatId) return; // no es tu turno en esta sala

      if (selected) {
        const dests = engine.destinationsFor(selected[0], selected[1]);
        const dest = dests.find((d) => d.to[0] === r && d.to[1] === c);
        if (dest) {
          const from = selected;
          if (online) {
            online.submitAction('move', [seat.id, from, [r, c]]);
            return; // esperamos a que la jugada vuelva confirmada por la red
          }
          engine.move(seat.id, from, [r, c]);
          selected = engine.chainFrom ? [r, c] : null;
          return;
        }
      }
      const piece = engine.board[r][c];
      const selectableIds = new Set(engine.selectablePieces().map(([rr, cc]) => `${rr}-${cc}`));
      if (piece && piece.color === engine.colorFor(engine.turnSeatId) && selectableIds.has(`${r}-${c}`) && !engine.chainFrom) {
        selected = [r, c];
      } else if (!engine.chainFrom) {
        selected = null;
      }
      renderBoard();
    }

    function playBotChain(seat, moveObj, stepIndex) {
      if (destroyed || engine.over) return;
      if (stepIndex >= moveObj.path.length - 1) return;
      const from = moveObj.path[stepIndex];
      const to = moveObj.path[stepIndex + 1];
      engine.move(seat.id, from, to);
      if (!engine.over && engine.chainFrom && stepIndex + 2 < moveObj.path.length) {
        const delay = Math.max(200, Number(speedInput ? speedInput.value : 700) / 2);
        botTimer = setTimeout(() => playBotChain(seat, moveObj, stepIndex + 1), delay);
      }
    }

    function scheduleBotMove() {
      if (online) return; // sin bots en partidas online
      clearTimeout(botTimer);
      const seat = seatFor(engine.turnSeatId);
      if (seat.type !== 'bot') return;
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.over) return;
        const color = engine.colorFor(seat.id);
        const moveObj = DamasBot.chooseMove(engine.board, color, seat.difficulty || 'normal');
        if (!moveObj) return;
        playBotChain(seat, moveObj, 0);
      }, delay);
    }

    engine.bus.on('board-changed', () => { renderBoard(); renderCount(); });
    engine.bus.on('chain-continues', (payload) => { selected = (payload && payload.at) || null; renderTurn(); renderBoard(); scheduleBotMove(); });
    engine.bus.on('turn-changed', () => { selected = null; renderTurn(); renderBoard(); scheduleBotMove(); });

    engine.bus.on('round-ended', (result) => {
      clearTimeout(botTimer);
      selected = null;
      renderScores();
      renderBoard();
      renderCount();
      const winner = seatFor(result.winnerId);
      turnEl.innerHTML = `<span class="swatch" style="background:${winner.hex}"></span> ¡Ganó ${winner.label}!`;
      log(`¡Ganó ${winner.label}!`);
      global.GameHub.Storage.recordResult('damas', winner.type === 'human' ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>¡Ganó ${winner.label}!</h2>
        <div id="dm-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="dm-exit">Volver al hub</button>
          <button class="btn btn-primary" id="dm-next">Jugar otra partida</button>
        </div>
        <div class="autoplay-row" id="dm-autoplay"></div>
      `;
      roundEndCard.querySelector('#dm-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]} partidas ganadas</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const nextStarter = result.winnerId === engine.whiteSeat.id ? engine.blackSeat.id : engine.whiteSeat.id;
      const startNext = () => {
        roundEndOverlay.hidden = true;
        engine.startRound(nextStarter);
        renderBoard();
        renderTurn();
        renderCount();
        scheduleBotMove();
      };
      roundEndCard.querySelector('#dm-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#dm-next').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#dm-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar partidas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNext); },
      });
      autoplay.arm(autoplayHost, startNext);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { clearTimeout(botTimer); autoplay.cancel(); config.onExit(); });

    renderScores();
    renderBoard();
    renderTurn();
    renderCount();
    log(`— Partida comenzada — le toca a ${seatFor(engine.turnSeatId).label} —`);
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
    id: 'damas',
    name: 'Damas',
    tagline: 'El clásico juego de tablero: captura obligatoria, cadenas de saltos y coronación. Tú contra un rival o un bot.',
    tag: 'MESA · 2 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="44" height="44" rx="4" fill="#4a3220"/>
      <rect x="6" y="6" width="11" height="11" fill="#2b1c12"/>
      <rect x="28" y="6" width="11" height="11" fill="#2b1c12"/>
      <rect x="17" y="17" width="11" height="11" fill="#2b1c12"/>
      <rect x="39" y="17" width="11" height="11" fill="#2b1c12"/>
      <rect x="6" y="28" width="11" height="11" fill="#2b1c12"/>
      <rect x="28" y="28" width="11" height="11" fill="#2b1c12"/>
      <rect x="17" y="39" width="11" height="11" fill="#2b1c12"/>
      <rect x="39" y="39" width="11" height="11" fill="#2b1c12"/>
      <circle cx="11.5" cy="11.5" r="4" fill="#F6EFDD"/>
      <circle cx="33.5" cy="11.5" r="4" fill="#F6EFDD"/>
      <circle cx="22.5" cy="44.5" r="4" fill="#c1443c"/>
      <circle cx="44.5" cy="44.5" r="4" fill="#c1443c"/>
    </svg>`,
    seatSpec: {
      fixed: true,
      seats: [
        { color: 'blancas', label: 'Jugador Blancas', hex: '#f6efdd' },
        { color: 'negras', label: 'Jugador Negras', hex: '#2b1c12' },
      ],
    },
    mount,
  });

  global.GameHub.Rules.registerRules('damas', {
    title: 'Damas',
    intro: '2 jugadores, tablero de 8x8 (solo casillas oscuras).',
    bullets: [
      'Las fichas se mueven una casilla en diagonal hacia adelante; para capturar pueden saltar en cualquier diagonal (adelante o atrás).',
      'Si podés capturar, es obligatorio hacerlo — no podés hacer un movimiento simple ese turno.',
      'Si tras un salto la misma ficha puede volver a capturar, tenés que seguir encadenando saltos con ella.',
      'Al llegar a la última fila del rival, tu ficha se corona dama y se mueve en cualquier dirección.',
      'Ganás si tu rival se queda sin fichas o sin movimientos posibles.',
    ],
  });
})(window);
