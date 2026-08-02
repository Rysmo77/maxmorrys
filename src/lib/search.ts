import { SearchClient as TypesenseSearchClient } from 'typesense';

/**
 * Client Typesense côté front — entièrement « gated » par les variables d'env.
 *
 * Tant que `VITE_TYPESENSE_HOST` et `VITE_TYPESENSE_SEARCH_KEY` ne sont pas définis,
 * `isSearchEnabled` vaut `false` et aucune requête n'est émise : les pages conservent
 * leur filtrage client actuel. Une fois une instance Typesense provisionnée et ces
 * variables renseignées, on peut brancher l'UI sur `searchContent`.
 *
 * ⚠️ N'utiliser ici QUE la clé de recherche (search-only, scopée), jamais la clé
 * admin/master : ce code tourne dans le navigateur. On utilise `SearchClient`
 * (restreint aux opérations de recherche) plutôt que le client complet.
 */
const HOST = import.meta.env.VITE_TYPESENSE_HOST as string | undefined;
const SEARCH_KEY = import.meta.env.VITE_TYPESENSE_SEARCH_KEY as string | undefined;
const PROTOCOL = (import.meta.env.VITE_TYPESENSE_PROTOCOL as string | undefined) ?? 'https';
const PORT = Number(import.meta.env.VITE_TYPESENSE_PORT ?? (PROTOCOL === 'https' ? 443 : 8108));

export const isSearchEnabled = Boolean(HOST && SEARCH_KEY);

/** Collections Typesense, alignées sur celles indexées côté functions. */
export const SEARCH_INDEXES = {
  blog: 'blog',
  formations: 'formations',
  videos: 'videos',
  podcasts: 'podcasts',
} as const;

export type SearchIndex = (typeof SEARCH_INDEXES)[keyof typeof SEARCH_INDEXES];

let client: TypesenseSearchClient | null = null;
function getClient(): TypesenseSearchClient | null {
  if (!isSearchEnabled) return null;
  if (!client) {
    client = new TypesenseSearchClient({
      nodes: [{ host: HOST!, port: PORT, protocol: PROTOCOL }],
      apiKey: SEARCH_KEY!,
      connectionTimeoutSeconds: 5,
    });
  }
  return client;
}

export interface SearchOptions {
  perPage?: number;
  /** Filtre Typesense (ex: `category:=SEO`). Le champ doit être `facet`/filtrable dans le schéma. */
  filterBy?: string;
}

/**
 * Recherche full-text dans une collection. Retourne `null` si la recherche n'est pas
 * configurée (l'appelant doit alors retomber sur son filtrage client local).
 */
export async function searchContent<T = Record<string, unknown>>(
  index: SearchIndex,
  query: string,
  options: SearchOptions = {},
): Promise<T[] | null> {
  const c = getClient();
  if (!c) return null;
  const res = await c.collections(index).documents().search({
    q: query,
    query_by: 'title,excerpt,category,tags',
    filter_by: options.filterBy,
    per_page: options.perPage ?? 20,
  }, {});
  return (res.hits ?? []).map((h) => (h as { document: T }).document);
}
