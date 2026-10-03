// Service worker do app instalável (PWA).
//
// O que faz: quando uma PÁGINA não carrega por falta de internet, mostra /offline.html.
// O que NÃO faz, de propósito: guardar páginas ou dados de alunos no aparelho (um celular
// emprestado ou compartilhado exporia dados de saúde). Tudo continua vindo do servidor.
//
// Ao mudar este arquivo, suba a versão do CACHE para o navegador trocar a cópia antiga.
const CACHE = "mf-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Arquivos da própria tela "sem internet" (o logo): vêm da cópia guardada.
  if (request.method === "GET" && url.origin === self.location.origin && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
    return;
  }
  // Abertura de páginas: tenta a internet; sem ela, a tela "sem internet".
  // Imagens, dados e envios seguem direto para a internet.
  if (request.mode !== "navigate") return;
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});
