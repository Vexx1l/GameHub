# Multijugador online — cómo activarlo y cómo sumar más juegos

## 1. Crear el proyecto de Firebase (gratis)

1. Andá a https://console.firebase.google.com y creá un proyecto (o usá uno que ya tengas).
2. Ícono de engranaje → **Configuración del proyecto** → pestaña **General** → sección
   **Tus apps**. Si no hay ninguna app web, hacé clic en **"</>"** para agregar una
   (nombre "GameHub"; **no** hace falta activar Firebase Hosting).
3. Copiá el objeto `firebaseConfig` que te muestra Firebase.
4. Pegalo en `js/core/firebase-config.js`, reemplazando el objeto de ejemplo.
5. En el menú lateral: **Compilación → Realtime Database → Crear base de datos**.
   Elegí la ubicación más cercana y arrancá en "modo de prueba".
6. En la pestaña **Reglas** de Realtime Database, pegá esto y publicá:

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['gameId', 'status', 'seats'])"
      }
    }
  }
}
```

   Esto es intencionalmente abierto (no usamos login) porque es un hub casero
   para jugar con amigos, no una app pública. Si en algún momento te preocupa
   que alguien adivine un código de sala (son 4 caracteres, ~1M combinaciones,
   y las salas no tienen datos sensibles), se puede sumar Firebase
   Anonymous Auth más adelante — avisame si querés que lo sumemos.

7. Confirmá que `databaseURL` haya quedado bien copiado en `firebase-config.js`
   (con el formato `https://TU-PROYECTO-default-rtdb.REGION.firebasedatabase.app`
   o `...-default-rtdb.firebaseio.com`).
8. Subí los cambios a tu repo y esperá a que Netlify redepliegue (o arrastrá la
   carpeta a Netlify si lo hacés manual). Con eso ya vas a ver el botón
   **"Jugar online"** en Ta-Te-Ti y Conecta 4.

## 2. Cómo se juega

- Uno de los dos toca **"Jugar online (crear sala)"**, pone su nombre y le
  aparece un código de 4 letras + un link para compartir.
- El otro toca **"Unirme con código"** (o abre directamente el link que le
  pasaron, que ya trae el código cargado), pone su nombre y elige un asiento
  libre.
- Cuando los dos asientos están ocupados, el anfitrión toca **"Empezar
  partida"** y arranca para ambos al mismo tiempo, cada uno desde su
  dispositivo.

## 3. Estado actual

Ya tienen multijugador online funcionando de punta a punta:

- **Ta-Te-Ti**
- **Conecta 4**
- **Damas**
- **UNO** (2 a 8 jugadores — manos ocultas del resto, reparto y robo de mazo sincronizados)
- **Dominó** (2 o 4 jugadores — fichas ocultas del resto)
- **Escalera y Trío / Naipes** (4 a 8 jugadores — cada uno elige su combinación por separado y ve solo su mano)
- **Rummikub** (2 a 4 jugadores — mismo patrón que Naipes/UNO)
- **Parqués** (4 jugadores fijos — sala online requiere los 4 asientos ocupados por
  personas; no hay "jugar de nuevo" dentro de la sala, para otra partida se arma
  una sala nueva desde el hub)
- **Generala** (1 a 8 — su motor usaba `Math.random()` directo, se corrigió para
  que pase por `Dice.roll()` y así la semilla compartida también la cubra)
- **Bingo** (1 a 8 — no tiene turnos: cualquier jugador sentado puede "cantar
  bola"; el modo automático online sólo lo controla el anfitrión, para que no
  se canten bolas de más si varios activan el automático a la vez)
- **Ahorcado** (1 a 6 — se corrigió `Math.random()` → `Dice.shuffle()` al elegir
  la palabra)
- **Basta / Stop** (1 a 8 — el único que cambió de mecánica al pasar a online:
  en vez de "pasar el dispositivo" ahora todos escriben **a la vez**, cada uno
  desde su pantalla; cada campo se manda con un pequeño debounce, no letra por
  letra, para no saturar la sala, y cualquiera puede gritar "¡BASTA!")

Estos últimos tres (UNO, Dominó, Naipes) ya necesitaban barajar un mazo, así
que de paso sumé una pieza nueva de infraestructura: **`Dice.seed(n)`**, un
generador de azar con semilla en `js/core/dice.js`. Cuando arranca una
partida online, el anfitrión genera una semilla al azar UNA sola vez y viaja
dentro de los datos de la sala; todos los dispositivos la usan antes de
crear el motor del juego, así el mazo queda barajado exactamente igual en
todas las pantallas sin tener que mandar las 108 cartas (o lo que sea) por
la red. Esto dejó el camino allanado para Rummikub, Parqués y Generala —
todos barajan/tiran dados a través del mismo módulo `Dice`.

