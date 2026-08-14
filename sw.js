// Nom de cache : changez ce numéro si vous modifiez les fichiers de
// l'application (index.html, style.css, app.js) pour forcer la mise à jour.
const CACHE_NAME = "medicaments-app-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./abdo_background.png"
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Installation : met en cache les fichiers de l'application (pas le CSV,
// qui doit toujours être vérifié en priorité sur le réseau)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie de récupération :
// - medicaments.csv : réseau en priorité (pour avoir les données à jour dès
//   qu'il y a du réseau), puis copie de secours en cache si hors-ligne.
// - autres fichiers : cache en priorité, réseau en secours.
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith("medicaments.csv")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
