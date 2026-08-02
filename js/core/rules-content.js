/**
 * rules-content.js — reglas rápidas de todos los juegos "clásicos" del
 * hub, en un solo lugar (los juegos nuevos registran las suyas junto a
 * su propio código, en su carpeta js/games/<juego>/).
 */
(function (global) {
  const R = global.GameHub.Rules;

  R.registerRules('parques', {
    title: 'Parqués',
    intro: 'De 2 a 4 jugadores. Saca tus 4 fichas de la casa y llévalas a la meta antes que nadie.',
    bullets: [
      'Tira el dado; con 5 o dobles puedes sacar una ficha de la casa.',
      'Al caer sobre una ficha rival (fuera de las casillas seguras) la mandas de vuelta a su casa.',
      'Tres dobles seguidos castigan tu última ficha movida, devolviéndola a la casa.',
      'Cada ficha entra a su columna final privada y llega a la meta con el número exacto.',
      'Gana quien lleve sus 4 fichas a la meta primero.',
    ],
  });

  R.registerRules('domino', {
    title: 'Dominó',
    intro: 'Doble-seis, 28 fichas. 2 o 4 jugadores.',
    bullets: [
      'Cada jugador recibe 7 fichas; con 4 jugadores el reparto es cerrado (sin pozo).',
      'En tu turno, coloca una ficha que combine con alguno de los dos extremos abiertos del tablero.',
      'Si no tienes jugada posible (y hay pozo), robas hasta poder jugar o agotarlo.',
      'Ganas la ronda si te quedas sin fichas, o si se traba el juego y tienes menos puntos en mano.',
    ],
  });

  R.registerRules('naipes', {
    title: 'Escalera y Trío',
    intro: '2 barajas + comodines (108 cartas). Arma tu combinación antes que los demás.',
    bullets: [
      'Elige tu combinación objetivo: "4-4-3" (dos grupos de 4 del mismo rango + un grupo de 3) o "5-3-3" (una escalera de 5 del mismo palo + dos grupos de 3).',
      'En tu turno roba una carta (del mazo o del descarte rival) y luego descarta una para volver a 10 en mano.',
      'Cantas y ganas la ronda apenas tus 11 cartas armen exactamente tu combinación elegida.',
    ],
  });

  R.registerRules('uno', {
    title: 'UNO',
    intro: '2 a 8 jugadores. Sé el primero en quedarte sin cartas.',
    bullets: [
      'Juega una carta que combine en color o número/símbolo con la última del descarte.',
      'Las cartas especiales saltan turno, invierten el sentido o suman cartas al siguiente jugador.',
      'Un comodín cambia el color vigente; el comodín "+4" también suma 4 cartas al rival.',
      'Al quedarte con 1 carta debes cantar "¡UNO!" antes de tu próximo turno o te penalizas con +2.',
    ],
  });

  R.registerRules('ahorcado', {
    title: 'Ahorcado',
    intro: 'Adivina la palabra letra por letra antes de agotar los intentos.',
    bullets: [
      'Por turnos, cada jugador dice una letra o intenta la palabra completa.',
      'Si aciertas una letra, se revela en la palabra y sigues jugando; si fallas, se suma un error compartido y pasa el turno.',
      'Hay un máximo de 6 errores; si se llega a ese límite, la ronda termina sin ganador.',
      'Completar la palabra da un bono extra de puntos.',
    ],
  });

  R.registerRules('generala', {
    title: 'Generala',
    intro: 'Variante latinoamericana del Yahtzee, para 1 a 8 jugadores.',
    bullets: [
      'En tu turno tiras 5 dados hasta 3 veces, pudiendo retener los que quieras entre tiradas.',
      'Al final debes anotar el resultado en una de las 10 categorías que te queden libres.',
      'Escalera = 20 pts, Full = 30 pts, Póker = 40 pts, Generala = 50 pts (100 si sale "servida" a la primera).',
      'La partida termina cuando todos completan sus 10 categorías; gana el total más alto.',
    ],
  });

  R.registerRules('trivia', {
    title: 'Trivia',
    intro: 'Preguntas de opción múltiple, 1 a 8 jugadores.',
    bullets: [
      'Cada ronda es una pregunta con 4 opciones, de una categoría al azar.',
      'Por turnos, cada jugador tiene un único intento; si falla, esa opción queda descartada para los demás.',
      'Acertar en el primer intento vale 15 puntos; acertar después de que otros fallaron vale 10.',
      'Si todos fallan, se revela la respuesta correcta y la ronda termina sin ganador.',
    ],
  });

  R.registerRules('ruleta', {
    title: 'Ruleta',
    intro: 'Ruleta europea (un solo cero), tú contra la banca.',
    bullets: [
      'Apuesta a números, colores (rojo/negro), pares/impares, docenas o columnas.',
      'La bola cae en un número del 0 al 36; se pagan las apuestas que lo cubran.',
      'Apostar a un número exacto paga más (35 a 1) que apostar a color o par/impar (1 a 1).',
    ],
  });

  R.registerRules('tragamonedas', {
    title: 'Tragamonedas',
    intro: 'Máquina de 3 rodillos contra la casa.',
    bullets: [
      'Elige tu apuesta y gira los 3 rodillos.',
      'Si caen 3 símbolos iguales, ganas según el multiplicador de ese símbolo.',
      'Símbolos raros (💎, 7️⃣) pagan mucho más que los comunes (🍒, 🍋).',
    ],
  });

  R.registerRules('sietezero', {
    title: 'Selección de Ensueño',
    intro: 'Arma tu selección y busca el "7 a 0": campeón, invicto y sin recibir goles.',
    bullets: [
      'Tira el dado para que te toque una selección/plantilla al azar.',
      'Elige un jugador real de esa plantilla para cada posición de tu formación (POR/DEF/MED/DEL).',
      'Se simula un Mundial ficticio: 3 partidos de grupo + 4 de eliminación directa.',
      'Elegir un estilo más ofensivo o defensivo mueve tu ataque y defensa en la simulación.',
    ],
  });

  R.registerRules('quiniela', {
    title: 'Quiniela de Fútbol',
    intro: '1 a 8 jugadores. Adivina los marcadores de la jornada.',
    bullets: [
      'Cada jornada sortea 5 partidos entre 16 equipos ficticios.',
      'Pronostica el marcador exacto de los 5 partidos antes de que se revele la jornada.',
      'Marcador exacto = 3 puntos; acertar solo el resultado (local/empate/visitante) = 1 punto.',
    ],
  });

  R.registerRules('bingo', {
    title: 'Bingo',
    intro: 'Bingo clásico de 75 bolas, 1 a 8 jugadores.',
    bullets: [
      'Cada jugador recibe un cartón 5x5 (columnas B-I-N-G-O, centro libre) que se marca solo cuando sale su número.',
      '"Línea" (fila, columna o diagonal completa) da 10 puntos al primero que la logre, sin terminar la ronda.',
      '"¡Bingo!" (cartón lleno) da 50 puntos y termina la ronda.',
    ],
  });

  R.registerRules('penales', {
    title: 'Tanda de Penales',
    intro: '1 a 2 jugadores. Definí a puro penal.',
    bullets: [
      'Al patear, elige una de las 6 zonas del arco; al atajar, elige a dónde volar.',
      'Si coinciden zona de disparo y de atajada, el arquero ataja; si no, es gol (salvo que se vaya afuera).',
      'Se juegan 5 rondas por lado; si hay empate, sigue en muerte súbita.',
    ],
  });

  R.registerRules('blackjack', {
    title: 'Blackjack (21)',
    intro: '1 a 5 jugadores contra la banca.',
    bullets: [
      'Acércate a 21 sin pasarte; le ganas a la banca si tu total es mayor (sin pasarte) o si la banca se pasa.',
      'Puedes pedir carta, plantarte o doblar tu apuesta (solo como primera acción).',
      'La banca pide carta mientras tenga menos de 17 y se planta siempre en 17 o más.',
      'Un Blackjack natural (as + carta de 10) paga 3 a 2; una mano ganadora normal paga 1 a 1.',
    ],
  });

  R.registerRules('rummikub', {
    title: 'Rummikub',
    intro: '1 jugador contra bots, fichas numeradas del 1 al 13 en 4 colores + comodines.',
    bullets: [
      'Tu primera jugada debe sumar al menos 30 puntos en grupos (mismo número, colores distintos) o escaleras (mismo color, consecutivos).',
      'Una vez habilitado, puedes agregar fichas de tu mano al final de escaleras existentes o a grupos con menos de 4 fichas.',
      'Si el pozo se agota, la partida termina y gana quien tenga menor valor de fichas en mano.',
    ],
  });
})(window);
