/**
 * Le côté application du hors-connexion. Le service worker (`public/sw.js`) fait le travail ;
 * ce module lui parle, et rend ce qu'il garde LISIBLE.
 *
 * La règle 6 gouverne tout ce fichier : chaque poids affiché est MESURÉ sur la réponse
 * elle-même, pas estimé. C'est ce qui autorise l'écran hors connexion à l'écrire en
 * monospace — et ce qui empêche d'afficher « environ 4 Mo » à quelqu'un qui décide s'il peut
 * se le permettre.
 */

export interface KeptResource {
  url: string;
  /** Mesuré sur la réponse mise en cache, jamais estimé. */
  bytes: number;
  /** Quand elle a été gardée. Toute valeur affichée porte sa date. */
  cachedAt: Date;
}

const LESSONS_CACHE = 'mm-lessons-v1';

/** L'appareil sait-il seulement faire ça ? Safari en navigation privée, par exemple, non. */
export function offlineSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;
}

export async function registerServiceWorker(): Promise<void> {
  if (!offlineSupported()) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error: unknown) {
    // Un enregistrement qui échoue ne casse rien : l'application marche en ligne comme avant.
    console.error('serviceWorker.register', error);
  }
}

/** Ce qui est réellement gardé, avec le poids mesuré de chaque ressource. */
export async function listKept(): Promise<KeptResource[]> {
  if (!offlineSupported()) return [];
  try {
    const cache = await caches.open(LESSONS_CACHE);
    const requests = await cache.keys();
    const out: KeptResource[] = [];
    for (const req of requests) {
      const res = await cache.match(req);
      if (!res) continue;
      out.push({
        url: res.headers.get('x-mm-url') ?? req.url,
        bytes: Number(res.headers.get('x-mm-bytes') ?? 0),
        cachedAt: new Date(res.headers.get('x-mm-cached-at') ?? Date.now()),
      });
    }
    return out.sort((a, b) => b.cachedAt.getTime() - a.cachedAt.getTime());
  } catch (error: unknown) {
    console.error('listKept', error);
    return [];
  }
}

/** Le total, mesuré. Zéro est une valeur, et s'affiche. */
export async function keptBytes(): Promise<number> {
  return (await listKept()).reduce((n, r) => n + r.bytes, 0);
}

function send(message: Record<string, unknown>): void {
  navigator.serviceWorker?.controller?.postMessage(message);
}

/** « Garde cette leçon » — une action explicite, jamais une heuristique. */
export function keepOffline(urls: string[]): void {
  if (urls.length) send({ type: 'KEEP_OFFLINE', urls });
}

/**
 * « Oublie-la ». Toujours proposé en face de « garde » : offrir de remplir l'espace de
 * quelqu'un sans offrir de le libérer, c'est décider à sa place.
 */
export function forgetOffline(url: string): void {
  send({ type: 'FORGET_OFFLINE', url });
}

/**
 * Un poids en octets, tel qu'il s'écrit.
 *
 * Le séparateur décimal suit la langue, comme le séparateur de milliers ailleurs. On reste en
 * Ko sous 1 Mo : « 0,4 Mo » se compare mal à « 12 Mo », et c'est précisément une comparaison
 * qu'on demande à quelqu'un de faire avec son forfait en tête.
 */
export function formatBytes(bytes: number, locale: 'fr' | 'en' = 'fr'): string {
  const dec = locale === 'en' ? '.' : ',';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', dec)} Mo`;
}
