/**
 * Quota quotidien du répétiteur — MIROIR CLIENT DES CONSTANTES SERVEUR.
 *
 * Le design system fait de « ton répétiteur à 5 questions par jour au lieu de 2 » un
 * ARGUMENT DE VENTE de la page publique du Club. C'est donc un nombre affiché à quelqu'un qui
 * n'a pas encore de compte : la page ne peut pas l'obtenir en interrogeant le quota, qui exige
 * une session. Il doit vivre en constante côté client.
 *
 * Et un nombre promis avant paiement, vérifié après, est exactement le cas que la règle 6
 * existe pour empêcher : si le serveur passe le bonus à 2 et que la page continue d'annoncer
 * 5, personne ne le voit — sauf la personne qui vient de payer.
 *
 * ⚠️ MIROIRS À SYNCHRONISER À LA MAIN. Les trois projets TypeScript du dépôt ne peuvent pas
 * s'importer entre eux ; la duplication est structurelle, pas négligente :
 *
 *   functions/src/rysmo.ts                    → BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA
 *   worker/apps/api/src/lib/rysmo-quota.ts    → BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA
 *
 * `tests/unit/rysmo-quota.test.ts` LIT ces deux fichiers et échoue si l'une des trois valeurs
 * s'écarte. C'est ce que le prix du Club n'avait pas, et c'est ainsi que les CGV ont pu
 * annoncer 10 000 pendant que le code débitait 19 900 — voir `src/lib/club/pricing.ts`.
 */

/** Questions offertes chaque jour à un compte sans abonnement. */
export const RYSMO_BASE_DAILY = 2;

/** Ce que l'abonnement au Club ajoute — pas le total. */
export const RYSMO_CLUB_BONUS = 3;

/** Le total d'un membre du Club : ce que la page publique annonce. */
export const RYSMO_CLUB_DAILY = RYSMO_BASE_DAILY + RYSMO_CLUB_BONUS;
