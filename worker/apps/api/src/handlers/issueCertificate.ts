import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';

/**
 * Port de `issueCertificate`.
 *
 * Autorité serveur : la complétion est **re-dérivée** de l'ensemble réel des
 * leçons de la formation — chaque identifiant doit figurer dans les leçons
 * terminées de l'inscription. C'est volontairement plus strict que le scalaire
 * `progress`, que le client peut écrire. Idempotent.
 */

interface Lesson {
  id?: unknown;
}

interface Module {
  lessons?: Lesson[];
}

export async function issueCertificate(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);

  const { formationId } = (data ?? {}) as { formationId?: string };
  if (!formationId) {
    throw new HttpsError('invalid-argument', 'formationId est obligatoire.');
  }

  const certificateId = `${uid}_${formationId}`;

  // Idempotence : un certificat déjà émis est renvoyé tel quel.
  const existing = await context.db.get(`certificates/${certificateId}`);
  if (existing) {
    return { certificateId, certificateCode: existing.data.certificateCode };
  }

  const enrollment = await context.db.get(`enrollments/${certificateId}`);
  if (!enrollment) {
    throw new HttpsError('permission-denied', "Tu n'es pas inscrit à cette formation.");
  }

  const formationSnapshot = await context.db.get(`formations/${formationId}`);
  if (!formationSnapshot) {
    throw new HttpsError('not-found', 'Formation introuvable.');
  }
  const formation = formationSnapshot.data;

  if (formation.certificateEnabled === false) {
    throw new HttpsError('failed-precondition', 'Cette formation ne délivre pas de certificat.');
  }

  const modules = Array.isArray(formation.modules) ? (formation.modules as Module[]) : [];
  const allLessonIds = modules.flatMap((module) =>
    (module.lessons ?? []).map((lesson) => lesson.id).filter((id): id is string => typeof id === 'string'),
  );
  if (allLessonIds.length === 0) {
    throw new HttpsError('failed-precondition', "Cette formation n'a pas de leçons.");
  }

  const completed = Array.isArray(enrollment.data.completedLessons)
    ? new Set(enrollment.data.completedLessons as unknown[])
    : new Set<unknown>();
  if (!allLessonIds.every((id) => completed.has(id))) {
    throw new HttpsError(
      'failed-precondition',
      'Tu dois terminer toutes les leçons pour obtenir le certificat.',
    );
  }

  // `randomUUID` de node:crypto → équivalent natif du runtime Workers.
  const certificateCode = `MM-${crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;

  await context.db.set(`certificates/${certificateId}`, {
    userId: uid,
    formationId,
    formationTitle: formation.title ?? '',
    issuedAt: new Date().toISOString(),
    certificateCode,
  });
  await context.db.update(`enrollments/${certificateId}`, { certificateIssued: true });

  return { certificateId, certificateCode };
}
