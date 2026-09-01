import * as React from 'react';

/**
 * Navigation latérale de 250 px, en verre, pour tablette et écran large.
 * Chaque territoire porte sa pastille de couleur ; les entrées hors territoire
 * portent une pastille grise.
 */
export interface SideNavProps {
  brand?: React.ReactNode;
  items?: { label: string; color?: string }[];
  active?: string;
  onSelect?: (label: string) => void;
  /** Bloc bas : reprise de cours, progression. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function SideNav(props: SideNavProps): JSX.Element;
