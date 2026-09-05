import * as React from 'react';

/**
 * Pilule d'encre du chrome — « Menu », et rien d'autre dans le produit actuel.
 * Capitales, interlettrage ouvert, 12 px : c'est un repère, pas un appel à l'action.
 */
export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
}
export function PillButton(props: PillButtonProps): JSX.Element;
