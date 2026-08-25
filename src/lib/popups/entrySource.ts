import { clientProjects } from '../brand';

/**
 * Classification du CONTEXTE D'ARRIVÉE d'un visiteur — source unique.
 *
 * Le `document.referrer` n'est fiable qu'au tout premier chargement de la session : il survit
 * aux changements de route SPA (il appartient au document, pas à l'historique), mais un simple
 * rechargement le remplace par notre propre origine. La classification est donc faite UNE FOIS
 * puis mémorisée en `sessionStorage`.
 *
 * ⚠️ Ce module ne porte que des règles de détection, jamais de texte affichable ni de décision
 * d'affichage. La décision vit dans `rules.ts` et dans `components/popups/PopupManager.tsx`.
 */

export type EntrySource = 'search' | 'clientFooter' | 'social' | 'direct' | 'unknown';

const STORAGE_KEY = 'mm-entry-source';

/**
 * Marqueur de lien de signature posé dans le pied de page des sites construits par l'agence.
 * Voie CANONIQUE : `?utm_source=<client>&utm_medium=footer-signature`. La détection par domaine
 * ci-dessous n'est qu'un repli pour les sites livrés avant cette convention.
 */
const FOOTER_SIGNATURE_MEDIUM = 'footer-signature';

/**
 * Fragments d'hôte des moteurs de recherche. Écrits avec leur point final pour ne pas
 * confondre `google.` avec un domaine client qui contiendrait la chaîne « google ».
 */
const SEARCH_HOSTS: readonly string[] = [
  'google.',
  'bing.',
  'duckduckgo.',
  'yahoo.',
  'ecosia.',
  'qwant.',
  'brave.',
  'search.marginalia.',
];

/** Fragments d'hôte des plateformes sociales, redirecteurs de liens inclus. */
const SOCIAL_HOSTS: readonly string[] = [
  'facebook.',
  'fb.',
  'instagram.',
  'linkedin.',
  'lnkd.in',
  't.co',
  'twitter.',
  'x.com',
  'youtube.',
  'youtu.be',
  'tiktok.',
  'whatsapp.',
  'telegram.',
  't.me',
  'pinterest.',
  'reddit.',
];

/** Hôte d'une URL, en minuscules, ou `null` si la chaîne n'est pas une URL absolue. */
function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    // Referrer vide ou malformé — cas normal, pas une anomalie à remonter.
    return null;
  }
}

function matchesAny(hostname: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => hostname.includes(fragment));
}

/** Vrai si l'hôte correspond à un domaine client, sous-domaines compris. */
function isClientHost(hostname: string): boolean {
  return clientProjects.some(({ domain }) => {
    const d = domain.toLowerCase();
    return hostname === d || hostname.endsWith(`.${d}`);
  });
}

function isValidSource(value: unknown): value is EntrySource {
  return (
    value === 'search'
    || value === 'clientFooter'
    || value === 'social'
    || value === 'direct'
    || value === 'unknown'
  );
}

/**
 * Classification pure — exposée pour les tests, qui ne peuvent pas piloter `document.referrer`.
 *
 * L'ordre compte : le marqueur UTM explicite prime sur le referrer, parce qu'un site client peut
 * très bien être atteint depuis Google avant que le visiteur ne clique la signature du pied de page.
 *
 * `selfHostname` est notre propre hôte, passé explicitement pour que la fonction reste utilisable
 * hors navigateur (la suite de tests tourne sous Node, sans `window`).
 */
export function classifyEntry(referrer: string, search: string, selfHostname?: string): EntrySource {
  let medium: string | null = null;
  try {
    medium = new URLSearchParams(search).get('utm_medium');
  } catch {
    // Query string illisible — on retombe sur le referrer.
  }
  if (medium === FOOTER_SIGNATURE_MEDIUM) return 'clientFooter';

  const hostname = hostnameOf(referrer);
  if (!hostname) return 'direct';
  if (matchesAny(hostname, SEARCH_HOSTS)) return 'search';
  if (isClientHost(hostname)) return 'clientFooter';
  if (matchesAny(hostname, SOCIAL_HOSTS)) return 'social';

  // Navigation interne (rechargement, retour arrière) : la session a déjà commencé ailleurs.
  if (selfHostname && hostname === selfHostname.toLowerCase()) return 'direct';

  return 'unknown';
}

/**
 * Classe le contexte d'arrivée et le mémorise pour la session. Idempotent : les appels suivants
 * renvoient la valeur déjà stockée sans reclasser.
 */
export function captureEntrySource(): EntrySource {
  if (typeof window === 'undefined') return 'unknown';

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (isValidSource(stored)) return stored;
  } catch {
    // sessionStorage indisponible (navigation privée verrouillée) — on reclasse à chaque appel.
  }

  const source = classifyEntry(document.referrer, window.location.search, window.location.hostname);
  try {
    sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    // Écriture impossible : la classification reste correcte pour ce chargement.
  }
  return source;
}

/** Contexte d'arrivée mémorisé, sans reclasser. `'unknown'` si rien n'a encore été capté. */
export function getEntrySource(): EntrySource {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isValidSource(stored) ? stored : 'unknown';
  } catch {
    return 'unknown';
  }
}
