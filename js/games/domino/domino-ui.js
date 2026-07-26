(function (global) {
  const DominoEngine = global.GameHub.DominoEngine;
  const DominoBot = global.GameHub.DominoBot;

  function tileHTML(tile, extraClass) {
    const [a, b] = tile;
    const isDouble = a === b;
    return `<div class="domino-tile ${extraClass || ''} ${isDouble ? 'is-double' : ''}">
      <span class="half">${a}</span><span class="div"></span><span class="half">${b}</span>
    </div>`;
  }

  function mount(container, config) {
    const seats = config.seats; // [{id,label,color,hex,type,difficulty}]
    const engine = new DominoEngine(seats);
    const spectatorMode = seats.every((s) => s.type === 'bot');
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:domino', delay: 3000 });
    let botTimer = null;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Dominó</h2>
        </div>
        <div class="speed-control">
          <label class="pill" for="do-speed">Velocidad bots</label>
          <input type="range" id="do-speed" min="150" max="1600" step="50" value="${config.speed || 650}">
        </div>
      </div>
      <div class="domino-layout">
        <div class="panel domino-hands" id="do-hands"></div>
        <div class="panel domino-table">
          <div class="table-ends" id="do-ends"></div>
          <div class="domino-board" id="do-board"></div>
          <div class="turn-indicator" id="do-turn"></div>
          <div class="move-list" id="do-moves"></div>
        </div>
        <div class="panel domino-side">
          <h3>Puntajes</h3>
          <div id="do-scores"></div>
          <div class="log" id="do-log" aria-live="polite"></div>
        </div>
      </div>
      <div class="setup-overlay" id="do-round-end" hidden>
        <div class="panel setup-card" id="do-round-card"></div>
      </div>
    `;

    const handsEl = container.querySelector('#do-hands');
    const endsEl = container.querySelector('#do-ends');
    const boardEl = container.querySelector('#do-board');
    const turnEl = container.querySelector('#do-turn');
    const movesEl = container.querySelector('#do-moves');
    const scoresEl = container.querySelector('#do-scores');
    const logEl = container.querySelector('#do-log');
    const speedInput = container.querySelector('#do-speed');
    const roundEndOverlay = container.querySelector('#do-round-end');
    const roundEndCard = container.querySelector('#do-round-card');

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

    function renderHands() {
      handsEl.innerHTML = seats.map((s) => {
        const hand = engine.hands[s.id];
        const reveal = s.type === 'human' || spectatorMode;
        const tilesHTML = reveal
          ? hand.map((t) => tileHTML(t)).join('')
          : hand.map(() => '<div class="domino-tile tile-back"></div>').join('');
        return `
          <div class="hand-block ${engine.currentSeat.id === s.id ? 'is-active' : ''}">
            <div class="hand-label"><span class="swatch" style="background:${s.hex}"></span>${s.label} <span class="pill">${hand.length} fichas</span></div>
            <div class="hand-tiles">${tilesHTML}</div>
          </div>`;
      }).join('');
    }

    function renderBoard() {
      if (!engine.board.length) {
        boardEl.innerHTML = '<p class="empty-hint">La mesa está vacía — se espera la primera ficha.</p>';
        endsEl.innerHTML = '';
        return;
      }
      boardEl.innerHTML = engine.board.map((t) => tileHTML([t.left, t.right], 'on-board')).join('');
      endsEl.innerHTML = `
        <span class="pill">Extremo izquierdo: <b class="mono">${engine.leftEnd()}</b></span>
        <span class="pill">Extremo derecho: <b class="mono">${engine.rightEnd()}</b></span>
      `;
    }

    function renderTurn() {
      const seat = engine.currentSeat;
      turnEl.innerHTML = `<span class="swatch" style="background:${seat.hex}"></span> Turno de <b>${seat.label}</b> ${seat.type === 'bot' ? '(Bot)' : ''}`;
    }

    function clearMoves() { movesEl.innerHTML = ''; }

    function showHumanTurn() {
      clearMoves();
      const seatId = engine.currentSeat.id;
      let moves = engine.getAvailableMoves(seatId);
      if (!moves.length && engine.boneyard.length) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = `Robar del pozo (${engine.boneyard.length} fichas)`;
        btn.addEventListener('click', () => {
          engine.drawUntilPlayable(seatId);
          renderHands();
          showHumanTurn();
        });
        movesEl.appendChild(btn);
        return;
      }
      if (!moves.length) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-danger';
        btn.textContent = 'Pasar turno';
        btn.addEventListener('click', () => engine.pass(seatId));
        movesEl.appendChild(btn);
        return;
      }
      moves.forEach((m) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost move-btn';
        const sideLabel = engine.board.length === 0 ? '' : (m.side === 'left' ? ' · lado izquierdo' : ' · lado derecho');
        btn.innerHTML = `${tileHTML(m.tile)} <span>${sideLabel || 'Primera ficha'}</span>`;
        btn.addEventListener('click', () => {
          clearMoves();
          engine.playMove(seatId, m);
        });
        movesEl.appendChild(btn);
      });
    }

    function scheduleBotTurn() {
      clearTimeout(botTimer);
      const delay = Number(speedInput.value);
      botTimer = setTimeout(() => {
        if (destroyed) return;
        const seat = engine.currentSeat;
        const seatId = seat.id;
        let moves = engine.getAvailableMoves(seatId);
        if (!moves.length && engine.boneyard.length) {
          engine.drawUntilPlayable(seatId);
          renderHands();
          moves = engine.getAvailableMoves(seatId);
        }
        if (!moves.length) {
          engine.pass(seatId);
          return;
        }
        const move = DominoBot.chooseMove(engine, seatId, moves, seat.difficulty || 'normal');
        engine.playMove(seatId, move);
      }, delay);
    }

    function handleTurnStart() {
      renderTurn();
      renderHands();
      clearMoves();
      if (engine.roundOver) return;
      const seat = engine.currentSeat;
      if (seat.type === 'bot') {
        scheduleBotTurn();
      } else {
        showHumanTurn();
      }
    }

    engine.bus.on('turn-changed', handleTurnStart);
    engine.bus.on('drew-tiles', ({ seatId, count }) => log(`${seatById(seatId).label} robó ${count} ficha(s) del pozo.`));
    engine.bus.on('passed', ({ seatId }) => log(`${seatById(seatId).label} no tiene jugada y pasa.`));
    engine.bus.on('move-played', ({ seatId, move }) => {
      log(`${seatById(seatId).label} jugó [${move.tile[0]}|${move.tile[1]}].`);
      renderBoard();
      renderHands();
    });
    engine.bus.on('round-ended', ({ type, winnerId, pointsWon, scores }) => {
      renderScores();
      const winnerLabel = seatById(winnerId).label;
      log(type === 'domino'
        ? `¡${winnerLabel} hizo dominó y ganó la ronda! (+${pointsWon} puntos)`
        : `Mesa cerrada — ${winnerLabel} tenía menos puntos y gana la ronda. (+${pointsWon} puntos)`);

      const humanSeats = seats.filter((s) => s.type === 'human');
      const humanWon = humanSeats.some((s) => s.id === winnerId);
      global.GameHub.Storage.recordResult('domino', humanWon ? 'human-win' : 'bot-win');

      roundEndCard.innerHTML = `
        <h2>Ronda terminada</h2>
        <p class="sub">${type === 'domino' ? `${winnerLabel} vació su mano` : 'Mesa cerrada (nadie podía jugar)'} · +${pointsWon} puntos para ${winnerLabel}</p>
        <div id="do-round-scores"></div>
        <div class="setup-actions">
          <button class="btn btn-ghost" id="do-exit">Volver al hub</button>
          <button class="btn btn-primary" id="do-next">Jugar otra ronda</button>
        </div>
        <div class="autoplay-row" id="do-autoplay"></div>
      `;
      roundEndCard.querySelector('#do-round-scores').innerHTML = seats.map((s) => `
        <div class="seat-row">
          <span class="swatch" style="background:${s.hex}"></span>
          <span class="seat-name">${s.label}</span>
          <span class="mono">${scores[s.id]} pts</span>
        </div>`).join('');
      roundEndOverlay.hidden = false;

      const startNextRound = () => {
        roundEndOverlay.hidden = true;
        engine.startRound();
        renderBoard();
        renderScores();
        handleTurnStart();
      };
      roundEndCard.querySelector('#do-exit').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });
      roundEndCard.querySelector('#do-next').addEventListener('click', () => { autoplay.cancel(); startNextRound(); });
      const autoplayHost = roundEndCard.querySelector('#do-autoplay');
      autoplay.renderToggle(autoplayHost, {
        label: 'Auto-jugar rondas seguidas',
        onChange: (enabled) => { if (enabled) autoplay.arm(autoplayHost, startNextRound); },
      });
      autoplay.arm(autoplayHost, startNextRound);
    });

    container.querySelector('.back-btn').addEventListener('click', () => config.onExit());

    renderScores();
    renderBoard();
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
    id: 'domino',
    name: 'Dominó',
    tagline: 'Ficha doble-seis clásica, mesa cerrada o con pozo para robar.',
    tag: 'CLÁSICO · 2 O 4 JUGADORES',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="44" height="28" rx="6" fill="#1B3327" stroke="#F6EFDD" stroke-opacity="0.2"/>
      <line x1="28" y1="14" x2="28" y2="42" stroke="#F6EFDD" stroke-opacity="0.3"/>
      <circle cx="16" cy="22" r="2.4" fill="var(--gold-500)"/>
      <circle cx="16" cy="34" r="2.4" fill="var(--gold-500)"/>
      <circle cx="40" cy="20" r="2.4" fill="var(--gold-500)"/>
      <circle cx="40" cy="28" r="2.4" fill="var(--gold-500)"/>
      <circle cx="40" cy="36" r="2.4" fill="var(--gold-500)"/>
    </svg>`,
    seatSpec: { fixed: false, allowedCounts: [2, 4] },
    mount,
  });
})(window);
