import { deleteDoc, doc, getDoc, increment, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../../config/db';
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
 *
 * SEULE EXCEPTION — SE RETIRER (audit UI/UX du 03/11/2026, X12) : `leaveWaitlist` supprime sa
 * propre entrée ET décrémente le compteur d'un cran, dans un même lot. Les règles n'acceptent
 * ni l'un sans l'autre, ni un autre champ touché (`quitteListeAttente`, `firestore.rules`).
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

/**
 * Se retirer de la liste d'attente d'une formation. Un seul lot : l'entrée disparaît et
 * `waitlistCount` descend d'un cran — les règles refusent l'un sans l'autre. Réservé aux
 * entrées liées à un compte (`{uid}_{formationId}`) ; une inscription anonyme, par adresse
 * seule, n'a pas d'identité qui puisse la retirer depuis l'app.
 */
export async function leaveWaitlist(userId: string, formationId: string): Promise<void> {
  const entree = doc(db, 'waitlist', waitlistEntryId(userId, formationId));
  /* La forme d'écriture suit l'état du compteur : formation supprimée, ou compteur absent /
     à zéro → l'entrée part SEULE (rien à décrémenter, et un décrément serait refusé).
     Formation illisible (brouillon) → on suppose un compteur, comme avant. */
  let compteur: number | null = 1;
  try {
    const f = await getDoc(doc(db, 'formations', formationId));
    const n = f.exists() ? f.data().waitlistCount : undefined;
    compteur = typeof n === 'number' && n > 0 ? n : null;
  } catch {
    /* lecture refusée : forme avec décrément */
  }
  if (compteur === null) {
    await deleteDoc(entree);
    return;
  }
  const lot = writeBatch(db);
  lot.delete(entree);
  lot.update(doc(db, 'formations', formationId), { waitlistCount: increment(-1) });
  await lot.commit();
}
