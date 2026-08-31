import type { Firestore } from '@mm/firestore-rest';

import { SITE_URL } from '../constants';
import { enPath } from '../prerender/segments';
import { asIsoDate, asText, escapeXml } from './values';

/** Port fidèle de `functions/src/sitemap.ts`. */

interface ContentDoc {
  slug?: string;
  slug_en?: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
  thumbnailUrl?: string;
}

const PROJECTION = [
  'slug',
  'slug_en',
  'title',
  'publishedAt',
  'updatedAt',
  'coverImage',
  'thumbnailUrl',
];

async function getPublished(db: Firestore, collection: string): Promise<ContentDoc[]> {
  const documents = await db.query({
    collection,
    where: [{ field: 'status', op: '==', value: 'published' }],
    select: PROJECTION,
  });

  return documents.map((document) => ({
    slug: asText(document.data.slug),
    slug_en: asText(document.data.slug_en),
    title: asText(document.data.title),
    publishedAt: asText(document.data.publishedAt),
    updatedAt: asText(document.data.updatedAt),
    coverImage: asText(document.data.coverImage),
    thumbnailUrl: asText(document.data.thumbnailUrl),
  }));
}

interface UrlEntryOptions {
  frPath: string;
  enFullPath: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  imageLoc?: string;
  imageTitle?: string;
}

/** Émet DEUX entrées <url> (fr + en) partageant les mêmes alternates hreflang. */
function urlEntryPair(options: UrlEntryOptions): string {
  const {
    frPath,
    enFullPath,
    lastmod,
    changefreq = 'weekly',
    priority = '0.5',
    imageLoc,
    imageTitle,
  } = options;

  const frLoc = `${SITE_URL}${frPath}`;
  const enLoc = `${SITE_URL}${enFullPath}`;
  const iso = asIsoDate(lastmod);
  const lastmodTag = iso ? `<lastmod>${iso}</lastmod>` : '';
  const imageTag = imageLoc
    ? `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>${
        imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''
      }</image:image>`
    : '';
  const alternates =
    `<xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(frLoc)}"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(frLoc)}"/>`;

  const make = (loc: string) =>
    `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates}${imageTag}</url>`;

  return `${make(frLoc)}\n${make(enLoc)}`;
}

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/a-propos', changefreq: 'monthly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/formations', changefreq: 'weekly', priority: '0.9' },
  /*
   * LE PÔLE MÉDIA, ET PAS SES DEUX ANCÊTRES. `/podcasts` et `/videos` REDIRIGENT désormais
   * vers `/podcast-et-videos` : les laisser au sitemap y déclarait deux redirections comme
   * des pages, ce que Google signale en « page avec redirection » et n'indexe pas. Leurs
   * FICHES de détail, elles, gardent leurs adresses et restent poussées plus bas.
   */
  { path: '/podcast-et-videos', changefreq: 'weekly', priority: '0.8' },
  /*
   * L'autre étage du territoire violet — payant, fermé, mais sa page de vente est publique.
   */
  { path: '/club-des-digitos', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/agence', changefreq: 'monthly', priority: '0.8' },
  { path: '/presence-digitale', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  /*
   * La vérification d'un code. Elle se cherche depuis un moteur par quelqu'un qui a un
   * document entre les mains et ne connaît pas la marque — c'est exactement son public.
   */
  { path: '/verifier', changefreq: 'yearly', priority: '0.4' },
  { path: '/legal/mentions-legales', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/confidentialite', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cgv', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cgu', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
];

export async function buildSitemap(db: Firestore): Promise<string> {
  const [posts, formations, podcasts, videos] = await Promise.all([
    getPublished(db, 'blog'),
    getPublished(db, 'formations'),
    getPublished(db, 'podcasts'),
    getPublished(db, 'videos'),
  ]);

  const urls: string[] = [];

  for (const page of STATIC_PAGES) {
    urls.push(
      urlEntryPair({
        frPath: page.path,
        enFullPath: enPath(page.path),
        changefreq: page.changefreq,
        priority: page.priority,
      }),
    );
  }

  const pushDynamic = (
    items: ContentDoc[],
    segment: string,
    changefreq: string,
    priority: string,
    imageKey: 'coverImage' | 'thumbnailUrl',
  ) => {
    for (const item of items) {
      if (!item.slug) continue;
      urls.push(
        urlEntryPair({
          frPath: `/${segment}/${item.slug}`,
          enFullPath: enPath(`/${segment}/${item.slug_en || item.slug}`),
          lastmod: item.updatedAt || item.publishedAt,
          changefreq,
          priority,
          imageLoc: item[imageKey],
          imageTitle: item.title,
        }),
      );
    }
  };

  pushDynamic(posts, 'blog', 'monthly', '0.7', 'coverImage');
  pushDynamic(formations, 'formations', 'weekly', '0.8', 'coverImage');
  pushDynamic(podcasts, 'podcasts', 'monthly', '0.6', 'coverImage');
  pushDynamic(videos, 'videos', 'monthly', '0.6', 'thumbnailUrl');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}
