import * as React from 'react';

/**
 * Bouton rond en verre, 42 px — le plancher de cible tactile du chrome.
 * Surface floutée fixe : ne jamais en placer dans une liste qui défile.
 * Le bouton fixe sa propre couleur d'encre : les glyphes en `currentColor` s'y accrochent.
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Le glyphe. Un SVG à trait de 2 à 2,4 px, 17–19 px de côté. */
  children?: React.ReactNode;
  /** Pastille orange de notification non lue. */
  badge?: boolean;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
  /** Libellé accessible — obligatoire, le bouton n'a pas de texte. */
  label?: string;
}
export function IconButton(props: IconButtonProps): JSX.Element;
