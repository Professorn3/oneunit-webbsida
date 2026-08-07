const CACHE_NAME = 'oneunit-cache-v2';
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

// Network-first strategi för att säkerställa att uppdateringar alltid syns direkt
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Undvik api-anrop (PocketBase) i cachen för säkerhets skull
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Om nätverket funkar, spara en kopia i cachen och returnera
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Om offline, hämta från cachen
        return caches.match(event.request);
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
