/**
 * KOMA Fast Food & PDV - Service Worker
 * Implementa estratégia 'Cache-First' para ativos estáticos e 'Network-First' para requisições de API,
 * garantindo suporte offline robusto conforme as melhores práticas de PWA.
 */

const STATIC_CACHE_NAME = 'koma-pos-static-v5';
const API_CACHE_NAME = 'koma-pos-api-v5';

// Ativos fundamentais do Shell da aplicação para pré-cache na instalação
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Extensões de arquivos consideradas ativos estáticos
const STATIC_FILE_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i;

// 1. INSTALAÇÃO (INSTALL): Pré-cache do app shell e ativação imediata
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Aviso de pré-cache (arquivos dinâmicos serão cacheados sob demanda):', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. ATIVAÇÃO (ACTIVATE): Limpeza de caches obsoletos e controle imediato de clientes
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            console.log('[SW] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. INTERCEPTAÇÃO DE REQUISIÇÕES (FETCH)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora esquemas que não sejam HTTP/HTTPS (ex: chrome-extension, data:)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // -------------------------------------------------------------
  // ESTRATÉGIA A: 'Network-First' para requisições de API (/api/*)
  // Tenta a rede primeiro; em caso de falha/offline, busca no cache
  // -------------------------------------------------------------
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Salva resposta válida em cache apenas para consultas GET
          if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Falha na rede: tenta responder com a versão salva em cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Se não houver nada no cache, retorna resposta estruturada de fallback offline
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Operando em modo offline. O terminal PDV está utilizando persistência local com idb.',
              status: 'cached_offline_fallback',
              timestamp: new Date().toISOString()
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // -------------------------------------------------------------
  // ESTRATÉGIA B: Navegação SPA (HTML Entry Point)
  // Cache-First com fallback de rede para garantir abertura offline instantânea
  // -------------------------------------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedHtml = await caches.match('/index.html');
          if (cachedHtml) {
            return cachedHtml;
          }
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>KOMA PDV Offline</title></head><body><h1>KOMA PDV - Modo Offline</h1><p>Sistema operando localmente.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // -------------------------------------------------------------
  // ESTRATÉGIA C: 'Cache-First' para ativos estáticos (JS, CSS, Imagens, Fontes)
  // Busca no cache primeiro; se não existir, busca na rede e armazena
  // -------------------------------------------------------------
  const isStaticAsset =
    STATIC_FILE_EXTENSIONS.test(url.pathname) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com') ||
    PRECACHE_ASSETS.includes(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Retorno imediato do cache
          return cachedResponse;
        }

        // Cache miss: busca na rede e armazena
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
          });
      })
    );
    return;
  }

  // Fallback padrão para demais requisições
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. BACKGROUND SYNC: Dispara sincronização em segundo plano quando a rede retorna
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-sync-sales' || event.tag === 'pos-sync-all') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});

// 5. PERIODIC SYNC: Verificação periódica de conectividade e sincronização
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pos-periodic-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});

// 6. MENSAGENS ENTRE JANELAS E SERVICE WORKER
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'TRIGGER_SYNC_NOW') {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
      });
    });
  }
});
