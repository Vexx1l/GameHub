# Cómo cargar los escudos reales

1. Buscá el escudo del club (por ejemplo en Wikipedia / Wikimedia Commons,
   que suele tener versiones en baja resolución, o en el sitio oficial del club).
2. Descargalo, idealmente en PNG con fondo transparente.
3. Renombralo EXACTAMENTE como dice la columna "Archivo a guardar" en
   `LISTADO_ESCUDOS.md` (o `listado_escudos.csv`). Ejemplo:
   `manchester-city-gb.png`
4. Guardalo en esta misma carpeta: `game-hub/assets/crests/`

Eso es todo. No hace falta tocar ningún código: el juego busca automáticamente
`assets/crests/<id>.png` (y si no lo encuentra, prueba `.webp` y `.svg`) para
cada club. Si un club todavía no tiene archivo, el juego sigue mostrando el
escudo generado (forma + iniciales + colores) sin romperse.

Podés ir cargando los escudos de a poco, en cualquier orden — no hace falta
completar todos para que funcione.

Uso personal: esto es para tu copia local del juego, sin publicar ni
distribuir las imágenes.
