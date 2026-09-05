import * as React from 'react';

/**
 * Fil d'Ariane en monospace, 11,5 px. Il manque aujourd'hui sur quatre pages publiques
 * (FR-108) : c'est une dette, pas une option de conception.
 */
export interface BreadcrumbProps {
  items?: string[];
  style?: React.CSSProperties;
}
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
