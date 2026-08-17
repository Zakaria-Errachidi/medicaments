// Nom de cache : changez ce numéro si vous modifiez les fichiers de
// l'application (HTML/CSS/JS/images) pour forcer la mise à jour chez
// les personnes qui l'ont déjà installée.
const CACHE_NAME = "sante-app-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/tab-medicaments.png",
  "./images/tab-aliments.png",
  "./images/tab-symptomes.png",
  "./images/aliments-banner.jpg"
];

// Installation : met en cache les fichiers de l'application (pas les
// CSV, qui doivent toujours être vérifiés en priorité sur le réseau)
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
// - tous les fichiers .csv (medicaments/aliments/symptomes) : réseau en
//   priorité pour avoir les données à jour dès qu'il y a du réseau,
//   avec copie de secours en cache si hors-ligne.
// - autres fichiers : cache en priorité, réseau en secours.
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith(".csv")) {
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
