import * as React from 'react';

/**
 * Ligne de document : devis TPE, mentions légales, relevé. Filet pointillé,
 * valeur en monospace à droite. Un devis émis est figé — une évolution de la grille
 * tarifaire ne réécrit jamais un devis déjà envoyé.
 */
export interface DocLineProps {
  label?: React.ReactNode;
  value?: React.ReactNode;
  last?: boolean;
  style?: React.CSSProperties;
}
export function DocLine(props: DocLineProps): JSX.Element;
