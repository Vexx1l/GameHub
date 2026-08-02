/**
 * basta-data.js — categorías y banco de palabras (para que los bots
 * puedan "jugar" Basta / Stop de forma creíble). No pretende ser
 * exhaustivo: si a un bot no le toca una letra con palabras cargadas
 * para una categoría, simplemente la deja en blanco — como le pasaría
 * a cualquier persona con una letra difícil.
 */
(function (global) {
  const CATEGORIES = ['Nombre', 'Animal', 'Fruta o verdura', 'País o ciudad', 'Color', 'Objeto'];

  const WORD_BANK = {
    'Nombre': {
      A: ['Ana', 'Andrés'], B: ['Bruno', 'Beatriz'], C: ['Carla', 'Carlos'], D: ['Diego', 'Daniela'],
      E: ['Elena', 'Emilio'], F: ['Fernando', 'Florencia'], G: ['Gabriel', 'Gloria'], H: ['Hugo', 'Helena'],
      I: ['Ignacio', 'Irene'], J: ['Javier', 'Julia'], L: ['Lucas', 'Laura'], M: ['Mateo', 'María'],
      N: ['Nicolás', 'Natalia'], O: ['Óscar', 'Olivia'], P: ['Pablo', 'Paula'], Q: ['Quintín'],
      R: ['Rodrigo', 'Rosa'], S: ['Santiago', 'Sofía'], T: ['Tomás', 'Teresa'], U: ['Ulises'],
      V: ['Valentina', 'Víctor'], Z: ['Zoe'],
    },
    'Animal': {
      A: ['Araña', 'Águila'], B: ['Búho', 'Burro'], C: ['Caballo', 'Cebra'], D: ['Delfín', 'Danta'],
      E: ['Elefante'], F: ['Foca', 'Flamenco'], G: ['Gato', 'Gorila'], H: ['Hormiga', 'Hipopótamo'],
      I: ['Iguana'], J: ['Jaguar', 'Jirafa'], L: ['León', 'Lobo'], M: ['Mono', 'Mariposa'],
      N: ['Nutria'], O: ['Oveja', 'Oso'], P: ['Perro', 'Pato'], Q: ['Quirquincho'],
      R: ['Rana', 'Ratón'], S: ['Serpiente', 'Sapo'], T: ['Tigre', 'Tortuga'], U: ['Urraca'],
      V: ['Vaca', 'Venado'], Z: ['Zorro'],
    },
    'Fruta o verdura': {
      A: ['Ajo', 'Aguacate'], B: ['Banana', 'Berenjena'], C: ['Cebolla', 'Ciruela'], D: ['Durazno'],
      E: ['Espinaca'], F: ['Frutilla'], G: ['Guayaba'], H: ['Habichuela'],
      L: ['Lechuga', 'Limón'], M: ['Manzana', 'Mango'], N: ['Naranja', 'Nabo'],
      P: ['Papa', 'Pera'], R: ['Rábano'], S: ['Sandía'], T: ['Tomate'], U: ['Uva'],
      Z: ['Zanahoria', 'Zapallo'],
    },
    'País o ciudad': {
      A: ['Argentina', 'Alemania'], B: ['Bolivia', 'Brasil'], C: ['Colombia', 'Chile'], D: ['Dinamarca'],
      E: ['Ecuador', 'España'], F: ['Francia'], G: ['Guatemala'], H: ['Honduras', 'Holanda'],
      I: ['Italia', 'India'], J: ['Japón'], L: ['Líbano'], M: ['México', 'Marruecos'],
      N: ['Nicaragua', 'Noruega'], P: ['Perú', 'Panamá'], Q: ['Qatar'], R: ['Rusia'],
      S: ['Suecia', 'Suiza'], T: ['Turquía'], U: ['Uruguay'], V: ['Venezuela'], Z: ['Zambia'],
    },
    'Color': {
      A: ['Azul', 'Amarillo'], B: ['Beige', 'Blanco'], C: ['Celeste', 'Café'], D: ['Dorado'],
      F: ['Fucsia'], G: ['Gris', 'Granate'], I: ['Índigo'], L: ['Lila'],
      M: ['Magenta', 'Marrón'], N: ['Naranja', 'Negro'], O: ['Ocre'], P: ['Púrpura', 'Plateado'],
      R: ['Rojo', 'Rosado'], T: ['Turquesa'], V: ['Verde', 'Violeta'],
    },
    'Objeto': {
      A: ['Auto', 'Anillo'], B: ['Botella', 'Bolso'], C: ['Celular', 'Cuchara'], D: ['Destornillador'],
      E: ['Escoba', 'Espejo'], F: ['Foco'], G: ['Guitarra'], H: ['Hacha'], I: ['Impresora'],
      J: ['Jarra'], L: ['Lápiz', 'Llave'], M: ['Mesa', 'Martillo'], N: ['Navaja'], O: ['Olla'],
      P: ['Peine', 'Plato'], R: ['Radio', 'Reloj'], S: ['Silla', 'Sombrero'], T: ['Taza', 'Tijera'],
      U: ['Uniforme'], V: ['Vaso', 'Ventilador'], Z: ['Zapato'],
    },
  };

  // Letras con suficiente cobertura como para sortearlas (evitamos K, W, X, Y —
  // demasiado difíciles incluso para un humano en la mayoría de las categorías).
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Z'];

  global.GameHub = global.GameHub || {};
  global.GameHub.BastaData = { CATEGORIES, WORD_BANK, LETTERS };
})(window);
