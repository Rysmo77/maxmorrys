import type { DocSnapshot } from '@mm/firestore-rest';
import { hmacSha256, HttpsError } from '@mm/shared';

import { type CallContext, getAuthAdmin, requireAuth } from '../context';
import type { Env } from '../env';

/**
 * RGPD — export et suppression de compte. Port de `functions/src/gdpr.ts`.
 *
 * ⚠️ Écart de conception assumé sur l'export : la version d'origine dépose le
 * fichier dans Firebase Storage et renvoie une signed URL Google. Le déposer sur
 * `media.maxmorrys.me` le rendrait **publiquement lisible** — R2 sert ce domaine
 * sans contrôle d'accès, et un export RGPD contient toutes les données
 * personnelles d'une personne. Le fichier est donc servi par ce Worker, derrière
 * un lien signé et daté, sans toucher au domaine média.
 */

const EXPORT_TTL_HOURS = 24;

/* ────────────────────────────── Export ──────────────────────────────── */

function withIds(documents: DocSnapshot[]): Array<Record<string, unknown>> {
  return documents.map((document) => ({ id: document.id, ...document.data }));
}

async function collectUserData(context: CallContext, uid: string): Promise<Record<string, unknown>> {
  const byUser = (collection: string) =>
    context.db.query({ collection, where: [{ field: 'userId', op: '==', value: uid }] });

  const [
    user,
    enrollments,
    certificates,
    transactions,
    notes,
    notifications,
    gamification,
    clubSubscription,
    testimonials,
    messages,
  ] = await Promise.all([
    context.db.get(`users/${uid}`),
    byUser('enrollments'),
    byUser('certificates'),
    byUser('transactions'),
    context.db.query({ collection: `users/${uid}/notes` }),
    context.db.query({ collection: `notifications/${uid}/items` }),
    context.db.get(`gamification/${uid}`),
    context.db.get(`club_subscriptions/${uid}`),
    byUser('testimonials'),
    byUser('messages'),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: user?.data ?? null,
    enrollments: withIds(enrollments),
    certificates: withIds(certificates),
    transactions: withIds(transactions),
    notes: withIds(notes),
    notifications: withIds(notifications),
    gamification: gamification?.data ?? null,
    clubSubscription: clubSubscription?.data ?? null,
    testimonials: withIds(testimonials),
    messages: withIds(messages),
  };
}

/** Signature d'un lien de téléchargement : la clé et l'échéance, rien d'autre. */
export function signExport(env: Env, key: string, expiresAt: number): Promise<string> {
  return hmacSha256(env.EXPORT_SIGNING_KEY as string, `${key}:${expiresAt}`);
}

export async function exportUserData(_data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context, 'Tu dois etre connecte.');

  if (!context.env.EXPORTS || !context.env.EXPORT_SIGNING_KEY) {
    throw new HttpsError('internal', 'Service d\'export non configuré.');
  }

  const payload = JSON.stringify(await collectUserData(context, uid), null, 2);
  const key = `exports/${uid}/data-${Date.now()}.json`;

  await context.env.EXPORTS.put(key, payload, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { userId: uid },
  });

  const expiresAt = Date.now() + EXPORT_TTL_HOURS * 60 * 60 * 1000;
  const signature = await signExport(context.env, key, expiresAt);

  await context.db.add('data_exports', {
    userId: uid,
    filename: key,
    createdAt: new Date().toISOString(),
  });

  const downloadUrl =
    `${context.env.API_BASE_URL}/exportDownload` +
    `?k=${encodeURIComponent(key)}&exp=${expiresAt}&sig=${signature}`;

  return { downloadUrl, expiresInHours: EXPORT_TTL_HOURS };
}

/* ───────────────────────── Suppression de compte ─────────────────────── */

/** Supprime tous les documents d'une requête, par pages bornées. */
async function deleteByQuery(context: CallContext, collection: string, uid: string): Promise<void> {
  const pages = context.db.queryPaged(
    { collection, where: [{ field: 'userId', op: '==', value: uid }] },
    200,
  );
  for await (const page of pages) {
    await context.db.commit(page.map((doc) => ({ delete: context.db.fullName(doc.path) })));
  }
}

async function deleteSubcollection(context: CallContext, collection: string): Promise<void> {
  const pages = context.db.queryPaged({ collection }, 200);
  for await (const page of pages) {
    await context.db.commit(page.map((doc) => ({ delete: context.db.fullName(doc.path) })));
  }
}

/** Supprime un préfixe entier du bucket R2, par lots. */
async function deleteR2Prefix(env: Env, prefix: string): Promise<void> {
  if (!env.EXPORTS) return;
  try {
    let cursor: string | undefined;
    do {
      const listing = await env.EXPORTS.list({ prefix, cursor });
      if (listing.objects.length > 0) {
        await env.EXPORTS.delete(listing.objects.map((object) => object.key));
      }
      cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);
  } catch (error: unknown) {
    console.warn('Suppression du préfixe R2 impossible :', prefix, error);
  }
}

export async function deleteUserAccount(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context, 'Tu dois etre connecte.');

  const confirmation = (data as { confirmation?: string } | undefined)?.confirmation?.toUpperCase();
  if (confirmation !== 'SUPPRIMER') {
    throw new HttpsError('failed-precondition', 'Confirmation incorrecte.');
  }

  await Promise.all(
    ['enrollments', 'certificates', 'transactions', 'testimonials', 'messages'].map((collection) =>
      deleteByQuery(context, collection, uid),
    ),
  );

  await deleteSubcollection(context, `users/${uid}/notes`);
  await deleteSubcollection(context, `notifications/${uid}/items`);

  await Promise.all(
    [`gamification/${uid}`, `club_subscriptions/${uid}`, `notifications/${uid}`].map((path) =>
      context.db.delete(path).catch(() => undefined),
    ),
  );
  await context.db.delete(`users/${uid}`).catch(() => undefined);

  // Les médias vivent désormais sur R2 ; l'ancien bucket GCS n'est plus qu'une
  // copie de repli, qui sera purgée à la fin de la migration.
  await Promise.all(
    [`avatars/${uid}/`, `exports/${uid}/`, `club_media/${uid}/`].map((prefix) =>
      deleteR2Prefix(context.env, prefix),
    ),
  );

  // Le compte d'authentification en dernier : tant qu'il existe, l'opération
  // reste rejouable si une étape a échoué.
  await getAuthAdmin(context.env).deleteUser(uid);

  return { success: true };
}
