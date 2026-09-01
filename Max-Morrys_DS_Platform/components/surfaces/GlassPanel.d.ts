import * as React from 'react';

/**
 * Panneau de verre. Cinq niveaux, un seul choix à faire : **est-ce que ça défile ?**
 * Si oui — et sur mobile, la réponse est presque toujours oui — c'est `flat`.
 *
 * **Le flou n'a droit qu'à une surface qui ne défile pas avec le contenu** : `fixed` ou
 * `sticky` en production, `absolute` dans une maquette à cadre. En pratique, seul le niveau
 * `panel` en porte un, et seulement quand il sert de chrome (barre haute, barre d'onglets).
 * Les quatre autres niveaux n'en ont pas : leur voile est plus couvrant à la place.
 *
 * **Aucune valeur numérique n'est répétée dans ce fichier, à dessein.** Les opacités et les
 * flous vivent dans `tokens/glass.css` et `brand/surfaces.css`, et nulle part ailleurs. Six
 * fichiers les redisaient en prose ; quatre avaient dérivé du CSS réel. La fiche
 * « Niveaux de verre » les affiche en les **sondant** dans la feuille de styles appliquée —
 * c'est la seule source à consulter.
 *
 * Un repli ne compense que ce qui se perd : sur appareil modeste, les niveaux déjà sans flou
 * gardent leur voile de conception. Leur translucidité est une décision, pas un artefact.
 */
export interface GlassPanelProps {
  /**
   * `panel` — chrome et panneau générique, le seul niveau qui peut porter un flou.
   * `hero` — prix, formulaire principal : la surface la plus importante de l'écran.
   * `flat` — listes, fils, grilles : le défaut sur mobile, pas l'exception.
   * `night` — contenu en portée sombre. Jamais du chrome.
   * `truth` — l'encart de vérité, avec son sourcil.
   * @default "panel"
   */
  level?: 'panel' | 'hero' | 'flat' | 'night' | 'truth';
  padding?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
export function GlassPanel(props: GlassPanelProps): JSX.Element;
