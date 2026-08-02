/**
 * Worker `maxmorrys-site` — devant Firebase Hosting sur `maxmorrys.me/*`.
 *
 * Prend en charge au bord ce que les rewrites de `firebase.json` envoyaient à des
 * Cloud Functions (`sitemap`, `rss`, `catalog`, `prerender`) et relaie tout le
 * reste à l'origine.
 *
 * Deux filets de sécurité, volontairement redondants :
 *   1. toute erreur de ce Worker retombe sur l'origine, qui sait encore répondre
 *      tant que les rewrites Firebase sont en place ;
 *   2. supprimer la route Cloudflare rend la main à Firebase Hosting en quelques
 *      secondes, sans propagation DNS.
 */
import { text } from '@mm/shared';

import { cached } from './cache';
import type { Env } from './env';
import { getFirestore } from './firestore';
import { fetchOrigin } from './origin';
import { handlePrerender } from './prerender';
import { applySecurityHeaders, getSpaShell } from './prerender/shell';
import { resolveRoute, type Route } from './routes';
import { buildCatalog } from './seo/catalog';
import { buildRss } from './seo/rss';
import { buildSitemap } from './seo/sitemap';

/** Les flux SEO sont recalculés au plus une fois par heure — comme leur `max-age` actuel. */
const FEED_TTL_SECONDS = 3600;

async function handleFeed(route: Route, env: Env, ctx: ExecutionContext): Promise<Response> {
  const db = getFirestore(env);

  // Le shell est déjà en cache : on s'en sert uniquement pour récupérer les
  // en-têtes de sécurité de l'origine et les reporter sur les flux.
  const shellHeaders = new Headers((await getSpaShell(env, ctx)).headers);
  const withSecurity = (response: Response): Response => {
    applySecurityHeaders(response.headers, shellHeaders);
    return response;
  };

  switch (route) {
    case 'sitemap':
      return withSecurity(text(
        await cached(env, ctx, 'feed:v1:sitemap', FEED_TTL_SECONDS, () => buildSitemap(db)),
        'application/xml',
        200,
        { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      ));

    case 'rss':
      return withSecurity(text(
        await cached(env, ctx, 'feed:v1:rss', FEED_TTL_SECONDS, () => buildRss(db)),
        'application/rss+xml; charset=utf-8',
        200,
        { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      ));

    default:
      return withSecurity(text(
        await cached(env, ctx, 'feed:v1:catalog', FEED_TTL_SECONDS, () => buildCatalog(db)),
        'text/csv; charset=utf-8',
        200,
        {
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'Content-Disposition': 'inline; filename="catalog.csv"',
        },
      ));
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const route = resolveRoute(url.pathname);

    // Seules les lectures sont traitées au bord ; le reste part à l'origine.
    const isRead = request.method === 'GET' || request.method === 'HEAD';
    if (route === 'origin' || !isRead) return fetchOrigin(request, env);

    try {
      if (route === 'prerender') return await handlePrerender(request, env, ctx);
      return await handleFeed(route, env, ctx);
    } catch (error: unknown) {
      // Repli sur l'origine : mieux vaut le comportement d'hier qu'une erreur.
      console.error(`Échec du traitement de ${url.pathname} :`, error);
      return fetchOrigin(request, env);
    }
  },
} satisfies ExportedHandler<Env>;
