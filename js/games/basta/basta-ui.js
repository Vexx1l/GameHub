(function (global) {
  const BastaEngine = global.GameHub.BastaEngine;
  const { WORD_BANK } = global.GameHub.BastaData;
  const WRITE_SECONDS = 75;

  function mount(container, config) {
    const seats = config.seats;
    const engine = new BastaEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:basta', delay: 3000 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    let destroyed = false;
    let timeLeft = WRITE_SECONDS;
    let timerInterval = null;
    let botFillTimer = null;
    // En online cada campo se manda con un pequeño debounce (no tecla por
    // tecla) para no saturar la sala; se vacían todas de una al escribir
    // "¡BASTA!" o al salir del campo, así el resto ve la última versión.
    const pendingFieldTimers = {};

    if (online) {
      online.onAction((method, args) => {
        if (typeof engine[method] === 'function') engine[method](...args);
      });
    }

    const humanSeats = seats.filter((s) => s.type === 'human');
    let humanIdx = 0; // a quién le toca escribir ahora (sólo aplica en modo local hotseat)

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Basta / Stop</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        <div class="pill" id="bs-timer"></div>
      </div>
      <div class="basta-layout">
        <div class="panel basta-main">
          <div class="basta-letter" id="bs-letter"></div>
          <div id="bs-write"></div>
        </div>
        <div class="panel basta-side">
          <h3>Puntajes acumulados</h3>
          <div id="bs-scores"></div>
          <div class="log" id="bs-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="bs-round-end" hidden>
        <div class="panel setup-card bs-round-card" id="bs-round-card"></div>
      </div>
    `;

    const timerEl = container.querySelector('#bs-timer');
    const letterEl = container.querySelector('#bs-letter');
    const writeEl = container.querySelector('#bs-write');
    const scoresEl = container.querySelector('#bs-scores');
    const logEl = container.querySelector('#bs-log');
    const roundEndOverlay = container.querySelector('#bs-round-end');
    const roundEndCard = container.querySelector('#bs-round-card');

    function log(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
      logEl.prepend(p);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }

    function renderScores() {
      scoresEl.innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${engine.scores[s.id]}</span>
        </div>`).join('');
    }

    function pickBotWord(category, letter) {
      const bank = WORD_BANK[category] && WORD_BANK[category][letter];
      if (!bank || !bank.length) return '';
      return bank[Math.floor(Math.random() * bank.length)];
    }

    function fillBots() {
      seats.filter((s) => s.type === 'bot').forEach((s) => {
        const skipChance = s.difficulty === 'facil' ? 0.3 : s.difficulty === 'normal' ? 0.1 : 0;
        engine.categories.forEach((cat) => {
          if (Math.random() < skipChance) return;
          const word = pickBotWord(cat, engine.letter);
          if (word) engine.setAnswer(s.id, cat, word);
        });
      });
    }

    function flushField(seatId, category, value) {
      const key = `${seatId}|${category}`;
      clearTimeout(pendingFieldTimers[key]);
      delete pendingFieldTimers[key];
      if (online) online.submitAction('setAnswer', [seatId, category, value]);
      else engine.setAnswer(seatId, category, value);
    }

    function scheduleField(seatId, category, value) {
      const key = `${seatId}|${category}`;
      clearTimeout(pendingFieldTimers[key]);
      pendingFieldTimers[key] = setTimeout(() => flushField(seatId, category, value), 500);
    }

    function flushAllPending() {
      Object.keys(pendingFieldTimers).forEach((key) => clearTimeout(pendingFieldTimers[key]));
    }

    function renderWritePanel() {
      if (online) {
        if (!mySeatId) {
          writeEl.innerHTML = `<p class="sub">Modo espectador — mirando cómo el resto completa sus categorías…</p>`;
          return;
        }
        writeEl.innerHTML = `
          <p class="sub">Completá cada categoría con una palabra que empiece con <b>${engine.letter}</b>. El resto está escribiendo la suya al mismo tiempo, cada uno desde su pantalla.</p>
          <div class="basta-fields" id="bs-fields">
            ${engine.categories.map((cat, i) => `
              <div class="basta-field">
                <label for="bs-input-${i}">${cat}</label>
                <input type="text" id="bs-input-${i}" data-cat="${cat}" autocomplete="off" value="${engine.answers[mySeatId][cat] || ''}">
              </div>
            `).join('')}
          </div>
          <div class="setup-actions">
            <button type="button" class="btn btn-danger" id="bs-stop">¡BASTA! (termina la ronda ya)</button>
          </div>
        `;
        writeEl.querySelectorAll('#bs-fields input').forEach((input) => {
          input.addEventListener('input', () => scheduleField(mySeatId, input.dataset.cat, input.value));
          input.addEventListener('blur', () => flushField(mySeatId, input.dataset.cat, input.value));
        });
        writeEl.querySelector('#bs-stop').addEventListener('click', () => {
          writeEl.querySelectorAll('#bs-fields input').forEach((input) => flushField(mySeatId, input.dataset.cat, input.value));
          finishRound(mySeatId);
        });
        return;
      }
      if (humanSeats.length === 0) {
        writeEl.innerHTML = `<p class="sub">Los bots están completando sus categorías… la ronda termina sola en unos segundos.</p>`;
        return;
      }
      const seat = humanSeats[humanIdx];
      const isLast = humanIdx === humanSeats.length - 1;
      writeEl.innerHTML = `
        <p class="sub">Turno de <b>${seat.label}</b> — completá cada categoría con una palabra que empiece con <b>${engine.letter}</b> (los demás no deben mirar la pantalla).</p>
        <div class="basta-fields" id="bs-fields">
          ${engine.categories.map((cat, i) => `
            <div class="basta-field">
              <label for="bs-input-${i}">${cat}</label>
              <input type="text" id="bs-input-${i}" data-cat="${cat}" autocomplete="off" value="${engine.answers[seat.id][cat] || ''}">
            </div>
          `).join('')}
        </div>
        <div class="setup-actions">
          <button type="button" class="btn btn-primary" id="bs-next">${humanSeats.length > 1 && !isLast ? 'Listo, pasar el turno →' : 'Listo'}</button>
          <button type="button" class="btn btn-danger" id="bs-stop">¡BASTA! (termina la ronda ya)</button>
        </div>
      `;
      writeEl.querySelectorAll('#bs-fields input').forEach((input) => {
        input.addEventListener('input', () => {
          engine.setAnswer(seat.id, input.dataset.cat, input.value);
        });
      });
      writeEl.querySelector('#bs-next').addEventListener('click', () => {
        if (humanIdx < humanSeats.length - 1) {
          humanIdx += 1;
          renderWritePanel();
        } else {
          finishRound(null);
        }
      });
      writeEl.querySelector('#bs-stop').addEventListener('click', () => finishRound(seat.id));
    }

    function tickTimer() {
      timeLeft -= 1;
      timerEl.textContent = `⏱ ${Math.max(timeLeft, 0)}s`;
      if (timeLeft <= 0) finishRound(null);
    }

    function startTimer() {
      clearInterval(timerInterval);
      timeLeft = WRITE_SECONDS;
      timerEl.textContent = `⏱ ${timeLeft}s`;
      timerInterval = setInterval(tickTimer, 1000);
    }

    function finishRound(calledBySeatId) {
      if (engine.phase !== 'writing') return;
      clearInterval(timerInterval);
      clearTimeout(botFillTimer);
      if (online) { online.submitAction('stop', [calledBySeatId]); return; }
      engine.stop(calledBySeatId);
    }

    function renderResults(result) {
      renderScores();
      const caller = seats.find((s) => s.id === result.calledBy);
      log(caller ? `¡BASTA! gritó ${caller.label} con la letra ${result.letter}.` : `Se acabó el tiempo con la letra ${result.letter}.`);

      const tableRows = engine.categories.map((cat) => `
        <tr>
          <td>${cat}</td>
          ${seats.map((s) => {
            const entry = result.perCategory[cat].find((e) => e.seatId === s.id);
            const text = entry.text || '<span class="bs-empty">—</span>';
            return `<td class="${entry.valid ? (entry.points === 10 ? 'is-unique' : 'is-dup') : 'is-invalid'}">${text} <span class="mono">(${entry.points})</span></td>`;
          }).join('')}
        </tr>
      `).join('');

      roundEndCard.innerHTML = `
        <h2>Letra ${result.letter} — resultados</h2>
        <div class="bs-table-wrap">
          <table class="bs-table">
            <thead><tr><th>Categoría</th>${seats.map((s) => `<th><span class="swatch" style="background:${s.hex}"></span>${s.label}</th>`).join('')}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div id="bs-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="bs-exit">Volver al hub</button>
          <button class="btn btn-primary" id="bs-next-round">Jugar otra letra</button>
        </div>
        <div class="autoplay-row" id="bs-autoplay"></div>
      `;
      roundEndCard.querySelector('#bs-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">+${result.roundPoints[s.id]} esta ronda · ${engine.scores[s.id]} en total</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNext = () => {
        roundEndOverlay.hidden = true;
        flushAllPending();
        humanIdx = 0;
        engine.startRound();
        beginWritingPhase();
      };
      roundEndCard.querySelector('#bs-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#bs-next-round').addEventListener('click', () => { autoplay.cancel(); startNext(); });
      const autoplayHost = roundEndCard.querySelector('#bs-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNext); },
      });
      autoplay.arm(autoplayHost, startNext);
    }

    engine.bus.on('round-ended', (result) => {
      global.GameHub.Storage.recordResult('basta', humanBeatBots(result) ? 'human-win' : 'bot-win');
      renderResults(result);
    });

    function humanBeatBots(result) {
      const humanBest = Math.max(0, ...seats.filter((s) => s.type === 'human').map((s) => result.roundPoints[s.id]));
      const botBest = Math.max(0, ...seats.filter((s) => s.type === 'bot').map((s) => result.roundPoints[s.id]));
      return humanSeats.length > 0 && humanBest >= botBest;
    }

    function beginWritingPhase() {
      letterEl.textContent = engine.letter;
      startTimer();
      if (online) {
        renderWritePanel();
        return;
      }
      fillBots();
      renderWritePanel();
      if (humanSeats.length === 0) {
        // Nadie humano: un bot "grita basta" tras completar sus categorías.
        botFillTimer = setTimeout(() => {
          if (!destroyed) finishRound(seats.find((s) => s.type === 'bot').id);
        }, Math.max(1200, (config.speed || 700)));
      }
    }

    container.querySelector('.back-btn').addEventListener('click', () => {
      clearInterval(timerInterval);
      clearTimeout(botFillTimer);
      flushAllPending();
      autoplay.cancel();
      config.onExit();
    });

    renderScores();
    log(`— Ronda comenzada —`);
    beginWritingPhase();

    return {
      destroy() {
        destroyed = true;
        clearInterval(timerInterval);
        clearTimeout(botFillTimer);
        flushAllPending();
        autoplay.cancel();
        engine.bus.clear();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'basta',
    name: 'Basta / Stop',
    tagline: 'Sale una letra: escribe rápido un nombre, animal, color y más antes de que alguien grite ¡BASTA!',
    tag: 'PALABRAS · 1 A 8 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="40" height="40" rx="8" fill="#c1443c"/>
      <text x="28" y="37" font-family="Georgia, serif" font-size="26" font-weight="800" fill="#F6EFDD" text-anchor="middle">B</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6, 7, 8] },
    mount,
  });

  global.GameHub.Rules.registerRules('basta', {
    title: 'Basta / Stop',
    intro: '1 a 8 jugadores. Sale una letra al azar; escriban rápido antes de que alguien frene la ronda.',
    bullets: [
      'Cada ronda sortea una letra. Completa cada categoría (nombre, animal, color, etc.) con una palabra que empiece con esa letra.',
      'Cualquier jugador puede apretar "¡BASTA!" para terminar la ronda al instante — lo que no llegaste a escribir queda en blanco.',
      'Palabra válida y que nadie más repitió = 10 puntos; válida pero repetida = 5 puntos; vacía o inválida = 0.',
      'El puntaje se acumula ronda tras ronda.',
    ],
  });
})(window);
