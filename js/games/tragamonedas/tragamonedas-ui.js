(function (global) {
  const TragamonedasEngine = global.GameHub.TragamonedasEngine;
  const SYMBOLS = global.GameHub.TRAGAMONEDAS_SYMBOLS;
  const RANDOM_SYMBOLS = SYMBOLS.map((s) => s.symbol);

  const BET_STEP = 10;
  const BET_MIN = 10;
  const BET_MAX = 200;

  function mount(container, config) {
    const engine = new TragamonedasEngine();
    const autoplay = global.GameHub.createAutoplay({ storageKey: 'autoplay:tragamonedas', delay: 1800 });
    let bet = Math.min(engine.lastBet || 20, Math.max(BET_MIN, engine.balance));
    let spinning = false;
    let destroyed = false;
    let spinLoop = null;

    container.innerHTML = `
      <div class="game-topbar">
        <div class="left">
          <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
          <h2>Tragamonedas</h2>
        </div>
      </div>
      <div class="sl-layout">
        <div class="sl-balance-row">
          <div class="sl-balance">
            <b id="sl-balance">0</b>
            <span>fichas</span>
          </div>
          <button class="ru-reset-link" id="sl-reset">Reponer fichas (500)</button>
        </div>

        <div class="sl-machine">
          <div class="sl-reels" id="sl-reels">
            <div class="sl-reel"><span class="sl-symbol">🍒</span></div>
            <div class="sl-reel"><span class="sl-symbol">🍋</span></div>
            <div class="sl-reel"><span class="sl-symbol">🍀</span></div>
          </div>
          <p class="sl-result" id="sl-result">¡Bienvenido! Elige tu apuesta y gira.</p>
        </div>

        <div class="sl-controls">
          <div class="sl-bet-box">
            <button id="sl-bet-minus" aria-label="Bajar apuesta">−</button>
            <b><span id="sl-bet">20</span> fichas</b>
            <button id="sl-bet-plus" aria-label="Subir apuesta">+</button>
          </div>
          <button class="btn btn-primary sl-spin-btn" id="sl-spin">Girar</button>
        </div>

        <div class="panel" style="width:100%;padding: var(--space-3) var(--space-4);">
          <div class="autoplay-row" id="sl-autoplay" style="border-top:none;margin-top:0;padding-top:0;"></div>
        </div>

        <div class="panel sl-paylines" style="width:100%;padding:var(--space-3) var(--space-4);">
          <p style="margin-bottom:6px;color:var(--ink-100);font-weight:600;">Tabla de premios (3 iguales × apuesta)</p>
          ${SYMBOLS.slice().reverse().map((s) => `<span class="pill">${s.symbol} ×${s.payout3}</span>`).join('')}
          <span class="pill">🍒🍒 (dos cerezas) ×1</span>
        </div>
      </div>
    `;

    const balanceEl = container.querySelector('#sl-balance');
    const reelsEl = container.querySelectorAll('.sl-reel');
    const resultEl = container.querySelector('#sl-result');
    const betEl = container.querySelector('#sl-bet');
    const betMinusBtn = container.querySelector('#sl-bet-minus');
    const betPlusBtn = container.querySelector('#sl-bet-plus');
    const spinBtn = container.querySelector('#sl-spin');
    const resetBtn = container.querySelector('#sl-reset');
    const autoplayHost = container.querySelector('#sl-autoplay');

    function renderBalance() {
      balanceEl.textContent = engine.balance;
      resetBtn.hidden = engine.balance >= BET_MIN;
      updateSpinAvailability();
    }

    function updateSpinAvailability() {
      spinBtn.disabled = spinning || !engine.canSpin(bet);
      betMinusBtn.disabled = spinning || bet <= BET_MIN;
      betPlusBtn.disabled = spinning || bet >= Math.min(BET_MAX, engine.balance);
    }

    function renderBet() {
      betEl.textContent = bet;
      updateSpinAvailability();
    }

    function randomSpinFrame() {
      reelsEl.forEach((reel) => {
        reel.querySelector('.sl-symbol').textContent = RANDOM_SYMBOLS[Math.floor(Math.random() * RANDOM_SYMBOLS.length)];
      });
    }

    function doSpin() {
      if (spinning || !engine.canSpin(bet)) return;
      spinning = true;
      autoplay.cancel();
      updateSpinAvailability();
      resultEl.textContent = 'Girando…';
      reelsEl.forEach((reel) => { reel.classList.add('spinning'); reel.classList.remove('win'); });
      spinLoop = setInterval(randomSpinFrame, 80);

      setTimeout(() => {
        if (destroyed) return;
        clearInterval(spinLoop);
        const outcome = engine.spin(bet);
        reelsEl.forEach((reel, i) => {
          reel.classList.remove('spinning');
          reel.querySelector('.sl-symbol').textContent = outcome.reels[i];
          if (outcome.isWin) reel.classList.add('win');
        });

        if (outcome.isWin) {
          resultEl.textContent = outcome.multiplier >= 3
            ? `¡Combinación ${outcome.reels.join('')} — ganaste ${outcome.payout} fichas!`
            : `Dos cerezas — recuperas ${outcome.payout} fichas.`;
        } else {
          resultEl.textContent = `${outcome.reels.join(' ')} — sin premio esta vez.`;
        }

        global.GameHub.Storage.recordResult('tragamonedas', outcome.net > 0 ? 'human-win' : 'bot-win');

        renderBalance();
        spinning = false;
        updateSpinAvailability();

        if (autoplay.isEnabled()) {
          if (engine.canSpin(bet)) {
            autoplay.arm(autoplayHost, doSpin);
          } else {
            autoplay.setEnabled(false);
            autoplay.renderToggle(autoplayHost, { label: 'Auto-girar sin confirmar' });
            resultEl.textContent += ' Fondos insuficientes — se detuvo el auto-jugar.';
          }
        }
      }, 900);
    }

    betMinusBtn.addEventListener('click', () => {
      bet = Math.max(BET_MIN, bet - BET_STEP);
      renderBet();
    });
    betPlusBtn.addEventListener('click', () => {
      bet = Math.min(BET_MAX, engine.balance, bet + BET_STEP);
      renderBet();
    });
    spinBtn.addEventListener('click', doSpin);
    resetBtn.addEventListener('click', () => {
      engine.resetBalance();
      bet = Math.min(bet, Math.max(BET_MIN, engine.balance));
      renderBalance();
      renderBet();
      resultEl.textContent = 'Saldo repuesto a 500 fichas.';
    });
    container.querySelector('.back-btn').addEventListener('click', () => { autoplay.cancel(); config.onExit(); });

    autoplay.renderToggle(autoplayHost, { label: 'Auto-girar sin confirmar' });

    renderBalance();
    renderBet();

    return {
      destroy() {
        destroyed = true;
        clearInterval(spinLoop);
        autoplay.cancel();
      },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'tragamonedas',
    name: 'Tragamonedas',
    tagline: 'Máquina de 3 rodillos: junta símbolos iguales y multiplica tu apuesta.',
    tag: 'CASINO · 1 JUGADOR',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="40" height="40" rx="8" fill="#1B3327" stroke="var(--gold-500)" stroke-width="2"/>
      <rect x="14" y="18" width="9" height="20" rx="2" fill="#F6EFDD" fill-opacity="0.9"/>
      <rect x="24" y="18" width="9" height="20" rx="2" fill="#F6EFDD" fill-opacity="0.9"/>
      <rect x="34" y="18" width="8" height="20" rx="2" fill="#F6EFDD" fill-opacity="0.9"/>
      <circle cx="18.5" cy="28" r="2.6" fill="var(--ember-500)"/>
      <circle cx="28.5" cy="28" r="2.6" fill="var(--gold-600)"/>
      <circle cx="38" cy="28" r="2.6" fill="var(--ember-500)"/>
    </svg>`,
    seatSpec: { fixed: true, seats: [{ color: 'casino', label: 'Tú', hex: 'var(--gold-500)' }] },
    casino: true,
    mount,
  });
})(window);
