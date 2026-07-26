/**
 * ahorcado-bot.js — heurística simple para el Ahorcado.
 * "Fácil" tira letras casi al azar; "normal"/"difícil" siguen el orden
 * de frecuencia aproximado del español; "difícil" además intenta
 * adivinar la palabra completa cuando ya hay suficientes pistas y solo
 * queda una palabra candidata posible en el banco.
 */
(function (global) {
  const FREQUENCY = 'EAOSRNIDLCTUMPBGVYQHFZJÑXKW'.split('');

  function chooseLetter(guessedLetters, difficulty) {
    const remaining = FREQUENCY.filter((l) => !guessedLetters.has(l));
    if (!remaining.length) return null;
    if (difficulty === 'facil') {
      return remaining[Math.floor(Math.random() * Math.min(remaining.length, 12))];
    }
    return remaining[0];
  }

  /** Busca en el banco una única palabra candidata que calce con el patrón revelado y la categoría. */
  function findCandidateWord(WORD_BANK, category, length, pattern, normalizeWord) {
    const pool = WORD_BANK[category] || [];
    const matches = pool.filter((w) => {
      const norm = normalizeWord(w);
      if (norm.length !== length) return false;
      return pattern.every((ch, i) => ch === null || norm[i] === ch);
    });
    return matches.length === 1 ? matches[0] : null;
  }

  /**
   * Decide la acción del bot: { type: 'letter', letter } o { type: 'word', guess }.
   */
  function chooseAction({ guessedLetters, difficulty, category, length, pattern, WORD_BANK, normalizeWord }) {
    const revealedCount = pattern.filter((c) => c !== null).length;
    const revealedRatio = length ? revealedCount / length : 0;
    if (difficulty === 'dificil' && revealedRatio >= 0.6 && revealedRatio < 1) {
      const candidate = findCandidateWord(WORD_BANK, category, length, pattern, normalizeWord);
      if (candidate) return { type: 'word', guess: candidate };
    }
    const letter = chooseLetter(guessedLetters, difficulty);
    if (!letter) return null;
    return { type: 'letter', letter };
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.AhorcadoBot = { chooseAction, chooseLetter, findCandidateWord };
})(window);
