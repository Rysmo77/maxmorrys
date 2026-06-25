import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

/**
 * Indexation Meilisearch — entièrement « gated » par secrets.
 *
 * Callable ADMIN, déclenché manuellement (jamais automatiquement) : il (ré)indexe
 * le contenu publié (blog, formations, vidéos, podcasts) dans Meilisearch. Tant que
 * les secrets `MEILISEARCH_HOST` / `MEILISEARCH_ADMIN_KEY` ne sont pas configurés,
 * la fonction renvoie une erreur claire et ne touche à rien.
 *
 * On dialogue avec l'API REST Meilisearch via `fetch` (global sur Node 18+) pour
 * éviter d'embarquer une dépendance SDK supplémentaire dans les functions.
 *
 * Configuration (une fois l'instance Meilisearch provisionnée) :
 *   firebase functions:secrets:set MEILISEARCH_HOST
 *   firebase functions:secrets:set MEILISEARCH_ADMIN_KEY
 *   firebase deploy --only functions:reindexSearch
 */
const meiliHost = defineSecret('MEILISEARCH_HOST');
const meiliAdminKey = defineSecret('MEILISEARCH_ADMIN_KEY');

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
  index: string;
  collection: string;
  map: (id: string, d: FirebaseFirestore.DocumentData) => SearchDoc;
}

const SPECS: IndexSpec[] = [
  {
    index: 'blog',
    collection: 'blog',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.excerpt ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
    }),
  },
  {
    index: 'formations',
    collection: 'formations',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
    }),
  },
  {
    index: 'videos',
    collection: 'videos',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
    }),
  },
  {
    index: 'podcasts',
    collection: 'podcasts',
    map: (id, d) => ({
      id, title: d.title ?? '', excerpt: d.description ?? '', slug: d.slug ?? '',
      slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
    }),
  },
];

export const reindexSearch = onCall(
  { region: 'us-central1', secrets: [meiliHost, meiliAdminKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const host = meiliHost.value()?.replace(/\/$/, '');
    const apiKey = meiliAdminKey.value();
    if (!host || !apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'Meilisearch non configuré : définissez les secrets MEILISEARCH_HOST et MEILISEARCH_ADMIN_KEY.',
      );
    }

    const meili = async (method: string, path: string, body?: unknown): Promise<Response> => {
      const res = await fetch(`${host}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      // 404 toléré sur les suppressions (index/documents pas encore créés).
      if (!res.ok && res.status !== 404) {
        const text = await res.text();
        throw new HttpsError('internal', `Meilisearch ${method} ${path} → ${res.status}: ${text}`);
      }
      return res;
    };

    const db = admin.firestore();
    const counts: Record<string, number> = {};

    for (const spec of SPECS) {
      const snap = await db
        .collection(spec.collection)
        .where('status', '==', 'published')
        .get();
      const docs = snap.docs.map((doc) => spec.map(doc.id, doc.data()));

      // Crée l'index si absent (ignore le conflit s'il existe déjà), puis règle les attributs.
      await meili('POST', '/indexes', { uid: spec.index, primaryKey: 'id' });
      await meili('PATCH', `/indexes/${spec.index}/settings`, {
        searchableAttributes: ['title', 'excerpt', 'category', 'tags'],
        filterableAttributes: ['category'],
        sortableAttributes: ['publishedAt'],
      });
      // Réindexation complète : on purge avant d'ajouter pour retirer les docs dépubliés.
      await meili('DELETE', `/indexes/${spec.index}/documents`);
      if (docs.length > 0) {
        await meili('POST', `/indexes/${spec.index}/documents?primaryKey=id`, docs);
      }

      counts[spec.index] = docs.length;
    }

    return { success: true, counts };
  },
);
