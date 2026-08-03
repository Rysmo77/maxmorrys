import { hmacSha256, HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { toDate } from '../lib/values';

/**
 * Délivre un lien signé pour un média protégé.
 *
 * Remplace ce que `storage.rules` faisait pour Firebase Storage : ces règles ne
 * gouvernaient que GCS et n'ont jamais suivi la bascule vers R2, laissant les
 * enregistrements privés du Club publiquement lisibles.
 *
 * Les droits sont vérifiés ici, une fois ; le Worker media ne vérifie ensuite
 * que la signature et l'échéance.
 */

const TTL_BY_PREFIX: Array<{ prefix: string; ttlMs: number }> = [
  // Une vidéo de cours doit rester lisible et navigable le temps du visionnage.
  { prefix: 'courses/', ttlMs: 2 * 60 * 60 * 1000 },
  { prefix: 'club_media/', ttlMs: 2 * 60 * 60 * 1000 },
  // Un certificat se télécharge en une fois.
  { prefix: 'certificates/', ttlMs: 5 * 60 * 1000 },
];

async function hasActiveClubSub(context: CallContext, uid: string): Promise<boolean> {
  const snapshot = await context.db.get(`club_subscriptions/${uid}`);
  if (!snapshot || snapshot.data.status !== 'active') return false;
  const expiresAt = toDate(snapshot.data.expiresAt);
  return !(expiresAt && expiresAt < new Date());
}

/** Autorise la clé demandée, ou lève. */
async function authorize(context: CallContext, uid: string, key: string): Promise<void> {
  if (key.startsWith('club_media/')) {
    // Le propriétaire accède toujours au sien ; les autres doivent être membres.
    const owner = key.slice('club_media/'.length).split('/')[0];
    if (owner === uid) return;
    if (await hasActiveClubSub(context, uid)) return;
    throw new HttpsError('permission-denied', 'Réservé aux membres du Club.');
  }

  if (key.startsWith('certificates/')) {
    const owner = key.slice('certificates/'.length).split('/')[0];
    if (owner !== uid) throw new HttpsError('permission-denied', 'Ce certificat ne t appartient pas.');
    return;
  }

  if (key.startsWith('courses/')) {
    // `courses/{formationId}/…` : l'inscription fait foi.
    const formationId = key.slice('courses/'.length).split('/')[0];
    if (!formationId) throw new HttpsError('invalid-argument', 'Clé de cours invalide.');
    if (!(await context.db.get(`enrollments/${uid}_${formationId}`))) {
      throw new HttpsError('permission-denied', "Tu n'es pas inscrit à cette formation.");
    }
    return;
  }

  throw new HttpsError('invalid-argument', 'Ce média ne nécessite pas de lien signé.');
}

export async function mediaToken(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);

  const { key } = (data ?? {}) as { key?: string };
  if (!key || key.startsWith('/') || key.includes('..')) {
    throw new HttpsError('invalid-argument', 'Clé invalide.');
  }
  if (!context.env.MEDIA_SIGNING_KEY) {
    throw new HttpsError('internal', 'Service de lien signé non configuré.');
  }

  await authorize(context, uid, key);

  const ttl = TTL_BY_PREFIX.find((entry) => key.startsWith(entry.prefix))?.ttlMs ?? 5 * 60 * 1000;
  const expiresAt = Date.now() + ttl;
  const signature = await hmacSha256(context.env.MEDIA_SIGNING_KEY, `${key}:${expiresAt}`);

  const url =
    `${context.env.PUBLIC_MEDIA_BASE}/${key.split('/').map(encodeURIComponent).join('/')}` +
    `?exp=${expiresAt}&sig=${signature}`;

  return { url, expiresAt };
}
