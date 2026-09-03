/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA PORTE DES DONNÉES — un écran importe d'ici, jamais d'ailleurs.
 *
 * Le même principe que `ds/index.ts` pour les primitives, et pour la même raison : tant
 * qu'il y a une porte, on peut changer ce qu'il y a derrière. Un écran qui importerait
 * `contenu/demo` ou `firebase/firestore` en direct figerait sa source, et il faudrait
 * retrouver les quarante-deux le jour où elle change.
 *
 * Chaque hook renvoie un `Etat<T>` — les six situations que `SansDonnees` sait rendre —
 * et compose déjà la réplique de démonstration là où elle existe. Un écran n'a donc rien
 * à savoir de tout ça : il teste `valeur === null`, exactement comme avant.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import type { Etat } from '../ds';
import { FORMATION, MOI } from '../contenu/demo';
import { composer } from './etat';
import type { VueEspace, VueMoi } from './types';
import { useVue } from './vue';

export { SessionProvider, useSession, useUid } from './session';
export { connexionEmail, creationEmail, deconnexion, reinitialiser, ErreurIdentite } from './identite';
export { exporterMesDonnees } from './rgpd';
export { appeler, ErreurAppel } from './appel';
export { viderLesVues } from './vue';
export type { VueEspace, VueMoi } from './types';

/** Qui regarde : prénom, initiale, date d'ouverture du compte. */
export function useMoi(): Etat<VueMoi> {
  const brut = useVue<VueMoi>('appMoi');
  /*
   * La réplique porte les mêmes champs que la vue, moins ceux que le transfert ne
   * connaissait pas. Le `null` de `tuteur` n'est pas un manque : le nom du répétiteur
   * vient du profil, et le kit n'en avait pas.
   */
  return composer(brut, MOI === null ? null : {
    prenom: MOI.prenom,
    nom: MOI.nom,
    initiale: MOI.initiale,
    email: MOI.email,
    ouvertureCompte: MOI.ouvertureCompte,
    tuteur: null,
    role: 'student',
    xp: 0,
  });
}

/** La reprise : la formation la plus récemment touchée, et où on en est. */
export function useEspace(): Etat<VueEspace> {
  const brut = useVue<VueEspace>('appEspace');
  return composer(brut, FORMATION === null ? null : {
    slug: FORMATION.slug,
    titre: FORMATION.titre,
    titreCourt: FORMATION.titreCourt,
    meta: FORMATION.meta,
    lecons: FORMATION.lecons,
    leconsFaites: FORMATION.leconsFaites,
    progression: FORMATION.progression,
    arret: FORMATION.arret,
    moduleEnCours: FORMATION.moduleEnCours,
    leconEnCours: FORMATION.leconEnCours,
  });
}
