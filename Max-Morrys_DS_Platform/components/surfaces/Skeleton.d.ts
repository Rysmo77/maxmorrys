/**
 * Squelette de chargement : la forme du contenu avant le contenu, jamais un rond qui tourne.
 * Le miroitement ne démarre que sous un parent `.play`.
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
