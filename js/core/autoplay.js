/**
 * Autoplay — helper reutilizable para "jugar muchas veces seguidas
 * sin confirmar cada vez".
 *
 * Cada juego crea su propia instancia con GameHub.createAutoplay({...}),
 * pinta un checkbox con renderToggle(host) en cualquier panel (fin de
 * ronda, barra superior, etc.) y, cuando termina una partida/ronda,
 * llama a autoplay.arm(host, callback) — si el checkbox está marcado,
 * se muestra una cuenta regresiva y luego se dispara `callback()` solo;
 * si no está marcado, no pasa nada y el jugador decide cuándo seguir.
 *
 * La preferencia (marcado o no) se recuerda por juego en localStorage.
 */
(function (global) {
  function createAutoplay({ storageKey, delay = 2500 } = {}) {
    const Storage = global.GameHub.Storage;
    let enabled = Storage.get(storageKey, false);
    let timer = null;
    let tickInterval = null;

    function isEnabled() {
      return enabled;
    }

    function setEnabled(v) {
      enabled = v;
      Storage.set(storageKey, enabled);
      if (!enabled) cancel();
    }

    /** Pinta el checkbox + espacio para la cuenta regresiva dentro de hostEl. */
    function renderToggle(hostEl, opts = {}) {
      const label = opts.label || 'Auto-jugar seguido';
      hostEl.innerHTML = `
        <label class="autoplay-toggle">
          <input type="checkbox" class="autoplay-check" ${enabled ? 'checked' : ''}>
          <span>${label}</span>
        </label>
        <span class="autoplay-countdown" aria-live="polite"></span>
      `;
      hostEl.querySelector('.autoplay-check').addEventListener('change', (e) => {
        setEnabled(e.target.checked);
        if (opts.onChange) opts.onChange(enabled);
      });
    }

    function cancel() {
      clearTimeout(timer);
      timer = null;
      clearInterval(tickInterval);
      tickInterval = null;
    }

    /**
     * Si autoplay está activo, espera `ms` (o el delay por defecto) mostrando
     * una cuenta regresiva dentro de hostEl y luego llama a callback().
     * El jugador puede hacer clic en la cuenta regresiva para cancelarla.
     */
    function arm(hostEl, callback, ms) {
      cancel();
      if (!enabled) return;
      const total = ms || delay;
      let remaining = Math.ceil(total / 1000);
      const countdownEl = hostEl ? hostEl.querySelector('.autoplay-countdown') : null;
      const paint = () => {
        if (!countdownEl) return;
        countdownEl.textContent = remaining > 0 ? `Siguiente en ${remaining}s… (clic para cancelar)` : '';
      };
      paint();
      if (countdownEl) {
        countdownEl.style.cursor = 'pointer';
        countdownEl.onclick = () => { cancel(); countdownEl.textContent = ''; };
      }
      tickInterval = setInterval(() => {
        remaining -= 1;
        paint();
      }, 1000);
      timer = setTimeout(() => {
        cancel();
        callback();
      }, total);
    }

    return { isEnabled, setEnabled, renderToggle, arm, cancel };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.createAutoplay = createAutoplay;
})(window);
