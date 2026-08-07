(function (global) {
  const NaipesEngine = global.GameHub.NaipesEngine;
  const NaipesBot = global.GameHub.NaipesBot;
  const H = global.GameHub.NaipesHelpers;

  function cardHTML(card, extraClass) {
    if (card.joker) {
      return `<div class="naipe-card is-joker ${extraClass || ''}"><span class="corner">JK</span><span class="center">★</span></div>`;
    }
    const label = H.rankLabel(card.rank);
    const red = H.RED_SUITS.includes(card.suit);
    return `<div class="naipe-card ${red ? 'is-red' : 'is-black'} ${extraClass || ''}">
      <span class="corner">${label}<br>${card.suit}</span>
      <span class="center">${card.suit}</span>
    </div>`;
  }

  function typeLabel(type) {
    return type === '4-4-3' ? '4-4-3 (dos cuartas + trío)' : '5-3-3 (escalera + dos tríos)';
  }

  function mount(container, config) {
    const seats = config.seats; // [{id,label,color,hex,type,difficulty}]
    const engine = new NaipesEngine(seats);
    const spectatorMode = seats.every((s) => s.type === 'bot');
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:naipes', delay: 3000 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
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
          <h2>Escalera y Trío</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${online ? '' : `<div class="speed-control">
          <label class="pill" for="na-speed">Velocidad bots</label>
          <input type="range" id="na-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
        </div>`}
      </div>
      <div class="naipes-layout">
        <div class="panel naipes-hands" id="na-hands"></div>
        <div class="panel naipes-table">
          <div class="table-row">
            <div class="pile-block">
              <span class="pile-label">Mazo</span>
              <div id="na-stock"></div>
            </div>
            <div class="pile-block">
              <span class="pile-label">Descarte</span>
              <div id="na-discard"></div>
            </div>
          </div>
          <div class="turn-indicator" id="na-turn"></div>
          <div class="action-area" id="na-actions"></div>
        </div>
        <div class="panel naipes-side">
          <h3>Puntajes</h3>
          <div id="na-scores"></div>
          <div class="log" id="na-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="na-type-overlay" hidden>
        <div class="panel setup-card" id="na-type-card"></div>
      </div>
      <div class="setup-overlay" id="na-round-end" hidden>
        <div class="panel setup-card" id="na-round-card"></div>
      </div>
    `;

    const handsEl = container.querySelector('#na-hands');
    const stockEl = container.querySelector('#na-stock');
    const discardEl = container.querySelector('#na-discard');
    const turnEl = container.querySelector('#na-turn');
    const actionsEl = container.querySelector('#na-actions');
    const scoresEl = container.querySelector('#na-scores');
    const logEl = container.querySelector('#na-log');
    const speedInput = container.querySelector('#na-speed');
    const typeOverlay = container.querySelector('#na-type-overlay');
    const typeCard = container.querySelector('#na-type-card');
    const roundEndOverlay = container.querySelector('#na-round-end');
    const roundEndCard = container.querySelector('#na-round-card');

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

    function renderPiles() {
      stockEl.innerHTML = `<div class="naipe-card tile-back"></div><span class="pile-count">${engine.stock.length}</span>`;
      const top = engine.topDiscard();
      discardEl.innerHTML = top ? cardHTML(top) : '<p class="empty-hint">Vacío</p>';
    }

    function renderHands() {
      handsEl.innerHTML = seats.map((s) => {
        const hand = engine.hands[s.id];
        const reveal = online ? (s.id === mySeatId || spectatorMode) : (s.type === 'human' || spectatorMode);
        const tilesHTML = reveal
          ? hand.map((c) => cardHTML(c, 'in-hand')).join('')
          : hand.map(() => '<div class="naipe-card tile-back"></div>').join('');
        const typeTag = engine.declaredType[s.id] ? `<span class="pill type-pill">${engine.declaredType[s.id]}</span>` : '';
        return `
          <div class="hand-block ${engine.currentSeat && engine.currentSeat.id === s.id ? 'is-active' : ''}">
            <div class="hand-label">
              <span class="swatch" style="background:${s.hex}"></span>${s.label}
              <span class="pill">${hand.length} cartas</span>${typeTag}
            </div>
            <div class="hand-cards">${tilesHTML}</div>
          </div>`;
      }).join('');
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function clearActions() { actionsEl.innerHTML = ''; }

    // ---------- Elección de combinación al inicio de ronda ----------
    function runTypeSelection() {
      if (online) {
        if (!mySeatId || engine.declaredType[mySeatId]) { typeOverlay.hidden = true; return; }
        let choice = '4-4-3';
        typeCard.innerHTML = `
          <h2>Elige tu combinación</h2>
          <p class="sub">Vas a armar tu mano de 10 cartas con este objetivo. Los demás eligen la suya al mismo tiempo, desde su dispositivo.</p>
          <div class="seat-toggle" id="na-my-type">
            <button data-type="4-4-3" class="active">4-4-3</button>
            <button data-type="5-3-3">5-3-3</button>
          </div>
          <div class="setup-actions">
            <button class="btn btn-primary" id="na-type-confirm">Confirmar</button>
          </div>
        `;
        const toggle = typeCard.querySelector('#na-my-type');
        toggle.querySelectorAll('button').forEach((btn) => {
          btn.addEventListener('click', () => {
            choice = btn.dataset.type;
            toggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
          });
        });
        typeOverlay.hidden = false;
        typeCard.querySelector('#na-type-confirm').addEventListener('click', () => {
          typeOverlay.hidden = true;
          online.submitAction('setDeclaredType', [mySeatId, choice]);
          log('Elegiste tu combinación — esperando a que el resto elija la suya.');
        });
        return;
      }
      const humanSeats = seats.filter((s) => s.type === 'human');
      seats.forEach((s) => {
        if (s.type === 'bot') {
          const type = NaipesBot.chooseType(engine.hands[s.id], s.difficulty || 'normal');
          engine.setDeclaredType(s.id, type);
        }
      });
      if (!humanSeats.length) return; // todo bot, ya quedó listo
      typeCard.innerHTML = `
        <h2>Elige tu combinación</h2>
        <p class="sub">Antes de empezar, cada jugador humano elige qué armará con sus 10 cartas iniciales.</p>
        <div id="na-type-rows"></div>
        <div class="setup-actions">
          <button class="btn btn-primary" id="na-type-confirm">Comenzar ronda</button>
        </div>
      `;
      const rowsEl = typeCard.querySelector('#na-type-rows');
      const choices = {};
      humanSeats.forEach((s) => { choices[s.id] = '4-4-3'; });
      function renderRows() {
        rowsEl.innerHTML = humanSeats.map((s) => `
          <div class="seat-row" data-id="${s.id}">
            <span class="swatch" style="background:${s.hex}"></span>
            <span class="seat-name">${s.label}</span>
            <div class="seat-toggle">
              <button data-type="4-4-3" class="${choices[s.id] === '4-4-3' ? 'active' : ''}">4-4-3</button>
              <button data-type="5-3-3" class="${choices[s.id] === '5-3-3' ? 'active' : ''}">5-3-3</button>
            </div>
          </div>`).join('');
        rowsEl.querySelectorAll('.seat-toggle button').forEach((btn) => {
          btn.addEventListener('click', () => {
            const row = btn.closest('.seat-row');
            choices[row.dataset.id] = btn.dataset.type;
            renderRows();
          });
        });
      }
      renderRows();
      typeOverlay.hidden = false;
      typeCard.querySelector('#na-type-confirm').addEventListener('click', () => {
        typeOverlay.hidden = true;
        humanSeats.forEach((s) => engine.setDeclaredType(s.id, choices[s.id]));
      });
    }

    // ---------- Turno humano ----------
    function showHumanTurn() {
      clearActions();
      const seatId = engine.currentSeat.id;
      if (engine.phase === 'drawing') {
        const top = engine.topDiscard();
        const box = document.createElement('div');
        box.className = 'draw-choices';
        const stockBtn = document.createElement('button');
        stockBtn.className = 'btn btn-primary';
        stockBtn.textContent = `Robar del mazo (${engine.stock.length})`;
        stockBtn.disabled = !engine.canDrawFromStock();
        stockBtn.addEventListener('click', () => {
          if (online) { online.submitAction('drawFromStock', [seatId]); return; }
          engine.drawFromStock(seatId);
          renderPiles();
          renderHands();
          showHumanTurn();
        });
        box.appendChild(stockBtn);
        if (top) {
          const discardBtn = document.createElement('button');
          discardBtn.className = 'btn btn-ghost';
          discardBtn.innerHTML = `Tomar descarte ${cardHTML(top)}`;
          discardBtn.addEventListener('click', () => {
            if (online) { online.submitAction('drawFromDiscard', [seatId]); return; }
            engine.drawFromDiscard(seatId);
            renderPiles();
            renderHands();
            showHumanTurn();
          });
          box.appendChild(discardBtn);
        }
        actionsEl.appendChild(box);
        return;
      }
      if (engine.phase === 'holding11') {
        const groups = engine.checkWin(seatId);
        const hint = document.createElement('p');
        hint.className = 'empty-hint';
        hint.textContent = `Elige una carta para descartar (tu combinación: ${typeLabel(engine.declaredType[seatId])}).`;
        actionsEl.appendChild(hint);

        if (groups) {
          const winBtn = document.createElement('button');
          winBtn.className = 'btn btn-primary win-btn';
          winBtn.textContent = '¡Cerrar mano y ganar la ronda!';
          winBtn.addEventListener('click', () => {
            clearActions();
            if (online) online.submitAction('declareWin', [seatId, groups]);
            else engine.declareWin(seatId, groups);
          });
          actionsEl.appendChild(winBtn);
        }

        const handRow = document.createElement('div');
        handRow.className = 'discard-choice-row';
        engine.hands[seatId].forEach((card) => {
          const wrapper = document.createElement('button');
          wrapper.className = 'card-btn';
          wrapper.innerHTML = cardHTML(card);
          wrapper.addEventListener('click', () => {
            clearActions();
            if (online) online.submitAction('discardCard', [seatId, card]);
            else engine.discardCard(seatId, card);
          });
          handRow.appendChild(wrapper);
        });
        actionsEl.appendChild(handRow);
      }
    }

    // ---------- Turno bot ----------
    function scheduleBotDraw() {
      if (online) return;
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const seatId = seat.id;
        const type = engine.declaredType[seatId];
        const top = engine.topDiscard();
        const takeDiscard = NaipesBot.wantsDiscard(engine.hands[seatId], top, type, seat.difficulty || 'normal');
        if (takeDiscard) {
          engine.drawFromDiscard(seatId);
        } else if (engine.canDrawFromStock()) {
          engine.drawFromStock(seatId);
        } else {
          engine.drawFromDiscard(seatId);
        }
        renderPiles();
        renderHands();
        scheduleBotDiscard();
      }, delay);
    }

    function scheduleBotDiscard() {
      if (online) return;
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const seatId = seat.id;
        const groups = engine.checkWin(seatId);
        if (groups) {
          engine.declareWin(seatId, groups);
          return;
        }
        const type = engine.declaredType[seatId];
        const card = NaipesBot.chooseDiscard(engine.hands[seatId], type, seat.difficulty || 'normal');
        engine.discardCard(seatId, card);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderHands();
      clearActions();
      if (engine.roundOver) return;
      const seat = engine.currentSeat;
      if (online) {
        if (seat.id === mySeatId) {
          showHumanTurn();
        } else {
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = `Esperando a ${seat.label}…`;
          actionsEl.appendChild(hint);
        }
        return;
      }
      if (seat.type === 'bot') {
        scheduleBotDraw();
      } else {
        showHumanTurn();
      }
    }

    engine.bus.on('round-started', () => {
      renderPiles();
      renderHands();
      renderScores();
      turnEl.innerHTML = '';
      clearActions();
      log(`— Ronda ${engine.round} repartida —`);
      runTypeSelection();
    });
    engine.bus.on('type-chosen', ({ seatId, type }) => {
      log(`${seatById(seatId).label} eligió jugar ${typeLabel(type)}.`);
      renderHands();
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('drew-card', ({ seatId, source }) => {
      log(`${seatById(seatId).label} robó ${source === 'stock' ? 'del mazo' : 'del descarte'}.`);
      renderPiles();
      renderHands();
      const isMine = online ? seatId === mySeatId : seatById(seatId).type === 'human';
      if (isMine) showHumanTurn();
    });
    engine.bus.on('discarded', ({ seatId, card }) => {
      const label = card.joker ? 'un comodín' : `${H.rankLabel(card.rank)}${card.suit}`;
      log(`${seatById(seatId).label} descartó ${label}.`);
      renderPiles();
      renderHands();
    });
    engine.bus.on('stock-reshuffled', () => log('El mazo se acabó — se volvió a barajar el descarte.'));
    engine.bus.on('round-ended', ({ winnerId, type, pointsWon, scores }) => {
      renderScores();
      renderPiles();
      renderHands();
      turnEl.innerHTML = '';
      clearActions();
      const winnerLabel = seatById(winnerId).label;
      log(`¡${winnerLabel} cerró su mano (${typeLabel(type)}) y ganó la ronda! (+${pointsWon} puntos)`);

      const humanWon = seatById(winnerId).type === 'human';
      global.GameHub.Storage.recordResult('naipes', humanWon ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">${winnerLabel} cerró con ${typeLabel(type)} · +${pointsWon} puntos</p>
        <div id="na-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="na-exit">Volver al hub</button>
          <button class="btn btn-primary" id="na-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="na-autoplay"></div>
      `;
      roundEndCard.querySelector('#na-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${scores[s.id]} pts</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNextRound = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
      };
      roundEndCard.querySelector('#na-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#na-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#na-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderScores();
    renderPiles();
    renderHands();
    log(`— Ronda ${engine.round} repartida —`);
    runTypeSelection();

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
    id: 'naipes',
    name: 'Escalera y Trío',
    tagline: 'Baraja doble + comodines: arma un 4-4-3 o un 5-3-3 antes que nadie.',
    tag: 'BARAJA · 4 A 8 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="26" height="36" rx="4" fill="#F6EFDD" stroke="#2b1c12" stroke-opacity="0.3" transform="rotate(-8 19 28)"/>
      <rect x="22" y="10" width="26" height="36" rx="4" fill="#F6EFDD" stroke="#2b1c12" stroke-opacity="0.3" transform="rotate(6 35 28)"/>
      <text x="28" y="34" font-size="16" font-weight="700" fill="var(--ember-500)" text-anchor="middle" font-family="Georgia, serif">♥</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [4, 5, 6, 7, 8] },
    mount,
  });
})(window);
