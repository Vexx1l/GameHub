# Noche de Juegos 🎲

Un hub de juegos de mesa en el navegador, sin dependencias externas ni
servidor: HTML + CSS + JavaScript puro. Incluye **Parqués**, **Dominó**,
**Escalera y Trío** (naipes, 4-4-3 / 5-3-3), **UNO**, **Ahorcado**,
**Generala**, **Trivia**, **Ruleta**, **Tragamonedas**, **Selección de
Ensueño** (armado de un once histórico de Mundiales), **Quiniela de
Fútbol**, **Bingo**, **Tanda de Penales** y **Blackjack (21)**, cada uno
con la opción de jugar tú contra bots, o dejar que los bots jueguen
solos en modo espectador (salvo los juegos de casino, que son 1
jugador contra la banca, y la Tanda de Penales, pensada para 1 o 2).

## Cómo abrirlo

Simplemente abre `index.html` con doble clic en tu navegador. No usa
módulos ES (`import`/`export`), así que funciona directo desde el
sistema de archivos (`file://`), sin necesitar un servidor local.

Si más adelante agregas módulos ES o `fetch` a algún archivo local,
sí vas a necesitar un servidor simple, por ejemplo:

```bash
cd game-hub
python3 -m http.server 8000
# abre http://localhost:8000
```

## Estructura del proyecto

```
game-hub/
├── index.html                  # Punto de entrada, carga todo en orden
├── css/
│   ├── tokens.css              # Paleta de colores, tipografías, radios
│   ├── base.css                # Reset y utilidades compartidas
│   ├── hub.css                 # Estantería de juegos + panel de setup
│   ├── parques.css             # Tablero y panel lateral de Parqués
│   ├── domino.css              # Fichas y mesa de Dominó
│   ├── naipes.css              # Cartas y mesa de Escalera y Trío
│   ├── uno.css                 # Cartas y mesa de UNO
│   ├── ahorcado.css            # Muñeco, teclado y palabra del Ahorcado
│   ├── generala.css            # Dados y tabla de puntajes de Generala
│   ├── trivia.css              # Preguntas y opciones de Trivia
│   ├── casino.css              # Ruleta y Tragamonedas
│   ├── sietezero.css           # Selección de Ensueño
│   ├── quiniela.css            # Partidos y marcadores de la Quiniela
│   ├── bingo.css               # Cartones y bolas cantadas del Bingo
│   ├── penales.css             # Arco y marcador de la Tanda de Penales
│   └── blackjack.css           # Mesa, cartas y fichas de Blackjack
└── js/
    ├── core/
    │   ├── event-bus.js        # Pub/sub simple (motor ⇄ interfaz)
    │   ├── storage.js           # Envoltorio de localStorage (estadísticas)
    │   ├── dice.js              # Aleatoriedad compartida (dados, barajado)
    │   └── game-registry.js    # Patrón de plugin para registrar juegos
    ├── games/
    │   ├── parques/
    │   │   ├── board-data.js       # Geometría del tablero (coordenadas)
    │   │   ├── parques-engine.js   # Reglas puras (sin DOM)
    │   │   ├── parques-bot.js      # Heurística de la IA
    │   │   └── parques-ui.js       # Render + registro en el hub
    │   ├── domino/
    │   │   ├── domino-engine.js
    │   │   ├── domino-bot.js
    │   │   └── domino-ui.js
    │   ├── naipes/
    │   │   ├── naipes-engine.js    # Reglas puras del 4-4-3 / 5-3-3
    │   │   ├── naipes-bot.js       # Heurística de la IA
    │   │   └── naipes-ui.js
    │   ├── uno/
    │   │   ├── uno-engine.js       # Reglas puras de UNO
    │   │   ├── uno-bot.js          # Heurística de la IA
    │   │   └── uno-ui.js
    │   ├── ahorcado/
    │   │   ├── ahorcado-engine.js  # Reglas puras del Ahorcado
    │   │   ├── ahorcado-bot.js     # Heurística de la IA
    │   │   └── ahorcado-ui.js
    │   ├── generala/
    │   │   ├── generala-engine.js  # Reglas puras de Generala
    │   │   ├── generala-bot.js     # Heurística de la IA
    │   │   └── generala-ui.js
    │   ├── trivia/
    │   │   ├── trivia-engine.js    # Motor + banco de 90 preguntas
    │   │   ├── trivia-bot.js       # Heurística de la IA
    │   │   └── trivia-ui.js
    │   ├── ruleta/
    │   │   ├── ruleta-engine.js    # Ruleta europea, contra la banca
    │   │   └── ruleta-ui.js
    │   ├── tragamonedas/
    │   │   ├── tragamonedas-engine.js
    │   │   └── tragamonedas-ui.js
    │   ├── sietezero/               # Selección de Ensueño
    │   │   ├── sietezero-data.js
    │   │   ├── sietezero-engine.js
    │   │   ├── sietezero-missions.js
    │   │   └── sietezero-ui.js
    │   ├── quiniela/
    │   │   ├── quiniela-engine.js  # Reglas puras + sorteo de partidos
    │   │   ├── quiniela-bot.js     # Heurística de la IA
    │   │   └── quiniela-ui.js
    │   ├── bingo/
    │   │   ├── bingo-engine.js     # Cartones, bolas y detección de línea/bingo
    │   │   └── bingo-ui.js         # (sin bot: el Bingo no tiene decisiones que tomar)
    │   ├── penales/
    │   │   ├── penales-engine.js   # Reglas puras de la tanda (5 + muerte súbita)
    │   │   ├── penales-bot.js      # Heurística de la IA
    │   │   └── penales-ui.js
    │   └── blackjack/
    │       ├── blackjack-engine.js # Zapato de 6 mazos, reglas puras
    │       ├── blackjack-bot.js    # Heurística de la IA
    │       └── blackjack-ui.js
    └── app.js                  # Hub: estantería, setup de asientos, arranque
```

