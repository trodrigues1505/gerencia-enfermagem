const CACHE = 'ge-v2';
const ASSETS = [
  '/gerencia-enfermagem/',
  '/gerencia-enfermagem/index.html',
  '/gerencia-enfermagem/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Ignora schemes não suportados pelo Cache API
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // Supabase sempre vai para a rede
  if (url.includes('supabase.co')) return;

  // CDNs externos (React, html2canvas) — cache com fallback de rede
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => {
            try { c.put(e.request, clone); } catch(err) {}
          });
        }
        return res;
      });
    })
  );
});
