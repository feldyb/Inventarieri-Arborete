const CACHE_NAME = "arbori-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon.png"
];

self.addEventListener("install", event => {
  console.log("📦 [SW] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("🧹 [SW] Activate");
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🎯 Nu cache-uim tile-urile Leaflet
  if (url.includes("tile.openstreetmap.org")) return;

  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});