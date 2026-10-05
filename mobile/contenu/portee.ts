/**
 * LA PORTÉE DU RÔLE SUPPORT — de la STRUCTURE, pas de la donnée.
 *
 * Ces cinq entrées sont la carte que l'application a d'elle-même : les cinq écrans du rôle
 * support, leurs libellés et leurs adresses. Les LIBELLÉS et l'ORDRE viennent de `termes.ts`,
 * miroir gardé de `src/lib/adminAccess.ts` ; seule l'adresse dans l'application est d'ici.
 * Elles ne décrivent personne et n'affirment aucun fait sur le monde — c'est pourquoi elles ne passent PAS par l'interrupteur de `contenu/mode.ts`.
 *
 * La distinction se tient en une phrase : **ce qui route reste, ce qui raconte disparaît.**
 * Sans elle, `/console` et `/403` perdraient leur navigation en production — un écran qui
 * annonce « ton rôle atteint exactement cinq écrans » et n'en ouvre aucun.
 *
 * ⚠️ LES COMPTES NE SONT PAS ICI. « 0 message », « 1 prospect » sont des relevés : ils vivent
 * dans `contenu/demo.ts` et disparaissent avec lui. Une adresse est vraie sans serveur ; un
 * compte, non.
 */
import { PORTEES_SUPPORT } from './termes';

/** L'écran de l'application qui porte chaque portée du bureau. Typé : une portée ajoutée au
    site sans son écran ici ne compile pas. */
const ECRAN = {
  '/admin/messages': '/console/messages',
  '/admin/temoignages': '/console/temoignages',
  '/admin/rendez-vous': '/console/rendez-vous',
  '/admin/prospects-agence': '/console/prospects',
  '/admin/projets': '/console/projets',
} as const satisfies Record<(typeof PORTEES_SUPPORT)[number]['to'], string>;

export const SUPPORT_PORTEE = PORTEES_SUPPORT.map((p) => ({
  titre: p.label,
  href: ECRAN[p.to],
  bureau: p.to,
}));
