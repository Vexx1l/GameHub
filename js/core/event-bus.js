/**
 * EventBus — pub/sub simple, sin dependencias.
 * Se usa para comunicar el motor de un juego con su UI y con el hub,
 * sin acoplarlos directamente.
 */
(function (global) {
  function EventBus() {
    this._listeners = new Map();
  }

  EventBus.prototype.on = function (event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  };

  EventBus.prototype.off = function (event, handler) {
    if (this._listeners.has(event)) this._listeners.get(event).delete(handler);
  };

  EventBus.prototype.emit = function (event, payload) {
    if (this._listeners.has(event)) {
      // copiamos a array por si un handler se desuscribe durante la emisión
      Array.from(this._listeners.get(event)).forEach((fn) => fn(payload));
    }
  };

  EventBus.prototype.clear = function () {
    this._listeners.clear();
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.EventBus = EventBus;
})(window);
