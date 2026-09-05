import * as React from 'react';

/**
 * Champ de recherche en pilule de verre, 56 px. Le libellé est en capitales grasses
 * avec sa fin en gris : « TROUVE CE QU'IL TE FAUT ». Sert aussi de composeur Rysmo.
 *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
export interface SearchPillProps {
  /** Partie grasse du libellé. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  label?: string;
  /** Partie grise. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  hint?: string;
  /** Icône de gauche (loupe). Absente pour le composeur. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  icon?: React.ReactNode;
  /** Bouton d'envoi à droite. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  trailing?: React.ReactNode;
  height?: number;
  style?: React.CSSProperties;
}
export function SearchPill(props: SearchPillProps): JSX.Element;
