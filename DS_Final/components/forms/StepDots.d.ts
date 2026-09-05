/**
 * Avancement d'un tunnel court — trois barres pleine largeur, jamais un numéro seul.
 * Le libellé « Étape 2 sur 3 » vit dans la barre haute, pas ici.
 */
export interface StepDotsProps {
  /** @default 3 */
  total?: number;
  /** Nombre d'étapes franchies. @default 1 */
  current?: number;
  style?: React.CSSProperties;
}
export function StepDots(props: StepDotsProps): JSX.Element;
