/**
 * netplay-ui.js — pantallas de "sala online": crear sala, unirse con
 * código, ver quién ocupó cada asiento y arrancar la partida.
 *
 * No conoce el engine de ningún juego en particular: sólo arma seats y
 * llama a `launchGame(game, seats, speed, netSession)`, que le pasa
 * app.js. netSession viaja dentro de config.online cuando el juego
 * monta (ver app.js), y cada *-ui.js decide qué hacer con ella.
 */
(function (global) {
  function currentSession() { return global.GameHub._netplaySession || null; }

  function init() {
    const overlay = document.getElementById('netplay-overlay');
    const card = document.getElementById('netplay-card');
    if (!overlay || !card) return null;

    let session = null;
    let unsubs = [];

    function close() {
      overlay.hidden = true;
      unsubs.forEach((fn) => fn());
      unsubs = [];
    }

    function fail(msg) {
      card.innerHTML = `
        <h2>No se pudo conectar</h2>
        <p class="sub">${msg}</p>
        <div class="setup-actions">
          <button class="btn btn-primary" id="np-back">Volver</button>
        </div>`;
      card.querySelector('#np-back').addEventListener('click', close);
    }

    function renderLobby(game, session, launchGame) {
      overlay.hidden = false;
      const link = `${location.origin}${location.pathname}?room=${session.code}`;

      function paint(seats, players) {
        const myPlayerId = session.playerId;
        card.innerHTML = `
          <h2>${game.name} — Sala online</h2>
          <p class="sub">Compartí este código o el link con quien quieras que juegue.</p>
          <div class="room-code-display">
            <span class="room-code">${session.code}</span>
            <button class="btn btn-ghost" id="np-copy-code" type="button">Copiar código</button>
          </div>
          <div class="copy-link-row">
            <input type="text" id="np-link" readonly value="${link}">
            <button class="btn btn-ghost" id="np-copy-link" type="button">Copiar link</button>
          </div>
          <div class="setup-field">
            <label>Asientos</label>
            <div id="np-seats"></div>
          </div>
          <p class="sub" id="np-status-msg"></p>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="np-leave">Salir de la sala</button>
            ${session.isHost ? '<button class="btn btn-primary" id="np-start">Empezar partida</button>' : ''}
          </div>
        `;

        const seatsEl = card.querySelector('#np-seats');
        seatsEl.innerHTML = seats.map((s) => {
          const claimedPlayer = s.playerId ? players[s.playerId] : null;
          const mine = s.playerId === myPlayerId;
          const connected = claimedPlayer && claimedPlayer.connected;
          let statusLabel = 'Libre — tocá para sentarte';
          if (claimedPlayer) statusLabel = `${claimedPlayer.name || 'Jugador'}${mine ? ' (vos)' : ''}${connected ? '' : ' — desconectado'}`;
          return `
            <button type="button" class="seat-row seat-row-btn" data-seat="${s.id}" ${claimedPlayer && !mine ? 'disabled' : ''}>
              <span class="swatch" style="background:${s.hex}"></span>
              <span class="seat-name">${s.label}</span>
              <span class="mono ${claimedPlayer ? (connected ? 'badge-connected' : 'badge-waiting') : 'badge-waiting'}">${statusLabel}</span>
            </button>`;
        }).join('');

        seatsEl.querySelectorAll('.seat-row-btn').forEach((btn) => {
          btn.addEventListener('click', () => session.claimSeat(btn.dataset.seat));
        });

        const allHumanSeatsClaimed = seats.every((s) => !!s.playerId);
        card.querySelector('#np-status-msg').textContent = allHumanSeatsClaimed
          ? 'Todos los asientos están ocupados. ¡Se puede empezar!'
          : 'Esperando a que se ocupen todos los asientos...';

        card.querySelector('#np-copy-code').addEventListener('click', () => {
          navigator.clipboard?.writeText(session.code);
        });
        card.querySelector('#np-copy-link').addEventListener('click', () => {
          navigator.clipboard?.writeText(link);
          card.querySelector('#np-link').select();
        });
        card.querySelector('#np-leave').addEventListener('click', () => { session.leave(); close(); });

        const startBtn = card.querySelector('#np-start');
        if (startBtn) {
          startBtn.disabled = !allHumanSeatsClaimed;
          startBtn.addEventListener('click', () => {
            session.startGame(seats, 650);
          });
        }
      }

      let latestSeats = [];
      let latestPlayers = {};
      session.onSeats((seats) => { latestSeats = seats; paint(latestSeats, latestPlayers); });
      session.onPlayers((players) => { latestPlayers = players; paint(latestSeats, latestPlayers); });
      session.onStatus((status) => {
        if (status === 'playing') {
          close();
          launchGame(game, latestSeats, 650, session);
        }
      });
      unsubs.push(() => {});
    }

    return {
      openCreate(game, baseSeats, launchGame) {
        overlay.hidden = false;
        const savedName = global.GameHub.Storage.get('player-name', '');
        card.innerHTML = `
          <h2>${game.name} — Crear sala online</h2>
          <p class="sub">Vas a ser el anfitrión: tu dispositivo arma la partida y los demás se conectan con un código.</p>
          <div class="setup-field">
            <label for="np-host-name">Tu nombre</label>
            <input type="text" id="np-host-name" maxlength="18" value="${savedName}" placeholder="Ej: Juan">
          </div>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="np-cancel">Cancelar</button>
            <button class="btn btn-primary" id="np-create-go">Crear sala</button>
          </div>
        `;
        card.querySelector('#np-cancel').addEventListener('click', close);
        card.querySelector('#np-create-go').addEventListener('click', () => {
          const name = card.querySelector('#np-host-name').value.trim() || 'Anfitrión';
          global.GameHub.Storage.set('player-name', name);
          card.innerHTML = `<h2>${game.name}</h2><p class="sub">Creando la sala…</p>`;
          global.GameHub.Net.createRoom(game.id, baseSeats, name)
            .then((s) => { session = s; global.GameHub._netplaySession = s; renderLobby(game, s, launchGame); })
            .catch((err) => fail(err.message));
        });
      },

      openJoin(launchGame, prefillCode) {
        overlay.hidden = false;
        const savedName = global.GameHub.Storage.get('player-name', '');
        card.innerHTML = `
          <h2>Unirse a una sala</h2>
          <p class="sub">Pedile el código de 4 letras a quien te invitó.</p>
          <div class="setup-field">
            <label for="np-join-code">Código de sala</label>
            <input type="text" id="np-join-code" maxlength="4" style="text-transform:uppercase" value="${prefillCode || ''}" placeholder="AB3F">
          </div>
          <div class="setup-field">
            <label for="np-join-name">Tu nombre</label>
            <input type="text" id="np-join-name" maxlength="18" value="${savedName}" placeholder="Ej: María">
          </div>
          <div class="setup-actions">
            <button class="btn btn-ghost" id="np-cancel">Cancelar</button>
            <button class="btn btn-primary" id="np-join-go">Unirme</button>
          </div>
        `;
        card.querySelector('#np-cancel').addEventListener('click', close);
        const go = () => {
          const code = card.querySelector('#np-join-code').value.trim();
          const name = card.querySelector('#np-join-name').value.trim() || 'Invitado';
          if (code.length !== 4) return;
          global.GameHub.Storage.set('player-name', name);
          card.innerHTML = `<h2>Uniéndome…</h2><p class="sub">Conectando a la sala ${code.toUpperCase()}.</p>`;
          global.GameHub.Net.previewRoom(code).then((room) => {
            if (!room) throw new Error('No encontramos ninguna sala con ese código.');
            const game = global.GameHub.getGame(room.gameId);
            if (!game) throw new Error('Esa sala es de un juego que no reconozco.');
            return global.GameHub.Net.joinRoom(code, name).then((s) => {
              session = s; global.GameHub._netplaySession = s; renderLobby(game, s, launchGame);
            });
          }).catch((err) => fail(err.message));
        };
        card.querySelector('#np-join-go').addEventListener('click', go);
      },

      close,
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    global.GameHub = global.GameHub || {};
    global.GameHub.NetplayUI = init();
  });
})(window);
