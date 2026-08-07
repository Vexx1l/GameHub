/**
 * netplay.js — capa genérica de multijugador online para cualquier juego
 * del hub que sea determinista (mismo estado inicial + misma secuencia de
 * jugadas = mismo resultado en todas las pantallas).
 *
 * IDEA CENTRAL (para no tener que reescribir cada engine):
 * Cada dispositivo conectado a una sala corre su PROPIA copia del engine
 * del juego (ej. TatetiEngine), arrancada con los mismos "seats". Cuando
 * un jugador hace una jugada, en vez de llamar al engine directamente se
 * llama a `session.submitAction('play', [seatId, index])`. Esa acción se
 * guarda en Firebase en orden (Realtime Database respeta el orden de
 * inserción con push()); TODOS los dispositivos —incluido el que jugó—
 * reciben el mismo listado de acciones en el mismo orden y las aplican a
 * su copia local del engine. Como el engine es una función pura de sus
 * jugadas, todos terminan con el mismo tablero sin necesidad de mandar el
 * estado completo por la red.
 *
 * Esto significa que para sumar un juego nuevo casi no hay que tocar el
 * engine: alcanza con, en el *-ui.js, reemplazar las llamadas que mutan
 * el engine (ej. `engine.play(...)`) por `net.submitAction('play', [...])`
 * cuando `config.online` existe, y suscribirse a `net.onAction(...)` para
 * aplicar esas jugadas al engine local. Ver README-MULTIJUGADOR.md.
 *
 * Requiere que se hayan cargado antes (vía CDN, ver index.html):
 *   firebase-app-compat.js
 *   firebase-database-compat.js
 * y que js/core/firebase-config.js tenga la configuración real del
 * proyecto (si no, GameHub.Net.configured queda en false y el hub oculta
 * la opción "Jugar online").
 */
