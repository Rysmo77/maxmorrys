/**
 * Normalisation des redirections — SOURCE DE VÉRITÉ des formats.
 *
 * Ce module ne dépend ni de Firebase ni du DOM : il est consommé par l'écran
 * d'administration (`src/pages/admin/AdminRedirects.tsx`), par la couche données
 * (`src/lib/firestore/redirects.ts`), et **porté à l'identique** dans le Worker
 * (`worker/apps/site/src/redirects.ts`) qui sert réellement les redirections au
 * bord. Toute modification ici doit être répercutée là-bas — même convention que
 * `src/i18n/segments.ts` → `worker/apps/site/src/prerender/segments.ts`.
 *
 * Le lien d'attribution posé au pied des sites clients est
 * `https://maxmorrys.me/via/<slug>`. C'est un contrat public : un slug déjà
 * distribué ne se renomme pas, il se désactive.
 */

/** Préfixe des liens d'attribution d'agence. */
export const VIA_PREFIX = '/via/';

/**
 * Destination servie quand le slug est inconnu, désactivé ou mal formé.
 *
 * Un crédit posé chez un client ne doit jamais tomber en 404 : au pire on perd
 * le comptage par client, jamais la visite.
 */
export const VIA_FALLBACK = '/agence';

/** Taille maximale d'un slug — alignée sur la validation des règles Firestore. */
export const SLUG_MAX_LENGTH = 64;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Normalise un chemin source : minuscules, « / » initial, slashes finaux retirés.
 *
 * La racine est préservée, comme `normalizePath()` côté Worker. La casse est
 * écrasée parce que les deux côtés de la comparaison le sont : un slug distribué
 * en capitales dans un pied de page doit résoudre.
 */
export function normalizeSource(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const stripped = withSlash.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

/** Un slug est une clé d'URL : minuscules, chiffres et tirets, jamais vide. */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/**
 * Une cible doit rester **interne**.
 *
 * `//evil.com` et `/\evil.com` sont des URL protocol-relative : un navigateur les
 * suit vers l'extérieur. Les accepter ferait de `/via/` un redirecteur ouvert,
 * réutilisable en hameçonnage sous notre domaine dès qu'un compte admin fuit.
 * Les retours chariot sont refusés pour la même raison qu'ils le seraient dans
 * un en-tête HTTP.
 */
export function isInternalTarget(target: string): boolean {
  if (!target.startsWith('/')) return false;
  if (target.startsWith('//') || target.startsWith('/\\')) return false;
  return !/[\r\n\t]/.test(target);
}

/** Normalise une cible en préservant sa query et son fragment éventuels. */
export function normalizeTarget(target: string): string {
  const trimmed = target.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Extrait le slug d'un chemin `/via/<slug>`. `null` si le chemin n'est pas un lien d'attribution. */
export function viaSlugFromPath(path: string): string | null {
  const normalized = normalizeSource(path);
  if (!normalized.startsWith(VIA_PREFIX)) return null;
  const slug = normalized.slice(VIA_PREFIX.length);
  return slug === '' ? null : slug;
}
