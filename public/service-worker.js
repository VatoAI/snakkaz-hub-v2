const CACHE_NAME = 'snakkaz-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/snakkaz-icon-192.png',
  '/icons/snakkaz-icon-512.png',
  '/src/main.tsx',
  '/manifest.json',
  // Legg til flere filer som skal caches her
];

// Installer Service Worker og cache nødvendige ressurser
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Aktiver Service Worker og fjern gammel cache hvis nødvendig
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Håndter fetch-forespørsler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET') {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});

// Håndter meldinger fra klienter (valgfritt, kan brukes til å manuelt oppdatere cache)
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});