import * as React from 'react';

/**
 * Bouton d'action. Pilule, 54 px de haut en taille normale, 42 px en petite taille.
 * Le ton porte le territoire : forme = bleu→violet, transforme = violet→bleu,
 * digitalise = teal→bleu. `primary` est l'encre unie, utilisée hors territoire.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ton de surface. @default "primary" */
  tone?: 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet';
  /** @default "md" */
  size?: 'md' | 'sm';
  /** md remplit sa largeur par défaut, sm non. */
  fullWidth?: boolean;
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