Cada juego separa **motor** (reglas, sin tocar el DOM) de **interfaz**
(dibuja el tablero y conecta clics con el motor). Esto hace más fácil
depurar reglas por separado y, si quieres, escribir tests del motor con
Node sin necesitar un navegador (así los probé mientras lo construía).

## Cómo agregar un nuevo juego

1. Crea `js/games/mi-juego/` con tu motor + tu interfaz, siguiendo el
   mismo patrón que Parqués o Dominó.
2. Al final de tu archivo de interfaz, llama a:

   ```js
   GameHub.registerGame({
     id: 'mi-juego',
     name: 'Mi Juego',
     tagline: 'Una frase corta',
     tag: 'CLÁSICO · 2 JUGADORES',
     icon: '<svg>...</svg>',
     seatSpec: { fixed: false, allowedCounts: [2, 3, 4] },
     mount(container, config) {
       // config = { seats, speed, onExit }
       // dibuja tu juego dentro de `container`
       // devuelve { destroy() { ... } } para limpiar listeners/timers
     },
   });
   ```

3. Agrega el `<script>` de tus archivos nuevos en `index.html`, antes
   de `js/app.js`.

El hub (`app.js`) nunca importa nada de Parqués o Dominó directamente;
solo recorre `GameHub.getGames()`. Por eso agregar un juego nuevo no
requiere tocar el hub en absoluto.

## Simplificaciones de reglas (para que sepas qué expandir)

**Parqués**
- Con un doble solo puede salir **una** ficha de la casa por turno
  (no dos), aunque sea doble-cinco.
- No hay bloqueo de paso: dos fichas propias en una casilla se pueden
  apilar, pero no impiden que un rival pase por encima.
- Tres dobles seguidos castigan la ficha más avanzada del jugador
  (aproximación a "la última movida").
