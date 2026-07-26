(function (global) {
  const UnoEngine = global.GameHub.UnoEngine;
  const UnoBot = global.GameHub.UnoBot;
  const H = global.GameHub.UnoHelpers;

  const COLOR_LABEL = { rojo: 'Rojo', amarillo: 'Amarillo', verde: 'Verde', azul: 'Azul', negro: 'Comodín' };

  function cardHTML(card, extraClass) {
    if (card.color === 'negro') {
      return `<div class="uno-card is-negro ${extraClass || ''}"><span class="center">${H.valueLabel(card.value)}</span></div>`;
    }
    return `<div class="uno-card is-${card.color} ${extraClass || ''}">
      <span class="corner">${H.valueLabel(card.value)}</span>
      <span class="center">${H.valueLabel(card.value)}</span>
    </div>`;
  }

  function cardLabel(card, chosenColor) {
    if (card.color === 'negro') {
      const base = card.value === 'mas4' ? 'un +4' : 'un comodín';
      return chosenColor ? `${base} (eligió ${COLOR_LABEL[chosenColor]})` : base;
    }
    return `${COLOR_LABEL[card.color]} ${H.valueLabel(card.value)}`;
  }

  function mount(container, config) {
    const seats = config.seats;
    const engine = new UnoEngine(seats);
    const spectatorMode = seats.every((s) => s.type === 'bot');
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:uno', delay: 3000 });
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>UNO</h2>
        </div>
        <div class="speed-control">
          <label class="pill" for="uno-speed">Velocidad bots</label>
          <input type="range" id="uno-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
        </div>
      </div>
      <div class="uno-layout">
        <div class="panel uno-hands" id="uno-hands"></div>
        <div class="panel uno-table">
          <div class="table-row">
            <div class="pile-block">
              <span class="pile-label">Mazo</span>
              <div id="uno-stock"></div>
            </div>
            <div class="pile-block">
              <span class="pile-label">Descarte</span>
              <div id="uno-discard"></div>
              <span class="pill color-pill" id="uno-color-pill"></span>
            </div>
          </div>
          <div class="turn-indicator" id="uno-turn"></div>
          <div class="action-area" id="uno-actions"></div>
        </div>
        <div class="panel uno-side">
          <h3>Puntajes</h3>
          <div id="uno-scores"></div>
          <div class="log" id="uno-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="uno-color-overlay" hidden>
        <div class="panel setup-card" id="uno-color-card">
          <h2>Elige un color</h2>
          <p class="sub">El comodín se convierte en el color que elijas.</p>
          <div class="uno-color-choices">
            <button class="uno-color-btn is-rojo" data-color="rojo">Rojo</button>
            <button class="uno-color-btn is-amarillo" data-color="amarillo">Amarillo</button>
            <button class="uno-color-btn is-verde" data-color="verde">Verde</button>
            <button class="uno-color-btn is-azul" data-color="azul">Azul</button>
          </div>
        </div>
      </div>
      <div class="setup-overlay" id="uno-round-end" hidden>
        <div class="panel setup-card" id="uno-round-card"></div>
      </div>
    `;

    const handsEl = container.querySelector('#uno-hands');
    const stockEl = container.querySelector('#uno-stock');
    const discardEl = container.querySelector('#uno-discard');
    const colorPillEl = container.querySelector('#uno-color-pill');
    const turnEl = container.querySelector('#uno-turn');
    const actionsEl = container.querySelector('#uno-actions');
    const scoresEl = container.querySelector('#uno-scores');
    const logEl = container.querySelector('#uno-log');
    const speedInput = container.querySelector('#uno-speed');
    const colorOverlay = container.querySelector('#uno-color-overlay');
    const roundEndOverlay = container.querySelector('#uno-round-end');
    const roundEndCard = container.querySelector('#uno-round-card');

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
      stockEl.innerHTML = `<div class="uno-card tile-back"></div><span class="pile-count">${engine.stock.length}</span>`;
      const top = engine.topDiscard();
      discardEl.innerHTML = top ? cardHTML(top) : '<p class="empty-hint">Vacío</p>';
      colorPillEl.className = `pill color-pill is-${engine.activeColor}`;
      colorPillEl.textContent = `Color: ${COLOR_LABEL[engine.activeColor]}`;
    }

    function openColorOverlay(onChoose) {
      colorOverlay.hidden = false;
      const buttons = colorOverlay.querySelectorAll('.uno-color-btn');
      const handler = (e) => {
        colorOverlay.hidden = true;
        buttons.forEach((b) => b.removeEventListener('click', handler));
        onChoose(e.currentTarget.dataset.color);
      };
      buttons.forEach((b) => b.addEventListener('click', handler));
    }

    function renderHands() {
      const current = engine.currentSeat;
      handsEl.innerHTML = seats.map((s) => {
        const hand = engine.hands[s.id];
        const reveal = s.type === 'human' || spectatorMode;
        const isCurrent = current && current.id === s.id;
        const clickable = isCurrent && s.type === 'human' && !engine.roundOver
          && (engine.phase === 'turn' || engine.phase === 'drawn');
        let cardsHTML;
        if (reveal) {
          cardsHTML = hand.map((c, i) => {
            let enabled = false;
            if (clickable) {
              if (engine.phase === 'turn') enabled = engine.isPlayable(c);
              else enabled = i === hand.length - 1 && engine.isPlayable(c);
            }
            return `<button class="card-btn uno-card-btn" data-uid="${c.uid}" ${enabled ? 'data-enabled="true"' : 'disabled'}>${cardHTML(c, enabled ? 'is-enabled' : 'is-dim')}</button>`;
          }).join('');
        } else {
          cardsHTML = hand.map(() => '<div class="uno-card tile-back"></div>').join('');
        }
        const unoBtn = (hand.length === 1 && !engine.unoCalled[s.id] && s.type === 'human')
          ? `<button class="btn btn-primary uno-call-btn" data-seat="${s.id}">¡UNO!</button>` : '';
        return `
          <div class="hand-block ${isCurrent ? 'is-active' : ''}">
            <div class="hand-label">
              <span class="swatch" style="background:${s.hex}"></span>${s.label}
              <span class="pill">${hand.length} cartas</span>${unoBtn}
            </div>
            <div class="hand-cards">${cardsHTML}</div>
          </div>`;
      }).join('');

      handsEl.querySelectorAll('.uno-card-btn[data-enabled="true"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const uid = Number(btn.dataset.uid);
          const seatId = engine.currentSeat.id;
          const card = engine.hands[seatId].find((c) => c.uid === uid);
          if (!card) return;
          if (card.color === 'negro') {
            openColorOverlay((color) => engine.playCard(seatId, uid, color));
          } else {
            engine.playCard(seatId, uid);
          }
        });
      });
      handsEl.querySelectorAll('.uno-call-btn').forEach((btn) => {
        btn.addEventListener('click', () => { engine.callUno(btn.dataset.seat); renderHands(); });
      });
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function clearActions() { actionsEl.innerHTML = ''; }

    function showHumanTurn() {
      clearActions();
      const seatId = engine.currentSeat.id;
      const hand = engine.hands[seatId];
      if (engine.phase === 'turn') {
        const playable = hand.filter((c) => engine.isPlayable(c));
        if (!playable.length) {
          const btn = document.createElement('button');
          btn.className = 'btn btn-primary';
          btn.textContent = `Robar carta (${engine.stock.length})`;
          btn.addEventListener('click', () => {
            engine.drawCard(seatId);
            showHumanTurn();
          });
          actionsEl.appendChild(btn);
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = 'No tienes cartas jugables.';
          actionsEl.appendChild(hint);
        } else {
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = 'Elige una carta de tu mano para jugarla.';
          actionsEl.appendChild(hint);
        }
        return;
      }
      if (engine.phase === 'drawn') {
        const card = hand[hand.length - 1];
        if (engine.isPlayable(card)) {
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = 'Puedes jugar la carta que robaste (resaltada) o guardarla y pasar turno.';
          actionsEl.appendChild(hint);
          const passBtn = document.createElement('button');
          passBtn.className = 'btn btn-ghost';
          passBtn.textContent = 'Guardar y pasar turno';
          passBtn.addEventListener('click', () => engine.passAfterDraw(seatId));
          actionsEl.appendChild(passBtn);
        } else {
          const hint = document.createElement('p');
          hint.className = 'empty-hint';
          hint.textContent = 'La carta robada no sirve — pasando turno…';
          actionsEl.appendChild(hint);
          setTimeout(() => { if (!destroyed) engine.passAfterDraw(seatId); }, 700);
        }
      }
    }

    function scheduleBotTurn() {
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const seatId = seat.id;
        const hand = engine.hands[seatId];
        const playable = hand.filter((c) => engine.isPlayable(c));
        const difficulty = seat.difficulty || 'normal';
        if (playable.length) {
          const card = UnoBot.chooseCard(hand, playable, difficulty);
          if (card.color === 'negro') {
            engine.playCard(seatId, card.uid, UnoBot.chooseColor(hand, difficulty));
          } else {
            engine.playCard(seatId, card.uid);
          }
        } else {
          const drawn = engine.drawCard(seatId);
          if (drawn && engine.phase === 'drawn' && engine.isPlayable(drawn)) {
            if (drawn.color === 'negro') {
              engine.playCard(seatId, drawn.uid, UnoBot.chooseColor(engine.hands[seatId], difficulty));
            } else {
              engine.playCard(seatId, drawn.uid);
            }
          } else if (engine.phase === 'drawn') {
            engine.passAfterDraw(seatId);
          }
        }
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderHands();
      renderPiles();
      clearActions();
      if (engine.roundOver) return;
      const seat = engine.currentSeat;
      if (seat.type === 'bot') scheduleBotTurn();
      else showHumanTurn();
    }

    engine.bus.on('card-drawn', ({ seatId }) => {
      log(`${seatById(seatId).label} robó una carta.`);
      renderPiles();
      renderHands();
      if (seatById(seatId).type === 'human') showHumanTurn();
    });
    engine.bus.on('card-played', ({ seatId, card, chosenColor }) => {
      log(`${seatById(seatId).label} jugó ${cardLabel(card, chosenColor)}.`);
      renderPiles();
      renderHands();
      renderTurn();
    });
    engine.bus.on('forced-draw', ({ seatId, count }) => {
      log(`${seatById(seatId).label} robó ${count} cartas y pierde su turno.`);
      renderHands();
    });
    engine.bus.on('uno-penalty', ({ seatId }) => {
      log(`${seatById(seatId).label} no cantó ¡UNO! a tiempo y roba 2 cartas de castigo.`);
      renderHands();
    });
    engine.bus.on('uno-called', ({ seatId }) => {
      log(`${seatById(seatId).label} cantó ¡UNO!`);
      renderHands();
    });
    engine.bus.on('stock-reshuffled', () => log('El mazo se acabó — se volvió a barajar el descarte.'));
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ winnerId, pointsWon, scores }) => {
      renderScores();
      renderPiles();
      renderHands();
      turnEl.innerHTML = '';
      clearActions();
      const winnerLabel = seatById(winnerId).label;
      log(`¡${winnerLabel} se quedó sin cartas y ganó la ronda! (+${pointsWon} puntos)`);

      const humanWon = seatById(winnerId).type === 'human';
      global.GameHub.Storage.recordResult('uno', humanWon ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">${winnerLabel} se quedó sin cartas · +${pointsWon} puntos</p>
        <div id="uno-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="uno-exit">Volver al hub</button>
          <button class="btn btn-primary" id="uno-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="uno-autoplay"></div>
      `;
      roundEndCard.querySelector('#uno-round-scores').innerHTML = seats.map((s) => `
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
      roundEndCard.querySelector('#uno-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#uno-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#uno-autoplay');
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
    id: 'uno',
    name: 'UNO',
    tagline: 'Descarta tus cartas por color o número antes que nadie. No olvides cantar ¡UNO!',
    tag: 'CARTAS · 2 A 8 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="26" height="38" rx="5" fill="#c1443c" stroke="#2b1c12" stroke-opacity="0.3" transform="rotate(-10 23 25)"/>
      <rect x="20" y="10" width="26" height="38" rx="5" fill="#12291d" stroke="#2b1c12" stroke-opacity="0.3" transform="rotate(8 33 29)"/>
      <ellipse cx="33" cy="29" rx="9" ry="12" fill="#f6efdd" transform="rotate(8 33 29)"/>
      <text x="33" y="34" font-size="14" font-weight="800" fill="#c1443c" text-anchor="middle" font-family="Georgia, serif" transform="rotate(8 33 29)">UNO</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [2, 3, 4, 5, 6, 7, 8] },
    mount,
  });
})(window);
