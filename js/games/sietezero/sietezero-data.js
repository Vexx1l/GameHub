/**
 * Datos de "Selección de Ensueño" — plantillas reales de 72 selecciones de
 * Copas del Mundo (1958-2022), con jugadores reales, su posición y una
 * valoración estimada por mí (no oficial) para poder simular partidos.
 *
 * Posiciones: POR (portero), DEF (defensa), MED (mediocampo), DEL (delantero).
 * Estas son clasificaciones amplias (no distinguen lateral/central ni
 * volante/enganche) para simplificar el armado de la formación.
 *
 * Lote 1 (20 selecciones, ~237 jugadores): mayoría campeonas del mundo
 * (planteles mejor documentados), dos subcampeonas icónicas (Países Bajos
 * 1974, Alemania) y dos planteles de Colombia por relevancia personal.
 *
 * Lote 2 (+25 selecciones, +275 jugadores): amplía a subcampeonas,
 * terceros y cuartos puestos históricamente relevantes entre 1950-2022.
 *
 * Lote 3 (+27 selecciones, +297 jugadores): suma más países y épocas
 * (1958-2010) que no estaban representados — Francia y Suecia 1958, Gales
 * 1958, Chile 1962, Checoslovaquia 1962, URSS 1966, Portugal 1966, Perú
 * 1970, Polonia 1974/1982, Brasil 1982 ("Jogo Bonito"), México 1986,
 * Camerún y Yugoslavia 1990, Argentina 1990, Irlanda 1990, Dinamarca 1986,
 * Nigeria y Rumania 1994, Suecia y Bulgaria 1994, Senegal/EE. UU./Japón
 * 2002, Portugal y Australia 2006, Ghana 2010.
 *
 * Nota: los planteles de selecciones desaparecidas (Checoslovaquia, URSS,
 * Yugoslavia) usan una bandera aproximada (no existe emoji oficial para
 * ellas). Nombres, posiciones y dorsales se basan en las alineaciones
 * reales más citadas de cada torneo; en planteles menos documentados
 * (p. ej. Chile 1962, Polonia 1982, URSS 1966) algunos suplentes son mi
 * mejor estimación y podrían tener imprecisiones — igual que las
 * valoraciones, revísalas y ajústalas a tu gusto.
 *
 * Lote 4 (+15 selecciones, +165 jugadores): España 1982/1994, México 1998,
 * Bélgica 1986, Costa Rica 2014, Egipto 2018, Arabia Saudita 2022, Rusia
 * 2018, Sudáfrica 2010, Catar 2022, Estados Unidos 1994, Dinamarca 1998,
 * Paraguay 2010, Costa de Marfil 2006 y Chile 2010 — suma anfitriones,
 * sorpresas históricas y selecciones africanas/asiáticas que faltaban.
 *
 * Lote 5 (+15 selecciones, +165 jugadores): Italia 1994, Argentina 1994,
 * Brasil 1986, Inglaterra 2002, Chile 2014, Colombia 2018, Uruguay 2018,
 * Bélgica 2014, Marruecos 2018, Senegal 2018, Ecuador 2006, Japón 2010,
 * Corea del Sur 2010, Escocia 1974 y Suiza 2006 — refuerza generaciones
 * doradas y participaciones históricas que faltaban.
 *
 * Lote 6 (+15 selecciones, +165 jugadores): México 1970, Austria 1954,
 * Irán 1998, Ucrania 2006, Argelia 1982/2014, Canadá 2022, Serbia 2010,
 * Eslovenia 2010, Ghana 2006, Costa de Marfil 2010/2014, Túnez 2018,
 * Camerún 1994 e Irlanda del Norte 1982 — suma sorpresas históricas
 * ("Milagro de Gijón", debut de Canadá tras 36 años) y más selecciones
 * africanas/asiáticas.
 *
 * Falta por incorporar: Mundial 2026 (aún en curso al momento de esta
 * actualización) y más selecciones que se pueden sumar después (Suiza
 * otros años, Marruecos 1986/1994, Nigeria 1998/2018, Rumania otros años,
 * Bolivia, Honduras, Corea del Norte, Zaire, Haití, Kuwait, Emiratos
 * Árabes, Australia 2010/2018, España 1966/1978/1986/1998, etc.).
 *
 * Nota: algunas alineaciones de este lote (México 1970, Ucrania 2006,
 * Irán 1998, Camerún 1994) tienen menos documentación disponible que las
 * de mundiales recientes; los suplentes y algunos dorsales son mi mejor
 * estimación y podrían tener imprecisiones, igual que ya ocurría con
 * planteles similares del Lote 3.
 *
 * Lote 7 (+10 selecciones, +110 jugadores): Zaire y Haití 1974 (los dos
 * debutantes africano y caribeño de aquel Mundial), Kuwait 1982, Honduras
 * 1982, Emiratos Árabes Unidos 1990, Rumania 1990, Bolivia 1994, Marruecos
 * 1994, Corea del Norte 1966 (el histórico cuartofinalista que eliminó a
 * Italia) y Nigeria 1998 — selecciones históricas o debutantes que no
 * estaban representadas todavía. Onces titulares (no plantilla completa)
 * armados a partir de las alineaciones más citadas de cada torneo; en
 * planteles con menos documentación (Zaire, Haití, Kuwait, Emiratos) los
 * suplentes y valoraciones son mi mejor estimación.
 *
 * Lote 8 (+10 selecciones, +110 jugadores): primer bloque del Mundial 2026
 * (Estados Unidos-México-Canadá), torneo que está en curso en este momento
 * (cuartos de final se juegan alrededor del 9-11 de julio de 2026). Incluye
 * Argentina, Brasil, España, Portugal, México, Estados Unidos, Canadá,
 * Bélgica, Marruecos y Francia, con los onces titulares reales usados en
 * partidos ya disputados del torneo (fase de grupos, dieciseisavos, octavos
 * o cuartos, según el caso), tomados de coberturas de prensa deportiva de
 * junio-julio de 2026. Los dorsales oficiales confirmados se respetaron
 * cuando se encontraron (p. ej. Messi 10, Lisandro Martínez 6, Mbappé 10,
 * Cristiano Ronaldo 7); el resto de dorsales y todas las valoraciones son mi
 * mejor estimación, igual que en lotes anteriores. El campo "result" refleja
 * la fase más avanzada confirmada (el torneo aún no ha terminado, así que
 * para varias selecciones no es su resultado final).
 *
 * Lote 9 (+6 selecciones, +66 jugadores): segundo bloque del Mundial 2026.
 * Suma Alemania (eliminada en dieciseisavos por Paraguay en penales),
 * Inglaterra (venció a México en octavos con Kane/Bellingham/Saka),
 * Colombia y Suiza (protagonistas de un cruce de octavos muy parejo en
 * Vancouver, con James Rodríguez de capitán en la Tricolor) y Noruega
 * (la gran sorpresa: eliminó a Brasil en octavos con Haaland en punta).
 * También se incluye a Egipto, que hizo historia llegando a octavos y
 * estuvo a nada de eliminar a la vigente campeona Argentina (se puso 2-0
 * arriba antes de que la Albiceleste remontara 3-2 en Atlanta). De paso,
 * en este lote se corrigieron dos datos del Lote 8 con información más
 * precisa: la alineación de México (ahora refleja el once real usado en
 * octavos ante Inglaterra: Rangel, Sánchez, Montes, Vásquez, Gallardo...)
 * y el resultado de Argentina, que en realidad avanzó a cuartos de final
 * (no quedó eliminada en octavos como se había anotado provisionalmente).
 * Quedan pendientes 32 selecciones más del Mundial 2026 para próximos
 * lotes (Países Bajos, Croacia, Uruguay, Japón, Ghana, Senegal, Túnez,
 * Cabo Verde, Sudáfrica, Costa de Marfil, Argelia, RD del Congo, Arabia
 * Saudita, Catar, Corea del Sur, Irán, Irak, Jordania, Uzbekistán,
 * Australia, Suecia, Escocia, Austria, Bosnia y Herzegovina, República
 * Checa, Turquía, Curazao, Haití, Panamá, Paraguay, Ecuador y Nueva
 * Zelanda).
 */
