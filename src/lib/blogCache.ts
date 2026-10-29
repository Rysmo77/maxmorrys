import { queryClient } from './queryClient';
import type { BlogPost } from '../types';

/**
 * UN ARTICLE DÉJÀ EN MÉMOIRE — lu dans les listes que TanStack Query garde (`['blog', …]` :
 * l'index du blog, les récents de l'accueil, « À lire ensuite »).
 *
 * Ces listes portent le document ENTIER, corps compris. Un article ouvert depuis l'une
 * d'elles n'a donc rien à redemander : il s'affiche dans la même image que le clic, au lieu
 * des ~2 s de page vide relevées par l'audit du 29/10/2026.
 *
 * Même priorité que `getPostBySlug` : en anglais, le slug anglais d'abord.
 */
export function findCachedPost(slug: string, lang: 'fr' | 'en'): BlogPost | undefined {
  const posts = queryClient
    .getQueriesData<unknown>({ queryKey: ['blog'] })
    .flatMap(([, data]) => (Array.isArray(data) ? (data as BlogPost[]) : []))
    .filter((p) => p && p.status === 'published' && typeof p.content === 'string' && p.content.length > 0);
  return (
    (lang === 'en' ? posts.find((p) => p.slug_en === slug) : undefined) ??
    posts.find((p) => p.slug === slug)
  );
}
