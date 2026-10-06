import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import type { Sortie } from '../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES DEUX RÉGLAGES DU RÉPÉTITEUR — son nom, et ce qu'il a le droit de retenir.
 *
 * L'application les tenait EN MÉMOIRE : renommer son tuteur ne survivait pas à un
 * redémarrage, et la mémoire du répétiteur était ACTIVE PAR DÉFAUT (`aiMemoryConsent !==
 * false`) sans que rien, dans l'application, ne permette de la couper. Le site les écrit
 * dans `users/{uid}` avec le SDK Firestore ; l'application n'embarque pas ce SDK, d'où
 * cette callable.
 *
 * ⚠️ LE COMPTE DE SERVICE CONTOURNE `firestore.rules`. Ce que la règle `users/{userId}`
 * garantirait est refait ici : l'uid vient du JETON, et seuls `tutorName` et
 * `preferences.aiMemoryConsent` peuvent bouger — les deux champs que la règle laisse
 * écrire à leur propriétaire.
 *
 * `preferences` est une table : Firestore ne masque qu'au premier niveau, donc elle est
 * relue et fusionnée, sans quoi couper la mémoire effacerait les autres préférences.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const NOM_MAX = 40;

export async function reglerLeRepetiteur(data: unknown, context: CallContext): Promise<Sortie<'reglerLeRepetiteur'>> {
  const { uid } = requireAuth(context);
  const { nom, memoire } = (data ?? {}) as { nom?: unknown; memoire?: unknown };

  if (nom !== undefined && typeof nom !== 'string') throw new HttpsError('invalid-argument', 'Nom illisible.');
  if (memoire !== undefined && typeof memoire !== 'boolean') throw new HttpsError('invalid-argument', 'Réglage illisible.');
  if (nom === undefined && memoire === undefined) throw new HttpsError('invalid-argument', 'Rien à régler.');

  const document = await context.db.get(`users/${uid}`);
  if (!document) throw new HttpsError('not-found', "Ton profil n'existe pas encore.");

  const champs: Record<string, unknown> = {};
  /* Une chaîne vide ramène au défaut : on retire le champ plutôt que d'écrire « ». */
  if (typeof nom === 'string') champs.tutorName = nom.trim().slice(0, NOM_MAX) || null;
  if (typeof memoire === 'boolean') {
    const preferences = (document.data.preferences ?? {}) as Record<string, unknown>;
    champs.preferences = { ...preferences, aiMemoryConsent: memoire };
  }
  await context.db.update(`users/${uid}`, champs);

  const preferences = (champs.preferences ?? document.data.preferences ?? {}) as { aiMemoryConsent?: unknown };
  return {
    nom: typeof champs.tutorName === 'string' ? champs.tutorName : null,
    memoire: preferences.aiMemoryConsent !== false,
  };
}
