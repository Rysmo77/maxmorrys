import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { enPath } from './segments';

const SITE_URL = 'https://maxmorrys.me';

interface ContentDoc {
  slug: string;
  slug_en?: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  status?: string;
  coverImage?: string;
  thumbnailUrl?: string;
}

async function getPublishedSlugs(collectionName: string): Promise<ContentDoc[]> {
  const db = admin.firestore();
  const snap = await db
    .collection(collectionName)
    .where('status', '==', 'published')
    .select('slug', 'slug_en', 'title', 'publishedAt', 'updatedAt', 'coverImage', 'thumbnailUrl')
    .get();
  return snap.docs.map((d) => d.data() as ContentDoc);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface UrlEntryOptions {
  /** Chemin FR canonique (ex: /blog ou /formations/mon-slug). */
  frPath: string;
  /** Chemin EN complet (ex: /en/courses/my-slug). */
  enFullPath: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  imageLoc?: string;
  imageTitle?: string;
}

/** Émet DEUX entrées <url> (fr + en) partageant les mêmes alternates hreflang. */
function urlEntryPair(opts: UrlEntryOptions): string {
  const { frPath, enFullPath, lastmod, changefreq = 'weekly', priority = '0.5', imageLoc, imageTitle } = opts;
  const frLoc = `${SITE_URL}${frPath}`;
  const enLoc = `${SITE_URL}${enFullPath}`;
  const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
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
  return make(frLoc) + '\n' + make(enLoc);
}

// Pages statiques (chemin FR canonique → fréquence/priorité).
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

export const sitemap = onRequest(
  { region: 'europe-west1', memory: '256MiB' },
  async (_req, res) => {
    try {
      const [posts, formations, podcasts, videos] = await Promise.all([
        getPublishedSlugs('blog'),
        getPublishedSlugs('formations'),
        getPublishedSlugs('podcasts'),
        getPublishedSlugs('videos'),
      ]);

      const urls: string[] = [];

      // Pages statiques (fr + en).
      for (const p of STATIC_PAGES) {
        urls.push(urlEntryPair({ frPath: p.path, enFullPath: enPath(p.path), changefreq: p.changefreq, priority: p.priority }));
      }

      // Pages dynamiques.
      const pushDynamic = (
        items: ContentDoc[],
        seg: string,
        changefreq: string,
        priority: string,
        imageKey: 'coverImage' | 'thumbnailUrl',
      ) => {
        for (const it of items) {
          if (!it.slug) continue;
          const frPath = `/${seg}/${it.slug}`;
          const enFullPath = enPath(`/${seg}/${it.slug_en || it.slug}`);
          urls.push(urlEntryPair({
            frPath,
            enFullPath,
            lastmod: it.updatedAt || it.publishedAt,
            changefreq,
            priority,
            imageLoc: it[imageKey],
            imageTitle: it.title,
          }));
        }
      };

      pushDynamic(posts, 'blog', 'monthly', '0.7', 'coverImage');
      pushDynamic(formations, 'formations', 'weekly', '0.8', 'coverImage');
      pushDynamic(podcasts, 'podcasts', 'monthly', '0.6', 'coverImage');
      pushDynamic(videos, 'videos', 'monthly', '0.6', 'thumbnailUrl');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.status(200).send(xml);
    } catch (error: unknown) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  },
);
