// Gerência de Enfermagem — service worker (v3)
//
// O que mudou em relação à versão anterior (3 problemas, todos de cache):
//   1) Os arquivos do app (js/*.js, css/app.css, canon.js...) eram servidos do cache SEM nunca conferir se existia versão
//      nova, e o nome do cache nunca mudava. Resultado: depois de publicar, o app seguia com o código velho. Agora
//      todo arquivo do app vem da REDE primeiro (e o navegador revalida com o servidor, sem usar cópia do cache HTTP);
//      o cache só serve quando está sem internet.
//   2) Abrir remocao.html sobrescrevia a "cópia do index.html" no cache (sem internet, o Kanban abriria a planilha).
//      Agora cada página/arquivo é guardado com o próprio endereço.
//   3) Cada checagem de versão (a cada 10 min e ao voltar para a aba) guardava mais uma cópia de version.json no cache.
//      Agora version.json nunca passa por aqui: vai sempre direto à rede, que é o que o aviso de versão nova precisa.
//
// A fonte de verdade da versão continua sendo o version.json. Este arquivo só precisa mudar quando a LÓGICA do
// service worker mudar (por isso o nome do cache é fixo e não acompanha a versão do app).
const APP_VERSION = '2026.10.02-16';   // só informativo (mensagem GET_VERSION); quem avisa de versão nova é o version.json
const CACHE = 'ge-app-v3';

// Caminhos relativos ao escopo do SW — funcionam em qualquer subpasta.
const ASSETS = ['./', './index.html', './manifest.json', './canon.js'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll é atômico: um 404 derruba o install inteiro.
    // Individual + allSettled deixa o SW instalar mesmo se um asset faltar.
    await Promise.allSettled(ASSETS.map(u => c.add(new Request(u, { cache: 'reload' }))));
    // NÃO chamamos skipWaiting aqui: o app pergunta ao usuário antes de trocar.
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // apaga TODOS os caches de versões anteriores (inclusive o "ge-2026.09.14-3", que guardava código velho)
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// O app manda esta mensagem quando o usuário aceita atualizar.
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'GET_VERSION') {
    e.source && e.source.postMessage({ type: 'VERSION', version: APP_VERSION });
  }
});

// Endereço usado como chave no cache: sem "?v=..." nem "#...", para guardar uma só cópia de cada arquivo.
function chaveDe(url) {
  const u = new URL(url);
  u.search = '';
  u.hash = '';
  return u.href;
}

// Arquivos do próprio app: REDE primeiro. O cache só entra quando a rede falha (sem internet).
async function redePrimeiro(req) {
  const cache = await caches.open(CACHE);
  const chave = chaveDe(req.url);
  try {
    // cache:'no-cache' = confere com o servidor a cada vez (resposta 304 se nada mudou), em vez de aceitar a cópia que
    // o navegador guardou por alguns minutos. Em navegação (abrir a página) não se pode passar opções ao fetch, então
    // se cria um pedido novo equivalente.
    const res = req.mode === 'navigate'
      ? await fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }))
      : await fetch(req, { cache: 'no-cache' });
    if (res && res.ok) cache.put(chave, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const guardado = await cache.match(chave);
    if (guardado) return guardado;
    // abrir "/" sem internet: usa a cópia do index.html
    if (new URL(req.url).pathname.endsWith('/')) {
      const raiz = await cache.match('./index.html');
      if (raiz) return raiz;
    }
    return Response.error();
  }
}

// Arquivos de outros sites (bibliotecas em CDN, versão fixa na URL): cache primeiro, para abrir rápido.
async function cachePrimeiro(req) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req);
  if (guardado) return guardado;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = req.url;

  if (!url.startsWith('http://') && !url.startsWith('https://')) return;
  if (req.method !== 'GET') return;

  const u = new URL(url);

  // A página de reset nunca pode ser servida do cache.
  if (u.pathname.endsWith('/reset.html')) return;

  // Supabase sempre na rede.
  if (url.includes('supabase.co')) return;

  // O aviso de versão nova depende de ler o version.json SEMPRE fresco: nunca passa pelo cache.
  if (u.pathname.endsWith('/version.json')) return;

  // Arquivos do app (páginas, js, css, canon.js, manifest, ícones): rede primeiro.
  if (u.origin === self.location.origin) {
    e.respondWith(redePrimeiro(req));
    return;
  }

  // Bibliotecas de CDN: cache primeiro.
  e.respondWith(cachePrimeiro(req));
});
