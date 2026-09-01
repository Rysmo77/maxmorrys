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

/**
 * « Garde cette leçon » — une action explicite, jamais une heuristique.
 *
 * C'EST LE SEUL ENDROIT DU PRODUIT QUI DÉPENSE DU FORFAIT SUR DÉCISION DU PRODUIT. La
 * préférence « télécharger en Wi-Fi seulement » se lit donc ICI, et pas dans le service
 * worker, qui ne met rien en cache de lui-même et ne sait pas lire `localStorage`.
 *
 * Retourne `null` quand la demande est partie, et sinon POURQUOI elle ne l'est pas — un
 * refus silencieux laisserait croire à un téléchargement en cours. Voir `KeepRefusal` et le
 * bloc « Wi-Fi seulement » plus bas.
 */
export function keepOffline(urls: string[]): KeepRefusal | null {
  if (!offlineSupported()) return 'unsupported';
  if (!urls.length) return 'empty';
  // On ne refuse QUE sur un fait : le navigateur a dit « données mobiles ». Jamais sur une
  // supposition — voir `connectionKind()`.
  if (wifiOnly() && connectionKind() === 'cellular') return 'wifi-only';
  send({ type: 'KEEP_OFFLINE', urls });
  return null;
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

/* ══════════════════════════════════════════════════════════════════════════════
   1 · « TÉLÉCHARGER EN WI-FI SEULEMENT » — LE RÉGLAGE QUI COMPTE EN ARGENT
   ══════════════════════════════════════════════════════════════════════════════

   Sur ce marché, le panier de données 2 Go coûte en médiane 4,2 % du revenu national brut
   par habitant. Ce réglage n'est donc pas une commodité de confort : c'est le seul endroit du
   produit où quelqu'un décide de ne PAS dépenser son forfait.

   OÙ IL DOIT ÊTRE CONSULTÉ, ET NULLE PART AILLEURS. Le service worker ne met RIEN en cache de
   sa propre initiative — voir l'en-tête de `public/sw.js`, règle 1 : « rien n'est mis en cache
   sans qu'on l'ait demandé, sauf la coquille ». La seule dépense de données décidée par le
   produit passe donc par `keepOffline()`, et c'est là que la préférence s'applique. Un service
   worker ne peut de toute façon pas lire `localStorage` ; lui faire porter le réglage aurait
   demandé un canal de messages pour un contrôle qui a déjà lieu du bon côté.

   CE QU'ELLE PEUT RÉELLEMENT REFUSER, ET CE QU'ELLE NE PEUT PAS. Refuser un téléchargement
   demande de SAVOIR qu'on est en données mobiles. Seul `navigator.connection.type` le dit, et
   il n'existe que sur Chromium Android — c'est-à-dire sur le navigateur majoritaire du marché
   visé, mais pas sur iOS ni sur les navigateurs de bureau, où l'objet est absent ou muet.
   Le réglage ne devine JAMAIS : hors de ce cas, il ne refuse rien, et l'écran le dit au lieu
   de faire semblant (`wifiOnlyEnforceable()`). Un réglage qui ne règle rien sans le dire est
   un mensonge de plus, et c'est précisément ce que cet écran existe pour ne pas être. */

const WIFI_ONLY_KEY = 'mm-wifi-only';

/** Ce que le navigateur veut bien dire du lien réseau. Rien de plus n'est deviné. */
export type ConnectionKind = 'wifi' | 'cellular' | 'unknown';

/** La part de `NetworkInformation` qu'on lit — le type ne vit pas dans lib.dom. */
interface NetworkInformationLike {
  type?: string;
}

function connection(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

/**
 * Le type de lien, quand il est connu. `unknown` n'est pas un défaut : c'est la réponse
 * honnête de la plupart des navigateurs, et elle vaut mieux qu'une supposition qui bloquerait
 * un téléchargement en Wi-Fi ou en laisserait passer un en données mobiles.
 */
export function connectionKind(): ConnectionKind {
  const t = connection()?.type;
  if (t === 'wifi' || t === 'ethernet') return 'wifi';
  if (t === 'cellular' || t === 'wimax') return 'cellular';
  return 'unknown';
}

/** L'appareil sait-il distinguer Wi-Fi et données mobiles ? Sinon, le réglage ne peut rien tenir. */
export function wifiOnlyEnforceable(): boolean {
  return connection()?.type !== undefined;
}

/**
 * L'état du réglage. Vrai PAR DÉFAUT : sur ce marché, la frugalité est le comportement
 * attendu, et c'est à qui veut dépenser son forfait de le dire, pas l'inverse.
 */
export function wifiOnly(): boolean {
  try {
    return localStorage.getItem(WIFI_ONLY_KEY) !== 'off';
  } catch {
    // Stockage inaccessible (navigation privée) : on retombe sur le défaut frugal.
    return true;
  }
}

export function setWifiOnly(on: boolean): void {
  try {
    localStorage.setItem(WIFI_ONLY_KEY, on ? 'on' : 'off');
  } catch {
    // Rien à écrire : le réglage vaudra le défaut à la prochaine ouverture, et l'écran le dira.
  }
}

/** Pourquoi une demande de mise en cache n'est pas partie. `null` = elle est partie. */
export type KeepRefusal = 'unsupported' | 'empty' | 'wifi-only';

/* ══════════════════════════════════════════════════════════════════════════════
   2 · LA FILE « EN ATTENTE D'ENVOI »
   ══════════════════════════════════════════════════════════════════════════════

   Ce qu'elle garde : les gestes faits SANS RÉSEAU — une leçon terminée, une note écrite, un
   article enregistré. Ce qu'elle vaut : « un parcours interrompu et repris des jours plus
   tard reste un parcours valide ». Sans elle, une leçon finie dans un taxi sans réseau n'a
   jamais eu lieu, et c'est la personne qui paie la panne.

   ── POURQUOI `localStorage` ET PAS IndexedDB ────────────────────────────────────────────

   D'abord, pourquoi PAS la mémoire : une file en mémoire disparaît au rechargement,
   c'est-à-dire exactement au moment où elle sert. Un onglet tué par le système sur un
   appareil à 2 Go — *le* profil du marché — emporterait tout ce qui attendait.

   Ensuite, `localStorage` contre IndexedDB, et le point qui tranche est l'ÉCRITURE SYNCHRONE.
   Une entrée se pose à l'instant du geste ; si l'onglet est fermé, tué ou rechargé dans la
   seconde, une transaction IndexedDB peut ne jamais s'être validée, tandis qu'un
   `setItem` est déjà écrit quand la ligne suivante s'exécute. Une file dont l'écriture peut
   se perdre au pire moment ne vaut pas mieux que pas de file du tout.

   Trois raisons de plus, dans l'ordre : le volume est minuscule (une intention = un type, un
   libellé, un instant — quelques dizaines d'octets, jamais un média) ; le dépôt range déjà
   son état local durable là (`mm-cart-pending`, `mm-cookie-consent`, `mm-lang`), donc un seul
   mécanisme et un seul mode de panne à connaître ; et la lecture synchrone permet à l'écran
   de rendre la file au premier passage, sans état de chargement à inventer.

   CE QUE ÇA COÛTE, ET COMMENT C'EST BORNÉ. `localStorage` a un quota partagé (~5 Mo) : une
   file qui grossit sans fin ne casserait pas que la file, elle ferait échouer l'écriture du
   consentement et de la langue. D'où `OUTBOX_MAX`, et un abandon qui sacrifie la PLUS
   ANCIENNE entrée — jamais la plus récente, qui est celle que la personne vient de faire. */

const OUTBOX_KEY = 'mm-outbox';

/**
 * Le plafond de la file. Deux cents intentions, c'est déjà bien au-delà d'une session
 * d'apprentissage hors réseau ; au-delà, on protège le quota partagé plutôt que la file.
 */
export const OUTBOX_MAX = 200;

/**
 * Les trois gestes que la maquette nomme, et pas un quatrième inventé : leçon terminée, note
 * écrite, article enregistré.
 */
export type OutboxKind = 'lesson-done' | 'note' | 'bookmark';

export interface OutboxEntry {
  id: string;
  kind: OutboxKind;
  /**
   * Ce que la personne a fait, écrit au moment du geste, dans sa langue d'alors. On ne le
   * retraduit pas à l'affichage : ce serait réécrire après coup ce qu'elle a vu.
   */
  label: string;
  /**
   * L'instant de mise en file, en millisecondes. « il y a 12 min » en DÉRIVE — c'est une
   * mesure, pas une décoration, et c'est ce qui autorise `<Num>` à l'écrire.
   */
  queuedAt: number;
  /** Où l'intention devra se poser au retour du réseau — identifiant de leçon, d'article… */
  ref?: string;
}

const KINDS: readonly OutboxKind[] = ['lesson-done', 'note', 'bookmark'];

/** Une entrée relue du stockage n'est pas une entrée : elle peut avoir été écrite par une
 *  version précédente, ou éditée à la main. On ne garde que ce qui est complet. */
function isEntry(v: unknown): v is OutboxEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Partial<OutboxEntry>;
  return typeof e.id === 'string'
    && typeof e.label === 'string'
    && typeof e.queuedAt === 'number'
    && Number.isFinite(e.queuedAt)
    && typeof e.kind === 'string'
    && KINDS.includes(e.kind as OutboxKind);
}

function writeOutbox(entries: OutboxEntry[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
  } catch {
    // Quota atteint ou stockage refusé : on ne casse pas le geste en cours. L'écran affiche
    // ce que la file CONTIENT, donc il dira simplement qu'elle n'a pas grossi.
  }
}

/**
 * La file, dans son ORDRE DE DÉPART : la plus ancienne d'abord.
 *
 * C'est l'ordre qui compte, pas la fraîcheur. Rejouer une note avant la leçon qu'elle
 * annote produirait un état que personne n'a jamais vécu.
 */
export function readOutbox(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => a.queuedAt - b.queuedAt);
  } catch {
    return [];
  }
}

