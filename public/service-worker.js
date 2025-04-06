self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open("snakkaz-cache-v1").then((cache) => {
        return cache.addAll([
          "/",
          "/index.html",
          "/manifest.json",
          "/icons/snakkaz-icon-192.png",
          "/icons/snakkaz-icon-512.png"
        ]);
      })
    );
  });
  
  self.addEventListener("fetch", (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  