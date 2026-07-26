# Noche de Juegos — Game Hub PWA

App web progresiva (PWA) con una sala de juegos de mesa y casino para jugar
localmente, instalable en el celular o la computadora y con soporte offline.

## Juegos incluidos

Parqués, Dominó, Escalera y Trío (naipes), UNO, Ahorcado, Generala, Trivia,
Ruleta, Tragamonedas, Blackjack, Rummikub, Bingo, Penales, Quiniela,
Siete y Medio (sietezero), y **Camino a la Gloria** (carrera de clubes de
fútbol, estilo simulador de carrera).

## Estructura del proyecto

```
game-hub/
├── index.html          # Punto de entrada de la app
├── manifest.json        # Metadatos de instalación PWA
├── sw.js                 # Service worker (cache offline)
├── css/                  # Un archivo de estilos por juego + base/tokens
├── icons/                # Íconos de instalación
├── js/
│   ├── app.js             # Hub principal (menú, selección de juego)
│   ├── core/               # Utilidades compartidas (dados, storage, eventos)
│   └── games/               # Un subcarpeta por juego (engine + ui + bot)
│       └── carrera/          # "Camino a la Gloria"
└── assets/
    └── crests/              # Escudos reales de clubes (ver más abajo)
```

## Camino a la Gloria — clubes, ligas, países y escudos

Este juego usa **nombres reales de clubes, ligas y países** (336 clubes en
total, repartidos en las principales ligas de ~20 países), con bandera
generada a partir del código ISO de cada país.

Los **escudos** funcionan con un sistema de carga automática y respaldo:

1. El juego busca en `assets/crests/<id-del-club>.png` (después prueba
   `.webp` y `.svg`, en ese orden).
2. Si encuentra el archivo, lo muestra.
3. Si no lo encuentra, muestra automáticamente una insignia generada
   (forma + iniciales + colores) para que el juego nunca se rompa por
   falta de un escudo.

Esto permite ir cargando los escudos reales de a poco, en cualquier orden,
sin tocar código.

### Cómo cargar los escudos reales

Toda la guía y el listado de los 336 clubes están en `assets/crests/`:

- **`assets/crests/README.md`** — instrucciones paso a paso.
- **`assets/crests/LISTADO_ESCUDOS.md`** — listado completo agrupado por
  país y liga, con casillero `[ ]` para ir marcando el avance y el nombre
  exacto de archivo que hay que usar para cada club.
- **`assets/crests/listado_escudos.csv`** — el mismo listado en formato
  CSV (país, liga, club, archivo), útil para abrir en Excel/Sheets y
  llevar el progreso ahí si preferís una planilla.

Resumen rápido:

1. Buscá el escudo del club (Wikipedia/Wikimedia Commons u otra fuente).
2. Descargalo, idealmente PNG con fondo transparente.
3. Renombralo exactamente como indica el listado (ej: `manchester-city-gb.png`).
4. Guardalo en `game-hub/assets/crests/`.

**Uso**: pensado para tu copia local del juego, sin publicar ni distribuir
las imágenes ni el proyecto con ellas incluidas.

## Instalar / correr localmente

Es una PWA estática: alcanza con servir la carpeta `game-hub/` con
cualquier servidor HTTP simple (por ejemplo `python3 -m http.server`) y
abrir `index.html` en el navegador. El service worker (`sw.js`) cachea los
archivos base para que funcione sin conexión una vez cargado por primera
vez; las imágenes de `assets/crests/` no están precacheadas para que
puedas ir agregándolas sin tener que actualizar el service worker cada vez.
