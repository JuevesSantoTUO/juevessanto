const CACHE_NAME = 'juevessanto-v2.0';
const assets = [
  './',
  'index.html',
  'cancionero.html',
  'itinerarios.html',
  'asistentes.html',
  'historia.html',
  'galeria.html',
  'participa.html',
  'prensa.html',
  'relacionado.html',
  'legal-contacto.html',
  'changelog.html',
  'organizacion.html',
  'assets/header.html',
  'assets/footer.html',

  // Estilos (sin barra inicial)
  'css/style.css',
  'css/asistentes.css',
  'css/prensa.css',
  'css/relacionado.css',
  'css/participa.css',
  'css/legal-contacto.css',
  'css/itinerarios.css',
  'css/historia.css',
  'css/galeria.css',
  'css/cancionero.css',
  'css/changelog.css',
  'css/organizacion.css',
  
  // Scripts (sin barra inicial)
  'scripts/main.js',
  'scripts/relacionado.js',
  'scripts/prensa.js',
  'scripts/legal-contacto.js',
  'scripts/itinerarios.js',
  'scripts/galeria.js',
  'scripts/cancionero.js',
  'scripts/asistentes.js',
  'scripts/organizacion.js',

  // Imágenes
  'img/favicon.png'
];

// Instalar el Service Worker y cachear archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Estrategia: Responder desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
