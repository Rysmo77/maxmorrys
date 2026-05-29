import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

/**
 * Issue a course completion certificate. Server-side authority: completion is
 * re-derived from the formation's actual lesson set (every lesson id must be in
 * the enrollment's completedLessons), NOT the client-writable scalar `progress`.
 * Idempotent: returns the existing certificate if already issued.
 */
export const issueCertificate = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const { formationId } = request.data as { formationId?: string };
    if (!formationId) {
      throw new HttpsError('invalid-argument', 'formationId est obligatoire.');
    }

    const db = admin.firestore();
    const certId = `${uid}_${formationId}`;
    const certRef = db.doc(`certificates/${certId}`);

    // Idempotent: return the existing certificate if already issued.
    const certSnap = await certRef.get();
    if (certSnap.exists) {
      return { certificateId: certId, certificateCode: certSnap.data()?.certificateCode };
    }

    // The caller must be enrolled.
    const enrollmentRef = db.doc(`enrollments/${certId}`);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      throw new HttpsError('permission-denied', "Tu n'es pas inscrit à cette formation.");
    }

    const formationSnap = await db.doc(`formations/${formationId}`).get();
    if (!formationSnap.exists) {
      throw new HttpsError('not-found', 'Formation introuvable.');
    }
    const formation = formationSnap.data()!;
    if (formation.certificateEnabled === false) {
      throw new HttpsError('failed-precondition', 'Cette formation ne délivre pas de certificat.');
    }

    // Re-derive completion: every lesson id of the formation must appear in the
    // enrollment's completedLessons. This is stricter than progress == 100.
    const allLessonIds: string[] = (formation.modules ?? []).flatMap(
      (m: { lessons?: { id: string }[] }) => (m.lessons ?? []).map((l) => l.id),
    );
    if (allLessonIds.length === 0) {
      throw new HttpsError('failed-precondition', "Cette formation n'a pas de leçons.");
    }

    const completed: string[] = enrollmentSnap.data()?.completedLessons ?? [];
    const completedSet = new Set(completed);
    const allDone = allLessonIds.every((id) => completedSet.has(id));
    if (!allDone) {
      throw new HttpsError('failed-precondition', 'Tu dois terminer toutes les leçons pour obtenir le certificat.');
    }

    const certificateCode = `MM-${randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;
    await certRef.set({
      userId: uid,
      formationId,
      formationTitle: formation.title ?? '',
      issuedAt: new Date().toISOString(),
      certificateCode,
    });
    await enrollmentRef.update({ certificateIssued: true });

    return { certificateId: certId, certificateCode };
  },
);
