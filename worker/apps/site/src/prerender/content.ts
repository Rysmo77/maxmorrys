import type { DocSnapshot, Firestore } from '@mm/firestore-rest';

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../constants';
import { asText } from '../seo/values';
import { stripMarkdown } from './html';
import { enPath } from './segments';
import { getFaqQuestionMeta } from './faq';
import type { PageMeta } from './types';

/** Port de la résolution de contenu dynamique de `functions/src/prerender.ts`. */

type Doc = Record<string, unknown>;

function str(value: unknown): string | undefined {
  return asText(value);
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Résout un document publié par slug (ou `slug_en` en anglais).
 *
 * La première requête ne filtre volontairement pas sur `status` : le statut est
 * vérifié après coup, exactement comme dans la Cloud Function — un index
 * composite `slug_en + status` n'existe pas.
 */
async function resolveBySlug(
  db: Firestore,
  collection: string,
  slug: string,
  lang: 'fr' | 'en',
): Promise<Doc | null> {
  if (lang === 'en') {
    const byEn: DocSnapshot[] = await db.query({
      collection,
      where: [{ field: 'slug_en', op: '==', value: slug }],
      limit: 1,
    });
    if (byEn.length > 0 && byEn[0].data.status === 'published') return byEn[0].data;
  }

  const bySlug = await db.query({
    collection,
    where: [
      { field: 'slug', op: '==', value: slug },
      { field: 'status', op: '==', value: 'published' },
    ],
    limit: 1,
  });
  return bySlug.length > 0 ? bySlug[0].data : null;
}

/** Canonical + alternates hreflang d'un contenu. */
function altMeta(
  segment: string,
  data: Doc,
  lang: 'fr' | 'en',
): Pick<PageMeta, 'canonical' | 'altFr' | 'altEn' | 'lang'> {
  const frUrl = `${SITE_URL}/${segment}/${str(data.slug) ?? ''}`;
  const enUrl = `${SITE_URL}${enPath(`/${segment}/${str(data.slug_en) || str(data.slug) || ''}`)}`;
  return {
    canonical: str(data.canonicalUrl) || (lang === 'en' ? enUrl : frUrl),
    altFr: frUrl,
    altEn: enUrl,
    lang,
  };
}

/**
 * Concatène résumé et corps long.
 *
 * La Cloud Function écrit `post.excerpt + ...` sans garde : un article sans
 * résumé produit littéralement « undefined » dans le corps SEO. Le repli sur
 * chaîne vide ne change la sortie que dans ce cas dégradé.
 */
function joinBody(lead: string | undefined, extra: string): string {
  return (lead ?? '') + extra;
}

export async function getContentMeta(
  db: Firestore,
  path: string,
  lang: 'fr' | 'en',
): Promise<PageMeta | null> {
  /*
   * Question de la FAQ : /faq/:slug
   *
   * En tête, et pas en queue : `routes.ts` route `/faq/**` vers le pré-rendu depuis que les
   * questions ont une adresse, mais aucune branche ne les produisait — toutes repartaient en
   * `noindex` avec la méta générique du site. La résolution vit dans `faq.ts` parce qu'elle
   * ne ressemble à aucune des quatre autres : pas de champ `status`, pas de `slug_en`, et un
   * slug DÉRIVÉ du texte de la question, donc impossible à interroger directement.
   */
  const faqMatch = path.match(/^\/faq\/([^/?#]+)$/);
  if (faqMatch) return getFaqQuestionMeta(db, faqMatch[1], lang);

  // Article : /blog/:slug
  const blogMatch = path.match(/^\/blog\/([^/?#]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const post = await resolveBySlug(db, 'blog', slug, lang);
    if (!post) return null;

    const content = str(post.content);
    const readTime = num(post.readTime);

    return {
      title: `${str(post.metaTitle) || str(post.title)} | ${SITE_NAME}`,
      description: str(post.metaDescription) || str(post.excerpt) || '',
      ogType: 'article',
      ogImage: str(post.ogImage) || str(post.coverImage) || DEFAULT_OG_IMAGE,
      ogImageAlt: str(post.title),
      noIndex: post.noIndex === true,
      publishedAt: str(post.publishedAt),
      modifiedAt: str(post.updatedAt),
      h1: str(post.title),
      bodyText: joinBody(
        str(post.excerpt),
        content ? `\n\n${stripMarkdown(content).slice(0, 2000)}` : '',
      ),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: str(post.title),
        description: str(post.excerpt),
        image: str(post.coverImage),
        datePublished: str(post.publishedAt),
        dateModified: str(post.updatedAt) || str(post.publishedAt),
        author: { '@type': 'Person', name: str(post.author) || 'Max-Morrys' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
        articleSection: str(post.category),
        keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
        articleBody: content ? stripMarkdown(content) : str(post.excerpt),
        ...(readTime && readTime > 0 ? { timeRequired: `PT${readTime}M` } : {}),
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: str(post.title) ?? '', url: `${SITE_URL}/blog/${str(post.slug) ?? ''}` },
      ],
      ...altMeta('blog', post, lang),
    };
  }

  // Formation : /formations/:slug
  const formationMatch = path.match(/^\/formations\/([^/?#]+)$/);
  if (formationMatch) {
    const slug = formationMatch[1];
    const formation = await resolveBySlug(db, 'formations', slug, lang);
    if (!formation) return null;

    const longDescription = str(formation.longDescription);
    const longDesc = longDescription ? stripMarkdown(longDescription).slice(0, 2000) : '';
    const rating = num(formation.rating);

    return {
      title: `${str(formation.metaTitle) || str(formation.title)} | ${SITE_NAME}`,
      description: str(formation.metaDescription) || str(formation.description) || '',
      ogType: 'website',
      ogImage: str(formation.ogImage) || str(formation.coverImage) || DEFAULT_OG_IMAGE,
      ogImageAlt: str(formation.title),
      noIndex: formation.noIndex === true,
      publishedAt: str(formation.publishedAt),
      modifiedAt: str(formation.updatedAt),
      h1: str(formation.title),
      bodyText: joinBody(str(formation.description), longDesc ? `\n\n${longDesc}` : ''),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: str(formation.title),
        description: str(formation.description),
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        educationalLevel: str(formation.level),
        inLanguage: 'fr',
        image: str(formation.coverImage),
        offers: {
          '@type': 'Offer',
          price: num(formation.promoPrice) ?? num(formation.price),
          priceCurrency: 'XOF',
          // Une formation en Coming Soon est publiée, donc pré-rendue comme les autres :
          // sans cette distinction, son balisage l'annoncerait en stock aux moteurs.
          availability: formation.comingSoon === true
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/formations/${slug}`,
        },
        ...(rating && rating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating,
                bestRating: 5,
                ratingCount: num(formation.students) || 1,
              },
            }
          : {}),
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Formations', url: `${SITE_URL}/formations` },
        {
          name: str(formation.title) ?? '',
          url: `${SITE_URL}/formations/${str(formation.slug) ?? ''}`,
        },
      ],
      ...altMeta('formations', formation, lang),
    };
  }

  // Podcast : /podcasts/:slug
  const podcastMatch = path.match(/^\/podcasts\/([^/?#]+)$/);
  if (podcastMatch) {
    const slug = podcastMatch[1];
    const podcast = await resolveBySlug(db, 'podcasts', slug, lang);
    if (!podcast) return null;

    const transcript = str(podcast.transcript);

    return {
      title: `${str(podcast.metaTitle) || str(podcast.title)} | ${SITE_NAME}`,
      description: str(podcast.metaDescription) || str(podcast.description) || '',
      ogType: 'music.song',
      ogImage: str(podcast.ogImage) || str(podcast.coverImage) || DEFAULT_OG_IMAGE,
      ogImageAlt: str(podcast.title),
      noIndex: podcast.noIndex === true,
      publishedAt: str(podcast.publishedAt),
      modifiedAt: str(podcast.updatedAt),
      h1: str(podcast.title),
      bodyText:
        (str(podcast.description) || '') +
        (transcript ? `\n\n${stripMarkdown(transcript).slice(0, 2000)}` : ''),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'PodcastEpisode',
        name: str(podcast.title),
        description: str(podcast.description),
        datePublished: str(podcast.publishedAt),
        timeRequired: str(podcast.duration),
        image: str(podcast.coverImage),
        url: `${SITE_URL}/podcasts/${slug}`,
        partOfSeries: {
          '@type': 'PodcastSeries',
          name: 'Le Podcast du Marketing — Max-Morrys',
          url: `${SITE_URL}/podcasts`,
        },
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Podcasts', url: `${SITE_URL}/podcasts` },
        { name: str(podcast.title) ?? '', url: `${SITE_URL}/podcasts/${str(podcast.slug) ?? ''}` },
      ],
      ...altMeta('podcasts', podcast, lang),
    };
  }

  // Vidéo : /videos/:slug
  const videoMatch = path.match(/^\/videos\/([^/?#]+)$/);
  if (videoMatch) {
    const slug = videoMatch[1];
    const video = await resolveBySlug(db, 'videos', slug, lang);
    if (!video) return null;

    return {
      title: `${str(video.metaTitle) || str(video.title)} | ${SITE_NAME}`,
      description: str(video.metaDescription) || str(video.description) || '',
      ogType: 'video.other',
      ogImage: str(video.ogImage) || str(video.thumbnailUrl) || DEFAULT_OG_IMAGE,
      ogImageAlt: str(video.title),
      noIndex: video.noIndex === true,
      publishedAt: str(video.publishedAt),
      modifiedAt: str(video.updatedAt),
      h1: str(video.title),
      bodyText: str(video.description) || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: str(video.title),
        description: str(video.description),
        thumbnailUrl: str(video.thumbnailUrl),
        uploadDate: str(video.publishedAt),
        duration: str(video.duration),
        embedUrl: str(video.videoUrl),
        url: `${SITE_URL}/videos/${slug}`,
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Vidéos', url: `${SITE_URL}/videos` },
        { name: str(video.title) ?? '', url: `${SITE_URL}/videos/${str(video.slug) ?? ''}` },
      ],
      ...altMeta('videos', video, lang),
    };
  }

  return null;
}
