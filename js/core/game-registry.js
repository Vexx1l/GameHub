/**
 * GameRegistry — patrón de plugin.
 *
 * Cada juego se registra a sí mismo llamando a:
 *
 *   GameHub.registerGame({
 *     id: 'mi-juego',
 *     name: 'Mi Juego',
 *     tagline: 'Descripción corta',
 *     tag: 'CLÁSICO',
 *     icon: '<svg>...</svg>',      // string SVG, se inyecta tal cual
 *     minSeats: 2,
 *     maxSeats: 4,
 *     seatColors: ['#d64545', '#3e9142', '#e0b93d', '#3e6fb0'],
 *     // mount(container, config) debe devolver un objeto con .destroy()
 *     mount(container, config) { ... }
 *   });
 *
 * El hub (app.js) sólo conoce esta lista; no tiene ninguna referencia
 * directa a Parqués ni a Dominó. Así, agregar un juego nuevo es
 * cuestión de crear su carpeta en js/games/<juego>/ y sumar su script
 * en index.html — el hub lo detecta solo.
 */
(function (global) {
  const games = [];

  function registerGame(def) {
    if (!def || !def.id) throw new Error('registerGame: falta "id"');
    if (games.some((g) => g.id === def.id)) {
      console.warn(`GameHub: el juego "${def.id}" ya estaba registrado, se reemplaza.`);
      const idx = games.findIndex((g) => g.id === def.id);
      games.splice(idx, 1);
    }
    games.push(def);
  }

  function getGames() {
    return games.slice();
  }

  function getGame(id) {
    return games.find((g) => g.id === id) || null;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame = registerGame;
  global.GameHub.getGames = getGames;
  global.GameHub.getGame = getGame;
})(window);
