/*
 * Service worker do Wallet.
 *
 * Escopo deliberadamente pequeno, porque o app mostra dados financeiros:
 *
 * - Páginas (navegações) vão SEMPRE à rede e nunca são guardadas em cache —
 *   num celular compartilhado, o saldo de alguém não pode reaparecer offline
 *   depois de sair da conta. Sem rede, mostra a página /offline.html.
 * - Arquivos estáticos com hash no nome (/_next/static) e ícones são
 *   imutáveis: cache-first, para o app abrir rápido.
 * - Server Actions (POST) e qualquer outra requisição passam direto.
 *
 * Troque VERSION para descartar os caches antigos em um deploy.
 */
const VERSION = 'v1';
const STATIC_CACHE = `wallet-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('wallet-') && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error()),
      ),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
