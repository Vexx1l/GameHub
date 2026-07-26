/**
 * Camino a la Gloria — simulador de carrera futbolística, 1 jugador.
 * Motor puro (sin DOM): crea el estado inicial, aplica decisiones y
 * genera el resumen final. Inspirado en el género de "simuladores de
 * carrera por decisiones" (elige tu propia aventura futbolística),
 * con eventos y textos propios.
 */
(function (global) {
  // Listado completo de países (nombre + bandera), definido en carrera-countries.js
  const COUNTRIES = global.GameHub.CarreraCountries.COUNTRIES;

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

  const CLUB_TIERS = [
    'Club de barrio', 'Segunda división', 'Primera división local',
    'Club continental', 'Liga europea media', 'Liga europea grande',
  ];

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
      id: 'oferta-prestamo', title: 'Oferta de préstamo', positions: null,
      desc: 'Un club de menor categoría ofrece llevarte a préstamo para que sumes minutos como titular.',
      options: [
        { label: 'Aceptar el préstamo', effects: { level: 3, reputation: -3, marketValueAdd: -1 }, text: 'Ganas experiencia como titular, aunque bajas tu perfil momentáneamente.', club: 'lower' },
        { label: 'Quedarte a pelear tu lugar', effects: { morale: -3, reputation: 2 }, text: 'Te quedas a competir de igual a igual por la titularidad.' },
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
      id: 'oferta-exterior', title: 'Interés desde el exterior', positions: null,
      desc: 'Un ojeador de una liga extranjera pregunta por tu situación contractual.',
      options: [
        { label: 'Buscar dar el salto', effects: { reputation: 5, marketValueAdd: 3, morale: 2 }, text: 'Se abre la puerta para dar el salto al fútbol internacional.', club: 'upgrade' },
        { label: 'Quedarte donde ya eres importante', effects: { morale: 3 }, text: 'Prefieres la comodidad de un lugar donde ya eres referente.' },
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
  ];

  // Eventos específicos según posición, para variar el sabor de la carrera.
  const POSITION_EVENTS = {
    delantero: [{
      id: 'racha-goleadora', title: 'Racha goleadora', positions: ['delantero'],
      desc: 'Llevas varios partidos consecutivos marcando gol y la prensa empieza a hablar de vos.',
      options: [
        { label: 'Buscar romper el récord del club', effects: { level: 3, reputation: 5, morale: -1 }, text: 'La racha se vuelve historia del club.' },
        { label: 'Jugar en función del equipo', effects: { reputation: 2, morale: 3 }, text: 'Priorizas el funcionamiento colectivo por sobre la estadística personal.' },
      ],
    }],
    mediocampista: [{
      id: 'distribucion-juego', title: 'El técnico te pide más responsabilidad de juego', positions: ['mediocampista'],
      desc: 'Te piden ser el encargado de manejar los tiempos del equipo desde la mitad de cancha.',
      options: [
        { label: 'Asumir el mando del mediocampo', effects: { level: 3, reputation: 4 }, text: 'Te conviertes en el metrónomo del equipo.' },
        { label: 'Priorizar el trabajo defensivo', effects: { level: 2, injuryRisk: -2 }, text: 'Ganas fama de mediocampista equilibrado y confiable.' },
      ],
    }],
    defensa: [{
      id: 'valla-invicta', title: 'El equipo pelea el arco menos vencido', positions: ['defensa'],
      desc: 'Faltan pocas fechas y la defensa pelea el premio a la valla menos vencida del torneo.',
      options: [
        { label: 'Jugar cada pelota como si fuera la última', effects: { level: 3, reputation: 4, injuryRisk: 5 }, text: 'Cierran el torneo con una de las mejores defensas.' },
        { label: 'Cuidar la tarjeta y jugar con cautela', effects: { reputation: 1, injuryRisk: -3 }, text: 'Sostienes el nivel sin arriesgar de más.' },
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
      clubTier: 0,
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      caps: 0,
      injuries: 0,
      collectiveTitles: 0,
      individualAwards: 0,
      peakLevel: 45,
      peakMarketValue: 0.3,
      usedEventIds: [],
      retired: false,
      log: [],
    };
  }

  function pickEvent(state) {
    const pool = buildEventPool(state.position).filter((e) => !state.usedEventIds.includes(e.id));
    const available = pool.length ? pool : buildEventPool(state.position);
    return available[Math.floor(Math.random() * available.length)];
  }

  function applyChoice(state, event, option) {
    const e = option.effects || {};
    state.level = clamp(state.level + (e.level || 0), 1, 99);
    state.reputation = clamp(state.reputation + (e.reputation || 0), 0, 100);
    state.morale = clamp(state.morale + (e.morale || 0), 0, 100);
    state.injuryRisk = clamp(state.injuryRisk + (e.injuryRisk || 0), 0, 90);
    state.marketValue = Math.max(0.1, state.marketValue + (e.marketValueAdd || 0));
    if (option.caps) state.caps += 1 + Math.floor(state.level / 40);
    if (option.club === 'upgrade') state.clubTier = clamp(state.clubTier + 1, 0, CLUB_TIERS.length - 1);
    if (option.club === 'lower') state.clubTier = clamp(state.clubTier - 1, 0, CLUB_TIERS.length - 1);
    state.usedEventIds.push(event.id);

    // --- Simulación de la temporada: partidos, goles, asistencias ---
    const matchesPlayed = 30 + Math.floor((state.level / 99) * 30) - (state.injuryRisk > 50 ? 8 : 0);
    state.matches += matchesPlayed;
    if (state.position === 'delantero') {
      state.goals += Math.round(matchesPlayed * (state.level / 260));
      state.assists += Math.round(matchesPlayed * (state.level / 500));
    } else if (state.position === 'mediocampista') {
      state.goals += Math.round(matchesPlayed * (state.level / 700));
      state.assists += Math.round(matchesPlayed * (state.level / 260));
    } else if (state.position === 'defensa') {
      state.goals += Math.round(matchesPlayed * (state.level / 1400));
      state.assists += Math.round(matchesPlayed * (state.level / 700));
    } else {
      state.cleanSheets += Math.round(matchesPlayed * (state.level / 350));
    }

    // --- Lesión aleatoria ---
    let injuryText = null;
    if (Math.random() * 100 < state.injuryRisk * 0.5) {
      state.injuries += 1;
      state.level = clamp(state.level - (3 + Math.floor(Math.random() * 5)), 1, 99);
      injuryText = 'Una lesión te dejó afuera de varios partidos durante el semestre.';
    }

    // --- Título de equipo (según nivel de club y del jugador) ---
    let titleText = null;
    const titleChance = 8 + state.clubTier * 6 + Math.floor(state.level / 8);
    if (Math.random() * 100 < titleChance) {
      state.collectiveTitles += 1;
      titleText = `¡Campeón con ${CLUB_TIERS[state.clubTier]}!`;
    }

    // --- Premio individual ---
    let awardText = null;
    const awardChance = Math.floor(state.level / 5) + Math.floor(state.reputation / 10);
    if (Math.random() * 100 < awardChance) {
      state.individualAwards += 1;
      awardText = 'Fuiste distinguido como una de las figuras del semestre.';
    }

    state.marketValue = Math.round(Math.max(0.1, state.marketValue + state.level / 25 - 1) * 10) / 10;
    state.peakLevel = Math.max(state.peakLevel, state.level);
    state.peakMarketValue = Math.max(state.peakMarketValue, state.marketValue);

    state.log.push({
      ageFrom: state.age,
      ageTo: state.age + 2,
      clubTier: state.clubTier,
      level: state.level,
      champion: Boolean(titleText),
      award: Boolean(awardText),
      injured: Boolean(injuryText),
    });

    state.age += 2;
    state.period += 1;
    if (state.age > 33 || state.level <= 5) state.retired = true;

    return { injuryText, titleText, awardText };
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
      `${state.matches} partidos${state.position !== 'portero' ? ` · ${state.goals} goles · ${state.assists} asistencias` : ` · ${state.cleanSheets} vallas invictas`}`,
      `${state.collectiveTitles} títulos de equipo · ${state.individualAwards} premios individuales · ${state.caps} veces convocado a la selección`,
      `Retiro a los ${state.age} años, tras ${state.injuries} lesión(es) importante(s).`,
    ].join('\n');
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.CarreraEngine = {
    COUNTRIES, POSITIONS, CLUB_TIERS, POSITION_SPOTS,
    createCareer, pickEvent, applyChoice, careerTitle, shareText,
  };
})(window);
