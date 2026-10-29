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
    // `status` doit figurer dans la requête : les règles n'autorisent la lecture
    // anonyme que des documents publiés, et un filtre absent fait échouer le `list`
    // entier en PERMISSION_DENIED — pas seulement les brouillons.
    const byEn = await getCollection<BlogPost>('blog', where('slug_en', '==', slug), where('status', '==', 'published'), limit(SLUG_DOUBLONS_MAX));
    if (byEn.length) return plusRecent(byEn);
  }
  const results = await getCollection<BlogPost>('blog', where('slug', '==', slug), where('status', '==', 'published'), limit(SLUG_DOUBLONS_MAX));
  return results.length ? plusRecent(results) : null;
}

/**
 * ⚠️ UN SLUG N'EST PAS UNIQUE EN BASE (relevé le 29/10/2026) : trois paires d'articles publiés
 * partagent le même `slug` FR (ex. `vendre-en-ligne-afrique-francophone-lois-2026`, publiés le
 * 18/04 et le 04/06). Avec `limit(1)` sans tri, la fiche ouvrait l'un pendant que l'accueil,
 * trié par `publishedAt`, en affichait l'autre — d'où « 04/06/2026 » sur la carte et « 18 avril
 * 2026 » sur l'article. On prend le plus récent, comme les listes. Un `orderBy` dans la requête
 * exigerait un index composite (slug, status, publishedAt) : le tri se fait donc ici.
 * La vraie correction est en base — renommer le slug des doublons.
 */
const SLUG_DOUBLONS_MAX = 5;
function plusRecent(posts: BlogPost[]): BlogPost {
  return posts.reduce((a, b) => (String(b.publishedAt ?? '') > String(a.publishedAt ?? '') ? b : a));
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
