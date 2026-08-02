import { localizedPath, type Lang } from '../i18n/routing';

export type ContentKind = 'blog' | 'formations' | 'podcasts' | 'videos';

const BASE: Record<ContentKind, string> = {
  blog: '/blog',
  formations: '/formations',
  podcasts: '/podcasts',
  videos: '/videos',
};

interface SluggedItem {
  slug: string;
  slug_en?: string;
}

/**
 * URL d'un contenu dynamique selon la langue active.
 * FR → /blog/{slug} ; EN → /en/{segEn}/{slug_en || slug} (segment localisé via localizedPath).
 */
export function contentPath(kind: ContentKind, item: SluggedItem, lang: Lang): string {
  const slug = lang === 'en' ? item.slug_en || item.slug : item.slug;
  return localizedPath(`${BASE[kind]}/${slug}`, lang);
}
