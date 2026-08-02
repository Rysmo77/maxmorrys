import { FieldValue } from '@mm/firestore-rest';
import { HttpsError } from '@mm/shared';

import { type CallContext, getAuthAdmin, requireAdmin } from '../context';
import { toNumber, toStringOrNull } from '../lib/values';

/** Port des trois callables de `functions/src/admin.ts`. */

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function adminCreateUser(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { email, password, displayName, firstName, lastName, phone, role } = (data ?? {}) as {
    email?: string;
    password?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
  };

  if (!email || !password || !displayName) {
    throw new HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires.');
  }
  if (!EMAIL_RE.test(email.trim())) {
    throw new HttpsError('invalid-argument', "Format d'email invalide.");
  }
  if (password.length < 8) {
    throw new HttpsError(
      'invalid-argument',
      'Le mot de passe doit contenir au moins 8 caractères.',
    );
  }

  const uid = await getAuthAdmin(context.env).createUser({ email, password, displayName });

  await context.db.set(`users/${uid}`, {
    uid,
    email,
    displayName,
    firstName: firstName || '',
    lastName: lastName || '',
    phone: phone || '',
    // Un admin ne peut pas se créer d'autres admins depuis cette voie : le rôle
    // 'admin' demandé est volontairement rétrogradé en 'student'.
    role: (role === 'admin' ? 'student' : (role as 'student' | 'support')) || 'student',
    createdAt: new Date().toISOString(),
    preferences: { theme: 'system', language: 'fr', newsletter: false },
  });

  return { uid, success: true };
}

export async function adminManageRysmoQuota(
  data: unknown,
  context: CallContext,
): Promise<unknown> {
  await requireAdmin(context);

  const { userId, action, amount } = (data ?? {}) as {
    userId?: string;
    action?: 'get' | 'add' | 'reset';
    amount?: number;
  };

  if (!userId) throw new HttpsError('invalid-argument', 'userId est obligatoire.');
  const path = `_ratelimits/rysmo_${userId}`;

  if (action === 'get') {
    const snapshot = await context.db.get(path);
    const current = snapshot?.data ?? {};
    return {
      dayKey: toStringOrNull(current.dayKey),
      dayCount: toNumber(current.dayCount),
      packBalance: toNumber(current.packBalance),
    };
  }

  if (action === 'add') {
    if (!Number.isInteger(amount) || (amount as number) < 1 || (amount as number) > 10000) {
      throw new HttpsError(
        'invalid-argument',
        'Le nombre de tokens doit être un entier entre 1 et 10000.',
      );
    }
    // `increment` est un DocumentTransform : atomique côté serveur, ce qui évite
    // la transaction lecture-écriture de la version Cloud Functions.
    await context.db.set(
      path,
      { packBalance: FieldValue.increment(amount as number), lastReset: Date.now() },
      { merge: true },
    );
    const snapshot = await context.db.get(path);
    const current = snapshot?.data ?? {};
    return {
      dayKey: toStringOrNull(current.dayKey),
      dayCount: toNumber(current.dayCount),
      packBalance: toNumber(current.packBalance),
    };
  }

  if (action === 'reset') {
    const todayKey = new Date().toISOString().slice(0, 10);
    await context.db.set(path, { dayKey: todayKey, dayCount: 0, lastReset: Date.now() }, { merge: true });
    const snapshot = await context.db.get(path);
    const current = snapshot?.data ?? {};
    return {
      dayKey: toStringOrNull(current.dayKey),
      dayCount: 0,
      packBalance: toNumber(current.packBalance),
    };
  }

  throw new HttpsError('invalid-argument', 'Action invalide. Utilisez "get", "add" ou "reset".');
}

export async function adminManageEnrollment(
  data: unknown,
  context: CallContext,
): Promise<unknown> {
  await requireAdmin(context);

  const { action, userId, formationId } = (data ?? {}) as {
    action?: 'create' | 'delete';
    userId?: string;
    formationId?: string;
  };

  if (!userId || !formationId) {
    throw new HttpsError('invalid-argument', 'userId et formationId sont obligatoires.');
  }

  const enrollmentId = `${userId}_${formationId}`;
  const path = `enrollments/${enrollmentId}`;

  if (action === 'create') {
    if (await context.db.get(path)) {
      throw new HttpsError(
        'already-exists',
        'Cet utilisateur est déjà inscrit à cette formation.',
      );
    }
    await context.db.set(path, {
      id: enrollmentId,
      userId,
      formationId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completedLessons: [],
      certificateIssued: false,
    });
    return { success: true, enrollmentId };
  }

  if (action === 'delete') {
    await context.db.delete(path);
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Action invalide. Utilisez "create" ou "delete".');
}
