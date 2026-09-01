/**
 * Rangée de filtres en pilules, défilement horizontal masqué. Le chip actif est en encre pleine.
 */
export interface ChipRowProps {
  options?: string[];
  value?: string;
  onChange?: (option: string) => void;
  /** 40 par défaut ; 36 dans un lecteur de leçon. */
  height?: number;
  style?: React.CSSProperties;
}
export function ChipRow(props: ChipRowProps): JSX.Element;
