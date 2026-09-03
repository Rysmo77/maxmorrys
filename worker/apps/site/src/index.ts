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
import {
  countHit,
  loadRedirectMap,
  resolveRedirect,
  shouldConsultRedirects,
  type RedirectHit,
} from './redirects';
import { resolveRoute, type Route } from './routes';
import { buildCatalog } from './seo/catalog';
import { buildRss } from './seo/rss';
import { buildPodcastRss } from './seo/podcast-rss';
import { buildSitemap } from './seo/sitemap';

/** Les flux SEO sont recalculés au plus une fois par heure — comme leur `max-age` actuel. */
const FEED_TTL_SECONDS = 3600;

/**
 * En-têtes de sécurité des réponses de redirection.
 *
 * Divergence assumée avec `applySecurityHeaders`, qui recopie les sept en-têtes
 * de l'origine sur les pages prerendues (cf. `test/security-headers.test.ts`) :
 * une redirection n'a pas de corps, donc pas de surface XSS, et n'a pas à payer
 * la récupération du shell sur le chemin d'un clic.
 */
const REDIRECT_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function redirectResponse(hit: RedirectHit): Response {
  return new Response(null, {
    status: hit.code,
    headers: {
      Location: hit.location,
      // Un 301 sans borne est mémorisé indéfiniment par le navigateur, ce qui le
      // rend irrévocable. Un 302 d'attribution ne se cache pas du tout : sinon
      // le slug modifié ne prend pas effet et les clics suivants échappent au
      // comptage.
      'Cache-Control': hit.code === 301 ? 'public, max-age=3600' : 'no-store',
      ...REDIRECT_SECURITY_HEADERS,
    },
  });
}

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

    case 'podcast':
      return withSecurity(text(
        await cached(env, ctx, 'feed:v1:podcast', FEED_TTL_SECONDS, () => buildPodcastRss(db)),
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

    // Seules les lectures sont traitées au bord ; le reste part à l'origine.
    const isRead = request.method === 'GET' || request.method === 'HEAD';

    // Les redirections passent avant le routage : une source peut recouvrir une
    // page prerendue, typiquement une ancienne URL qui doit désormais pointer
    // ailleurs.
    if (isRead && shouldConsultRedirects(url.pathname)) {
      try {
        const db = getFirestore(env);
        const hit = resolveRedirect(url, await loadRedirectMap(db, env, ctx));
        if (hit) {
          if (hit.rule) ctx.waitUntil(countHit(db, hit.rule, request.headers.get('Referer')));
          return redirectResponse(hit);
        }
      } catch (error: unknown) {
        // Table indisponible : on poursuit le routage normal. Une attribution
        // perdue est un moindre mal ; une page d'accueil en erreur, non.
        console.error('Table de redirections indisponible :', error);
      }
    }

    const route = resolveRoute(url.pathname);
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
