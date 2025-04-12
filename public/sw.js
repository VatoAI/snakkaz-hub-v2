const CACHE_NAME = 'snakkaz-cache-v1';
const ANALYTICS_BLOCKLIST = [
  'cloudflareinsights.com',
  'beacon.min.js'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico'
      ]);
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle CORS requests
  if (url.origin !== self.location.origin) {
    // Block analytics if disabled
    if (ANALYTICS_BLOCKLIST.some(domain => url.hostname.includes(domain))) {
      event.respondWith(new Response('', { status: 204 }));
      return;
    }

    // Add CORS headers for allowed origins
    const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [];
    if (allowedOrigins.includes(url.origin)) {
      const corsHeaders = new Headers({
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      });

      if (event.request.method === 'OPTIONS') {
        event.respondWith(new Response(null, { headers: corsHeaders }));
        return;
      }

      event.respondWith(
        fetch(event.request, {
          mode: 'cors',
          credentials: 'include',
          headers: corsHeaders
        }).catch(() => {
          return new Response('CORS request failed', { status: 403 });
        })
      );
      return;
    }
  }

  // Handle same-origin requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Activate event
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
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 