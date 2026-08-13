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

export type Route = 'sitemap' | 'rss' | 'catalog' | 'prerender' | 'origin';

/** Sources exactes de `firebase.json` routées vers `prerender`. */
const PRERENDER_EXACT = new Set([
  '/',
  '/blog',
  '/formations',
  '/podcasts',
  '/videos',
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
  '/en/faq',
  '/en/about',
  '/en/contact',
  '/en/agency',
  '/en/digital-presence',
]);

/** Sources en `/xxx/**` — comparées en préfixe. */
const PRERENDER_PREFIXES = [
  '/blog/',
  '/formations/',
  '/podcasts/',
  '/videos/',
  '/legal/',
  '/en/blog/',
  '/en/courses/',
  '/en/podcasts/',
  '/en/videos/',
  '/en/legal/',
];

/** Retire les slashes finaux, en préservant la racine. */
export function normalizePath(pathname: string): string {
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function resolveRoute(pathname: string): Route {
  const path = normalizePath(pathname);

  if (path === '/sitemap.xml') return 'sitemap';
  if (path === '/rss.xml') return 'rss';
  if (path === '/catalog.csv') return 'catalog';

  if (PRERENDER_EXACT.has(path)) return 'prerender';
  // Le chemin brut est testé aussi, pour que `/legal/` tombe bien sous `/legal/**`.
  if (PRERENDER_PREFIXES.some((prefix) => path.startsWith(prefix) || pathname.startsWith(prefix))) {
    return 'prerender';
  }

  return 'origin';
}
