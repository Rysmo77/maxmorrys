import { orderBy, where } from 'firebase/firestore';
import { getCollection, getDocById } from './helpers';
import type { WaitlistEntry } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LISTE D'ATTENTE — LECTURE SEULE. L'ÉCRITURE PASSE PAR LE WORKER.
 *
 * `firestore.rules` refuse toute écriture client sur `waitlist`, et ce n'est pas une précaution
 * de principe : s'inscrire incrémente aussi `formations/{id}.waitlistCount`, un document que le
 * client n'a pas le droit d'écrire. Le compteur dénormalisé est la SEULE façon d'afficher une
 * preuve sociale, puisque la collection n'est listable que par l'administration — le faire tenir
 * côté client aurait donc exigé d'ouvrir `formations` en écriture publique.
 *
 * L'inscription passe donc par le callable `joinWaitlist` (`worker/apps/api`), qui écrit les deux
 * documents dans UNE transaction et envoie l'accusé de réception.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * L'identifiant est déterministe — même convention composite que `enrollments`.
 *
 * C'est ce qui permet de savoir si quelqu'un est déjà inscrit par un `get` d'un document (que
 * les règles autorisent à son propriétaire) plutôt que par un `list` (réservé à l'administration).
 */
export function waitlistEntryId(userId: string, formationId: string): string {
  return `${userId}_${formationId}`;
}

/** L'inscription de cette personne à cette formation, ou `null`. Un seul document lu. */
export async function getWaitlistEntry(
  userId: string,
  formationId: string,
): Promise<WaitlistEntry | null> {
  return getDocById<WaitlistEntry>('waitlist', waitlistEntryId(userId, formationId));
}

/**
 * Tous les inscrits d'une formation. ⚠️ Administration uniquement — les règles refusent ce
 * `list` à tout autre compte. Exige l'index composite `formationId ASC, createdAt DESC`.
 */
export async function listWaitlist(formationId: string): Promise<WaitlistEntry[]> {
  return getCollection<WaitlistEntry>(
    'waitlist',
    where('formationId', '==', formationId),
    orderBy('createdAt', 'desc'),
  );
}
