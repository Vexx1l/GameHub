/**
 * Storage — envoltorio sobre localStorage con espacio de nombres propio,
 * para no chocar con otras apps si el hub se sirve desde el mismo dominio.
 */
(function (global) {
  const NS = 'noche-de-juegos:';

  const Storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
      } catch (e) {
        /* almacenamiento no disponible (modo privado, cuota, etc.) — se ignora */
      }
    },
    remove(key) {
      try { localStorage.removeItem(NS + key); } catch (e) { /* no-op */ }
    },

    /** Suma victorias/derrotas por juego para mostrarlas en el encabezado del hub */
    recordResult(gameId, outcome) {
      const stats = Storage.get('stats', {});
      if (!stats[gameId]) stats[gameId] = { partidas: 0, victoriasHumano: 0 };
      stats[gameId].partidas += 1;
      if (outcome === 'human-win') stats[gameId].victoriasHumano += 1;
      Storage.set('stats', stats);
      if (global.GameHub.Haptics) {
        global.GameHub.Haptics.vibrate(outcome === 'human-win' ? 'win' : 'lose');
      }
      return stats;
    },

    // ---------- Favoritos ----------
    getFavorites() {
      return Storage.get('favorites', []);
    },
    isFavorite(gameId) {
      return Storage.getFavorites().includes(gameId);
    },
    toggleFavorite(gameId) {
      const favs = Storage.getFavorites();
      const idx = favs.indexOf(gameId);
      if (idx === -1) favs.push(gameId); else favs.splice(idx, 1);
      Storage.set('favorites', favs);
      return favs.includes(gameId);
    },

    // ---------- Jugados recientemente ----------
    getRecent() {
      return Storage.get('recent', []);
    },
    addRecent(gameId) {
      const MAX = 8;
      let recent = Storage.getRecent().filter((id) => id !== gameId);
      recent.unshift(gameId);
      recent = recent.slice(0, MAX);
      Storage.set('recent', recent);
      return recent;
    },

    // ---------- Tema (oscuro/claro) ----------
    getTheme() {
      return Storage.get('theme', 'dark');
    },
    setTheme(theme) {
      Storage.set('theme', theme);
    },

    // ---------- Skin de tablero (aplica a todos los juegos con tablero) ----------
    getBoardSkin() {
      return Storage.get('board-skin', 'clasico');
    },
    setBoardSkin(skin) {
      Storage.set('board-skin', skin);
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Storage = Storage;
})(window);
