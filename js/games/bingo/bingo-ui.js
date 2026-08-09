(function (global) {
  const BingoEngine = global.GameHub.BingoEngine;
  const H = global.GameHub.BingoHelpers;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new BingoEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:bingo', delay: 3000 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    // Bingo no tiene "turnos": cualquier jugador sentado puede cantar la
    // próxima bola. En online, sólo el anfitrión corre el modo automático
    // (si cada dispositivo programara su propio timer, cantarían varias
    // bolas de más por intervalo); el resto puede cantar manualmente.
    const canAct = online ? !!mySeatId : true;
    const canAutoDrive = online ? online.isHost : true;
    const hasHuman = seats.some((s) => s.type === 'human');
    let autoBallTimer = null;
    let autoBallOn = online ? false : !hasHuman; // sin humanos (modo espectador), canta solo
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
          <h2>Bingo</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        <div class="speed-control">
          <label class="pill" for="bg-speed">Velocidad</label>
          <input type="range" id="bg-speed" min="150" max="2200" step="50" value="${config.speed || 900}">
        </div>
      </div>
      <div class="bingo-layout">
        <div class="panel bingo-main">
          <div class="bingo-caller">
            <div class="bingo-last" id="bg-last">—</div>
            <div class="bingo-drawn" id="bg-drawn"></div>
          </div>
          <div class="bingo-actions" id="bg-actions"></div>
        </div>
        <div class="panel bingo-side">
          <h3>Tabla acumulada</h3>
          <div id="bg-scores"></div>
          <div class="log" id="bg-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="bingo-cards" id="bg-cards"></div>
      <div class="setup-overlay" id="bg-round-end" hidden>
        <div class="panel setup-card" id="bg-round-card"></div>
      </div>
    `;

    const lastEl = container.querySelector('#bg-last');
    const drawnEl = container.querySelector('#bg-drawn');
    const actionsEl = container.querySelector('#bg-actions');
    const scoresEl = container.querySelector('#bg-scores');
    const logEl = container.querySelector('#bg-log');
    const speedInput = container.querySelector('#bg-speed');
    const cardsEl = container.querySelector('#bg-cards');
    const roundEndOverlay = container.querySelector('#bg-round-end');
    const roundEndCard = container.querySelector('#bg-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function seatById(id) { return seats.find((s) => s.id === id); }
    function letterFor(n) {
      const idx = H.COLUMN_RANGES.findIndex(([a, b]) => n >= a && n <= b);
      return H.COLUMN_LETTERS[idx];
    }

    function renderScores() {
      scoresEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function renderCaller() {
      const last = engine.drawn[engine.drawn.length - 1];
      lastEl.innerHTML = last ? `<span class="bg-letter">${letterFor(last)}</span><span class="bg-number">${last}</span>` : '<span class="bg-empty">Sin bolas cantadas</span>';
      drawnEl.innerHTML = engine.drawn.slice().reverse().slice(1, 25).map((n) => `<span class="bg-chip">${letterFor(n)}${n}</span>`).join('');
    }

    function isMyCard(seatId) {
      return online ? seatId === mySeatId : seatById(seatId).type === 'human';
    }

    function tryMark(seatId, r, c) {
      if (online) { online.submitAction('markCell', [seatId, r, c]); return; }
      const ok = engine.markCell(seatId, r, c);
      if (!ok) flashMiss(seatId, r, c);
    }

    function flashMiss(seatId, r, c) {
      const cell = cardsEl.querySelector(`.bingo-card[data-seat="${seatId}"] .bg-cell[data-r="${r}"][data-c="${c}"]`);
      if (!cell) return;
      cell.classList.add('is-miss-flash');
      setTimeout(() => cell.classList.remove('is-miss-flash'), 350);
    }

    function renderCards() {
      cardsEl.innerHTML = seats.map((s) => {
        const grid = engine.cards[s.id];
        const marks = engine.marks[s.id];
        const wonLine = engine.lineWinnerId === s.id;
        const wonBingo = engine.bingoWinnerId === s.id;
        const clickable = !engine.roundOver && isMyCard(s.id);
        return `
        <div class="panel bingo-card ${wonBingo ? 'bg-card-won' : ''}" data-seat="${s.id}">
          <div class="bingo-card-head">
            <span class="swatch" style="background:${s.hex}"></span>
            <span class="seat-name">${s.label}${clickable ? ' (tu cartón — tocá el número al escucharlo)' : ''}</span>
            ${wonLine ? '<span class="pill bg-line-pill">Línea ✓</span>' : ''}
          </div>
          <div class="bingo-headers">${H.COLUMN_LETTERS.map((l) => `<span>${l}</span>`).join('')}</div>
          <div class="bingo-grid">
            ${grid.map((row, r) => row.map((val, c) => {
              const marked = marks[r][c];
              const isFree = val === 'FREE';
              const canClick = clickable && !marked && !isFree;
              return `<span class="bg-cell ${marked ? 'is-marked' : ''} ${isFree ? 'is-free' : ''} ${canClick ? 'is-clickable' : ''}" data-r="${r}" data-c="${c}" ${canClick ? 'role="button" tabindex="0"' : ''}>${isFree ? '★' : val}</span>`;
            }).join('')).join('')}
          </div>
        </div>`;
      }).join('');

      cardsEl.querySelectorAll('.bg-cell.is-clickable').forEach((cell) => {
        const card = cell.closest('.bingo-card');
        const seatId = card.dataset.seat;
        const r = Number(cell.dataset.r);
        const c = Number(cell.dataset.c);
        const handler = () => tryMark(seatId, r, c);
        cell.addEventListener('click', handler);
        cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
      });
    }

    function renderActions() {
      actionsEl.innerHTML = '';
      if (engine.roundOver) return;
      if (canAct) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = 'Cantar bola';
        btn.disabled = autoBallOn;
        btn.addEventListener('click', drawStep);
        actionsEl.appendChild(btn);

        if (canAutoDrive) {
          const label = document.createElement('label');
          label.className = 'autoplay-toggle';
          label.innerHTML = `<input type="checkbox" ${autoBallOn ? 'checked' : ''}> <span>Cantar automáticamente</span>`;
          label.querySelector('input').addEventListener('change', (e) => {
            autoBallOn = e.target.checked;
            renderActions();
            if (autoBallOn) scheduleAutoBall();
            else clearTimeout(autoBallTimer);
          });
          actionsEl.appendChild(label);
        } else if (online) {
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = 'El modo automático lo controla el anfitrión de la sala.';
          actionsEl.appendChild(hint);
        }
      } else {
        const hint = document.createElement('p');
        hint.className = 'empty-hint';
        hint.textContent = 'Modo espectador — cantando bolas automáticamente…';
        actionsEl.appendChild(hint);
      }
    }

    function drawStep() {
      if (engine.roundOver) return;
      if (online) { online.submitAction('drawNext', []); return; }
      engine.drawNext();
    }

    function scheduleAutoBall() {
      clearTimeout(autoBallTimer);
      if (!autoBallOn || engine.roundOver) return;
      const delay = Number(speedInput.value);
      autoBallTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        drawStep();
        scheduleAutoBall();
      }, delay);
    }

    engine.bus.on('ball-drawn', ({ number, drawnCount }) => {
      log(`Bola cantada: ${letterFor(number)}${number} (#${drawnCount})`);
      renderCaller();
      renderCards();
    });
    engine.bus.on('cell-marked', ({ seatId, value }) => {
      log(`${seatById(seatId).label} marcó el ${value} en su cartón.`);
      renderCards();
    });
    engine.bus.on('line-completed', ({ seatId }) => {
      log(`¡Línea de ${seatById(seatId).label}! +10 pts`);
      renderCards();
    });
    engine.bus.on('round-ended', ({ winnerId, matchScores, scores, drawnCount }) => {
      clearTimeout(autoBallTimer);
      renderScores();
      renderCards();
      actionsEl.innerHTML = '';

      const winnerLabel = winnerId ? seatById(winnerId).label : null;
      log(winnerId ? `¡BINGO de ${winnerLabel}! (bola #${drawnCount})` : 'Se agotaron las bolas sin un cartón lleno.');

      global.GameHub.Storage.recordResult('bingo', winnerId && seatById(winnerId).type === 'human' ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>${winnerId ? `¡Bingo de ${winnerLabel}!` : 'Ronda sin ganador'}</h2>
        <p class="sub">${winnerId ? `Cartón lleno en la bola número ${drawnCount}` : 'Se agotaron las 75 bolas'}</p>
        <div id="bg-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="bg-exit">Volver al hub</button>
          <button class="btn btn-primary" id="bg-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="bg-autoplay"></div>
      `;
      roundEndCard.querySelector('#bg-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${matchScores[s.id]} pts (acum. ${scores[s.id]})</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNextRound = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
        renderScores();
        renderCaller();
        renderCards();
        renderActions();
        if (autoBallOn) scheduleAutoBall();
      };
      roundEndCard.querySelector('#bg-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#bg-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#bg-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { clearTimeout(autoBallTimer); autoplay.cancel(); config.onExit(); });

    renderScores();
    renderCaller();
    renderCards();
    renderActions();
    log(`— Ronda ${engine.round} comenzada —`);
    if (autoBallOn) scheduleAutoBall();

    return {
      destroy() {
        destroyed = true;
        clearTimeout(autoBallTimer);
        autoplay.cancel();
        engine.bus.clear();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'bingo',
    name: 'Bingo',
    tagline: 'El clásico Bingo de 75 bolas: completa una línea o el cartón entero antes que nadie.',
    tag: 'CLÁSICO · 1 A 8 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="40" height="36" rx="6" fill="#F6EFDD" stroke="var(--wood-500)" stroke-width="2"/>
      <circle cx="17" cy="20" r="3" fill="var(--ember-500)"/>
      <circle cx="28" cy="20" r="3" fill="#171310"/>
      <circle cx="39" cy="20" r="3" fill="#171310"/>
      <circle cx="17" cy="30" r="3" fill="#171310"/>
      <circle cx="28" cy="30" r="3" fill="var(--gold-500)"/>
      <circle cx="39" cy="30" r="3" fill="#171310"/>
      <circle cx="17" cy="40" r="3" fill="#171310"/>
      <circle cx="28" cy="40" r="3" fill="#171310"/>
      <circle cx="39" cy="40" r="3" fill="var(--ember-500)"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6, 7, 8] },
    mount,
  });
})(window);
