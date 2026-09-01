import * as React from 'react';

/**
 * Barre de navigation desktop : pilule de verre flottante, détachée des bords
 * (marge de 16 px en haut, 22 px sur les côtés). Chaque entrée de territoire porte
 * son filet de couleur sous le libellé.
 */
export interface TopBarProps {
  /** Marque à gauche — Wordmark. */
  brand?: React.ReactNode;
  /** Entrées : { label, territory? }. */
  items?: { label: string; territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' }[];
  active?: string;
  onSelect?: (label: string) => void;
  /** Bloc de droite : langue, connexion. */
  trailing?: React.ReactNode;
  style?: React.CSSProperties;
}
export function TopBar(props: TopBarProps): JSX.Element;
