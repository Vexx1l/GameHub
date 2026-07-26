(function (global) {
  const BlackjackEngine = global.GameHub.BlackjackEngine;
  const BlackjackBot = global.GameHub.BlackjackBot;
  const H = global.GameHub.BlackjackHelpers;
  const CHIP_VALUES = [10, 25, 50, 100, 200];
  const OUTCOME_LABEL = {
    blackjack: '¡Blackjack! Paga 3 a 2', gana: 'Gana', pierde: 'Pierde', push: 'Empate (push)', bust: 'Se pasó de 21', 'sin-ficha': 'Sin fichas — no jugó',
  };

  function cardHtml(card, hidden) {
    if (hidden) return '<span class="bj-card bj-hidden">🂠</span>';
    const red = card.suit === '♥' || card.suit === '♦';
    return `<span class="bj-card ${red ? 'bj-red' : ''}">${card.rank}${card.suit}</span>`;
  }

  function mount(container, config) {
    const seats = config.seats;
    const engine = new BlackjackEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:blackjack', delay: 2600 });
    const hasBots = seats.some((s) => s.type === 'bot');
    let selectedChip = 25;
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Blackjack (21)</h2>
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="bj-speed">Velocidad bots</label>
            <input type="range" id="bj-speed" min="150" max="1600" step="50" value="${config.speed || 700}">
          </div>` : ''}
      </div>
      <div class="blackjack-layout">
        <div class="panel bj-dealer">
          <h3>Banca</h3>
          <div class="bj-hand" id="bj-dealer-hand"></div>
          <div class="bj-total" id="bj-dealer-total"></div>
        </div>
        <div class="bj-seats" id="bj-seats"></div>
        <div class="panel bj-controls">
          <div class="bj-phase-msg" id="bj-phase-msg"></div>
          <div class="bj-bet-controls" id="bj-bet-controls"></div>
          <div class="bj-play-controls" id="bj-play-controls"></div>
        </div>
      </div>
      <div class="setup-overlay" id="bj-round-end" hidden>
        <div class="panel setup-card" id="bj-round-card"></div>
      </div>
    `;

    const dealerHandEl = container.querySelector('#bj-dealer-hand');
    const dealerTotalEl = container.querySelector('#bj-dealer-total');
    const seatsEl = container.querySelector('#bj-seats');
    const phaseMsgEl = container.querySelector('#bj-phase-msg');
    const betControlsEl = container.querySelector('#bj-bet-controls');
    const playControlsEl = container.querySelector('#bj-play-controls');
    const speedInput = container.querySelector('#bj-speed');
    const roundEndOverlay = container.querySelector('#bj-round-end');
    const roundEndCard = container.querySelector('#bj-round-card');

    function renderDealer(revealAll) {
      const hand = engine.dealerHand;
      if (!hand.length) { dealerHandEl.innerHTML = ''; dealerTotalEl.textContent = ''; return; }
      const showAll = revealAll || engine.phase === 'dealer' || engine.roundOver;
      dealerHandEl.innerHTML = hand.map((c, i) => cardHtml(c, !showAll && i === 1)).join('');
      dealerTotalEl.textContent = showAll ? `Total: ${H.handValue(hand).total}` : `Muestra: ${H.cardValue(hand[0])}`;
    }

    function renderSeats() {
      seatsEl.innerHTML = seats.map((s) => {
        const hand = engine.hands[s.id] || [];
        const status = engine.status[s.id];
        const bet = engine.bets[s.id];
        const isTurn = !engine.roundOver && engine.phase === 'playing' && engine.currentSeat && engine.currentSeat.id === s.id;
        const total = hand.length ? H.handValue(hand).total : null;
        return `
        <div class="panel bj-seat ${isTurn ? 'is-turn' : ''} ${status === 'bust' ? 'is-bust' : ''} ${status === 'blackjack' ? 'is-blackjack' : ''}">
          <div class="bj-seat-head">
            <span class="swatch" style="background:${s.hex}"></span>
            <span class="seat-name">${s.label}</span>
            <span class="mono bj-balance">${engine.balances[s.id]} fichas</span>
          </div>
          <div class="bj-hand">${hand.map((c) => cardHtml(c, false)).join('') || '<span class="empty-hint">Sin cartas todavía</span>'}</div>
          <div class="bj-seat-footer">
            ${total !== null ? `<span class="pill">Total: ${total}</span>` : ''}
            ${bet !== undefined ? `<span class="pill">Apuesta: ${bet}</span>` : ''}
            ${status === 'bust' ? '<span class="pill bj-bad">Se pasó</span>' : ''}
            ${status === 'blackjack' ? '<span class="pill bj-good">¡Blackjack!</span>' : ''}
            ${status === 'stand' ? '<span class="pill">Plantado</span>' : ''}
          </div>
        </div>`;
      }).join('');
    }

    function renderBetControls() {
      betControlsEl.innerHTML = '';
      playControlsEl.innerHTML = '';
      if (engine.roundOver || engine.phase !== 'betting') return;
      const seat = engine.currentSeat;
      phaseMsgEl.textContent = `${seat.label} está apostando…`;
      if (seat.type !== 'human') return;

      if (engine.balances[seat.id] <= 0) {
        betControlsEl.innerHTML = '<p class="empty-hint">Sin fichas.</p>';
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-ghost';
        resetBtn.textContent = 'Reponer fichas (1000)';
        resetBtn.addEventListener('click', () => { engine.resetBalance(seat.id); renderSeats(); renderBetControls(); });
        betControlsEl.appendChild(resetBtn);
        return;
      }

      let current = Math.min(selectedChip, engine.balances[seat.id]);
      const wrap = document.createElement('div');
      wrap.className = 'bj-chip-row';
      wrap.innerHTML = `
        ${CHIP_VALUES.map((v) => `<button class="bj-chip ${v === selectedChip ? 'active' : ''}" data-value="${v}">${v}</button>`).join('')}
        <span class="mono bj-current-bet">Apuesta: <b id="bj-current-bet">${current}</b></span>
        <button class="btn btn-primary" id="bj-confirm-bet">Apostar</button>
      `;
      betControlsEl.appendChild(wrap);
      wrap.querySelectorAll('.bj-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedChip = Number(btn.dataset.value);
          current = Math.min(selectedChip, engine.balances[seat.id]);
          wrap.querySelectorAll('.bj-chip').forEach((b) => b.classList.toggle('active', Number(b.dataset.value) === selectedChip));
          wrap.querySelector('#bj-current-bet').textContent = current;
        });
      });
      wrap.querySelector('#bj-confirm-bet').addEventListener('click', () => engine.placeBet(seat.id, current));
    }

    function renderPlayControls() {
      betControlsEl.innerHTML = '';
      playControlsEl.innerHTML = '';
      if (engine.roundOver || engine.phase !== 'playing') return;
      const seat = engine.currentSeat;
      phaseMsgEl.textContent = `Turno de ${seat.label}${seat.type === 'bot' ? ' (Bot)' : ''}`;
      if (seat.type !== 'human') return;

      const hitBtn = document.createElement('button');
      hitBtn.className = 'btn btn-primary';
      hitBtn.textContent = 'Pedir carta';
      hitBtn.addEventListener('click', () => engine.hit(seat.id));
      playControlsEl.appendChild(hitBtn);

      const standBtn = document.createElement('button');
      standBtn.className = 'btn btn-ghost';
      standBtn.textContent = 'Plantarse';
      standBtn.addEventListener('click', () => engine.stand(seat.id));
      playControlsEl.appendChild(standBtn);

      if (engine.hands[seat.id].length === 2 && engine.balances[seat.id] >= engine.bets[seat.id] * 2) {
        const doubleBtn = document.createElement('button');
        doubleBtn.className = 'btn btn-ghost';
        doubleBtn.textContent = 'Doblar';
        doubleBtn.addEventListener('click', () => engine.double(seat.id));
        playControlsEl.appendChild(doubleBtn);
      }
    }

    function renderControls() {
      if (engine.phase === 'betting') renderBetControls();
      else if (engine.phase === 'playing') renderPlayControls();
      else { betControlsEl.innerHTML = ''; playControlsEl.innerHTML = ''; phaseMsgEl.textContent = 'La banca está jugando…'; }
    }

    function scheduleBotStep() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        if (engine.phase === 'betting') {
          const seat = engine.currentSeat;
          const bet = BlackjackBot.chooseBet(seat.difficulty || 'normal', engine.balances[seat.id]);
          engine.placeBet(seat.id, bet);
        } else if (engine.phase === 'playing') {
          const seat = engine.currentSeat;
          const canDouble = engine.hands[seat.id].length === 2 && engine.balances[seat.id] >= engine.bets[seat.id] * 2;
          const action = BlackjackBot.chooseAction(engine.hands[seat.id], engine.dealerHand[0], seat.difficulty || 'normal', canDouble);
          if (action === 'hit') engine.hit(seat.id);
          else if (action === 'double') engine.double(seat.id);
          else engine.stand(seat.id);
        }
      }, delay);
    }

    function handleTurnChanged() {
      renderDealer(false);
      renderSeats();
      renderControls();
      if (engine.roundOver) return;
      const actor = engine.phase === 'betting' || engine.phase === 'playing' ? engine.currentSeat : null;
      if (actor && actor.type === 'bot') scheduleBotStep();
    }

    engine.bus.on('turn-changed', handleTurnChanged);
    engine.bus.on('bet-placed', () => { renderSeats(); });
    engine.bus.on('dealt', () => { renderDealer(false); renderSeats(); });
    engine.bus.on('hand-changed', ({ seatId }) => {
      renderSeats();
      // Un hit que no termina el turno (sigue "active") no dispara 'turn-changed',
      // así que hay que re-agendar la siguiente decisión del bot manualmente.
      if (!engine.roundOver && engine.phase === 'playing' && engine.currentSeat.id === seatId && engine.currentSeat.type === 'bot' && engine.status[seatId] === 'active') {
        scheduleBotStep();
      }
    });
    engine.bus.on('dealer-turn', () => {
      phaseMsgEl.textContent = 'La banca está jugando…';
      betControlsEl.innerHTML = '';
      playControlsEl.innerHTML = '';
      renderDealer(true);
    });
    engine.bus.on('round-ended', ({ dealerTotal, dealerBust, dealerBJ, results, balances }) => {
      clearTimeout(botTimer);
      renderDealer(true);
      renderSeats();
      phaseMsgEl.textContent = '';
      betControlsEl.innerHTML = '';
      playControlsEl.innerHTML = '';

      const humanWon = seats.some((s) => s.type === 'human' && results[s.id] && results[s.id].net > 0);
      global.GameHub.Storage.recordResult('blackjack', humanWon ? 'human-win' : 'bot-win');

      const rowsHtml = seats.map((s) => {
        const r = results[s.id];
        return `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${OUTCOME_LABEL[r.outcome]}${r.outcome !== 'sin-ficha' ? ` (${r.net >= 0 ? '+' : ''}${r.net})` : ''} · ${balances[s.id]} fichas</span>
        </div>`;
      }).join('');

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">Banca: ${dealerBJ ? 'Blackjack' : dealerBust ? `se pasó con ${dealerTotal}` : `total ${dealerTotal}`}</p>
        <div id="bj-round-scores">${rowsHtml}</div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="bj-exit">Volver al hub</button>
          <button class="btn btn-primary" id="bj-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="bj-autoplay"></div>
      `;
      roundEndOverlay.hidden = false;

      const startNext = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
        renderDealer(false);
        renderSeats();
        renderControls();
        if (engine.currentSeat.type === 'bot') scheduleBotStep();
      };
      roundEndCard.querySelector('#bj-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#bj-next').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#bj-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNext); },
      });
      autoplay.arm(autoplayHost, startNext);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { clearTimeout(botTimer); autoplay.cancel(); config.onExit(); });

    renderDealer(false);
    renderSeats();
    renderControls();
    if (engine.currentSeat.type === 'bot') scheduleBotStep();

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
    id: 'blackjack',
    name: 'Blackjack (21)',
    tagline: 'Acércate a 21 sin pasarte y gánale a la banca — con hasta 5 jugadores apostando en la misma mesa.',
    tag: 'CASINO · 1 A 5 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="20" height="28" rx="4" fill="#F6EFDD" stroke="var(--wood-500)" stroke-width="1.5" transform="rotate(-8 18 24)"/>
      <rect x="26" y="12" width="20" height="28" rx="4" fill="#F6EFDD" stroke="var(--wood-500)" stroke-width="1.5" transform="rotate(6 36 26)"/>
      <text x="16" y="24" font-family="monospace" font-size="10" fill="var(--ember-500)" transform="rotate(-8 18 24)">A</text>
      <text x="33" y="26" font-family="monospace" font-size="10" fill="#171310" transform="rotate(6 36 26)">K</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5] },
    mount,
  });
})(window);
