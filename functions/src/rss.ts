import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SITE_URL = 'https://maxmorrys.me';
const FEED_TITLE = 'Max-Morrys — Blog';
const FEED_DESCRIPTION = 'Articles, analyses et actualités de Max-Morrys.';

interface BlogDoc {
  slug: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str: string): string {
  return `<![CDATA[${str.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function rfc822(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toUTCString();
}

export const rss = onRequest(
  { region: 'europe-west1', memory: '256MiB' },
  async (_req, res) => {
    try {
      const db = admin.firestore();
      const snap = await db
        .collection('blog')
        .where('status', '==', 'published')
        .select('slug', 'title', 'excerpt', 'coverImage', 'category', 'author', 'publishedAt', 'updatedAt')
        .get();

      const posts = snap.docs
        .map((d) => d.data() as BlogDoc)
        .filter((p) => p.slug)
        .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

      const lastBuild = rfc822(posts[0]?.updatedAt || posts[0]?.publishedAt);

      const items = posts
        .map((p) => {
          const link = `${SITE_URL}/blog/${p.slug}`;
          const imageTag = p.coverImage
            ? `<enclosure url="${escapeXml(p.coverImage)}" type="image/jpeg" />`
            : '';
          const categoryTag = p.category
            ? `<category>${cdata(p.category)}</category>`
            : '';
          const authorTag = p.author ? `<dc:creator>${cdata(p.author)}</dc:creator>` : '';
          return `    <item>
      <title>${cdata(p.title || '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${rfc822(p.publishedAt)}</pubDate>
      ${authorTag}
      ${categoryTag}
      <description>${cdata(p.excerpt || '')}</description>
      ${imageTag}
    </item>`;
        })
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${cdata(FEED_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${cdata(FEED_DESCRIPTION)}</description>
    <language>fr</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.status(200).send(xml);
    } catch (error: unknown) {
      console.error('RSS generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  },
);
