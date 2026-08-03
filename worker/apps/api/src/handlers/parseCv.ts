import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { generateContent } from '../lib/gemini';
import { toDate, toNumber } from '../lib/values';

/**
 * Port de `parseCv` — extrait un profil structuré d'un CV PDF via Gemini.
 *
 * Réservé aux membres du Club et plafonné à 5 analyses par jour, le coût IA
 * étant proportionnel à la taille du document.
 */

const DAILY_LIMIT = 5;
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * ⚠️ Sémantique volontairement différente de `hasActiveClubSub` de rysmo-quota :
 * ici un abonnement **sans** `expiresAt` n'est PAS considéré comme actif
 * (`new Date(undefined) > new Date()` est faux). C'est le comportement de la
 * Cloud Function d'origine, reproduit tel quel.
 */
async function hasActiveClubSubStrict(context: CallContext, uid: string): Promise<boolean> {
  const snapshot = await context.db.get(`club_subscriptions/${uid}`);
  if (!snapshot || snapshot.data.status !== 'active') return false;
  const expiresAt = toDate(snapshot.data.expiresAt);
  return expiresAt !== null && expiresAt > new Date();
}

const PROMPT = [
  "Tu analyses le CV ci-joint d'un professionnel du marketing digital.",
  'Renvoie un JSON STRICT (valeurs vides "" si absentes) avec EXACTEMENT ces clés :',
  '{ "headline": "titre pro court", "skills": ["compétences clés, max 8"], "city": "ville", "linkedin": "URL", "website": "URL", "facebook": "URL", "instagram": "URL ou @", "twitter": "URL ou @", "tiktok": "URL ou @", "youtube": "URL" }',
  "N'invente rien : laisse vide si l'info n'est pas explicitement dans le CV.",
].join('\n');

const STRING_FIELDS = [
  'headline',
  'city',
  'linkedin',
  'website',
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
] as const;

export async function parseCv(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);

  if (!(await hasActiveClubSubStrict(context, uid))) {
    throw new HttpsError(
      'permission-denied',
      "L'analyse de CV est réservée aux membres du Club.",
    );
  }

  const { fileBase64, mimeType } = (data ?? {}) as { fileBase64?: string; mimeType?: string };
  if (!fileBase64 || !mimeType) throw new HttpsError('invalid-argument', 'Fichier manquant.');
  if (!/^application\/pdf$/.test(mimeType)) {
    throw new HttpsError('invalid-argument', 'Seuls les PDF sont acceptés.');
  }
  if (fileBase64.length * 0.75 > MAX_BYTES) {
    throw new HttpsError('invalid-argument', 'CV trop lourd (max 8 Mo).');
  }

  // Plafond journalier, réservé en transaction pour rester exact sous concurrence.
  const path = `_ratelimits/cv_${uid}`;
  const today = new Date().toISOString().slice(0, 10);
  await context.db.runTransaction(async (tx) => {
    const snapshot = await tx.get(path);
    const current = snapshot?.data ?? {};
    const count = current.date === today ? toNumber(current.count) : 0;
    if (count >= DAILY_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        `Limite atteinte (${DAILY_LIMIT} analyses/jour). Réessaie demain.`,
      );
    }
    tx.set(path, { date: today, count: count + 1 }, { merge: true });
  });

  let parsed: Record<string, unknown>;
  try {
    const raw = await generateContent(
      context.env,
      [{ inlineData: { mimeType, data: fileBase64 } }, { text: PROMPT }],
      { temperature: 0.2, json: true, timeoutMs: 60_000 },
    );
    parsed = JSON.parse(raw || '{}') as Record<string, unknown>;
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    console.error('parseCv — échec :', error);
    throw new HttpsError('internal', "Échec de l'analyse du CV. Réessaie.");
  }

  const result: Record<string, unknown> = {
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 8).map(String) : [],
  };
  for (const field of STRING_FIELDS) {
    result[field] = typeof parsed[field] === 'string' ? parsed[field] : '';
  }
  return result;
}
