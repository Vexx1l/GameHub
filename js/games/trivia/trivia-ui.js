(function (global) {
  const TriviaEngine = global.GameHub.TriviaEngine;
  const TriviaBot = global.GameHub.TriviaBot;

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  function mount(container, config) {
    const seats = config.seats;
    const engine = new TriviaEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:trivia', delay: 3000 });
    const hasBots = seats.some((s) => s.type === 'bot');
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Trivia</h2>
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="tr-speed">Velocidad bots</label>
            <input type="range" id="tr-speed" min="150" max="1600" step="50" value="${config.speed || 900}">
          </div>` : ''}
      </div>
      <div class="trivia-layout">
        <div class="panel trivia-main">
          <div class="trivia-category" id="tr-category"></div>
          <div class="trivia-question" id="tr-question"></div>
          <div class="trivia-options" id="tr-options"></div>
          <div class="turn-indicator" id="tr-turn"></div>
        </div>
        <div class="panel trivia-side">
          <h3>Puntajes</h3>
          <div id="tr-scores"></div>
          <div class="log" id="tr-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="tr-round-end" hidden>
        <div class="panel setup-card" id="tr-round-card"></div>
      </div>
    `;

    const categoryEl = container.querySelector('#tr-category');
    const questionEl = container.querySelector('#tr-question');
    const optionsEl = container.querySelector('#tr-options');
    const turnEl = container.querySelector('#tr-turn');
    const scoresEl = container.querySelector('#tr-scores');
    const logEl = container.querySelector('#tr-log');
    const speedInput = container.querySelector('#tr-speed');
    const roundEndOverlay = container.querySelector('#tr-round-end');
    const roundEndCard = container.querySelector('#tr-round-card');

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

    function renderQuestion() {
      categoryEl.innerHTML = `<span class="pill">Categoría: ${engine.category}</span>`;
      questionEl.textContent = engine.question.q;
    }

    function renderOptions(revealCorrect) {
      const seat = engine.currentSeat;
      const isHumanTurn = !engine.roundOver && seat.type === 'human';
      optionsEl.innerHTML = engine.question.options.map((opt, i) => {
        const discarded = engine.wrongTried.has(i);
        let cls = 'trivia-option';
        if (revealCorrect && i === engine.question.correct) cls += ' is-correct';
        else if (discarded) cls += ' is-discarded';
        const disabled = !isHumanTurn || discarded || engine.roundOver;
        return `<button class="${cls}" data-idx="${i}" ${disabled ? 'disabled' : ''}>
          <span class="opt-letter">${OPTION_LETTERS[i]}</span><span>${opt}</span>
        </button>`;
      }).join('');
      if (isHumanTurn) {
        optionsEl.querySelectorAll('button:not([disabled])').forEach((btn) => {
          btn.addEventListener('click', () => engine.answer(seat.id, Number(btn.dataset.idx)));
        });
      }
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function scheduleBotTurn() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 900);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        let idx = TriviaBot.chooseAnswer(engine.question, seat.difficulty || 'normal');
        if (engine.wrongTried.has(idx)) {
          const remaining = engine.question.options.map((_, i) => i).filter((i) => !engine.wrongTried.has(i));
          idx = remaining[Math.floor(Math.random() * remaining.length)];
        }
        engine.answer(seat.id, idx);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderOptions(false);
      if (engine.roundOver) return;
      if (engine.currentSeat.type === 'bot') scheduleBotTurn();
    }

    engine.bus.on('round-started', () => {
      // Sin este listener, renderQuestion() solo se llama una vez al montar
      // el juego: las rondas siguientes cambian engine.question/category
      // correctamente, pero el texto de la pregunta en pantalla nunca se
      // vuelve a pintar y queda "congelado" en la pregunta de la ronda 1
      // (mientras que renderOptions(), disparado por 'turn-changed', sí
      // refleja las opciones de la pregunta nueva).
      renderQuestion();
      log(`— Pregunta ${engine.round}: categoría ${engine.category} —`);
    });
    engine.bus.on('answer-wrong', ({ seatId, optionIdx }) => {
      log(`${seatById(seatId).label} respondió "${engine.question.options[optionIdx]}" — incorrecto.`);
      renderOptions(false);
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ winnerId, correctIndex, scores }) => {
      renderOptions(true);
      renderScores();
      turnEl.innerHTML = '';

      const correctText = engine.question.options[correctIndex];
      let headline;
      if (winnerId) {
        const label = seatById(winnerId).label;
        headline = `¡${label} acertó! La respuesta era "${correctText}".`;
        const humanWon = seatById(winnerId).type === 'human';
        global.GameHub.Storage.recordResult('trivia', humanWon ? 'human-win' : 'bot-win');
      } else {
        headline = `Nadie acertó — la respuesta correcta era "${correctText}".`;
        global.GameHub.Storage.recordResult('trivia', 'bot-win');
      }
      log(headline);

      roundEndCard.innerHTML = `
        <h2>Pregunta terminada</h2>
        <p class="sub">${headline}</p>
        <div id="tr-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="tr-exit">Volver al hub</button>
          <button class="btn btn-primary" id="tr-next">Siguiente pregunta</button>
        </div>
        <div class="autoplay-row" id="tr-autoplay"></div>
      `;
      roundEndCard.querySelector('#tr-round-scores').innerHTML = seats.map((s) => `
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
      roundEndCard.querySelector('#tr-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#tr-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#tr-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-avanzar preguntas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderScores();
    renderQuestion();
    log(`— Pregunta ${engine.round}: categoría ${engine.category} —`);
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
    id: 'trivia',
    name: 'Trivia',
    tagline: 'Preguntas de historia, ciencia, geografía, deportes, entretenimiento y arte. Responde antes que nadie.',
    tag: 'PREGUNTAS · 1 A 8 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="22" fill="#12291d" stroke="var(--gold-500)" stroke-width="2.5"/>
      <text x="28" y="37" font-size="26" font-weight="800" fill="var(--gold-500)" text-anchor="middle" font-family="Georgia, serif">?</text>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6, 7, 8] },
    mount,
  });
})(window);
