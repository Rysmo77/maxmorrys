import * as React from 'react';

/**
 * Champ de saisie avec son étiquette et son aide. Trois états seulement :
 * repos, focus (liseré bleu + anneau), erreur (liseré rouge + anneau, aide en rouge).
 */
export interface FieldProps {
  label?: string;
  /** Valeur saisie. Vide → le placeholder s'affiche en gris. */
  value?: string;
  placeholder?: string;
  /** Aide sous le champ. En état error, elle passe en rouge. */
  hint?: string;
  /** @default "idle" */
  state?: 'idle' | 'focus' | 'error';
  /** Zone de texte, 96 px de haut. */
  multiline?: boolean;
  /** Élément à droite dans le champ (œil de mot de passe, unité…). */
  trailing?: React.ReactNode;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
  style?: React.CSSProperties;
}
export function Field(props: FieldProps): JSX.Element;
