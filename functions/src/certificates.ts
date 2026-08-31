import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { logActivity } from './audit';

/**
 * Issue a course completion certificate. Server-side authority: completion is
 * re-derived from the formation's actual lesson set (every lesson id must be in
 * the enrollment's completedLessons), NOT the client-writable scalar `progress`.
 * Idempotent: returns the existing certificate if already issued.
 *
 * Écrit DEUX documents : `certificates/{uid}_{formationId}`, privé et complet, et
 * `certificate_lookups/{certificateCode}`, public et réduit aux champs qu'un certificat
 * affiche de toute façon. La vérification publique lit le second — voir le commentaire de
 * `writeLookup` pour la raison.
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
    const issuedAt = new Date().toISOString();
    const formationTitle = formation.title ?? '';

    await certRef.set({
      userId: uid,
      formationId,
      formationTitle,
      issuedAt,
      certificateCode,
    });
    await writeLookup(db, {
      certificateCode,
      formationTitle,
      issuedAt,
      holderName: await resolveHolderName(db, uid),
    });
    await enrollmentRef.update({ certificateIssued: true });

    await logActivity({
      action: 'certificate.issue',
      actorUid: uid,
      details: { formationId, certificateCode },
    });

    return { certificateId: certId, certificateCode };
  },
);

interface CertificateLookup {
  certificateCode: string;
  formationTitle: string;
  issuedAt: string;
  holderName: string;
}

/**
 * Miroir public d'un certificat, indexé PAR LE CODE.
 *
 * ⚠️ Pourquoi une collection séparée plutôt qu'une lecture ouverte sur `certificates`.
 * Le document de certificat est identifié par `{uid}_{formationId}` : une page de
 * vérification qui ne connaît que le code ne peut donc pas le lire directement, elle doit
 * faire une requête de liste. Or `certificates` porte l'UID du titulaire, et une lecture
 * ouverte y aurait permis d'énumérer l'intégralité des certificats émis — donc de compter
 * les clients. Ce miroir ne contient que ce qu'un certificat affiche déjà à l'écran, et son
 * identifiant EST le code : la vérification est un `get` direct, jamais une liste.
 */
async function writeLookup(
  db: admin.firestore.Firestore,
  lookup: CertificateLookup,
): Promise<void> {
  await db.doc(`certificate_lookups/${lookup.certificateCode}`).set(lookup);
}

/**
 * Nom à porter sur le certificat. Retombe sur une chaîne vide plutôt que sur l'e-mail :
 * le miroir est public, et une adresse e-mail n'a rien à y faire.
 */
async function resolveHolderName(
  db: admin.firestore.Firestore,
  uid: string,
): Promise<string> {
  const snap = await db.doc(`users/${uid}`).get();
  const user = snap.data();
  if (!user) return '';
  const composed = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return composed || (user.displayName ?? '');
}

/**
 * Backfill des certificats émis avant l'introduction du miroir public.
 *
 * Réservé aux admins, idempotent (`set` sur un identifiant déterministe), et borné par lot
 * pour ne pas dépasser le temps d'exécution. Relancer jusqu'à ce que `remaining` soit nul.
 */
export const backfillCertificateLookups = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const db = admin.firestore();
    const callerSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (callerSnap.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
    }

    const BATCH = 200;
    const certs = await db.collection('certificates').limit(BATCH).get();
    let written = 0;
    let skipped = 0;

    for (const doc of certs.docs) {
      const data = doc.data();
      const code: string | undefined = data.certificateCode;
      if (!code) { skipped += 1; continue; }
      const existing = await db.doc(`certificate_lookups/${code}`).get();
      if (existing.exists) { skipped += 1; continue; }
      await writeLookup(db, {
        certificateCode: code,
        formationTitle: data.formationTitle ?? '',
        issuedAt: data.issuedAt ?? '',
        holderName: await resolveHolderName(db, data.userId),
      });
      written += 1;
    }

    return { scanned: certs.size, written, skipped, remaining: certs.size === BATCH };
  },
);
