// Service worker v2 — à prova de "tela branca" por cache velho.
// HTML: network-first (sempre pega o index fresco com os hashes atuais).
// Assets versionados por hash: cache-first (são imutáveis).
const CACHE = 'garagem-acai-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // apaga caches de versões anteriores (ex.: a v1 que causava o branco)
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const isHTML = req.mode === 'navigate' || req.destination === 'document';

  if (isHTML) {
    // network-first: garante index.html atualizado; cai no cache só se offline
    e.respondWith(
      fetch(req)
        .then((res) => { const c = res.clone(); caches.open(CACHE).then((ch) => ch.put(req, c)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // assets (JS/CSS/img com hash): cache-first
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const c = res.clone(); caches.open(CACHE).then((ch) => ch.put(req, c));
      }
      return res;
    }))
  );
});