/**
 * Met un geste en file. Retourne l'entrée écrite, ou `null` si le stockage n'a rien voulu.
 *
 * ⚠️ Elle enregistre une INTENTION, elle ne l'envoie pas. Voir `flushOutbox` : tant qu'aucun
 * expéditeur n'est branché pour un type de geste, la file le garde et l'écran le dit.
 */
export function queueOffline(kind: OutboxKind, label: string, ref?: string): OutboxEntry | null {
  const entry: OutboxEntry = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    label,
    queuedAt: Date.now(),
    ...(ref ? { ref } : null),
  };
  // On sacrifie la PLUS ANCIENNE : la plus récente est celle que la personne vient de faire,
  // et la perdre sous ses yeux serait le pire des deux abandons.
  const next = [...readOutbox(), entry].slice(-OUTBOX_MAX);
  writeOutbox(next);
  return next.includes(entry) ? entry : null;
}

/** Retire une entrée — relue depuis le stockage, jamais depuis une copie en mémoire, pour ne
 *  pas écraser un geste posé entre-temps par un autre onglet. */
export function dropFromOutbox(id: string): void {
  writeOutbox(readOutbox().filter((e) => e.id !== id));
}

/** Vide la file. Un geste d'administration, pas un bouton d'écran : ce qui part doit partir. */
export function clearOutbox(): void {
  writeOutbox([]);
}

