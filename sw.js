/* ==========================================================================
   SERVICE WORKER - JUEVES SANTO OVIEDO (v2.2)
   ========================================================================== */

const CACHE_NAME = 'jueves-santo-cache-v2.2';
const AUDIO_CACHE_NAME = 'jueves-santo-audio-v2.2';

// Recursos críticos para precachear (App Shell)
const STATIC_ASSETS = [
    './',
    './index.html',
    './asistentes.html',
    './cancionero.html',
    './changelog.html',
    './galeria.html',
    './historia.html',
    './itinerarios.html',
    './legal-contacto.html',
    './noticias.html',
    './organizacion.html',
    './participa.html',
    './prensa.html',
    './relacionado.html',
    './saludo_final.html',
    './sucios.html',
    './admin_panel.html',
    './noticia.html',
    './blog.html',
    './manifest.json',

    // Assets globales HTML
    './assets/header.html',
    './assets/footer.html',

    // Estilos CSS
    './css/style.css',
    './css/amin.css',
    './css/asistentes.css',
    './css/blog.css',
    './css/cancionero.css',
    './css/changelog.css',
    './css/galeria.css',
    './css/historia.css',
    './css/itinerarios.css',
    './css/legal-contacto.css',
    './css/organizacion.css',
    './css/participa.css',
    './css/prensa.css',
    './css/relacionado.css',
    './css/rumbieditor.css',

    // JavaScripts
    './scripts/main.js',
    './scripts/supabase-client.js',
    './scripts/admin.js',
    './scripts/asistentes.js',
    './scripts/blog.js',
    './scripts/cancionero.js',
    './scripts/galeria.js',
    './scripts/itinerarios.js',
    './scripts/legal-contacto.js',
    './scripts/noticia-detalle.js',
    './scripts/organizacion.js',
    './scripts/prensa.js',
    './scripts/relacionado.js',
    './scripts/rumbieditor.js',

    // Imágenes Base
    './img/favicon.png',
    './img/logo.png',
    './img/icons/icon-192x192.png',
    './img/icons/icon-512x512.png'
];

// Archivos de audio (Música)
const AUDIO_ASSETS = [
    './audio/Cerca_de_Ti.mp3',
    './audio/Gaudeamus_Igitur.mp3',
    './audio/La_Muerte_no_es_el_Final.mp3',
    './audio/La_Saeta.mp3',
    './audio/Ronda-de-Sentencia.mp3',
    './audio/Virgen_de_Amor.mp3'
];

/* --- 1. INSTALACIÓN --- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW v2.1] Precacheando App Shell y assets estáticos...');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
                console.log('[SW v2.1] Precacheando repertorio de audio...');
                return cache.addAll(AUDIO_ASSETS).catch(err => console.warn('Audio no cacheado por completo:', err));
            })
        ]).then(() => self.skipWaiting())
    );
});

/* --- 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉS ANTIGUAS --- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== AUDIO_CACHE_NAME) {
                        console.log('[SW v2.1] Purgando caché obsoleta:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/* --- 3. ESTRATEGIA DE INTERCEPTACIÓN DE PETICIONES (FETCH) --- */
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Bypass / Network-First para consultas a Supabase y CDN externas
    if (requestUrl.hostname.includes('supabase.co') || requestUrl.hostname.includes('jsdelivr.net')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Estrategia Cache-First para audios
    if (event.request.destination === 'audio' || requestUrl.pathname.endsWith('.mp3')) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
                const response = await cache.match(event.request);
                if (response) return response;
                const fetchResponse = await fetch(event.request);
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
            })
        );
        return;
    }

    // Estrategia Stale-While-Revalidate para el resto de archivos estáticos (HTML/CSS/JS/Imágenes)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si la red falla y no hay caché, se devuelve la versión en caché que exista
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
