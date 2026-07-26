/**
 * blackjack-bot.js — heurística para Blackjack.
 *
 * Apuesta: "facil" siempre apuesta 25 fichas fijas; "normal" apuesta 50;
 * "dificil" varía entre 25 y 100 (más agresivo). Todos ajustan la
 * apuesta a lo que les quede si no les alcanza.
 *
 * Jugada: "facil" imita a la banca (pide carta con menos de 17, se
 * planta con 17+, nunca dobla). "normal" y "dificil" usan una versión
 * simplificada de estrategia básica: con 12 a 16 se plantan si la carta
 * visible de la banca es "débil" (2 a 6) y piden si es fuerte; "dificil"
 * además dobla con 10 u 11 cuando la banca muestra una carta débil o
 * media (2 a 9) y le alcanzan las fichas.
 */
(function (global) {
  function chooseBet(difficulty, balance) {
    let bet;
    if (difficulty === 'facil') bet = 25;
    else if (difficulty === 'normal') bet = 50;
    else bet = 25 * (1 + Math.floor(Math.random() * 4)); // 25, 50, 75 o 100
    return Math.max(0, Math.min(balance, bet));
  }

  function chooseAction(hand, dealerUpCard, difficulty, canDouble) {
    const H = global.GameHub.BlackjackHelpers;
    const { total, soft } = H.handValue(hand);
    const dealerVal = H.cardValue(dealerUpCard) === 11 ? 11 : H.cardValue(dealerUpCard);

    if (difficulty === 'facil') {
      return total < 17 ? 'hit' : 'stand';
    }

    if (canDouble && (total === 10 || total === 11) && difficulty === 'dificil' && dealerVal <= 9) {
      return 'double';
    }

    if (total >= 17) return 'stand';
    if (total <= 11) return 'hit';
    if (soft) return 'hit'; // manos blandas 12-16: seguir pidiendo es razonable con este nivel de simplificación
    // Duras 12-16: plantarse solo si la banca muestra carta débil (2 a 6).
    return (dealerVal >= 2 && dealerVal <= 6) ? 'stand' : 'hit';
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.BlackjackBot = { chooseBet, chooseAction };
})(window);
