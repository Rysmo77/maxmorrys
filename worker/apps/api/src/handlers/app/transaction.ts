import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import { abonnementActif } from './club';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE RETOUR DE PAIEMENT, VU PAR L'APPLICATION — elle CONSTATE, elle n'a rien encaissé.
 *
 * Le paiement se fait sur le site ; la page de retour (`PaymentReturn.tsx`) propose d'ouvrir
 * l'application par `rysmo://paiement?transactionId=…`. L'application ne lit rien dans
 * Firestore : sans cette vue, elle n'aurait aucun moyen de savoir ce qui s'est passé.
 *
 * ⛔ DEUX FAITS DISTINCTS, ET L'ÉCRAN A BESOIN DES DEUX :
 *   · `statut` — ce que dit la transaction (`completed`, `pending`, `failed`) ;
 *   · `acces` — ce qui est RÉELLEMENT ouvert : l'inscription existe, l'abonnement est actif.
 * Le webhook passe la transaction en `completed` en DERNIER, une fois l'effet acquis
 * (`lib/bictorys.ts`) ; mais le kit dit « C'est à toi », pas « paiement accepté » — et
 * l'écran ne l'écrit que si `acces` le confirme.
 *
 * Une transaction d'autrui, ou inexistante, rend `vue: null` : on ne confirme même pas
 * qu'un identifiant existe.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const FORME_ID = /^[A-Za-z0-9_-]{6,64}$/;

export async function appTransaction(data: unknown, context: CallContext): Promise<Reponse<'appTransaction'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const { transactionId } = (data ?? {}) as { transactionId?: unknown };
  if (typeof transactionId !== 'string' || !FORME_ID.test(transactionId)) {
    throw new HttpsError('invalid-argument', 'Identifiant de transaction illisible.');
  }

  const transaction = await context.db.get(`transactions/${transactionId}`);
  /* Bornée sur l'uid du JETON : l'identifiant vient de l'appelant, le propriétaire non. */
  if (!transaction || asText(transaction.data.userId) !== auth.uid) return { vue: null, releveA };

  const brut = asText(transaction.data.status);
  const statut = brut === 'completed' ? 'completed' : brut === 'failed' ? 'failed' : 'pending';
  const ligneBrute = asText(transaction.data.ligne);
  const ligne = ligneBrute === 'formation' || ligneBrute === 'club'
    || ligneBrute === 'rysmoPack' || ligneBrute === 'rysmoSubscription' ? ligneBrute : 'autre';
  const formationId = asText(transaction.data.formationId) ?? null;

  /* L'accès, constaté là où il vit — jamais déduit du seul statut. */
  let acces = false;
  if (statut === 'completed') {
    if (ligne === 'club') acces = (await abonnementActif(context, auth.uid)) !== null;
    else if (ligne === 'formation' && formationId) acces = (await context.db.get(`enrollments/${auth.uid}_${formationId}`)) !== null;
    else acces = true;
  }

  return {
    vue: {
      id: transaction.id,
      statut,
      ligne,
      acces,
      titre: asText(transaction.data.formationTitle) ?? null,
      slug: asText(transaction.data.formationSlug) ?? null,
      montant: typeof transaction.data.amount === 'number' ? transaction.data.amount : null,
      devise: asText(transaction.data.currency) ?? null,
      creeLe: asText(transaction.data.createdAt) ?? null,
    },
    releveA,
  };
}
