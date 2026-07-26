/**
 * Rummikub — heurística del bot.
 * En cada "paso" busca la mejor jugada disponible (extender un
 * conjunto de la mesa, o formar el mejor conjunto nuevo posible con
 * la mano actual) y la aplica. La UI llama a chooseAction en bucle
 * hasta que devuelve null, y entonces roba una ficha.
 */
(function (global) {
  const Engine = global.GameHub.RummikubEngine;

  function combinations(arr, size, start, current, out) {
    if (current.length === size) { out.push(current.slice()); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combinations(arr, size, i + 1, current, out);
      current.pop();
    }
  }

  function bestNewSet(hand) {
    const maxSize = Math.min(hand.length, 7);
    let best = null;
    for (let size = 3; size <= maxSize; size++) {
      const combos = [];
      combinations(hand, size, 0, [], combos);
      combos.forEach((tiles) => {
        const result = Engine.evaluateSet(tiles);
        if (result.valid && (!best || result.value > best.value)) {
          best = { uids: tiles.map((t) => t.uid), value: result.value };
        }
      });
    }
    return best;
  }

  function bestExtend(engine, seatId) {
    const hand = engine.hands[seatId];
    for (let s = 0; s < engine.board.length; s++) {
      const set = engine.board[s];
      for (let i = 0; i < hand.length; i++) {
        const candidate = set.tiles.concat([hand[i]]);
        if (Engine.evaluateSet(candidate).valid) {
          return { setIndex: s, uid: hand[i].uid };
        }
      }
    }
    return null;
  }

  const RummikubBot = {
    /** Devuelve una acción a aplicar, o null si ya no hay más jugadas posibles. */
    chooseAction(engine, seatId) {
      if (engine.hasMelded[seatId]) {
        const extend = bestExtend(engine, seatId);
        if (extend) return { type: 'extend', setIndex: extend.setIndex, uid: extend.uid };
      }
      const hand = engine.hands[seatId];
      const newSet = bestNewSet(hand);
      if (newSet) return { type: 'play', uids: newSet.uids };
      return null;
    },
  };

  global.GameHub = global.GameHub || {};
  global.GameHub.RummikubBot = RummikubBot;
})(window);
