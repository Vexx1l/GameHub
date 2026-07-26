// Service Worker de "Noche de Juegos"
// Cachea todos los archivos del hub para que funcione offline
// y pueda instalarse como app.

const CACHE_NAME = "noche-de-juegos-v5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/ahorcado.css",
  "./css/base.css",
  "./css/bingo.css",
  "./css/blackjack.css",
  "./css/casino.css",
  "./css/domino.css",
  "./css/generala.css",
  "./css/hub.css",
  "./css/naipes.css",
  "./css/parques.css",
  "./css/penales.css",
  "./css/quiniela.css",
  "./css/rummikub.css",
  "./css/sietezero.css",
  "./css/tokens.css",
  "./css/trivia.css",
  "./css/uno.css",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./js/app.js",
  "./js/core/autoplay.js",
  "./js/core/dice.js",
  "./js/core/event-bus.js",
  "./js/core/game-registry.js",
  "./js/core/storage.js",
  "./js/games/ahorcado/ahorcado-bot.js",
  "./js/games/ahorcado/ahorcado-engine.js",
  "./js/games/ahorcado/ahorcado-ui.js",
  "./js/games/bingo/bingo-engine.js",
  "./js/games/bingo/bingo-ui.js",
  "./js/games/blackjack/blackjack-bot.js",
  "./js/games/blackjack/blackjack-engine.js",
  "./js/games/blackjack/blackjack-ui.js",
  "./js/games/domino/domino-bot.js",
  "./js/games/domino/domino-engine.js",
  "./js/games/domino/domino-ui.js",
  "./js/games/generala/generala-bot.js",
  "./js/games/generala/generala-engine.js",
  "./js/games/generala/generala-ui.js",
  "./js/games/naipes/naipes-bot.js",
  "./js/games/naipes/naipes-engine.js",
  "./js/games/naipes/naipes-ui.js",
  "./js/games/parques/board-data.js",
  "./js/games/parques/parques-bot.js",
  "./js/games/parques/parques-engine.js",
  "./js/games/parques/parques-ui.js",
  "./js/games/penales/penales-bot.js",
  "./js/games/penales/penales-engine.js",
  "./js/games/penales/penales-ui.js",
  "./js/games/quiniela/quiniela-bot.js",
  "./js/games/quiniela/quiniela-engine.js",
  "./js/games/quiniela/quiniela-ui.js",
  "./js/games/rummikub/rummikub-bot.js",
  "./js/games/rummikub/rummikub-engine.js",
  "./js/games/rummikub/rummikub-ui.js",
  "./js/games/ruleta/ruleta-engine.js",
  "./js/games/ruleta/ruleta-ui.js",
  "./js/games/sietezero/sietezero-data.js",
  "./js/games/sietezero/sietezero-engine.js",
  "./js/games/sietezero/sietezero-missions.js",
  "./js/games/sietezero/sietezero-ui.js",
  "./js/games/tragamonedas/tragamonedas-engine.js",
  "./js/games/tragamonedas/tragamonedas-ui.js",
  "./js/games/trivia/trivia-bot.js",
  "./js/games/trivia/trivia-engine.js",
  "./js/games/trivia/trivia-ui.js",
  "./js/games/uno/uno-bot.js",
  "./js/games/uno/uno-engine.js",
  "./js/games/uno/uno-ui.js"
];

// Instala el SW y precachea todos los archivos del juego
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Limpia caches viejos cuando se actualiza la app
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: cache-first, con fallback a red y actualización en segundo plano
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
