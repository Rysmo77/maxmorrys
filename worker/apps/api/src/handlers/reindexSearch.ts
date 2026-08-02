import type { DocSnapshot } from '@mm/firestore-rest';
import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';
import { asText } from '../lib/values';

/** Port de `reindexSearch` (functions/src/search.ts). */

interface SearchDoc {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  slug_en?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
}

interface IndexSpec {
  name: string;
  collection: string;
  /** Champ source du résumé : `excerpt` pour le blog, `description` ailleurs. */
  excerptField: 'excerpt' | 'description';
  withTags: boolean;
}

const SPECS: IndexSpec[] = [
  { name: 'blog', collection: 'blog', excerptField: 'excerpt', withTags: true },
  { name: 'formations', collection: 'formations', excerptField: 'description', withTags: true },
  { name: 'videos', collection: 'videos', excerptField: 'description', withTags: false },
  { name: 'podcasts', collection: 'podcasts', excerptField: 'description', withTags: false },
];

/**
 * Schéma Typesense. Les champs optionnels sont marqués comme tels pour tolérer
 * les documents sans catégorie ni tags.
 */
const SCHEMA_FIELDS = [
  { name: 'title', type: 'string' },
  { name: 'excerpt', type: 'string', optional: true },
  { name: 'slug', type: 'string' },
  { name: 'slug_en', type: 'string', optional: true },
  { name: 'category', type: 'string', facet: true, optional: true },
  { name: 'tags', type: 'string[]', facet: true, optional: true },
  { name: 'publishedAt', type: 'string', optional: true, sort: true },
];

function toSearchDoc(document: DocSnapshot, spec: IndexSpec): SearchDoc {
  const data = document.data;
  const tags =
    spec.withTags && Array.isArray(data.tags)
      ? (data.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : undefined;

  return {
    id: document.id,
    title: asText(data.title) ?? '',
    excerpt: asText(data[spec.excerptField]) ?? '',
    slug: asText(data.slug) ?? '',
    slug_en: asText(data.slug_en),
    category: asText(data.category),
    tags,
    publishedAt: asText(data.publishedAt),
  };
}

export async function reindexSearch(_data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const baseUrl = context.env.TYPESENSE_URL?.replace(/\/$/, '');
  const apiKey = context.env.TYPESENSE_ADMIN_KEY;
  if (!baseUrl || !apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'Typesense non configuré : définissez les secrets TYPESENSE_URL et TYPESENSE_ADMIN_KEY.',
    );
  }

  const typesense = async (
    method: string,
    path: string,
    body?: unknown,
    contentType = 'application/json',
  ): Promise<void> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'X-TYPESENSE-API-KEY': apiKey, 'Content-Type': contentType },
      body:
        body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    // 404 toléré : la collection peut ne pas exister lors du DELETE initial.
    if (!response.ok && response.status !== 404) {
      const detail = await response.text().catch(() => '');
      throw new HttpsError(
        'internal',
        `Typesense ${method} ${path} → ${response.status}: ${detail.slice(0, 200)}`,
      );
    }
  };

  const counts: Record<string, number> = {};

  for (const spec of SPECS) {
    const documents = await context.db.query({
      collection: spec.collection,
      where: [{ field: 'status', op: '==', value: 'published' }],
    });
    const searchDocs = documents.map((document) => toSearchDoc(document, spec));

    // Réindexation complète : drop puis recréation, ce qui purge les dépubliés
    // et applique le schéma courant.
    await typesense('DELETE', `/collections/${spec.name}`);
    await typesense('POST', '/collections', { name: spec.name, fields: SCHEMA_FIELDS });

    if (searchDocs.length > 0) {
      // L'import Typesense attend du JSONL — une ligne JSON par document, pas un tableau.
      const jsonl = searchDocs.map((d) => JSON.stringify(d)).join('\n');
      await typesense(
        'POST',
        `/collections/${spec.name}/documents/import?action=create`,
        jsonl,
        'text/plain',
      );
    }

    counts[spec.name] = searchDocs.length;
  }

  return { success: true, counts };
}
