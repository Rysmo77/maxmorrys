import * as React from 'react';

/**
 * Ligne à coche : ce qui est dû, listé un engagement par ligne. Motif central de la page
 * publique du Club, où il porte les cinq choses qui ne dépendent que d'une personne.
 * `dash` remplace la coche par un tiret : c'est la forme du renvoi (« autre chose, si… »),
 * jamais une croix — on n'écarte pas quelqu'un, on l'oriente.
 */
export interface CheckLineProps {
  /** violet = engagement du Club · ok = critère rempli · neutre = renvoi. @default "violet" */
  tone?: 'violet' | 'ok' | 'neutre';
  /** Tiret au lieu de la coche. */
  dash?: boolean;
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function CheckLine(props: CheckLineProps): JSX.Element;
