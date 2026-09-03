import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';
import { envoyerCourriersTransaction } from '../lib/transaction-mail';
import { asText } from '../lib/values';

/**
 * RELANCER LES COURRIERS D'UNE TRANSACTION.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE ÇA FERME
 *
 * Un envoi qui échoue ne laissait qu'un `console.error` dans les journaux du Worker.
 * Personne ne les lit. Pendant ce temps le client a payé, n'a reçu ni confirmation ni
 * facture — et l'article 4 des CGV promet la seconde « automatiquement, dès validation
 * du paiement ». La promesse tenait donc à la santé d'un serveur de messagerie, sans
 * aucun recours quand il hoquetait.
 *
 * La console peut désormais relancer. C'est la moitié qui manquait : `mailPending` rend
 * l'échec VISIBLE, ce point d'entrée le rend RÉPARABLE. Un badge qui signale un problème
 * qu'on ne peut pas corriger n'est qu'une source d'inquiétude.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI ÇA NE PEUT PAS ENVOYER DE DOUBLON
 *
 * `envoyerCourriersTransaction` relit `purchaseNoticeSentAt` et `invoiceSentAt` avant
 * chaque envoi, et relit le numéro de facture au lieu d'en tirer un nouveau. Relancer
 * une transaction déjà servie ne fait donc rien et le dit — on peut cliquer deux fois
 * sans conséquence, ce qui est exactement ce qu'un opérateur fera devant un bouton dont
 * il n'est pas sûr qu'il ait marché.
 */
export async function resendTransactionMail(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { transactionId } = (data ?? {}) as { transactionId?: string };
  const id = transactionId?.trim();
  if (!id) throw new HttpsError('invalid-argument', 'transactionId est obligatoire.');

  // Un identifiant, jamais un chemin : accepter un chemin laisserait un administrateur
  // — ou une requête forgée — désigner n'importe quel document de la base.
  if (id.includes('/')) throw new HttpsError('invalid-argument', 'transactionId invalide.');

  const chemin = `transactions/${id}`;
  const transaction = await context.db.get(chemin);
  if (!transaction) throw new HttpsError('not-found', 'Transaction introuvable.');

  const txn = transaction.data;

  /*
   * On ne relance QUE sur une transaction encaissée.
   *
   * Une facture émise sur un paiement `pending` ou `failed` affirmerait un encaissement
   * qui n'a pas eu lieu. C'est le contrôle qui compte ici : le reste du chemin est
   * idempotent, celui-ci ne l'est pas — il porte sur ce que le document AFFIRME.
   */
  if (asText(txn.status) !== 'completed') {
    throw new HttpsError(
      'failed-precondition',
      "Cette transaction n'est pas encaissée : aucune facture ne peut être émise.",
    );
  }

  /*
   * ⚠️ Les jetons crédités et le solde ne sont PAS repassés.
   *
   * Le webhook les lit dans sa transaction atomique, à l'instant du crédit. Des heures
   * plus tard, le solde a bougé — le répétiteur consomme en continu. Une relance qui
   * annoncerait « tu en as 1 700 » écrirait un nombre faux ; la confirmation omet donc
   * simplement le chiffre plutôt que d'en inventer un.
   */
  const bilan = await envoyerCourriersTransaction(context.db, context.env, chemin, txn);

  return {
    confirmation: bilan.confirmation,
    facture: bilan.facture,
    numero: bilan.numero ?? null,
    enAttente: bilan.enAttente,
    erreur: bilan.erreur ?? null,
  };
}
