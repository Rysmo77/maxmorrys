import { HttpsError } from '@mm/shared';
import type { Firestore } from '@mm/firestore-rest';

import { CLUB_MEMBER_FORMATION_DISCOUNT, validateCoupon } from './bictorys';
import { toDate, toNumber } from './values';

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
  /** Remise membre du Club, 0 pour un non-membre. Non cumulable avec le coupon. */
  clubDiscount: number;
  /** L'acheteur est-il membre actif ? Sert à l'écran, jamais au calcul de l'écran. */
  clubMember: boolean;
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
  /*
   * ⚠️ UN OBJET, ET PLUS DES POSITIONNELS. `uid` s'ajoute à `couponCode` — deux paramètres
   * optionnels côte à côte, dont l'un décide d'une remise : les intervertir à l'appel aurait
   * fait chercher un abonnement sous un code promo, en silence.
   */
  opts: { uid?: string; couponCode?: string } = {},
): Promise<CheckoutTotal> {
  const { uid, couponCode } = opts;
  const formationDoc = await db.get(`formations/${formationId}`);
  if (!formationDoc) throw new HttpsError('not-found', 'Formation introuvable.');
  const formation = formationDoc.data;

  /*
   * ═════════════════════════════════════════════════════════════════════════════════════
   * CE QUI EST ACHETABLE — LE SEUL ENDROIT OÙ LA QUESTION EST TRANCHÉE.
   *
   * Cette fonction sert le devis ET le débit. C'est donc le point de contrôle serveur du
   * paiement, et jusqu'ici il ne lisait RIEN d'autre que le prix : un brouillon dont on
   * connaissait l'identifiant était devisable et payable, sans jamais avoir été publié.
   * Le garde existait bien — dans `Checkout.tsx`, c'est-à-dire dans le navigateur, donc
   * chez la personne qui contourne. Même défaut, même endroit, que l'auto-inscription
   * gratuite corrigée dans `firestore.rules`.
   *
   * La seconde condition est celle de la précommande : une formation en Coming Soon n'est
   * achetable que si la précommande a été ouverte POUR ELLE. Le drapeau est par formation
   * et non global, parce que précommander engage à livrer à une date.
   * ═════════════════════════════════════════════════════════════════════════════════════
   */
  if (formation.status !== 'published') {
    throw new HttpsError('failed-precondition', "Cette formation n'est pas disponible à l'achat.");
  }
  if (formation.comingSoon === true && formation.preorderEnabled !== true) {
    throw new HttpsError(
      'failed-precondition',
      "Cette formation n'est pas encore ouverte. Inscris-toi à sa liste d'attente.",
    );
  }

  const basePrice = toNumber(formation.promoPrice) || toNumber(formation.price);
  if (basePrice <= 0) {
    throw new HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
  }

  const formationTitle = typeof formation.title === 'string' ? formation.title : '';

  /*
   * ═════════════════════════════════════════════════════════════════════════════════════
   * LA REMISE MEMBRE DU CLUB — dans CE calcul, et pas à côté.
   *
   * Le contre-exemple est dans le dépôt : la remise de parrainage est appliquée en dur dans
   * `createClubCharge`, hors de toute fonction commune. Conséquence, personne ne peut la
   * VOIR avant de payer — elle n'existe qu'au moment du débit. C'est exactement l'écart que
   * cette fonction a été écrite pour fermer, et le rouvrir pour une seconde remise aurait
   * été le rouvrir pour de bon.
   *
   * Sans `uid` — un appel anonyme, s'il en existait un jour — il n'y a pas de remise : on ne
   * devine pas une appartenance.
   * ═════════════════════════════════════════════════════════════════════════════════════
   */
  let clubDiscount = 0;
  let clubMember = false;
  if (uid) {
    const abonnement = await db.get(`club_subscriptions/${uid}`);
    const expiresAt = toDate(abonnement?.data.expiresAt);
    clubMember = abonnement?.data.status === 'active' && !!expiresAt && expiresAt > new Date();
    if (clubMember) clubDiscount = Math.round(basePrice * CLUB_MEMBER_FORMATION_DISCOUNT);
  }

  const code = couponCode?.trim();

  /*
   * ⚠️ NON CUMULABLE, ET C'EST UNE DÉCISION EXPLICITE. `validateCoupon` calcule les remises
   * en pourcentage CONTRE `basePrice` : empiler les deux produirait un prix que personne n'a
   * chiffré, et un coupon à 30 % sur un membre à 20 % passerait sous n'importe quel plancher
   * sans que rien ne l'arrête. On retient LA MEILLEURE DES DEUX — jamais leur somme.
   */
  if (!code) {
    const finalPrice = basePrice - clubDiscount;
    return { basePrice, couponDiscount: 0, clubDiscount, clubMember, finalPrice, formationTitle };
  }

  const coupon = await validateCoupon(db, code, basePrice);
  if (!coupon) {
    throw new HttpsError('invalid-argument', 'Code promo invalide, expiré ou déjà utilisé.');
  }

  const remise = Math.max(coupon.discount, clubDiscount);
  const finalPrice = basePrice - remise;
  if (finalPrice <= 0) {
    throw new HttpsError(
      'invalid-argument',
      "Ce coupon rend la formation gratuite. Utilise l'inscription gratuite.",
    );
  }

  return {
    basePrice,
    couponDiscount: coupon.discount,
    clubDiscount,
    clubMember,
    finalPrice,
    /*
     * Le coupon n'est retenu — donc consommé au webhook — que s'il a effectivement servi.
     * Sinon la remise membre l'a emporté, et faire compter un usage à un code qui n'a rien
     * réduit le viderait pour rien.
     */
    ...(coupon.discount >= clubDiscount
      ? { couponId: coupon.couponId, couponCode: code.toUpperCase() }
      : {}),
    formationTitle,
  };
}
