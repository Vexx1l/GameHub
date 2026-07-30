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

  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    starOutline: '<path d="M12 3.5l2.47 5.36 5.78.55-4.36 3.98 1.28 5.86L12 16.2l-5.17 3.05 1.28-5.86-4.36-3.98 5.78-.55L12 3.5Z"/>',
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    compress: '<path d="M9 3v3a2 2 0 0 1-2 2H4M15 3v3a2 2 0 0 0 2 2h3M9 21v-3a2 2 0 0 0-2-2H4M15 21v-3a2 2 0 0 1 2-2h3"/>',
  };

  function normalize(str) {
    return (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function categoryOf(game) {
    return (game.tag || '').split('·')[0].trim();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const hubScreen = document.getElementById('screen-hub');
    const gameScreen = document.getElementById('screen-game');
    const shelfEl = document.getElementById('shelf');
    const statsEl = document.getElementById('hub-stats');
    const setupOverlay = document.getElementById('setup-overlay');
    const setupCard = document.getElementById('setup-card');
    const gameContainer = document.getElementById('game-container');
    const searchInput = document.getElementById('search-input');
    const chipsEl = document.getElementById('category-chips');
    const recentSection = document.getElementById('recent-section');
    const recentRow = document.getElementById('recent-row');
    const emptyState = document.getElementById('empty-state');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    const fullscreenIcon = document.getElementById('fullscreen-icon');

    let activeInstance = null;
    let searchTerm = '';
    let selectedCategory = 'todos';
    let favoritesOnly = false;

    function showHub() {
      hubScreen.classList.add('active');
      gameScreen.classList.remove('active');
      renderStats();
      renderRecent();
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

    // ---------- Filtros: búsqueda + categorías + favoritos ----------
    function getFilteredGames() {
      const games = global.GameHub.getGames();
      const term = normalize(searchTerm);
      return games.filter((g) => {
        if (favoritesOnly && !Storage.isFavorite(g.id)) return false;
        if (selectedCategory !== 'todos' && categoryOf(g) !== selectedCategory) return false;
        if (term && !normalize(g.name).includes(term) && !normalize(g.tagline).includes(term) && !normalize(g.tag).includes(term)) return false;
        return true;
      });
    }

    function renderChips() {
      const games = global.GameHub.getGames();
      const categories = Array.from(new Set(games.map(categoryOf))).sort();
      const chips = [
        { key: 'todos', label: 'Todos' },
        ...categories.map((c) => ({ key: c, label: c.charAt(0) + c.slice(1).toLowerCase() })),
      ];
      chipsEl.innerHTML = `
        <button type="button" class="chip fav-chip ${favoritesOnly ? 'active' : ''}" id="chip-favorites">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="${favoritesOnly ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICONS.starOutline}</svg>
          Favoritos
        </button>
        ${chips.map((c) => `<button type="button" class="chip ${selectedCategory === c.key ? 'active' : ''}" data-key="${c.key}">${c.label}</button>`).join('')}
      `;
      chipsEl.querySelector('#chip-favorites').addEventListener('click', () => {
        favoritesOnly = !favoritesOnly;
        renderChips();
        renderShelf();
      });
      chipsEl.querySelectorAll('.chip[data-key]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedCategory = btn.dataset.key;
          renderChips();
          renderShelf();
        });
      });
    }

    // ---------- Jugados recientemente ----------
    function renderRecent() {
      const recentIds = Storage.getRecent();
      const games = recentIds.map((id) => global.GameHub.getGame(id)).filter(Boolean);
      if (!games.length) {
        recentSection.hidden = true;
        return;
      }
      recentSection.hidden = false;
      recentRow.innerHTML = games.map((g) => `
        <div class="recent-card" data-id="${g.id}" tabindex="0" role="button" aria-label="Jugar ${g.name}">
          <div class="recent-icon">${g.icon}</div>
          <span>${g.name}</span>
        </div>
      `).join('');
      recentRow.querySelectorAll('.recent-card').forEach((card) => {
        const open = () => openSetup(card.dataset.id);
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
    }

    // ---------- Estantería principal ----------
    function renderShelf() {
      const games = getFilteredGames();
      emptyState.hidden = games.length > 0;
      shelfEl.innerHTML = games.map((g) => {
        const fav = Storage.isFavorite(g.id);
        return `
        <div class="game-box" data-id="${g.id}" tabindex="0" role="button" aria-label="Configurar ${g.name}">
          <button type="button" class="fav-btn ${fav ? 'active' : ''}" data-fav-id="${g.id}" aria-label="${fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-pressed="${fav}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICONS.starOutline}</svg>
          </button>
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
      `;
      }).join('');

      shelfEl.querySelectorAll('.game-box').forEach((box) => {
        const open = () => openSetup(box.dataset.id);
        box.addEventListener('click', open);
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
      shelfEl.querySelectorAll('.fav-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          Storage.toggleFavorite(btn.dataset.favId);
          if (favoritesOnly) renderShelf(); else {
            const nowFav = Storage.isFavorite(btn.dataset.favId);
            btn.classList.toggle('active', nowFav);
            btn.setAttribute('aria-pressed', String(nowFav));
            btn.setAttribute('aria-label', nowFav ? 'Quitar de favoritos' : 'Agregar a favoritos');
            btn.querySelector('svg').setAttribute('fill', nowFav ? 'currentColor' : 'none');
          }
        });
        btn.addEventListener('keydown', (e) => e.stopPropagation());
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
      Storage.addRecent(game.id);
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

    // ---------- Buscador en tiempo real ----------
    let searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const value = e.target.value;
      searchDebounce = setTimeout(() => {
        searchTerm = value;
        renderShelf();
      }, 120);
    });

    // ---------- Modo oscuro / claro ----------
    function applyThemeIcon(theme) {
      const isLight = theme === 'light';
      themeIcon.innerHTML = isLight ? ICONS.moon : ICONS.sun;
      themeToggle.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    }
    function setTheme(theme) {
      if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      Storage.setTheme(theme);
      applyThemeIcon(theme);
    }
    themeToggle.addEventListener('click', () => {
      const current = Storage.getTheme();
      setTheme(current === 'light' ? 'dark' : 'light');
    });
    applyThemeIcon(Storage.getTheme());

    // ---------- Pantalla completa ----------
    const fsEl = document.documentElement;
    const fsSupported = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function applyFullscreenIcon() {
      fullscreenIcon.innerHTML = isFullscreen() ? ICONS.compress : ICONS.expand;
      fullscreenToggle.setAttribute('aria-label', isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa');
    }
    if (fsSupported) {
      fullscreenToggle.hidden = false;
      fullscreenToggle.addEventListener('click', () => {
        if (isFullscreen()) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          const result = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl);
          if (result && result.catch) result.catch(() => {});
        }
      });
      document.addEventListener('fullscreenchange', applyFullscreenIcon);
      document.addEventListener('webkitfullscreenchange', applyFullscreenIcon);
      applyFullscreenIcon();
    }

    renderChips();
    renderShelf();
    showHub();
  });
})(window);
