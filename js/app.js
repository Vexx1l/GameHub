(function (global) {
  const Storage = global.GameHub.Storage;
  const PLAYER_PALETTE = [
    { hex: 'var(--player-red)', name: 'Rojo' },
    { hex: 'var(--player-green)', name: 'Verde' },
    { hex: 'var(--player-yellow)', name: 'Amarillo' },
    { hex: 'var(--player-blue)', name: 'Azul' },
    { hex: 'var(--player-purple)', name: 'Morado' },
    { hex: 'var(--player-teal)', name: 'Verde azulado' },
    { hex: 'var(--player-orange)', name: 'Naranja' },
    { hex: 'var(--player-pink)', name: 'Rosado' },
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const hubScreen = document.getElementById('screen-hub');
    const gameScreen = document.getElementById('screen-game');
    const shelfEl = document.getElementById('shelf');
    const statsEl = document.getElementById('hub-stats');
    const setupOverlay = document.getElementById('setup-overlay');
    const setupCard = document.getElementById('setup-card');
    const gameContainer = document.getElementById('game-container');

    let activeInstance = null;

    function showHub() {
      hubScreen.classList.add('active');
      gameScreen.classList.remove('active');
      renderStats();
    }

    function showGame() {
      hubScreen.classList.remove('active');
      gameScreen.classList.add('active');
    }

    function renderStats() {
      const stats = Storage.get('stats', {});
      const totals = Object.values(stats).reduce(
        (acc, s) => ({ partidas: acc.partidas + s.partidas, victorias: acc.victorias + s.victoriasHumano }),
        { partidas: 0, victorias: 0 },
      );
      statsEl.innerHTML = `
        <div class="stat"><b>${totals.partidas}</b><span>Partidas jugadas</span></div>
        <div class="stat"><b>${totals.victorias}</b><span>Victorias tuyas</span></div>
      `;
    }

    function renderShelf() {
      const games = global.GameHub.getGames();
      shelfEl.innerHTML = games.map((g) => `
        <div class="game-box" data-id="${g.id}" tabindex="0" role="button" aria-label="Configurar ${g.name}">
          <div>
            <div class="box-icon">${g.icon}</div>
            <h2>${g.name}</h2>
            <p>${g.tagline}</p>
          </div>
          <div class="box-footer">
            <span class="box-tag">${g.tag}</span>
            <span class="pill">Jugar →</span>
          </div>
        </div>
      `).join('');

      shelfEl.querySelectorAll('.game-box').forEach((box) => {
        const open = () => openSetup(box.dataset.id);
        box.addEventListener('click', open);
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
    }

    // ---------- Panel de configuración ----------
    function buildSeatsForCount(game, count) {
      if (game.seatSpec.fixed) {
        return game.seatSpec.seats.map((s, i) => ({
          id: s.color, color: s.color, label: s.label, hex: s.hex,
          type: i === 0 ? 'human' : 'bot', difficulty: 'normal',
        }));
      }
      const seats = [];
      for (let i = 0; i < count; i++) {
        seats.push({
          id: `p${i + 1}`, label: `Jugador ${i + 1}`, hex: PLAYER_PALETTE[i % PLAYER_PALETTE.length].hex,
          type: i === 0 ? 'human' : 'bot', difficulty: 'normal',
        });
      }
      return seats;
    }

    function openSetup(gameId) {
      const game = global.GameHub.getGame(gameId);

      // Los juegos de casino (ruleta, tragamonedas) son 1 jugador contra la casa:
      // no tiene sentido el panel de "humano/bot", así que se entra directo a la mesa.
      if (game.casino) {
        launchGame(game, [{ id: 'tu', label: 'Tú', hex: 'var(--gold-500)', type: 'human' }], 650);
        return;
      }

      let seatCount = game.seatSpec.fixed ? game.seatSpec.seats.length : game.seatSpec.allowedCounts[0];
      let seats = buildSeatsForCount(game, seatCount);
      let spectator = false;

      function renderCard() {
        setupCard.innerHTML = `
          <h2>${game.name}</h2>
          <p class="sub">Elige quién controla cada asiento antes de empezar.</p>
          ${!game.seatSpec.fixed ? `
            <div class="setup-field">
              <label for="seat-count">Número de jugadores</label>
              <select id="seat-count">
                ${game.seatSpec.allowedCounts.map((n) => `<option value="${n}" ${n === seatCount ? 'selected' : ''}>${n} jugador${n === 1 ? '' : 'es'}</option>`).join('')}
              </select>
            </div>` : ''}
          <div class="setup-field">
            <label>
              <input type="checkbox" id="spectator-toggle" ${spectator ? 'checked' : ''}>
              Modo espectador — que solo jueguen los bots
            </label>
          </div>
          <div id="seat-rows"></div>
          <div class="setup-field">
            <label for="bot-speed">Velocidad de los bots</label>
            <input type="range" id="bot-speed" min="150" max="1600" step="50" value="650">
          </div>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="setup-cancel">Cancelar</button>
            <button class="btn btn-primary" id="setup-start">Jugar</button>
          </div>
        `;
        renderSeatRows();

        if (!game.seatSpec.fixed) {
          setupCard.querySelector('#seat-count').addEventListener('change', (e) => {
            seatCount = Number(e.target.value);
            seats = buildSeatsForCount(game, seatCount);
            renderSeatRows();
          });
        }
        setupCard.querySelector('#spectator-toggle').addEventListener('change', (e) => {
          spectator = e.target.checked;
          if (spectator) seats.forEach((s) => { s.type = 'bot'; });
          renderSeatRows();
        });
        setupCard.querySelector('#setup-cancel').addEventListener('click', closeSetup);
        setupCard.querySelector('#setup-start').addEventListener('click', () => {
          const speed = Number(setupCard.querySelector('#bot-speed').value);
          closeSetup();
          launchGame(game, seats, speed);
        });
      }

      function renderSeatRows() {
        const rowsEl = setupCard.querySelector('#seat-rows');
        rowsEl.innerHTML = seats.map((s, i) => `
          <div class="seat-row" data-index="${i}">
            <span class="swatch" style="background:${s.hex}"></span>
            <span class="seat-name">${s.label}</span>
            <div class="seat-toggle" data-index="${i}">
              <button data-type="human" class="${s.type === 'human' ? 'active' : ''}" ${spectator ? 'disabled' : ''}>Humano</button>
              <button data-type="bot" class="${s.type === 'bot' ? 'active' : ''}">Bot</button>
            </div>
            ${s.type === 'bot' ? `
              <select class="difficulty-select" data-index="${i}">
                <option value="facil" ${s.difficulty === 'facil' ? 'selected' : ''}>Fácil</option>
                <option value="normal" ${s.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="dificil" ${s.difficulty === 'dificil' ? 'selected' : ''}>Difícil</option>
              </select>` : ''}
          </div>
        `).join('');

        rowsEl.querySelectorAll('.seat-toggle button').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.parentElement.dataset.index);
            seats[idx].type = btn.dataset.type;
            renderSeatRows();
          });
        });
        rowsEl.querySelectorAll('.difficulty-select').forEach((sel) => {
          sel.addEventListener('change', (e) => {
            const idx = Number(sel.dataset.index);
            seats[idx].difficulty = e.target.value;
          });
        });
      }

      renderCard();
      setupOverlay.hidden = false;
    }

    function closeSetup() {
      setupOverlay.hidden = true;
    }

    function launchGame(game, seats, speed) {
      showGame();
      gameContainer.className = `screen-inner game-${game.id}`;
      activeInstance = game.mount(gameContainer, {
        seats,
        speed,
        onExit: () => {
          if (activeInstance && activeInstance.destroy) activeInstance.destroy();
          activeInstance = null;
          gameContainer.innerHTML = '';
          showHub();
        },
      });
    }

    setupOverlay.addEventListener('click', (e) => {
      if (e.target === setupOverlay) closeSetup();
    });

    renderShelf();
    showHub();
  });
})(window);
