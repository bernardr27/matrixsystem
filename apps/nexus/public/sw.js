/* eslint-disable no-undef */
const CACHE_NAME = 'nexus-core-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/nexus_logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Strategy: Network First, Fallback to Cache
    // For API calls (Supabase), we might want a different strategy, but for now allow network.

    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses for future offline use
                // Only cache same-origin or specific assets
                if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((response) => {
                    return response || new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
