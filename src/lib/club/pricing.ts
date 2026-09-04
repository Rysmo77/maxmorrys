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
 * SESSIONS EN DIRECT INCLUSES, PAR MOIS — un TERME DE L'OFFRE, pas un relevé.
 *
 * Il était écrit `const LIVE_SESSIONS_PER_MONTH = 2` dans `ClubDigitos.tsx`, c'est-à-dire dans
 * la page qui l'affiche. Un engagement commercial n'appartient pas au composant qui le rend,
 * exactement pour la raison qui a fait naître ce fichier : celui qu'on ouvre quand l'offre
 * change doit être celui qui porte l'offre.
 *
 * ⚠️ CE N'EST PAS UN NOMBRE MESURÉ, et la page ne doit pas le faire passer pour tel : il est
 * ANNONCÉ — `<Num source={{ cite: … }}>`, jamais `source="db"`. Ce qui est mesuré vit à côté :
 * le nombre de sessions RÉELLEMENT tenues, que le Worker dénormalise dans `public_stats/club`
 * et que la page affiche sous l'engagement. L'engagement dit ce que je promets, le relevé dit
 * ce que j'ai fait ; l'un sans l'autre ne se vérifie pas.
 */
export const LIVE_SESSIONS_PER_MONTH = 2;

/**
 * La date de dernière révision des termes ci-dessus — `<Num>` exige un `asOf`, et ces valeurs
 * ne viennent pas d'une requête : elles sont écrites ici.
 *
 * Le 04/09/2026, les termes ont été RELUS contre le code et déplacés ici ; aucune valeur n'a
 * changé. Midi UTC, pas minuit : à minuit, la provenance affiche la veille à l'ouest de
 * Greenwich (voir `CATALOGUE_REVISED_AT` dans `lib/presence/offer.ts`).
 *
 * À mettre à jour AVEC les termes, jamais séparément.
 */
export const CLUB_TERMS_REVISED_AT = new Date('2026-09-04T12:00:00Z');

/**
 * ── L'OUVERTURE DU CLUB, ET POURQUOI C'EST UNE DONNÉE ───────────────────────────────────
 *
 * « La plateforme vient d'ouvrir » et « Le Club a ouvert cette année » étaient écrites en
 * toutes lettres dans la copie, en deux langues, à trois endroits. Vraies au moment où on les
 * écrit, fausses quelques mois plus tard, et RIEN ne le signale : une phrase relative au temps
 * ne casse pas, elle se met simplement à mentir. Sur les deux écrans dont le métier est
 * d'expliquer pourquoi aucun chiffre n'est annoncé, c'est le pire endroit possible.
 *
 * Une phrase DATÉE, elle, ne périme pas : elle vieillit avec son lecteur, qui fait lui-même le
 * calcul. La date remplace donc le relatif, et elle vit ici parce que c'est une donnée.
 *
 * ⚠️ GRANULARITÉ AU MOIS, VOLONTAIREMENT. Le format est `AAAA-MM`, pas une date complète : le
 * jour exact n'est pas connu, et l'inventer pour satisfaire un type `Date` serait exactement la
 * fabrication que tout ce fichier existe pour empêcher. `useFormat().formatMonth()` en fait
 * « août 2026 » ou « August 2026 » selon la langue. Son jumeau côté plateforme est
 * `PLATFORM_OPENED_AT`, dans `lib/brand/company.ts`.
 */
export const CLUB_OPENED_AT = '2026-08';
