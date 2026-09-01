import * as React from 'react';

/**
 * Fond de territoire : trois lobes de couleur flous en dérive lente, sous un voile
 * de lisibilité qui monte de 42 % en haut à 90 % en bas. Poids : 0 octet.
 * Se place en premier enfant d'un conteneur `position:relative`.
 */
export interface MeshProps {
  /** @default "forme" */
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' | 'nuit';
  /** Diamètre des lobes en px — 340 sur mobile, 460–520 sur écran large. */
  size?: number;
  /** Substitution de style par lobe, dans l'ordre. Le kit s'en sert une fois :
   *  /agence prend un premier lobe corail sur le maillage Digitalise. */
  lobes?: React.CSSProperties[];
  style?: React.CSSProperties;
}
export function Mesh(props: MeshProps): JSX.Element;
