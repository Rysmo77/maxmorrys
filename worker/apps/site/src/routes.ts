/**
 * Table de routage — miroir exact des rewrites de `firebase.json`.
 *
 * Comportements vérifiés directement sur la production avant portage :
 *   /blog/      → prerendu  (le glob `**` tolère le slash final)
 *   /en/        → prerendu  (idem sur une source exacte)
 *   /blog/x/y   → prerendu  (`**` traverse les slashes)
 *   /legal      → origine   (seul `/legal/**` est déclaré, pas `/legal`)
 *   /EN/blog    → origine   (la correspondance est sensible à la casse)
 */

export type Route = 'sitemap' | 'rss' | 'podcast' | 'catalog' | 'prerender' | 'origin';

/** Sources exactes de `firebase.json` routées vers `prerender`. */
const PRERENDER_EXACT = new Set([
  '/',
  '/blog',
  '/formations',
  '/podcasts',
  '/videos',
  /* Le pôle média et l'autre étage de son territoire, plus la vérification d'un code. */
  '/podcast-et-videos',
  '/club-des-digitos',
  '/verifier',
  '/faq',
  '/a-propos',
  '/contact',
  '/agence',
  '/presence-digitale',
  '/en',
  '/en/blog',
  '/en/courses',
  '/en/podcasts',
  '/en/videos',
  '/en/podcast-and-videos',
  '/en/digitos-club',
  '/en/verify',
  '/en/faq',
  '/en/about',
  '/en/contact',
  '/en/agency',
  '/en/local-presence',
]);

/** Sources en `/xxx/**` — comparées en préfixe. */
const PRERENDER_PREFIXES = [
  '/blog/',
  '/formations/',
  '/podcasts/',
  '/videos/',
  /* Une page PAR question — `/faq/<adresse>`, et sa contrepartie anglaise. */
  '/faq/',
  '/legal/',
  /*
    Un certificat par code. Il est en `noindex` — il se partage, il ne se cherche pas — mais
    il DOIT être pré-rendu quand même : sans ça, l'origine sert `index.html` tel quel et les
    robots sociaux lisent le titre et la photo de la page d'accueil. Sur la seule page du
    produit dont la fonction est d'être montrée à quelqu'un d'autre.
  */
  '/certificat/',
  '/en/certificate/',
  '/en/blog/',
  '/en/courses/',
  '/en/podcasts/',
  '/en/videos/',
  '/en/faq/',
  '/en/legal/',
];

/** Retire les slashes finaux, en préservant la racine. */
export function normalizePath(pathname: string): string {
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI PART À L'ORIGINE SANS PRÉ-RENDU EMPRUNTE L'IDENTITÉ DE L'ACCUEIL.
 *
 * Mesuré sur la production, en se présentant comme `facebookexternalhit` :
 *
 *     GET /connexion  →  <title>Max-Morrys | Maîtrise le digital…</title>
 *                        og:url = https://maxmorrys.me
 *                        ni canonical, ni robots
 *
 * C'est le shell SPA tel quel. Ces pages posent pourtant `noIndex` via `SEOHead`, et
 * ce `noIndex` n'atteint AUCUN crawler : il est écrit par React, après hydratation,
 * dans un DOM que les robots sociaux ne construisent jamais. Résultat : plusieurs URL
 * différentes présentent aux moteurs le titre, la description et l'`og:url` de la page
 * d'accueil — c'est-à-dire un signal de contenu dupliqué contre `/` elle-même.
 *
 * POURQUOI UN EN-TÊTE PLUTÔT QU'UN PRÉ-RENDU. Les faire entrer dans le pipeline
 * coûterait un aller-retour Firestore pour des pages sans contenu indexable. Un
 * `X-Robots-Tag` fait le même travail, à l'octet près, sans quitter le bord.
 *
 * ⚠️ CE QUE CETTE LISTE NE PEUT PAS COUVRIR : la route attrape-tout du 404. L'origine
 * répond 200 sur un chemin inconnu — c'est une SPA — donc rien ici ne permet de le
 * distinguer d'une page réelle. Ce trou-là se ferme dans le routeur, pas au bord.
 *
 * `robots.txt` couvre déjà `/admin`, `/mon-espace`, `/checkout`, `/paiement` et `/403` :
 * ils sont absents de cette liste à dessein. Un chemin dont l'exploration est interdite
 * n'est jamais récupéré, donc son en-tête n'est jamais lu.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const NOINDEX_EXACT = new Set([
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/en/sign-in',
  '/en/signup',
  '/en/forgot-password',
]);

/** Un devis porte une référence client dans son URL : rien de tout ça n'a à être indexé. */
const NOINDEX_PREFIXES = ['/presence-digitale/devis/', '/en/local-presence/quote/'];

/** Ce chemin doit-il être servi avec `X-Robots-Tag: noindex, nofollow` ? */
export function shouldNoIndex(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (NOINDEX_EXACT.has(path)) return true;
  // Le chemin brut est testé aussi, pour la même raison que dans `resolveRoute`.
  return NOINDEX_PREFIXES.some((prefix) => path.startsWith(prefix) || pathname.startsWith(prefix));
}

export function resolveRoute(pathname: string): Route {
  const path = normalizePath(pathname);

  /*
   * Les cartes d'aperçu (`/og/**.png`) ne sont PAS traitées ici : ce sont des fichiers
   * statiques, générés par `npm run og:cards` et servis par l'hébergement. Elles tombent donc
   * dans `origin`, comme tout autre asset — c'est voulu, et c'est ce qui leur donne un coût
   * d'exécution nul.
   */
  if (path === '/sitemap.xml') return 'sitemap';
  if (path === '/rss.xml') return 'rss';
  if (path === '/podcast.xml') return 'podcast';
  if (path === '/catalog.csv') return 'catalog';

  if (PRERENDER_EXACT.has(path)) return 'prerender';
  // Le chemin brut est testé aussi, pour que `/legal/` tombe bien sous `/legal/**`.
  if (PRERENDER_PREFIXES.some((prefix) => path.startsWith(prefix) || pathname.startsWith(prefix))) {
    return 'prerender';
  }

  return 'origin';
}
