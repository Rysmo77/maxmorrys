import * as React from 'react';

/**
 * Ligne de choix exclusif à radio, 68 px de haut : moyens de paiement au tunnel,
 * réponses du sélecteur de pack TPE. Sans `logo`, c'est une simple option de réponse.
 */
export interface PayOptionProps {
  /** Sigle du prestataire — « W », « OM » — ou une icône. */
  logo?: React.ReactNode;
  /** Fond du carré de logo (dégradé de la marque du prestataire). */
  logoBackground?: string;
  title?: string;
  note?: string;
  on?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function PayOption(props: PayOptionProps): JSX.Element;
