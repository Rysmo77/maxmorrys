/**
 * Redirections servies au bord — port de `src/lib/redirects.ts`.
 *
 * Le crédit d'agence posé au pied des sites clients pointe vers
 * `https://maxmorrys.me/via/<slug>` : c'est ce Worker, et lui seul, qui rend ces
 * URL vivantes. Sans lui l'origine sert le shell SPA et le routeur React tombe
 * sur `NotFound` — chaque crédit déjà distribué devient un 404.
 *
 * La table est administrée depuis `/admin/redirections` et lue par compte de
 * service, donc **hors `firestore.rules`** : la collection `redirects` n'a
 * aucune lecture publique, et n'en a pas besoin.
 *
 * ⚠️ Les fonctions de format ci-dessous sont le miroir exact de
 * `src/lib/redirects.ts`. Toute modification doit être faite des deux côtés.
 */
import { FieldValue, type Firestore } from '@mm/firestore-rest';

import { cached } from './cache';
import type { Env } from './env';

export const VIA_PREFIX = '/via/';
export const VIA_FALLBACK = '/agence';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Durée de vie de la carte, en secondes.
 *
 * L'admin écrit dans Firestore sans pouvoir prévenir le Worker : ce TTL *est*
 * le délai de propagation d'un slug. Une minute est le compromis retenu entre
 * fraîcheur et volume de lectures Firestore sur le chemin critique.
 */
export const REDIRECT_TTL_SECONDS = 60;

export interface RedirectRule {
  id: string;
  target: string;
  code: 301 | 302;
  kind: 'via' | 'path';
}

/** Clé = source normalisée (`/via/eyone`). */
export type RedirectMap = Record<string, RedirectRule>;

export interface RedirectHit {
  /** Valeur de l'en-tête `Location`. */
  location: string;
  code: 301 | 302;
  /** `null` sur le repli d'un slug inconnu : il n'y a pas de document à compter. */
  rule: RedirectRule | null;
}

/* ────────────────────────── Formats (miroir) ────────────────────────── */

