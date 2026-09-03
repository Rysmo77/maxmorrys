/**
 * LA PORTÉE DU RÔLE SUPPORT — de la STRUCTURE, pas de la donnée.
 *
 * Ces cinq entrées sont la carte que l'application a d'elle-même : cinq écrans sur dix-neuf,
 * leurs libellés et leurs adresses. Elles ne décrivent personne et n'affirment aucun fait sur
 * le monde — c'est pourquoi elles ne passent PAS par l'interrupteur de `contenu/mode.ts`.
 *
 * La distinction se tient en une phrase : **ce qui route reste, ce qui raconte disparaît.**
 * Sans elle, `/console` et `/403` perdraient leur navigation en production — un écran qui
 * annonce « ton rôle atteint exactement cinq écrans » et n'en ouvre aucun.
 *
 * ⚠️ LES COMPTES NE SONT PAS ICI. « 0 message », « 1 prospect » sont des relevés : ils vivent
 * dans `contenu/demo.ts` et disparaissent avec lui. Une adresse est vraie sans serveur ; un
 * compte, non.
 */
export const SUPPORT_PORTEE = [
  { titre: 'Messages', href: '/console/messages' },
  { titre: 'Témoignages', href: '/console/temoignages' },
  { titre: 'Rendez-vous', href: '/console/rendez-vous' },
  { titre: 'Prospects', href: '/console/prospects' },
  { titre: 'Projets', href: '/console/projets' },
] as const;
