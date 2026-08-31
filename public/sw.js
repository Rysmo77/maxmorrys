/**
 * Service worker de Rysmo — l'application installable.
 *
 * SA RAISON D'ÊTRE TIENT EN UNE PHRASE : le forfait est compté. Le panier de données 2 Go
 * coûte en médiane 4,2 % du revenu national brut par habitant en Afrique. Ce fichier ne sert
 * pas à rendre l'application « plus rapide » — il sert à ce qu'une leçon déjà payée en
 * données ne se repaie pas à chaque relecture.
 *
 * TROIS RÈGLES, et elles découlent toutes de la même contrainte.
 *
 *   1. RIEN N'EST MIS EN CACHE SANS QU'ON L'AIT DEMANDÉ, sauf la coquille. Un service worker
 *      qui précharge « pour être utile » dépense l'argent de quelqu'un d'autre.
 *   2. LE RÉSEAU D'ABORD POUR LES DONNÉES, le cache d'abord pour ce qui ne change pas. Une
 *      leçon lue hors connexion doit être la leçon, pas une version d'il y a trois semaines
 *      dont personne ne saurait dire l'âge.
 *   3. CHAQUE RESSOURCE CONNAÎT SON POIDS. C'est ce qui permet à l'écran hors connexion de
 *      l'afficher en monospace — un nombre vérifiable, mesuré sur la réponse elle-même, et
 *      donc affichable (règle 6).
 */

const VERSION = 'v1';
const SHELL = `mm-shell-${VERSION}`;   // la coquille : ce qui permet d'ouvrir l'app sans réseau
const LESSONS = `mm-lessons-${VERSION}`; // ce que la personne a explicitement gardé
const CACHES = [SHELL, LESSONS];

/* La coquille minimale. Volontairement courte : tout ce qui entre ici est téléchargé à
   l'installation, donc payé, par tout le monde, avant d'avoir servi à qui que ce soit. */
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // On ne garde que les caches de la version courante : un cache orphelin occupe un espace
  // qui, sur un téléphone d'entrée de gamme, manque ailleurs.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mm-') && !CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Une réponse mise en cache porte son poids et sa date : l'écran hors connexion les affiche. */
async function stamp(response, url) {
  const body = await response.clone().blob();
  const headers = new Headers(response.headers);
  headers.set('x-mm-bytes', String(body.size));
  headers.set('x-mm-cached-at', new Date().toISOString());
  headers.set('x-mm-url', url);
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Firestore, l'authentification et les fonctions ne se mettent JAMAIS en cache : une
  // réponse d'authentification rejouée est un défaut de sécurité, pas une optimisation.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__/') || url.pathname.includes('/api/')) return;

  // Les ressources versionnées par empreinte ne changent jamais sous une même URL :
  // le cache d'abord, et rien ne se revalide.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request).then((res) => {
        if (res.ok) caches.open(SHELL).then((c) => c.put(request, res.clone()));
        return res;
      })),
    );
    return;
  }

  // Navigation : le réseau d'abord, la coquille en secours. Sans ça, une personne hors
  // connexion voit la page d'erreur du navigateur au lieu de son application.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((hit) => hit ?? Response.error())),
    );
  }
});

/**
 * Les deux ordres que l'application peut donner.
 *
 * `KEEP_OFFLINE` est déclenché par une action explicite — « garde cette leçon » — jamais par
 * une heuristique. `FORGET_OFFLINE` doit toujours exister en face : proposer de garder sans
 * proposer d'oublier revient à décider de l'espace de quelqu'un d'autre.
 */
self.addEventListener('message', (event) => {
  const { type, urls, url } = event.data ?? {};

  if (type === 'KEEP_OFFLINE' && Array.isArray(urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(LESSONS);
      let bytes = 0;
      for (const u of urls) {
        try {
          const res = await fetch(u, { cache: 'reload' });
          if (!res.ok) continue;
          const stamped = await stamp(res, u);
          bytes += Number(stamped.headers.get('x-mm-bytes') ?? 0);
          await cache.put(u, stamped);
        } catch {
          // Une ressource qui échoue n'annule pas les autres : garder trois leçons sur quatre
          // vaut mieux que n'en garder aucune parce que la quatrième a expiré.
        }
      }
      event.source?.postMessage({ type: 'KEPT', urls, bytes });
    })());
  }

  if (type === 'FORGET_OFFLINE' && url) {
    event.waitUntil(caches.open(LESSONS).then((c) => c.delete(url)).then(() => {
      event.source?.postMessage({ type: 'FORGOTTEN', url });
    }));
  }
});
