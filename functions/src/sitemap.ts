import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SITE_URL = 'https://maxmorrys.me';

interface ContentDoc {
  slug: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  status?: string;
  coverImage?: string;
  thumbnailUrl?: string;
}

async function getPublishedSlugs(
  collectionName: string,
): Promise<ContentDoc[]> {
  const db = admin.firestore();
  const snap = await db
    .collection(collectionName)
    .where('status', '==', 'published')
    .select('slug', 'title', 'publishedAt', 'updatedAt', 'coverImage', 'thumbnailUrl')
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
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  imageLoc?: string;
  imageTitle?: string;
}

function urlEntry(opts: UrlEntryOptions): string {
  const { loc, lastmod, changefreq = 'weekly', priority = '0.5', imageLoc, imageTitle } = opts;
  const lastmodTag = lastmod
    ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
    : '';
  const imageTag = imageLoc
    ? `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>${
        imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''
      }</image:image>`
    : '';
  return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${imageTag}</url>`;
}

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

      // Static pages
      urls.push(urlEntry({ loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/a-propos`, changefreq: 'monthly', priority: '0.7' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/blog`, changefreq: 'daily', priority: '0.9' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/formations`, changefreq: 'weekly', priority: '0.9' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/podcasts`, changefreq: 'weekly', priority: '0.8' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/videos`, changefreq: 'weekly', priority: '0.8' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/faq`, changefreq: 'monthly', priority: '0.5' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.5' }));

      // Legal pages
      urls.push(urlEntry({ loc: `${SITE_URL}/legal/mentions-legales`, changefreq: 'yearly', priority: '0.3' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/legal/confidentialite`, changefreq: 'yearly', priority: '0.3' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/legal/cgv`, changefreq: 'yearly', priority: '0.3' }));
      urls.push(urlEntry({ loc: `${SITE_URL}/legal/cookies`, changefreq: 'yearly', priority: '0.3' }));

      // Dynamic pages — blog
      for (const p of posts) {
        if (!p.slug) continue;
        urls.push(urlEntry({
          loc: `${SITE_URL}/blog/${p.slug}`,
          lastmod: p.updatedAt || p.publishedAt,
          changefreq: 'monthly',
          priority: '0.7',
          imageLoc: p.coverImage,
          imageTitle: p.title,
        }));
      }
      // Dynamic pages — formations
      for (const f of formations) {
        if (!f.slug) continue;
        urls.push(urlEntry({
          loc: `${SITE_URL}/formations/${f.slug}`,
          lastmod: f.updatedAt || f.publishedAt,
          changefreq: 'weekly',
          priority: '0.8',
          imageLoc: f.coverImage,
          imageTitle: f.title,
        }));
      }
      // Dynamic pages — podcasts
      for (const p of podcasts) {
        if (!p.slug) continue;
        urls.push(urlEntry({
          loc: `${SITE_URL}/podcasts/${p.slug}`,
          lastmod: p.updatedAt || p.publishedAt,
          changefreq: 'monthly',
          priority: '0.6',
          imageLoc: p.coverImage,
          imageTitle: p.title,
        }));
      }
      // Dynamic pages — videos
      for (const v of videos) {
        if (!v.slug) continue;
        urls.push(urlEntry({
          loc: `${SITE_URL}/videos/${v.slug}`,
          lastmod: v.updatedAt || v.publishedAt,
          changefreq: 'monthly',
          priority: '0.6',
          imageLoc: v.thumbnailUrl,
          imageTitle: v.title,
        }));
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
