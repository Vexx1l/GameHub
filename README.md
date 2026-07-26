# Noche de Juegos — Game Hub PWA

App web progresiva (PWA) con una sala de juegos de mesa y casino para jugar
localmente, instalable en el celular o la computadora y con soporte offline.

## Juegos incluidos

Parqués, Dominó, Escalera y Trío (naipes), UNO, Ahorcado, Generala, Trivia,
Ruleta, Tragamonedas, Blackjack, Rummikub, Bingo, Penales, Quiniela,
y Siete y Medio (sietezero).

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
```

## Instalar / correr localmente

Es una PWA estática: alcanza con servir la carpeta `game-hub/` con
cualquier servidor HTTP simple (por ejemplo `python3 -m http.server`) y
abrir `index.html` en el navegador. El service worker (`sw.js`) cachea los
archivos base para que funcione sin conexión una vez cargado por primera
vez.
