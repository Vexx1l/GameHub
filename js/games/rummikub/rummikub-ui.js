(function (global) {
  const Engine = global.GameHub.RummikubEngine;
  const Bot = global.GameHub.RummikubBot;

  function tileHTML(tile, extraClass) {
    if (tile.color === 'comodin') {
      return `<div class="rk-tile is-comodin ${extraClass || ''}"><span class="rk-star">★</span></div>`;
    }
    return `<div class="rk-tile is-${tile.color} ${extraClass || ''}"><span>${tile.number}</span></div>`;
  }

  function mount(container, config) {
    const seats = config.seats;
    const engine = new Engine(seats);
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    const spectatorMode = online ? !mySeatId : seats.every((s) => s.type === 'bot');
    let selected = new Set();
    let extendMode = false;
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
          <h2>Rummikub</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${online ? '' : `<div class="speed-control">
          <label class="pill" for="rk-speed">Velocidad bots</label>
          <input type="range" id="rk-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
        </div>`}
      </div>
      <div class="rk-layout">
        <div class="panel rk-board-panel">
          <div class="rk-board-head">
            <span>Mesa</span>
            <span class="pill" id="rk-pool-count"></span>
          </div>
          <div class="rk-board" id="rk-board"></div>
        </div>
        <div class="panel rk-side">
          <div class="turn-indicator" id="rk-turn"></div>
          <div id="rk-hands-summary"></div>
          <div class="log" id="rk-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="panel rk-hand-panel">
        <div class="rk-hand-head">
          <span id="rk-hand-label">Tu mano</span>
          <span class="pill" id="rk-meld-pill"></span>
        </div>
        <div class="rk-hand" id="rk-hand"></div>
        <div class="rk-actions" id="rk-actions"></div>
      </div>
      <div class="setup-overlay" id="rk-round-end" hidden>
        <div class="panel setup-card" id="rk-round-card"></div>
      </div>
    `;

    const boardEl = container.querySelector('#rk-board');
    const poolCountEl = container.querySelector('#rk-pool-count');
    const turnEl = container.querySelector('#rk-turn');
    const handsSummaryEl = container.querySelector('#rk-hands-summary');
    const logEl = container.querySelector('#rk-log');
    const handLabelEl = container.querySelector('#rk-hand-label');
    const meldPillEl = container.querySelector('#rk-meld-pill');
    const handEl = container.querySelector('#rk-hand');
    const actionsEl = container.querySelector('#rk-actions');
    const speedInput = container.querySelector('#rk-speed');
    const roundEndOverlay = container.querySelector('#rk-round-end');
    const roundEndCard = container.querySelector('#rk-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function seatById(id) { return seats.find((s) => s.id === id); }

    function humanSeat() {
      return online ? seats.find((s) => s.id === mySeatId) : seats.find((s) => s.type === 'human');
    }

    function renderBoard() {
      poolCountEl.textContent = `Pozo: ${engine.pool.length}`;
      if (!engine.board.length) {
        boardEl.innerHTML = '<p class="empty-hint">Todavía no hay conjuntos en la mesa.</p>';
        return;
      }
      boardEl.innerHTML = engine.board.map((set, idx) => `
        <div class="rk-set" data-index="${idx}">
          ${set.tiles.map((t) => tileHTML(t)).join('')}
        </div>
      `).join('');

      if (extendMode) {
        boardEl.querySelectorAll('.rk-set').forEach((el) => {
          el.classList.add('is-targetable');
          el.addEventListener('click', () => {
            const idx = Number(el.dataset.index);
            const [uid] = Array.from(selected);
            const seatId = humanSeat().id;
            selected.clear();
            extendMode = false;
            if (online) {
              if (seatId !== mySeatId) return;
              online.submitAction('extendSet', [seatId, idx, uid]);
              renderAll();
              return;
            }
            const result = engine.extendSet(seatId, idx, uid);
            if (!result.ok) log(`⚠ ${result.error}`);
            renderAll();
          });
        });
      }
    }

    function renderHandsSummary() {
      handsSummaryEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.hands[s.id].length} fichas</span>
          ${engine.hasMelded[s.id] ? '<span class="pill is-good">Habilitado</span>' : ''}
        </div>`).join('');
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function renderHand() {
      const human = humanSeat();
      const isHumanTurn = human && engine.currentSeat && engine.currentSeat.id === human.id && !engine.roundOver;

      if (!human || spectatorMode) {
        handLabelEl.textContent = 'Modo espectador';
        handEl.innerHTML = seats.map((s) => `
          <div class="rk-spectator-hand">
            <span class="seat-name">${s.label}</span>
            <div class="rk-hand-tiles">${engine.hands[s.id].map((t) => tileHTML(t)).join('')}</div>
          </div>`).join('');
        meldPillEl.textContent = '';
        actionsEl.innerHTML = '';
        return;
      }

      handLabelEl.textContent = 'Tu mano';
      meldPillEl.textContent = engine.hasMelded[human.id]
        ? 'Ya jugaste tu inicial'
        : `Inicial: ${engine.turnMeldValue}/30 pts`;

      const hand = engine.hands[human.id].slice().sort((a, b) => {
        if (a.color === b.color) return (a.number || 0) - (b.number || 0);
        return a.color.localeCompare(b.color);
      });

      handEl.innerHTML = hand.map((t) => {
        const isSel = selected.has(t.uid);
        return `<button class="rk-tile-btn" data-uid="${t.uid}" ${isHumanTurn ? '' : 'disabled'}>${tileHTML(t, isSel ? 'is-selected' : '')}</button>`;
      }).join('');

      handEl.querySelectorAll('.rk-tile-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          if (extendMode) {
            selected = new Set([uid]);
            renderHand();
            return;
          }
          if (selected.has(uid)) selected.delete(uid); else selected.add(uid);
          renderHand();
        });
      });

      renderActions(isHumanTurn, human);
    }

    function renderActions(isHumanTurn, human) {
      if (!isHumanTurn) {
        if (online && engine.currentSeat && !engine.roundOver) {
          actionsEl.innerHTML = `<p class="empty-hint">Esperando a ${engine.currentSeat.label}…</p>`;
        } else {
          actionsEl.innerHTML = '';
        }
        return;
      }
      const parts = [];
      parts.push(`<button class="btn btn-primary" id="rk-play-btn" ${selected.size >= 3 ? '' : 'disabled'}>Jugar selección como conjunto nuevo</button>`);
      if (engine.hasMelded[human.id]) {
        parts.push(`<button class="btn btn-ghost" id="rk-extend-btn" ${selected.size === 1 ? '' : 'disabled'}>${extendMode ? 'Elige un conjunto de la mesa…' : 'Agregar ficha a un conjunto de la mesa'}</button>`);
      }
      parts.push(`<button class="btn btn-ghost" id="rk-end-btn" ${engine.turnPlayedAny ? '' : 'disabled'}>Terminar turno</button>`);
      parts.push(`<button class="btn btn-ghost" id="rk-draw-btn">Robar ficha (${engine.pool.length})</button>`);
      actionsEl.innerHTML = `<p class="empty-hint">Selecciona fichas de tu mano para armar un grupo (mismo número, colores distintos) o una escalera (mismo color, consecutivas).</p>${parts.join('')}`;

      const playBtn = actionsEl.querySelector('#rk-play-btn');
      if (playBtn) playBtn.addEventListener('click', () => {
        const uids = Array.from(selected);
        selected.clear();
        if (online) {
          if (human.id !== mySeatId) return;
          online.submitAction('playNewSet', [human.id, uids]);
          renderAll();
          return;
        }
        const result = engine.playNewSet(human.id, uids);
        if (!result.ok) log(`⚠ ${result.error}`);
        renderAll();
      });
      const extendBtn = actionsEl.querySelector('#rk-extend-btn');
      if (extendBtn) extendBtn.addEventListener('click', () => {
        extendMode = true;
        renderAll();
      });
      const endBtn = actionsEl.querySelector('#rk-end-btn');
      if (endBtn) endBtn.addEventListener('click', () => {
        if (online) {
          if (human.id !== mySeatId) return;
          online.submitAction('endTurn', [human.id]);
          return;
        }
        engine.endTurn(human.id);
      });
      const drawBtn = actionsEl.querySelector('#rk-draw-btn');
      if (drawBtn) drawBtn.addEventListener('click', () => {
        if (online) {
          if (human.id !== mySeatId) return;
          online.submitAction('drawTile', [human.id]);
          return;
        }
        engine.drawTile(human.id);
      });
    }

    function scheduleBotTurn() {
      if (online) return;
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const action = Bot.chooseAction(engine, seat.id);
        if (!action) {
          engine.drawTile(seat.id);
          return;
        }
        if (action.type === 'play') engine.playNewSet(seat.id, action.uids);
        else if (action.type === 'extend') engine.extendSet(seat.id, action.setIndex, action.uid);
        if (!engine.roundOver) scheduleBotTurn();
      }, delay);
    }

    function renderAll() {
      renderTurn();
      renderHandsSummary();
      renderBoard();
      renderHand();
    }

    function handleTurnStart() {
      selected.clear();
      extendMode = false;
      renderAll();
      if (engine.roundOver) return;
      if (engine.currentSeat.type === 'bot') scheduleBotTurn();
    }

    engine.bus.on('set-played', ({ seatId, melded }) => {
      log(`${seatById(seatId).label} jugó un conjunto nuevo en la mesa.${melded ? ' ¡Completó su jugada inicial!' : ''}`);
      renderAll();
    });
    engine.bus.on('set-extended', ({ seatId }) => {
      log(`${seatById(seatId).label} agregó una ficha a un conjunto de la mesa.`);
      renderAll();
    });
    engine.bus.on('tile-drawn', ({ seatId }) => {
      log(`${seatById(seatId).label} robó una ficha del pozo.`);
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ winnerId, reason, remaining }) => {
      renderAll();
      actionsEl.innerHTML = '';
      const winnerLabel = seatById(winnerId).label;
      const reasonMsg = reason === 'hand-empty'
        ? `¡${winnerLabel} se quedó sin fichas!`
        : `Se acabó el pozo — gana ${winnerLabel} con menos fichas en mano.`;
      log(reasonMsg);

      const humanWon = seatById(winnerId).type === 'human';
      global.GameHub.Storage.recordResult('rummikub', humanWon ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">${reasonMsg}</p>
        <div id="rk-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="rk-exit">Volver al hub</button>
          <button class="btn btn-primary" id="rk-next">Jugar otra ronda</button>
        </div>
      `;
      roundEndCard.querySelector('#rk-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${remaining[s.id]} pts en mano</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;
      roundEndCard.querySelector('#rk-exit').addEventListener('click', () => config.onExit());
      roundEndCard.querySelector('#rk-next').addEventListener('click', () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
      });
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    log(`— Ronda ${engine.round} repartida —`);
    handleTurnStart();

    return {
      destroy() {
        destroyed = true;
        clearTimeout(botTimer);
        engine.bus.clear();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'rummikub',
    name: 'Rummikub',
    tagline: 'Forma grupos y escaleras con fichas numeradas antes que los demás. Cuidado con los comodines.',
    tag: 'FICHAS · 2 A 4 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="12" height="24" rx="3" fill="#f6efdd" stroke="#2b1c12" stroke-opacity="0.4"/>
      <text x="14" y="32" font-size="12" font-weight="800" fill="#c1443c" text-anchor="middle" font-family="Georgia, serif">7</text>
      <rect x="22" y="16" width="12" height="24" rx="3" fill="#f6efdd" stroke="#2b1c12" stroke-opacity="0.4"/>
      <text x="28" y="32" font-size="12" font-weight="800" fill="#3e6fb0" text-anchor="middle" font-family="Georgia, serif">8</text>
      <rect x="36" y="16" width="12" height="24" rx="3" fill="#f6efdd" stroke="#2b1c12" stroke-opacity="0.4"/>
      <text x="42" y="32" font-size="12" font-weight="800" fill="#2b1c12" text-anchor="middle" font-family="Georgia, serif">9</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [2, 3, 4] },
    mount,
  });
})(window);
