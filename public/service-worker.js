self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('snakkaz-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icons/snakkaz-icon-192.png',
        '/icons/snakkaz-icon-512.png',
        '/src/main.tsx',
        '/manifest.json',
        // Legg til flere filer som skal caches her
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
