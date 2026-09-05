/**
 * Contrôle segmenté, 2 à 3 options courtes : langue, apparence, portée d'un classement.
 * Au-delà de trois options, utiliser ChipRow.
 */
export interface SegmentedProps {
  options?: string[];
  /** Option active. Par défaut la première. */
  value?: string;
  onChange?: (option: string) => void;
  style?: React.CSSProperties;
}
export function Segmented(props: SegmentedProps): JSX.Element;
