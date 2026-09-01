import * as React from 'react';

/**
 * La signature du système : quatre cartes qui s'emboîtent par un chevron et
 * reconstruisent la silhouette du M du logo en défilant. Dégradé à deux arrêts entre
 * la teinte du territoire et sa voisine dans le logo.
 * En `stacked`, chevauchement de −14 px. Au-delà de 700 px de large, passer en grille
 * (`stacked={false}`) : le chevron isolé sur une carte trop large devient un accident graphique.
 */
export interface TerritoryCardProps {
  /* L'encre de la carte vient de --card-ink / --card-ink-2 : elle s'inverse avec les
     dégradés en mode sombre. Ne jamais coder une couleur de texte en dur ici. */
  /** @default "forme" */
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' | 'rose';
  /** Sourcil monospace — compte, durée, date. */
  meta?: string;
  /** Titre en Fraunces 900. */
  title?: React.ReactNode;
  /** Nombre vérifié à droite, en monospace. */
  big?: React.ReactNode;
  /** Légende sous le nombre, en capitales. */
  bigLabel?: string;
  /** Empilement en M : chevron + poignée + chevauchement. @default true */
  stacked?: boolean;
  /** Première carte de la pile — supprime le chevauchement haut. */
  first?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function TerritoryCard(props: TerritoryCardProps): JSX.Element;
