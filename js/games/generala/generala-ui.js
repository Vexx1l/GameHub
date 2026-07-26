(function (global) {
  const GeneralaEngine = global.GameHub.GeneralaEngine;
  const GeneralaBot = global.GameHub.GeneralaBot;
  const H = global.GameHub.GeneralaHelpers;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new GeneralaEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:generala', delay: 3000 });
    const hasBots = seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Generala</h2>
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="ge-speed">Velocidad bots</label>
            <input type="range" id="ge-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
          </div>` : ''}
      </div>
      <div class="generala-layout">
        <div class="panel generala-main">
          <div class="turn-indicator" id="ge-turn"></div>
          <div class="generala-dice" id="ge-dice"></div>
          <div class="generala-actions" id="ge-actions"></div>
          <div class="generala-categories" id="ge-categories"></div>
        </div>
        <div class="panel generala-side">
          <h3>Tabla de la partida</h3>
          <div class="generala-table-wrap"><table id="ge-table"></table></div>
          <h3>Acumulado histórico</h3>
          <div id="ge-scores"></div>
          <div class="log" id="ge-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="ge-round-end" hidden>
        <div class="panel setup-card" id="ge-round-card"></div>
      </div>
    `;

    const turnEl = container.querySelector('#ge-turn');
    const diceEl = container.querySelector('#ge-dice');
    const actionsEl = container.querySelector('#ge-actions');
    const categoriesEl = container.querySelector('#ge-categories');
    const tableEl = container.querySelector('#ge-table');
    const scoresEl = container.querySelector('#ge-scores');
    const logEl = container.querySelector('#ge-log');
    const speedInput = container.querySelector('#ge-speed');
    const roundEndOverlay = container.querySelector('#ge-round-end');
    const roundEndCard = container.querySelector('#ge-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function seatById(id) { return seats.find((s) => s.id === id); }

    function renderScores() {
      scoresEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function renderTable() {
      const header = `<tr><th></th>${seats.map((s) => `<th><span class="swatch" style="background:${s.hex}"></span></th>`).join('')}</tr>`;
      const rows = H.CATEGORIES.map((cat) => {
        const cells = seats.map((s) => {
          const val = engine.usedCategories[s.id][cat.id];
          return `<td>${val === undefined ? '—' : val}</td>`;
        }).join('');
        return `<tr><th>${cat.label}</th>${cells}</tr>`;
      }).join('');
      const totals = `<tr class="totals-row"><th>Total</th>${seats.map((s) => `<td>${engine.matchScores[s.id]}</td>`).join('')}</tr>`;
      tableEl.innerHTML = header + rows + totals;
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function renderDice() {
      const seat = engine.currentSeat;
      const canHold = !engine.roundOver && seat.type === 'human' && engine.phase === 'rolling' && engine.rollCount > 0 && engine.rollsLeft > 0;
      diceEl.innerHTML = engine.dice.map((v, i) => {
        const held = engine.held[i];
        return `<button class="die ${held ? 'is-held' : ''}" data-idx="${i}" ${canHold ? '' : 'disabled'}>${engine.rollCount > 0 ? v : '?'}</button>`;
      }).join('');
      if (canHold) {
        diceEl.querySelectorAll('.die').forEach((btn) => {
          btn.addEventListener('click', () => engine.toggleHold(seat.id, Number(btn.dataset.idx)));
        });
      }
    }

    function renderActions() {
      actionsEl.innerHTML = '';
      if (engine.roundOver) return;
      const seat = engine.currentSeat;
      if (seat.type !== 'human' || engine.phase !== 'rolling') return;
      if (engine.rollsLeft > 0) {
        const rollBtn = document.createElement('button');
        rollBtn.className = 'btn btn-primary';
        rollBtn.textContent = engine.rollCount === 0 ? 'Tirar dados' : `Tirar de nuevo (${engine.rollsLeft} tiradas)`;
        rollBtn.addEventListener('click', () => engine.roll(seat.id));
        actionsEl.appendChild(rollBtn);
      }
      if (engine.rollCount > 0 && engine.rollsLeft > 0) {
        const stopBtn = document.createElement('button');
        stopBtn.className = 'btn btn-ghost';
        stopBtn.textContent = 'Plantarse y anotar';
        stopBtn.addEventListener('click', () => engine.stopRolling(seat.id));
        actionsEl.appendChild(stopBtn);
      }
    }

    function renderCategoryChoices() {
      categoriesEl.innerHTML = '';
      if (engine.roundOver || engine.phase !== 'choosing-category') return;
      const seat = engine.currentSeat;
      if (seat.type !== 'human') {
        const hint = document.createElement('p');
        hint.className = 'empty-hint';
        hint.textContent = `${seat.label} está eligiendo dónde anotar…`;
        categoriesEl.appendChild(hint);
        return;
      }
      const hint = document.createElement('p');
      hint.className = 'empty-hint';
      hint.textContent = 'Elige dónde anotar tu resultado:';
      categoriesEl.appendChild(hint);
      const grid = document.createElement('div');
      grid.className = 'category-choice-grid';
      const open = H.CATEGORIES.filter((c) => engine.usedCategories[seat.id][c.id] === undefined);
      open.forEach((cat) => {
        const servida = cat.id === 'generala' && engine.rollCount === 1;
        const preview = H.computeScore(cat.id, engine.dice, servida);
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost category-btn';
        btn.innerHTML = `<span>${cat.label}${servida && preview === 100 ? ' ★' : ''}</span><span class="mono">${preview} pts</span>`;
        btn.addEventListener('click', () => engine.scoreCategory(seat.id, cat.id));
        grid.appendChild(btn);
      });
      categoriesEl.appendChild(grid);
    }

    function scheduleBotRollStep() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        engine.roll(seat.id);
        if (engine.phase !== 'rolling') { scheduleBotCategoryStep(); return; }
        const mask = GeneralaBot.chooseHoldMask(engine.dice, seat.difficulty || 'normal');
        mask.forEach((hold, i) => { if (hold !== engine.held[i]) engine.toggleHold(seat.id, i); });
        if (mask.every(Boolean)) {
          // El bot decide plantarse antes de agotar las 3 tiradas (ya tiene full/póker/generala).
          // Hay que avisarle al engine con stopRolling() para que pase a fase
          // 'choosing-category'; si no, el engine se queda en fase 'rolling' y
          // el siguiente scoreCategory() es rechazado en silencio -> la partida
          // se congela a mitad de turno.
          engine.stopRolling(seat.id);
          scheduleBotCategoryStep();
          return;
        }
        scheduleBotRollStep();
      }, delay);
    }

    function scheduleBotCategoryStep() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const open = engine.openCategories(seat.id);
        const catId = GeneralaBot.chooseCategory(engine.dice, open, seat.difficulty || 'normal', H.computeScore);
        engine.scoreCategory(seat.id, catId);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderDice();
      renderActions();
      renderCategoryChoices();
      renderTable();
      if (engine.roundOver) return;
      if (engine.currentSeat.type === 'bot') scheduleBotRollStep();
    }

    engine.bus.on('rolled', ({ seatId, dice }) => {
      log(`${seatById(seatId).label} tiró: ${dice.join(', ')}`);
      renderDice();
      renderActions();
      renderCategoryChoices();
    });
    engine.bus.on('held-changed', renderDice);
    engine.bus.on('stopped-rolling', () => { renderActions(); renderCategoryChoices(); });
    engine.bus.on('scored', ({ seatId, categoryId, value, servida }) => {
      const cat = H.CATEGORIES.find((c) => c.id === categoryId);
      log(`${seatById(seatId).label} anotó ${value} pts en "${cat.label}"${servida ? ' — ¡Generala servida!' : ''}`);
      renderTable();
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ winners, matchScores, scores }) => {
      renderTable();
      renderScores();
      turnEl.innerHTML = '';
      diceEl.innerHTML = '';
      actionsEl.innerHTML = '';
      categoriesEl.innerHTML = '';

      const winnerLabels = winners.map((id) => seatById(id).label).join(' y ');
      const tie = winners.length > 1;
      log(`¡Partida terminada! Gan${tie ? 'aron' : 'ó'} ${winnerLabels} con ${matchScores[winners[0]]} puntos.`);

      const someHumanWon = winners.some((id) => seatById(id).type === 'human');
      global.GameHub.Storage.recordResult('generala', someHumanWon ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>Partida terminada</h2>
        <p class="sub">Gan${tie ? 'aron' : 'ó'} ${winnerLabels} con ${matchScores[winners[0]]} puntos</p>
        <div id="ge-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="ge-exit">Volver al hub</button>
          <button class="btn btn-primary" id="ge-next">Jugar otra partida</button>
        </div>
        <div class="autoplay-row" id="ge-autoplay"></div>
      `;
      roundEndCard.querySelector('#ge-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${matchScores[s.id]} pts (acum. ${scores[s.id]})</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNextRound = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
      };
      roundEndCard.querySelector('#ge-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#ge-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#ge-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar partidas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderScores();
    renderTable();
    log(`— Partida ${engine.round} comenzada —`);
    handleTurnStart();

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
    id: 'generala',
    name: 'Generala',
    tagline: 'Tira los 5 dados hasta 3 veces y arma escaleras, fulles, pókeres y la Generala antes que nadie.',
    tag: 'DADOS · 1 A 8 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="20" height="20" rx="5" fill="#F6EFDD" transform="rotate(-12 16 34)"/>
      <rect x="26" y="10" width="22" height="22" rx="5" fill="#F6EFDD" transform="rotate(8 37 21)"/>
      <circle cx="14" cy="32" r="2.4" fill="#2b1c12"/>
      <circle cx="20" cy="38" r="2.4" fill="#2b1c12"/>
      <circle cx="33" cy="16" r="2.4" fill="var(--ember-500)"/>
      <circle cx="41" cy="16" r="2.4" fill="var(--ember-500)"/>
      <circle cx="33" cy="24" r="2.4" fill="var(--ember-500)"/>
      <circle cx="41" cy="24" r="2.4" fill="var(--ember-500)"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6, 7, 8] },
    mount,
  });
})(window);
