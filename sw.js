/* ==========================================================================
   SERVICE WORKER - JUEVES SANTO OVIEDO (v2.4 - COMPLETO Y CORREGIDO)
   ========================================================================== */

const CACHE_NAME = 'jueves-santo-cache-v2.4';
const AUDIO_CACHE_NAME = 'jueves-santo-audio-v2.4';

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
    './jusacalles.htmal',
    './legal-contacto.html',
    './noticias.html',
    './organizacion.html',
    './participa.html',
    './prensa.html',
    './relacionado.html',
    './admin_panel.html',
    './noticia.html',
    './blog.html',
    './manifest.json',

    // Assets globales HTML
    './assets/header.html',
    './assets/footer.html',

    // Estilos CSS
    './css/style.css',
    './css/admin.css',
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
    './jusacalles.js',
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

/* --- 1. INSTALACIÓN BLINDADA (SIN DESPLIEGUES BLOQUEADOS) --- */
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW v2.4] Precacheando App Shell de forma segura...');
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn(`Asset no precacheado: ${url}`, err)))
                );
            }),
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
                console.log('[SW v2.4] Precacheando audios...');
                return Promise.allSettled(
                    AUDIO_ASSETS.map(url => cache.add(url).catch(err => console.warn(`Audio no precacheado: ${url}`, err)))
                );
            })
        ])
    );
});

/* --- 2. ACTIVACIÓN Y PURGA DE CACHÉS ANTIGUAS --- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== AUDIO_CACHE_NAME) {
                        console.log('[SW v2.4] Eliminando caché obsoleta:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/* --- 3. ESTRATEGIA DE PETICIONES (FETCH) --- */
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Bypass directo para llamadas API a Supabase y CDN externas
    if (requestUrl.hostname.includes('supabase.co') || requestUrl.hostname.includes('jsdelivr.net') || requestUrl.hostname.includes('cdnjs.cloudflare.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Estrategia Cache-First para audios MP3
    if (event.request.destination === 'audio' || requestUrl.pathname.endsWith('.mp3')) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
                const response = await cache.match(event.request);
                if (response) return response;
                const fetchResponse = await fetch(event.request);
                if (fetchResponse && fetchResponse.status === 200) {
                    cache.put(event.request, fetchResponse.clone());
                }
                return fetchResponse;
            })
        );
        return;
    }

    // Estrategia Stale-While-Revalidate para assets estáticos
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
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

/* --- 4. RECEPCIÓ DE NOTIFICACIONES PUSH Y CLIC --- */
self.addEventListener('push', (event) => {
    let data = { title: 'Jueves Santo Oviedo', body: 'Tienes una nueva actualización.', url: './index.html' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: './img/icons/icon-192x192.png',
        badge: './img/favicon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './index.html'
        },
        actions: [
            { action: 'open', title: 'Ver' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data.url || './index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
