(function (global) {
  const QuinielaEngine = global.GameHub.QuinielaEngine;
  const QuinielaBot = global.GameHub.QuinielaBot;
  const H = global.GameHub.QuinielaHelpers;
  const RESULT_LABEL = { L: 'Local', E: 'Empate', V: 'Visitante' };

  function mount(container, config) {
    const seats = config.seats;
    const engine = new QuinielaEngine(seats);
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:quiniela', delay: 3000 });
    const hasBots = seats.some((s) => s.type === 'bot');
    let draft = [];
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Quiniela de Fútbol</h2>
        </div>
        ${hasBots ? `
          <div class="speed-control">
            <label class="pill" for="qn-speed">Velocidad bots</label>
            <input type="range" id="qn-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
          </div>` : ''}
      </div>
      <div class="quiniela-layout">
        <div class="panel quiniela-main">
          <div class="turn-indicator" id="qn-turn"></div>
          <p class="sub" id="qn-jornada"></p>
          <div class="quiniela-matches" id="qn-matches"></div>
          <div class="quiniela-actions" id="qn-actions"></div>
        </div>
        <div class="panel quiniela-side">
          <h3>Tabla acumulada</h3>
          <div id="qn-scores"></div>
          <div class="log" id="qn-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="qn-round-end" hidden>
        <div class="panel setup-card" id="qn-round-card"></div>
      </div>
    `;

    const turnEl = container.querySelector('#qn-turn');
    const jornadaEl = container.querySelector('#qn-jornada');
    const matchesEl = container.querySelector('#qn-matches');
    const actionsEl = container.querySelector('#qn-actions');
    const scoresEl = container.querySelector('#qn-scores');
    const logEl = container.querySelector('#qn-log');
    const speedInput = container.querySelector('#qn-speed');
    const roundEndOverlay = container.querySelector('#qn-round-end');
    const roundEndCard = container.querySelector('#qn-round-card');

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

    function renderTurn() {
      if (engine.roundOver || !engine.currentSeat) { turnEl.innerHTML = ''; return; }
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Pronóstico de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function resultOf(g) { return H.resultadoDe(g); }

    function renderMatches() {
      if (engine.roundOver) return; // el resumen final se pinta en el overlay
      const seat = engine.currentSeat;
      const isHuman = seat.type === 'human';
      matchesEl.innerHTML = engine.matches.map((m, i) => {
        const g = draft[i] || { local: 0, visitante: 0 };
        return `
        <div class="qn-match">
          <span class="qn-team qn-home">${m.home}</span>
          <div class="qn-score-box">
            <div class="qn-stepper">
              <button data-i="${i}" data-side="local" data-dir="-1" ${isHuman ? '' : 'disabled'}>−</button>
              <span class="mono qn-goal" id="qn-local-${i}">${g.local}</span>
              <button data-i="${i}" data-side="local" data-dir="1" ${isHuman ? '' : 'disabled'}>+</button>
            </div>
            <span class="qn-dash">–</span>
            <div class="qn-stepper">
              <button data-i="${i}" data-side="visitante" data-dir="-1" ${isHuman ? '' : 'disabled'}>−</button>
              <span class="mono qn-goal" id="qn-visitante-${i}">${g.visitante}</span>
              <button data-i="${i}" data-side="visitante" data-dir="1" ${isHuman ? '' : 'disabled'}>+</button>
            </div>
          </div>
          <span class="qn-team qn-away">${m.away}</span>
          <span class="pill qn-result-pill">${RESULT_LABEL[resultOf(g)]}</span>
        </div>`;
      }).join('');

      if (isHuman) {
        matchesEl.querySelectorAll('button[data-i]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const i = Number(btn.dataset.i);
            const side = btn.dataset.side;
            const dir = Number(btn.dataset.dir);
            draft[i][side] = Math.max(0, Math.min(9, draft[i][side] + dir));
            container.querySelector(`#qn-${side}-${i}`).textContent = draft[i][side];
            matchesEl.querySelectorAll('.qn-match').forEach((row, idx) => {
              row.querySelector('.qn-result-pill').textContent = RESULT_LABEL[resultOf(draft[idx])];
            });
          });
        });
      } else {
        const hint = document.createElement('p');
        hint.className = 'empty-hint';
        hint.textContent = `${seat.label} está armando su pronóstico…`;
        matchesEl.appendChild(hint);
      }
    }

    function renderActions() {
      actionsEl.innerHTML = '';
      if (engine.roundOver) return;
      const seat = engine.currentSeat;
      if (seat.type !== 'human') return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = 'Enviar pronóstico';
      btn.addEventListener('click', () => engine.predict(seat.id, draft));
      actionsEl.appendChild(btn);
    }

    function startDraft() {
      draft = engine.matches.map(() => ({ local: 0, visitante: 0 }));
    }

    function scheduleBotPredict() {
      clearTimeout(botTimer);
      const delay = Number(speedInput ? speedInput.value : 700);
      botTimer = setTimeout(() => {
        if (destroyed || engine.roundOver) return;
        const seat = engine.currentSeat;
        const guesses = QuinielaBot.choosePrediction(engine.matches, seat.difficulty || 'normal');
        engine.predict(seat.id, guesses);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      startDraft();
      renderMatches();
      renderActions();
      if (engine.roundOver) return;
      if (engine.currentSeat.type === 'bot') scheduleBotPredict();
    }

    engine.bus.on('predicted', ({ seatId }) => {
      log(`${seatById(seatId).label} envió su pronóstico.`);
    });
    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('round-ended', ({ actualResults, details, matchScores, scores }) => {
      renderScores();
      turnEl.innerHTML = '';
      matchesEl.innerHTML = '';
      actionsEl.innerHTML = '';

      let best = -1;
      let winners = [];
      seats.forEach((s) => {
        if (matchScores[s.id] > best) { best = matchScores[s.id]; winners = [s.id]; } else if (matchScores[s.id] === best) { winners.push(s.id); }
      });
      const winnerLabels = winners.map((id) => seatById(id).label).join(' y ');
      const tie = winners.length > 1;
      log(`Jornada ${engine.round} revelada — gan${tie ? 'aron' : 'ó'} ${winnerLabels} con ${best} pts.`);

      const someHumanWon = winners.some((id) => seatById(id).type === 'human');
      global.GameHub.Storage.recordResult('quiniela', someHumanWon ? 'human-win' : 'bot-win');

      const matchesHtml = engine.matches.map((m, i) => `
        <div class="qn-result-row">
          <span>${m.home} <b class="mono">${actualResults[i].local} – ${actualResults[i].visitante}</b> ${m.away}</span>
        </div>`).join('');

      const seatDetailHtml = seats.map((s) => `
        <div class="qn-seat-detail">
          <div class="seat-row">
            <span class="swatch" style="background:${s.hex}"></span>
            <span class="seat-name">${s.label}</span>
            <span class="mono">${matchScores[s.id]} pts (acum. ${scores[s.id]})</span>
          </div>
          <div class="qn-picks">
            ${engine.predictions[s.id].map((g, i) => `<span class="pill ${details[s.id][i].exact ? 'qn-hit-exact' : details[s.id][i].correctResult ? 'qn-hit-result' : ''}">${g.local}-${g.visitante}</span>`).join('')}
          </div>
        </div>`).join('');

      roundEndCard.innerHTML = `
        <h2>Jornada ${engine.round} revelada</h2>
        <p class="sub">Gan${tie ? 'aron' : 'ó'} ${winnerLabels} con ${best} pts</p>
        <div class="qn-results-list">${matchesHtml}</div>
        <div id="qn-round-scores">${seatDetailHtml}</div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="qn-exit">Volver al hub</button>
          <button class="btn btn-primary" id="qn-next">Jugar otra jornada</button>
        </div>
        <div class="autoplay-row" id="qn-autoplay"></div>
      `;
      roundEndOverlay.hidden = false;

      const startNextRound = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
      };
      roundEndCard.querySelector('#qn-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#qn-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#qn-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar jornadas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });

    renderScores();
    jornadaEl.textContent = 'Pronostica el marcador de los 5 partidos de la jornada. Marcador exacto = 3 pts, resultado correcto = 1 pt.';
    log(`— Jornada ${engine.round} comenzada —`);
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
    id: 'quiniela',
    name: 'Quiniela de Fútbol',
    tagline: 'Pronostica el marcador de 5 partidos por jornada y suma puntos por acertar el resultado o el marcador exacto.',
    tag: 'FÚTBOL · 1 A 8 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="21" fill="#F6EFDD" stroke="var(--wood-500)" stroke-width="2"/>
      <path d="M28 15 L34 20 L32 27 L24 27 L22 20 Z" fill="#171310"/>
      <path d="M28 15 L22 8 M28 15 L34 8" stroke="#171310" stroke-width="1.6"/>
      <path d="M14 24 L8 20 M14 24 L9 30 M14 24 L18 30" stroke="#171310" stroke-width="1.4"/>
      <path d="M42 24 L48 20 M42 24 L47 30 M42 24 L38 30" stroke="#171310" stroke-width="1.4"/>
      <path d="M24 27 L18 34 L22 40 L28 42 L34 40 L38 34 L32 27" stroke="#171310" stroke-width="1.4" fill="none"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [1, 2, 3, 4, 5, 6, 7, 8] },
    mount,
  });
})(window);
