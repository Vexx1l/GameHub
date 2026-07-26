(function (global) {
  const Engine = global.GameHub.CarreraEngine;
  const Countries = global.GameHub.CarreraCountries;
  const Clubs = global.GameHub.CarreraClubs;

  const DEFAULT_COUNTRY = Countries.COUNTRIES.find((c) => c.name === 'Colombia') || Countries.COUNTRIES[0];
  const DEFAULT_SPOT_ID = 'mc';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function ovrClass(level) {
    if (level >= 80) return 'cr-ovr-elite';
    if (level >= 65) return 'cr-ovr-good';
    if (level >= 50) return 'cr-ovr-mid';
    return 'cr-ovr-low';
  }

  // Etiqueta de la 3ª estadística (PJ / VI / GR) según posición.
  function grLabel(position) { return position === 'portero' ? 'GR' : 'GR'; }

  function badge(club, size) {
    return Clubs.badgeSvg(club, size || 40);
  }

  function mount(container, config) {
    let state = null;
    let destroyed = false;

    // Borrador de creación de personaje (persiste mientras se arma la identidad).
    const draft = {
      surname: '',
      number: 10,
      foot: 'derecha',
      country: DEFAULT_COUNTRY,
      spot: Engine.POSITION_SPOTS.find((s) => s.id === DEFAULT_SPOT_ID),
    };

    function topbar() {
      return `
        <div class="game-topbar">
          <div class="left">
            <button class="back-btn" aria-label="Volver al hub" title="Volver">←</button>
            <h2>Camino a la Gloria</h2>
          </div>
        </div>
      `;
    }

    function bindBack(root) {
      root.querySelector('.back-btn').addEventListener('click', () => config.onExit());
    }

    // ---------- Pantalla de creación de identidad ----------

    function renderSetup() {
      container.innerHTML = `
        ${topbar()}
        <div class="cr-identity-title">
          <h3>Definí tu identidad</h3>
          <p class="sub">Elegí cómo se va a llamar, de dónde viene y en qué posición va a brillar tu futbolista.</p>
        </div>
        <div class="cr-identity-grid">
          <div class="panel cr-id-col cr-id-jersey-col">
            <span class="cr-col-label">Identidad</span>
            <div class="cr-jersey-wrap">
              <div class="cr-jersey">
                <span class="cr-jersey-number" id="cr-jersey-number">10</span>
                <span class="cr-jersey-name" id="cr-jersey-name">JUGADOR</span>
              </div>
            </div>
            <div class="setup-field">
              <label for="cr-surname">Apellido</label>
              <input type="text" id="cr-surname" maxlength="18" placeholder="Ej: Rodríguez">
            </div>
            <div class="setup-field">
              <label for="cr-number">Número</label>
              <input type="number" id="cr-number" min="1" max="99" value="10">
            </div>
            <div class="setup-field">
              <label>Pierna hábil</label>
              <div class="cr-toggle-row" id="cr-foot-toggle">
                <button type="button" class="cr-toggle-btn" data-foot="izquierda">Izquierda</button>
                <button type="button" class="cr-toggle-btn active" data-foot="derecha">Derecha</button>
              </div>
            </div>
          </div>

          <div class="panel cr-id-col cr-id-country-col">
            <span class="cr-col-label">Nacionalidad</span>
            <div class="cr-search-wrap">
              <span class="cr-search-icon">⌕</span>
              <input type="text" id="cr-country-search" placeholder="Buscar país" autocomplete="off">
            </div>
            <div class="cr-country-list" id="cr-country-list"></div>
          </div>

          <div class="panel cr-id-col cr-id-position-col">
            <span class="cr-col-label">Posición</span>
            <div class="cr-pitch" id="cr-pitch">
              <div class="cr-pitch-line cr-pitch-halfway"></div>
              <div class="cr-pitch-circle"></div>
              <div class="cr-pitch-box cr-pitch-box-top"></div>
              <div class="cr-pitch-box cr-pitch-box-bottom"></div>
              ${Engine.POSITION_SPOTS.map((s) => `
                <button type="button" class="cr-spot" data-spot="${s.id}" style="left:${s.x}%; top:${s.y}%;" title="${s.label}">
                  ${s.short}
                </button>
              `).join('')}
            </div>
            <p class="cr-position-selected" id="cr-position-selected">Elegí una posición en la cancha</p>
          </div>
        </div>
        <div class="setup-actions cr-setup-actions">
          <button class="btn btn-primary" id="cr-start">Debutar como profesional</button>
        </div>
      `;
      bindBack(container);

      // --- Camiseta en vivo ---
      const surnameInput = container.querySelector('#cr-surname');
      const numberInput = container.querySelector('#cr-number');
      const jerseyNumber = container.querySelector('#cr-jersey-number');
      const jerseyName = container.querySelector('#cr-jersey-name');
      surnameInput.addEventListener('input', () => {
        draft.surname = surnameInput.value.trim();
        jerseyName.textContent = (draft.surname || 'JUGADOR').toUpperCase();
      });
      numberInput.addEventListener('input', () => {
        const n = Number(numberInput.value);
        draft.number = n || 10;
        jerseyNumber.textContent = draft.number;
      });

      // --- Pierna hábil ---
      const footToggle = container.querySelector('#cr-foot-toggle');
      footToggle.querySelectorAll('.cr-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          footToggle.querySelectorAll('.cr-toggle-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          draft.foot = btn.dataset.foot;
        });
      });

      // --- Nacionalidad: lista buscable, siempre visible (todas las nacionalidades) ---
      const listEl = container.querySelector('#cr-country-list');
      const searchInput = container.querySelector('#cr-country-search');

      function renderCountryList(filter) {
        const q = (filter || '').toLocaleLowerCase('es');
        const items = Countries.COUNTRIES.filter((c) => c.name.toLocaleLowerCase('es').includes(q));
        listEl.innerHTML = items.length
          ? items.map((c) => `
              <button type="button" class="cr-country-row ${draft.country && draft.country.code === c.code ? 'active' : ''}" data-code="${c.code}">
                <span class="cr-flag">${c.flag}</span>
                <span>${escapeHtml(c.name)}</span>
              </button>
            `).join('')
          : `<p class="cr-empty-note">No encontramos ese país.</p>`;
        listEl.querySelectorAll('.cr-country-row').forEach((row) => {
          row.addEventListener('click', () => {
            draft.country = Countries.COUNTRIES.find((c) => c.code === row.dataset.code);
            listEl.querySelectorAll('.cr-country-row').forEach((r) => r.classList.remove('active'));
            row.classList.add('active');
          });
        });
      }
      searchInput.addEventListener('input', () => renderCountryList(searchInput.value));
      renderCountryList('');
      // Deja el país por defecto ya resaltado y visible en la lista.
      const preselected = listEl.querySelector(`.cr-country-row[data-code="${draft.country.code}"]`);
      if (preselected) preselected.scrollIntoView({ block: 'center' });

      // --- Posición: cancha interactiva ---
      const posLabel = container.querySelector('#cr-position-selected');
      const spots = container.querySelectorAll('.cr-spot');
      function selectSpot(id) {
        const spot = Engine.POSITION_SPOTS.find((s) => s.id === id);
        if (!spot) return;
        draft.spot = spot;
        spots.forEach((b) => b.classList.remove('active'));
        container.querySelector(`.cr-spot[data-spot="${id}"]`).classList.add('active');
        posLabel.textContent = `Posición elegida: ${spot.label} (${spot.short})`;
      }
      spots.forEach((btn) => btn.addEventListener('click', () => selectSpot(btn.dataset.spot)));
      selectSpot(draft.spot.id);

      // --- Confirmar y arrancar carrera ---
      container.querySelector('#cr-start').addEventListener('click', () => {
        state = Engine.createCareer({
          surname: draft.surname || 'Jugador',
          number: draft.number || 10,
          foot: draft.foot,
          country: draft.country,
          position: draft.spot.group,
          positionDetail: draft.spot.id,
        });
        renderPeriod();
      });
    }

    // ---------- Tarjeta de jugador (reutilizada en la simulación) ----------

    function playerCardHtml() {
      const grValue = state.position === 'portero' ? state.goals : state.goals;
      const grText = state.position === 'portero' ? 'Goles recibidos' : 'Goles';
      const trophyCount = state.collectiveTitles + state.individualAwards;
      return `
        <div class="cr-player-card">
          <div class="cr-player-head">
            <div class="cr-ovr-badge ${ovrClass(state.level)}">
              <span class="cr-ovr-label">OVR</span>
              <span class="cr-ovr-value">${state.level}</span>
            </div>
            <div class="cr-player-id">
              <span class="cr-flag-chip">${state.country.flag} ${state.positionShort || ''}</span>
              <h3>${escapeHtml(state.surname)} <span class="mono">#${state.number}</span></h3>
              <p class="sub">${state.positionDetail || Engine.POSITIONS.find((p) => p.id === state.position).label} · ${state.country.name}</p>
            </div>
          </div>
          <div class="cr-club-strip">
            <span class="cr-club-crest">${badge(state.club, 30)}</span>
            <div class="cr-club-strip-text">
              <span class="cr-club-strip-name">${escapeHtml(state.club.name)}${state.onLoan ? ' <em>(préstamo)</em>' : ''}</span>
              <span class="cr-club-strip-league">${escapeHtml(state.club.flag)} ${escapeHtml(state.club.league)}</span>
            </div>
          </div>
          <div class="cr-player-meta">
            <div class="cr-meta-item"><span class="cr-meta-k">EDAD</span><span class="cr-meta-v">${state.age}</span></div>
            <div class="cr-meta-item"><span class="cr-meta-k">VALOR</span><span class="cr-meta-v">€${state.marketValue}M</span></div>
            <div class="cr-meta-item"><span class="cr-meta-k">CAPS</span><span class="cr-meta-v">${state.caps}</span></div>
          </div>
          <div class="cr-stat-icons">
            <div class="cr-stat-icon"><b>${state.matches}</b><span>PJ</span></div>
            <div class="cr-stat-icon"><b>${state.wins}</b><span>VI</span></div>
            <div class="cr-stat-icon" title="${grText}"><b>${grValue}</b><span>${grLabel(state.position)}</span></div>
          </div>
          <div class="cr-trophy-case">
            ${trophyCount === 0 && state.caps === 0
              ? '<p class="cr-empty-note">Vitrina vacía. ¡Empezá a ganar cosas!</p>'
              : `
                ${state.collectiveTitles ? `<div class="cr-trophy-row">🏆 <span>${state.collectiveTitles} título(s) de equipo</span></div>` : ''}
                ${state.individualAwards ? `<div class="cr-trophy-row">⭐ <span>${state.individualAwards} premio(s) individual(es)</span></div>` : ''}
                ${state.caps ? `<div class="cr-trophy-row">🎖️ <span>${state.caps} convocatoria(s) a selección</span></div>` : ''}
              `}
          </div>
        </div>
      `;
    }

    // ---------- Línea de tiempo de temporadas ----------

    function timelineHtml() {
      const rows = [];
      for (let i = 0; i < state.totalPeriods; i += 1) {
        const ageFrom = 17 + i * 2;
        if (i < state.log.length) {
          const entry = state.log[i];
          const badges = [entry.champion ? '🏆' : '', entry.award ? '⭐' : '', entry.injured ? '🩹' : ''].filter(Boolean).join(' ');
          rows.push(`
            <div class="cr-tl-row cr-tl-done">
              <span class="cr-tl-age">${ageFrom}</span>
              <span class="cr-tl-club" title="${escapeHtml(entry.club.name)}">${badge(entry.club, 20)}</span>
              <span class="cr-tl-ovr">${entry.level}</span>
              <span class="cr-tl-badges">${badges}</span>
            </div>
          `);
        } else if (i === state.period) {
          rows.push(`
            <div class="cr-tl-row cr-tl-current">
              <span class="cr-tl-age">${ageFrom}</span>
              <span class="cr-tl-club" title="${escapeHtml(state.club.name)}">${badge(state.club, 20)}</span>
              <span class="cr-tl-ovr">${state.level}</span>
              <span class="cr-tl-badges"></span>
            </div>
          `);
        } else {
          rows.push(`
            <div class="cr-tl-row cr-tl-locked">
              <span class="cr-tl-age">${ageFrom}</span>
              <span class="cr-tl-club">?</span>
              <span class="cr-tl-ovr">—</span>
              <span class="cr-tl-badges"></span>
            </div>
          `);
        }
      }
      return `
        <div class="cr-timeline panel">
          <div class="cr-timeline-head">
            <span>EDAD</span><span>CLUB</span><span>OVR</span><span></span>
          </div>
          ${rows.join('')}
        </div>
      `;
    }

    // ---------- Pantalla de simulación (temporada / evento / mercado) ----------

    function renderPeriod() {
      const event = Engine.pickEvent(state);
      const midColHtml = event.market ? marketPanelHtml(event) : narrativePanelHtml(event);
      container.innerHTML = `
        ${topbar()}
        <div class="cr-progress">
          <div class="cr-progress-bar">
            <div class="cr-progress-fill" style="width:${(state.period / state.totalPeriods) * 100}%"></div>
          </div>
          <span class="pill">${state.age}-${state.age + 1} años</span>
        </div>
        <div class="cr-dashboard">
          <div class="cr-dash-col-left">
            ${playerCardHtml()}
          </div>
          <div class="cr-dash-col-mid panel cr-event">
            ${midColHtml}
          </div>
          <div class="cr-dash-col-right">
            ${timelineHtml()}
          </div>
        </div>
      `;
      bindBack(container);

      if (event.market) {
        container.querySelectorAll('.cr-market-card').forEach((card) => {
          card.addEventListener('click', () => {
            const idx = card.dataset.offer;
            let chosenClub = null;
            let loan = false;
            if (idx !== 'stay') {
              const offer = event.offers[Number(idx)];
              chosenClub = offer.club;
              loan = offer.loan;
            }
            const result = Engine.applyMarketChoice(state, chosenClub, loan);
            renderResult(result);
          });
        });
      } else {
        container.querySelectorAll('.cr-option-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const option = event.options[Number(btn.dataset.index)];
            const result = Engine.applyChoice(state, event, option);
            renderResult(result);
          });
        });
      }
    }

    function narrativePanelHtml(event) {
      return `
        <span class="eyebrow">Temporada ${state.period + 1}</span>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.desc)}</p>
        <div class="cr-options" id="cr-options">
          ${event.options.map((o, i) => `<button class="btn btn-primary cr-option-btn" data-index="${i}">${escapeHtml(o.label)}</button>`).join('')}
        </div>
      `;
    }

    function marketCardHtml(club, tag, dataOffer, isStay) {
      return `
        <button type="button" class="cr-market-card ${isStay ? 'cr-market-stay' : ''}" data-offer="${dataOffer}">
          <span class="cr-market-tag">${tag}</span>
          <div class="cr-market-crest">${badge(club, 56)}</div>
          <span class="cr-market-name">${escapeHtml(club.name)}</span>
          <span class="cr-market-league">${escapeHtml(club.flag)} ${escapeHtml(club.league)}</span>
        </button>
      `;
    }

    function marketPanelHtml(event) {
      const cards = event.offers.map((o, i) => marketCardHtml(o.club, o.loan ? 'Salir a préstamo' : 'Fichar por', i, false)).join('');
      const stayCard = marketCardHtml(state.club, 'Quedarte en', 'stay', true);
      return `
        <span class="eyebrow">Temporada ${state.period + 1}</span>
        <h2>Mercado de pases</h2>
        <p>${escapeHtml(event.desc)}</p>
        <div class="cr-market-cards">${cards}${stayCard}</div>
      `;
    }

    function renderResult(result) {
      const extras = [result.choiceText, result.injuryText, result.titleText, result.awardText].filter(Boolean);
      const panel = container.querySelector('.cr-event');
      panel.innerHTML = `
        <span class="eyebrow">Resultado</span>
        <h2>${escapeHtml(extras[0])}</h2>
        <div class="cr-extra-notes">
          ${extras.slice(1).map((t) => `<p>${escapeHtml(t)}</p>`).join('')}
        </div>
        <div class="cr-options">
          <button class="btn btn-primary" id="cr-continue">${state.retired ? 'Ver resumen de carrera' : 'Continuar carrera'}</button>
        </div>
      `;
      // La tarjeta y la línea de tiempo ya reflejan los nuevos valores tras el cambio de estado.
      const left = container.querySelector('.cr-dash-col-left');
      const right = container.querySelector('.cr-dash-col-right');
      if (left) left.innerHTML = playerCardHtml();
      if (right) right.innerHTML = timelineHtml();

      container.querySelector('#cr-continue').addEventListener('click', () => {
        if (state.retired) renderSummary(); else renderPeriod();
      });
    }

    // ---------- Resumen final ----------

    function clubCardHtml(stint) {
      const [c1, c2] = stint.club.colors;
      return `
        <div class="cr-club-card" style="background:linear-gradient(160deg, ${c1}33, ${c2}55);">
          <div class="cr-club-card-crest">${badge(stint.club, 54)}</div>
          <h4>${escapeHtml(stint.club.name)}</h4>
          <span class="cr-club-card-age">${stint.ageFrom}-${stint.ageTo} años · ${escapeHtml(stint.club.league)}</span>
          <div class="cr-club-card-stats">
            <div><b>${stint.matches}</b><span>PJ</span></div>
            <div><b>${stint.wins}</b><span>VI</span></div>
            <div><b>${stint.goals}</b><span>GR</span></div>
          </div>
          ${stint.titles ? `<div class="cr-club-card-trophies">${'🏆'.repeat(Math.min(stint.titles, 5))}</div>` : ''}
        </div>
      `;
    }

    function renderSummary() {
      const title = Engine.careerTitle(state);
      const posLabel = state.positionDetail || Engine.POSITIONS.find((p) => p.id === state.position).label;
      const nat = state.national;
      const hasAwards = state.individualAwardNames.length > 0;
      container.innerHTML = `
        ${topbar()}
        <div class="panel cr-summary">
          <div class="cr-summary-top">
            <div class="cr-summary-box cr-summary-main">
              <span class="eyebrow">Carrera finalizada</span>
              <h2>${escapeHtml(state.surname)}</h2>
              <div class="cr-summary-main-row">
                <span class="cr-summary-pos-num">#${state.number}</span>
                <span class="cr-club-pill">${escapeHtml(posLabel)}</span>
              </div>
              <div class="cr-summary-main-meta">
                <span>VALOR<b>€${state.peakMarketValue}M</b></span>
                <div class="cr-ovr-badge ${ovrClass(state.peakLevel)}">
                  <span class="cr-ovr-label">OVR</span>
                  <span class="cr-ovr-value">${state.peakLevel}</span>
                </div>
              </div>
              <div class="cr-summary-main-stats">
                <div><b>${state.matches}</b><span>PJ</span></div>
                <div><b>${state.wins}</b><span>VI</span></div>
                <div><b>${state.goals}</b><span>GR</span></div>
              </div>
            </div>

            <div class="cr-summary-box cr-summary-national">
              <span class="eyebrow">Selección</span>
              <div class="cr-national-head">
                <span class="cr-flag" style="font-size:1.6rem;">${state.country.flag}</span>
                <h3>${escapeHtml(state.country.name)}</h3>
              </div>
              <div class="cr-summary-main-stats">
                <div><b>${nat.matches}</b><span>PJ</span></div>
                <div><b>${nat.wins}</b><span>VI</span></div>
                <div><b>${nat.goals}</b><span>GR</span></div>
              </div>
              ${nat.trophies ? `<div class="cr-national-trophy">🏆 Campeón del Mundo</div>` : ''}
            </div>

            <div class="cr-summary-box cr-summary-awards">
              <span class="eyebrow">Premios individuales</span>
              ${hasAwards
                ? `<div class="cr-awards-list">${state.individualAwardNames.map((a) => `<div class="cr-trophy-row">⭐ <span>${escapeHtml(a)}</span></div>`).join('')}</div>`
                : '<p class="cr-empty-note">Vitrina vacía</p>'}
            </div>
          </div>

          <h3 class="cr-clubs-title">Clubes de tu carrera</h3>
          <div class="cr-club-cards">
            ${state.clubHistory.map((s) => clubCardHtml(s)).join('')}
          </div>

          <p class="sub cr-summary-footnote">${escapeHtml(title)} · Retiro a los ${state.age} años · ${state.injuries} lesión(es) importante(s)</p>

          <div class="setup-actions">
            <button class="btn btn-ghost" id="cr-copy">Copiar resumen para compartir</button>
            <button class="btn btn-ghost" id="cr-exit">Volver al hub</button>
            <button class="btn btn-primary" id="cr-again">Volver a jugar</button>
          </div>
        </div>
      `;
      bindBack(container);
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
