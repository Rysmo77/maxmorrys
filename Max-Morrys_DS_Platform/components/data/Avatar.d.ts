/**
 * Pastille d'initiales, 42 px par défaut, dégradé violet→bleu, liseré blanc.
 * Aucune photographie n'existe au dépôt (FR-084) : les initiales sont l'état livré,
 * pas un fond d'attente.
 */
export interface AvatarProps {
  /** Une ou deux initiales. */
  initials?: string;
  size?: number;
  /** Dégradé de fond, si vous voulez différencier des membres. */
  background?: string;
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;
