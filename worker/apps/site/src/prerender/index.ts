import { cached } from '../cache';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
} from '../constants';
import type { Env } from '../env';
import { getFirestore } from '../firestore';
import { normalizePath } from '../routes';
import { getContentMeta } from './content';
import { injectMeta } from './rewriter';
import { canonicalizeSegments, enPath } from './segments';
import { getSpaShell } from './shell';
import { staticPages } from './static-pages';
import { translateMetaToEn } from './translate';
import type { PageMeta } from './types';

/** Port de la fonction `prerender`. */

/**
 * TTL du cache des métadonnées issues de Firestore.
 *
 * C'est le levier principal sur la consommation de lectures : le prerender coûte
 * aujourd'hui une à deux lectures par page et par passage de robot. Cinq minutes
 * divisent ce volume d'un ordre de grandeur sans que le contenu paraisse figé.
 */
const CONTENT_TTL_SECONDS = 300;
/** Les routes inconnues sont mises en cache moins longtemps, mais mises en cache : les robots les martèlent. */
const MISS_TTL_SECONDS = 60;

/** Enveloppe sérialisable, pour pouvoir mettre en cache l'absence de résultat. */
type CachedMeta = { found: true; meta: PageMeta } | { found: false };

function unknownRouteMeta(rawPath: string, canonicalPath: string, lang: 'fr' | 'en'): PageMeta {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}${rawPath}`,
    h1: SITE_NAME,
    // Route inconnue → ne pas indexer.
    noIndex: true,
    lang,
    altFr: `${SITE_URL}${canonicalPath}`,
    altEn: `${SITE_URL}${enPath(canonicalPath)}`,
  };
}

export async function handlePrerender(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const rawPath = normalizePath(url.pathname);
  const lang: 'fr' | 'en' = rawPath === '/en' || rawPath.startsWith('/en/') ? 'en' : 'fr';

  // Chemin FR canonique : retire le préfixe /en et remappe les segments anglais.
  const canonicalPath =
    lang === 'en'
      ? canonicalizeSegments(rawPath === '/en' ? '/' : rawPath.slice(3)) || '/'
      : rawPath;

  let meta: PageMeta | null = null;

  const staticMeta = staticPages[canonicalPath];
  if (staticMeta) {
    const frUrl = `${SITE_URL}${canonicalPath}`;
    const enUrl = `${SITE_URL}${enPath(canonicalPath)}`;
    meta = {
      ...staticMeta,
      altFr: frUrl,
      altEn: enUrl,
      lang,
      canonical: lang === 'en' ? enUrl : staticMeta.canonical || frUrl,
    };
  }

  if (!meta) {
    const db = getFirestore(env);
    const entry = await cached<CachedMeta>(
      env,
      ctx,
      `content:v1:${lang}:${canonicalPath}`,
      CONTENT_TTL_SECONDS,
      async () => {
        const found = await getContentMeta(db, canonicalPath, lang);
        return found ? { found: true, meta: found } : { found: false };
      },
    );
    if (entry.found) meta = entry.meta;
    else if (!entry.found) {
      // Mémoriser aussi l'absence, avec un TTL plus court.
      ctx.waitUntil(
        env.SEO.put(`content:v1:${lang}:${canonicalPath}`, JSON.stringify(entry), {
          expirationTtl: MISS_TTL_SECONDS,
        }).catch(() => undefined),
      );
    }
  }

  if (!meta) meta = unknownRouteMeta(rawPath, canonicalPath, lang);

  // Traduction des champs visibles pour les pages anglaises indexables.
  if (lang === 'en' && !meta.noIndex) {
    meta = await translateMetaToEn(getFirestore(env), env, meta);
  }

  const shell = await getSpaShell(env, ctx);
  const transformed = injectMeta(shell, meta);

  return new Response(transformed.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // HTML prérendu = équivalent SEO d'index.html : jamais mis en cache, sinon
      // il référencerait des assets hachés supprimés au déploiement suivant.
      'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
    },
  });
}