- El movimiento por suma de ambos dados siempre está disponible como
  opción adicional a mover cada dado por separado.

**Dominó**
- Con 4 jugadores se reparten las 28 fichas completas (dominó
  "cerrado", sin pozo), al estilo colombiano.
- Con 2 jugadores se reparten 7 fichas cada uno y quedan 14 en el
  pozo para robar.
- Puntaje: quien gana una ronda (por dominó o por mesa cerrada) suma
  el total de pips que quedaron en las manos rivales. No hay un
  puntaje objetivo para terminar la partida — cada ronda muestra el
  marcador y puedes seguir jugando rondas indefinidamente.

**Escalera y Trío (naipes 4-4-3 / 5-3-3)**
- Se juega con 2 barajas de póker + 2 comodines por baraja (108 cartas
  en total), para 4 a 8 jugadores.
- Cada jugador recibe 10 cartas y, antes de empezar, elige en privado
  (bueno, "en privado" dentro de lo que da jugar todos en la misma
  pantalla) qué combinación va a armar:
  - **4-4-3**: dos grupos de 4 cartas del mismo rango (el palo no
    importa) + un grupo de 3 del mismo rango.
  - **5-3-3**: una escalera de 5 cartas consecutivas del **mismo palo**
    (obligatorio) + dos grupos de 3 del mismo rango.
- En su turno, cada jugador roba una carta (del mazo o del descarte de
  la persona anterior), queda con 11 en mano, y si esas 11 arman su
  combinación elegida puede cerrar y ganar la ronda. Si no, descarta
  una y vuelve a 10 — nunca se queda con 11 salvo ese instante de
  ganar, tal como se pidió.
- Los comodines son comodín total dentro de cualquier grupo, siempre
  que el grupo tenga al menos una carta natural que defina el rango o
  el palo (no se permite un grupo armado 100% de comodines).
- El As siempre cuenta como carta baja (no hay escalera Q-K-A ni un As
  "que da la vuelta").
- No hay bajadas parciales a la mesa durante la ronda: es rummy
  "cerrado", todo se resuelve en la mano y se revela solo al ganar.
- Si el jugador elegido no puede cambiar de combinación a mitad de
  ronda — la elección del inicio es la que cuenta hasta que alguien
  gane o se reparta de nuevo.
- Puntaje: quien gana la ronda suma los puntos de las cartas que
  quedaron en las manos rivales (número = su valor, J/Q/K = 10, As = 1,
  comodín = 20). Igual que en Dominó, no hay un puntaje objetivo para
  terminar la partida.

**UNO**
- Mazo estándar de 108 cartas: 4 colores con un 0, dos de cada número
  1-9, dos "salta turno", dos "reversa" y dos "+2" por color (25 x 4 =
  100), más 4 comodines de color y 4 comodines "+4" (8 más).
- De 2 a 8 jugadores, reparto de 7 cartas cada uno.
- La carta inicial del descarte siempre se elige entre las cartas
  numéricas del mazo (nunca una especial ni un comodín), para no tener
  que resolver el caso "la partida empieza con un +4 en la mesa".
- El comodín "+4" se puede jugar en cualquier momento, sin exigir que
  demuestres que no tenías cartas del color vigente (regla oficial que
  se omite aquí para simplificar).
- "Cantar UNO": al quedarte con 1 carta debes marcarlo con el botón
  ¡UNO! antes de que te vuelva el turno. Si lo olvidas, te castigas
  solo con +2 cartas de penalización apenas te toque jugar de nuevo.
  Como todas las manos son visibles en una sola pantalla compartida,
  no existe la mecánica de "cachar" a otro jugador por no cantarlo.
- Si robas una carta porque no tenías ninguna jugable, solo puedes
  jugar esa misma carta recién robada (o guardarla y pasar el turno);
  no puedes jugar otra carta de tu mano ese turno.
