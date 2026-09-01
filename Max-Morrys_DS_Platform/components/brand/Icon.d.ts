import * as React from 'react';

/**
 * Emballage du jeu de glyphes du kit — 36 icônes à trait — dont deux emprunts déclarés à Lucide (heart, repeat), 24 × 24, extraites verbatim
 * du kit source et disponibles aussi en fichiers dans `assets/icons/`.
 * Ajout intentionnel : le kit dessine ses SVG en ligne, sans composant. Voir readme.md.
 */
export interface IconProps {
  name?: 'back' | 'forward' | 'close' | 'bell' | 'search' | 'lock' | 'share' | 'chat' | 'home'
    | 'book' | 'users' | 'user' | 'star' | 'check' | 'alert' | 'card' | 'eye' | 'download'
    | 'trash' | 'doc' | 'send' | 'bookmark' | 'comment' | 'dots' | 'play' | 'bars'
    | 'heart' | 'repeat'
    | 'list' | 'calendar' | 'case' | 'info' | 'plus' | 'chevron' | 'globe';
  /** @default 19 */
  size?: number;
  /** Par défaut celle du glyphe : 2,2 — 2,4 pour la loupe et le cadenas, 3,4 pour la coche. */
  strokeWidth?: number;
  /** @default "currentColor" */
  color?: string;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element;
export const iconNames: string[];
