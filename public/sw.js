const CACHE_NAME = 'oneunit-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/images/logo.png',
  '/images/hero_bg.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
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

// Enkel network-first strategi för API-anrop, cache-first för statiska filer
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Returnera från cache
        }
        return fetch(event.request).then(
          (response) => {
            // Kolla om vi fick ett giltigt svar
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Klona svaret och spara i cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Undvik att cacha API-anrop till PocketBase
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });
            return response;
          }
        );
      })
  );
});

// Lyssnare för Web Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'OneUnit MC';
  const options = {
    body: data.body || 'Nytt meddelande!',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
