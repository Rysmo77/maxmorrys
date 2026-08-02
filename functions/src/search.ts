import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

/**
 * Indexation Typesense — entièrement « gated » par secrets.
 *
 * Callable ADMIN, déclenché manuellement (jamais automatiquement) : il (ré)indexe
 * le contenu publié (blog, formations, vidéos, podcasts) dans Typesense. Tant que
 * les secrets `TYPESENSE_URL` / `TYPESENSE_ADMIN_KEY` ne sont pas configurés, la
 * fonction renvoie une erreur claire et ne touche à rien.
 *
 * On dialogue avec l'API REST Typesense via `fetch` (global sur Node 18+) pour
 * éviter d'embarquer une dépendance SDK supplémentaire dans les functions.
 *
 * Configuration (une fois l'instance Typesense provisionnée) :
 *   firebase functions:secrets:set TYPESENSE_URL        # ex: https://xxx.a1.typesense.net:443
 *   firebase functions:secrets:set TYPESENSE_ADMIN_KEY
 *   firebase deploy --only functions:reindexSearch
 */
const typesenseUrl = defineSecret('TYPESENSE_URL');
const typesenseAdminKey = defineSecret('TYPESENSE_ADMIN_KEY');

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

/** Définition d'un index : collection source + projection d'un doc Firestore vers un doc de recherche. */
interface IndexSpec {
  name: string;
  collection: string;
  map: (id: string, d: FirebaseFirestore.DocumentData) => SearchDoc;
}

const SPECS: IndexSpec[] = [
  {
    name: 'blog',
    collection: 'blog',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.excerpt ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
    }),
  },
  {
    name: 'formations',
    collection: 'formations',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
    }),
  },
  {
    name: 'videos',
    collection: 'videos',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
    }),
  },
  {
    name: 'podcasts',
    collection: 'podcasts',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
    }),
  },
];

// Schéma Typesense (typé explicitement, contrairement à Meilisearch). Les champs
// optionnels sont marqués `optional` pour tolérer les docs sans catégorie/tags.
const SCHEMA_FIELDS = [
  { name: 'title', type: 'string' },
  { name: 'excerpt', type: 'string', optional: true },
  { name: 'slug', type: 'string' },
  { name: 'slug_en', type: 'string', optional: true },
  { name: 'category', type: 'string', facet: true, optional: true },
  { name: 'tags', type: 'string[]', facet: true, optional: true },
  { name: 'publishedAt', type: 'string', optional: true, sort: true },
];

export const reindexSearch = onCall(
  { region: 'us-central1', secrets: [typesenseUrl, typesenseAdminKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const baseUrl = typesenseUrl.value()?.replace(/\/$/, '');
    const apiKey = typesenseAdminKey.value();
    if (!baseUrl || !apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'Typesense non configuré : définissez les secrets TYPESENSE_URL et TYPESENSE_ADMIN_KEY.',
      );
    }

    const ts = async (
      method: string,
      path: string,
      body?: unknown,
      contentType = 'application/json',
    ): Promise<{ status: number; text: string }> => {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'X-TYPESENSE-API-KEY': apiKey,
          'Content-Type': contentType,
        },
        body: body === undefined
          ? undefined
          : typeof body === 'string' ? body : JSON.stringify(body),
      });
      const text = await res.text();
      // 404 toléré (collection pas encore créée lors du DELETE initial).
      if (!res.ok && res.status !== 404) {
        throw new HttpsError('internal', `Typesense ${method} ${path} → ${res.status}: ${text}`);
      }
      return { status: res.status, text };
    };

    const db = admin.firestore();
    const counts: Record<string, number> = {};

    for (const spec of SPECS) {
      const snap = await db
        .collection(spec.collection)
        .where('status', '==', 'published')
        .get();
      const docs = snap.docs.map((doc) => spec.map(doc.id, doc.data()));

      // Réindexation complète : on drop puis recrée la collection (purge des dépubliés + schéma à jour).
      await ts('DELETE', `/collections/${spec.name}`);
      await ts('POST', '/collections', { name: spec.name, fields: SCHEMA_FIELDS });

      if (docs.length > 0) {
        // Import Typesense = JSONL (une ligne JSON par doc), pas un tableau.
        const jsonl = docs.map((d) => JSON.stringify(d)).join('\n');
        await ts(
          'POST',
          `/collections/${spec.name}/documents/import?action=create`,
          jsonl,
          'text/plain',
        );
      }

      counts[spec.name] = docs.length;
    }

    return { success: true, counts };
  },
);