/**
 * L'âge d'une entrée, MESURÉ, dans l'unité qui se lit le mieux.
 *
 * C'est cette valeur que l'écran passe à `<Num>` : « il y a 12 min » n'est pas une formule de
 * politesse, c'est `queuedAt` soustrait de l'instant du relevé. Les mots autour vivent dans
 * les catalogues de langue, jamais ici.
 */
export interface OutboxAge {
  unit: 'minutes' | 'hours' | 'days';
  value: number;
}

export function outboxAge(queuedAt: number, now: number = Date.now()): OutboxAge {
  const minutes = Math.max(0, Math.floor((now - queuedAt) / 60000));
  if (minutes < 60) return { unit: 'minutes', value: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', value: hours };
  return { unit: 'days', value: Math.floor(hours / 24) };
}

/**
 * Ce qui sait envoyer un geste. `true` = c'est passé, l'entrée sort de la file. `false` ou une
 * exception = ça n'est pas passé, l'entrée RESTE.
 */
export type OutboxSender = (entry: OutboxEntry) => Promise<boolean>;

let sender: OutboxSender | null = null;

/**
 * Y a-t-il quelqu'un pour rejouer la file ?
 *
 * L'écran le demande, et il change ce qu'il écrit selon la réponse. AUJOURD'HUI, PERSONNE :
 * aucun module du dépôt n'appelle `startOutboxFlush`. C'est délibéré — brancher un rejeu sur
 * des écritures Firestore qu'on n'a pas lues, c'est promettre un envoi qui peut écrire
 * n'importe quoi. Mieux vaut une file honnête, qui garde l'intention et le DIT, qu'un rejeu
 * qui perd des données en silence.
 */
export function outboxReplayReady(): boolean {
  return sender !== null;
}

/**
 * Rejoue la file, la plus ancienne d'abord, et S'ARRÊTE AU PREMIER ÉCHEC.
 *
 * L'arrêt n'est pas une timidité : la file est ordonnée, et sauter l'entrée qui coince pour
 * envoyer la suivante produirait un état que personne n'a vécu — une note posée sur une leçon
 * que le serveur croit encore en cours. Ce qui n'est pas passé reste, et repartira au prochain
 * retour du réseau.
 */
export async function flushOutbox(send: OutboxSender): Promise<{ sent: number; kept: number }> {
  let sent = 0;
  for (const entry of readOutbox()) {
    let ok = false;
    try {
      ok = await send(entry);
    } catch (error: unknown) {
      console.error('flushOutbox', error);
      ok = false;
    }
    if (!ok) break;
    dropFromOutbox(entry.id);
    sent += 1;
  }
  return { sent, kept: readOutbox().length };
}

/**
 * Branche le rejeu sur le retour du réseau — « la file part au retour du réseau, sans rien te
 * demander ». Rend la fonction qui débranche.
 *
 * ⚠️ Rien ne l'appelle encore, et c'est le sujet : le jour où quelqu'un l'appelle, il apporte
 * un `send` qui sait écrire CE type de geste. Tant que ce jour n'est pas venu, la file garde
 * et l'écran l'annonce (`outboxReplayReady()`).
 */
export function startOutboxFlush(send: OutboxSender): () => void {
  sender = send;
  const run = () => { void flushOutbox(send); };
  window.addEventListener('online', run);
  // Le réseau peut déjà être là au moment du branchement : ne pas rejouer maintenant
  // ferait attendre la file jusqu'à la prochaine coupure.
  if (navigator.onLine) run();
  return () => {
    window.removeEventListener('online', run);
    if (sender === send) sender = null;
  };
}