Nota sobre UNO/Dominó/Naipes: ahora cada jugador ve **solo su propia mano**
(el resto se muestra boca abajo), a diferencia del modo local donde se
comparte pantalla y se ven todas las manos — es la mejora obligada al pasar
de "pasarse el dispositivo" a "cada uno desde el suyo".

## 4. Cómo está armado (para sumar el resto de los juegos)

Cada juego ya separa **motor** (`*-engine.js`, sin DOM, sólo lógica) de
**interfaz** (`*-ui.js`, maneja clicks y pinta pantalla) y se comunican con
un `EventBus`. Eso hace que sumar multijugador sea bastante mecánico: en vez
de mandar el tablero completo por la red, cada dispositivo corre su propia
copia del motor y sólo viajan las *jugadas* — todos las aplican en el mismo
orden y llegan al mismo resultado sin coordinación extra. Mirá
`js/core/netplay.js` para el detalle.

**Receta para agregar online a un juego (ej. Damas):**

1. En `damas-ui.js`, en `mount(container, config)`, agregá:
   ```js
   const online = config.online || null;
   const mySeatId = online ? seats.find((s) => s.playerId === online.playerId)?.id : null;
   if (online) {
     online.onAction((method, args) => {
       if (typeof engine[method] === 'function') engine[method](...args);
     });
   }
   ```
2. Buscá **todos** los lugares donde el click del usuario llama a un método
   del engine que cambia el estado (ej. `engine.mover(seatId, desde, hasta)`).
   Reemplazá cada uno por:
   ```js
   if (online) {
     if (seat.id !== mySeatId) return;
     online.submitAction('mover', [seat.id, desde, hasta]);
     return;
   }
   engine.mover(seat.id, desde, hasta);
   ```
3. Si el juego usa bots (`scheduleBotMove` o similar), agregá `if (online) return;`
   al principio — en una sala online no hay bots, sólo personas.
4. **Importante — juegos con dados o barajas:** si en algún punto el engine
   usa `Math.random()` (tirar un dado, repartir cartas), ese resultado tiene
   que decidirse en el dispositivo que hace la jugada y viajar como parte de
   los argumentos de la acción (para que todos apliquen el mismo resultado en
   vez de tirar cada uno su propio dado). Es el único punto no-mecánico de la
   receta; avisame cuándo lleguemos a esos juegos (Parqués, Dominó, UNO,
   Generala, Rummikub, Naipes, Bingo) y lo resolvemos juntos juego por juego.
5. En el `registerGame({...})` del juego, agregá `online: true,`.

Los juegos "de casino" (Ruleta, Tragamonedas, Blackjack, Penales, Quiniela)
hoy son 1 jugador contra la banca — no tienen "asientos" de otro jugador
humano, así que multijugador ahí requeriría rediseñar el juego (ej. una
ruleta con banca compartida y varios apostando). Se puede evaluar aparte si
te interesa.

## 5. Estado: completo

Los 13 juegos del hub que tienen sentido en multijugador ya están online:
Ta-Te-Ti, Conecta 4, Damas, UNO, Dominó, Naipes, Rummikub, Parqués, Generala,
Bingo, Ahorcado, Basta y Trivia. Quedan afuera a propósito los de un jugador
contra la casa (Blackjack, Penales, Quiniela, Ruleta, Siete y Medio,
Tragamonedas) — no tienen un "contra quién" multijugador real.

Si en algún momento agregan un juego nuevo al hub, la receta para sumarle
online es la de siempre: 1) si el engine usa `Math.random()` en vez de
`Dice`, cambiarlo primero; 2) en la UI, sumar `online`/`mySeatId`,
suscribir `online.onAction` para aplicar cualquier método del engine, y
rutear cada clic que muta el engine por `online.submitAction(nombreMétodo,
argumentos)` en vez de llamarlo directo. Basta fue el único caso que se
salió un poco del molde (pasó de "pasar el dispositivo" a que todos
escriban a la vez, con debounce por campo) — vale la pena releer esa
sección del código como ejemplo si aparece otro juego con mecánica rara.

## 4. Probar antes de compartir con tu amigo

Abrí el sitio en dos pestañas (o una pestaña normal + una de incógnito) y
probá crear sala en una y unirte en la otra — así confirmás que Firebase
está bien configurado antes de mandarle el link a alguien.
