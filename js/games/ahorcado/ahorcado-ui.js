(function (global) {
  const AhorcadoEngine = global.GameHub.AhorcadoEngine;
  const AhorcadoBot = global.GameHub.AhorcadoBot;
  const H = global.GameHub.AhorcadoHelpers;

  const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  function figureSVG(errors) {
    const show = (stage) => (errors >= stage ? 1 : 0);
    return `
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="190" x2="120" y2="190" class="gallows" />
        <line x1="40" y1="190" x2="40" y2="18" class="gallows" />
        <line x1="40" y1="18" x2="110" y2="18" class="gallows" />
        <line x1="108" y1="18" x2="108" y2="42" class="gallows" />
        <circle cx="108" cy="58" r="15" class="figure-part" style="opacity:${show(1)}" />
        <line x1="108" y1="73" x2="108" y2="128" class="figure-part" style="opacity:${show(2)}" />
        <line x1="108" y1="88" x2="86" y2="108" class="figure-part" style="opacity:${show(3)}" />
        <line x1="108" y1="88" x2="130" y2="108" class="figure-part" style="opacity:${show(4)}" />
        <line x1="108" y1="128" x2="88" y2="160" class="figure-part" style="opacity:${show(5)}" />
        <line x1="108" y1="128" x2="128" y2="160" class="figure-part" style="opacity:${show(6)}" />
      </svg>`;
  }

  function mount(container, config) {
    const seats = config.seats;
    const engine = new AhorcadoEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:ahorcado', delay: 3000 });
    const online = config.online || null;
    const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
    let botTimer = null;
    let destroyed = false;

    const hasBots = !online && seats.some((s) => s.type === 'bot');

    if (online) {
      online.onAction((method, args) => {
        if (typeof engine[method] === 'function') engine[method](...args);
      });
    }

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Ahorcado</h2>
          ${online ? `<span class="pill">Sala ${online.code}${mySeatId ? '' : ' — espectador'}</span>` : ''}
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="ah-speed">Velocidad bots</label>
            <input type="range" id="ah-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
          </div>` : ''}
      </div>
      <div class="ahorcado-layout">
        <div class="panel ahorcado-main">
          <div class="ahorcado-category" id="ah-category"></div>
          <div class="ahorcado-figure" id="ah-figure"></div>
          <div class="ahorcado-word" id="ah-word"></div>
          <div class="turn-indicator" id="ah-turn"></div>
          <div class="ahorcado-keyboard" id="ah-keyboard"></div>
          <div class="ahorcado-guessword" id="ah-guessword"></div>
          <p class="empty-hint">Errores: <span id="ah-errors"></span> / ${H.MAX_ERRORS}</p>
        </div>
        <div class="panel ahorcado-side">
          <h3>Puntajes</h3>
          <div id="ah-scores"></div>
          <div class="log" id="ah-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="ah-round-end" hidden>
        <div class="panel setup-card" id="ah-round-card"></div>
      </div>
    `;

    const categoryEl = container.querySelector('#ah-category');
    const figureEl = container.querySelector('#ah-figure');
    const wordEl = container.querySelector('#ah-word');
    const turnEl = container.querySelector('#ah-turn');
    const keyboardEl = container.querySelector('#ah-keyboard');
    const guessWordEl = container.querySelector('#ah-guessword');
    const errorsEl = container.querySelector('#ah-errors');
    const scoresEl = container.querySelector('#ah-scores');
    const logEl = container.querySelector('#ah-log');
    const speedInput = container.querySelector('#ah-speed');
    const roundEndOverlay = container.querySelector('#ah-round-end');
    const roundEndCard = container.querySelector('#ah-round-card');

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

    function renderCategory() {
      categoryEl.innerHTML = `<span class="pill">Categoría: ${engine.category}</span><span class="pill">${engine.letters.length} letras</span>`;
    }

    function renderFigure() {
      figureEl.innerHTML = figureSVG(engine.errors);
      errorsEl.textContent = engine.errors;
    }

    function renderWord() {
      wordEl.innerHTML = engine.letters.map((ch) => (engine.guessedLetters.has(ch)
        ? `<span class="letter-box revealed">${ch}</span>`
        : '<span class="letter-box"></span>')).join('');
    }

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function isMyTurn() {
      if (engine.roundOver) return false;
      return online ? engine.currentSeat.id === mySeatId : engine.currentSeat.type === 'human';
    }

    function renderKeyboard() {
      const isHumanTurn = isMyTurn();
      const seatId = engine.currentSeat.id;
      keyboardEl.innerHTML = KEYBOARD_LETTERS.map((l) => {
        const guessed = engine.guessedLetters.has(l);
        let cls = 'key';
        if (guessed) cls += engine.letters.includes(l) ? ' is-hit' : ' is-miss';
        const disabled = guessed || !isHumanTurn;
        return `<button class="${cls}" data-letter="${l}" ${disabled ? 'disabled' : ''}>${l}</button>`;
      }).join('');
      if (isHumanTurn) {
        keyboardEl.querySelectorAll('button:not([disabled])').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (online) { online.submitAction('guessLetter', [seatId, btn.dataset.letter]); return; }
            engine.guessLetter(seatId, btn.dataset.letter);
          });
        });
      }
    }

    function renderGuessForm() {
      const isHumanTurn = isMyTurn();
      guessWordEl.innerHTML = `
        <form id="ah-guess-form" class="guess-word-form">
          <input type="text" id="ah-guess-input" placeholder="Adivina la palabra completa" ${isHumanTurn ? '' : 'disabled'} autocomplete="off" maxlength="24">
          <button type="submit" class="btn btn-ghost" ${isHumanTurn ? '' : 'disabled'}>Adivinar palabra</button>
        </form>`;
      if (isHumanTurn) {
        const seatId = engine.currentSeat.id;
        const form = guessWordEl.querySelector('#ah-guess-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = guessWordEl.querySelector('#ah-guess-input');
          if (input.value.trim()) {
            if (online) online.submitAction('guessWord', [seatId, input.value]);
            else engine.guessWord(seatId, input.value);
            input.value = '';
          }
        });
      }
    }

    function scheduleBotTurn() {
      if (online) return;
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const action = AhorcadoBot.chooseAction({
          guessedLetters: engine.guessedLetters,
          difficulty: seat.difficulty || 'normal',
          category: engine.category,
          length: engine.letters.length,
          pattern: engine.displayPattern(),
          WORD_BANK: H.WORD_BANK,
          normalizeWord: H.normalizeWord,
        });
        if (!action) return;
        if (action.type === 'word') engine.guessWord(seat.id, action.guess);
        else engine.guessLetter(seat.id, action.letter);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderKeyboard();
      renderGuessForm();
      if (engine.roundOver) return;
      if (engine.currentSeat.type === 'bot') scheduleBotTurn();
    }

    engine.bus.on('letter-hit', ({ seatId, letter, hits }) => {
      log(`${seatById(seatId).label} acertó la letra "${letter}" (+${hits * 5} pts).`);
      renderWord();
      renderKeyboard();
      renderScores();
    });
    engine.bus.on('letter-miss', ({ seatId, letter }) => {
      log(`${seatById(seatId).label} dijo "${letter}" y no está en la palabra.`);
      renderKeyboard();
      renderFigure();
    });
    engine.bus.on('word-miss', ({ seatId, guess }) => {
      log(`${seatById(seatId).label} intentó "${guess}" y no era la palabra.`);
      renderFigure();
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ winnerId, reason, word, category, scores }) => {
      renderFigure();
      renderWord();
      renderScores();
      turnEl.innerHTML = '';
      keyboardEl.innerHTML = '';
      guessWordEl.innerHTML = '';

      let headline;
      if (winnerId) {
        const label = seatById(winnerId).label;
        headline = reason === 'palabra-completa'
          ? `¡${label} adivinó "${word}" de una! (+25 puntos)`
          : `¡${label} completó "${word}" con la última letra!`;
        const humanWon = seatById(winnerId).type === 'human';
        global.GameHub.Storage.recordResult('ahorcado', humanWon ? 'human-win' : 'bot-win');
      } else {
        headline = `Se acabaron los intentos — la palabra era "${word}" (categoría: ${category}).`;
        global.GameHub.Storage.recordResult('ahorcado', 'bot-win');
      }
      log(headline);

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">${headline}</p>
        <div id="ah-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="ah-exit">Volver al hub</button>
          <button class="btn btn-primary" id="ah-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="ah-autoplay"></div>
      `;
      roundEndCard.querySelector('#ah-round-scores').innerHTML = seats.map((s) => `
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
      roundEndCard.querySelector('#ah-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#ah-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#ah-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderScores();
    renderCategory();
    renderFigure();
    renderWord();
    log(`— Ronda ${engine.round}: categoría ${engine.category} —`);
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
    id: 'ahorcado',
    name: 'Ahorcado',
    tagline: 'Adivina la palabra letra por letra antes de que se complete el dibujo. Quien acierte se lleva los puntos.',
    tag: 'PALABRAS · 1 A 6 JUGADORES',
    online: true,
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 48H30" stroke="#F6EFDD" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 48V8H38" stroke="#F6EFDD" stroke-width="3" stroke-linecap="round"/>
      <path d="M38 8V16" stroke="#F6EFDD" stroke-width="3" stroke-linecap="round"/>
      <circle cx="38" cy="22" r="6" stroke="var(--ember-500)" stroke-width="3"/>
      <path d="M38 28V38M38 31L32 35M38 31L44 35M38 38L33 45M38 38L43 45" stroke="var(--ember-500)" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6] },
    mount,
  });
})(window);
