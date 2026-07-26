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
      return stats;
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Storage = Storage;
})(window);
