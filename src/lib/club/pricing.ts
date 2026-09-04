/**
 * Tarif du Club des Digitos — SOURCE DE VÉRITÉ CÔTÉ CLIENT.
 *
 * Consommé par le gate d'abonnement, les quatre pages publiques qui affichent le prix et le
 * tableau de bord d'administration. Aucun de ces emplacements ne doit reporter le nombre.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE
 * Le prix a longtemps été recopié à treize endroits sans point de contact. Résultat : les CGV
 * ont annoncé 10 000 FCFA/an pendant que le code en débitait 19 900 — deux valeurs introduites
 * par deux commits distincts, sur un abonnement engageant douze mois. Aligné le 13 août 2026.
 *
 * ⚠️ MIROIRS À SYNCHRONISER À LA MAIN
 * Les trois projets TypeScript du dépôt (`src/`, `functions/`, `worker/`) ne peuvent pas
 * s'importer entre eux : la duplication serveur est structurelle, pas négligente. Toute
 * modification de montant doit être répercutée dans :
 *
 *   functions/src/payment.ts              → CLUB_PRICE (débit réel) + rebuild de functions/lib
 *   worker/apps/api/src/lib/bictorys.ts   → CLUB_PRICE (débit réel, port Cloudflare)
 *   src/i18n/locales/{fr,en}/legal.json   → CGV art. 3.4 — TEXTE CONTRACTUEL
 *   finance/model.py                      → projections
 *   BUSINESS_MODEL.md · BUSINESS_PLAN.md · docs/STRATEGIE_COMMUNICATION_2026.md
 *
 * `tests/unit/club-pricing.test.ts` vérifie que les CGV et l'interface portent bien la valeur
 * ci-dessous. Il ne peut pas atteindre les miroirs serveur : ceux-là restent sous votre garde.
 */

/** Abonnement annuel, en francs CFA. */
export const CLUB_PRICE_XOF = 19_900;

/**
 * Remise accordée au filleul lors de sa première souscription.
 * Appliquée **côté serveur uniquement** — le client n'envoie jamais de montant.
 */
export const CLUB_REFERRAL_DISCOUNT = 0.15;

/**
 * Prix effectivement débité à un filleul : 16 915 FCFA.
 * Même arrondi que le serveur (`Math.round`), pour que l'affichage ne diverge pas du prélèvement.
 */
export function clubReferralPrice(): number {
  return Math.round(CLUB_PRICE_XOF * (1 - CLUB_REFERRAL_DISCOUNT));
}

/**
 * Remise accordée à un membre actif sur l'achat d'une FORMATION.
 *
 * C'est la première chose que l'abonnement fait gagner en dehors du Club lui-même : jusqu'ici,
 * les deux lignes se côtoyaient sans jamais se nourrir. Le montant est recalculé côté serveur
 * (`resolveCheckoutTotal`) — cette constante ne sert qu'à ANNONCER, jamais à débiter.
 *
 * ⚠️ MIROIR SERVEUR : `worker/apps/api/src/lib/bictorys.ts` → `CLUB_MEMBER_FORMATION_DISCOUNT`.
 * `tests/unit/club-pricing.test.ts` lit ce fichier-là EN TEXTE et échoue si les deux
 * divergent. C'est la porte que le prix du Club n'avait pas.
 *
 * ⚠️ NON CUMULABLE AVEC UN CODE PROMO : le serveur retient la meilleure des deux remises,
 * jamais leur somme. Annoncer un cumul ferait attendre un prix qui ne sera pas débité.
 */
export const CLUB_MEMBER_FORMATION_DISCOUNT = 0.2;
