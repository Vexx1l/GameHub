/**
 * TragamonedasEngine — máquina de 3 rodillos contra la casa.
 */
(function (global) {
  const START_BALANCE = 500;

  // Símbolos con su peso (entre más alto, más frecuente) y multiplicador si caen los 3 iguales.
  const SYMBOLS = [
    { symbol: '🍒', weight: 30, payout3: 3, label: 'Cereza' },
    { symbol: '🍋', weight: 25, payout3: 4, label: 'Limón' },
    { symbol: '🍀', weight: 18, payout3: 6, label: 'Trébol' },
    { symbol: '🔔', weight: 12, payout3: 10, label: 'Campana' },
    { symbol: '⭐', weight: 8, payout3: 8, label: 'Estrella' },
    { symbol: '💎', weight: 5, payout3: 20, label: 'Diamante' },
    { symbol: '7️⃣', weight: 2, payout3: 50, label: 'Siete' },
  ];
  const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

  function pickSymbol() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const s of SYMBOLS) {
      if (r < s.weight) return s.symbol;
      r -= s.weight;
    }
    return SYMBOLS[0].symbol;
  }

  function payout3For(symbol) {
    const found = SYMBOLS.find((s) => s.symbol === symbol);
    return found ? found.payout3 : 0;
  }

  function TragamonedasEngine() {
    this.bus = new global.GameHub.EventBus();
    this.balance = global.GameHub.Storage.get('tragamonedas:balance', START_BALANCE);
    this.lastBet = 20;
  }

  TragamonedasEngine.prototype.canSpin = function (bet) {
    return bet > 0 && bet <= this.balance;
  };

  TragamonedasEngine.prototype.spin = function (bet) {
    if (!this.canSpin(bet)) return null;
    const reels = [pickSymbol(), pickSymbol(), pickSymbol()];
    let multiplier = 0;

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      multiplier = payout3For(reels[0]);
    } else {
      const cherryCount = reels.filter((s) => s === '🍒').length;
      if (cherryCount === 2) multiplier = 1; // pequeño premio de consuelo
    }

    const payout = Math.round(bet * multiplier);
    this.balance = this.balance - bet + payout;
    this.lastBet = bet;
    global.GameHub.Storage.set('tragamonedas:balance', this.balance);

    const outcome = {
      reels, bet, payout, multiplier,
      net: payout - bet,
      isWin: payout > 0,
      balance: this.balance,
    };
    this.bus.emit('spin-resolved', outcome);
    return outcome;
  };

  TragamonedasEngine.prototype.resetBalance = function () {
    this.balance = START_BALANCE;
    global.GameHub.Storage.set('tragamonedas:balance', this.balance);
    this.bus.emit('balance-changed', { balance: this.balance });
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.TragamonedasEngine = TragamonedasEngine;
  global.GameHub.TRAGAMONEDAS_SYMBOLS = SYMBOLS;
})(window);
