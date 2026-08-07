/**
 * firebase-config.js — pegá acá la configuración de TU proyecto de Firebase.
 *
 * Cómo conseguirla:
 *   1. Andá a https://console.firebase.google.com y abrí tu proyecto
 *      (o creá uno nuevo, es gratis).
 *   2. Ícono de engranaje (arriba a la izquierda) → "Configuración del proyecto".
 *   3. Pestaña "General" → sección "Tus apps". Si no hay ninguna app web,
 *      hacé clic en el ícono "</>" para agregar una (nombre: "GameHub",
 *      NO hace falta activar Firebase Hosting).
 *   4. Copiá el objeto `firebaseConfig` que te muestra y pegalo abajo,
 *      reemplazando el objeto de ejemplo completo.
 *   5. Andá a "Compilación" → "Realtime Database" → "Crear base de datos".
 *      Elegí la ubicación y arrancá en "modo de prueba" (después ajustamos
 *      las reglas de seguridad, ver README-MULTIJUGADOR.md).
 *   6. Confirmá que `databaseURL` haya quedado completo abajo (algo como
 *      "https://TU-PROYECTO-default-rtdb.firebaseio.com").
 *
 * Estos valores NO son secretos: es normal y seguro que viajen dentro del
 * código del sitio (así funciona toda app web con Firebase). La seguridad
 * real la dan las "Reglas" de la base de datos, no este archivo.
 */
(function (global) {
  const firebaseConfig = {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_PROYECTO.firebaseapp.com',
    databaseURL: 'https://TU_PROYECTO-default-rtdb.firebaseio.com',
    projectId: 'TU_PROYECTO',
    storageBucket: 'TU_PROYECTO.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx',
  };

  // Se considera "configurado" si ya reemplazaste al menos el apiKey y la databaseURL.
  const isConfigured = firebaseConfig.apiKey !== 'TU_API_KEY'
    && !firebaseConfig.databaseURL.includes('TU_PROYECTO');

  global.GameHub = global.GameHub || {};
  global.GameHub.firebaseConfig = firebaseConfig;
  global.GameHub.firebaseConfigured = isConfigured;
})(window);
