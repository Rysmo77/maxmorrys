import * as React from 'react';

/**
 * Le mot-symbole. **Trois marques distinctes, une par surface** — ce n'est pas une variante
 * décorative, c'est une distinction de produit :
 *
 * - `hello` — **les pages web**. « Hello ! » en dégradé, reprenant dans l'ordre les trois
 *   couleurs qui portaient « Max » : bleu `#0057BC`, orange `#F38B0A`, teal `#02AC9C`.
 * - `rysmo` — **l'application mobile**, dont le nom est *Rysmo*. Le R prend le bleu, le o
 *   final le teal : la marque garde ses bornes de couleur.
 * - `signature` — **la personne**, Max-Morrys. Réservé aux mentions légales, à la page
 *   « Je suis Max-Morrys » et à la signature d'article. Ce n'est plus un nom de produit.
 *
 * Ne pas confondre *Rysmo* (l'application) avec le **répétiteur IA** qui vit dedans : celui-ci
 * s'appelle « Répétiteur » par défaut et **chaque personne peut le renommer**. Les deux noms
 * ont longtemps été le même ; ils ne le sont plus.
 *
 * Sur `hello`, `color` est déclaré avant `WebkitTextFillColor` : là où le remplissage
 * transparent n'est pas compris, le texte reste lisible en bleu au lieu de disparaître.
 */
export interface WordmarkProps {
  /** @default "hello" */
  brand?: 'hello' | 'rysmo' | 'signature';
  /** Taille en px. @default 22 */
  size?: number;
  /** Encre de la partie neutre — `rysmo` et `signature` uniquement. */
  tail?: string;
  /** Variantes nuit des quatre teintes. */
  night?: boolean;
  /** `signature` uniquement : « Max » seul, sans « -Morrys ». */
  short?: boolean;
  style?: React.CSSProperties;
}
export function Wordmark(props: WordmarkProps): JSX.Element;