export function normalizeSource(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const stripped = withSlash.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/**
 * Une cible doit rester interne. `//evil.com` et `/\evil.com` sont des URL
 * protocol-relative : les suivre ferait de `/via/` un redirecteur ouvert.
 * Cette garde double celle de l'admin — la donnée pourrait avoir été écrite
 * avant elle, ou par un autre chemin.
 */
export function isInternalTarget(target: string): boolean {
  if (!target.startsWith('/')) return false;
  if (target.startsWith('//') || target.startsWith('/\\')) return false;
  return !/[\r\n\t]/.test(target);
}

/**
 * Les assets ne consultent jamais la table : un point dans le dernier segment
 * suffit à les reconnaître, et c'est l'essentiel du trafic.
 */
export function shouldConsultRedirects(pathname: string): boolean {
  const last = pathname.split('/').pop() ?? '';
  return !last.includes('.');
}

/* ───────────────────────────── Résolution ───────────────────────────── */

/**
 * Résout une URL entrante contre la carte.
 *
 * Ordre : correspondance exacte, puis repli des liens d'attribution. Un slug
 * inconnu ou désactivé part vers `/agence` plutôt qu'en 404 — au pire on perd le
 * comptage par client, jamais la visite.
 */
export function resolveRedirect(url: URL, map: RedirectMap): RedirectHit | null {
  const source = normalizeSource(url.pathname);
  const rule = map[source];

  if (rule && isInternalTarget(rule.target)) {
    return {
      location: buildLocation(url, rule.target, rule.kind === 'via' ? slugOf(source) : null),
      code: rule.code,
      rule,
    };
  }

  if (source.startsWith(VIA_PREFIX)) {
    return { location: buildLocation(url, VIA_FALLBACK, slugOf(source)), code: 302, rule: null };
  }

  return null;
}

function slugOf(source: string): string | null {
  if (!source.startsWith(VIA_PREFIX)) return null;
  const slug = source.slice(VIA_PREFIX.length);
  return slug === '' ? null : slug;
}

/**
 * Construit le `Location`, query entrante préservée.
 *
 * Le slug vient de l'URL : il est **revalidé** avant d'être posé. L'écrire tel
 * quel dans un en-tête serait une injection d'en-tête, et le paramètre finit
 * lisible par la page d'arrivée. Un slug mal formé part sans paramètre.
 */
function buildLocation(url: URL, target: string, slug: string | null): string {
  const resolved = new URL(target, url);

  for (const [key, value] of url.searchParams) {
    if (key !== 'via') resolved.searchParams.append(key, value);
  }
  if (slug && isValidSlug(slug)) resolved.searchParams.set('via', slug);

  // Redirection interne : on renvoie un chemin relatif, jamais l'hôte, pour que
  // la réponse reste correcte derrière `www.` comme derrière l'apex.
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/* ───────────────────────────── Chargement ───────────────────────────── */

let memo: { map: RedirectMap; expiresAt: number } | null = null;

/** Réinitialise la mémoïsation d'isolate. Réservé aux tests. */
export function resetRedirectMemo(): void {
  memo = null;
}

/** Construit la carte à partir des entrées actives. */
export async function buildRedirectMap(db: Firestore): Promise<RedirectMap> {
  const docs = await db.query({
    collection: 'redirects',
    where: [{ field: 'active', op: '==', value: true }],
    select: ['source', 'target', 'code', 'kind', 'updatedAt'],
  });

  const map: RedirectMap = {};
  const stamps: Record<string, string> = {};

  for (const doc of docs) {
    const source = typeof doc.data.source === 'string' ? normalizeSource(doc.data.source) : '';
    const target = typeof doc.data.target === 'string' ? doc.data.target : '';
    if (!source || source === '/' || !isInternalTarget(target)) continue;

    // Doublon de source : on garde la plus récemment modifiée. L'admin empêche
    // le cas, mais deux écritures concurrentes le rendent possible — mieux vaut
    // une dégradation prévisible qu'un gagnant tiré de l'ordre de la requête.
    const stamp = typeof doc.data.updatedAt === 'string' ? doc.data.updatedAt : '';
    if (source in map && stamp <= (stamps[source] ?? '')) continue;

    map[source] = {
      id: doc.id,
      target,
      code: doc.data.code === 301 ? 301 : 302,
      kind: doc.data.kind === 'path' ? 'path' : 'via',
    };
    stamps[source] = stamp;
  }

  return map;
}

async function refresh(db: Firestore, env: Env, ctx: ExecutionContext): Promise<RedirectMap> {
  const map = await cached(env, ctx, 'redirects:v1:map', REDIRECT_TTL_SECONDS, () =>
    buildRedirectMap(db),
  );
  memo = { map, expiresAt: Date.now() + REDIRECT_TTL_SECONDS * 1000 };
  return map;
}

/**
 * Carte des redirections, mémoïsée par isolate puis mise en cache dans KV.
 *
 * Les deux étages portent le même TTL : l'isolate évite un aller-retour KV par
 * requête, KV évite une lecture Firestore par isolate froid.
 *
 * ⚠️ Ce chargement est sur le chemin de **toute** page, pas seulement des
 * redirections : une carte périmée qui se recharge en ligne ferait payer une
 * lecture Firestore à la page d'accueil une fois par minute et par isolate. La
 * carte périmée est donc servie telle quelle et rafraîchie derrière — seul le
 * tout premier appel d'un isolate attend. La date d'expiration est repoussée
 * avant le rafraîchissement, ce qui évite aussi qu'une rafale de requêtes ne
 * déclenche autant de rechargements.
 */
export async function loadRedirectMap(
  db: Firestore,
  env: Env,
  ctx: ExecutionContext,
): Promise<RedirectMap> {
  const now = Date.now();
  if (memo && memo.expiresAt > now) return memo.map;

  if (memo) {
    const stale = memo.map;
    memo = { map: stale, expiresAt: now + REDIRECT_TTL_SECONDS * 1000 };
    ctx.waitUntil(
      refresh(db, env, ctx).then(
        () => undefined,
        (error: unknown) => {
          // Échec du rafraîchissement : on garde la carte précédente une minute
          // de plus plutôt que de repartir sur une table vide.
          console.error('Rafraîchissement de la table de redirections impossible :', error);
        },
      ),
    );
    return stale;
  }

  return refresh(db, env, ctx);
}

/* ────────────────────────────── Comptage ────────────────────────────── */

/**
 * Incrémente le compteur d'un lien d'attribution.
 *
 * Réservé à `kind: 'via'` : un 301 de SEO est massivement suivi par les robots,
 * et l'écriture coûterait plus que l'information ne vaut.
 *
 * `update()` porte `currentDocument: { exists: true }` — une entrée supprimée
 * entre la mise en cache et le clic ne renaît pas. L'échec est avalé : le
 * comptage ne doit jamais retarder ni casser une redirection.
 */
export async function countHit(
  db: Firestore,
  rule: RedirectRule,
  referer: string | null,
): Promise<void> {
  if (rule.kind !== 'via') return;

  const host = refererHost(referer);
  try {
    await db.update(`redirects/${rule.id}`, {
      hits: FieldValue.increment(1),
      lastHitAt: new Date().toISOString(),
      ...(host ? { lastReferrerHost: host } : {}),
    });
  } catch (error: unknown) {
    console.error(`Comptage du clic sur ${rule.id} impossible :`, error);
  }
}

/**
 * Réduit un `Referer` à son hôte.
 *
 * C'est déjà tout ce que `referrerPolicy="strict-origin"` laisse passer côté
 * site client ; on ne conserve rien de plus, jamais le chemin consulté.
 */
export function refererHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname || null;
  } catch {
    return null;
  }
}
