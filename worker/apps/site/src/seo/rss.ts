import type { Firestore } from '@mm/firestore-rest';

import { SITE_URL } from '../constants';
import { asText, cdata, escapeXml, rfc822 } from './values';

/** Port fidèle de `functions/src/rss.ts`. */

const FEED_TITLE = 'Max-Morrys — Blog';
const FEED_DESCRIPTION = 'Articles, analyses et actualités de Max-Morrys.';

interface BlogDoc {
  slug?: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export async function buildRss(db: Firestore): Promise<string> {
  const documents = await db.query({
    collection: 'blog',
    where: [{ field: 'status', op: '==', value: 'published' }],
    select: ['slug', 'title', 'excerpt', 'coverImage', 'category', 'author', 'publishedAt', 'updatedAt'],
  });

  const posts: BlogDoc[] = documents
    .map((document) => ({
      slug: asText(document.data.slug),
      title: asText(document.data.title),
      excerpt: asText(document.data.excerpt),
      coverImage: asText(document.data.coverImage),
      category: asText(document.data.category),
      author: asText(document.data.author),
      publishedAt: asText(document.data.publishedAt),
      updatedAt: asText(document.data.updatedAt),
    }))
    .filter((post) => post.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
    );

  const lastBuild = rfc822(posts[0]?.updatedAt || posts[0]?.publishedAt);

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/blog/${post.slug}`;
      const imageTag = post.coverImage
        ? `<enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg" />`
        : '';
      const categoryTag = post.category ? `<category>${cdata(post.category)}</category>` : '';
      const authorTag = post.author ? `<dc:creator>${cdata(post.author)}</dc:creator>` : '';

      return `    <item>
      <title>${cdata(post.title || '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${rfc822(post.publishedAt)}</pubDate>
      ${authorTag}
      ${categoryTag}
      <description>${cdata(post.excerpt || '')}</description>
      ${imageTag}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
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
}