- Puntaje: quien se queda sin cartas suma los puntos de las cartas que
  quedaron en las manos rivales (número = su valor, salta/reversa/+2 =
  20, comodín/+4 = 50). Como en Dominó y Escalera y Trío, no hay
  puntaje objetivo para terminar la partida — se puede seguir jugando
  rondas indefinidamente.

**Ahorcado**
- Pensado para 1 a 6 jugadores (bots incluidos) por turnos, en vez del
  clásico "1 jugador contra el diccionario": así es más entretenido en
  grupo.
- Se elige una palabra al azar de un banco con 6 categorías (Animales,
  Frutas, Países, Deportes, Profesiones, Objetos). Se evita repetir
  palabra mientras queden otras disponibles en el banco.
- En su turno, cada jugador dice una letra o intenta adivinar la
  palabra completa. Si acierta una letra, se revela en todas sus
  posiciones y ese jugador sigue jugando (para premiar los aciertos);
  si falla, se dibuja una parte del ahorcado (error compartido entre
  todos) y pasa el turno al siguiente jugador.
- Hay un máximo de 6 errores compartidos (como las partes clásicas del
  muñeco); si se llega a ese máximo, la ronda termina sin ganador y se
  revela la palabra.
- Para comparar letras se ignoran tildes (á/a cuentan igual), pero la
  "ñ" se mantiene como letra propia y distinta de "n".
- Puntaje: +5 puntos por cada letra acertada (multiplicado si esa
  letra aparece varias veces en la palabra) y +25 puntos extra a quien
  complete la palabra (con la última letra o adivinándola de una). Sin
  puntaje objetivo para terminar la partida, igual que los demás
  juegos del hub.

**Generala**
- Para 1 a 8 jugadores. Cada turno se tiran 5 dados hasta 3 veces
  (puedes retener los que quieras entre tiradas) y al final anotas el
  resultado en una de tus 10 categorías libres: Unos a Seises (suma de
  esos dados), Escalera (20 pts), Full (30 pts), Póker (40 pts) y
  Generala (50 pts, o 100 si sale "servida": los 5 iguales de una, en
  la primera tirada del turno).
- Puedes anotar en cualquier categoría libre aunque tus dados no
  califiquen — queda en 0 y así "sacrificas" una categoría difícil,
  igual que en el Yahtzee clásico.
- La partida (la "ronda" del hub) termina cuando todos los jugadores
  completaron sus 10 categorías; gana quien tenga más puntos en esa
  partida. El total de cada partida se suma a un acumulado histórico
  visible en el panel lateral, y se puede jugar partida tras partida
  sin un puntaje objetivo para terminar.
- Simplificación: no hay "escalera corta" ni bonus por doble Generala.

**Trivia**
- Para 1 a 8 jugadores. Banco propio de 90 preguntas de opción
  múltiple repartidas en 6 categorías (Historia, Ciencia, Geografía,
  Deportes, Entretenimiento, Arte y Literatura), sin repetir pregunta
  mientras queden otras disponibles.
- Cada ronda es una sola pregunta: por turnos, cada jugador tiene un
  único intento; si falla, esa opción queda marcada como descartada
  para ayudar a los siguientes y el turno pasa al próximo jugador que
  no haya intentado. Si todos fallan, se revela la respuesta correcta
  y la ronda termina sin ganador.
- Puntaje: 15 puntos si aciertas en el primer intento de la ronda, 10
  si aciertas después de que otros ya fallaron. Los bots "saben" la
  respuesta correcta con una probabilidad según su dificultad (35% /
  60% / 85%) en vez de razonar el contenido. Sin puntaje objetivo para
  terminar la partida, igual que los demás juegos del hub.

**Selección de Ensueño**
- Inspirado en la mecánica pública del juego 7a0 (7a0.com.br) — reimplementación
  propia, con código y datos originales, sin usar nada del sitio original.
