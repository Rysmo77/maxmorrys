import type { ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * LES TROIS POINTS DE RUPTURE DES CARTES TERRITOIRE — et la silhouette du M.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *   < 700 px      `stack`  chevron + chevauchement de −14 px
 *   700 → 1080    `grid`   chevron, AUCUN chevauchement — grille 2 × 2
 *   > 1080 px     `row`    chevron, rangée de quatre
 * ────────────────────────────────────────────────────────────────────────────
 *
 * POURQUOI LE CHEVRON SURVIT ET LE CHEVAUCHEMENT DISPARAÎT. Au-delà de 700 px, une encoche
 * prise dans une carte large et isolée ne rappelle plus rien — c'est un accident graphique.
 * Mais quatre chevrons côte à côte redonnent exactement la silhouette du M du logo, lue
 * horizontalement. Les deux axes sont donc portés séparément par la prop `layout`.
 *
 * ⚠️ CE COMPOSANT TRANCHE UNE CONTRADICTION DU DESIGN SYSTEM. Le kit du site public rend
 * toutes ses cartes en `stacked={false}` — ce qui, dans `TerritoryCard`, tombe sur le motif
 * `plain` : ni chevron, ni chevauchement. La silhouette du M n'apparaît alors sur AUCUNE page
 * desktop. Le `readme.md` et le kit responsive disent tous deux l'inverse, et ce dernier
 * l'implémente avec sa propre légende : « Quatre chevrons en rangée — la silhouette du M, lue
 * horizontalement ». Deux sources écrites contre un dessin qui l'oublie : c'est la règle qui
 * l'emporte, et la signature du logo survit.
 *
 * Pourquoi une bascule en JavaScript plutôt qu'en CSS : `layout` est une PROP, et elle change
 * la structure rendue (le chevron est un élément, pas un pseudo). Trois variantes en CSS
 * demanderaient de monter les trois et d'en cacher deux — donc de payer trois fois le rendu.
 */
export type TerritoryLayout = 'stack' | 'grid' | 'row';

export function useTerritoryLayout(): TerritoryLayout {
  // `--bp-stack` et `--bp-wide` du système. Écrits ici parce qu'une requête média ne lit pas
  // une variable CSS ; ce sont les deux seuls endroits du produit où ces nombres se répètent.
  const wide = useMediaQuery('(min-width: 1080px)');
  const roomy = useMediaQuery('(min-width: 700px)');
  return wide ? 'row' : roomy ? 'grid' : 'stack';
}

/**
 * La grille qui va avec le motif. En pile, les cartes se chevauchent et la grille ne doit
 * donc PAS poser d'écart — sinon le −14 px se bat contre un `gap`.
 */
export function TerritoryRow({ layout, children }: { layout: TerritoryLayout; children: ReactNode }) {
  const style =
    layout === 'row'
      ? { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }
      : layout === 'grid'
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }
        : // En pile : aucun `gap`. Le chevauchement de `TerritoryCard` s'en charge.
          { display: 'block' };

  return <div style={style}>{children}</div>;
}
