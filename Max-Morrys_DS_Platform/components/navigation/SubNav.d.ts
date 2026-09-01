import * as React from 'react';

/**
 * Sous-navigation d'un territoire, en tête de page. Elle existe pour une raison précise :
 * « Je te transforme » abrite du contenu **gratuit et ouvert** (podcast, vidéos) et du contenu
 * **payant et fermé** (le Club). Sans cette séparation visible, un visiteur croit le podcast
 * derrière le mur et ne clique pas — et le haut de l'entonnoir perd sa fonction.
 */
export interface SubNavProps {
  items?: { label: string; color?: string }[];
  active?: string;
  onSelect?: (label: string) => void;
  style?: React.CSSProperties;
}
export function SubNav(props: SubNavProps): JSX.Element;
