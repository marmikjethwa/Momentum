const CACHE_NAME = "momentum-cache-v1";
const urlsToCache = [
  "index.html",
  "dashboard.html",
  "style.css",
  "script.js",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  "offline.html"
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event: Serve files from cache if offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request) || caches.match("offline.html"))
  );
});

// Activate event: Remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
