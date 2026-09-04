import { cached } from '../cache';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
} from '../constants';
import type { Env } from '../env';
import { getFirestore } from '../firestore';
import { normalizePath } from '../routes';
import { getContentMeta } from './content';
import { withFaqIndexJsonLd } from './faq';
import { ogCardTitle, ogEyebrow, ogImageUrl } from './og-url';
import { injectMeta } from './rewriter';
import { canonicalizeSegments, enPath } from './segments';
import { applySecurityHeaders, getSpaShell } from './shell';
import { staticPages } from './static-pages';
import { translateMetaToEn } from '@mm/shared';
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

/**
 * L'image de partage d'une page qui n'en a pas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE : LA CARTE GÉNÉRÉE REMPLACE L'IMAGE PAR DÉFAUT, JAMAIS CELLE D'UN AUTEUR.
 *
 * Une couverture d'article, une pochette d'épisode, une vignette de vidéo ont été CHOISIES ;
 * les remplacer par une carte de texte serait une perte. Ce qu'il fallait corriger, c'est
 * l'autre cas : dix-huit pages statiques et toutes les questions de la FAQ partageaient une
 * même photographie, sans titre ni logo. Deux liens vers deux pages différentes produisaient
 * le même aperçu — et c'est exactement ce que voit quelqu'un qui hésite à cliquer.
 *
 * `unknownRouteMeta` est exclu : une route inconnue est en `noindex`, faire rendre une carte
 * pour elle ne servirait qu'à faire tourner la fonction sur des adresses inventées.
 */
function withShareImage(meta: PageMeta, path: string): PageMeta {
  if (meta.ogImage !== DEFAULT_OG_IMAGE) return meta;

  if (meta.noIndex) {
    // Repli sur la photo, avec ses dimensions RÉELLES — mesurées, jamais une constante
    // décorative (elles étaient annoncées 1200×630 pour une image 1500×1000).
    return {
      ...meta,
      ogImageWidth: meta.ogImageWidth ?? DEFAULT_OG_IMAGE_WIDTH,
      ogImageHeight: meta.ogImageHeight ?? DEFAULT_OG_IMAGE_HEIGHT,
      ogImageAlt: meta.ogImageAlt ?? DEFAULT_OG_IMAGE_ALT,
    };
  }

  const eyebrow = ogEyebrow(path, meta.lang === 'en' ? 'en' : 'fr');
  return {
    ...meta,
    ogImage: ogImageUrl(path, meta.title, eyebrow),
    // Connues par construction : c'est nous qui rendons l'image, à cette taille exacte.
    ogImageWidth: 1200,
    ogImageHeight: 630,
    // La carte PORTE le titre : c'est ce qu'elle montre, et donc ce qu'il faut décrire — au
    // suffixe du site près, que la carte n'affiche pas.
    ogImageAlt: ogCardTitle(meta.title),
  };
}

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

/**
 * La méta d'une page, telle qu'elle sera servie.
 *
 * Extraite de `handlePrerender` pour que la route des images d'aperçu (`../og.ts`) parte
 * EXACTEMENT de la même source. Deux résolutions séparées finiraient par diverger : le titre
 * de la carte ne serait plus celui de la page, sans que rien ne le signale. Elles partagent
 * ici jusqu'à l'entrée de cache — l'image d'une page ne coûte donc aucune lecture Firestore
 * de plus que la page elle-même.
 */
