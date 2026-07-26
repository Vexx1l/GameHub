(function (global) {
  const RuletaEngine = global.GameHub.RuletaEngine;
  const colorOf = global.GameHub.ruletaColorOf;

  const CHIP_VALUES = [10, 25, 50, 100, 500];
  const COLOR_LABEL = { red: 'Rojo', black: 'Negro', green: 'Cero' };

  function mount(container, config) {
    const engine = new RuletaEngine();
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:ruleta', delay: 2200 });
    let selectedChip = 25;
    let spinning = false;
    let destroyed = false;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Ruleta</h2>
        </div>
        <div class="ru-balance-box">
          <b id="ru-balance">0</b>
          <span>fichas · en juego: <span id="ru-staked">0</span></span><br>
          <button class="ru-reset-link" id="ru-reset">Reponer fichas (1000)</button>
        </div>
      </div>
      <div class="ru-layout">
        <div class="panel ru-top">
          <div class="ru-wheel-wrap">
            <div class="ru-wheel" id="ru-wheel"></div>
            <div class="ru-result-badge is-empty" id="ru-badge">—</div>
            <div>
              <p class="sub" style="margin-bottom:6px;color:var(--ink-300);font-size:0.8rem;">Últimos números</p>
              <div class="ru-history" id="ru-history"></div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="ru-table" id="ru-table"></div>
          <div class="ru-dozens" id="ru-dozens"></div>
          <div class="ru-outside-row" id="ru-outside"></div>
        </div>

        <div class="panel ru-controls">
          <div class="ru-chips" id="ru-chips"></div>
          <div class="ru-actions">
            <button class="btn btn-ghost" id="ru-clear">Limpiar apuestas</button>
            <button class="btn btn-primary" id="ru-spin">Girar</button>
          </div>
        </div>
        <p class="ru-msg" id="ru-msg"></p>
        <div class="panel" style="padding: var(--space-3) var(--space-4);">
          <div class="autoplay-row" id="ru-autoplay" style="border-top:none;margin-top:0;padding-top:0;"></div>
        </div>
      </div>
    `;

    const balanceEl = container.querySelector('#ru-balance');
    const stakedEl = container.querySelector('#ru-staked');
    const wheelEl = container.querySelector('#ru-wheel');
    const badgeEl = container.querySelector('#ru-badge');
    const historyEl = container.querySelector('#ru-history');
    const tableEl = container.querySelector('#ru-table');
    const dozensEl = container.querySelector('#ru-dozens');
    const outsideEl = container.querySelector('#ru-outside');
    const chipsEl = container.querySelector('#ru-chips');
    const clearBtn = container.querySelector('#ru-clear');
    const spinBtn = container.querySelector('#ru-spin');
    const msgEl = container.querySelector('#ru-msg');
    const resetBtn = container.querySelector('#ru-reset');
    const autoplayHost = container.querySelector('#ru-autoplay');

    function cellKey(type, value) { return `${type}:${value}`; }

    function buildTable() {
      let html = `<button class="ru-cell ru-zero" style="grid-column:1; grid-row:1 / span 3;" data-type="number" data-value="0">0<span class="chip-badge" data-cell="${cellKey('number', 0)}"></span></button>`;
      for (let c = 0; c < 12; c++) {
        const colNumbers = [3 * c + 1, 3 * c + 2, 3 * c + 3]; // [abajo, medio, arriba]
        [2, 1, 0].forEach((idx, rowIdx) => {
          const n = colNumbers[idx];
          html += `<button class="ru-cell ru-num ru-${colorOf(n)}" style="grid-column:${c + 2}; grid-row:${rowIdx + 1};" data-type="number" data-value="${n}">${n}<span class="chip-badge" data-cell="${cellKey('number', n)}"></span></button>`;
        });
      }
      [0, 1, 2].forEach((rowIdx) => {
        const colValue = 3 - rowIdx;
        html += `<button class="ru-cell ru-col" style="grid-column:14; grid-row:${rowIdx + 1};" data-type="column" data-value="${colValue}">2 a 1<span class="chip-badge" data-cell="${cellKey('column', colValue)}"></span></button>`;
      });
      tableEl.innerHTML = html;

      dozensEl.innerHTML = [1, 2, 3].map((d) => `
        <button class="ru-cell ru-outside" data-type="dozen" data-value="${d}">${d === 1 ? '1ª docena (1-12)' : d === 2 ? '2ª docena (13-24)' : '3ª docena (25-36)'}<span class="chip-badge" data-cell="${cellKey('dozen', d)}"></span></button>
      `).join('');

      outsideEl.innerHTML = `
        <button class="ru-cell ru-outside" data-type="range" data-value="low">1 a 18<span class="chip-badge" data-cell="${cellKey('range', 'low')}"></span></button>
        <button class="ru-cell ru-outside" data-type="parity" data-value="even">Par<span class="chip-badge" data-cell="${cellKey('parity', 'even')}"></span></button>
        <button class="ru-cell ru-outside ru-red" data-type="color" data-value="red">Rojo<span class="chip-badge" data-cell="${cellKey('color', 'red')}"></span></button>
        <button class="ru-cell ru-outside ru-black" data-type="color" data-value="black">Negro<span class="chip-badge" data-cell="${cellKey('color', 'black')}"></span></button>
        <button class="ru-cell ru-outside" data-type="parity" data-value="odd">Impar<span class="chip-badge" data-cell="${cellKey('parity', 'odd')}"></span></button>
        <button class="ru-cell ru-outside" data-type="range" data-value="high">19 a 36<span class="chip-badge" data-cell="${cellKey('range', 'high')}"></span></button>
      `;

      tableEl.querySelectorAll('.ru-cell').forEach((btn) => btn.addEventListener('click', onCellClick));
      dozensEl.querySelectorAll('.ru-cell').forEach((btn) => btn.addEventListener('click', onCellClick));
      outsideEl.querySelectorAll('.ru-cell').forEach((btn) => btn.addEventListener('click', onCellClick));
    }

    function onCellClick(e) {
      if (spinning) return;
      const btn = e.currentTarget;
      let value = btn.dataset.value;
      if (btn.dataset.type === 'number' || btn.dataset.type === 'column' || btn.dataset.type === 'dozen') value = Number(value);
      const ok = engine.placeBet({ type: btn.dataset.type, value, amount: selectedChip });
      if (!ok) {
        flashMsg('No te alcanzan las fichas para esa apuesta.');
        return;
      }
      renderBadges();
      renderBalance();
    }

    function buildChips() {
      chipsEl.innerHTML = CHIP_VALUES.map((v) => `<button class="ru-chip ${v === selectedChip ? 'active' : ''}" data-value="${v}">${v}</button>`).join('');
      chipsEl.querySelectorAll('.ru-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedChip = Number(btn.dataset.value);
          chipsEl.querySelectorAll('.ru-chip').forEach((b) => b.classList.toggle('active', Number(b.dataset.value) === selectedChip));
        });
      });
    }

    function renderBadges() {
      const marks = {};
      engine.bets.forEach((b) => { marks[cellKey(b.type, b.value)] = b.amount; });
      container.querySelectorAll('.chip-badge').forEach((el) => {
        const key = el.dataset.cell;
        if (marks[key]) {
          el.textContent = marks[key];
          el.classList.add('show');
        } else {
          el.textContent = '';
          el.classList.remove('show');
        }
      });
    }

    function renderBalance() {
      balanceEl.textContent = engine.balance;
      stakedEl.textContent = engine.totalStaked();
      spinBtn.disabled = spinning || !engine.canSpin();
      resetBtn.hidden = engine.balance > 0 || engine.totalStaked() > 0;
    }

    function renderHistory() {
      historyEl.innerHTML = engine.history.slice(0, 12).map((h) => `<span class="dot ${h.color}">${h.number}</span>`).join('') || '<span style="color:var(--ink-500);font-size:0.78rem;">Aún no hay tiradas</span>';
    }

    function flashMsg(text) {
      msgEl.textContent = text;
      clearTimeout(flashMsg._t);
      flashMsg._t = setTimeout(() => { if (!destroyed) msgEl.textContent = ''; }, 2600);
    }

    function setInteractive(enabled) {
      container.querySelectorAll('.ru-cell').forEach((btn) => { btn.disabled = !enabled; });
      clearBtn.disabled = !enabled;
      chipsEl.querySelectorAll('.ru-chip').forEach((btn) => { btn.disabled = !enabled; });
    }

    function doSpin() {
      if (spinning || !engine.canSpin()) return;
      spinning = true;
      autoplay.cancel();
      setInteractive(false);
      spinBtn.disabled = true;
      msgEl.textContent = '';
      wheelEl.classList.remove('spinning');
      // Forzar reflow para poder reiniciar la animación en giros consecutivos.
      void wheelEl.offsetWidth;
      wheelEl.classList.add('spinning');
      badgeEl.className = 'ru-result-badge is-empty';
      badgeEl.textContent = '…';

      setTimeout(() => {
        if (destroyed) return;
        const outcome = engine.spin();
        wheelEl.classList.remove('spinning');
        badgeEl.className = `ru-result-badge ${outcome.color}`;
        badgeEl.textContent = String(outcome.result);
        renderHistory();
        renderBalance();
        renderBadges();
        setInteractive(true);
        spinning = false;

        if (outcome.net >= 0) {
          flashMsg(outcome.net > 0 ? `¡Ganaste ${outcome.net} fichas! (número ${outcome.result}, ${COLOR_LABEL[outcome.color]})` : `Empatas — recuperaste tu apuesta (número ${outcome.result}).`);
        } else {
          flashMsg(`Perdiste ${Math.abs(outcome.net)} fichas (número ${outcome.result}, ${COLOR_LABEL[outcome.color]}).`);
        }

        global.GameHub.Storage.recordResult('ruleta', outcome.net > 0 ? 'human-win' : 'bot-win');

        if (autoplay.isEnabled()) {
          if (engine.repeatLastBets()) {
            renderBadges();
            renderBalance();
            autoplay.arm(autoplayHost, doSpin);
          } else {
            autoplay.setEnabled(false);
            autoplay.renderToggle(autoplayHost, { label: 'Auto-jugar apostando lo mismo' });
            flashMsg('Fondos insuficientes para repetir la apuesta — se detuvo el auto-jugar.');
          }
        }
      }, 1450);
    }

    clearBtn.addEventListener('click', () => {
      if (spinning) return;
      engine.clearBets();
      renderBadges();
      renderBalance();
    });
    spinBtn.addEventListener('click', doSpin);
    resetBtn.addEventListener('click', () => {
      engine.resetBalance();
      renderBalance();
      flashMsg('Saldo repuesto a 1000 fichas.');
    });
    container.querySelector('.back-btn').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });

    autoplay.renderToggle(autoplayHost, { label: 'Auto-jugar apostando lo mismo' });

    buildTable();
    buildChips();
    renderBadges();
    renderBalance();
    renderHistory();

    return {
      destroy() {
        destroyed = true;
        autoplay.cancel();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'ruleta',
    name: 'Ruleta',
    tagline: 'Ruleta europea de un solo cero: apuesta a números, colores o docenas contra la casa.',
    tag: 'CASINO · 1 JUGADOR',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="22" fill="#171310" stroke="var(--gold-500)" stroke-width="2"/>
      <circle cx="28" cy="28" r="15" fill="none" stroke="#F6EFDD" stroke-opacity="0.25" stroke-width="1"/>
      <path d="M28 6 A22 22 0 0 1 45 16" stroke="var(--ember-500)" stroke-width="6" fill="none"/>
      <path d="M28 50 A22 22 0 0 1 11 40" stroke="var(--ember-500)" stroke-width="6" fill="none"/>
      <circle cx="28" cy="28" r="3" fill="var(--gold-500)"/>
    </svg>`,
    seatSpec: { fixed: true, seats: [{ color: 'casino', label: 'Tú', hex: 'var(--gold-500)' }] },
    casino: true,
    mount,
  });
})(window);
