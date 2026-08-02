import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { translateBatch } from './translate';

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');

const COLLECTIONS = ['blog', 'formations', 'podcasts', 'videos'] as const;
const PER_CALL_LIMIT = 40; // borne le nombre de traductions par exécution

/** Slugify (équivalent serveur de src/lib/utils.ts). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques combinants
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Backfill admin : génère `slug_en` pour les contenus publiés qui n'en ont pas,
 * en traduisant le titre (FR→EN) puis en le slugifiant. Idempotent, borné par exécution.
 * Relancer jusqu'à `updated: 0` pour tout couvrir.
 */
export const backfillSlugEn = onCall(
  { region: 'us-central1', secrets: [googleAiKey], timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
    const caller = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (caller.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
    }

    const apiKey = googleAiKey.value();
    if (!apiKey) throw new HttpsError('internal', 'Service de traduction indisponible.');

    const db = admin.firestore();
    const report: Record<string, number> = {};
    let budget = PER_CALL_LIMIT;

    for (const col of COLLECTIONS) {
      if (budget <= 0) break;
      const snap = await db.collection(col).where('status', '==', 'published').get();
      // Docs publiés sans slug_en, avec un titre.
      const todo = snap.docs.filter((d) => {
        const data = d.data();
        return !data.slug_en && typeof data.title === 'string' && data.title.trim();
      }).slice(0, budget);
      if (todo.length === 0) {
        report[col] = 0;
        continue;
      }

      const titles = todo.map((d) => d.data().title as string);
      const translated = await translateBatch(titles, 'en', apiKey);

      // Slugs déjà pris dans la collection (FR + EN) pour éviter les collisions.
      const taken = new Set<string>();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.slug) taken.add(data.slug);
        if (data.slug_en) taken.add(data.slug_en);
      });

      const batch = db.batch();
      todo.forEach((d, i) => {
        const base = slugify(translated[i] || titles[i]) || slugify(titles[i]) || d.id;
        let slug = base;
        let n = 2;
        while (taken.has(slug)) slug = `${base}-${n++}`;
        taken.add(slug);
        batch.update(d.ref, { slug_en: slug });
      });
      await batch.commit();

      report[col] = todo.length;
      budget -= todo.length;
    }

    const updated = Object.values(report).reduce((a, b) => a + b, 0);
    return { updated, byCollection: report, hasMore: budget <= 0 };
  },
);
