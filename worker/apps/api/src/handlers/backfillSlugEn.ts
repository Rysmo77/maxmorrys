import type { DocSnapshot } from '@mm/firestore-rest';
import { HttpsError, translateBatch } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';
import { asText } from '../lib/values';

/**
 * Port de `backfillSlugEn` — génère les `slug_en` manquants des contenus publiés,
 * en traduisant le titre puis en le slugifiant.
 *
 * Idempotent et borné par exécution : relancer jusqu'à `updated: 0`.
 */

const COLLECTIONS = ['blog', 'formations', 'podcasts', 'videos'] as const;
/** Borne le nombre de traductions par appel, donc le coût et la durée. */
const PER_CALL_LIMIT = 40;

/** Équivalent serveur de `slugify` (src/lib/utils.ts). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Diacritiques combinants, désignés par leur plage plutôt qu'en littéral :
    // un caractère combinant nu dans une source est invisible et fragile.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function backfillSlugEn(_data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  if (!context.env.GOOGLE_AI_API_KEY) {
    throw new HttpsError('internal', 'Service de traduction indisponible.');
  }
  const config = {
    baseUrl: context.env.GEMINI_BASE_URL,
    apiKey: context.env.GOOGLE_AI_API_KEY,
  };

  const report: Record<string, number> = {};
  let budget = PER_CALL_LIMIT;

  for (const collection of COLLECTIONS) {
    if (budget <= 0) break;

    const documents: DocSnapshot[] = await context.db.query({
      collection,
      where: [{ field: 'status', op: '==', value: 'published' }],
    });

    const todo = documents
      .filter((document) => {
        const title = asText(document.data.title);
        return !document.data.slug_en && typeof title === 'string' && title.trim() !== '';
      })
      .slice(0, budget);

    if (todo.length === 0) {
      report[collection] = 0;
      continue;
    }

    const titles = todo.map((document) => asText(document.data.title) as string);
    const translated = await translateBatch(titles, config);

    // Slugs déjà pris dans la collection, FR et EN, pour éviter les collisions.
    const taken = new Set<string>();
    for (const document of documents) {
      const slug = asText(document.data.slug);
      const slugEn = asText(document.data.slug_en);
      if (slug) taken.add(slug);
      if (slugEn) taken.add(slugEn);
    }

    const writes = todo.map((document, index) => {
      const base = slugify(translated[index] || titles[index]) || slugify(titles[index]) || document.id;
      let slug = base;
      let suffix = 2;
      while (taken.has(slug)) slug = `${base}-${suffix++}`;
      taken.add(slug);
      return context.db.buildWrite(document.path, { slug_en: slug }, { mask: true });
    });
    await context.db.commit(writes);

    report[collection] = todo.length;
    budget -= todo.length;
  }

  const updated = Object.values(report).reduce((sum, n) => sum + n, 0);
  return { updated, byCollection: report, hasMore: budget <= 0 };
}
