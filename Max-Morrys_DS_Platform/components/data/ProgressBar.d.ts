/**
 * Barre de progression, 8 px, remplie par le dégradé des quatre teintes du logo.
 * Se remplit à l'entrée de l'écran (durée --t-scene) sous un parent `.play`.
 */
export interface ProgressBarProps {
  /** 0 à 100. */
  value?: number;
  height?: number;
  style?: React.CSSProperties;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