(function (global) {
  const FORMATIONS = {
    '4-3-3': { DEF: 4, MED: 3, DEL: 3 },
    '4-4-2': { DEF: 4, MED: 4, DEL: 2 },
    '3-5-2': { DEF: 3, MED: 5, DEL: 2 },
    '5-3-2': { DEF: 5, MED: 3, DEL: 2 },
    '4-2-4': { DEF: 4, MED: 2, DEL: 4 },
    '3-4-3': { DEF: 3, MED: 4, DEL: 3 },
  };

  const POS_LABEL = { POR: 'Portero', DEF: 'Defensa', MED: 'Mediocampo', DEL: 'Delantero' };

  let uid = 0;
  function P(name, pos, num, rating) {
    uid += 1;
    return { id: 'pl' + uid, name, pos, num, rating };
  }

  const TEAMS = [
    { id: 'uru1950', country: 'Uruguay', year: 1950, flag: '🇺🇾', result: 'Campeón', players: [
      P('Roque Máspoli', 'POR', 1, 82), P('Matías González', 'DEF', 2, 76), P('Schubert Gambetta', 'DEF', 3, 77),
      P('Eusebio Tejera', 'DEF', 4, 75), P('Obdulio Varela', 'MED', 5, 85), P('Rodríguez Andrade', 'MED', 6, 78),
      P('Víctor Rodríguez', 'MED', 7, 74), P('Julio Pérez', 'DEL', 8, 76), P('Óscar Míguez', 'DEL', 9, 80),
      P('Juan Alberto Schiaffino', 'DEL', 10, 88), P('Alcides Ghiggia', 'DEL', 11, 86),
    ]},
    { id: 'bra1958', country: 'Brasil', year: 1958, flag: '🇧🇷', result: 'Campeón', players: [
      P('Gilmar', 'POR', 1, 85), P('Nílton Santos', 'DEF', 2, 86), P('Djalma Santos', 'DEF', 3, 86),
      P('Bellini', 'DEF', 4, 80), P('Orlando', 'DEF', 5, 77), P('Zito', 'MED', 6, 80), P('Didi', 'MED', 8, 89),
      P('Garrincha', 'DEL', 7, 93), P('Pelé', 'DEL', 10, 96), P('Vavá', 'DEL', 9, 85), P('Zagallo', 'DEL', 11, 82),
    ]},
    { id: 'bra1970', country: 'Brasil', year: 1970, flag: '🇧🇷', result: 'Campeón', players: [
      P('Félix', 'POR', 1, 80), P('Carlos Alberto Torres', 'DEF', 2, 90), P('Brito', 'DEF', 3, 78),
      P('Piazza', 'DEF', 4, 77), P('Everaldo', 'DEF', 6, 79), P('Clodoaldo', 'MED', 5, 83), P('Gérson', 'MED', 8, 91),
      P('Paulo César Caju', 'MED', 12, 81), P('Jairzinho', 'DEL', 7, 92), P('Pelé', 'DEL', 10, 99), P('Tostão', 'DEL', 9, 88), P('Rivelino', 'DEL', 11, 90),
    ]},
    { id: 'eng1966', country: 'Inglaterra', year: 1966, flag: '🏴', result: 'Campeón', players: [
      P('Gordon Banks', 'POR', 1, 90), P('George Cohen', 'DEF', 2, 78), P('Jack Charlton', 'DEF', 5, 82),
      P('Bobby Moore', 'DEF', 6, 91), P('Ray Wilson', 'DEF', 3, 79), P('Nobby Stiles', 'MED', 4, 78),
      P('Alan Ball', 'MED', 7, 83), P('Bobby Charlton', 'MED', 9, 92), P('Roger Hunt', 'DEL', 21, 81),
      P('Geoff Hurst', 'DEL', 10, 87), P('Martin Peters', 'DEL', 16, 80), P('Jimmy Greaves', 'DEL', 20, 85),
    ]},
    { id: 'rfa1974', country: 'Alemania Occidental', year: 1974, flag: '🇩🇪', result: 'Campeón', players: [
      P('Sepp Maier', 'POR', 1, 89), P('Berti Vogts', 'DEF', 2, 83), P('Franz Beckenbauer', 'DEF', 5, 95),
      P('Hans-Georg Schwarzenbeck', 'DEF', 4, 78), P('Paul Breitner', 'DEF', 3, 85), P('Rainer Bonhof', 'MED', 16, 79),
      P('Wolfgang Overath', 'MED', 8, 84), P('Uli Hoeneß', 'MED', 13, 80), P('Herbert Wimmer', 'MED', 6, 76),
      P('Jürgen Grabowski', 'DEL', 17, 78), P('Gerd Müller', 'DEL', 13, 93), P('Bernd Hölzenbein', 'DEL', 11, 79),
    ]},
    { id: 'ned1974', country: 'Países Bajos', year: 1974, flag: '🇳🇱', result: 'Subcampeón', players: [
      P('Jan Jongbloed', 'POR', 8, 78), P('Ruud Krol', 'DEF', 3, 85), P('Wim Rijsbergen', 'DEF', 4, 77),
      P('Wim Suurbier', 'DEF', 2, 79), P('Theo de Jong', 'DEF', 6, 74), P('Arie Haan', 'MED', 5, 82),
      P('Johan Neeskens', 'MED', 13, 89), P('Wim van Hanegem', 'MED', 7, 86), P('Johan Cruyff', 'DEL', 14, 97),
      P('Rob Rensenbrink', 'DEL', 9, 86), P('Johnny Rep', 'DEL', 16, 84), P('Piet Keizer', 'DEL', 11, 80),
    ]},
    { id: 'arg1978', country: 'Argentina', year: 1978, flag: '🇦🇷', result: 'Campeón', players: [
      P('Ubaldo Fillol', 'POR', 5, 88), P('Jorge Olguín', 'DEF', 4, 77), P('Daniel Passarella', 'DEF', 3, 86),
      P('Luis Galván', 'DEF', 2, 78), P('Alberto Tarantini', 'DEF', 6, 79), P('Américo Gallego', 'MED', 15, 79),
      P('Osvaldo Ardiles', 'MED', 8, 83), P('René Houseman', 'MED', 18, 78), P('Norberto Alonso', 'MED', 16, 78),
      P('Mario Kempes', 'DEL', 10, 92), P('Leopoldo Luque', 'DEL', 9, 83), P('Daniel Bertoni', 'DEL', 7, 80),
    ]},
    { id: 'ita1982', country: 'Italia', year: 1982, flag: '🇮🇹', result: 'Campeón', players: [
      P('Dino Zoff', 'POR', 1, 90), P('Claudio Gentile', 'DEF', 6, 85), P('Gaetano Scirea', 'DEF', 2, 88),
      P('Fulvio Collovati', 'DEF', 5, 78), P('Antonio Cabrini', 'DEF', 3, 81), P('Giuseppe Bergomi', 'DEF', 14, 79),
      P('Marco Tardelli', 'MED', 19, 85), P('Giancarlo Antognoni', 'MED', 8, 83), P('Bruno Conti', 'MED', 20, 82),
      P('Paolo Rossi', 'DEL', 20, 91), P('Francesco Graziani', 'DEL', 18, 81), P('Alessandro Altobelli', 'DEL', 9, 82),
    ]},
    { id: 'arg1986', country: 'Argentina', year: 1986, flag: '🇦🇷', result: 'Campeón', players: [
      P('Nery Pumpido', 'POR', 5, 81), P('José Luis Brown', 'DEF', 6, 78), P('Oscar Ruggeri', 'DEF', 4, 82),
      P('Julio Olarticoechea', 'DEF', 3, 77), P('Sergio Batista', 'DEF', 2, 79), P('Ricardo Giusti', 'MED', 16, 76),
      P('Héctor Enrique', 'MED', 15, 76), P('Jorge Burruchaga', 'MED', 8, 83), P('Marcelo Trobbiani', 'MED', 20, 74),
      P('Diego Maradona', 'DEL', 10, 98), P('Jorge Valdano', 'DEL', 11, 85), P('Pedro Pasculli', 'DEL', 18, 80),
    ]},
    { id: 'rfa1990', country: 'Alemania Occidental', year: 1990, flag: '🇩🇪', result: 'Campeón', players: [
      P('Bodo Illgner', 'POR', 1, 83), P('Andreas Brehme', 'DEF', 3, 85), P('Klaus Augenthaler', 'DEF', 4, 81),
      P('Jürgen Kohler', 'DEF', 5, 83), P('Guido Buchwald', 'DEF', 6, 82), P('Lothar Matthäus', 'MED', 10, 93),
      P('Thomas Häßler', 'MED', 18, 84), P('Pierre Littbarski', 'MED', 17, 82), P('Olaf Thon', 'MED', 20, 78),
      P('Rudi Völler', 'DEL', 9, 86), P('Jürgen Klinsmann', 'DEL', 18, 89), P('Karl-Heinz Riedle', 'DEL', 20, 81),
    ]},
    { id: 'bra1994', country: 'Brasil', year: 1994, flag: '🇧🇷', result: 'Campeón', players: [
      P('Cláudio Taffarel', 'POR', 1, 86), P('Jorginho', 'DEF', 2, 81), P('Márcio Santos', 'DEF', 3, 77),
      P('Aldair', 'DEF', 6, 85), P('Branco', 'DEF', 6, 82), P('Dunga', 'MED', 8, 86), P('Mauro Silva', 'MED', 5, 83),
      P('Zinho', 'MED', 11, 78), P('Mazinho', 'MED', 14, 77), P('Romário', 'DEL', 11, 94), P('Bebeto', 'DEL', 7, 89), P('Müller', 'DEL', 21, 79),
    ]},
    { id: 'fra1998', country: 'Francia', year: 1998, flag: '🇫🇷', result: 'Campeón', players: [
      P('Fabien Barthez', 'POR', 16, 87), P('Lilian Thuram', 'DEF', 15, 87), P('Marcel Desailly', 'DEF', 8, 88),
      P('Laurent Blanc', 'DEF', 5, 85), P('Bixente Lizarazu', 'DEF', 3, 84), P('Didier Deschamps', 'MED', 7, 85),
      P('Emmanuel Petit', 'MED', 12, 83), P('Zinedine Zidane', 'MED', 10, 95), P('Youri Djorkaeff', 'MED', 6, 85),
      P('Thierry Henry', 'DEL', 12, 86), P('Stéphane Guivarc\'h', 'DEL', 9, 76), P('Christophe Dugarry', 'DEL', 21, 78),
    ]},
    { id: 'bra2002', country: 'Brasil', year: 2002, flag: '🇧🇷', result: 'Campeón', players: [
      P('Marcos', 'POR', 1, 85), P('Cafu', 'DEF', 2, 88), P('Lúcio', 'DEF', 3, 86), P('Roque Júnior', 'DEF', 4, 79),
      P('Roberto Carlos', 'DEF', 6, 91), P('Gilberto Silva', 'MED', 5, 82), P('Kléberson', 'MED', 15, 78),
      P('Juninho Paulista', 'MED', 8, 80), P('Edmílson', 'MED', 13, 79), P('Ronaldinho', 'DEL', 11, 89),
      P('Rivaldo', 'DEL', 10, 91), P('Ronaldo', 'DEL', 9, 96),
    ]},
    { id: 'ita2006', country: 'Italia', year: 2006, flag: '🇮🇹', result: 'Campeón', players: [
      P('Gianluigi Buffon', 'POR', 1, 93), P('Fabio Cannavaro', 'DEF', 5, 91), P('Alessandro Nesta', 'DEF', 13, 89),
      P('Gianluca Zambrotta', 'DEF', 19, 85), P('Fabio Grosso', 'DEF', 3, 81), P('Andrea Pirlo', 'MED', 21, 91),
      P('Gennaro Gattuso', 'MED', 8, 85), P('Simone Perrotta', 'MED', 20, 79), P('Mauro Camoranesi', 'MED', 16, 81),
      P('Francesco Totti', 'DEL', 10, 89), P('Luca Toni', 'DEL', 9, 85), P('Alberto Gilardino', 'DEL', 14, 80),
    ]},
    { id: 'esp2010', country: 'España', year: 2010, flag: '🇪🇸', result: 'Campeón', players: [
      P('Iker Casillas', 'POR', 1, 91), P('Sergio Ramos', 'DEF', 15, 88), P('Gerard Piqué', 'DEF', 3, 86),
      P('Carles Puyol', 'DEF', 5, 87), P('Joan Capdevila', 'DEF', 11, 79), P('Xabi Alonso', 'MED', 14, 86),
      P('Sergio Busquets', 'MED', 16, 82), P('Xavi', 'MED', 8, 92), P('Andrés Iniesta', 'MED', 6, 93),
      P('Cesc Fàbregas', 'MED', 4, 85), P('David Villa', 'DEL', 7, 88), P('Fernando Torres', 'DEL', 9, 85),
    ]},
    { id: 'ger2014', country: 'Alemania', year: 2014, flag: '🇩🇪', result: 'Campeón', players: [
      P('Manuel Neuer', 'POR', 1, 94), P('Philipp Lahm', 'DEF', 16, 89), P('Jérôme Boateng', 'DEF', 17, 85),
      P('Mats Hummels', 'DEF', 5, 86), P('Benedikt Höwedes', 'DEF', 4, 79), P('Toni Kroos', 'MED', 18, 89),
      P('Bastian Schweinsteiger', 'MED', 7, 87), P('Sami Khedira', 'MED', 6, 83), P('Mesut Özil', 'MED', 8, 86),
      P('Thomas Müller', 'DEL', 13, 88), P('Miroslav Klose', 'DEL', 11, 86), P('Mario Götze', 'DEL', 19, 83),
    ]},
    { id: 'fra2018', country: 'Francia', year: 2018, flag: '🇫🇷', result: 'Campeón', players: [
      P('Hugo Lloris', 'POR', 1, 88), P('Benjamin Pavard', 'DEF', 2, 81), P('Raphaël Varane', 'DEF', 4, 88),
      P('Samuel Umtiti', 'DEF', 5, 82), P('Lucas Hernández', 'DEF', 21, 81), P('N\'Golo Kanté', 'MED', 13, 87),
      P('Paul Pogba', 'MED', 6, 87), P('Blaise Matuidi', 'MED', 14, 81), P('Corentin Tolisso', 'MED', 12, 78),
      P('Antoine Griezmann', 'DEL', 7, 90), P('Kylian Mbappé', 'DEL', 10, 89), P('Olivier Giroud', 'DEL', 9, 82),
    ]},
    { id: 'arg2022', country: 'Argentina', year: 2022, flag: '🇦🇷', result: 'Campeón', players: [
      P('Emiliano Martínez', 'POR', 23, 87), P('Nahuel Molina', 'DEF', 26, 80), P('Cristian Romero', 'DEF', 13, 85),
      P('Nicolás Otamendi', 'DEF', 19, 82), P('Nicolás Tagliafico', 'DEF', 3, 80), P('Rodrigo De Paul', 'MED', 7, 84),
      P('Enzo Fernández', 'MED', 24, 83), P('Alexis Mac Allister', 'MED', 20, 83), P('Leandro Paredes', 'MED', 5, 79),
      P('Lionel Messi', 'DEL', 10, 97), P('Julián Álvarez', 'DEL', 9, 85), P('Ángel Di María', 'DEL', 11, 85),
    ]},
    { id: 'col1990', country: 'Colombia', year: 1990, flag: '🇨🇴', result: 'Octavos de final', players: [
      P('René Higuita', 'POR', 1, 85), P('Luis Fernando Herrera', 'DEF', 4, 78), P('Andrés Escobar', 'DEF', 6, 82),
      P('Luis Carlos Perea', 'DEF', 5, 77), P('Léider Preciado', 'DEF', 3, 74), P('Carlos Valderrama', 'MED', 10, 89),
      P('Freddy Rincón', 'MED', 7, 83), P('Gabriel Gómez', 'MED', 15, 74), P('Leonel Álvarez', 'MED', 8, 76),
      P('Bernardo Redín', 'DEL', 9, 77), P('Antony de Ávila', 'DEL', 11, 78),
    ]},
    { id: 'col2014', country: 'Colombia', year: 2014, flag: '🇨🇴', result: 'Cuartos de final', players: [
      P('David Ospina', 'POR', 1, 83), P('Cristián Zapata', 'DEF', 4, 78), P('Mario Yepes', 'DEF', 3, 79),
      P('Pablo Armero', 'DEF', 17, 76), P('Juan Camilo Zúñiga', 'DEF', 18, 77), P('Abel Aguilar', 'MED', 15, 76),
      P('Carlos Sánchez', 'MED', 6, 76), P('James Rodríguez', 'MED', 10, 91), P('Fredy Guarín', 'MED', 8, 78),
      P('Juan Cuadrado', 'DEL', 11, 82), P('Teófilo Gutiérrez', 'DEL', 7, 79), P('Jackson Martínez', 'DEL', 9, 80),
    ]},

    // ── Lote 2: ampliación 1950-2022 (finalistas, semifinalistas y equipos icónicos) ──
    { id: 'bra1950', country: 'Brasil', year: 1950, flag: '🇧🇷', result: 'Subcampeón', players: [
      P('Moacir Barbosa', 'POR', 1, 84), P('Augusto', 'DEF', 2, 75), P('Juvenal', 'DEF', 3, 76),
      P('Bigode', 'DEF', 4, 78), P('Danilo', 'DEF', 5, 79), P('Bauer', 'MED', 6, 82), P('Zizinho', 'MED', 7, 92),
      P('Friaça', 'DEL', 8, 76), P('Ademir', 'DEL', 9, 90), P('Jair', 'DEL', 10, 82), P('Chico', 'DEL', 11, 78),
    ]},
    { id: 'rfa1954', country: 'Alemania Occidental', year: 1954, flag: '🇩🇪', result: 'Campeón', players: [
      P('Toni Turek', 'POR', 1, 83), P('Josef Posipal', 'DEF', 2, 76), P('Werner Kohlmeyer', 'DEF', 3, 78),
      P('Werner Liebrich', 'DEF', 5, 79), P('Horst Eckel', 'MED', 4, 77), P('Karl Mai', 'MED', 6, 75),
      P('Helmut Rahn', 'DEL', 7, 87), P('Max Morlock', 'DEL', 8, 84), P('Ottmar Walter', 'DEL', 9, 82),
      P('Fritz Walter', 'DEL', 10, 92), P('Hans Schäfer', 'DEL', 11, 80),
    ]},
    { id: 'hun1954', country: 'Hungría', year: 1954, flag: '🇭🇺', result: 'Subcampeón', players: [
      P('Gyula Grosics', 'POR', 1, 92), P('Jenő Buzánszky', 'DEF', 2, 79), P('Gyula Lóránt', 'DEF', 3, 81),
      P('Mihály Lantos', 'DEF', 4, 78), P('József Bozsik', 'MED', 6, 89), P('József Zakariás', 'MED', 5, 76),
      P('Zoltán Czibor', 'DEL', 7, 86), P('Sándor Kocsis', 'DEL', 8, 94), P('Nándor Hidegkuti', 'DEL', 9, 92),
      P('Ferenc Puskás', 'DEL', 10, 98), P('József Tóth', 'DEL', 11, 78),
    ]},
    { id: 'bra1962', country: 'Brasil', year: 1962, flag: '🇧🇷', result: 'Campeón', players: [
      P('Gilmar', 'POR', 1, 87), P('Djalma Santos', 'DEF', 2, 86), P('Nílton Santos', 'DEF', 3, 85),
      P('Mauro Ramos', 'DEF', 4, 81), P('Zózimo', 'DEF', 5, 77), P('Zito', 'MED', 6, 81), P('Didi', 'MED', 8, 89),
      P('Garrincha', 'DEL', 7, 95), P('Vavá', 'DEL', 9, 84), P('Amarildo', 'DEL', 10, 83), P('Zagallo', 'DEL', 11, 81),
    ]},
    { id: 'rfa1966', country: 'Alemania Occidental', year: 1966, flag: '🇩🇪', result: 'Subcampeón', players: [
      P('Hans Tilkowski', 'POR', 1, 84), P('Horst-Dieter Höttges', 'DEF', 2, 78), P('Willi Schulz', 'DEF', 3, 79),
      P('Wolfgang Weber', 'DEF', 4, 78), P('Karl-Heinz Schnellinger', 'DEF', 5, 80), P('Franz Beckenbauer', 'MED', 6, 90),
      P('Wolfgang Overath', 'MED', 8, 83), P('Helmut Haller', 'DEL', 7, 85), P('Uwe Seeler', 'DEL', 9, 88),
      P('Siegfried Held', 'DEL', 10, 79), P('Lothar Emmerich', 'DEL', 11, 80),
    ]},
    { id: 'ned1978', country: 'Países Bajos', year: 1978, flag: '🇳🇱', result: 'Subcampeón', players: [
      P('Jan Jongbloed', 'POR', 8, 78), P('Ruud Krol', 'DEF', 3, 85), P('Jan Poortvliet', 'DEF', 2, 75),
      P('Ernie Brandts', 'DEF', 5, 76), P('Wim Rijsbergen', 'DEF', 4, 76), P('Arie Haan', 'MED', 7, 83),
      P('Johan Neeskens', 'MED', 13, 88), P('Wim Jansen', 'MED', 6, 78), P('Rob Rensenbrink', 'DEL', 9, 87),
      P('Johnny Rep', 'DEL', 16, 85), P('René van de Kerkhof', 'DEL', 19, 80),
    ]},
    { id: 'ita1990', country: 'Italia', year: 1990, flag: '🇮🇹', result: '3er lugar', players: [
      P('Walter Zenga', 'POR', 1, 88), P('Giuseppe Bergomi', 'DEF', 2, 85), P('Franco Baresi', 'DEF', 6, 93),
      P('Paolo Maldini', 'DEF', 3, 89), P('Riccardo Ferri', 'DEF', 5, 82), P('Fernando De Napoli', 'MED', 16, 78),
      P('Roberto Donadoni', 'MED', 7, 83), P('Roberto Baggio', 'DEL', 15, 89), P('Salvatore Schillaci', 'DEL', 19, 88),
      P('Gianluca Vialli', 'DEL', 9, 85), P('Aldo Serena', 'DEL', 20, 78),
    ]},
    { id: 'eng1990', country: 'Inglaterra', year: 1990, flag: '🏴', result: '4to lugar', players: [
      P('Peter Shilton', 'POR', 1, 89), P('Terry Butcher', 'DEF', 6, 83), P('Des Walker', 'DEF', 5, 81),
      P('Mark Wright', 'DEF', 17, 80), P('Stuart Pearce', 'DEF', 3, 82), P('Paul Gascoigne', 'MED', 19, 92),
      P('David Platt', 'MED', 12, 84), P('Chris Waddle', 'MED', 7, 83), P('Gary Lineker', 'DEL', 10, 90),
      P('Peter Beardsley', 'DEL', 9, 83), P('John Barnes', 'DEL', 11, 82),
    ]},
    { id: 'cro1998', country: 'Croacia', year: 1998, flag: '🇭🇷', result: '3er lugar', players: [
      P('Dražen Ladić', 'POR', 1, 79), P('Slaven Bilić', 'DEF', 16, 81), P('Igor Štimac', 'DEF', 4, 80),
      P('Dario Šimić', 'DEF', 14, 78), P('Robert Jarni', 'DEF', 3, 83), P('Zvonimir Boban', 'MED', 10, 88),
      P('Aljoša Asanović', 'MED', 8, 79), P('Robert Prosinečki', 'MED', 11, 89), P('Davor Šuker', 'DEL', 18, 93),
      P('Goran Vlaović', 'DEL', 9, 80), P('Mario Stanić', 'DEL', 6, 77),
    ]},
    { id: 'ned1998', country: 'Países Bajos', year: 1998, flag: '🇳🇱', result: '4to lugar', players: [
      P('Edwin van der Sar', 'POR', 1, 89), P('Michael Reiziger', 'DEF', 2, 81), P('Frank de Boer', 'DEF', 4, 85),
      P('Jaap Stam', 'DEF', 3, 89), P('Arthur Numan', 'DEF', 5, 80), P('Edgar Davids', 'MED', 23, 86),
      P('Ronald de Boer', 'MED', 17, 81), P('Clarence Seedorf', 'MED', 19, 86), P('Dennis Bergkamp', 'DEL', 8, 93),
      P('Patrick Kluivert', 'DEL', 9, 88), P('Marc Overmars', 'DEL', 11, 85),
    ]},
    { id: 'ger2002', country: 'Alemania', year: 2002, flag: '🇩🇪', result: 'Subcampeón', players: [
      P('Oliver Kahn', 'POR', 1, 95), P('Christoph Metzelder', 'DEF', 4, 81), P('Thomas Linke', 'DEF', 5, 78),
      P('Marko Rehmer', 'DEF', 3, 75), P('Torsten Frings', 'MED', 19, 83), P('Michael Ballack', 'MED', 13, 90),
      P('Dietmar Hamann', 'MED', 18, 82), P('Bernd Schneider', 'MED', 7, 80), P('Miroslav Klose', 'DEL', 11, 88),
      P('Carsten Jancker', 'DEL', 9, 80), P('Oliver Neuville', 'DEL', 20, 79),
    ]},
    { id: 'ger2006', country: 'Alemania', year: 2006, flag: '🇩🇪', result: '3er lugar', players: [
      P('Jens Lehmann', 'POR', 1, 87), P('Philipp Lahm', 'DEF', 21, 85), P('Per Mertesacker', 'DEF', 17, 83),
      P('Christoph Metzelder', 'DEF', 4, 80), P('Arne Friedrich', 'DEF', 15, 79), P('Michael Ballack', 'MED', 13, 91),
      P('Bastian Schweinsteiger', 'MED', 7, 84), P('Torsten Frings', 'MED', 8, 82), P('Miroslav Klose', 'DEL', 11, 90),
      P('Lukas Podolski', 'DEL', 10, 85), P('Oliver Neuville', 'DEL', 20, 78),
    ]},
    { id: 'fra2006', country: 'Francia', year: 2006, flag: '🇫🇷', result: 'Subcampeón', players: [
      P('Fabien Barthez', 'POR', 16, 86), P('Lilian Thuram', 'DEF', 15, 86), P('William Gallas', 'DEF', 5, 83),
      P('Éric Abidal', 'DEF', 21, 79), P('Willy Sagnol', 'DEF', 19, 78), P('Patrick Vieira', 'MED', 4, 87),
      P('Claude Makélélé', 'MED', 6, 85), P('Zinedine Zidane', 'MED', 10, 94), P('Thierry Henry', 'DEL', 12, 90),
      P('Franck Ribéry', 'DEL', 22, 85), P('Florent Malouda', 'DEL', 23, 80),
    ]},
    { id: 'ned2010', country: 'Países Bajos', year: 2010, flag: '🇳🇱', result: 'Subcampeón', players: [
      P('Maarten Stekelenburg', 'POR', 1, 84), P('Gregory van der Wiel', 'DEF', 2, 78), P('John Heitinga', 'DEF', 3, 80),
      P('Joris Mathijsen', 'DEF', 4, 79), P('Giovanni van Bronckhorst', 'DEF', 5, 82), P('Mark van Bommel', 'MED', 6, 83),
      P('Nigel de Jong', 'MED', 7, 83), P('Wesley Sneijder', 'MED', 10, 92), P('Arjen Robben', 'DEL', 11, 91),
      P('Robin van Persie', 'DEL', 9, 90), P('Dirk Kuyt', 'DEL', 14, 83),
    ]},
    { id: 'uru2010', country: 'Uruguay', year: 2010, flag: '🇺🇾', result: '4to lugar', players: [
      P('Fernando Muslera', 'POR', 1, 85), P('Diego Lugano', 'DEF', 4, 82), P('Diego Godín', 'DEF', 3, 83),
      P('Jorge Fucile', 'DEF', 6, 77), P('Maxi Pereira', 'DEF', 17, 78), P('Walter Gargano', 'MED', 5, 78),
      P('Diego Pérez', 'MED', 15, 76), P('Diego Forlán', 'DEL', 10, 90), P('Luis Suárez', 'DEL', 9, 87),
      P('Edinson Cavani', 'DEL', 21, 83), P('Sebastián Abreu', 'DEL', 18, 78),
    ]},
    { id: 'arg2014', country: 'Argentina', year: 2014, flag: '🇦🇷', result: 'Subcampeón', players: [
      P('Sergio Romero', 'POR', 1, 83), P('Pablo Zabaleta', 'DEF', 7, 82), P('Ezequiel Garay', 'DEF', 13, 80),
      P('Marcos Rojo', 'DEF', 16, 79), P('Martín Demichelis', 'DEF', 17, 78), P('Javier Mascherano', 'MED', 14, 89),
      P('Lucas Biglia', 'MED', 5, 80), P('Lionel Messi', 'DEL', 10, 97), P('Ángel Di María', 'DEL', 11, 87),
      P('Gonzalo Higuaín', 'DEL', 9, 87), P('Ezequiel Lavezzi', 'DEL', 22, 82),
    ]},
    { id: 'ned2014', country: 'Países Bajos', year: 2014, flag: '🇳🇱', result: '3er lugar', players: [
      P('Jasper Cillessen', 'POR', 1, 83), P('Ron Vlaar', 'DEF', 4, 80), P('Stefan de Vrij', 'DEF', 3, 81),
      P('Bruno Martins Indi', 'DEF', 5, 78), P('Daryl Janmaat', 'DEF', 2, 77), P('Nigel de Jong', 'MED', 6, 82),
      P('Wesley Sneijder', 'MED', 10, 89), P('Arjen Robben', 'DEL', 11, 93), P('Robin van Persie', 'DEL', 9, 89),
      P('Klaas-Jan Huntelaar', 'DEL', 18, 81), P('Dirk Kuyt', 'DEL', 7, 82),
    ]},
    { id: 'cro2018', country: 'Croacia', year: 2018, flag: '🇭🇷', result: 'Subcampeón', players: [
      P('Danijel Subašić', 'POR', 23, 83), P('Šime Vrsaljko', 'DEF', 2, 80), P('Dejan Lovren', 'DEF', 6, 80),
      P('Domagoj Vida', 'DEF', 21, 80), P('Ivan Strinić', 'DEF', 3, 76), P('Luka Modrić', 'MED', 10, 93),
      P('Ivan Rakitić', 'MED', 7, 88), P('Marcelo Brozović', 'MED', 11, 82), P('Ante Rebić', 'DEL', 18, 82),
      P('Mario Mandžukić', 'DEL', 17, 85), P('Ivan Perišić', 'DEL', 4, 84),
    ]},
    { id: 'bel2018', country: 'Bélgica', year: 2018, flag: '🇧🇪', result: '3er lugar', players: [
      P('Thibaut Courtois', 'POR', 1, 90), P('Toby Alderweireld', 'DEF', 2, 83), P('Vincent Kompany', 'DEF', 4, 82),
      P('Jan Vertonghen', 'DEF', 5, 83), P('Thomas Meunier', 'DEF', 16, 78), P('Kevin De Bruyne', 'MED', 7, 92),
      P('Axel Witsel', 'MED', 6, 83), P('Marouane Fellaini', 'MED', 8, 78), P('Eden Hazard', 'DEL', 10, 90),
      P('Romelu Lukaku', 'DEL', 9, 87), P('Dries Mertens', 'DEL', 14, 82),
    ]},
    { id: 'eng2018', country: 'Inglaterra', year: 2018, flag: '🏴', result: '4to lugar', players: [
      P('Jordan Pickford', 'POR', 1, 85), P('Kyle Walker', 'DEF', 2, 80), P('Harry Maguire', 'DEF', 6, 82),
      P('John Stones', 'DEF', 5, 79), P('Ashley Young', 'DEF', 18, 79), P('Kieran Trippier', 'MED', 12, 80),
      P('Jordan Henderson', 'MED', 8, 80), P('Dele Alli', 'MED', 20, 82), P('Harry Kane', 'DEL', 9, 89),
      P('Raheem Sterling', 'DEL', 10, 83), P('Jesse Lingard', 'DEL', 17, 80),
    ]},
    { id: 'cro2022', country: 'Croacia', year: 2022, flag: '🇭🇷', result: '3er lugar', players: [
      P('Dominik Livaković', 'POR', 1, 87), P('Joško Gvardiol', 'DEF', 20, 85), P('Josip Juranović', 'DEF', 22, 80),
      P('Dejan Lovren', 'DEF', 6, 78), P('Borna Sosa', 'DEF', 19, 77), P('Luka Modrić', 'MED', 10, 90),
      P('Marcelo Brozović', 'MED', 11, 83), P('Mateo Kovačić', 'MED', 8, 84), P('Ivan Perišić', 'DEL', 4, 83),
      P('Andrej Kramarić', 'DEL', 9, 82), P('Bruno Petković', 'DEL', 17, 78),
    ]},
    { id: 'fra2022', country: 'Francia', year: 2022, flag: '🇫🇷', result: 'Subcampeón', players: [
      P('Hugo Lloris', 'POR', 1, 86), P('Jules Koundé', 'DEF', 5, 83), P('Raphaël Varane', 'DEF', 4, 87),
      P('Dayot Upamecano', 'DEF', 17, 80), P('Theo Hernández', 'DEF', 22, 83), P('Aurélien Tchouaméni', 'MED', 8, 85),
      P('Adrien Rabiot', 'MED', 14, 82), P('Antoine Griezmann', 'DEL', 7, 89), P('Kylian Mbappé', 'DEL', 10, 94),
      P('Olivier Giroud', 'DEL', 9, 83), P('Ousmane Dembélé', 'DEL', 11, 83),
    ]},
    { id: 'mar2022', country: 'Marruecos', year: 2022, flag: '🇲🇦', result: '4to lugar', players: [
      P('Yassine Bounou', 'POR', 1, 87), P('Achraf Hakimi', 'DEF', 2, 88), P('Romain Saïss', 'DEF', 6, 81),
      P('Nayef Aguerd', 'DEF', 5, 80), P('Noussair Mazraoui', 'DEF', 22, 80), P('Sofyan Amrabat', 'MED', 4, 84),
      P('Azzedine Ounahi', 'MED', 8, 80), P('Selim Amallah', 'MED', 17, 76), P('Hakim Ziyech', 'DEL', 7, 85),
      P('Youssef En-Nesyri', 'DEL', 19, 84), P('Sofiane Boufal', 'DEL', 11, 80),
    ]},
    { id: 'kor2002', country: 'Corea del Sur', year: 2002, flag: '🇰🇷', result: '4to lugar', players: [
      P('Lee Woon-jae', 'POR', 1, 84), P('Hong Myung-bo', 'DEF', 6, 85), P('Choi Jin-cheul', 'DEF', 5, 76),
      P('Kim Tae-young', 'DEF', 20, 77), P('Lee Young-pyo', 'DEF', 12, 79), P('Yoo Sang-chul', 'MED', 8, 80),
      P('Kim Nam-il', 'MED', 17, 76), P('Song Chong-gug', 'MED', 16, 76), P('Park Ji-sung', 'DEL', 7, 83),
      P('Ahn Jung-hwan', 'DEL', 18, 83), P('Hwang Sun-hong', 'DEL', 20, 77),
    ]},
    { id: 'tur2002', country: 'Turquía', year: 2002, flag: '🇹🇷', result: '3er lugar', players: [
      P('Rüştü Reçber', 'POR', 1, 89), P('Alpay Özalan', 'DEF', 3, 82), P('Fatih Akyel', 'DEF', 4, 77),
      P('Bülent Korkmaz', 'DEF', 6, 80), P('İbrahim Üzülmez', 'DEF', 16, 76), P('Emre Belözoğlu', 'MED', 10, 85),
      P('Tuncay Şanlı', 'MED', 17, 80), P('Yıldıray Baştürk', 'MED', 8, 78), P('Hakan Şükür', 'DEL', 9, 87),
      P('İlhan Mansız', 'DEL', 21, 80), P('Ümit Davala', 'DEL', 7, 76),
    ]},

    // ── Lote 3: más selecciones y eras nuevas (1958-2010) ──
    { id: 'fra1958', country: 'Francia', year: 1958, flag: '🇫🇷', result: '3er lugar', players: [
      P('Claude Abbes', 'POR', 1, 78), P('Robert Jonquet', 'DEF', 5, 80), P('Armand Penverne', 'DEF', 4, 79),
      P('Raymond Kaelbel', 'DEF', 2, 75), P('Bernard Chiarelli', 'DEF', 3, 74), P('Raymond Kopa', 'MED', 8, 90),
      P('Just Fontaine', 'DEL', 9, 92), P('Roger Piantoni', 'DEL', 7, 83), P('Jean Vincent', 'DEL', 11, 81),
      P('Maryan Wisnieski', 'DEL', 6, 79), P('René Bliard', 'DEL', 10, 76),
    ]},
    { id: 'swe1958', country: 'Suecia', year: 1958, flag: '🇸🇪', result: 'Subcampeón', players: [
      P('Kalle Svensson', 'POR', 1, 82), P('Orvar Bergmark', 'DEF', 2, 79), P('Sven Axbom', 'DEF', 3, 75),
      P('Bengt Gustavsson', 'DEF', 4, 74), P('Sigge Parling', 'DEF', 5, 76), P('Nils Liedholm', 'MED', 10, 88),
      P('Sylve Bengtsson', 'MED', 6, 74), P('Kurt Hamrin', 'DEL', 7, 87), P('Agne Simonsson', 'DEL', 9, 80),
      P('Lennart Skoglund', 'DEL', 11, 83), P('Gunnar Gren', 'DEL', 8, 85),
    ]},
    { id: 'wal1958', country: 'Gales', year: 1958, flag: '🏴', result: 'Cuartos de final', players: [
      P('Jack Kelsey', 'POR', 1, 80), P('Stuart Williams', 'DEF', 2, 74), P('Mel Hopkins', 'DEF', 3, 74),
      P('Mel Charles', 'DEF', 5, 80), P('Dave Bowen', 'MED', 6, 76), P('Ivor Allchurch', 'MED', 8, 84),
      P('Colin Baker', 'MED', 4, 72), P('John Charles', 'DEL', 9, 88), P('Cliff Jones', 'DEL', 11, 82),
      P('Terry Medwin', 'DEL', 7, 78), P('Roy Vernon', 'DEL', 10, 77),
    ]},
    { id: 'chi1962', country: 'Chile', year: 1962, flag: '🇨🇱', result: '3er lugar', players: [
      P('Misael Escuti', 'POR', 1, 80), P('Sergio Navarro', 'DEF', 2, 76), P('Luis Eyzaguirre', 'DEF', 3, 74),
      P('Humberto Cruz', 'DEF', 4, 75), P('Alberto Quintano', 'DEF', 5, 74), P('Jorge Toro', 'MED', 6, 80),
      P('Eladio Rojas', 'MED', 8, 82), P('Leonel Sánchez', 'DEL', 11, 88), P('Jaime Ramírez', 'DEL', 9, 80),
      P('Honorino Landa', 'DEL', 7, 78), P('Alberto Fouilloux', 'DEL', 10, 77),
    ]},
    { id: 'tch1962', country: 'Checoslovaquia', year: 1962, flag: '🇨🇿', result: 'Subcampeón', players: [
      P('Viliam Schrojf', 'POR', 1, 82), P('Ján Popluhár', 'DEF', 2, 80), P('Svatopluk Pluskal', 'DEF', 3, 76),
      P('Tomáš Pospíchal', 'DEF', 4, 75), P('Ladislav Novák', 'DEF', 5, 77), P('Josef Masopust', 'MED', 8, 89),
      P('Andrej Kvašňák', 'MED', 6, 76), P('Adolf Scherer', 'DEL', 9, 82), P('Josef Kadraba', 'DEL', 10, 78),
      P('Vojtěch Masný', 'DEL', 7, 77), P('Rudolf Geleta', 'DEL', 11, 74),
    ]},
    { id: 'urs1966', country: 'Unión Soviética', year: 1966, flag: '🇷🇺', result: '4to lugar', players: [
      P('Lev Yashin', 'POR', 1, 96), P('Albert Shesternyov', 'DEF', 2, 82), P('Vasili Danilov', 'DEF', 3, 75),
      P('Murtaz Khurtsilava', 'DEF', 5, 78), P('Georgiy Sichinava', 'DEF', 4, 74), P('Valeriy Voronin', 'MED', 6, 84),
      P('Igor Chislenko', 'DEL', 7, 82), P('Anatoliy Banishevskiy', 'DEL', 9, 80), P('Slava Metreveli', 'DEL', 11, 79),
      P('Eduard Malofeev', 'DEL', 10, 78), P('Valeriy Porkuyan', 'DEL', 8, 76),
    ]},
    { id: 'por1966', country: 'Portugal', year: 1966, flag: '🇵🇹', result: '3er lugar', players: [
      P('José Pereira', 'POR', 1, 80), P('Vicente', 'DEF', 2, 78), P('Hilário', 'DEF', 3, 78),
      P('Germano', 'DEF', 5, 79), P('Alexandre Baptista', 'DEF', 4, 75), P('Mário Coluna', 'MED', 6, 88),
      P('José Augusto', 'MED', 7, 80), P('Eusébio', 'DEL', 10, 96), P('José Torres', 'DEL', 9, 85),
      P('António Simões', 'DEL', 11, 83), P('Jaime Graça', 'DEL', 8, 79),
    ]},
    { id: 'per1970', country: 'Perú', year: 1970, flag: '🇵🇪', result: 'Cuartos de final', players: [
      P('Luis Rubiños', 'POR', 1, 78), P('Héctor Chumpitaz', 'DEF', 2, 83), P('Nicolás Fuentes', 'DEF', 3, 76),
      P('Orlando de la Torre', 'DEF', 4, 74), P('Rubén Toribio Díaz', 'DEF', 5, 75), P('Ramón Mifflin', 'MED', 6, 78),
      P('Roberto Challe', 'MED', 8, 76), P('Teófilo Cubillas', 'DEL', 10, 89), P('Hugo Sotil', 'DEL', 9, 83),
      P('Pedro Pablo León', 'DEL', 11, 78), P('Julio Baylón', 'DEL', 7, 76),
    ]},
    { id: 'pol1974', country: 'Polonia', year: 1974, flag: '🇵🇱', result: '3er lugar', players: [
      P('Jan Tomaszewski', 'POR', 1, 84), P('Antoni Szymanowski', 'DEF', 2, 76), P('Jerzy Gorgoń', 'DEF', 5, 78),
      P('Władysław Żmuda', 'DEF', 3, 79), P('Adam Musiał', 'DEF', 4, 75), P('Kazimierz Deyna', 'MED', 8, 89),
      P('Henryk Kasperczak', 'MED', 6, 77), P('Zygmunt Maszczyk', 'MED', 15, 76), P('Grzegorz Lato', 'DEL', 7, 88),
      P('Andrzej Szarmach', 'DEL', 9, 85), P('Robert Gadocha', 'DEL', 11, 80),
    ]},
    { id: 'bra1982', country: 'Brasil', year: 1982, flag: '🇧🇷', result: 'Segunda fase de grupos', players: [
      P('Waldir Peres', 'POR', 1, 78), P('Leandro', 'DEF', 2, 80), P('Oscar', 'DEF', 4, 78),
      P('Luizinho', 'DEF', 3, 76), P('Júnior', 'DEF', 6, 84), P('Sócrates', 'MED', 8, 92),
      P('Zico', 'MED', 10, 93), P('Falcão', 'MED', 5, 89), P('Toninho Cerezo', 'MED', 15, 84),
      P('Éder', 'DEL', 11, 84), P('Serginho', 'DEL', 9, 78),
    ]},
    { id: 'pol1982', country: 'Polonia', year: 1982, flag: '🇵🇱', result: '3er lugar', players: [
      P('Józef Młynarczyk', 'POR', 1, 82), P('Władysław Żmuda', 'DEF', 3, 81), P('Stefan Majewski', 'DEF', 5, 74),
      P('Roman Wójcicki', 'DEF', 4, 73), P('Stefan Białas', 'DEF', 2, 73), P('Zbigniew Boniek', 'MED', 10, 90),
      P('Grzegorz Lato', 'MED', 7, 83), P('Andrzej Buncol', 'MED', 15, 76), P('Włodzimierz Smolarek', 'DEL', 16, 82),
      P('Andrzej Pałasz', 'DEL', 9, 76), P('Andrzej Iwan', 'DEL', 11, 75),
    ]},
    { id: 'mex1986', country: 'México', year: 1986, flag: '🇲🇽', result: 'Cuartos de final', players: [
      P('Pablo Larios', 'POR', 1, 80), P('Fernando Quirarte', 'DEF', 4, 79), P('Rafael Amador', 'DEF', 5, 77),
      P('Miguel España', 'DEF', 3, 75), P('Manuel Negrete', 'MED', 15, 82), P('Tomás Boy', 'MED', 6, 80),
      P('Javier Aguirre', 'MED', 8, 78), P('Carlos de los Cobos', 'MED', 10, 76), P('Hugo Sánchez', 'DEL', 9, 92),
      P('Luis Flores', 'DEL', 11, 78), P('Raúl Servín', 'DEF', 2, 74),
    ]},
    { id: 'cmr1990', country: 'Camerún', year: 1990, flag: '🇨🇲', result: 'Cuartos de final', players: [
      P('Thomas N\'Kono', 'POR', 1, 84), P('Stephen Tataw', 'DEF', 5, 78), P('Emmanuel Kundé', 'DEF', 4, 77),
      P('Benjamin Massing', 'DEF', 2, 76), P('André Kana-Biyik', 'DEF', 6, 75), P('Cyrille Makanaky', 'MED', 15, 80),
      P('Louis-Paul Mfede', 'MED', 12, 76), P('Roger Milla', 'DEL', 20, 90), P('François Omam-Biyik', 'DEL', 9, 82),
      P('Emmanuel Maboang', 'DEL', 8, 76), P('Roger Feutmba', 'DEL', 17, 75),
    ]},
    { id: 'yug1990', country: 'Yugoslavia', year: 1990, flag: '🇷🇸', result: 'Cuartos de final', players: [
      P('Tomislav Ivković', 'POR', 1, 80), P('Refik Šabanadžović', 'DEF', 2, 76), P('Faruk Hadžibegić', 'DEF', 4, 80),
      P('Mišo Krstičević', 'DEF', 5, 74), P('Zoran Vulić', 'DEF', 3, 74), P('Dragan Stojković', 'MED', 10, 89),
      P('Robert Prosinečki', 'MED', 8, 87), P('Safet Sušić', 'MED', 15, 85), P('Darko Pančev', 'DEL', 9, 84),
      P('Dejan Savićević', 'DEL', 11, 87), P('Predrag Mijatović', 'DEL', 17, 80),
    ]},
    { id: 'arg1990', country: 'Argentina', year: 1990, flag: '🇦🇷', result: 'Subcampeón', players: [
      P('Sergio Goycochea', 'POR', 1, 85), P('Oscar Ruggeri', 'DEF', 6, 82), P('José Serrizuela', 'DEF', 2, 75),
      P('Julio Olarticoechea', 'DEF', 4, 77), P('Néstor Lorenzo', 'DEF', 3, 74), P('Jorge Burruchaga', 'MED', 7, 80),
      P('Pedro Troglio', 'MED', 15, 74), P('Diego Maradona', 'DEL', 10, 94), P('Claudio Caniggia', 'DEL', 8, 86),
      P('Gabriel Calderón', 'DEL', 17, 76), P('Gustavo Dezotti', 'DEL', 9, 78),
    ]},
    { id: 'irl1990', country: 'Irlanda', year: 1990, flag: '🇮🇪', result: 'Cuartos de final', players: [
      P('Packie Bonner', 'POR', 1, 82), P('Paul McGrath', 'DEF', 6, 86), P('Kevin Moran', 'DEF', 5, 80),
      P('Steve Staunton', 'DEF', 3, 78), P('Mick McCarthy', 'DEF', 4, 76), P('Ronnie Whelan', 'MED', 7, 80),
      P('Ray Houghton', 'MED', 11, 80), P('John Aldridge', 'DEL', 9, 80), P('Niall Quinn', 'DEL', 21, 78),
      P('Tony Cascarino', 'DEL', 14, 77), P('Frank Stapleton', 'DEL', 10, 76),
    ]},
    { id: 'den1986', country: 'Dinamarca', year: 1986, flag: '🇩🇰', result: 'Octavos de final', players: [
      P('Troels Rasmussen', 'POR', 1, 78), P('Morten Olsen', 'DEF', 3, 82), P('Ivan Nielsen', 'DEF', 5, 76),
      P('John Sivebæk', 'DEF', 2, 75), P('Søren Busk', 'DEF', 4, 74), P('Søren Lerby', 'MED', 6, 82),
      P('Frank Arnesen', 'MED', 8, 80), P('Jesper Olsen', 'MED', 11, 80), P('Preben Elkjær', 'DEL', 9, 87),
      P('Michael Laudrup', 'DEL', 10, 90), P('Jens Jørn Bertelsen', 'DEL', 7, 74),
    ]},
    { id: 'nga1994', country: 'Nigeria', year: 1994, flag: '🇳🇬', result: 'Octavos de final', players: [
      P('Peter Rufai', 'POR', 1, 80), P('Uche Okechukwu', 'DEF', 5, 76), P('Augustine Eguavoen', 'DEF', 4, 76),
      P('Chidi Nwanu', 'DEF', 6, 74), P('Benedict Iroha', 'DEF', 3, 74), P('Sunday Oliseh', 'MED', 17, 80),
      P('Augustine Okocha', 'MED', 14, 88), P('Mutiu Adepoju', 'MED', 15, 78), P('Rashidi Yekini', 'DEL', 9, 85),
      P('Daniel Amokachi', 'DEL', 11, 82), P('Emmanuel Amuneke', 'DEL', 18, 83),
    ]},
    { id: 'rom1994', country: 'Rumania', year: 1994, flag: '🇷🇴', result: 'Cuartos de final', players: [
      P('Florin Prunea', 'POR', 1, 79), P('Dan Petrescu', 'DEF', 2, 80), P('Miodrag Belodedici', 'DEF', 4, 82),
      P('Gheorghe Popescu', 'DEF', 5, 84), P('Daniel Prodan', 'DEF', 6, 76), P('Gheorghe Hagi', 'MED', 10, 92),
      P('Ioan Lupescu', 'MED', 8, 78), P('Ilie Dumitrescu', 'MED', 11, 83), P('Florin Răducioiu', 'DEL', 9, 82),
      P('Dorinel Munteanu', 'DEL', 17, 77), P('Ioan Vlădoiu', 'DEL', 18, 76),
    ]},
    { id: 'swe1994', country: 'Suecia', year: 1994, flag: '🇸🇪', result: '3er lugar', players: [
      P('Thomas Ravelli', 'POR', 1, 84), P('Roland Nilsson', 'DEF', 2, 79), P('Patrik Andersson', 'DEF', 5, 78),
      P('Joachim Björklund', 'DEF', 4, 77), P('Jan Eriksson', 'DEF', 3, 75), P('Jonas Thern', 'MED', 6, 82),
      P('Stefan Schwarz', 'MED', 8, 79), P('Håkan Mild', 'MED', 15, 78), P('Tomas Brolin', 'DEL', 20, 86),
      P('Martin Dahlin', 'DEL', 9, 84), P('Kennet Andersson', 'DEL', 11, 80),
    ]},
    { id: 'bul1994', country: 'Bulgaria', year: 1994, flag: '🇧🇬', result: '4to lugar', players: [
      P('Borislav Mihaylov', 'POR', 1, 80), P('Trifon Ivanov', 'DEF', 5, 80), P('Petar Hubchev', 'DEF', 4, 76),
      P('Ivailo Yordanov', 'DEF', 3, 74), P('Tsanko Tsvetanov', 'DEF', 2, 74), P('Krasimir Balakov', 'MED', 10, 86),
      P('Yordan Lechkov', 'MED', 15, 82), P('Zlatko Yankov', 'MED', 6, 78), P('Hristo Stoichkov', 'DEL', 8, 92),
      P('Emil Kostadinov', 'DEL', 11, 84), P('Nasko Sirakov', 'DEL', 20, 78),
    ]},
    { id: 'sen2002', country: 'Senegal', year: 2002, flag: '🇸🇳', result: 'Cuartos de final', players: [
      P('Tony Sylva', 'POR', 16, 80), P('Lamine Diatta', 'DEF', 5, 78), P('Ferdinand Coly', 'DEF', 2, 76),
      P('Omar Daf', 'DEF', 3, 76), P('Alassane N\'Diaye', 'DEF', 4, 74), P('Aliou Cissé', 'MED', 6, 79),
      P('Khalilou Fadiga', 'MED', 8, 82), P('Salif Diao', 'MED', 15, 78), P('El Hadji Diouf', 'DEL', 11, 86),
      P('Papa Bouba Diop', 'DEL', 19, 82), P('Henri Camara', 'DEL', 21, 80),
    ]},
    { id: 'usa2002', country: 'Estados Unidos', year: 2002, flag: '🇺🇸', result: 'Cuartos de final', players: [
      P('Brad Friedel', 'POR', 1, 84), P('Eddie Pope', 'DEF', 4, 77), P('Tony Sanneh', 'DEF', 20, 75),
      P('Frankie Hejduk', 'DEF', 3, 75), P('Jeff Agoos', 'DEF', 2, 74), P('Claudio Reyna', 'MED', 6, 82),
      P('DaMarcus Beasley', 'MED', 17, 78), P('Pablo Mastroeni', 'MED', 15, 76), P('Landon Donovan', 'DEL', 19, 84),
      P('Brian McBride', 'DEL', 20, 80), P('Josh Wolff', 'DEL', 16, 76),
    ]},
    { id: 'jpn2002', country: 'Japón', year: 2002, flag: '🇯🇵', result: 'Octavos de final', players: [
      P('Yoshikatsu Kawaguchi', 'POR', 21, 79), P('Tsuneyasu Miyamoto', 'DEF', 3, 78), P('Naoki Matsuda', 'DEF', 22, 75),
      P('Ryuzo Morioka', 'DEF', 4, 74), P('Koji Nakata', 'DEF', 5, 76), P('Hidetoshi Nakata', 'MED', 7, 88),
      P('Junichi Inamoto', 'MED', 16, 79), P('Shinji Ono', 'MED', 8, 80), P('Naohiro Takahara', 'DEL', 20, 76),
      P('Akinori Nishizawa', 'DEL', 11, 76), P('Atsushi Yanagisawa', 'DEL', 13, 75),
    ]},
    { id: 'por2006', country: 'Portugal', year: 2006, flag: '🇵🇹', result: '4to lugar', players: [
      P('Ricardo', 'POR', 1, 83), P('Ricardo Carvalho', 'DEF', 3, 86), P('Paulo Ferreira', 'DEF', 2, 80),
      P('Fernando Meira', 'DEF', 15, 79), P('Nuno Valente', 'DEF', 6, 78), P('Costinha', 'MED', 17, 80),
      P('Maniche', 'MED', 8, 83), P('Deco', 'MED', 10, 88), P('Luís Figo', 'DEL', 7, 89),
      P('Cristiano Ronaldo', 'DEL', 17, 88), P('Pauleta', 'DEL', 9, 82),
    ]},
    { id: 'aus2006', country: 'Australia', year: 2006, flag: '🇦🇺', result: 'Octavos de final', players: [
      P('Mark Schwarzer', 'POR', 1, 84), P('Lucas Neill', 'DEF', 2, 80), P('Craig Moore', 'DEF', 5, 78),
      P('Scott Chipperfield', 'DEF', 3, 75), P('Tony Vidmar', 'DEF', 15, 74), P('Tim Cahill', 'MED', 17, 84),
      P('Marco Bresciano', 'MED', 4, 79), P('Vince Grella', 'MED', 6, 78), P('Mark Viduka', 'DEL', 11, 84),
      P('Harry Kewell', 'DEL', 21, 85), P('John Aloisi', 'DEL', 10, 78),
    ]},
    { id: 'gha2010', country: 'Ghana', year: 2010, flag: '🇬🇭', result: 'Cuartos de final', players: [
      P('Richard Kingson', 'POR', 16, 80), P('John Mensah', 'DEF', 5, 80), P('Jonathan Mensah', 'DEF', 20, 76),
      P('Isaac Vorsah', 'DEF', 4, 74), P('Hans Sarpei', 'DEF', 2, 75), P('Kevin-Prince Boateng', 'MED', 23, 82),
      P('Sulley Muntari', 'MED', 8, 81), P('Anthony Annan', 'MED', 15, 76), P('Asamoah Gyan', 'DEL', 3, 85),
      P('André Ayew', 'DEL', 10, 80), P('Dominic Adiyiah', 'DEL', 19, 76),
    ]},

    // ---- Lote 4 (+15 selecciones, +165 jugadores) ----
    { id: 'esp1982', country: 'España', year: 1982, flag: '🇪🇸', result: 'Segunda fase', players: [
      P('Luis Arconada', 'POR', 1, 84), P('José Antonio Camacho', 'DEF', 3, 82), P('José Ramón Alexanko', 'DEF', 5, 78),
      P('Miguel Tendillo', 'DEF', 4, 75), P('Rafael Gordillo', 'DEF', 11, 81), P('Jesús María Zamora', 'MED', 8, 76),
      P('Miguel Alonso', 'MED', 6, 74), P('Roberto López Ufarte', 'MED', 16, 75), P('Juanito', 'DEL', 7, 82),
      P('Jesús María Satrústegui', 'DEL', 9, 76), P('Francisco José Carrasco', 'DEL', 20, 77),
    ]},
    { id: 'esp1994', country: 'España', year: 1994, flag: '🇪🇸', result: 'Cuartos de final', players: [
      P('Andoni Zubizarreta', 'POR', 1, 85), P('Albert Ferrer', 'DEF', 2, 78), P('Abelardo Fernández', 'DEF', 5, 79),
      P('Fernando Hierro', 'DEF', 4, 86), P('Sergi Barjuán', 'DEF', 3, 77), P('Josep Guardiola', 'MED', 6, 87),
      P('Miguel Ángel Nadal', 'MED', 14, 79), P('Luis Enrique', 'MED', 8, 83), P('José Luis Caminero', 'DEL', 18, 82),
      P('Julio Salinas', 'DEL', 9, 80), P('José María Bakero', 'DEL', 7, 81),
    ]},
    { id: 'mex1998', country: 'México', year: 1998, flag: '🇲🇽', result: 'Octavos de final', players: [
      P('Jorge Campos', 'POR', 1, 83), P('Claudio Suárez', 'DEF', 4, 80), P('Duilio Davino', 'DEF', 3, 75),
      P('Jesús Arellano', 'DEF', 16, 73), P('Gerardo Torrado', 'DEF', 6, 74), P('Pável Pardo', 'MED', 5, 78),
      P('Ramón Ramírez', 'MED', 10, 79), P('Alberto García Aspe', 'MED', 7, 80), P('Cuauhtémoc Blanco', 'DEL', 9, 84),
      P('Luis Hernández', 'DEL', 18, 82), P('Ricardo Peláez', 'DEL', 11, 75),
    ]},
    { id: 'bel1986', country: 'Bélgica', year: 1986, flag: '🇧🇪', result: '4to lugar', players: [
      P('Jean-Marie Pfaff', 'POR', 1, 84), P('Eric Gerets', 'DEF', 2, 82), P('Michel Renquin', 'DEF', 4, 75),
      P('Stéphane Demol', 'DEF', 5, 74), P('Georges Grün', 'DEF', 3, 77), P('Franky Vercauteren', 'MED', 8, 78),
      P('Enzo Scifo', 'MED', 19, 85), P('Patrick Vervoort', 'MED', 12, 77), P('Jan Ceulemans', 'DEL', 10, 84),
      P('Erwin Vandenbergh', 'DEL', 9, 79), P('Nico Claesen', 'DEL', 20, 77),
    ]},
    { id: 'crc2014', country: 'Costa Rica', year: 2014, flag: '🇨🇷', result: 'Cuartos de final', players: [
      P('Keylor Navas', 'POR', 1, 85), P('Cristian Gamboa', 'DEF', 2, 74), P('Giancarlo González', 'DEF', 3, 78),
      P('Óscar Duarte', 'DEF', 15, 77), P('Junior Díaz', 'DEF', 16, 74), P('Celso Borges', 'MED', 5, 78),
      P('Yeltsin Tejeda', 'MED', 6, 74), P('Christian Bolaños', 'MED', 21, 76), P('Bryan Ruiz', 'DEL', 10, 82),
      P('Joel Campbell', 'DEL', 12, 80), P('Marco Ureña', 'DEL', 22, 75),
    ]},
    { id: 'egy2018', country: 'Egipto', year: 2018, flag: '🇪🇬', result: 'Fase de grupos', players: [
      P('Essam El-Hadary', 'POR', 1, 83), P('Ahmed Fathy', 'DEF', 5, 77), P('Ahmed Hegazi', 'DEF', 4, 78),
      P('Ali Gabr', 'DEF', 13, 74), P('Mohamed Abdel-Shafy', 'DEF', 22, 74), P('Mohamed Elneny', 'MED', 17, 79),
      P('Tarek Hamed', 'MED', 6, 74), P('Abdallah El Said', 'MED', 8, 76), P('Mohamed Salah', 'DEL', 10, 89),
      P('Marwan Mohsen', 'DEL', 16, 74), P('Trezeguet (Mahmoud Hassan)', 'DEL', 7, 78),
    ]},
    { id: 'ksa2022', country: 'Arabia Saudita', year: 2022, flag: '🇸🇦', result: 'Fase de grupos', players: [
      P('Mohammed Al-Owais', 'POR', 21, 79), P('Yasser Al-Shahrani', 'DEF', 13, 76), P('Ali Al-Bulaihi', 'DEF', 5, 74),
      P('Abdulelah Al-Amri', 'DEF', 4, 73), P('Saud Abdulhamid', 'DEF', 2, 73), P('Salman Al-Faraj', 'MED', 7, 78),
      P('Mohamed Kanno', 'MED', 17, 77), P('Abdulelah Al-Malki', 'MED', 8, 74), P('Salem Al-Dawsari', 'DEL', 10, 82),
      P('Saleh Al-Shehri', 'DEL', 11, 78), P('Firas Al-Buraikan', 'DEL', 9, 76),
    ]},
    { id: 'rus2018', country: 'Rusia', year: 2018, flag: '🇷🇺', result: 'Cuartos de final', players: [
      P('Igor Akinfeev', 'POR', 1, 84), P('Sergei Ignashevich', 'DEF', 4, 77), P('Ilya Kutepov', 'DEF', 14, 74),
      P('Mário Fernandes', 'DEF', 2, 76), P('Yuri Zhirkov', 'DEF', 18, 76), P('Roman Zobnin', 'MED', 11, 74),
      P('Alan Dzagoev', 'MED', 17, 76), P('Aleksandr Golovin', 'MED', 8, 82), P('Denis Cheryshev', 'DEL', 6, 79),
      P('Artem Dzyuba', 'DEL', 22, 80), P('Fyodor Smolov', 'DEL', 9, 77),
    ]},
    { id: 'rsa2010', country: 'Sudáfrica', year: 2010, flag: '🇿🇦', result: 'Fase de grupos', players: [
      P('Itumeleng Khune', 'POR', 16, 78), P('Aaron Mokoena', 'DEF', 5, 76), P('Siyabonga Sangweni', 'DEF', 2, 73),
      P('Bongani Khumalo', 'DEF', 6, 74), P('Tsepo Masilela', 'DEF', 3, 72), P('Kagisho Dikgacoi', 'MED', 4, 73),
      P('Steven Pienaar', 'MED', 17, 80), P('MacBeth Sibaya', 'MED', 14, 74), P('Katlego Mphela', 'DEL', 19, 76),
      P('Bernard Parker', 'DEL', 18, 75), P('Siphiwe Tshabalala', 'DEL', 11, 78),
    ]},
    { id: 'qat2022', country: 'Catar', year: 2022, flag: '🇶🇦', result: 'Fase de grupos', players: [
      P('Saad Al-Sheeb', 'POR', 1, 74), P('Bassam Al-Rawi', 'DEF', 18, 71), P('Musaab Khidir', 'DEF', 2, 71),
      P('Tarek Salman', 'DEF', 5, 72), P('Homam Ahmed', 'DEF', 12, 70), P('Karim Boudiaf', 'MED', 6, 73),
      P('Abdulaziz Hatem', 'MED', 8, 73), P('Assim Madibo', 'MED', 25, 71), P('Almoez Ali', 'DEL', 19, 78),
      P('Akram Afif', 'DEL', 7, 79), P('Hassan Al-Haydos', 'DEL', 10, 76),
    ]},
    { id: 'usa1994', country: 'Estados Unidos', year: 1994, flag: '🇺🇸', result: 'Octavos de final', players: [
      P('Tony Meola', 'POR', 1, 80), P('Alexi Lalas', 'DEF', 2, 76), P('Marcelo Balboa', 'DEF', 15, 77),
      P('Fernando Clavijo', 'DEF', 5, 73), P('Cle Kooiman', 'DEF', 4, 72), P('John Harkes', 'MED', 6, 78),
      P('Tab Ramos', 'MED', 10, 80), P('Thomas Dooley', 'MED', 8, 77), P('Eric Wynalda', 'DEL', 11, 79),
      P('Ernie Stewart', 'DEL', 20, 76), P('Roy Wegerle', 'DEL', 14, 74),
    ]},
    { id: 'den1998', country: 'Dinamarca', year: 1998, flag: '🇩🇰', result: 'Cuartos de final', players: [
      P('Peter Schmeichel', 'POR', 1, 88), P('Jes Høgh', 'DEF', 5, 74), P('Marc Rieper', 'DEF', 4, 76),
      P('Jan Heintze', 'DEF', 3, 77), P('Thomas Helveg', 'DEF', 2, 76), P('Stig Tøfting', 'MED', 6, 76),
      P('Brian Laudrup', 'MED', 18, 85), P('Allan Nielsen', 'MED', 14, 75), P('Michael Laudrup', 'DEL', 7, 87),
      P('Ebbe Sand', 'DEL', 20, 79), P('Peter Møller', 'DEL', 11, 76),
    ]},
    { id: 'par2010', country: 'Paraguay', year: 2010, flag: '🇵🇾', result: 'Cuartos de final', players: [
      P('Justo Villar', 'POR', 1, 80), P('Paulo da Silva', 'DEF', 4, 76), P('Antolín Alcaraz', 'DEF', 6, 76),
      P('Julio César Cáceres', 'DEF', 2, 74), P('Dennis Caniza', 'DEF', 15, 73), P('Enrique Vera', 'MED', 17, 75),
      P('Cristian Riveros', 'MED', 8, 77), P('Víctor Cáceres', 'MED', 14, 75), P('Nelson Haedo Valdez', 'DEL', 19, 77),
      P('Lucas Barrios', 'DEL', 9, 76), P('Óscar Cardozo', 'DEL', 11, 78),
    ]},
    { id: 'civ2006', country: 'Costa de Marfil', year: 2006, flag: '🇨🇮', result: 'Fase de grupos', players: [
      P('Jean-Jacques Tizié', 'POR', 16, 76), P('Kolo Touré', 'DEF', 5, 82), P('Marc Zoro', 'DEF', 3, 74),
      P('Cyril Domoraud', 'DEF', 2, 73), P('Arthur Boka', 'DEF', 17, 75), P('Yaya Touré', 'MED', 4, 83),
      P('Didier Zokora', 'MED', 6, 79), P('Emmanuel Eboué', 'MED', 22, 76), P('Didier Drogba', 'DEL', 11, 88),
      P('Aruna Dindane', 'DEL', 9, 78), P('Bonaventure Kalou', 'DEL', 19, 76),
    ]},
    { id: 'chi2010', country: 'Chile', year: 2010, flag: '🇨🇱', result: 'Octavos de final', players: [
      P('Claudio Bravo', 'POR', 1, 82), P('Mauricio Isla', 'DEF', 13, 78), P('Gonzalo Jara', 'DEF', 2, 74),
      P('Waldo Ponce', 'DEF', 4, 74), P('Jean Beausejour', 'DEF', 15, 76), P('Arturo Vidal', 'MED', 8, 84),
      P('Carlos Carmona', 'MED', 6, 73), P('Jorge Valdivia', 'MED', 20, 79), P('Alexis Sánchez', 'DEL', 7, 85),
      P('Humberto Suazo', 'DEL', 11, 79), P('Mark González', 'DEL', 17, 76),
    ]},

    // ---- Lote 5 (+15 selecciones, +165 jugadores) ----
    { id: 'ita1994', country: 'Italia', year: 1994, flag: '🇮🇹', result: 'Subcampeón', players: [
      P('Gianluca Pagliuca', 'POR', 1, 82), P('Franco Baresi', 'DEF', 6, 88), P('Paolo Maldini', 'DEF', 3, 90),
      P('Alessandro Costacurta', 'DEF', 5, 82), P('Antonio Benarrivo', 'DEF', 13, 76), P('Demetrio Albertini', 'MED', 4, 82),
      P('Dino Baggio', 'MED', 8, 79), P('Roberto Donadoni', 'MED', 7, 81), P('Roberto Baggio', 'DEL', 10, 91),
      P('Giuseppe Signori', 'DEL', 9, 82), P('Daniele Massaro', 'DEL', 18, 78),
    ]},
    { id: 'arg1994', country: 'Argentina', year: 1994, flag: '🇦🇷', result: 'Octavos de final', players: [
      P('Luis Islas', 'POR', 1, 78), P('Fernando Cáceres', 'DEF', 4, 76), P('Néstor Sensini', 'DEF', 2, 76),
      P('José Chamot', 'DEF', 17, 75), P('Sergio Vázquez', 'DEF', 3, 74), P('Diego Simeone', 'MED', 14, 82),
      P('Rodolfo Cardoso', 'MED', 18, 76), P('Diego Maradona', 'DEL', 10, 92), P('Gabriel Batistuta', 'DEL', 9, 88),
      P('Claudio Caniggia', 'DEL', 7, 85), P('Abel Balbo', 'DEL', 15, 78),
    ]},
    { id: 'bra1986', country: 'Brasil', year: 1986, flag: '🇧🇷', result: 'Cuartos de final', players: [
      P('Carlos', 'POR', 1, 76), P('Josimar', 'DEF', 2, 82), P('Edinho', 'DEF', 4, 76),
      P('Júlio César', 'DEF', 3, 76), P('Branco', 'DEF', 6, 80), P('Alemão', 'MED', 5, 78),
      P('Sócrates', 'MED', 8, 87), P('Zico', 'MED', 10, 88), P('Careca', 'DEL', 9, 84),
      P('Müller', 'DEL', 11, 79), P('Casagrande', 'DEL', 7, 78),
    ]},
    { id: 'eng2002', country: 'Inglaterra', year: 2002, flag: '🏴', result: 'Cuartos de final', players: [
      P('David Seaman', 'POR', 1, 82), P('Sol Campbell', 'DEF', 6, 84), P('Rio Ferdinand', 'DEF', 5, 83),
      P('Ashley Cole', 'DEF', 3, 81), P('Danny Mills', 'DEF', 2, 74), P('David Beckham', 'MED', 7, 87),
      P('Paul Scholes', 'MED', 18, 85), P('Nicky Butt', 'MED', 8, 76), P('Michael Owen', 'DEL', 10, 86),
      P('Emile Heskey', 'DEL', 9, 79), P('Teddy Sheringham', 'DEL', 11, 80),
    ]},
    { id: 'chi2014', country: 'Chile', year: 2014, flag: '🇨🇱', result: 'Octavos de final', players: [
      P('Claudio Bravo', 'POR', 1, 83), P('Mauricio Isla', 'DEF', 4, 79), P('Gonzalo Jara', 'DEF', 20, 75),
      P('Gary Medel', 'DEF', 17, 82), P('Eugenio Mena', 'DEF', 3, 74), P('Marcelo Díaz', 'MED', 16, 76),
      P('Arturo Vidal', 'MED', 8, 87), P('Charles Aránguiz', 'MED', 6, 79), P('Alexis Sánchez', 'DEL', 7, 88),
      P('Eduardo Vargas', 'DEL', 11, 80), P('Jorge Valdivia', 'DEL', 18, 79),
    ]},
    { id: 'col2018', country: 'Colombia', year: 2018, flag: '🇨🇴', result: 'Octavos de final', players: [
      P('David Ospina', 'POR', 1, 80), P('Santiago Arias', 'DEF', 17, 76), P('Dávinson Sánchez', 'DEF', 3, 78),
      P('Yerry Mina', 'DEF', 13, 78), P('Cristián Zapata', 'DEF', 2, 76), P('Carlos Sánchez', 'MED', 5, 74),
      P('Wilmar Barrios', 'MED', 15, 76), P('James Rodríguez', 'MED', 10, 88), P('Radamel Falcao', 'DEL', 9, 83),
      P('Juan Cuadrado', 'DEL', 11, 81), P('Juan Fernando Quintero', 'DEL', 19, 79),
    ]},
    { id: 'uru2018', country: 'Uruguay', year: 2018, flag: '🇺🇾', result: 'Cuartos de final', players: [
      P('Fernando Muslera', 'POR', 1, 83), P('Diego Godín', 'DEF', 3, 87), P('José María Giménez', 'DEF', 2, 82),
      P('Martín Cáceres', 'DEF', 4, 76), P('Diego Laxalt', 'DEF', 17, 74), P('Matías Vecino', 'MED', 8, 76),
      P('Rodrigo Bentancur', 'MED', 15, 78), P('Lucas Torreira', 'MED', 6, 80), P('Edinson Cavani', 'DEL', 21, 87),
      P('Luis Suárez', 'DEL', 9, 88), P('Giorgian De Arrascaeta', 'DEL', 7, 79),
    ]},
    { id: 'bel2014', country: 'Bélgica', year: 2014, flag: '🇧🇪', result: 'Cuartos de final', players: [
      P('Thibaut Courtois', 'POR', 1, 87), P('Vincent Kompany', 'DEF', 4, 87), P('Toby Alderweireld', 'DEF', 2, 82),
      P('Jan Vertonghen', 'DEF', 5, 84), P('Daniel Van Buyten', 'DEF', 6, 78), P('Axel Witsel', 'MED', 8, 83),
      P('Marouane Fellaini', 'MED', 15, 78), P('Kevin De Bruyne', 'MED', 7, 88), P('Eden Hazard', 'DEL', 10, 90),
      P('Romelu Lukaku', 'DEL', 9, 84), P('Dries Mertens', 'DEL', 14, 80),
    ]},
    { id: 'mar2018', country: 'Marruecos', year: 2018, flag: '🇲🇦', result: 'Fase de grupos', players: [
      P('Munir Mohamedi', 'POR', 1, 76), P('Achraf Hakimi', 'DEF', 2, 82), P('Medhi Benatia', 'DEF', 5, 82),
      P('Romain Saïss', 'DEF', 6, 78), P('Nabil Dirar', 'DEF', 19, 77), P('Karim El Ahmadi', 'MED', 8, 78),
      P('Younès Belhanda', 'MED', 17, 80), P('Amine Harit', 'MED', 7, 78), P('Khalid Boutaïb', 'DEL', 9, 74),
      P('Nordin Amrabat', 'DEL', 11, 76), P('Ayoub El Kaabi', 'DEL', 20, 73),
    ]},
    { id: 'sen2018', country: 'Senegal', year: 2018, flag: '🇸🇳', result: 'Fase de grupos', players: [
      P('Khadim Ndiaye', 'POR', 16, 75), P('Kalidou Koulibaly', 'DEF', 3, 85), P('Youssouf Sabaly', 'DEF', 2, 74),
      P('Kara Mbodji', 'DEF', 5, 76), P('Moussa Wagué', 'DEF', 22, 73), P('Idrissa Gana Gueye', 'MED', 27, 82),
      P('Cheikhou Kouyaté', 'MED', 8, 78), P('Badou Ndiaye', 'MED', 17, 76), P('Sadio Mané', 'DEL', 10, 88),
      P('M\'Baye Niang', 'DEL', 19, 77), P('Ismaïla Sarr', 'DEL', 23, 78),
    ]},
    { id: 'ecu2006', country: 'Ecuador', year: 2006, flag: '🇪🇨', result: 'Octavos de final', players: [
      P('José Francisco Cevallos', 'POR', 1, 77), P('Iván Hurtado', 'DEF', 2, 80), P('Néicer Reasco', 'DEF', 17, 74),
      P('Ulises de la Cruz', 'DEF', 3, 78), P('Giovanny Espinoza', 'DEF', 6, 73), P('Édison Méndez', 'MED', 16, 78),
      P('Luis Antonio Valencia', 'MED', 7, 80), P('Segundo Castillo', 'MED', 19, 74), P('Agustín Delgado', 'DEL', 18, 79),
      P('Carlos Tenorio', 'DEL', 11, 76), P('Iván Kaviedes', 'DEL', 9, 75),
    ]},
    { id: 'jpn2010', country: 'Japón', year: 2010, flag: '🇯🇵', result: 'Octavos de final', players: [
      P('Eiji Kawashima', 'POR', 1, 79), P('Yuichi Komano', 'DEF', 5, 74), P('Marcus Tulio Tanaka', 'DEF', 22, 76),
      P('Yuji Nakazawa', 'DEF', 3, 77), P('Yasuyuki Konno', 'DEF', 4, 73), P('Yasuhito Endo', 'MED', 7, 82),
      P('Makoto Hasebe', 'MED', 17, 79), P('Keisuke Honda', 'MED', 18, 84), P('Shinji Okazaki', 'DEL', 13, 78),
      P('Daisuke Matsui', 'DEL', 10, 76), P('Yoshito Okubo', 'DEL', 9, 74),
    ]},
    { id: 'kor2010', country: 'Corea del Sur', year: 2010, flag: '🇰🇷', result: 'Octavos de final', players: [
      P('Jung Sung-ryong', 'POR', 21, 78), P('Cha Du-ri', 'DEF', 22, 76), P('Lee Jung-soo', 'DEF', 6, 76),
      P('Cho Yong-hyung', 'DEF', 20, 74), P('Kang Min-soo', 'DEF', 17, 73), P('Ki Sung-yueng', 'MED', 16, 80),
      P('Kim Jung-woo', 'MED', 13, 75), P('Park Ji-sung', 'MED', 7, 85), P('Park Chu-young', 'DEL', 9, 79),
      P('Lee Chung-yong', 'DEL', 12, 78), P('Yeom Ki-hun', 'DEL', 18, 75),
    ]},
    { id: 'sco1974', country: 'Escocia', year: 1974, flag: '🏴', result: 'Fase de grupos', players: [
      P('David Harvey', 'POR', 1, 78), P('Danny McGrain', 'DEF', 2, 80), P('Jim Holton', 'DEF', 5, 75),
      P('Martin Buchan', 'DEF', 6, 77), P('Sandy Jardine', 'DEF', 3, 76), P('Billy Bremner', 'MED', 7, 84),
      P('Willie Morgan', 'MED', 11, 76), P('Kenny Dalglish', 'DEL', 10, 84), P('Denis Law', 'DEL', 9, 82),
      P('Joe Jordan', 'DEL', 8, 80), P('Peter Lorimer', 'DEL', 16, 79),
    ]},
    { id: 'sui2006', country: 'Suiza', year: 2006, flag: '🇨🇭', result: 'Octavos de final', players: [
      P('Pascal Zuberbühler', 'POR', 1, 82), P('Philippe Senderos', 'DEF', 4, 79), P('Stéphane Grichting', 'DEF', 15, 74),
      P('Ludovic Magnin', 'DEF', 3, 75), P('Patrick Müller', 'DEF', 13, 76), P('Johann Vogel', 'MED', 6, 79),
      P('Raphael Wicky', 'MED', 8, 76), P('Tranquillo Barnetta', 'MED', 16, 78), P('Alexander Frei', 'DEL', 10, 84),
      P('Hakan Yakin', 'DEL', 7, 79), P('Marco Streller', 'DEL', 23, 76),
    ]},

    // ---- Lote 6 (+15 selecciones, +165 jugadores) ----
    { id: 'mex1970', country: 'México', year: 1970, flag: '🇲🇽', result: 'Cuartos de final', players: [
      P('Ignacio Calderón', 'POR', 1, 78), P('Gustavo Peña', 'DEF', 4, 76), P('Javier Guzmán', 'DEF', 2, 73),
      P('Mario Pérez', 'DEF', 5, 72), P('Prudencio López', 'DEF', 3, 71), P('Horacio López Salgado', 'MED', 6, 74),
      P('José Luis González', 'MED', 8, 73), P('Enrique Borja', 'DEL', 9, 78), P('Aaron Padilla', 'DEL', 7, 73),
      P('Juan Basaguren', 'DEL', 11, 72), P('Javier Valdivia', 'MED', 14, 71),
    ]},
    { id: 'aut1954', country: 'Austria', year: 1954, flag: '🇦🇹', result: '3er lugar', players: [
      P('Kurt Schmied', 'POR', 1, 78), P('Ernst Happel', 'DEF', 3, 82), P('Gerhard Hanappi', 'DEF', 4, 79),
      P('Robert Körner', 'DEF', 2, 74), P('Ernst Ocwirk', 'MED', 5, 85), P('Erich Probst', 'MED', 6, 79),
      P('Walter Kollmann', 'MED', 7, 73), P('Theodor Wagner', 'DEL', 9, 82), P('Alfred Körner', 'DEL', 11, 77),
      P('Robert Dienst', 'DEL', 16, 78), P('Ernst Stojaspal', 'DEL', 8, 76),
    ]},
    { id: 'irn1998', country: 'Irán', year: 1998, flag: '🇮🇷', result: 'Fase de grupos', players: [
      P('Ahmad Abedzadeh', 'POR', 1, 78), P('Mohammad Khakpour', 'DEF', 4, 74), P('Naeem Saadavi', 'DEF', 3, 73),
      P('Javad Zarincheh', 'DEF', 5, 73), P('Afshin Peyrovani', 'DEF', 2, 71), P('Karim Bagheri', 'MED', 8, 78),
      P('Mehdi Mahdavikia', 'MED', 7, 76), P('Hamid Estili', 'MED', 20, 76), P('Ali Daei', 'DEL', 9, 85),
      P('Khodadad Azizi', 'DEL', 10, 79), P('Ali Reza Mansourian', 'DEL', 11, 73),
    ]},
    { id: 'ukr2006', country: 'Ucrania', year: 2006, flag: '🇺🇦', result: 'Cuartos de final', players: [
      P('Oleksandr Shovkovskyi', 'POR', 1, 80), P('Vladyslav Vashchuk', 'DEF', 4, 76), P('Andriy Nesmachniy', 'DEF', 24, 73),
      P('Oleksandr Sviderskyi', 'DEF', 14, 72), P('Anatoliy Tymoshchuk', 'MED', 5, 82), P('Vasyl Kobin', 'MED', 6, 73),
      P('Oleh Husyev', 'MED', 7, 77), P('Ruslan Rotan', 'MED', 17, 75), P('Andriy Shevchenko', 'DEL', 20, 88),
      P('Andriy Voronin', 'DEL', 11, 78), P('Serhiy Rebrov', 'DEL', 9, 77),
    ]},
    { id: 'alg1982', country: 'Argelia', year: 1982, flag: '🇩🇿', result: 'Fase de grupos', players: [
      P('Mehdi Cerbah', 'POR', 1, 77), P('Chaâbane Merzekane', 'DEF', 2, 73), P('Nourredine Kourichi', 'DEF', 5, 75),
      P('Mohamed Chaïb', 'DEF', 3, 71), P('Mahmoud Guendouz', 'DEF', 6, 72), P('Mustapha Dahleb', 'MED', 10, 82),
      P('Ali Fergani', 'MED', 8, 78), P('Lakhdar Belloumi', 'DEL', 7, 84), P('Rabah Madjer', 'DEL', 9, 80),
      P('Salah Assad', 'DEL', 11, 78), P('Tedj Bensaoula', 'DEL', 17, 75),
    ]},
    { id: 'alg2014', country: 'Argelia', year: 2014, flag: '🇩🇿', result: 'Octavos de final', players: [
      P('Raïs M\'Bolhi', 'POR', 16, 76), P('Faouzi Ghoulam', 'DEF', 3, 76), P('Rafik Halliche', 'DEF', 5, 74),
      P('Djamel Mesbah', 'DEF', 13, 72), P('Essaïd Belkalem', 'DEF', 21, 72), P('Saphir Taïder', 'MED', 8, 74),
      P('Sofiane Feghouli', 'MED', 18, 76), P('Yacine Brahimi', 'MED', 10, 80), P('Islam Slimani', 'DEL', 14, 78),
      P('Riyad Mahrez', 'DEL', 7, 79), P('El Arbi Hillel Soudani', 'DEL', 9, 74),
    ]},
    { id: 'can2022', country: 'Canadá', year: 2022, flag: '🇨🇦', result: 'Fase de grupos', players: [
      P('Milan Borjan', 'POR', 18, 76), P('Alistair Johnston', 'DEF', 2, 74), P('Kamal Miller', 'DEF', 15, 73),
      P('Sam Adekugbe', 'DEF', 19, 73), P('Richie Laryea', 'DEF', 22, 73), P('Stephen Eustáquio', 'MED', 7, 76),
      P('Atiba Hutchinson', 'MED', 4, 78), P('Jonathan Osorio', 'MED', 21, 74), P('Alphonso Davies', 'DEL', 12, 82),
      P('Jonathan David', 'DEL', 20, 82), P('Cyle Larin', 'DEL', 17, 75),
    ]},
    { id: 'srb2010', country: 'Serbia', year: 2010, flag: '🇷🇸', result: 'Fase de grupos', players: [
      P('Vladimir Stojković', 'POR', 1, 76), P('Branislav Ivanović', 'DEF', 2, 82), P('Nemanja Vidić', 'DEF', 3, 86),
      P('Neven Subotić', 'DEF', 15, 76), P('Aleksandar Kolarov', 'DEF', 5, 79), P('Zdravko Kuzmanović', 'MED', 23, 74),
      P('Nenad Milijaš', 'MED', 10, 75), P('Dejan Stanković', 'MED', 11, 82), P('Marko Pantelić', 'DEL', 9, 74),
      P('Milan Jovanović', 'DEL', 17, 76), P('Danko Lazović', 'DEL', 8, 74),
    ]},
    { id: 'svn2010', country: 'Eslovenia', year: 2010, flag: '🇸🇮', result: 'Fase de grupos', players: [
      P('Samir Handanović', 'POR', 1, 79), P('Marko Šuler', 'DEF', 5, 73), P('Bostjan Cesar', 'DEF', 4, 74),
      P('Miso Brecko', 'DEF', 2, 73), P('Branko Ilič', 'DEF', 13, 71), P('Robert Koren', 'MED', 8, 76),
      P('Andraž Kirm', 'MED', 18, 73), P('Dalibor Stevanović', 'MED', 6, 72), P('Valter Birsa', 'DEL', 10, 74),
      P('Milivoje Novaković', 'DEL', 9, 76), P('Zlatko Dedič', 'DEL', 16, 73),
    ]},
    { id: 'gha2006', country: 'Ghana', year: 2006, flag: '🇬🇭', result: 'Octavos de final', players: [
      P('Richard Kingson', 'POR', 18, 76), P('John Mensah', 'DEF', 5, 78), P('John Paintsil', 'DEF', 2, 74),
      P('Samuel Kuffour', 'DEF', 13, 78), P('Habib Mohammed', 'DEF', 3, 73), P('Michael Essien', 'MED', 6, 84),
      P('Stephen Appiah', 'MED', 10, 80), P('Sulley Muntari', 'MED', 8, 78), P('Asamoah Gyan', 'DEL', 14, 81),
      P('Matthew Amoah', 'DEL', 19, 75), P('Haminu Draman', 'DEL', 17, 73),
    ]},
    { id: 'civ2010', country: 'Costa de Marfil', year: 2010, flag: '🇨🇮', result: 'Fase de grupos', players: [
      P('Boubacar Barry', 'POR', 16, 76), P('Kolo Touré', 'DEF', 5, 82), P('Guy Demel', 'DEF', 2, 75),
      P('Steve Gohouri', 'DEF', 15, 73), P('Siaka Tiéné', 'DEF', 3, 74), P('Didier Zokora', 'MED', 6, 79),
      P('Yaya Touré', 'MED', 12, 85), P('Cheick Tioté', 'MED', 8, 78), P('Didier Drogba', 'DEL', 11, 89),
      P('Salomon Kalou', 'DEL', 9, 78), P('Gervinho', 'DEL', 21, 77),
    ]},
    { id: 'tun2018', country: 'Túnez', year: 2018, flag: '🇹🇳', result: 'Fase de grupos', players: [
      P('Farouk Ben Mustapha', 'POR', 23, 74), P('Yassine Meriah', 'DEF', 5, 72), P('Rami Bedoui', 'DEF', 13, 73),
      P('Dylan Bronn', 'DEF', 4, 74), P('Ali Maâloul', 'DEF', 19, 74), P('Ellyes Skhiri', 'MED', 14, 76),
      P('Ferjani Sassi', 'MED', 7, 76), P('Naïm Sliti', 'MED', 10, 76), P('Wahbi Khazri', 'DEL', 8, 79),
      P('Anice Badri', 'DEL', 17, 73), P('Taha Yassine Khenissi', 'DEL', 21, 72),
    ]},
    { id: 'cmr1994', country: 'Camerún', year: 1994, flag: '🇨🇲', result: 'Fase de grupos', players: [
      P('Jacques Songo\'o', 'POR', 16, 78), P('Stephen Tataw', 'DEF', 2, 74), P('Rigobert Song', 'DEF', 5, 76),
      P('Emmanuel Kundé', 'DEF', 3, 73), P('André Kana-Biyik', 'DEF', 6, 74), P('Emmanuel Maboang Kessack', 'MED', 8, 72),
      P('Jules Onana', 'MED', 14, 71), P('Emile Mbouh', 'MED', 13, 72), P('Roger Milla', 'DEL', 9, 85),
      P('François Omam-Biyik', 'DEL', 19, 78), P('Louis-Paul Mfede', 'DEL', 11, 72),
    ]},
    { id: 'civ2014', country: 'Costa de Marfil', year: 2014, flag: '🇨🇮', result: 'Fase de grupos', players: [
      P('Boubacar Barry', 'POR', 1, 77), P('Serge Aurier', 'DEF', 22, 76), P('Kolo Touré', 'DEF', 5, 79),
      P('Brice Dja Djédjé', 'DEF', 3, 72), P('Constant Djakpa', 'DEF', 13, 73), P('Yaya Touré', 'MED', 8, 88),
      P('Serey Dié', 'MED', 12, 75), P('Cheick Tioté', 'MED', 4, 79), P('Didier Drogba', 'DEL', 11, 87),
      P('Wilfried Bony', 'DEL', 21, 78), P('Gervinho', 'DEL', 7, 77),
    ]},
    { id: 'nir1982', country: 'Irlanda del Norte', year: 1982, flag: '🇬🇧', result: 'Segunda fase', players: [
      P('Pat Jennings', 'POR', 1, 84), P('Mal Donaghy', 'DEF', 6, 74), P('John McClelland', 'DEF', 5, 74),
      P('Jimmy Nicholl', 'DEF', 2, 75), P('John O\'Neill', 'DEF', 4, 72), P('Sammy McIlroy', 'MED', 7, 77),
      P('Martin O\'Neill', 'MED', 10, 78), P('David McCreery', 'MED', 15, 71), P('Gerry Armstrong', 'DEL', 9, 79),
      P('Billy Hamilton', 'DEL', 14, 74), P('Norman Whiteside', 'DEL', 17, 78),
    ]},

    // ---- Lote 7 (+10 selecciones, +110 jugadores) ----
    { id: 'zai1974', country: 'Zaire', year: 1974, flag: '🇨🇩', result: 'Fase de grupos', players: [
      P('Kazadi Mwamba', 'POR', 1, 70), P('Mwepu Ilunga', 'DEF', 2, 71), P('Mwanza Mukombo', 'DEF', 3, 70),
      P('Bwanga Tshimen', 'DEF', 4, 69), P('Lobilo Boba', 'DEF', 5, 68), P('Kilasu Massamba', 'MED', 6, 68),
      P('Tshinabu Wa Munda', 'MED', 7, 69), P('Kidumu Mantantu', 'MED', 10, 74), P('Kembo Uba Kembo', 'DEL', 9, 73),
      P('Ndaye Mulamba', 'DEL', 13, 76), P('Mayanga Maku', 'DEL', 14, 72),
    ]},
    { id: 'hai1974', country: 'Haití', year: 1974, flag: '🇭🇹', result: 'Fase de grupos', players: [
      P('Henri Françillon', 'POR', 1, 70), P('Arsène Auguste', 'DEF', 3, 71), P('Fritz André', 'DEF', 4, 69),
      P('Serge Ducosté', 'DEF', 5, 68), P('Wilner Nazaire', 'DEF', 14, 73), P('Philippe Vorbe', 'MED', 7, 74),
      P('Jean-Claude Désir', 'MED', 8, 71), P('Guy François', 'MED', 10, 70), P('Emmanuel Sanon', 'DEL', 20, 81),
      P('Guy Saint-Vil', 'DEL', 11, 74), P('Eddy Antoine', 'DEL', 9, 71),
    ]},
    { id: 'kuw1982', country: 'Kuwait', year: 1982, flag: '🇰🇼', result: 'Fase de grupos', players: [
      P('Ahmed Al-Tarabulsi', 'POR', 1, 70), P('Naeem Saad', 'DEF', 2, 68), P('Mahboub Juma\'a', 'DEF', 3, 70),
      P('Jamal Al-Qabendi', 'DEF', 4, 69), P('Waleed Al-Jasem', 'DEF', 5, 70), P('Saad Al-Houti', 'MED', 6, 76),
      P('Abdullah Al-Buloushi', 'MED', 8, 72), P('Nassir Al-Ghanem', 'MED', 11, 69), P('Fathi Kameel', 'DEL', 7, 71),
      P('Jasem Yaqoub', 'DEL', 9, 74), P('Abdulaziz Al-Anberi', 'DEL', 10, 72),
    ]},
    { id: 'hon1982', country: 'Honduras', year: 1982, flag: '🇭🇳', result: 'Fase de grupos', players: [
      P('Salomón Nazar', 'POR', 1, 71), P('Efraín Gutiérrez', 'DEF', 2, 70), P('Jaime Villegas', 'DEF', 3, 69),
      P('Fernando Bulnes', 'DEF', 4, 71), P('Anthony Costly', 'DEF', 5, 72), P('Ramón Maradiaga', 'MED', 6, 77),
      P('Francisco Javier Toledo', 'MED', 8, 71), P('David Buezo', 'MED', 11, 70), P('Antonio Laing', 'DEL', 7, 72),
      P('Armando Betancourt', 'DEL', 9, 74), P('Roberto Figueroa', 'DEL', 10, 78),
    ]},
    { id: 'uae1990', country: 'Emiratos Árabes Unidos', year: 1990, flag: '🇦🇪', result: 'Fase de grupos', players: [
      P('Abdullah Musa', 'POR', 1, 71), P('Khalil Ghanim', 'DEF', 2, 70), P('Mubarak Ghanim', 'DEF', 4, 71),
      P('Abdulrahman Mohamed', 'DEF', 6, 69), P('Ibrahim Meer', 'DEF', 15, 70), P('Abdualla Sultan', 'MED', 5, 71),
      P('Khalid Ismail', 'MED', 8, 73), P('Hassan Mohamed', 'MED', 13, 70), P('Fahad Khamees', 'DEL', 7, 78),
      P('Adnan Al Talyani', 'DEL', 10, 80), P('Zuhair Bakheet', 'DEL', 11, 72),
    ]},
    { id: 'rom1990', country: 'Rumania', year: 1990, flag: '🇷🇴', result: 'Octavos de final', players: [
      P('Silviu Lung', 'POR', 1, 82), P('Mircea Rednic', 'DEF', 2, 79), P('Michael Klein', 'DEF', 3, 78),
      P('Ioan Andone', 'DEF', 4, 79), P('Gheorghe Popescu', 'DEF', 6, 85), P('Iosif Rotariu', 'MED', 5, 74),
      P('Ioan Sabău', 'MED', 8, 78), P('Dănuț Lupu', 'MED', 11, 75), P('Marius Lăcătuș', 'DEL', 7, 84),
      P('Gheorghe Hagi', 'DEL', 10, 91), P('Rodion Cămătaru', 'DEL', 9, 78),
    ]},
    { id: 'bol1994', country: 'Bolivia', year: 1994, flag: '🇧🇴', result: 'Fase de grupos', players: [
      P('Carlos Trucco', 'POR', 1, 76), P('Juan Manuel Peña', 'DEF', 2, 76), P('Marco Sandy', 'DEF', 3, 77),
      P('Miguel Rimba', 'DEF', 4, 74), P('Gustavo Quinteros', 'DEF', 5, 76), P('Carlos Borja', 'MED', 6, 78),
      P('José Milton Melgar', 'MED', 8, 75), P('Julio César Baldivieso', 'MED', 22, 79), P('Marco Etcheverry', 'DEL', 10, 86),
      P('Jaime Moreno', 'DEL', 11, 82), P('Erwin Sánchez', 'DEL', 21, 79),
    ]},
    { id: 'mar1994', country: 'Marruecos', year: 1994, flag: '🇲🇦', result: 'Fase de grupos', players: [
      P('Khalil Azmi', 'POR', 1, 76), P('Nacer Abdellah', 'DEF', 2, 74), P('Abdelkrim El Hadrioui', 'DEF', 3, 75),
      P('Noureddine Naybet', 'DEF', 6, 85), P('Smahi Triki', 'DEF', 5, 73), P('Tahar El Khalej', 'MED', 4, 78),
      P('Mustafa El Haddaoui', 'MED', 10, 77), P('Rachid Azzouzi', 'MED', 8, 75), P('Mustapha Hadji', 'DEL', 7, 84),
      P('Mohammed Chaouch', 'DEL', 9, 75), P('Rachid Daoudi', 'DEL', 11, 76),
    ]},
    { id: 'prk1966', country: 'Corea del Norte', year: 1966, flag: '🇰🇵', result: 'Cuartos de final', players: [
      P('Li Chan-myung', 'POR', 1, 74), P('Pak Li-sup', 'DEF', 2, 73), P('Shin Yung-kyoo', 'DEF', 3, 82),
      P('Lim Zoong-sun', 'DEF', 5, 75), P('Oh Yoon-kyung', 'DEF', 13, 74), P('Pak Seung-zin', 'MED', 8, 84),
      P('Im Seung-hwi', 'MED', 6, 76), P('Han Bong-zin', 'MED', 11, 75), P('Pak Doo-ik', 'DEL', 7, 85),
      P('Yang Seung-kook', 'DEL', 15, 79), P('Kang Ryong-woon', 'DEL', 10, 76),
    ]},
    { id: 'nga1998', country: 'Nigeria', year: 1998, flag: '🇳🇬', result: 'Octavos de final', players: [
      P('Peter Rufai', 'POR', 1, 80), P('Celestine Babayaro', 'DEF', 3, 82), P('Uche Okechukwu', 'DEF', 5, 78),
      P('Taribo West', 'DEF', 6, 81), P('Benedict Iroha', 'DEF', 19, 76), P('Finidi George', 'MED', 7, 85),
      P('Mutiu Adepoju', 'MED', 8, 77), P('Jay-Jay Okocha', 'MED', 10, 89), P('Sunday Oliseh', 'MED', 15, 82),
      P('Nwankwo Kanu', 'DEL', 4, 84), P('Daniel Amokachi', 'DEL', 14, 80),
    ]},

    // ---- Lote 8 (+10 selecciones, +110 jugadores) — Mundial 2026 (en curso) ----
    { id: 'arg2026', country: 'Argentina', year: 2026, flag: '🇦🇷', result: 'Cuartos de final', players: [
      P('Emiliano Martínez', 'POR', 23, 90), P('Nahuel Molina', 'DEF', 26, 83), P('Cristian Romero', 'DEF', 13, 87),
      P('Nicolás Otamendi', 'DEF', 19, 82), P('Facundo Medina', 'DEF', 3, 78), P('Rodrigo De Paul', 'MED', 7, 85),
      P('Enzo Fernández', 'MED', 24, 87), P('Alexis Mac Allister', 'MED', 20, 86), P('Thiago Almada', 'DEL', 16, 80),
      P('Lionel Messi', 'DEL', 10, 97), P('Lautaro Martínez', 'DEL', 22, 88),
    ]},
    { id: 'bra2026', country: 'Brasil', year: 2026, flag: '🇧🇷', result: 'Octavos de final', players: [
      P('Alisson Becker', 'POR', 1, 88), P('Danilo', 'DEF', 2, 78), P('Marquinhos', 'DEF', 4, 87),
      P('Gabriel Magalhães', 'DEF', 3, 85), P('Douglas Santos', 'DEF', 6, 79), P('Casemiro', 'MED', 5, 84),
      P('Bruno Guimarães', 'MED', 8, 86), P('Rayan', 'DEL', 19, 76), P('Matheus Cunha', 'DEL', 9, 83),
      P('Gabriel Martinelli', 'DEL', 11, 85), P('Vinícius Júnior', 'DEL', 7, 93),
    ]},
    { id: 'esp2026', country: 'España', year: 2026, flag: '🇪🇸', result: 'Cuartos de final', players: [
      P('Unai Simón', 'POR', 1, 82), P('Pedro Porro', 'DEF', 2, 80), P('Pau Cubarsí', 'DEF', 24, 84),
      P('Aymeric Laporte', 'DEF', 4, 83), P('Marc Cucurella', 'DEF', 3, 82), P('Rodri', 'MED', 16, 90),
      P('Pedri', 'MED', 8, 89), P('Dani Olmo', 'MED', 21, 86), P('Lamine Yamal', 'DEL', 10, 91),
      P('Álex Baena', 'DEL', 18, 81), P('Mikel Oyarzabal', 'DEL', 9, 85),
    ]},
    { id: 'por2026', country: 'Portugal', year: 2026, flag: '🇵🇹', result: 'Octavos de final', players: [
      P('Diogo Costa', 'POR', 1, 87), P('João Cancelo', 'DEF', 2, 84), P('Rúben Dias', 'DEF', 3, 88),
      P('Renato Veiga', 'DEF', 14, 78), P('Nuno Mendes', 'DEF', 5, 85), P('João Neves', 'MED', 6, 84),
      P('Vitinha', 'MED', 17, 87), P('Pedro Neto', 'DEL', 11, 83), P('Bruno Fernandes', 'DEL', 8, 88),
      P('João Félix', 'DEL', 21, 82), P('Cristiano Ronaldo', 'DEL', 7, 90),
    ]},
    { id: 'mex2026', country: 'México', year: 2026, flag: '🇲🇽', result: 'Octavos de final', players: [
      P('Raúl Rangel', 'POR', 1, 80), P('Jorge Sánchez', 'DEF', 2, 76), P('César Montes', 'DEF', 15, 78),
      P('Johan Vásquez', 'DEF', 3, 79), P('Jesús Gallardo', 'DEF', 23, 77), P('Érik Lira', 'MED', 18, 76),
      P('Gilberto Mora', 'MED', 19, 81), P('Luis Romo', 'MED', 8, 78), P('Roberto Alvarado', 'DEL', 22, 79),
      P('Raúl Jiménez', 'DEL', 9, 82), P('Julián Quiñones', 'DEL', 11, 83),
    ]},
    { id: 'usa2026', country: 'Estados Unidos', year: 2026, flag: '🇺🇸', result: 'Octavos de final', players: [
      P('Matt Freese', 'POR', 1, 78), P('Alex Freeman', 'DEF', 2, 76), P('Tim Ream', 'DEF', 13, 77),
      P('Chris Richards', 'DEF', 3, 80), P('Antonee Robinson', 'DEF', 5, 79), P('Tyler Adams', 'MED', 4, 83),
      P('Weston McKennie', 'MED', 8, 81), P('Sergiño Dest', 'MED', 21, 78), P('Malik Tillman', 'DEL', 11, 80),
      P('Christian Pulisic', 'DEL', 10, 87), P('Folarin Balogun', 'DEL', 9, 79),
    ]},
    { id: 'can2026', country: 'Canadá', year: 2026, flag: '🇨🇦', result: 'Octavos de final', players: [
      P('Maxime Crépeau', 'POR', 1, 76), P('Alistair Johnston', 'DEF', 2, 79), P('Kamal Miller', 'DEF', 4, 74),
      P('Moïse Bombito', 'DEF', 5, 78), P('Richie Laryea', 'DEF', 22, 73), P('Tajon Buchanan', 'MED', 11, 80),
      P('Samuel Piette', 'MED', 6, 72), P('Stephen Eustáquio', 'MED', 20, 82), P('Ismaël Koné', 'DEL', 8, 74),
      P('Jonathan David', 'DEL', 9, 86), P('Tani Oluwaseyi', 'DEL', 15, 77),
    ]},
    { id: 'bel2026', country: 'Bélgica', year: 2026, flag: '🇧🇪', result: 'Cuartos de final', players: [
      P('Thibaut Courtois', 'POR', 1, 89), P('Tim Castagne', 'DEF', 2, 79), P('Brandon Mechele', 'DEF', 4, 78),
      P('Arthur Theate', 'DEF', 5, 77), P('Maxim De Cuyper', 'DEF', 3, 76), P('Youri Tielemans', 'MED', 8, 85),
      P('Hans Vanaken', 'MED', 20, 81), P('Kevin De Bruyne', 'MED', 7, 89), P('Jérémy Doku', 'DEL', 11, 87),
      P('Leandro Trossard', 'DEL', 14, 83), P('Charles De Ketelaere', 'DEL', 22, 82),
    ]},
    { id: 'mar2026', country: 'Marruecos', year: 2026, flag: '🇲🇦', result: 'Cuartos de final', players: [
      P('Yassine Bono', 'POR', 1, 85), P('Achraf Hakimi', 'DEF', 2, 91), P('Issa Diop', 'DEF', 5, 79),
      P('Redouane Halhal', 'DEF', 23, 74), P('Noussair Mazraoui', 'DEF', 3, 82), P('Neil El Aynaoui', 'MED', 14, 78),
      P('Ayyoub Bouaddi', 'MED', 8, 80), P('Brahim Díaz', 'DEL', 10, 85), P('Azzedine Ounahi', 'DEL', 17, 81),
      P('Bilal El Khannouss', 'DEL', 20, 83), P('Ismael Saibari', 'DEL', 19, 82),
    ]},
    { id: 'fra2026', country: 'Francia', year: 2026, flag: '🇫🇷', result: 'Cuartos de final', players: [
      P('Mike Maignan', 'POR', 1, 87), P('Jules Koundé', 'DEF', 5, 85), P('Dayot Upamecano', 'DEF', 4, 84),
      P('William Saliba', 'DEF', 17, 88), P('Lucas Digne', 'DEF', 3, 79), P('Manu Koné', 'MED', 6, 82),
      P('Adrien Rabiot', 'MED', 14, 83), P('Ousmane Dembélé', 'DEL', 11, 92), P('Michael Olise', 'DEL', 20, 87),
      P('Bradley Barcola', 'DEL', 19, 83), P('Kylian Mbappé', 'DEL', 10, 95),
    ]},

    // ---- Lote 9 (+6 selecciones, +66 jugadores) — Mundial 2026 (en curso) ----
    { id: 'ger2026', country: 'Alemania', year: 2026, flag: '🇩🇪', result: 'Dieciseisavos de final', players: [
      P('Manuel Neuer', 'POR', 1, 85), P('Joshua Kimmich', 'DEF', 6, 88), P('Antonio Rüdiger', 'DEF', 2, 84),
      P('Jonathan Tah', 'DEF', 4, 81), P('David Raum', 'DEF', 3, 79), P('Robert Andrich', 'MED', 21, 78),
      P('Florian Wirtz', 'MED', 7, 89), P('Jamal Musiala', 'DEL', 10, 90), P('Leroy Sané', 'DEL', 19, 82),
      P('Kai Havertz', 'DEL', 9, 84), P('Nick Woltemade', 'DEL', 11, 78),
    ]},
    { id: 'eng2026', country: 'Inglaterra', year: 2026, flag: '🏴', result: 'Cuartos de final', players: [
      P('Jordan Pickford', 'POR', 1, 84), P('Nico O\'Reilly', 'DEF', 16, 76), P('Marc Guéhi', 'DEF', 6, 82),
      P('Ezri Konsa', 'DEF', 5, 78), P('Jarell Quansah', 'DEF', 22, 76), P('Declan Rice', 'MED', 4, 87),
      P('Elliot Anderson', 'MED', 18, 77), P('Anthony Gordon', 'DEL', 20, 82), P('Jude Bellingham', 'DEL', 10, 92),
      P('Bukayo Saka', 'DEL', 7, 89), P('Harry Kane', 'DEL', 9, 91),
    ]},
    { id: 'col2026', country: 'Colombia', year: 2026, flag: '🇨🇴', result: 'Octavos de final', players: [
      P('Camilo Vargas', 'POR', 1, 81), P('Daniel Muñoz', 'DEF', 17, 82), P('Davinson Sánchez', 'DEF', 4, 80),
      P('Jhon Lucumí', 'DEF', 23, 78), P('Johan Mojica', 'DEF', 6, 77), P('Jhon Arias', 'MED', 21, 82),
      P('Jefferson Lerma', 'MED', 5, 79), P('Gustavo Puerta', 'MED', 14, 76), P('James Rodríguez', 'DEL', 10, 87),
      P('Luis Díaz', 'DEL', 7, 88), P('Luis Suárez', 'DEL', 19, 79),
    ]},
    { id: 'sui2026', country: 'Suiza', year: 2026, flag: '🇨🇭', result: 'Octavos de final', players: [
      P('Gregor Kobel', 'POR', 1, 83), P('Becir Omeragic', 'DEF', 15, 76), P('Nico Elvedi', 'DEF', 4, 79),
      P('Manuel Akanji', 'DEF', 3, 83), P('Ricardo Rodríguez', 'DEF', 13, 77), P('Remo Freuler', 'MED', 8, 79),
      P('Granit Xhaka', 'MED', 10, 85), P('Ardon Jashari', 'MED', 20, 78), P('Fabian Rieder', 'DEL', 18, 77),
      P('Dan Ndoye', 'DEL', 11, 81), P('Breel Embolo', 'DEL', 7, 80),
    ]},
    { id: 'nor2026', country: 'Noruega', year: 2026, flag: '🇳🇴', result: 'Cuartos de final', players: [
      P('Ørjan Nyland', 'POR', 1, 76), P('Marcus Pedersen', 'DEF', 2, 74), P('Kristoffer Ajer', 'DEF', 4, 79),
      P('Torbjørn Heggem', 'DEF', 5, 75), P('David Møller Wolfe', 'DEF', 3, 76), P('Patrick Berg', 'MED', 8, 78),
      P('Sander Berge', 'MED', 6, 80), P('Martin Ødegaard', 'MED', 10, 88), P('Alexander Sørloth', 'DEL', 9, 82),
      P('Erling Haaland', 'DEL', 20, 96), P('Antonio Nusa', 'DEL', 11, 82),
    ]},
    { id: 'egy2026', country: 'Egipto', year: 2026, flag: '🇪🇬', result: 'Octavos de final', players: [
      P('Mostafa Shobeir', 'POR', 23, 79), P('Mohamed Hany', 'DEF', 3, 74), P('Yasser Ibrahim', 'DEF', 2, 76),
      P('Rami Rabia', 'DEF', 5, 75), P('Karim Hafez', 'DEF', 15, 74), P('Emam Ashour', 'MED', 8, 78),
      P('Marwan Attia', 'MED', 19, 76), P('Mohanad Lasheen', 'MED', 17, 75), P('Haissem Hassan', 'MED', 12, 74),
      P('Mohamed Salah', 'DEL', 10, 89), P('Mostafa Ziko', 'DEL', 11, 77),
    ]},
  ];

  global.GameHub = global.GameHub || {};
  global.GameHub.SieteZeroData = { FORMATIONS, POS_LABEL, TEAMS };
})(window);