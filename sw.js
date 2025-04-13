const CACHE_NAME = 'food-waste-app-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/azure-upload.js',
    '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event handler
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Network-first strategy for Azure uploads
    if (event.request.url.includes('blob.core.windows.net')) {
        return;
    }
    
    // Cache-first strategy for app assets
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Open the cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Add the response to the cache
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
    );
});