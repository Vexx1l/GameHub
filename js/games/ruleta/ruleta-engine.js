/**
 * RuletaEngine — ruleta europea (un solo cero), contra la casa.
 * Sin bots: es el jugador contra la banca, así que solo hay un asiento.
 */
(function (global) {
  const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  // Orden real de los números en la rueda europea, usado solo para animar el giro.
  const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const START_BALANCE = 1000;

  function colorOf(n) {
    if (n === 0) return 'green';
    return RED_NUMBERS.has(n) ? 'red' : 'black';
  }

  function RuletaEngine() {
    this.bus = new global.GameHub.EventBus();
    this.bets = []; // { type, value, amount, label }
    this.lastBets = [];
    this.balance = global.GameHub.Storage.get('ruleta:balance', START_BALANCE);
    this.history = global.GameHub.Storage.get('ruleta:historial', []);
  }

  RuletaEngine.prototype.totalStaked = function () {
    return this.bets.reduce((sum, b) => sum + b.amount, 0);
  };

  RuletaEngine.prototype.availableToBet = function () {
    return this.balance - this.totalStaked();
  };

  RuletaEngine.prototype.placeBet = function (bet) {
    if (bet.amount <= 0) return false;
    if (bet.amount > this.availableToBet()) return false;
    const existing = this.bets.find((b) => b.type === bet.type && b.value === bet.value);
    if (existing) {
      existing.amount += bet.amount;
    } else {
      this.bets.push({ ...bet });
    }
    this.bus.emit('bets-changed', { bets: this.bets });
    return true;
  };

  RuletaEngine.prototype.clearBets = function () {
    this.bets = [];
    this.bus.emit('bets-changed', { bets: this.bets });
  };

  RuletaEngine.prototype.canSpin = function () {
    return this.bets.length > 0 && this.totalStaked() <= this.balance;
  };

  RuletaEngine.prototype.evaluate = function (bet, result, color) {
    switch (bet.type) {
      case 'number':
        return bet.value === result ? 35 : null;
      case 'color':
        return result !== 0 && bet.value === color ? 1 : null;
      case 'parity':
        if (result === 0) return null;
        return (bet.value === 'even') === (result % 2 === 0) ? 1 : null;
      case 'range':
        if (result === 0) return null;
        return (bet.value === 'low') === (result <= 18) ? 1 : null;
      case 'dozen':
        if (result === 0) return null;
        return Math.ceil(result / 12) === bet.value ? 2 : null;
      case 'column':
        if (result === 0) return null;
        return ((result - 1) % 3) + 1 === bet.value ? 2 : null;
      default:
        return null;
    }
  };

  /** Resuelve la tirada actual y liquida las apuestas. Devuelve el resumen del resultado. */
  RuletaEngine.prototype.spin = function () {
    if (!this.canSpin()) return null;
    const staked = this.totalStaked();
    const result = Math.floor(Math.random() * 37);
    const color = colorOf(result);

    let winnings = 0;
    const settledBets = this.bets.map((bet) => {
      const multiplier = this.evaluate(bet, result, color);
      const won = multiplier !== null;
      if (won) winnings += bet.amount * multiplier + bet.amount; // devuelve apuesta + ganancia
      return { ...bet, won };
    });

    this.balance = this.balance - staked + winnings;
    global.GameHub.Storage.set('ruleta:balance', this.balance);

    this.history.unshift({ number: result, color });
    if (this.history.length > 24) this.history.length = 24;
    global.GameHub.Storage.set('ruleta:historial', this.history);

    const outcome = {
      result, color, staked, winnings,
      net: winnings - staked,
      settledBets,
      balance: this.balance,
      wheelIndex: WHEEL_ORDER.indexOf(result),
    };
    this.lastBets = this.bets.map((b) => ({ type: b.type, value: b.value, amount: b.amount }));
    this.bets = [];
    this.bus.emit('spin-resolved', outcome);
    return outcome;
  };

  /** Vuelve a colocar la última apuesta liquidada (usado por auto-jugar). Devuelve false si no alcanza el saldo. */
  RuletaEngine.prototype.repeatLastBets = function () {
    if (!this.lastBets.length) return false;
    const total = this.lastBets.reduce((sum, b) => sum + b.amount, 0);
    if (total > this.balance) return false;
    this.bets = this.lastBets.map((b) => ({ ...b }));
    this.bus.emit('bets-changed', { bets: this.bets });
    return true;
  };

  RuletaEngine.prototype.resetBalance = function () {
    this.balance = START_BALANCE;
    global.GameHub.Storage.set('ruleta:balance', this.balance);
    this.bus.emit('balance-changed', { balance: this.balance });
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.RuletaEngine = RuletaEngine;
  global.GameHub.RULETA_WHEEL_ORDER = WHEEL_ORDER;
  global.GameHub.RULETA_RED = RED_NUMBERS;
  global.GameHub.ruletaColorOf = colorOf;
})(window);
