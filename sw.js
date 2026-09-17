/**
 * Service Worker für Wochenplan PWA
 * Ermöglicht Offline-Nutzung und App-Installation
 */

const CACHE_NAME = 'wochenplan-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/app.js',
    '/src/core/storage.js',
    '/src/core/recipe.js',
    '/src/utils/helpers.js'
];

/**
 * Install Event - Cache Dateien
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching assets...');
            return cache.addAll(ASSETS).catch((err) => {
                console.warn('⚠️ Einige Assets konnten nicht gecacht werden:', err);
                // Fahre fort, auch wenn einige Dateien fehlen
            });
        })
    );
});

/**
 * Activate Event - Alte Caches löschen
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Löschen alten Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

/**
 * Fetch Event - Network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API Requests (GitHub, etc.) - Network first
    if (event.request.url.includes('api.github.com')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone the response
                    const clonedResponse = response.clone();

                    // Cache successful responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clonedResponse);
                        });
                    }

                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Static assets - Cache first, fallback to network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;

                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Clone the response
                    const clonedResponse = response.clone();

                    // Cache successful responses
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });

                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                return new Response('Offline - Diese Seite ist nicht verfügbar', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            })
    );
});

console.log('✅ Service Worker geladen');
