/**
 * trivia-engine.js — lógica pura de un juego de preguntas y respuestas
 * (estilo "Preguntados") para 1 a 8 jugadores.
 *
 * Cada ronda es UNA pregunta de una categoría al azar. Por turnos, cada
 * jugador tiene un único intento de responderla (4 opciones):
 *   - Si acierta, se lleva los puntos y termina la ronda (gana el que
 *     completa correctamente, no necesariamente el primero en jugar).
 *   - Si falla, esa opción queda marcada como descartada para el resto
 *     (ayuda a los siguientes) y el turno pasa al próximo jugador que
 *     no haya intentado todavía.
 *   - Si TODOS fallan, la ronda termina sin ganador y se revela la
 *     respuesta correcta.
 *
 * Puntaje: 15 puntos si aciertas en tu primer intento de la ronda
 * (nadie más lo intentó antes), 10 puntos si aciertas después de que
 * otros ya fallaron. Sin puntaje objetivo para terminar la partida —
 * se puede seguir jugando preguntas indefinidamente, igual que los
 * demás juegos del hub.
 */
(function (global) {
  const QUESTION_BANK = {
    Historia: [
      { q: '¿En qué año llegó Cristóbal Colón a América?', options: ['1492', '1500', '1453', '1521'], correct: 0 },
      { q: '¿Quién fue el primer presidente de los Estados Unidos?', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'], correct: 0 },
      { q: '¿En qué año terminó la Segunda Guerra Mundial?', options: ['1945', '1939', '1918', '1950'], correct: 0 },
      { q: '¿Qué imperio construyó el Coliseo de Roma?', options: ['Imperio Romano', 'Imperio Griego', 'Imperio Persa', 'Imperio Bizantino'], correct: 0 },
      { q: '¿Quién lideró la independencia de la India mediante la resistencia pacífica?', options: ['Mahatma Gandhi', 'Nelson Mandela', 'Winston Churchill', 'Jawaharlal Nehru'], correct: 0 },
      { q: '¿En qué año cayó el Muro de Berlín?', options: ['1989', '1991', '1975', '1985'], correct: 0 },
      { q: '¿Qué civilización construyó Machu Picchu?', options: ['Los incas', 'Los mayas', 'Los aztecas', 'Los mapuches'], correct: 0 },
      { q: '¿Quién es conocido como "El Libertador" de gran parte de Sudamérica?', options: ['Simón Bolívar', 'José de San Martín', 'Francisco de Miranda', 'Antonio José de Sucre'], correct: 0 },
      { q: '¿En qué siglo ocurrió la Revolución Francesa?', options: ['Siglo XVIII', 'Siglo XVII', 'Siglo XIX', 'Siglo XVI'], correct: 0 },
      { q: '¿Qué faraón egipcio es famoso por su máscara funeraria de oro descubierta en 1922?', options: ['Tutankamón', 'Ramsés II', 'Akenatón', 'Keops'], correct: 0 },
      { q: '¿Qué civilización desarrolló la escritura cuneiforme?', options: ['Los sumerios', 'Los egipcios', 'Los fenicios', 'Los babilonios'], correct: 0 },
      { q: '¿Qué país fue conocido como el "Imperio del Sol Naciente"?', options: ['Japón', 'China', 'Corea', 'Tailandia'], correct: 0 },
      { q: '¿Quién escribió el Manifiesto Comunista junto a Friedrich Engels?', options: ['Karl Marx', 'Vladimir Lenin', 'Adam Smith', 'Joseph Stalin'], correct: 0 },
      { q: '¿En qué año se firmó la Declaración de Independencia de los Estados Unidos?', options: ['1776', '1789', '1801', '1763'], correct: 0 },
      { q: '¿Qué reina egipcia fue célebre por su relación con Julio César y Marco Antonio?', options: ['Cleopatra', 'Nefertiti', 'Hatshepsut', 'Isis'], correct: 0 },
    ],
    Ciencia: [
      { q: '¿Cuál es el planeta más cercano al Sol?', options: ['Mercurio', 'Venus', 'Tierra', 'Marte'], correct: 0 },
      { q: '¿Qué gas es esencial para la respiración humana?', options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'], correct: 0 },
      { q: '¿Cuál es la unidad básica de la vida?', options: ['La célula', 'El átomo', 'El tejido', 'El órgano'], correct: 0 },
      { q: '¿Quién formuló la teoría de la relatividad?', options: ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Galileo Galilei'], correct: 0 },
      { q: '¿Cuál es el elemento químico más abundante en el universo?', options: ['Hidrógeno', 'Helio', 'Oxígeno', 'Carbono'], correct: 0 },
      { q: '¿Qué órgano del cuerpo humano bombea la sangre?', options: ['El corazón', 'El hígado', 'El pulmón', 'El riñón'], correct: 0 },
      { q: '¿Cómo se llama el proceso por el cual las plantas producen su alimento usando luz solar?', options: ['Fotosíntesis', 'Respiración', 'Transpiración', 'Germinación'], correct: 0 },
      { q: '¿Cuál es la velocidad aproximada de la luz en el vacío?', options: ['300.000 km/s', '150.000 km/s', '1.000.000 km/s', '30.000 km/s'], correct: 0 },
      { q: '¿Qué científico propuso la teoría de la evolución por selección natural?', options: ['Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Alfred Wallace'], correct: 0 },
      { q: '¿Cuántos huesos tiene aproximadamente el cuerpo humano adulto?', options: ['206', '150', '300', '180'], correct: 0 },
      { q: '¿Qué planeta es conocido como el "planeta rojo"?', options: ['Marte', 'Júpiter', 'Saturno', 'Venus'], correct: 0 },
      { q: '¿Qué metal es líquido a temperatura ambiente?', options: ['Mercurio', 'Plomo', 'Hierro', 'Aluminio'], correct: 0 },
      { q: '¿Qué parte de la célula contiene el material genético?', options: ['El núcleo', 'La mitocondria', 'El citoplasma', 'La membrana'], correct: 0 },
      { q: '¿Cuál es la fórmula química del agua?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0 },
      { q: '¿Qué tipo de energía almacena principalmente una batería?', options: ['Energía química', 'Energía cinética', 'Energía nuclear', 'Energía térmica'], correct: 0 },
    ],
    Geografía: [
      { q: '¿Cuál es el río más largo del mundo según la mayoría de las fuentes?', options: ['Nilo', 'Amazonas', 'Misisipi', 'Yangtsé'], correct: 0 },
      { q: '¿Cuál es el país más grande del mundo por superficie?', options: ['Rusia', 'Canadá', 'China', 'Estados Unidos'], correct: 0 },
      { q: '¿Cuál es la montaña más alta del mundo?', options: ['Monte Everest', 'K2', 'Aconcagua', 'Kilimanjaro'], correct: 0 },
      { q: '¿Cuál es el océano más grande del mundo?', options: ['El océano Pacífico', 'El océano Atlántico', 'El océano Índico', 'El océano Ártico'], correct: 0 },
      { q: '¿Cuál es la capital de Australia?', options: ['Canberra', 'Sídney', 'Melbourne', 'Perth'], correct: 0 },
      { q: '¿En qué continente se encuentra Egipto?', options: ['África', 'Asia', 'Europa', 'Oceanía'], correct: 0 },
      { q: '¿Cuál es el país más poblado del mundo actualmente?', options: ['India', 'China', 'Estados Unidos', 'Indonesia'], correct: 0 },
      { q: '¿Cuál es la capital de Colombia?', options: ['Bogotá', 'Medellín', 'Cali', 'Cartagena'], correct: 0 },
      { q: '¿Qué país tiene forma de bota en el mapa?', options: ['Italia', 'España', 'Grecia', 'Portugal'], correct: 0 },
      { q: '¿Cuál es el lago más grande del mundo por superficie?', options: ['Mar Caspio', 'Lago Superior', 'Lago Victoria', 'Lago Baikal'], correct: 0 },
      { q: '¿Cuál es el área metropolitana más poblada del mundo?', options: ['Tokio', 'Shanghái', 'Delhi', 'São Paulo'], correct: 0 },
      { q: '¿En qué país se encuentra la Torre Eiffel?', options: ['Francia', 'Italia', 'España', 'Bélgica'], correct: 0 },
      { q: '¿Cuál es el continente más pequeño del mundo?', options: ['Oceanía', 'Europa', 'Antártida', 'América del Sur'], correct: 0 },
      { q: '¿Qué país centroamericano conecta Norteamérica con Sudamérica y tiene un famoso canal?', options: ['Panamá', 'Costa Rica', 'Nicaragua', 'Honduras'], correct: 0 },
      { q: '¿Cuál es el desierto más grande del mundo (incluyendo desiertos fríos)?', options: ['La Antártida', 'El Sahara', 'El Gobi', 'El Ártico'], correct: 0 },
    ],
    Deportes: [
      { q: '¿Cada cuántos años se celebran los Juegos Olímpicos de verano?', options: ['4 años', '2 años', '5 años', '3 años'], correct: 0 },
      { q: '¿Cuántos jugadores tiene un equipo de fútbol en la cancha (sin contar suplentes)?', options: ['11', '10', '9', '12'], correct: 0 },
      { q: '¿En qué país se originó el boxeo moderno con las reglas Queensberry?', options: ['Inglaterra', 'Estados Unidos', 'Francia', 'Irlanda'], correct: 0 },
      { q: '¿Cuántos puntos vale un touchdown en el fútbol americano (sin conversión)?', options: ['6', '7', '3', '8'], correct: 0 },
      { q: '¿Qué país ha ganado más Copas Mundiales de fútbol masculino?', options: ['Brasil', 'Alemania', 'Argentina', 'Italia'], correct: 0 },
      { q: '¿En qué deporte se usa un volante llamado "birdie"?', options: ['Bádminton', 'Tenis', 'Squash', 'Ping pong'], correct: 0 },
      { q: '¿Cuántos sets como máximo se juegan en un partido de tenis de Grand Slam masculino?', options: ['5', '3', '7', '4'], correct: 0 },
      { q: '¿Qué deporte practica Michael Phelps, el atleta más laureado en la historia olímpica?', options: ['Natación', 'Atletismo', 'Ciclismo', 'Gimnasia'], correct: 0 },
      { q: '¿Cuántos jugadores conforman un equipo de baloncesto en la cancha?', options: ['5', '6', '7', '4'], correct: 0 },
      { q: '¿En qué ciudad se disputó el famoso "Maracanazo" de 1950?', options: ['Río de Janeiro', 'São Paulo', 'Montevideo', 'Buenos Aires'], correct: 0 },
      { q: '¿Qué golfista es apodado "El Tigre"?', options: ['Tiger Woods', 'Phil Mickelson', 'Rory McIlroy', 'Jack Nicklaus'], correct: 0 },
      { q: '¿Cuál es la distancia oficial de un maratón?', options: ['42,195 km', '21,097 km', '50 km', '30 km'], correct: 0 },
      { q: '¿En qué deporte se compite por la Copa América?', options: ['Fútbol', 'Rugby', 'Baloncesto', 'Voleibol'], correct: 0 },
      { q: '¿Qué país organizó los Juegos Olímpicos de 2016?', options: ['Brasil', 'China', 'Reino Unido', 'Japón'], correct: 0 },
      { q: '¿Cuántos hoyos tiene un campo de golf estándar?', options: ['18', '9', '20', '16'], correct: 0 },
    ],
    Entretenimiento: [
      { q: '¿Qué banda británica formaron John Lennon y Paul McCartney?', options: ['Los Beatles', 'The Rolling Stones', 'Pink Floyd', 'Queen'], correct: 0 },
      { q: '¿Quién es conocido como el "Rey del Pop"?', options: ['Michael Jackson', 'Elvis Presley', 'Prince', 'Freddie Mercury'], correct: 0 },
      { q: '¿En qué ciudad se entregan los premios Óscar cada año?', options: ['Los Ángeles', 'Nueva York', 'Las Vegas', 'Chicago'], correct: 0 },
      { q: '¿Qué instrumento tocaba principalmente Jimi Hendrix?', options: ['La guitarra', 'El piano', 'La batería', 'El saxofón'], correct: 0 },
      { q: '¿Cómo se llama la saga sobre un joven mago que estudia en Hogwarts?', options: ['Harry Potter', 'Percy Jackson', 'Las Crónicas de Narnia', 'Eragon'], correct: 0 },
      { q: '¿Qué cantante colombiana es conocida por canciones como "Waka Waka"?', options: ['Shakira', 'Karol G', 'Fanny Lu', 'Carlos Vives'], correct: 0 },
      { q: '¿Qué famoso ratón es la mascota de Disney?', options: ['Mickey Mouse', 'Bugs Bunny', 'Tom', 'Jerry'], correct: 0 },
      { q: '¿Cómo se llama el protagonista de la película animada "El Rey León"?', options: ['Simba', 'Mufasa', 'Scar', 'Timón'], correct: 0 },
      { q: '¿Qué actor interpretó a Iron Man en el universo cinematográfico de Marvel?', options: ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth', 'Mark Ruffalo'], correct: 0 },
      { q: '¿Qué serie sigue a un profesor de química que se dedica a fabricar drogas?', options: ['Breaking Bad', 'The Wire', 'Narcos', 'Ozark'], correct: 0 },
      { q: '¿Cómo se llama de nacimiento la cantante conocida como "Beyoncé"?', options: ['Beyoncé Giselle Knowles', 'Rihanna Fenty', 'Alicia Keys', 'Ciara Harris'], correct: 0 },
      { q: '¿Qué película animada de Pixar trata sobre juguetes que cobran vida?', options: ['Toy Story', 'Cars', 'Up', 'Ratatouille'], correct: 0 },
      { q: '¿Quién dirigió la trilogía cinematográfica de "El Señor de los Anillos"?', options: ['Peter Jackson', 'Steven Spielberg', 'James Cameron', 'George Lucas'], correct: 0 },
      { q: '¿Qué videojuego popular trata sobre construir y sobrevivir en un mundo de bloques?', options: ['Minecraft', 'Fortnite', 'Roblox', 'Terraria'], correct: 0 },
      { q: '¿Cuál es el nombre real del reguetonero puertorriqueño "Bad Bunny"?', options: ['Benito Antonio Martínez Ocasio', 'Daddy Yankee', 'J Balvin', 'Ozuna'], correct: 0 },
    ],
    'Arte y Literatura': [
      { q: '¿Quién pintó la Mona Lisa?', options: ['Leonardo da Vinci', 'Miguel Ángel', 'Rafael', 'Botticelli'], correct: 0 },
      { q: '¿Quién escribió "Cien años de soledad"?', options: ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar', 'Jorge Luis Borges'], correct: 0 },
      { q: '¿Quién pintó "La noche estrellada"?', options: ['Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Salvador Dalí'], correct: 0 },
      { q: '¿Quién es el autor de "Don Quijote de la Mancha"?', options: ['Miguel de Cervantes', 'Lope de Vega', 'Francisco de Quevedo', 'Calderón de la Barca'], correct: 0 },
      { q: '¿Qué pintor español es famoso por el cuadro "Guernica"?', options: ['Pablo Picasso', 'Salvador Dalí', 'Joan Miró', 'Diego Velázquez'], correct: 0 },
      { q: '¿Quién esculpió el "David", una de las obras más famosas del Renacimiento?', options: ['Miguel Ángel', 'Donatello', 'Bernini', 'Leonardo da Vinci'], correct: 0 },
      { q: '¿Qué escritor chileno ganó el Premio Nobel de Literatura en 1971?', options: ['Pablo Neruda', 'Gabriela Mistral', 'Isabel Allende', 'Nicanor Parra'], correct: 0 },
      { q: '¿A qué movimiento artístico pertenece Salvador Dalí?', options: ['El surrealismo', 'El cubismo', 'El impresionismo', 'El expresionismo'], correct: 0 },
      { q: '¿Quién escribió la obra teatral "Romeo y Julieta"?', options: ['William Shakespeare', 'Christopher Marlowe', 'Charles Dickens', 'Oscar Wilde'], correct: 0 },
      { q: '¿En qué museo de París se exhibe la Mona Lisa?', options: ['El Museo del Louvre', 'El Museo de Orsay', 'El Centro Pompidou', 'El Petit Palais'], correct: 0 },
      { q: '¿Qué autor argentino escribió "Ficciones" y es célebre por sus cuentos filosóficos?', options: ['Jorge Luis Borges', 'Julio Cortázar', 'Adolfo Bioy Casares', 'Ernesto Sabato'], correct: 0 },
      { q: '¿Qué técnica pictórica usa pequeños puntos de color para formar una imagen?', options: ['El puntillismo', 'El fresco', 'La acuarela', 'El collage'], correct: 0 },
      { q: '¿Quién escribió "1984" y "Rebelión en la granja"?', options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H.G. Wells'], correct: 0 },
      { q: '¿Qué escritora británica creó al detective Hercule Poirot?', options: ['Agatha Christie', 'Arthur Conan Doyle', 'Virginia Woolf', 'Jane Austen'], correct: 0 },
      { q: '¿Cómo se llama el estilo arquitectónico de la Sagrada Familia de Barcelona, obra de Gaudí?', options: ['El modernismo catalán', 'El gótico', 'El barroco', 'El neoclásico'], correct: 0 },
    ],
  };

  class TriviaEngine {
    constructor(seats) {
      this.bus = new global.GameHub.EventBus();
      this.seats = seats; // [{id,label,hex,type,difficulty}]
      this.scores = {};
      seats.forEach((s) => { this.scores[s.id] = 0; });
      this.round = 0;
      this.usedQuestions = new Set();
      this.startRound();
    }

    get currentSeat() { return this.seats[this.turnPointer]; }
    seatById(id) { return this.seats.find((s) => s.id === id); }

    _pickQuestion() {
      const categories = Object.keys(QUESTION_BANK);
      let pool = [];
      categories.forEach((cat) => QUESTION_BANK[cat].forEach((q) => pool.push({ category: cat, question: q })));
      let available = pool.filter((p) => !this.usedQuestions.has(p.category + '|' + p.question.q));
      if (!available.length) { this.usedQuestions.clear(); available = pool; }
      const choice = global.GameHub.Dice.shuffle(available)[0];
      this.usedQuestions.add(choice.category + '|' + choice.question.q);
      return choice;
    }

    startRound() {
      this.round += 1;
      const { category, question } = this._pickQuestion();
      this.category = category;
      this.question = question;
      this.attempted = new Set();
      this.wrongTried = new Set();
      this.roundOver = false;
      this.turnPointer = (this.round - 1) % this.seats.length;
      this.bus.emit('round-started', { round: this.round, category });
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    answer(seatId, optionIdx) {
      if (this.roundOver || seatId !== this.currentSeat.id || this.attempted.has(seatId)) return { ok: false };
      this.attempted.add(seatId);
      const correct = optionIdx === this.question.correct;
      if (correct) {
        const bonus = this.attempted.size === 1 ? 15 : 10;
        this.scores[seatId] += bonus;
        this.bus.emit('answer-correct', { seatId, optionIdx, bonus });
        this._finishRound(seatId);
        return { ok: true, correct: true };
      }
      this.wrongTried.add(optionIdx);
      this.bus.emit('answer-wrong', { seatId, optionIdx });
      if (this.attempted.size >= this.seats.length) {
        this._finishRound(null);
        return { ok: true, correct: false, over: true };
      }
      this._advanceToNextUnattempted();
      return { ok: true, correct: false };
    }

    _advanceToNextUnattempted() {
      const n = this.seats.length;
      let tries = 0;
      do {
        this.turnPointer = (this.turnPointer + 1) % n;
        tries += 1;
      } while (this.attempted.has(this.currentSeat.id) && tries <= n);
      this.bus.emit('turn-changed', { seatId: this.currentSeat.id });
    }

    _finishRound(winnerId) {
      this.roundOver = true;
      this.bus.emit('round-ended', {
        winnerId, correctIndex: this.question.correct, scores: { ...this.scores },
      });
    }
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.TriviaEngine = TriviaEngine;
  global.GameHub.TriviaHelpers = { QUESTION_BANK };
})(window);
