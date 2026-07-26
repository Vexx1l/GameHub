/**
 * board-data.js — geometría del tablero de Parqués.
 *
 * El tablero es una cuadrícula de 15x15. Usamos [fila, columna] con
 * origen (0,0) en la esquina superior izquierda.
 *
 * GLOBAL_PATH: las 52 casillas de la pista compartida, en orden de
 * recorrido (sentido horario). Cada color entra en un punto distinto
 * y, tras dar casi toda la vuelta (51 casillas), se desvía a su propia
 * columna final de 6 casillas que termina en el centro.
 */
(function (global) {
  const GLOBAL_PATH = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7],
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14],
    [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7],
    [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0],
    [6, 0],
  ];

  const CENTER = [7, 7];

  const COLORS = ['red', 'green', 'yellow', 'blue'];

  const COLOR_META = {
    red: { label: 'Rojo', hex: 'var(--player-red)', startIndex: 0 },
    green: { label: 'Verde', hex: 'var(--player-green)', startIndex: 13 },
    yellow: { label: 'Amarillo', hex: 'var(--player-yellow)', startIndex: 26 },
    blue: { label: 'Azul', hex: 'var(--player-blue)', startIndex: 39 },
  };

  const HOME_COLUMNS = {
    red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  };

  // Casillas seguras dentro de GLOBAL_PATH (índices 0-51): las 4 casillas
  // de salida y 4 "estrellas" intermedias. En una casilla segura no puede
  // haber captura.
  const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

  // Slots visuales (2x2) de cada casa/yard, dentro de sus cuadrantes 6x6.
  const YARD_SLOTS = {
    red: [[2, 2], [2, 3], [3, 2], [3, 3]],
    green: [[2, 11], [2, 12], [3, 11], [3, 12]],
    yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
    blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
  };

  /**
   * Construye la ruta completa de un color como lista de [fila,col],
   * longitud 58 (0..57): 51 casillas compartidas + 6 de columna final +
   * 1 casilla central (meta). Se usa solo para dibujar; la lógica de
   * juego trabaja con índices numéricos (ver parques-engine.js).
   */
  function fullPathCells(color) {
    const meta = COLOR_META[color];
    const shared = [];
    for (let i = 0; i < 51; i++) {
      shared.push(GLOBAL_PATH[(meta.startIndex + i) % 52]);
    }
    return shared.concat(HOME_COLUMNS[color]).concat([CENTER]);
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.ParquesBoard = {
    GLOBAL_PATH,
    CENTER,
    COLORS,
    COLOR_META,
    HOME_COLUMNS,
    SAFE_INDICES,
    YARD_SLOTS,
    fullPathCells,
    TRACK_LENGTH: 52,
    HOME_STRETCH: 6,
    FINISH_STEP: 57, // 51 + 6 = posición de la casilla central (meta)
  };
})(window);
