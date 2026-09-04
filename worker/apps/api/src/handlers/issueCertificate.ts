import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { envoyerModele } from '../lib/brevo-send';
import { asText } from '../lib/values';

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

  /*
    LE SEUL MOMENT DE FIERTÉ DU PARCOURS NE DÉCLENCHAIT RIEN.

    Ni e-mail, ni notification : on terminait une formation et le produit se taisait. Le
    certificat existait en base, avec son code vérifiable publiquement, et personne n'était
    prévenu qu'il pouvait le partager.

    TRANSACTIONNEL, donc aucun consentement à vérifier et aucun lien de retrait : la personne
    vient d'obtenir un document qui lui appartient. Proposer de « se désabonner » d'un
    certificat n'aurait pas de sens.

    L'ENVOI NE FAIT PAS ÉCHOUER L'ÉMISSION. Le certificat est écrit et rendu à l'appelant
    quoi qu'il arrive : perdre un courrier est réparable, perdre un certificat qu'on a mérité
    ne l'est pas. `envoyerModele` ne lève jamais ; on journalise l'issue.
  */
  const profil = await context.db.get(`users/${uid}`);
  const prefs = (profil?.data.preferences ?? {}) as { language?: string };
  const destinataire = asText(profil?.data.email) ?? '';
  if (destinataire) {
    const envoi = await envoyerModele(context.env, {
      modele: 'certificat',
      to: destinataire,
      langue: prefs.language === 'en' ? 'en' : 'fr',
      params: {
        prenom: asText(profil?.data.firstName) ?? asText(profil?.data.displayName) ?? '',
        formation: asText(formation.title) ?? '',
        code: certificateCode,
        lien: `${context.env.APP_BASE_URL}${prefs.language === 'en' ? '/en/verify' : '/verifier'}?code=${certificateCode}`,
      },
    });
    if (envoi.issue !== 'envoye') {
      console.error('Certificat', certificateCode, ': courrier non envoyé —', envoi.issue, envoi.erreur ?? '');
    }
  }

  return { certificateId, certificateCode };
}
