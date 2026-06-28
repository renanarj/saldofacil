// ================================================
// SALDO FÁCIL — Service Worker
// Offline-first PWA caching strategy
// ================================================

const CACHE_VERSION = 'sf-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/firebase/config.js',
  '/src/services/auth.service.js',
  '/src/services/firestore.service.js',
  '/src/components/ui.js',
  '/src/pages/auth.js',
  '/src/pages/app.js',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png'
];

// ─── Install ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
});

// ─── Activate ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove old caches
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
              .map(k => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ─── Fetch ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (Firebase API calls)
  if (request.method !== 'GET') return;
  if (!url.origin.match(/localhost|saldofacil/)) return;

  // Network-first for HTML pages (always fresh)
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first with dynamic cache fallback
  event.respondWith(networkFirst(request));
});

// ─── Strategies ──────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso indisponível offline.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for document requests
    if (request.destination === 'document') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Sem conexão com a internet.', { status: 503 });
  }
}