- Base de datos propia: 20 planteles reales de Mundiales 1950-2022 (~12
  jugadores por plantel, no el plantel completo de 23), elegidos
  priorizando selecciones campeonas (mejor documentadas) más algunas
  subcampeonas icónicas y dos planteles de Colombia. Las valoraciones de
  cada jugador son una estimación propia, no oficiales — se pueden ajustar
  a mano en `sietezero-data.js` si algo no cuadra con tu memoria futbolera.
- Para 1 a 4 jugadores. Cada uno, por turnos, elige formación (4-3-3,
  4-4-2, 3-5-2, 5-3-2, 4-2-4 o 3-4-3), estilo (defensivo/equilibrado/
  ofensivo) y dificultad (Clásico = valoraciones visibles, De Almanaque =
  ocultas), y arma su once tirando el dado 11 veces: cada tirada saca una
  selección/Mundial al azar y ofrece candidatos reales para la posición
  que toca completar. 3 rerolls en Clásico, 1 en De Almanaque.
- Al terminar todos los onces, se simula un Mundial ficticio por
  jugador: 3 partidos de grupo (avanza con 4+ de 9 puntos) y, si avanza,
  octavos/cuartos/semis/final contra rivales históricos al azar (empates
  de eliminatoria se resuelven por penales). El "7 a 0" — el logro
  perfecto — es ser campeón invicto sin recibir goles en los 7 partidos.
- Simplificación: solo 4 posiciones amplias (portero/defensa/mediocampo/
  delantero), no sub-roles ni fichaje del plantel completo por Mundial.
- **Desafío del día** (inspirado en el modo homónimo de 7a0): al entrar al
  juego se elige "Modo libre" o "Desafío del día". En el desafío diario,
  cada asiento arranca con su propio generador pseudoaleatorio determinista
  (semilla = fecha de hoy), así que las tiradas son idénticas para
  cualquiera que juegue esa jornada en cualquier dispositivo — mismo
  concepto que un Wordle. Como el hub no tiene servidor, no hay tabla de
  posiciones global: se guarda un historial local (racha de días jugados)
  en `localStorage` vía `GameHub.Storage`, bajo la clave `sietezero:daily`.
- **Misiones extra** (`sietezero-missions.js`): logros opcionales que se
  evalúan al terminar cada simulación, además del "7 a 0" —
  Poliglota (4+ países en el once), Máquina del tiempo (30+ años de
  diferencia entre convocatorias), Muralla (0 goles en la fase de grupos),
  Goleada (4+ goles en un partido), Al límite (avanzar con lo justo),
  Héroe de los once metros (ganar una tanda de penales) y Campeón del
  Mundial. Se muestran como insignias en la tarjeta de resultado de cada
  asiento.

**Quiniela de Fútbol**
- Para 1 a 8 jugadores. Cada "jornada" (ronda) sortea 5 partidos entre
  un plantel de 16 equipos ficticios propios (sin nombres ni escudos
  reales). Por turnos, cada jugador arma su pronóstico de marcador
  exacto para los 5 partidos y lo envía — un poco al estilo de
  Escalera y Trío, "en privado" dentro de lo que da jugar todos en la
  misma pantalla: mientras no se revele la jornada no se muestran los
  pronósticos ya enviados de los demás.
- Cuando todos enviaron su pronóstico, se "juegan" los 5 partidos (el
  motor sortea un marcador real al azar, con una ligera ventaja de
  local) y se reparten puntos: 3 pts por marcador exacto, 1 pt por
  acertar solo el resultado (local/empate/visitante), 0 pts si fallas.
  Sin puntaje objetivo para terminar — se puede seguir jugando jornada
  tras jornada, igual que los demás juegos del hub.
- Simplificación: como el resultado real es puro azar, la "dificultad"
  del bot no representa análisis táctico — solo cambia la distribución
  de goles que usa para pronosticar (ver `quiniela-bot.js`).

