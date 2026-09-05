import * as React from 'react';

/**
 * Barre de lecture d'un article, 3 px, en haut de l'écran, dégradé orange→corail→violet.
 * Elle se remplit à l'entrée sous un parent `.play`. C'est la seule animation de l'écran article.
 */
export interface ReadingBarProps {
  /** 0 à 100. */
  value?: number;
  style?: React.CSSProperties;
}
export function ReadingBar(props: ReadingBarProps): JSX.Element;
