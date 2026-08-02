/**
 * Haptics — vibración háptica configurable (Storage: 'haptics-mode').
 *
 * Modos:
 *   'off'       — nunca vibra.
 *   'clave'     — solo en eventos importantes (ganar/perder una partida,
 *                 aciertos/errores clave). Este es el modo por defecto.
 *   'frecuente' — además, un pequeño "tap" en casi cualquier botón o
 *                 casilla tocada en toda la app (incluida la estantería
 *                 del hub), para que se sienta más "físico".
 *
 * Los juegos no necesitan saber en qué modo está el usuario: solo llaman
 * a GameHub.Haptics.vibrate('win' | 'lose' | 'success' | 'error' | 'tap' | ...)
 * en el momento indicado, y este módulo decide si corresponde vibrar.
 *
 * Si el navegador no soporta la Vibration API (la mayoría de iPhones,
 * por ejemplo), todo esto es un no-op silencioso.
 */
(function (global) {
  const SUPPORTED = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  const PATTERNS = {
    tap: 10,
    move: 14,
    select: 18,
    success: [18, 40, 18],
    error: [30, 30, 30],
    win: [20, 30, 20, 30, 70],
    lose: [50, 45, 50],
  };

  // Estos tipos solo vibran en modo "frecuente" (interacción cotidiana).
  const FREQUENT_ONLY = new Set(['tap', 'move', 'select']);

  function Storage() { return global.GameHub.Storage; }

  function getMode() {
    return Storage() ? Storage().get('haptics-mode', 'clave') : 'clave';
  }

  function setMode(mode) {
    if (Storage()) Storage().set('haptics-mode', mode);
  }

  function fire(pattern) {
    if (!SUPPORTED) return;
    try { navigator.vibrate(pattern); } catch (e) { /* modo privado, permisos, etc. */ }
  }

  function vibrate(type) {
    const mode = getMode();
    if (mode === 'off') return;
    if (FREQUENT_ONLY.has(type) && mode !== 'frecuente') return;
    fire(PATTERNS[type] || PATTERNS.tap);
  }

  // Toque genérico en toda la app (estantería, chips, botones) cuando el
  // modo elegido es "frecuente" — así no hace falta tocar cada juego uno
  // por uno para que la vibración cotidiana funcione en todos lados.
  document.addEventListener('click', (e) => {
    if (getMode() !== 'frecuente') return;
    const target = e.target.closest('button, .game-box, .chip, .recent-card, [role="button"]');
    if (target && !target.disabled) vibrate('tap');
  }, true);

  global.GameHub = global.GameHub || {};
  global.GameHub.Haptics = { vibrate, getMode, setMode, isSupported: () => SUPPORTED };
})(window);
