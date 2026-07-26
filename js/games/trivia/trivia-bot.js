/**
 * trivia-bot.js — heurística simple para Trivia: simula distintos
 * niveles de "conocimiento" con una probabilidad de acertar en vez de
 * una búsqueda real, ya que no hay forma de "razonar" la respuesta.
 */
(function (global) {
  const CHANCE = { facil: 0.35, normal: 0.6, dificil: 0.85 };

  function chooseAnswer(question, difficulty) {
    const chance = CHANCE[difficulty] || CHANCE.normal;
    if (Math.random() < chance) return question.correct;
    const wrongIndices = question.options.map((_, i) => i).filter((i) => i !== question.correct);
    return wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.TriviaBot = { chooseAnswer };
})(window);
