import * as React from 'react';

/**
 * Carte de média du pôle « écouter & regarder ». **La silhouette dit le format** :
 * une onde pour l'audio, un cadre 16:9 pour la vidéo — une étiquette « Podcast » ou
 * « Vidéo » se perd sur téléphone, une forme non.
 * `cost` porte toujours le poids en mégaoctets : le forfait est compté (NFR-04).
 */
export interface MediaCardProps {
  /** @default "audio" */
  format?: 'audio' | 'video';
  /** Dégradé de la vignette. Par défaut celui du format. Aucune photographie. */
  gradient?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  /** Durée, poids, et le coût de l'alternative texte : ["34:20","31 Mo","Transcription · 0 Mo"]. */
  cost?: string[];
  /** Étiquette en bas de vignette — « Vidéo · 16:9 », une durée. */
  badge?: string;
  artHeight?: number;
  titleSize?: number;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export function MediaCard(props: MediaCardProps): JSX.Element;
