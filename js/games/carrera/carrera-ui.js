(function (global) {
  const Engine = global.GameHub.CarreraEngine;

  function mount(container, config) {
    let state = null;
    let destroyed = false;

    function renderSetup() {
      container.innerHTML = `
        <div class="game-topbar">
          <div class="left">
            <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
            <h2>Camino a la Gloria</h2>
          </div>
        </div>
        <div class="cr-setup panel">
          <h3>Crea a tu futbolista</h3>
          <div class="setup-field">
            <label for="cr-surname">Apellido</label>
            <input type="text" id="cr-surname" maxlength="18" placeholder="Ej: Rodríguez">
          </div>
          <div class="setup-field">
            <label for="cr-number">Dorsal</label>
            <input type="number" id="cr-number" min="1" max="99" value="10">
          </div>
          <div class="setup-field">
            <label for="cr-foot">Pierna hábil</label>
            <select id="cr-foot">
              <option value="derecha">Derecha</option>
              <option value="izquierda">Izquierda</option>
            </select>
          </div>
          <div class="setup-field">
            <label for="cr-country">País</label>
            <select id="cr-country">
              ${Engine.COUNTRIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="setup-field">
            <label for="cr-position">Posición</label>
            <select id="cr-position">
              ${Engine.POSITIONS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
            </select>
          </div>
          <div class="setup-actions">
            <button class="btn btn-primary" id="cr-start">Debutar como profesional</button>
          </div>
        </div>
      `;
      container.querySelector('.back-btn').addEventListener('click', () => config.onExit());
      container.querySelector('#cr-start').addEventListener('click', () => {
        const surname = container.querySelector('#cr-surname').value.trim() || 'Jugador';
        const number = Number(container.querySelector('#cr-number').value) || 10;
        const foot = container.querySelector('#cr-foot').value;
        const country = container.querySelector('#cr-country').value;
        const position = container.querySelector('#cr-position').value;
        state = Engine.createCareer({ surname, number, foot, country, position });
        renderPeriod();
      });
    }

    function renderPeriod() {
      const event = Engine.pickEvent(state);
      container.innerHTML = `
        <div class="game-topbar">
          <div class="left">
            <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
            <h2>Camino a la Gloria</h2>
          </div>
        </div>
        <div class="cr-progress">
          <div class="cr-progress-bar">
            <div class="cr-progress-fill" style="width:${(state.period / state.totalPeriods) * 100}%"></div>
          </div>
          <span class="pill">${state.age}-${state.age + 1} años</span>
        </div>
        <div class="cr-layout">
          <div class="panel cr-stats">
            <h3>${state.surname} #${state.number}</h3>
            <p class="sub">${Engine.POSITIONS.find((p) => p.id === state.position).label} · ${state.country}</p>
            <div class="cr-stat-row"><span>Nivel</span><span class="mono">${state.level}</span></div>
            <div class="cr-stat-row"><span>Reputación</span><span class="mono">${state.reputation}</span></div>
            <div class="cr-stat-row"><span>Moral</span><span class="mono">${state.morale}</span></div>
            <div class="cr-stat-row"><span>Riesgo de lesión</span><span class="mono">${state.injuryRisk}</span></div>
            <div class="cr-stat-row"><span>Valor de mercado</span><span class="mono">€${state.marketValue}M</span></div>
            <div class="cr-stat-row"><span>Club</span><span class="mono">${Engine.CLUB_TIERS[state.clubTier]}</span></div>
          </div>
          <div class="panel cr-event">
            <span class="eyebrow">Temporada ${state.period + 1}</span>
            <h2>${event.title}</h2>
            <p>${event.desc}</p>
            <div class="cr-options" id="cr-options">
              ${event.options.map((o, i) => `<button class="btn btn-primary cr-option-btn" data-index="${i}">${o.label}</button>`).join('')}
            </div>
          </div>
        </div>
      `;
      container.querySelector('.back-btn').addEventListener('click', () => config.onExit());
      container.querySelectorAll('.cr-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const option = event.options[Number(btn.dataset.index)];
          const result = Engine.applyChoice(state, event, option);
          renderResult(option, result);
        });
      });
    }

    function renderResult(option, result) {
      const extras = [option.text, result.injuryText, result.titleText, result.awardText].filter(Boolean);
      const panel = container.querySelector('.cr-event');
      panel.innerHTML = `
        <span class="eyebrow">Resultado</span>
        <h2>${extras[0]}</h2>
        <div class="cr-extra-notes">
          ${extras.slice(1).map((t) => `<p>${t}</p>`).join('')}
        </div>
        <div class="cr-options">
          <button class="btn btn-primary" id="cr-continue">${state.retired ? 'Ver resumen de carrera' : 'Continuar carrera'}</button>
        </div>
      `;
      container.querySelector('#cr-continue').addEventListener('click', () => {
        if (state.retired) renderSummary(); else renderPeriod();
      });
    }

    function renderSummary() {
      const title = Engine.careerTitle(state);
      const posLabel = Engine.POSITIONS.find((p) => p.id === state.position).label;
      container.innerHTML = `
        <div class="game-topbar">
          <div class="left">
            <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
            <h2>Camino a la Gloria</h2>
          </div>
        </div>
        <div class="panel cr-summary">
          <span class="eyebrow">Fin de la carrera</span>
          <h2>${title}</h2>
          <p class="sub">${state.surname} #${state.number} · ${posLabel} · ${state.country} · Retiro a los ${state.age} años</p>
          <div class="cr-summary-grid">
            <div class="cr-stat-card"><b>${state.peakLevel}</b><span>Nivel máximo</span></div>
            <div class="cr-stat-card"><b>€${state.peakMarketValue}M</b><span>Valor máximo</span></div>
            <div class="cr-stat-card"><b>${state.matches}</b><span>Partidos jugados</span></div>
            ${state.position !== 'portero' ? `
              <div class="cr-stat-card"><b>${state.goals}</b><span>Goles</span></div>
              <div class="cr-stat-card"><b>${state.assists}</b><span>Asistencias</span></div>
            ` : `<div class="cr-stat-card"><b>${state.cleanSheets}</b><span>Vallas invictas</span></div>`}
            <div class="cr-stat-card"><b>${state.collectiveTitles}</b><span>Títulos de equipo</span></div>
            <div class="cr-stat-card"><b>${state.individualAwards}</b><span>Premios individuales</span></div>
            <div class="cr-stat-card"><b>${state.caps}</b><span>Convocatorias a selección</span></div>
            <div class="cr-stat-card"><b>${state.injuries}</b><span>Lesiones importantes</span></div>
          </div>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="cr-copy">Copiar resumen para compartir</button>
            <button class="btn btn-ghost" id="cr-exit">Volver al hub</button>
            <button class="btn btn-primary" id="cr-again">Iniciar otra carrera</button>
          </div>
        </div>
      `;
      container.querySelector('.back-btn').addEventListener('click', () => config.onExit());
      container.querySelector('#cr-exit').addEventListener('click', () => config.onExit());
      container.querySelector('#cr-again').addEventListener('click', () => renderSetup());
      container.querySelector('#cr-copy').addEventListener('click', (e) => {
        const text = Engine.shareText(state);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            e.target.textContent = '¡Copiado!';
            setTimeout(() => { if (!destroyed) e.target.textContent = 'Copiar resumen para compartir'; }, 1800);
          }).catch(() => {});
        }
      });

      const humanWon = state.collectiveTitles > 0 || state.peakLevel >= 70;
      global.GameHub.Storage.recordResult('carrera', humanWon ? 'human-win' : 'bot-win');
    }

    renderSetup();

    return {
      destroy() { destroyed = true; },
    };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.registerGame({
    id: 'carrera',
    name: 'Camino a la Gloria',
    tagline: 'Crea tu futbolista y vive su carrera completa a punta de decisiones: lesiones, fichajes, selección y títulos.',
    tag: 'SIMULADOR · 1 JUGADOR',
    icon: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="20" fill="#f6efdd" stroke="#2b1c12" stroke-opacity="0.3" stroke-width="2"/>
      <polygon points="28,17 34,22 32,29 24,29 22,22" fill="#12291d"/>
      <path d="M28 17 L28 8 M34 22 L42 18 M32 29 L36 38 M24 29 L20 38 M22 22 L14 18" stroke="#12291d" stroke-width="2"/>
    </svg>`,
    casino: true,
    seatSpec: { fixed: true, seats: [{ color: 'tu', label: 'Tú', hex: 'var(--gold-500)' }] },
    mount,
  });
})(window);
