/**
 * Camino a la Gloria — listado completo de países (nombre en español + código ISO 3166-1 alpha-2).
 * La bandera se genera a partir del código, no se guardan emojis literales.
 */
(function (global) {
  function flagEmoji(code) {
    return code
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }

  // [código ISO2, nombre en español]
  const RAW = [
    ['AF', 'Afganistán'], ['AL', 'Albania'], ['DE', 'Alemania'], ['AD', 'Andorra'],
    ['AO', 'Angola'], ['AI', 'Anguila'], ['AG', 'Antigua y Barbuda'], ['SA', 'Arabia Saudita'],
    ['DZ', 'Argelia'], ['AR', 'Argentina'], ['AM', 'Armenia'], ['AW', 'Aruba'],
    ['AU', 'Australia'], ['AT', 'Austria'], ['AZ', 'Azerbaiyán'],
    ['BS', 'Bahamas'], ['BH', 'Baréin'], ['BD', 'Bangladés'], ['BB', 'Barbados'],
    ['BE', 'Bélgica'], ['BZ', 'Belice'], ['BJ', 'Benín'], ['BM', 'Bermudas'],
    ['BY', 'Bielorrusia'], ['BO', 'Bolivia'], ['BA', 'Bosnia y Herzegovina'],
    ['BW', 'Botsuana'], ['BR', 'Brasil'], ['BN', 'Brunéi'], ['BG', 'Bulgaria'],
    ['BF', 'Burkina Faso'], ['BI', 'Burundi'], ['BT', 'Bután'],
    ['CV', 'Cabo Verde'], ['KH', 'Camboya'], ['CM', 'Camerún'], ['CA', 'Canadá'],
    ['QA', 'Catar'], ['KZ', 'Kazajistán'], ['TD', 'Chad'], ['CL', 'Chile'],
    ['CN', 'China'], ['CY', 'Chipre'], ['VA', 'Ciudad del Vaticano'], ['CO', 'Colombia'],
    ['KM', 'Comoras'], ['CG', 'Congo'], ['CD', 'Congo (RD)'], ['KP', 'Corea del Norte'],
    ['KR', 'Corea del Sur'], ['CI', 'Costa de Marfil'], ['CR', 'Costa Rica'],
    ['HR', 'Croacia'], ['CU', 'Cuba'], ['CW', 'Curazao'],
    ['DK', 'Dinamarca'], ['DM', 'Dominica'],
    ['EC', 'Ecuador'], ['EG', 'Egipto'], ['SV', 'El Salvador'], ['AE', 'Emiratos Árabes Unidos'],
    ['ER', 'Eritrea'], ['SK', 'Eslovaquia'], ['SI', 'Eslovenia'], ['ES', 'España'],
    ['US', 'Estados Unidos'], ['EE', 'Estonia'], ['ET', 'Etiopía'],
    ['PH', 'Filipinas'], ['FI', 'Finlandia'], ['FJ', 'Fiyi'], ['FR', 'Francia'],
    ['GA', 'Gabón'], ['GM', 'Gambia'], ['GE', 'Georgia'], ['GH', 'Ghana'],
    ['GI', 'Gibraltar'], ['GD', 'Granada'], ['GR', 'Grecia'], ['GL', 'Groenlandia'],
    ['GP', 'Guadalupe'], ['GU', 'Guam'], ['GT', 'Guatemala'], ['GF', 'Guayana Francesa'],
    ['GY', 'Guyana'], ['GN', 'Guinea'], ['GQ', 'Guinea Ecuatorial'], ['GW', 'Guinea-Bisáu'],
    ['HT', 'Haití'], ['HN', 'Honduras'], ['HK', 'Hong Kong'], ['HU', 'Hungría'],
    ['IN', 'India'], ['ID', 'Indonesia'], ['IQ', 'Irak'], ['IR', 'Irán'],
    ['IE', 'Irlanda'], ['IS', 'Islandia'], ['BQ', 'Islas BES'], ['KY', 'Islas Caimán'],
    ['CK', 'Islas Cook'], ['FO', 'Islas Feroe'], ['MH', 'Islas Marshall'],
    ['SB', 'Islas Salomón'], ['TC', 'Islas Turcas y Caicos'], ['VG', 'Islas Vírgenes Británicas'],
    ['VI', 'Islas Vírgenes de EE. UU.'], ['IL', 'Israel'], ['IT', 'Italia'],
    ['JM', 'Jamaica'], ['JP', 'Japón'], ['JE', 'Jersey'], ['JO', 'Jordania'],
    ['KE', 'Kenia'], ['KG', 'Kirguistán'], ['KI', 'Kiribati'], ['KW', 'Kuwait'],
    ['LA', 'Laos'], ['LS', 'Lesoto'], ['LV', 'Letonia'], ['LB', 'Líbano'],
    ['LR', 'Liberia'], ['LY', 'Libia'], ['LI', 'Liechtenstein'], ['LT', 'Lituania'],
    ['LU', 'Luxemburgo'],
    ['MO', 'Macao'], ['MK', 'Macedonia del Norte'], ['MG', 'Madagascar'],
    ['MY', 'Malasia'], ['MW', 'Malaui'], ['MV', 'Maldivas'], ['ML', 'Malí'],
    ['MT', 'Malta'], ['MA', 'Marruecos'], ['MQ', 'Martinica'], ['MU', 'Mauricio'],
    ['MR', 'Mauritania'], ['MX', 'México'], ['FM', 'Micronesia'], ['MD', 'Moldavia'],
    ['MC', 'Mónaco'], ['MN', 'Mongolia'], ['ME', 'Montenegro'], ['MS', 'Montserrat'],
    ['MZ', 'Mozambique'], ['MM', 'Myanmar (Birmania)'],
    ['NA', 'Namibia'], ['NR', 'Nauru'], ['NP', 'Nepal'], ['NI', 'Nicaragua'],
    ['NE', 'Níger'], ['NG', 'Nigeria'], ['NO', 'Noruega'], ['NC', 'Nueva Caledonia'],
    ['NZ', 'Nueva Zelanda'],
    ['NL', 'Países Bajos'], ['PK', 'Pakistán'], ['PW', 'Palaos'], ['PS', 'Palestina'],
    ['PA', 'Panamá'], ['PG', 'Papúa Nueva Guinea'], ['PY', 'Paraguay'], ['PE', 'Perú'],
    ['PF', 'Polinesia Francesa'], ['PL', 'Polonia'], ['PT', 'Portugal'], ['PR', 'Puerto Rico'],
    ['GB', 'Reino Unido'], ['CF', 'República Centroafricana'], ['CZ', 'República Checa'],
    ['DO', 'República Dominicana'], ['RE', 'Reunión'], ['RW', 'Ruanda'], ['RO', 'Rumania'],
    ['RU', 'Rusia'],
    ['WS', 'Samoa'], ['AS', 'Samoa Americana'], ['BL', 'San Bartolomé'],
    ['KN', 'San Cristóbal y Nieves'], ['SM', 'San Marino'], ['MF', 'San Martín'],
    ['PM', 'San Pedro y Miquelón'], ['VC', 'San Vicente y las Granadinas'],
    ['SH', 'Santa Elena'], ['LC', 'Santa Lucía'], ['ST', 'Santo Tomé y Príncipe'],
    ['SN', 'Senegal'], ['RS', 'Serbia'], ['SC', 'Seychelles'], ['SL', 'Sierra Leona'],
    ['SG', 'Singapur'], ['SX', 'Sint Maarten'], ['SY', 'Siria'], ['SO', 'Somalia'],
    ['LK', 'Sri Lanka'], ['SZ', 'Suazilandia'], ['ZA', 'Sudáfrica'], ['SD', 'Sudán'],
    ['SS', 'Sudán del Sur'], ['SE', 'Suecia'], ['CH', 'Suiza'], ['SR', 'Surinam'],
    ['TH', 'Tailandia'], ['TW', 'Taiwán'], ['TZ', 'Tanzania'], ['TJ', 'Tayikistán'],
    ['TL', 'Timor Oriental'], ['TG', 'Togo'], ['TO', 'Tonga'], ['TT', 'Trinidad y Tobago'],
    ['TN', 'Túnez'], ['TM', 'Turkmenistán'], ['TR', 'Turquía'], ['TV', 'Tuvalu'],
    ['UA', 'Ucrania'], ['UG', 'Uganda'], ['UY', 'Uruguay'], ['UZ', 'Uzbekistán'],
    ['VU', 'Vanuatu'], ['VE', 'Venezuela'], ['VN', 'Vietnam'],
    ['YE', 'Yemen'], ['DJ', 'Yibuti'],
    ['ZM', 'Zambia'], ['ZW', 'Zimbabue'],
  ];

  const COUNTRIES = RAW.map(([code, name]) => ({ code, name, flag: flagEmoji(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  global.GameHub = global.GameHub || {};
  global.GameHub.CarreraCountries = { COUNTRIES, flagEmoji };
})(window);
