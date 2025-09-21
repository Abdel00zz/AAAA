const CACHE_VERSION = 'v1';
const CACHE_NAME = `maths-mind-cache-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/logo.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('maths-mind-cache-') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        // Use a stale-while-revalidate strategy for external resources like fonts and CDN scripts
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Network first for chapter data and manifest to get updates
    if (url.pathname.includes('/chapters/') || url.pathname.endsWith('/manifest.json')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache first for precached assets
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request);
        })
    );
});

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || Response.error();
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponsePromise = await caches.match(request);

    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(err => {
        console.warn('Fetch failed, returning stale response if available.', request.url, err);
        return new Response(null, { status: 500, statusText: "Offline" });
    });

    return cachedResponsePromise || fetchPromise;
}
