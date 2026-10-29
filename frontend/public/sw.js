// Instagram Tracker PWA - High-Performance Service Worker
const CACHE_NAME = 'ig-tracker-cache-v6';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Install Event: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA SW] Deleting obsolete cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Smart routing & caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Non-GET requests (POST, PUT, DELETE, OPTIONS) -> bypass straight to network
  if (req.method !== 'GET') {
    return;
  }

  // 2. Dynamic API endpoints, tunnels, or external media (Instagram CDN, Ngrok) -> Network only
  if (
    url.pathname.startsWith('/api/') || 
    url.hostname.includes('ngrok') || 
    url.hostname.includes('trycloudflare') || 
    url.hostname.includes('fbcdn.net') || 
    url.hostname.includes('cdninstagram.com')
  ) {
    return; // Let browser handle normally
  }

  // 3. Navigation requests (Opening the app / page refresh / deep links) -> App Shell Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((networkRes) => {
        // 如果网络请求返回 404 (SPA 路由单页)，立即回退到 index.html
        if (networkRes.status === 404) {
          return caches.match('/index.html').then((fallback) => fallback || fetch('/index.html'));
        }
        return networkRes;
      }).catch(async () => {
        const fallback = await caches.match('/index.html');
        return fallback || fetch('/index.html');
      })
    );
    return;
  }

  // 4. Static assets (JS, CSS, SVGs, Images, Fonts) -> Cache First with background revalidation
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => null);

      return cachedRes || fetchPromise;
    })
  );
});
