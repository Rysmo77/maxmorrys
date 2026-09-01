import * as React from 'react';

/**
 * L'icône de marque fournie : un M sérif découpé en quatre teintes.
 * C'est le seul fichier de logo du dépôt (`assets/logo-mm-icon.png`, 1240 px, fond blanc).
 * Il n'existe ni version SVG, ni version monochrome, ni logotype horizontal.
 */
export interface LogoMarkProps {
  size?: number;
  /** Chemin relatif vers l'icône depuis la page qui la monte. @default "assets/logo-mm-icon.png" */
  src?: string;
  /** Pastille blanche arrondie sous l'icône — nécessaire sur fond coloré ou nuit,
   *  le fichier n'a pas de transparence. */
  plate?: boolean;
  style?: React.CSSProperties;
}
export function LogoMark(props: LogoMarkProps): JSX.Element;
