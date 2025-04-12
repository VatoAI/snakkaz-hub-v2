
const CACHE_NAME = 'snakkaz-cache-v1';
const ALLOWED_ORIGINS = [
  'https://snakkaz.com',
  'https://wqpoozpbceucynsojmbk.supabase.co',
  'https://static.cloudflareinsights.com'
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
    // Check if the origin is allowed
    if (ALLOWED_ORIGINS.includes(url.origin)) {
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
        }).catch(error => {
          console.error('Fetch error:', error);
          return new Response(null, { status: 500 });
        })
      );
    } else {
      // Block requests from non-allowed origins
      event.respondWith(new Response(null, { status: 403 }));
    }
    return;
  }

  // Handle same-origin requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
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
