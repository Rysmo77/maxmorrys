import * as admin from 'firebase-admin';

/**
 * Journal d'audit — écriture serveur uniquement.
 *
 * ⚠️ `activity_logs` est fermé en écriture côté client (`firestore.rules`, `create: if false`).
 * Seul le SDK Admin, qui contourne les règles, peut y écrire. C'est volontaire : un journal
 * d'audit auquel le sujet de l'audit peut écrire ne vaut rien.
 *
 * Le journal ne couvre PAS l'ensemble des actions d'administration : il couvre les opérations
 * privilégiées qui passent par une fonction authentifiée. Les écrans qui écrivent directement
 * dans Firestore depuis le navigateur restent hors périmètre — voir le PRD, FR-063.
 */
export type AuditAction =
  | 'admin.user.create'
  | 'admin.enrollment.manage'
  | 'admin.rysmo.quota'
  | 'certificate.issue';

interface AuditEntry {
  /** Action normalisée, préfixée par son domaine. */
  action: AuditAction;
  /** UID de l'auteur de l'action. */
  actorUid: string;
  /** UID de la personne affectée, quand elle diffère de l'auteur. */
  subjectUid?: string;
  /** Contexte utile à la relecture — jamais de secret, jamais de donnée de paiement. */
  details?: Record<string, unknown>;
}

/**
 * Écrit une entrée d'audit. **Ne lève jamais** : un échec de journalisation ne doit pas
 * annuler l'opération métier qui vient de réussir. L'échec part dans les logs de la fonction.
 */
export async function logActivity(entry: AuditEntry): Promise<void> {
  try {
    await admin.firestore().collection('activity_logs').add({
      ...entry,
      at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('activity_logs write failed', entry.action, error);
  }
}
