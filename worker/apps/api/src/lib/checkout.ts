import { HttpsError } from '@mm/shared';
import type { Firestore } from '@mm/firestore-rest';

import { validateCoupon } from './bictorys';
import { toNumber } from './values';

/**
 * LE TOTAL D'UNE COMMANDE — calculé UNE FOIS, pour l'affichage comme pour le débit.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE EXISTE
 *
 * Le montant était calculé DEUX FOIS, à deux endroits, à partir de deux sources :
 *
 *   · à l'écran, dans le navigateur, sur la copie de catalogue — `promoPrice ?? price` ;
 *   · au débit, dans `createBictorysCharge`, en relisant la base ET en appliquant le coupon.
 *
 * Conséquence, écrite noir sur blanc en tête de `Checkout.tsx` : quelqu'un qui saisissait un
 * code promo lisait « Payer 95 000 » et se faisait débiter moins. L'écart jouait en sa
 * faveur, il était annoncé, et il restait un chiffre faux — sur l'écran de paiement, c'est-
 * à-dire à l'endroit du produit où un chiffre faux coûte le plus de confiance. Il serait
 * devenu grave le jour où un coupon aurait fait l'inverse.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA CORRECTION N'EST PAS « AFFICHER LE BON NOMBRE », C'EST « N'EN CALCULER QU'UN »
 *
 * Faire recalculer au devis la même chose que le débit, dans deux fonctions distinctes,
 * aurait remis deux sources en présence — et les deux auraient divergé au premier coupon
 * d'un type nouveau. Cette fonction est donc appelée par les DEUX chemins : le devis affiché
 * et la charge réellement créée. Ils ne peuvent plus se contredire, par construction.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface CheckoutTotal {
  /** Prix catalogue retenu — `promoPrice` s'il existe, sinon `price`. */
  basePrice: number;
  /** Remise du coupon, 0 s'il n'y en a pas. */
  couponDiscount: number;
  /** Ce qui sera débité. C'est le seul montant qu'un écran a le droit d'afficher. */
  finalPrice: number;
  /** Identifiant du coupon retenu, pour l'écriture de la transaction. */
  couponId?: string;
  /** Le code normalisé, tel qu'il sera écrit sur la transaction. */
  couponCode?: string;
  /** Le titre, pour que le devis n'ait pas à relire la formation de son côté. */
  formationTitle: string;
}

/**
 * Résout le total d'une commande de formation.
 *
 * ⚠️ LES ERREURS SONT LES MÊMES POUR LE DEVIS ET POUR LE DÉBIT, et c'est délibéré : un code
 * refusé au paiement doit être refusé au devis, avec le même mot. Découvrir au moment de
 * payer qu'un code accepté à l'écran ne passe pas serait pire que de ne pas l'avoir affiché.
 */
export async function resolveCheckoutTotal(
  db: Firestore,
  formationId: string,
  couponCode?: string,
): Promise<CheckoutTotal> {
  const formationDoc = await db.get(`formations/${formationId}`);
  if (!formationDoc) throw new HttpsError('not-found', 'Formation introuvable.');
  const formation = formationDoc.data;

  const basePrice = toNumber(formation.promoPrice) || toNumber(formation.price);
  if (basePrice <= 0) {
    throw new HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
  }

  const formationTitle = typeof formation.title === 'string' ? formation.title : '';

  const code = couponCode?.trim();
  if (!code) {
    return { basePrice, couponDiscount: 0, finalPrice: basePrice, formationTitle };
  }

  const coupon = await validateCoupon(db, code, basePrice);
  if (!coupon) {
    throw new HttpsError('invalid-argument', 'Code promo invalide, expiré ou déjà utilisé.');
  }

  const finalPrice = basePrice - coupon.discount;
  if (finalPrice <= 0) {
    throw new HttpsError(
      'invalid-argument',
      "Ce coupon rend la formation gratuite. Utilise l'inscription gratuite.",
    );
  }

  return {
    basePrice,
    couponDiscount: coupon.discount,
    finalPrice,
    couponId: coupon.couponId,
    couponCode: code.toUpperCase(),
    formationTitle,
  };
}
