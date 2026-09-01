import * as React from 'react';

/**
 * Ligne de liste dense : leçon, entrée d'espace personnel, réglage, tâche d'administration.
 * L'état `done` porte la pastille verte, `current` un fond dégradé et un coin arrondi,
 * `todo` un anneau vide.
 */
export interface LessonRowProps {
  /** @default "todo" */
  state?: 'done' | 'current' | 'todo' | 'plain';
  /** Icône ou glyphe à gauche (remplace la puce d'état si fourni). */
  icon?: React.ReactNode;
  iconBackground?: string;
  title?: React.ReactNode;
  /** Métadonnée en monospace : durée, compte, date. */
  meta?: string;
  /** Élément à droite : Tag, chevron, nombre. */
  trailing?: React.ReactNode;
  /** Rend la ligne cliquable : curseur, et enfoncement scale(.975) à 120 ms. */
  onClick?: () => void;
  last?: boolean;
  style?: React.CSSProperties;
}
export function LessonRow(props: LessonRowProps): JSX.Element;
