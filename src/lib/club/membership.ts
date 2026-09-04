import type { ClubDigitosSubscription } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ÊTRE MEMBRE DU CLUB — une définition, tous les lecteurs.
 *
 * Le prédicat vivait en TROIS exemplaires identiques, écrits à la main :
 * `StudentLayout.tsx`, `useClubData.ts`, et le garde serveur de `createClubCharge`. Trois
 * copies d'une règle qui décide d'un ACCÈS PAYANT, dont deux dans le navigateur.
 *
 * Tant que la règle ne bougeait pas, la duplication ne se voyait pas. Elle se serait vue le
 * jour où l'une des trois aurait gagné une nuance — une période de grâce après l'échéance,
 * un statut « suspendu » — et où les deux autres ne l'auraient pas eue : quelqu'un aurait vu
 * l'onglet du Club sans pouvoir en lire le contenu, ou l'inverse.
 *
 * ⚠️ CE N'EST PAS LA GARDE. Le cloisonnement réel est dans `firestore.rules`, qui refuse la
 * lecture des publications, de l'agenda et des opportunités sans abonnement actif. Ce
 * prédicat décide de ce qu'on MONTRE ; les règles décident de ce qu'on obtient.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Ce qu'il faut savoir d'un abonnement pour dire s'il court. Volontairement minimal. */
export interface AbonnementLisible {
  status?: string;
  expiresAt?: string;
}

/**
 * L'abonnement court-il à cet instant ?
 *
 * ⚠️ `null` ET `undefined` RÉPONDENT `false`. « Je n'ai pas encore lu » n'est pas « il n'est
 * pas membre » — mais les deux se traitent pareil ICI, parce qu'on ne montre rien tant qu'on
 * ne sait pas. C'est à l'appelant de distinguer le chargement de l'absence quand ça compte :
 * un panneau qui apparaît puis disparaît est pire que le même panneau qui arrive tard.
 *
 * ⚠️ UNE ÉCHÉANCE ABSENTE OU ILLISIBLE VAUT « EXPIRÉ ». C'est l'inverse du garde serveur de
 * Rysmo, qui répute valide un abonnement sans terme — et l'écart est voulu : ici, se tromper
 * coûte un accès montré à quelqu'un qui n'y a pas droit, et les règles Firestore le lui
 * refuseraient ensuite sans explication.
 */
export function estMembreActif(
  abonnement: AbonnementLisible | ClubDigitosSubscription | null | undefined,
  maintenant: Date = new Date(),
): boolean {
  if (!abonnement || abonnement.status !== 'active') return false;
  if (typeof abonnement.expiresAt !== 'string') return false;
  const fin = new Date(abonnement.expiresAt);
  if (Number.isNaN(fin.getTime())) return false;
  return fin > maintenant;
}
