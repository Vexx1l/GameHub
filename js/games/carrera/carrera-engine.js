/**
 * Camino a la Gloria — simulador de carrera futbolística, 1 jugador.
 * Motor puro (sin DOM): crea el estado inicial, aplica decisiones y
 * genera el resumen final. Inspirado en el género de "simuladores de
 * carrera por decisiones" (elige tu propia aventura futbolística),
 * con eventos y textos propios. Incluye mercado de pases con clubes
 * reales (nombre + insignia generada) y estadísticas por club.
 */
(function (global) {
  // Listado completo de países (nombre + bandera), definido en carrera-countries.js
  const COUNTRIES = global.GameHub.CarreraCountries.COUNTRIES;
  const Clubs = global.GameHub.CarreraClubs;

  const POSITIONS = [
    { id: 'portero', label: 'Portero' },
    { id: 'defensa', label: 'Defensa' },
    { id: 'mediocampista', label: 'Mediocampista' },
    { id: 'delantero', label: 'Delantero' },
  ];

  // Posiciones detalladas sobre la cancha, para el selector visual.
  // "group" mapea a la categoría amplia (POSITIONS) que usa el motor de simulación.
  // x/y son porcentajes sobre un campo vertical (0,0 = arco propio arriba a la izquierda del área).
  const POSITION_SPOTS = [
    { id: 'por', label: 'Portero', short: 'POR', group: 'portero', x: 50, y: 90 },
    { id: 'dfc', label: 'Defensa central', short: 'DFC', group: 'defensa', x: 50, y: 72 },
    { id: 'li', label: 'Lateral izquierdo', short: 'LI', group: 'defensa', x: 16, y: 68 },
    { id: 'ld', label: 'Lateral derecho', short: 'LD', group: 'defensa', x: 84, y: 68 },
    { id: 'mcd', label: 'Mediocentro defensivo', short: 'MCD', group: 'mediocampista', x: 50, y: 54 },
    { id: 'mi', label: 'Mediocampista izquierdo', short: 'MI', group: 'mediocampista', x: 20, y: 42 },
    { id: 'mc', label: 'Mediocampista central', short: 'MC', group: 'mediocampista', x: 50, y: 42 },
    { id: 'md', label: 'Mediocampista derecho', short: 'MD', group: 'mediocampista', x: 80, y: 42 },
    { id: 'mco', label: 'Mediapunta', short: 'MCO', group: 'mediocampista', x: 50, y: 28 },
    { id: 'ei', label: 'Extremo izquierdo', short: 'EI', group: 'delantero', x: 18, y: 16 },
    { id: 'ed', label: 'Extremo derecho', short: 'ED', group: 'delantero', x: 82, y: 16 },
    { id: 'dc', label: 'Delantero centro', short: 'DC', group: 'delantero', x: 50, y: 10 },
  ];

  const AWARD_NAMES = {
    portero: ['Guante de Oro del torneo', 'Mejor arquero de la liga', 'Valla menos vencida'],
    defensa: ['Mejor defensor de la liga', 'Equipo ideal del torneo', 'Muro de la temporada'],
    mediocampista: ['Mejor mediocampista de la liga', 'Asistente del torneo', 'Equipo ideal del torneo'],
    delantero: ['Bota de Oro de la liga', 'Máximo goleador del torneo', 'Jugador revelación'],
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // Cada evento: título, descripción, posiciones a las que aplica
  // (null = todas), y 2-3 opciones con efectos y un texto narrativo.
  const EVENTS = [
    {
      id: 'pretemporada', title: 'Pretemporada exigente', positions: null,
      desc: 'El cuerpo técnico exige un doble turno de entrenamientos durante toda la pretemporada.',
      options: [
        { label: 'Entrenar al máximo', effects: { level: 4, morale: -4, injuryRisk: 6 }, text: 'Llegas a la competencia en tu mejor forma física, aunque agotado.' },
        { label: 'Dosificar el esfuerzo', effects: { level: 1, morale: 3, injuryRisk: -3 }, text: 'Cuidas tu cuerpo y llegas fresco, aunque un poco menos afilado.' },
      ],
    },
    {
      id: 'presion-hinchada', title: 'La hinchada empieza a impacientarse', positions: null,
      desc: 'Los resultados no llegan y las redes sociales piden tu salida del equipo titular.',
      options: [
        { label: 'Responder con goles y esfuerzo en cancha', effects: { level: 3, reputation: 5, morale: -2 }, text: 'Te sobrepones a la presión con trabajo. La crítica se calma.' },
        { label: 'Ignorar el ruido y enfocarte en lo tuyo', effects: { morale: 4, reputation: -2 }, text: 'Mantienes la calma mental, aunque la prensa sigue dudando de ti.' },
      ],
    },
    {
      id: 'molestia-fisica', title: 'Molestia física', positions: null,
      desc: 'Sientes una leve molestia muscular después de un partido exigente.',
      options: [
        { label: 'Jugar el próximo partido igual', effects: { level: 2, injuryRisk: 12, morale: -1 }, text: 'Decides no perderte minutos importantes, a pesar del riesgo.' },
        { label: 'Pedir descanso y tratamiento preventivo', effects: { injuryRisk: -10, reputation: -1 }, text: 'El cuerpo médico agradece la prudencia; te pierdes un par de partidos.' },
      ],
    },
    {
      id: 'nutricion', title: 'Cambio de alimentación', positions: null,
      desc: 'El nutricionista del club propone un nuevo plan alimenticio más estricto.',
      options: [
        { label: 'Seguirlo al pie de la letra', effects: { level: 2, injuryRisk: -4 }, text: 'Notas más energía en los entrenamientos finales.' },
        { label: 'Mantener tu rutina de siempre', effects: { morale: 2 }, text: 'Te sientes cómodo con lo que ya conocías.' },
      ],
    },
    {
      id: 'sustancia-dudosa', title: 'Una oferta tentadora y arriesgada', positions: null,
      desc: 'Alguien cercano al club te ofrece una "ayuda" para acelerar tu recuperación que no está del todo clara.',
      options: [
        { label: 'Rechazarla de plano', effects: { reputation: 3, morale: 1 }, text: 'Prefieres el camino limpio, aunque sea más lento.' },
        { label: 'Aceptar "por esta vez"', effects: { level: 5, injuryRisk: 15, reputation: -6 }, text: 'El rendimiento sube, pero queda una sombra de duda sobre ti.' },
      ],
    },
    {
      id: 'llamado-seleccion', title: 'Llamado a la selección nacional', positions: null,
      desc: 'El cuerpo técnico de la selección te tiene en la mira para la próxima doble fecha.',
      options: [
        { label: 'Priorizar la convocatoria', effects: { reputation: 6, level: 2, morale: 2 }, text: 'Debutas o sumas minutos con tu selección. Un sueño cumplido.', caps: true },
        { label: 'Pedir descansar por carga física', effects: { injuryRisk: -8, reputation: -3 }, text: 'El cuerpo técnico respeta tu decisión, pero pierdes protagonismo.' },
      ],
    },
    {
      id: 'renovacion', title: 'Renovación de contrato', positions: null,
      desc: 'La dirigencia se sienta contigo para hablar de una renovación a largo plazo.',
      options: [
        { label: 'Firmar la renovación', effects: { morale: 5, reputation: 2 }, text: 'Te consolidas como pieza clave del proyecto.' },
        { label: 'Esperar mejores ofertas', effects: { marketValueAdd: 2, morale: -2 }, text: 'Apuestas por tu futuro, aunque genera algo de tensión con el club.' },
      ],
    },
    {
      id: 'competencia-titular', title: 'Llega una joven promesa a tu posición', positions: null,
      desc: 'El club ficha a un juvenil que amenaza con quitarte la titularidad.',
      options: [
        { label: 'Redoblar el esfuerzo en cada entrenamiento', effects: { level: 4, morale: -2 }, text: 'Te ganas la titularidad a pura mística y trabajo.' },
        { label: 'Aceptar compartir minutos con calma', effects: { morale: 3, level: 1 }, text: 'Compartes rol sin desgastarte, aunque cedes protagonismo.' },
      ],
    },
    {
      id: 'lesion-seria', title: 'Lesión de consideración', positions: null,
      desc: 'Un mal gesto en un entrenamiento te deja una lesión que requiere varios meses de recuperación.',
      options: [
        { label: 'Rehabilitación estricta y paciente', effects: { level: -3, injuryRisk: -10, morale: -3 }, text: 'El proceso es duro, pero vuelves con la cabeza fría.' },
        { label: 'Apurar el regreso a las canchas', effects: { level: -1, injuryRisk: 10, morale: 1 }, text: 'Vuelves antes de tiempo, con el riesgo latente de una recaída.' },
      ],
    },
    {
      id: 'liderazgo', title: 'El vestuario necesita un líder', positions: null,
      desc: 'El equipo atraviesa un mal momento anímico y falta una voz que ordene al grupo.',
      options: [
        { label: 'Asumir el rol de líder', effects: { reputation: 4, morale: 3 }, text: 'Te ganas el respeto del plantel como referente dentro y fuera de la cancha.' },
        { label: 'Mantener un perfil bajo', effects: { morale: 1 }, text: 'Prefieres concentrarte solo en tu rendimiento individual.' },
      ],
    },
    {
      id: 'entrenador-nuevo', title: 'Cambio de entrenador', positions: null,
      desc: 'El club destituye al técnico y llega un nuevo cuerpo técnico con ideas distintas.',
      options: [
        { label: 'Adaptarte rápido al nuevo esquema', effects: { level: 3, morale: 1 }, text: 'Te ganas la confianza del nuevo entrenador desde el primer día.' },
        { label: 'Mantener tu estilo de siempre', effects: { morale: -2, reputation: 1 }, text: 'Cuesta un poco encajar, pero no perdés tu identidad.' },
      ],
    },
  ];

  // Eventos específicos según posición, para variar el sabor de la carrera.
  const POSITION_EVENTS = {
    delantero: [{
      id: 'racha-goleadora', title: 'Racha goleadora', positions: ['delantero'],
      desc: 'Llevas varios partidos consecutivos marcando gol y la prensa empieza a hablar de vos.',
      options: [
        { label: 'Buscar romper el récord del club', effects: { level: 3, reputation: 5, morale: -1 }, text: 'La racha se vuelve historia del club.' },
        { label: 'Priorizar el juego colectivo', effects: { level: 1, morale: 3 }, text: 'Sacrificás protagonismo individual por el funcionamiento del equipo.' },
      ],
    }],
    mediocampista: [{
      id: 'motor-mediocampo', title: 'El motor del equipo', positions: ['mediocampista'],
      desc: 'El entrenador te pide correr cada balón dividido y ser el enlace entre defensa y ataque.',
      options: [
        { label: 'Asumir el doble rol sin quejarte', effects: { level: 3, injuryRisk: 4 }, text: 'Te convertís en pieza indispensable del mediocampo.' },
        { label: 'Pedir un rol más específico', effects: { morale: 2, level: 1 }, text: 'Ganás comodidad, aunque cedés algo de protagonismo.' },
      ],
    }],
    defensa: [{
      id: 'muro-defensivo', title: 'El muro de la defensa', positions: ['defensa'],
      desc: 'La prensa empieza a destacar tu solidez defensiva partido tras partido.',
      options: [
        { label: 'Salir a buscar cada duelo', effects: { level: 3, injuryRisk: 5, reputation: 3 }, text: 'Te ganás fama de intratable en el uno contra uno.' },
        { label: 'Jugar con inteligencia posicional', effects: { level: 2, injuryRisk: -2 }, text: 'Ganás partidos leyendo el juego antes que con la fuerza.' },
      ],
    }],
    portero: [{
      id: 'atajada-clave', title: 'Atajada bajo los tres palos', positions: ['portero'],
      desc: 'En el último minuto de un clásico, te enfrentas a un penal decisivo.',
      options: [
        { label: 'Estudiar al pateador y arriesgar el lado', effects: { level: 4, reputation: 6, morale: 2 }, text: 'La atajada queda en la memoria de la hinchada para siempre.' },
        { label: 'Jugar seguro al medio del arco', effects: { level: 1, morale: 1 }, text: 'Cumples sin sobresaltos, aunque sin la gloria del héroe.' },
      ],
    }],
  };

  function buildEventPool(position) {
    return EVENTS.concat(POSITION_EVENTS[position] || []);
  }

  function createCareer({ surname, number, foot, country, position, positionDetail }) {
    const spot = POSITION_SPOTS.find((s) => s.id === positionDetail) || null;
    const club = Clubs.pickStartClub(country.code);
    return {
      surname, number, foot, country, position,
      positionDetail: spot ? spot.label : null,
      positionShort: spot ? spot.short : null,
      age: 17,
      period: 0,
      totalPeriods: 9, // 17-18 ... 33-34, retiro a los 35
      level: 45 + Math.floor(Math.random() * 10),
      reputation: 10,
      morale: 60,
      injuryRisk: 10,
      marketValue: 0.3,
      matches: 0,
      wins: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      caps: 0,
      injuries: 0,
      collectiveTitles: 0,
      individualAwards: 0,
      individualAwardNames: [],
      peakLevel: 45,
      peakMarketValue: 0.3,
      usedEventIds: [],
      retired: false,
      log: [],
      // --- club actual y su historial ---
      club,
      onLoan: false,
      stint: { club, ageFrom: 17, matches: 0, wins: 0, goals: 0, titles: 0 },
      clubHistory: [],
      // --- selección nacional ---
      national: { matches: 0, wins: 0, goals: 0, trophies: 0 },
    };
  }

  function pickEvent(state) {
    // A partir del segundo tramo, hay probabilidad de que se abra el
    // mercado de pases en lugar de un evento narrativo normal.
    if (state.period > 0 && Math.random() < 0.42) {
      const offers = Clubs.pickOffers(state.club, 2);
      if (offers.length) {
        return {
          id: `mercado-${state.period}`, market: true,
          title: 'Mercado de pases',
          desc: 'Llegaron ofertas después de tu último tramo de carrera. Podés aceptar una o quedarte en tu club.',
          offers,
        };
      }
    }
    const pool = buildEventPool(state.position).filter((e) => !state.usedEventIds.includes(e.id));
    const available = pool.length ? pool : buildEventPool(state.position);
    return available[Math.floor(Math.random() * available.length)];
  }

  function finalizeStint(state) {
    const s = state.stint;
    if (!s) return;
    state.clubHistory.push({
      club: s.club, ageFrom: s.ageFrom, ageTo: state.age,
      matches: s.matches, wins: s.wins, goals: s.goals, titles: s.titles,
    });
  }

  function openStint(state) {
    state.stint = { club: state.club, ageFrom: state.age, matches: 0, wins: 0, goals: 0, titles: 0 };
  }

  // --- Simulación de una temporada (partidos, goles/vallas, lesión, títulos, premios) ---
  function simulateSeason(state) {
    const matchesPlayed = 30 + Math.floor((state.level / 99) * 30) - (state.injuryRisk > 50 ? 8 : 0);
    const clubTier = state.club.tier;
    const winRate = clamp(0.32 + (state.level - 50) / 220 + (6 - clubTier) * 0.035, 0.1, 0.85);
    const wins = Math.round(matchesPlayed * winRate);

    state.matches += matchesPlayed;
    state.wins += wins;
    state.stint.matches += matchesPlayed;
    state.stint.wins += wins;

    let goalsThisSeason = 0;
    if (state.position === 'delantero') {
      goalsThisSeason = Math.round(matchesPlayed * (state.level / 260));
      state.assists += Math.round(matchesPlayed * (state.level / 500));
    } else if (state.position === 'mediocampista') {
      goalsThisSeason = Math.round(matchesPlayed * (state.level / 700));
      state.assists += Math.round(matchesPlayed * (state.level / 260));
    } else if (state.position === 'defensa') {
      goalsThisSeason = Math.round(matchesPlayed * (state.level / 1400));
      state.assists += Math.round(matchesPlayed * (state.level / 700));
    } else {
      // Portero: "goles" = goles recibidos (a menor nivel, más goles recibidos).
      goalsThisSeason = Math.max(0, Math.round(matchesPlayed * (1 - winRate) * 0.9));
      state.cleanSheets += Math.round(matchesPlayed * (state.level / 350));
    }
    state.goals += goalsThisSeason;
    state.stint.goals += goalsThisSeason;

    // --- Lesión aleatoria ---
    let injuryText = null;
    if (Math.random() * 100 < state.injuryRisk * 0.5) {
      state.injuries += 1;
      state.level = clamp(state.level - (3 + Math.floor(Math.random() * 5)), 1, 99);
      injuryText = 'Una lesión te dejó afuera de varios partidos durante el semestre.';
    }

    // --- Título de equipo (según nivel de club y del jugador) ---
    let titleText = null;
    const titleChance = 8 + (6 - clubTier) * 6 + Math.floor(state.level / 8);
    if (Math.random() * 100 < titleChance) {
      state.collectiveTitles += 1;
      state.stint.titles += 1;
      titleText = `¡Campeón con ${state.club.name}!`;
    }

    // --- Premio individual ---
    let awardText = null;
    const awardChance = Math.floor(state.level / 5) + Math.floor(state.reputation / 10);
    if (Math.random() * 100 < awardChance) {
      state.individualAwards += 1;
      const pool = AWARD_NAMES[state.position] || AWARD_NAMES.mediocampista;
      const award = pool[Math.floor(Math.random() * pool.length)];
      state.individualAwardNames.push(award);
      awardText = `Fuiste distinguido: "${award}".`;
    }

    state.marketValue = Math.round(Math.max(0.1, state.marketValue + state.level / 25 - 1) * 10) / 10;
    state.peakLevel = Math.max(state.peakLevel, state.level);
    state.peakMarketValue = Math.max(state.peakMarketValue, state.marketValue);

    state.log.push({
      ageFrom: state.age,
      ageTo: state.age + 2,
      club: state.club,
      level: state.level,
      champion: Boolean(titleText),
      award: Boolean(awardText),
      injured: Boolean(injuryText),
    });

    state.age += 2;
    state.period += 1;
    if (state.age > 33 || state.level <= 5) state.retired = true;

    if (state.retired) finalizeStint(state);

    return { injuryText, titleText, awardText };
  }

  function applyChoice(state, event, option) {
    const e = option.effects || {};
    state.level = clamp(state.level + (e.level || 0), 1, 99);
    state.reputation = clamp(state.reputation + (e.reputation || 0), 0, 100);
    state.morale = clamp(state.morale + (e.morale || 0), 0, 100);
    state.injuryRisk = clamp(state.injuryRisk + (e.injuryRisk || 0), 0, 90);
    state.marketValue = Math.max(0.1, state.marketValue + (e.marketValueAdd || 0));
    if (option.caps) {
      const gain = 1 + Math.floor(state.level / 40);
      state.caps += gain;
      const natWinRate = clamp(0.3 + (state.level - 50) / 180 + state.reputation / 300, 0.1, 0.9);
      state.national.matches += gain;
      state.national.wins += Math.round(gain * natWinRate);
      if (state.position !== 'portero') {
        state.national.goals += Math.round(gain * (state.level / 400));
      } else {
        state.national.goals += Math.round(gain * (1 - natWinRate) * 0.6);
      }
      if (!state.national.trophies && state.level >= 78 && state.reputation >= 55 && Math.random() < 0.14) {
        state.national.trophies += 1;
      }
    }
    state.usedEventIds.push(event.id);

    const result = simulateSeason(state);
    return { ...result, choiceText: option.text };
  }

  // Aplica una decisión del mercado de pases: fichar por un club nuevo
  // (permanente o a préstamo) o quedarse en el actual.
  function applyMarketChoice(state, chosenClub, isLoan) {
    let transferText;
    if (chosenClub && chosenClub.id !== state.club.id) {
      finalizeStint(state);
      state.club = chosenClub;
      state.onLoan = Boolean(isLoan);
      openStint(state);
      transferText = isLoan
        ? `Salís a préstamo: ${chosenClub.flag} ${chosenClub.name} (${chosenClub.league}).`
        : `¡Fichaje confirmado! Nuevo club: ${chosenClub.flag} ${chosenClub.name} (${chosenClub.league}).`;
    } else {
      state.onLoan = false;
      transferText = `Decidís continuar en ${state.club.name}.`;
    }
    const result = simulateSeason(state);
    return { ...result, choiceText: transferText };
  }

  function careerTitle(state) {
    if (state.collectiveTitles >= 4 || state.peakLevel >= 90) return 'Leyenda del fútbol';
    if (state.peakLevel >= 80 || state.individualAwards >= 3) return 'Ídolo de multitudes';
    if (state.peakLevel >= 65) return 'Profesional consolidado';
    if (state.injuries >= 4) return 'Carrera marcada por las lesiones';
    return 'Jugador de trayectoria discreta';
  }

  function shareText(state) {
    const posLabel = POSITIONS.find((p) => p.id === state.position).label;
    return [
      `⚽ ${careerTitle(state)} ⚽`,
      `${state.surname} #${state.number} — ${posLabel} (${state.country.flag} ${state.country.name})`,
      `Nivel máximo: ${state.peakLevel} · Valor máximo: €${state.peakMarketValue}M`,
      `${state.matches} PJ · ${state.wins} victorias · ${state.position === 'portero' ? `${state.goals} goles recibidos` : `${state.goals} goles`}`,
      `${state.collectiveTitles} títulos de equipo · ${state.individualAwards} premios individuales · ${state.caps} veces convocado a la selección`,
      `Último club: ${state.club.name} (${state.club.league})`,
      `Retiro a los ${state.age} años, tras ${state.injuries} lesión(es) importante(s).`,
    ].join('\n');
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.CarreraEngine = {
    COUNTRIES, POSITIONS, POSITION_SPOTS,
    createCareer, pickEvent, applyChoice, applyMarketChoice, careerTitle, shareText,
  };
})(window);
