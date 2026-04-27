const CACHE_NAME = 'img-extractor-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/manifest-icon-192.maskable.png',
  '/manifest-icon-512.maskable.png',
  '/favicon-196.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