**Bingo**
- Para 1 a 8 jugadores. Bingo clásico de 75 bolas: cada jugador recibe
  un cartón de 5x5 (columnas B-I-N-G-O, centro libre) y el motor va
  cantando bolas al azar, una por una, marcando automáticamente cada
  cartón donde salga el número.
- Como no hay ninguna decisión que tomar (el marcado es automático),
  "humano" o "bot" da igual en este juego — por eso no tiene un
  archivo `bingo-bot.js`, y la dificultad del bot no afecta nada.
- Premios: la primera línea (fila, columna o diagonal completa) suma
  10 pts y no termina la ronda; el primer cartón lleno ("¡Bingo!") suma
  50 pts y termina la ronda. El puntaje se acumula entre rondas, sin
  límite para seguir jugando.
- En modo espectador (sin jugadores humanos) las bolas se cantan solas
  automáticamente; si hay algún humano, se puede cantar bola por bola
  con un botón o activar el modo automático.

**Tanda de Penales**
- Para 1 a 2 jugadores: Local contra Visitante (con un bot si falta
  alguno de los dos) — es el único juego del hub con asientos fijos de
  2 lados en vez de un contador de jugadores, ya que una tanda siempre
  necesita exactamente dos equipos.
- 5 disparos por lado, alternando Local-Visitante en cada ronda (Local
  patea siempre primero — no hay sorteo de moneda). Si terminan
  empatados, se pasa a muerte súbita: una ronda más de un disparo por
  lado hasta que los totales difieran al cerrar una ronda completa.
- Si un lado ya no puede alcanzar al otro aunque acierte todos sus
  disparos restantes, la tanda se corta ahí mismo (la regla real de
  "definición matemática anticipada").
- Cada disparo elige una de 6 zonas del arco (alto/bajo × izquierda/
  centro/derecha) sin que el arquero vea la zona elegida hasta después
  de atajar. Si el arquero adivina la misma zona, casi siempre ataja
  — pero queda un 22% de probabilidad de que la potencia del disparo
  lo supere igual. Si no adivina, es gol salvo un 8% de probabilidad
  de que el disparo se vaya afuera de todas formas.
- Las tandas ganadas se acumulan en un marcador histórico, sin límite
  para seguir jugando tanda tras tanda.

**Blackjack (21)**
- Para 1 a 5 jugadores, todos contra la banca (el "dealer" no es un
  asiento, es la casa) — como en Ruleta y Tragamonedas, pero con
  varios jugadores compartiendo la misma mesa.
- Zapato de 6 mazos combinados (312 cartas), repartido de nuevo entre
  rondas cuando quedan pocas cartas. Blackjack natural (21 con las 2
  cartas iniciales) paga 3 a 2; ganar con más cartas paga 1 a 1;
  empate ("push") devuelve la apuesta; la banca se planta siempre en
  cualquier 17, duro o blando.
- Simplificaciones: no hay "split" de pares ni seguro contra blackjack
  de la banca; doblar solo está permitido como primera acción y
  siempre reparte exactamente una carta más. Las fichas de cada
  jugador (1000 iniciales) viven solo en la sesión de juego actual, ya
  que los asientos cambian de una partida a otra — hay un botón para
  reponerlas si algún jugador se queda en cero.

## Bots

Cada bot tiene 3 niveles (`facil`, `normal`, `dificil`) definidos por
una heurística de puntaje por jugada (prioriza capturas, llegar a la
meta, casillas seguras, fichas pesadas primero, etc.) — no es una
búsqueda tipo minimax, así que hay bastante margen para hacerlos más
fuertes si quieres seguir puliendo esto.

## Estadísticas

Las victorias/derrotas se guardan en `localStorage` bajo la llave
`noche-de-juegos:stats`, y se muestran como contador en la cabecera
del hub. Se borran si limpias los datos del sitio en el navegador.
