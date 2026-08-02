import { where, orderBy, limit, startAfter, doc, updateDoc, increment, type DocumentData } from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, db } from './helpers';
import type { BlogPost } from '../../types';

export async function getPublishedPosts(limitN = 50): Promise<BlogPost[]> {
  return getCollection<BlogPost>(
    'blog',
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(limitN),
  );
}

export async function getPublishedPostsPaginated(
  pageSize = 12,
  lastPublishedAt?: string,
): Promise<{ posts: BlogPost[]; hasMore: boolean }> {
  const constraints = [
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    ...(lastPublishedAt ? [startAfter(lastPublishedAt)] : []),
    limit(pageSize + 1),
  ];
  const data = await getCollection<BlogPost>('blog', ...constraints);
  const hasMore = data.length > pageSize;
  return { posts: data.slice(0, pageSize), hasMore };
}

export async function getPostBySlug(slug: string, lang: 'fr' | 'en' = 'fr'): Promise<BlogPost | null> {
  if (lang === 'en') {
    const byEn = await getCollection<BlogPost>('blog', where('slug_en', '==', slug), limit(1));
    if (byEn[0]?.status === 'published') return byEn[0];
  }
  const results = await getCollection<BlogPost>('blog', where('slug', '==', slug), where('status', '==', 'published'), limit(1));
  return results[0] ?? null;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return getCollection<BlogPost>('blog', orderBy('publishedAt', 'desc'));
}

export async function savePost(data: Omit<BlogPost, 'id'>, id?: string): Promise<string> {
  if (id) {
    await setDocById('blog', id, data as DocumentData);
    return id;
  }
  return createDoc('blog', data as DocumentData);
}

export async function deletePost(id: string): Promise<void> {
  return deleteDocById('blog', id);
}

export async function incrementBlogViews(id: string): Promise<void> {
  await updateDoc(doc(db, 'blog', id), { views: increment(1) });
}
