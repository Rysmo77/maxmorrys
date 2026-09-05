/**
 * Interrupteur, 48 × 29. Actif : dégradé bleu→violet.
 * L'état désactivé est un usage à part entière du produit — il sert à dire
 * « ce réglage existe mais ne fait rien encore » (canal e-mail absent, R-14)
 * au lieu de laisser croire le contraire.
 */
export interface SwitchProps {
  on?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;
