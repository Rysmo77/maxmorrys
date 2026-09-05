/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ENGAGEMENT DU CLUB — ET POURQUOI IL N'EST PAS DANS `demo.ts`.
 *
 * Ces deux listes vivaient sous l'interrupteur `EXPO_PUBLIC_CONTENU_DEMO`, avec le reste du
 * contenu de démonstration. Conséquence : en production, elles valaient `null`, et l'écran
 * `club/infos` affichait un `<SansDonnees origine="du serveur">` — c'est-à-dire qu'il
 * annonçait attendre d'un serveur une promesse que personne n'a jamais eu l'intention d'y
 * ranger.
 *
 * ⚠️ CE N'EST PAS UNE DONNÉE SIMULÉE. C'est l'engagement commercial du produit, les mêmes
 * mots que le site publie. Le simuler n'a aucun sens ; le faire disparaître non plus. La
 * règle de `contenu/portee.ts` s'applique ici telle quelle — « ce qui route reste, ce qui
 * raconte disparaît » — à ceci près que ceci ne RACONTE pas : ça ENGAGE.
 *
 * ── LA SECONDE LISTE EST LA RAISON D'ÊTRE DE L'ÉCRAN ────────────────────────────────────
 * Une page d'informations qui n'énumère que des promesses vend une deuxième fois quelqu'un
 * qui a déjà payé. `pasGaranti` n'est donc pas une précaution juridique : c'est ce qui rend
 * la première liste croyable.
 *
 * ⚠️ CES MOTS ENGAGENT MY ONOMA SARL. Les modifier n'est pas une décision de code. Le site
 * porte sa propre formulation dans `src/i18n/locales/{fr,en}/club.json` ; les deux doivent
 * dire la même chose, et c'est une relecture humaine — pas un test — qui en répond.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export const CLUB_GARANTI = [
  '2 sessions en direct par mois, avec moi',
  'Les missions que je sors de mon carnet',
  'Les ateliers à Dakar, places membres',
  "Une réponse de moi, pas d'un modérateur",
] as const;

export const CLUB_PAS_GARANTI = [
  'Des clients',
  'Un revenu',
  'Une place à chaque atelier — elles sont comptées',
  'Une réponse dans l’heure : je réponds dans la journée ouvrée',
] as const;
