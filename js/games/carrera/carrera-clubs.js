/**
 * Camino a la Gloria — base de datos de clubes y ligas.
 * Cubre las principales ligas (y su segunda división, cuando aplica) de
 * ~20 países futboleros. Los escudos NO son reproducciones de los reales:
 * se generan de forma procedural (forma + colores + iniciales) a partir
 * del nombre de cada club, a modo de insignia propia del juego.
 */
(function (global) {
  const Countries = global.GameHub.CarreraCountries;
  const countryName = (code) => {
    const c = Countries.COUNTRIES.find((x) => x.code === code);
    return c ? c.name : code;
  };
  const countryFlag = (code) => Countries.flagEmoji(code);

  // tier global: 1 = liga élite mundial ... 6 = fútbol amateur/formativo
  const LEAGUES = [
    { country: 'GB', tier: 1, league: 'Premier League', clubs: [
      'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham Hotspur',
      'Newcastle United', 'Aston Villa', 'West Ham United', 'Brighton & Hove Albion', 'Everton',
      'Wolverhampton Wanderers', 'Crystal Palace', 'Fulham', 'Brentford', 'Nottingham Forest',
      'Bournemouth', 'Leicester City',
    ] },
    { country: 'GB', tier: 2, league: 'Championship', clubs: [
      'Leeds United', 'Southampton', 'Norwich City', 'West Bromwich Albion', 'Middlesbrough',
      'Sunderland', 'Sheffield United', 'Coventry City', 'Hull City', 'Millwall', 'Stoke City', 'Watford',
    ] },
    { country: 'ES', tier: 1, league: 'La Liga', clubs: [
      'Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Real Sociedad', 'Athletic Club',
      'Real Betis', 'Villarreal', 'Sevilla', 'Valencia', 'Girona', 'Osasuna', 'Celta de Vigo',
      'Rayo Vallecano', 'Getafe', 'Mallorca', 'Las Palmas',
    ] },
    { country: 'ES', tier: 2, league: 'LaLiga 2', clubs: [
      'Deportivo La Coruña', 'Real Zaragoza', 'Sporting de Gijón', 'Racing de Santander', 'Levante',
      'Eibar', 'Albacete', 'Cartagena', 'Elche', 'Tenerife',
    ] },
    { country: 'IT', tier: 1, league: 'Serie A', clubs: [
      'Inter de Milán', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina',
      'Bologna', 'Torino', 'Udinese', 'Sassuolo', 'Genoa', 'Cagliari',
    ] },
    { country: 'IT', tier: 2, league: 'Serie B', clubs: [
      'Parma', 'Palermo', 'Bari', 'Sampdoria', 'Venezia', 'Cremonese', 'Cosenza', 'Catanzaro',
    ] },
    { country: 'DE', tier: 1, league: 'Bundesliga', clubs: [
      'Bayern Múnich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt',
      'VfB Stuttgart', "Borussia M'gladbach", 'Wolfsburgo', 'Friburgo', 'Union Berlin', 'Hoffenheim',
      'Mainz 05', 'Werder Bremen', 'Colonia',
    ] },
    { country: 'DE', tier: 2, league: '2. Bundesliga', clubs: [
      'Hamburger SV', 'Schalke 04', 'Hertha Berlín', 'Fortuna Düsseldorf', 'Greuther Fürth',
      'Osnabrück', 'Nürnberg', 'Kaiserslautern',
    ] },
    { country: 'FR', tier: 1, league: 'Ligue 1', clubs: [
      'Paris Saint-Germain', 'Olympique de Marsella', 'AS Mónaco', 'Olympique de Lyon', 'Lille',
      'Rennes', 'Niza', 'Lens', 'Estrasburgo', 'Nantes', 'Toulouse', 'Montpellier', 'Brest', 'Reims',
    ] },
    { country: 'FR', tier: 2, league: 'Ligue 2', clubs: [
      'Saint-Étienne', 'Metz', 'Ajaccio', 'Grenoble', 'Guingamp', 'Bastia', 'Le Havre', 'Amiens',
    ] },
    { country: 'NL', tier: 2, league: 'Eredivisie', clubs: [
      'Ajax', 'PSV Eindhoven', 'Feyenoord', 'AZ Alkmaar', 'FC Twente', 'Utrecht', 'Vitesse',
      'Heerenveen', 'Groningen', 'NEC Nijmegen', 'Sparta Rotterdam', 'Go Ahead Eagles',
    ] },
    { country: 'NL', tier: 3, league: 'Eerste Divisie', clubs: [
      'Willem II', 'De Graafschap', 'Excelsior', 'Roda JC', 'FC Den Bosch', 'Jong Ajax',
    ] },
    { country: 'PT', tier: 2, league: 'Primeira Liga', clubs: [
      'Benfica', 'Porto', 'Sporting CP', 'Braga', 'Vitória de Guimarães', 'Boavista', 'Famalicão',
      'Rio Ave', 'Moreirense', 'Estoril',
    ] },
    { country: 'PT', tier: 3, league: 'Liga Portugal 2', clubs: [
      'Académica', 'Farense', 'Feirense', 'Mafra', 'Penafiel', 'Chaves',
    ] },
    { country: 'BR', tier: 2, league: 'Brasileirão Série A', clubs: [
      'Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Fluminense', 'Grêmio', 'Internacional',
      'Santos', 'Botafogo', 'Vasco da Gama', 'Atlético Mineiro', 'Cruzeiro', 'Bahia', 'Fortaleza',
      'Athletico Paranaense', 'Red Bull Bragantino',
    ] },
    { country: 'BR', tier: 3, league: 'Série B', clubs: [
      'Sport Recife', 'Náutico', 'Vila Nova', 'Ceará', 'Guarani', 'Ponte Preta', 'Coritiba', 'Avaí',
    ] },
    { country: 'AR', tier: 2, league: 'Liga Profesional', clubs: [
      'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo',
      'Estudiantes de La Plata', 'Vélez Sarsfield', 'Talleres', "Newell's Old Boys", 'Rosario Central',
      'Argentinos Juniors', 'Huracán', 'Banfield', 'Lanús', 'Godoy Cruz', 'Defensa y Justicia',
    ] },
    { country: 'AR', tier: 3, league: 'Primera Nacional', clubs: [
      'Chacarita Juniors', 'Almirante Brown', 'Quilmes', 'Deportivo Morón', 'Gimnasia de Jujuy',
      'Nueva Chicago', 'Tigre', 'Almagro',
    ] },
    { country: 'CO', tier: 3, league: 'Categoría Primera A', clubs: [
      'Atlético Nacional', 'Millonarios', 'América de Cali', 'Independiente Santa Fe', 'Deportivo Cali',
      'Junior', 'Independiente Medellín', 'Once Caldas', 'Deportes Tolima', 'Envigado',
      'Deportivo Pasto', 'Alianza Petrolera', 'La Equidad', 'Águilas Doradas',
    ] },
    { country: 'CO', tier: 4, league: 'Primera B', clubs: [
      'Real Cartagena', 'Cúcuta Deportivo', 'Bogotá FC', 'Llaneros', 'Fortaleza CEIF', 'Real San Andrés',
    ] },
    { country: 'MX', tier: 2, league: 'Liga MX', clubs: [
      'Club América', 'Chivas Guadalajara', 'Cruz Azul', 'Pumas UNAM', 'Tigres UANL', 'Monterrey',
      'Toluca', 'Santos Laguna', 'León', 'Pachuca', 'Necaxa', 'Atlas', 'Puebla', 'Querétaro',
    ] },
    { country: 'MX', tier: 3, league: 'Liga de Expansión', clubs: [
      'Mineros de Zacatecas', 'Correcaminos', 'Alebrijes de Oaxaca', 'Tampico Madero',
      'Atlético La Paz', 'Leones Negros',
    ] },
    { country: 'US', tier: 2, league: 'MLS', clubs: [
      'LA Galaxy', 'LAFC', 'Inter Miami', 'Seattle Sounders', 'Atlanta United', 'New York City FC',
      'New York Red Bulls', 'Portland Timbers', 'Columbus Crew', 'Philadelphia Union', 'Orlando City',
      'FC Cincinnati', 'Austin FC', 'Nashville SC',
    ] },
    { country: 'US', tier: 3, league: 'USL Championship', clubs: [
      'Sacramento Republic', 'Louisville City', 'San Antonio FC', 'Phoenix Rising', 'Indy Eleven',
      'Birmingham Legion',
    ] },
    { country: 'BE', tier: 3, league: 'Pro League', clubs: [
      'Club Brujas', 'Anderlecht', 'Genk', 'Standard de Lieja', 'Gante', 'Charleroi', 'Amberes',
      'Mechelen', 'Union Saint-Gilloise', 'Cercle Brugge',
    ] },
    { country: 'TR', tier: 2, league: 'Süper Lig', clubs: [
      'Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'Başakşehir', 'Adana Demirspor',
      'Konyaspor', 'Sivasspor', 'Kasımpaşa', 'Alanyaspor',
    ] },
    { country: 'CL', tier: 3, league: 'Primera División', clubs: [
      'Colo-Colo', 'Universidad de Chile', 'Universidad Católica', 'Palestino', 'Cobresal',
      'Huachipato', 'Ñublense', 'Audax Italiano', 'Everton de Viña del Mar', 'Unión Española',
    ] },
    { country: 'UY', tier: 3, league: 'Primera División', clubs: [
      'Peñarol', 'Nacional', 'Defensor Sporting', 'Danubio', 'Liverpool FC', 'Cerro Largo',
      'River Plate Montevideo', 'Wanderers',
    ] },
    { country: 'EC', tier: 4, league: 'LigaPro', clubs: [
      'Barcelona SC', 'Emelec', 'LDU Quito', 'Independiente del Valle', 'Aucas', 'Deportivo Cuenca',
      'Universidad Católica', 'Delfín',
    ] },
    { country: 'PE', tier: 4, league: 'Liga 1', clubs: [
      'Universitario de Deportes', 'Alianza Lima', 'Sporting Cristal', 'Cienciano', 'Melgar',
      'Cusco FC', 'Deportivo Municipal', 'ADT',
    ] },
    { country: 'JP', tier: 3, league: 'J1 League', clubs: [
      'Vissel Kobe', 'Yokohama F. Marinos', 'Kawasaki Frontale', 'Urawa Red Diamonds', 'Kashima Antlers',
      'Nagoya Grampus', 'Sanfrecce Hiroshima', 'Gamba Osaka', 'Cerezo Osaka', 'FC Tokyo',
    ] },
    { country: 'SA', tier: 3, league: 'Saudi Pro League', clubs: [
      'Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli', 'Al-Shabab', 'Al-Ettifaq', 'Al-Taawoun', 'Al-Fateh',
    ] },
  ];

  // Colores propios de la insignia (no logos reales, solo paleta) para
  // algunos clubes muy reconocibles; el resto usa una paleta generada
  // de forma determinística a partir del nombre.
  const COLOR_OVERRIDES = {
    'Real Madrid': ['#f6efdd', '#c9a94a'], 'FC Barcelona': ['#a50044', '#004d98'],
    'Atlético de Madrid': ['#c1443c', '#1a3a6b'], 'Manchester City': ['#6cabdd', '#1c2c5b'],
    'Manchester United': ['#c1443c', '#1a1a1a'], 'Liverpool': ['#c1443c', '#0d1f16'],
    'Chelsea': ['#1a3a6b', '#c9a94a'], 'Arsenal': ['#c1443c', '#f6efdd'],
    'Bayern Múnich': ['#c1443c', '#1a1a1a'], 'Borussia Dortmund': ['#f0d33a', '#1a1a1a'],
    'Paris Saint-Germain': ['#1a3a6b', '#c1443c'], 'Juventus': ['#1a1a1a', '#f6efdd'],
    'Inter de Milán': ['#1a3a6b', '#1a1a1a'], 'AC Milan': ['#c1443c', '#1a1a1a'],
    'Boca Juniors': ['#1a3a6b', '#f0d33a'], 'River Plate': ['#f6efdd', '#6cabdd'],
    'Flamengo': ['#c1443c', '#1a1a1a'], 'Palmeiras': ['#1e7a3f', '#f6efdd'],
    'Peñarol': ['#f0d33a', '#1a1a1a'], 'Nacional': ['#6cabdd', '#f6efdd'],
    'Ajax': ['#c1443c', '#f6efdd'], 'Benfica': ['#c1443c', '#f6efdd'],
    'Porto': ['#1a3a6b', '#c1443c'], 'Galatasaray': ['#f0d33a', '#c1443c'],
    'Fenerbahçe': ['#1a3a6b', '#f0d33a'], 'Al-Hilal': ['#1e7a3f', '#f6efdd'],
    'Al-Nassr': ['#f0d33a', '#1a1a1a'], 'Colo-Colo': ['#f6efdd', '#1a1a1a'],
  };

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i += 1) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h;
  }

  function colorsFor(name) {
    if (COLOR_OVERRIDES[name]) return COLOR_OVERRIDES[name];
    const h = hashString(name);
    const hue1 = h % 360;
    const hue2 = (hue1 + 40 + (h % 90)) % 360;
    return [`hsl(${hue1} 62% 42%)`, `hsl(${hue2} 55% 26%)`];
  }

  const STOPWORDS = new Set(['de', 'del', 'la', 'los', 'las', 'y', 'fc', 'cf', 'sc', 'ac', 'club', 'the', 'sv']);
  function initialsFor(name) {
    const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
      .filter((w) => w && !STOPWORDS.has(w.toLowerCase()));
    const source = words.length ? words : name.split(/\s+/);
    let out = source.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
    if (out.length < 2) out = name.replace(/[^\p{L}]/gu, '').slice(0, 2).toUpperCase();
    return out.slice(0, 3);
  }

  function slugify(name) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const CLUBS = [];
  LEAGUES.forEach(({ country, tier, league, clubs }) => {
    clubs.forEach((name) => {
      const id = `${slugify(name)}-${country.toLowerCase()}`;
      CLUBS.push({
        id, name, country, tier, league,
        countryName: countryName(country), flag: countryFlag(country),
        colors: colorsFor(name), initials: initialsFor(name),
        shape: hashString(id) % 2 === 0 ? 'shield' : 'circle',
      });
    });
  });

  // Clubes "de formación" genéricos: garantizan que TODAS las nacionalidades
  // del juego (aunque no tengan liga listada arriba) tengan un club inicial.
  function academyClubFor(countryCode) {
    const name = `Academia ${countryName(countryCode)}`;
    const id = `academia-${countryCode.toLowerCase()}`;
    return {
      id, name, country: countryCode, tier: 6, league: 'Fútbol formativo',
      countryName: countryName(countryCode), flag: countryFlag(countryCode),
      colors: colorsFor(name), initials: initialsFor(name), shape: 'circle',
    };
  }

  function clubsByCountry(countryCode) {
    return CLUBS.filter((c) => c.country === countryCode);
  }

  // Elige el club inicial: el de menor categoría (tier más alto = división
  // más baja) dentro del país del jugador; si el país no tiene clubes
  // cargados, se genera un club de formación genérico.
  function pickStartClub(countryCode) {
    const options = clubsByCountry(countryCode);
    if (!options.length) return academyClubFor(countryCode);
    const maxTier = Math.max(...options.map((c) => c.tier));
    const lowest = options.filter((c) => c.tier === maxTier);
    return lowest[Math.floor(Math.random() * lowest.length)];
  }

  // Genera ofertas de mercado: `count` clubes distintos al actual,
  // con preferencia por categorías cercanas, marcados como préstamo o pase.
  function pickOffers(currentClub, count) {
    const pool = CLUBS.filter((c) => c.id !== currentClub.id);
    const offers = [];
    const used = new Set([currentClub.id]);
    let guard = 0;
    while (offers.length < count && pool.length && guard < 400) {
      guard += 1;
      const idx = Math.floor(Math.random() * pool.length);
      const candidate = pool[idx];
      if (used.has(candidate.id)) { pool.splice(idx, 1); continue; }
      const diff = Math.abs(candidate.tier - currentClub.tier);
      if (diff > 3 && Math.random() < 0.75) { pool.splice(idx, 1); continue; }
      used.add(candidate.id);
      offers.push({ club: candidate, loan: Math.random() < 0.35 });
      pool.splice(idx, 1);
    }
    return offers;
  }

  // Insignia SVG generada (no es un logo real): forma + iniciales + colores.
  // Se usa como respaldo automático cuando todavía no hay escudo real cargado.
  function proceduralSvg(club, size) {
    const s = size || 40;
    const [c1, c2] = club.colors;
    const gid = `crg-${club.id}-${s}`.replace(/[^a-zA-Z0-9-]/g, '');
    if (club.shape === 'circle') {
      return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" role="img" aria-label="${club.name}">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
        </linearGradient></defs>
        <circle cx="32" cy="32" r="29" fill="url(#${gid})" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
        <text x="32" y="40" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="#fff" text-anchor="middle" opacity="0.95">${club.initials}</text>
      </svg>`;
    }
    return `<svg viewBox="0 0 64 72" width="${s}" height="${Math.round(s * 72 / 64)}" role="img" aria-label="${club.name}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient></defs>
      <path d="M32 2 L59 9 V33 C59 51 47 63 32 70 C17 63 5 51 5 33 V9 Z" fill="url(#${gid})" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <path d="M32 2 L59 9 V33 C59 51 47 63 32 70 C17 63 5 51 5 33 V9 Z" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <text x="32" y="42" font-family="Arial, sans-serif" font-weight="800" font-size="18" fill="#fff" text-anchor="middle" opacity="0.95">${club.initials}</text>
    </svg>`;
  }

  // Carpeta donde vas a ir soltando los escudos reales. El nombre de archivo
  // esperado para cada club es exactamente `${club.id}.png` (podés usar
  // .png, .webp o .svg — se prueban en ese orden).
  const CREST_DIR = 'assets/crests/';
  const CREST_EXTENSIONS = ['png', 'webp', 'svg'];

  function escapeAttr(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Devuelve el marcado del escudo del club: intenta cargar el archivo real
  // (assets/crests/<id>.png, luego .webp, luego .svg) y, si ninguno existe,
  // muestra automáticamente la insignia procedural como respaldo.
  function badgeSvg(club, size) {
    const s = size || 40;
    const h = club.shape === 'circle' ? s : Math.round(s * 72 / 64);
    const fallback = proceduralSvg(club, s);
    const label = escapeAttr(club.name);
    const chain = CREST_EXTENSIONS.map((ext) => `${CREST_DIR}${club.id}.${ext}`);
    // data-crest-chain guarda las rutas restantes a probar; el onerror va
    // sacando una por una hasta agotar la lista y recién ahí muestra el SVG.
    const rest = chain.slice(1).join('|');
    return `<span class="cr-badge" style="display:inline-block;width:${s}px;height:${h}px;position:relative;line-height:0;">
      <img src="${chain[0]}" data-crest-chain="${rest}" width="${s}" height="${h}" alt="${label}" loading="lazy"
        style="width:100%;height:100%;object-fit:contain;display:block;border-radius:4px;"
        onerror="var el=this;var rest=(el.dataset.crestChain||'').split('|').filter(Boolean);if(rest.length){el.src=rest.shift();el.dataset.crestChain=rest.join('|');}else{el.style.display='none';el.nextElementSibling.style.display='block';}" />
      <span style="display:none;position:absolute;inset:0;">${fallback}</span>
    </span>`;
  }

  global.GameHub = global.GameHub || {};
  global.GameHub.CarreraClubs = {
    CLUBS, clubsByCountry, pickStartClub, pickOffers, badgeSvg, academyClubFor, CREST_DIR,
  };
})(window);
