import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SITE_URL = 'https://maxmorrys.me';

interface ContentDoc {
  slug: string;
  publishedAt?: string;
  updatedAt?: string;
  status?: string;
}

async function getPublishedSlugs(
  collectionName: string,
): Promise<ContentDoc[]> {
  const db = admin.firestore();
  const snap = await db
    .collection(collectionName)
    .where('status', '==', 'published')
    .select('slug', 'publishedAt', 'updatedAt')
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

function urlEntry(
  loc: string,
  lastmod?: string,
  changefreq = 'weekly',
  priority = '0.5',
): string {
  const lastmodTag = lastmod
    ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
    : '';
  return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
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
      urls.push(urlEntry(SITE_URL, undefined, 'daily', '1.0'));
      urls.push(urlEntry(`${SITE_URL}/a-propos`, undefined, 'monthly', '0.7'));
      urls.push(urlEntry(`${SITE_URL}/blog`, undefined, 'daily', '0.9'));
      urls.push(urlEntry(`${SITE_URL}/formations`, undefined, 'weekly', '0.9'));
      urls.push(urlEntry(`${SITE_URL}/podcasts`, undefined, 'weekly', '0.8'));
      urls.push(urlEntry(`${SITE_URL}/videos`, undefined, 'weekly', '0.8'));
      urls.push(urlEntry(`${SITE_URL}/faq`, undefined, 'monthly', '0.5'));
      urls.push(urlEntry(`${SITE_URL}/contact`, undefined, 'monthly', '0.5'));

      // Dynamic pages
      for (const p of posts) {
        urls.push(
          urlEntry(
            `${SITE_URL}/blog/${p.slug}`,
            p.updatedAt || p.publishedAt,
            'monthly',
            '0.7',
          ),
        );
      }
      for (const f of formations) {
        urls.push(
          urlEntry(
            `${SITE_URL}/formations/${f.slug}`,
            f.updatedAt || f.publishedAt,
            'weekly',
            '0.8',
          ),
        );
      }
      for (const p of podcasts) {
        urls.push(
          urlEntry(
            `${SITE_URL}/podcasts/${p.slug}`,
            p.publishedAt,
            'monthly',
            '0.6',
          ),
        );
      }
      for (const v of videos) {
        urls.push(
          urlEntry(
            `${SITE_URL}/videos/${v.slug}`,
            v.publishedAt,
            'monthly',
            '0.6',
          ),
        );
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
