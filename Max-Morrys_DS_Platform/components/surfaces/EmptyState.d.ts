import * as React from 'react';

/**
 * État vide. Règle du produit : un écran vide est une invitation à agir, pas une excuse.
 * Il dit ce qui manque, pourquoi, et la seule chose à faire ensuite.
 */
export interface EmptyStateProps {
  /** Carré de glyphe, 64 px. */
  glyph?: React.ReactNode;
  /** Fond du carré de glyphe. */
  glyphBackground?: string;
  title?: string;
  body?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