(function (global) {
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
  let app = null;
  let db = null;

  function ensureInit() {
    if (db) return db;
    if (!global.GameHub.firebaseConfigured || typeof firebase === 'undefined') return null;
    app = firebase.initializeApp(global.GameHub.firebaseConfig);
    db = firebase.database();
    return db;
  }

  function makeRoomCode() {
    let out = '';
    for (let i = 0; i < 4; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return out;
  }

  function makePlayerId() {
    return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function getOrCreatePlayerId(code) {
    const key = `noche-de-juegos:netplay:${code}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = makePlayerId();
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  /**
   * NetSession — representa la conexión de este dispositivo a una sala.
   * Se usa tanto durante el lobby (elegir asiento) como durante la
   * partida (mandar/recibir jugadas).
   */
  function NetSession(code, playerId, isHost) {
    this.code = code;
    this.playerId = playerId;
    this.isHost = isHost;
    this.rngSeed = null; // se completa después de leer/crear la sala
    this.roomRef = db.ref(`rooms/${code}`);
    this._actionCursorAttached = false;
    this._listeners = [];

    // Presencia: si se cierra la pestaña o se corta la conexión, avisamos.
    const presenceRef = this.roomRef.child(`players/${playerId}`);
    db.ref('.info/connected').on('value', (snap) => {
      if (snap.val() === true) {
        presenceRef.update({ connected: true });
        presenceRef.onDisconnect().update({ connected: false, disconnectedAt: firebase.database.ServerValue.TIMESTAMP });
      }
    });
  }

  NetSession.prototype.setName = function (name) {
    return this.roomRef.child(`players/${this.playerId}`).update({ name: name || 'Jugador', connected: true });
  };

  NetSession.prototype.claimSeat = function (seatId) {
    return this.roomRef.child('seats').once('value').then((snap) => {
      const seats = snap.val() || [];
      const next = seats.map((s) => {
        if (s.id === seatId) return { ...s, playerId: this.playerId, type: 'human' };
        if (s.playerId === this.playerId) return { ...s, playerId: null, type: 'bot' };
        return s;
      });
      return this.roomRef.child('seats').set(next);
    });
  };

  NetSession.prototype.onSeats = function (cb) {
    const ref = this.roomRef.child('seats');
    ref.on('value', (snap) => cb(snap.val() || []));
    this._listeners.push(() => ref.off('value'));
  };

  NetSession.prototype.onPlayers = function (cb) {
    const ref = this.roomRef.child('players');
    ref.on('value', (snap) => cb(snap.val() || {}));
    this._listeners.push(() => ref.off('value'));
  };

  NetSession.prototype.onStatus = function (cb) {
    const ref = this.roomRef.child('status');
    ref.on('value', (snap) => cb(snap.val() || 'lobby'));
    this._listeners.push(() => ref.off('value'));
  };

  /** Sólo el host la usa: pasa la sala de "lobby" a "playing" con los seats finales. */
  NetSession.prototype.startGame = function (finalSeats, speed) {
    return this.roomRef.update({ status: 'playing', speed: speed || 650, seats: finalSeats });
  };

  /** Vuelve a "lobby" (ej. para armar otra partida con la misma sala). */
  NetSession.prototype.backToLobby = function () {
    return this.roomRef.update({ status: 'lobby' });
  };

  /** Manda una jugada. method/args deben coincidir con un método del engine (ej. 'play', [seatId, idx]). */
  NetSession.prototype.submitAction = function (method, args) {
    return this.roomRef.child('actions').push({
      method,
      args: JSON.stringify(args),
      playerId: this.playerId,
      t: firebase.database.ServerValue.TIMESTAMP,
    });
  };

  /** Se suscribe a TODAS las jugadas de la sala, en orden. Ideal: llamar apenas se monta el juego. */
  NetSession.prototype.onAction = function (cb) {
    const ref = this.roomRef.child('actions');
    ref.on('child_added', (snap) => {
      const val = snap.val();
      if (!val) return;
      let args = [];
      try { args = JSON.parse(val.args); } catch (e) { args = []; }
      cb(val.method, args, val.playerId);
    });
    this._listeners.push(() => ref.off('child_added'));
  };

  /** Borra el log de jugadas (para empezar una ronda "en limpio" sin re-simular todo). Sólo host. */
  NetSession.prototype.clearActions = function () {
    return this.roomRef.child('actions').set(null);
  };

  NetSession.prototype.leave = function () {
    this._listeners.forEach((off) => off());
    this._listeners = [];
    this.roomRef.child(`players/${this.playerId}`).update({ connected: false });
  };

  const Net = {
    get configured() {
      return !!global.GameHub.firebaseConfigured;
    },

    ensureInit,

    /** Devuelve un preview de la sala (para mostrar nombre del juego / asientos antes de unirse). */
    previewRoom(code) {
      if (!ensureInit()) return Promise.reject(new Error('Firebase no está configurado.'));
      return db.ref(`rooms/${code.toUpperCase()}`).once('value').then((snap) => snap.val());
    },

    createRoom(gameId, seats, hostName) {
      if (!ensureInit()) return Promise.reject(new Error('Firebase no está configurado.'));
      const code = makeRoomCode();
      const playerId = getOrCreatePlayerId(code);
      const rngSeed = Math.floor(Math.random() * 2 ** 31);
      const seatsWithClaim = seats.map((s, i) => (i === 0
        ? { ...s, type: 'human', playerId }
        : { ...s, type: 'bot', playerId: null }));
      const roomRef = db.ref(`rooms/${code}`);
      return roomRef.set({
        gameId,
        status: 'lobby',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        hostId: playerId,
        rngSeed,
        seats: seatsWithClaim,
        players: { [playerId]: { name: hostName || 'Anfitrión', connected: true, host: true } },
      }).then(() => {
        const session = new NetSession(code, playerId, true);
        session.rngSeed = rngSeed;
        return session.setName(hostName).then(() => session);
      });
    },

    joinRoom(code, playerName) {
      if (!ensureInit()) return Promise.reject(new Error('Firebase no está configurado.'));
      const upperCode = code.toUpperCase().trim();
      const playerId = getOrCreatePlayerId(upperCode);
      const roomRef = db.ref(`rooms/${upperCode}`);
      return roomRef.once('value').then((snap) => {
        if (!snap.exists()) throw new Error('No encontramos ninguna sala con ese código.');
        const room = snap.val();
        const isHost = room.hostId === playerId;
        const session = new NetSession(upperCode, playerId, isHost);
        session.rngSeed = room.rngSeed || null;
        return session.setName(playerName).then(() => session);
      });
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Net = Net;
})(window);