export async function resolvePageMeta(
  rawPath: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<PageMeta> {
  const lang: 'fr' | 'en' = rawPath === '/en' || rawPath.startsWith('/en/') ? 'en' : 'fr';

  // Chemin FR canonique : retire le préfixe /en et remappe les segments anglais.
  const canonicalPath =
    lang === 'en'
      ? canonicalizeSegments(rawPath === '/en' ? '/' : rawPath.slice(3)) || '/'
      : rawPath;

  /*
    Producteur unique : construction de la meta ET traduction anglaise, toutes
    deux DANS l'enveloppe de cache.

    La traduction s'exécutait auparavant après le cache — et les pages statiques
    ne le traversaient pas du tout. Chaque vue d'une page anglaise payait donc un
    `getAll` Firestore en REST depuis le PoP jusqu'à GCP, en plein TTFB, pour un
    résultat presque toujours déjà en cache ; et sur défaut, un appel Gemini
    synchrone dans le chemin de la requête. Le français n'était pas concerné.

    La clé passe en `meta:v2` : les entrées `content:v1` contiennent des metas
    non traduites et ne doivent pas être réutilisées telles quelles.
  */
  const cacheKey = `meta:v2:${lang}:${canonicalPath}`;

  const produce = async (): Promise<CachedMeta> => {
    let built: PageMeta | null = null;

    const staticMeta = staticPages[canonicalPath];
    if (staticMeta) {
      /*
        LES ALTERNATES SUIVENT LA CANONIQUE, PAS LE CHEMIN SERVI.

        Presque toujours, les deux sont identiques. Deux pages font exception : `/podcasts` et
        `/videos`, dont la canonique désigne `/podcast-et-videos` depuis la fusion du pôle
        média. Elles annonçaient donc `hreflang="fr" href=".../podcasts"` tout en déclarant
        par ailleurs que la page de référence est ailleurs — Google demande que les URL d'un
        groupe hreflang soient les canoniques, et ignore un groupe qui se contredit. Les trois
        alternates partaient donc à la poubelle, pour ces deux pages ET pour celle qu'elles
        désignent, puisqu'un groupe hreflang est réciproque.
      */
      const ownPath = staticMeta.canonical?.startsWith(SITE_URL)
        ? staticMeta.canonical.slice(SITE_URL.length) || '/'
        : canonicalPath;
      const frUrl = `${SITE_URL}${ownPath}`;
      const enUrl = `${SITE_URL}${enPath(ownPath)}`;
      built = {
        ...staticMeta,
        altFr: frUrl,
        altEn: enUrl,
        lang,
        canonical: lang === 'en' ? enUrl : staticMeta.canonical || frUrl,
      };
      /*
       * L'index de la FAQ est la seule page statique qui a besoin de la base : ses
       * questions ne peuvent pas être écrites en dur. L'enrichissement est au mieux — voir
       * `withFaqIndexJsonLd`, qui rend la méta inchangée si Firestore ne répond pas.
       */
      if (canonicalPath === '/faq') {
        built = await withFaqIndexJsonLd(getFirestore(env), built);
      }
    } else {
      built = await getContentMeta(getFirestore(env), canonicalPath, lang);
    }

    if (!built) return { found: false };

    if (lang === 'en' && !built.noIndex) {
      built = await translateMetaToEn(
        getFirestore(env),
        { baseUrl: env.GEMINI_BASE_URL, apiKey: env.GOOGLE_AI_API_KEY },
        built,
      );
    }

    /*
      APRÈS la traduction, et l'ordre compte. L'adresse de l'image porte une empreinte du
      titre : la calculer avant traduction ferait pointer la carte anglaise sur une empreinte
      française, et une correction du titre anglais ne renouvellerait jamais l'image.
    */
    /*
      LE CHEMIN CANONIQUE, PAS CELUI QUI EST SERVI.

      Les cartes sont rendues au build à partir des titres FRANÇAIS ; les titres anglais, eux,
      sont traduits à la volée et mis en cache, donc inconnus au moment de la génération. Une
      page anglaise partage donc la carte de sa page française — même sujet, même famille,
      même marque, mais le titre y est en français.

      C'est le moins mauvais des trois choix : pointer sur `/og/en/…` donnerait un fichier
      inexistant, et retomber sur la carte générique ferait perdre le sujet de la page. Le
      jour où les traductions sont pré-calculées, générer les cartes anglaises ne demandera
      que d'ajouter leurs chemins au script.
    */
    built = withShareImage(built, canonicalPath);

    return { found: true, meta: built };
  };

  const entry = await cached<CachedMeta>(env, ctx, cacheKey, CONTENT_TTL_SECONDS, produce);

  let meta: PageMeta | null = null;
  if (entry.found) {
    meta = entry.meta;
  } else {
    // Mémoriser aussi l'absence, avec un TTL plus court : les robots martèlent
    // les routes inconnues.
    ctx.waitUntil(
      env.SEO.put(cacheKey, JSON.stringify(entry), { expirationTtl: MISS_TTL_SECONDS }).catch(
        () => undefined,
      ),
    );
  }

  // Une route inconnue se partage quand même : elle mérite une image décrite correctement.
  if (!meta) meta = withShareImage(unknownRouteMeta(rawPath, canonicalPath, lang), canonicalPath);

  return meta;
}

export async function handlePrerender(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const meta = await resolvePageMeta(normalizePath(url.pathname), env, ctx);

  const shell = await getSpaShell(env, ctx);
  const shellHeaders = new Headers(shell.headers);
  const transformed = injectMeta(shell, meta);

  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    // HTML prérendu = équivalent SEO d'index.html : jamais mis en cache, sinon
    // il référencerait des assets hachés supprimés au déploiement suivant.
    'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
  });
  // Sans ceci, les pages les plus visitées du site partiraient sans CSP ni HSTS :
  // une Response fabriquée n'hérite de rien de l'origine.
  applySecurityHeaders(headers, shellHeaders);

  return new Response(transformed.body, { status: 200, headers });
}
