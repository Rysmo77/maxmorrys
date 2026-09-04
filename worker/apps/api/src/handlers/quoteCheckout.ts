import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { resolveCheckoutTotal } from '../lib/checkout';

/**
 * `quoteCheckout` — ce que l'écran de paiement a le droit d'afficher.
 *
 * Il appelle `resolveCheckoutTotal`, exactement comme `createBictorysCharge`. Ce n'est pas
 * une commodité : c'est TOUT l'objet du correctif. Le montant lu et le montant débité
 * sortent désormais de la même fonction, donc ils ne peuvent plus se contredire — là où le
 * navigateur calculait le sien sur la copie de catalogue et ignorait le coupon.
 *
 * Il n'écrit rien, ne crée aucune charge, ne consomme aucun usage de coupon. C'est une
 * lecture, et elle peut être rejouée à chaque frappe dans le champ de code.
 *
 * ⚠️ AUTHENTIFIÉ, comme la charge. Sans ça, l'endpoint deviendrait un oracle à coupons :
 * on y essaierait des codes au hasard jusqu'à en trouver un valide, sans compte et sans
 * trace. Le devis dit ce qu'une personne paierait ; il n'a pas à répondre à un inconnu.
 */
export async function quoteCheckout(data: unknown, context: CallContext): Promise<unknown> {
  /*
   * ⚠️ LE RETOUR DE `requireAuth` ÉTAIT IGNORÉ, ET C'EST CETTE LIGNE QUI REND LA REMISE
   * MEMBRE POSSIBLE. Sans l'`uid`, le devis calculerait un total sans la remise pendant que
   * la charge la déduirait — c'est-à-dire l'écart exact que ce module a été écrit pour
   * fermer, réintroduit par la porte d'à côté.
   */
  const { uid } = requireAuth(context);

  const { formationId, couponCode } = (data ?? {}) as {
    formationId?: unknown;
    couponCode?: unknown;
  };
  if (typeof formationId !== 'string' || !formationId.trim()) {
    throw new HttpsError('invalid-argument', 'formationId est obligatoire.');
  }

  const total = await resolveCheckoutTotal(context.db, formationId, {
    uid,
    couponCode: typeof couponCode === 'string' ? couponCode : undefined,
  });

  /*
   * `couponId` NE SORT PAS. Il ne sert qu'à l'écriture de la transaction, côté serveur, et
   * l'écran n'en a aucun usage : le donner ferait fuir un identifiant interne pour rien.
   */
  return {
    basePrice: total.basePrice,
    couponDiscount: total.couponDiscount,
    clubDiscount: total.clubDiscount,
    clubMember: total.clubMember,
    finalPrice: total.finalPrice,
    /*
     * « Appliqué » et « valide » ne sont pas la même chose. Un coupon peut être bon et rester
     * SANS EFFET parce que la remise membre était plus généreuse : l'écran doit alors dire
     * laquelle a joué, pas laisser croire que le code n'a pas été reconnu.
     */
    couponApplied: total.couponDiscount > 0 && total.couponDiscount >= total.clubDiscount,
    clubApplied: total.clubDiscount > 0 && total.clubDiscount > total.couponDiscount,
  };
}
