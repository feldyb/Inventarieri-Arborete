const CACHE_NAME = "arbori-cache-v1";

// Fișierele statice locale ce pot fi pre-cache-uite
const FILES_TO_CACHE = [
  "/",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon.png"
];

self.addEventListener("install", event => {
  console.log("📦 [ServiceWorker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("✅ [ServiceWorker] Pre-caching offline files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("🔁 [ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🧹 [ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🗺️ Ignoră tile-urile Leaflet (nu le cache-uim)
  if (url.includes("tile.openstreetmap.org")) {
    return; // lăsăm browserul să le gestioneze direct
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});