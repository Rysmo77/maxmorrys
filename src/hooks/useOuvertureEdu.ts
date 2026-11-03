import { useQuery } from '@tanstack/react-query';
import { getPublishedFormations } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';
import { estAVenir, formationsOuvertes } from '../types/formationRelease';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * EDU A-T-IL QUELQUE CHOSE À VENDRE ? — et, sinon, où mène « Être prévenu·e à l'ouverture ».
 *
 * Audit UI/UX du 03/11/2026, n°8 : les deux formations étaient « Bientôt », et les appels
 * « Commencer » menaient à un catalogue où rien ne s'achète. La réponse se DÉDUIT du catalogue
 * réel (`formationsOuvertes`), jamais d'un drapeau en dur : le jour où une formation ouvre, les
 * appels redeviennent « Commencer » sans qu'on touche une ligne.
 *
 * La liste d'attente vit sur la FICHE (`#liste-attente`, `FormationDetail`), formation par
 * formation. Une seule annoncée : on y mène directement. Plusieurs : le catalogue, où chaque
 * carte porte son propre « Être prévenu·e ».
 *
 * `fermee` vaut `false` tant que le catalogue n'est pas lu : on ne retire pas « Commencer » sur
 * une supposition. Même clé de cache que le catalogue — pas de seconde lecture.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export interface OuvertureEdu {
  /** Le catalogue est lu, publié, et rien n'y est ouvert. */
  fermee: boolean;
  /** Chemin logique de la liste d'attente (à localiser par l'appelant). */
  cible: string;
}

export function useOuvertureEdu(enabled = true): OuvertureEdu {
  const { data } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
    enabled,
  });
  const liste = data ?? [];
  const aVenir = liste.filter(estAVenir);
  const fermee = data !== undefined && aVenir.length > 0 && formationsOuvertes(liste).length === 0;
  const cible = aVenir.length === 1 ? `/formations/${aVenir[0].slug}#liste-attente` : '/formations';
  return { fermee, cible };
}
