/**
 * Rules — registro central de "reglas rápidas" por juego.
 *
 * Cada juego (nuevo o existente) llama una vez a:
 *   GameHub.Rules.registerRules('mi-juego', {
 *     title: 'Mi Juego',
 *     intro: 'Una línea de contexto (opcional).',
 *     bullets: ['Regla 1', 'Regla 2', ...],
 *   });
 *
 * El hub (app.js) se encarga de inyectar un botón "?" en la barra
 * superior de cualquier juego que tenga reglas registradas, apenas se
 * monta — así ningún archivo *-ui.js necesita saber que este botón
 * existe ni dibujarlo él mismo.
 */
(function (global) {
  const RULES = {};

  function registerRules(id, data) {
    RULES[id] = data;
  }

  function getRules(id) {
    return RULES[id] || null;
  }

  function buildOverlay(gameId) {
    const data = RULES[gameId];
    if (!data) return null;
    const overlay = document.createElement('div');
    overlay.className = 'setup-overlay rules-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="panel setup-card rules-card">
        <h2>${data.title}</h2>
        ${data.intro ? `<p class="sub">${data.intro}</p>` : ''}
        <ul class="rules-list">${data.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        <div class="setup-actions"><button type="button" class="btn btn-primary rules-close">Entendido</button></div>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
    overlay.querySelector('.rules-close').addEventListener('click', () => { overlay.hidden = true; });
    document.body.appendChild(overlay);
    return overlay;
  }

  const RULES_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.3 9.3a2.7 2.7 0 0 1 5.2 1c0 1.7-2.5 2.1-2.5 3.7"/><circle cx="12" cy="17.3" r="0.7" fill="currentColor" stroke="none"/></svg>';

  /** Inserta el botón "?" en container .game-topbar .left, si el juego tiene reglas. */
  function attachRulesButton(container, gameId) {
    const data = RULES[gameId];
    const left = container.querySelector('.game-topbar .left');
    if (!left || !data) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn rules-btn';
    btn.title = 'Reglas rápidas';
    btn.setAttribute('aria-label', 'Ver reglas rápidas de ' + data.title);
    btn.innerHTML = RULES_ICON;
    left.appendChild(btn);
    let overlay = null;
    btn.addEventListener('click', () => {
      if (!overlay) overlay = buildOverlay(gameId);
      if (overlay) overlay.hidden = false;
    });
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.Rules = { registerRules, getRules, attachRulesButton };
})(window);
