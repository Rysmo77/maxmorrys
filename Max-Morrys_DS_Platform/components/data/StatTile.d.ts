import * as React from 'react';

/**
 * Case de relevé de la console. Chaque case porte sa date de relevé ;
 * une case sans date affiche « non relevé », jamais une estimation (D-03, FR-070).
 */
export interface StatTileProps {
  label?: string;
  /** Valeur — monospace, 27 px. Un zéro daté est une valeur valable. */
  value?: React.ReactNode;
  /** Date ou précision du relevé. */
  foot?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}
export function StatTile(props: StatTileProps): JSX.Element;
