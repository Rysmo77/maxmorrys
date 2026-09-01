/**
 * Compteur de quota Rysmo : cinq barres, remplies en violet.
 * Le quota est visible en permanence — le plafond est un choix de marge assumé (NFR-10),
 * pas une limite honteuse à cacher.
 */
export interface QuotaMeterProps {
  used?: number;
  /** @default 5 */
  total?: number;
  /** Libellé à droite. Par défaut « x / y aujourd'hui ». */
  label?: string;
  style?: React.CSSProperties;
}
export function QuotaMeter(props: QuotaMeterProps): JSX.Element;
