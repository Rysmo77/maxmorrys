import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../config/db';
import { captureError } from '../sentry';
import type { ContentEngagement } from '../../types';

export interface EngagementInput {
  type: ContentEngagement['type'];
  slug: string;
  title: string;
  category: string;
  scrollPct?: number;  // 0-100 (articles)
  dwellSec?: number;   // temps de présence cette visite
  mediaSec?: number;   // position max atteinte (audio/vidéo natif)
}

/**
 * Upsert de l'engagement d'un utilisateur sur un contenu.
 * scrollPctMax et mediaSec sont conservés en MAX ; dwellSec/visits sont incrémentés.
 */
export async function recordContentEngagement(
  uid: string,
  contentId: string,
  data: EngagementInput,
): Promise<void> {
  try {
    const ref = doc(db, `users/${uid}/engagement/${contentId}`);
    await runTransaction(db, async (t) => {
      const snap = await t.get(ref);
      const cur = snap.data() ?? {};
      t.set(ref, {
        type: data.type,
        slug: data.slug,
        title: data.title,
        category: data.category || 'général',
        scrollPctMax: Math.max(cur.scrollPctMax ?? 0, Math.round(data.scrollPct ?? 0)),
        dwellSec: (cur.dwellSec ?? 0) + Math.round(data.dwellSec ?? 0),
        mediaSec: Math.max(cur.mediaSec ?? 0, Math.round(data.mediaSec ?? 0)),
        visits: (cur.visits ?? 0) + 1,
        lastAt: new Date().toISOString(),
      }, { merge: true });
    });
  } catch (error: unknown) {
    captureError(error, { context: `recordContentEngagement(${contentId})` });
    // non-bloquant : l'engagement ne doit jamais casser l'UX
  }
}
