/**
 * sw.js - Service Worker for HishabNikash (হিসাবনিকাশ)
 * Enables offline caching, fast standalone native app performance.
 */

const CACHE_NAME = 'hishabnikash-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/styles.css',
  './js/state.js',
  './js/charts.js',
  './js/loans.js',
  './js/transactions.js',
  './js/app.js',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external CDN scripts and fonts dynamically
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('cdn') ||
           event.request.url.includes('fonts') ||
           event.request.url.includes('cloudflare'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is for page, return cached index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
