/**
 * Dice — utilidades de aleatoriedad para dados de 6 caras.
 * Centralizado para que sea fácil, por ejemplo, cambiar a un
 * generador con semilla (seeded) más adelante si se quiere
 * reproducir partidas.
 */
(function (global) {
  const Dice = {
    roll() {
      return 1 + Math.floor(Math.random() * 6);
    },
    rollPair() {
      return [Dice.roll(), Dice.roll()];
    },
    /** Reparte los índices 0..n-1 de un arreglo (Fisher-Yates) */
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.Dice = Dice;
})(window);
