/**
 * Dice — utilidades de aleatoriedad para dados de 6 caras y para barajar
 * arreglos (mazos de cartas/fichas).
 *
 * Soporta un generador CON semilla (seeded): cuando hay una partida online,
 * netplay.js le da a todos los dispositivos la MISMA semilla antes de crear
 * el motor del juego. Como todos consumen la secuencia de "azar" en el
 * mismo orden (porque todos aplican las mismas jugadas, en el mismo orden,
 * ver netplay.js), el mazo barajado y cualquier otro resultado al azar
 * queda idéntico en todas las pantallas sin tener que mandar esos datos
 * por la red.
 */
(function (global) {
  let seededRandom = null; // null = usar Math.random (juego local normal)

  // PRNG determinista (mulberry32): mismo seed → misma secuencia siempre.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rand() {
    return seededRandom ? seededRandom() : Math.random();
  }

  const Dice = {
    /** Activa el modo determinista con esta semilla (partidas online). */
    seed(n) { seededRandom = mulberry32(Number(n) || 1); },
    /** Vuelve al azar normal (partidas locales). */
    reset() { seededRandom = null; },

    roll() {
      return 1 + Math.floor(rand() * 6);
    },
    rollPair() {
      return [Dice.roll(), Dice.roll()];
    },
    /** Reparte los índices 0..n-1 de un arreglo (Fisher-Yates) */
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Dice = Dice;
})(window);
