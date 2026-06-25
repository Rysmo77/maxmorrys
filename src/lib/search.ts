import { Meilisearch } from 'meilisearch';

/**
 * Client Meilisearch côté front — entièrement « gated » par les variables d'env.
 *
 * Tant que `VITE_MEILISEARCH_HOST` et `VITE_MEILISEARCH_SEARCH_KEY` ne sont pas
 * définis, `isSearchEnabled` vaut `false` et aucune requête n'est émise : les pages
 * conservent leur filtrage client actuel. Une fois une instance Meilisearch
 * provisionnée et ces variables renseignées, on peut brancher l'UI sur `searchContent`.
 *
 * ⚠️ N'utiliser ici QUE la clé de recherche (search-only / public), jamais la clé
 * admin/master : ce code tourne dans le navigateur.
 */
const HOST = import.meta.env.VITE_MEILISEARCH_HOST as string | undefined;
const SEARCH_KEY = import.meta.env.VITE_MEILISEARCH_SEARCH_KEY as string | undefined;

export const isSearchEnabled = Boolean(HOST && SEARCH_KEY);

/** Index Meilisearch, alignés sur les collections Firestore indexées côté functions. */
export const SEARCH_INDEXES = {
  blog: 'blog',
  formations: 'formations',
  videos: 'videos',
  podcasts: 'podcasts',
} as const;

export type SearchIndex = (typeof SEARCH_INDEXES)[keyof typeof SEARCH_INDEXES];

let client: Meilisearch | null = null;
function getClient(): Meilisearch | null {
  if (!isSearchEnabled) return null;
  if (!client) client = new Meilisearch({ host: HOST!, apiKey: SEARCH_KEY! });
  return client;
}

export interface SearchOptions {
  limit?: number;
  /** Filtres Meilisearch (ex: `category = "SEO"`). L'index doit déclarer l'attribut filtrable. */
  filter?: string | string[];
}

/**
 * Recherche full-text dans un index. Retourne `null` si la recherche n'est pas
 * configurée (l'appelant doit alors retomber sur son filtrage client local).
 */
export async function searchContent<T = Record<string, unknown>>(
  index: SearchIndex,
  query: string,
  options: SearchOptions = {},
): Promise<T[] | null> {
  const c = getClient();
  if (!c) return null;
  const res = await c.index(index).search(query, {
    limit: options.limit ?? 20,
    filter: options.filter,
  });
  return res.hits as T[];
}
