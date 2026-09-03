import type { NumSource } from './Num';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE VOCABULAIRE DE CE QU'ON SAIT — et de ce qu'on ne sait pas encore.
 *
 * Les écrans du port ont aujourd'hui une branche BINAIRE : la valeur est là, ou elle est
 * `null`. Ça suffisait tant que la seule alternative au contenu de démonstration était le
 * vide. Dès qu'on interroge un serveur, quatre situations de plus existent, et les
 * confondre fait mentir l'écran :
 *
 *   • on RESTAURE la session — on ne sait pas encore qui regarde ;
 *   • on CHARGE — la réponse arrive ;
 *   • personne n'est CONNECTÉ — il n'y a rien à charger, et ce n'est pas une panne ;
 *   • ça a ÉCHOUÉ — et l'écran doit dire quoi, et proposer de réessayer ;
 *   • c'est arrivé et c'est VIDE — un zéro relevé est une information ;
 *   • c'est arrivé et c'est PLEIN.
 *
 * ── CE QUE CE TYPE CORRIGE, EN PLUS D'AJOUTER DES ÉTATS ───────────────────────────────
 * Le contrat actuel donne `readonly []` aux listes absentes. Une liste vide et une liste
 * jamais lue s'affichent donc pareil — « tu n'as aucune note » est écrit avec le même aplomb
 * qu'on ait compté ou pas. `charge` et `vide` séparent enfin les deux, et c'est exactement
 * la règle que `EmptyState` énonce déjà : un zéro DATÉ est une information, un zéro sans
 * date n'en est pas une.
 *
 * ── POURQUOI `valeur: null` PARTOUT AILLEURS ─────────────────────────────────────────
 * Parce que la branche que les 42 écrans écrivent déjà — `X === null ? <SansDonnees/> : …` —
 * route alors les six situations vers le bon endroit SANS être réécrite. La migration coûte
 * un renommage, pas une reprise de chaque JSX.
 *
 * Ce fichier ne contient que des types et deux fabriques : il ne rend rien, et c'est
 * `SansDonnees` qui traduit chaque phase en écran.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** D'où vient la valeur, et quand elle a été relevée. Ce que `<Num>` exige. */
export interface Provenance {
  source: NumSource;
  asOf: Date;
}

export type Phase =
  | 'restauration'
  | 'charge'
  | 'anonyme'
  | 'nonBranche'
  | 'panne'
  | 'vide'
  | 'servie'
  | 'replique';

export type Etat<T> =
  /** La session se restaure ; on ne sait pas encore s'il y a quelqu'un. */
  | { phase: 'restauration'; valeur: null }
  /** La demande est partie. */
  | { phase: 'charge'; valeur: null }
  /** Personne n'est connecté. Ce n'est ni une panne ni un vide : c'est une porte fermée. */
  | { phase: 'anonyme'; valeur: null }
  /** L'écran n'a pas encore de source serveur. Honnête, et voué à disparaître. */
  | { phase: 'nonBranche'; valeur: null }
  /** Ça a échoué. `motif` est écrit pour être lu, pas pour être diagnostiqué. */
  | { phase: 'panne'; valeur: null; motif: string; reessayer: () => void }
  /** Le serveur a répondu, et il n'y a rien. Daté, donc informatif. */
  | ({ phase: 'vide'; valeur: null } & Provenance)
  /** Le serveur a répondu. */
  | ({ phase: 'servie'; valeur: T } & Provenance)
  /** Le contenu du transfert, en développement ou en revue. Jamais en production. */
  | ({ phase: 'replique'; valeur: T } & Provenance);

/** Les phases où il n'y a rien à montrer — celles que `SansDonnees` prend en charge. */
export const PHASES_SANS_VALEUR = [
  'restauration', 'charge', 'anonyme', 'nonBranche', 'panne', 'vide',
] as const;

export const enChargement = <T,>(): Etat<T> => ({ phase: 'charge', valeur: null });
export const nonBranche = <T,>(): Etat<T> => ({ phase: 'nonBranche', valeur: null });
