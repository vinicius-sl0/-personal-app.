// Service worker do app instalável (PWA).
//
// O que faz: (1) quando uma PÁGINA não carrega por falta de internet, mostra /offline.html;
// (2) recebe os avisos no celular (push) e, ao tocar, abre a tela certa.
// O que NÃO faz, de propósito: guardar páginas ou dados de alunos no aparelho (um celular
// emprestado ou compartilhado exporia dados de saúde). Tudo continua vindo do servidor.
//
// Ao mudar este arquivo, suba a versão do CACHE para o navegador trocar a cópia antiga.
const CACHE = "mf-offline-v2";
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

// ---------------------------------------------------------------------
// Avisos no celular (push). O conteúdo vem de src/lib/push.ts: { title, body, url, tag }.
// ---------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Novo aviso";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined, // avisos do mesmo tipo se substituem em vez de empilhar
      renotify: Boolean(data.tag),
      data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/login" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/login", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Se o app já está aberto, usa a mesma janela; senão, abre uma nova.
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.focus().then((w) => (w || open).navigate(target));
      return self.clients.openWindow(target);
    }),
  );
});
