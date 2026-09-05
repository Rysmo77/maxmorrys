import * as React from 'react';

/**
 * Rangée de filtres en pilules. Le chip actif est en encre pleine.
 *
 * L'écart entre pilules est `--touch-gap` (8 px), le minimum du système entre deux cibles.
 * Il n'est pas paramétrable : deux cibles plus serrées produisent des touchers ambigus, et
 * aucun écran n'a de raison légitime de descendre en dessous.
 *
 * **Utilisez ce composant plutôt que de recopier le motif.** Trois écrans l'avaient
 * réimplémenté en ligne pour obtenir un débordement différent, et les trois avaient dérivé
 * sur la hauteur, l'écart, le rembourrage et la taille de fonte. C'est ce que la prop
 * `layout` existe pour éviter.
 */
export interface ChipRowProps {
  options?: string[];
  value?: string;
  onChange?: (option: string) => void;
  /**
   * `40` par défaut · `36` dans un lecteur de leçon · **`44` quand la rangée est
   * l'interaction principale de l'écran** — c'est `--touch-aa`, le plancher exigé de
   * cible tactile. Un écran dont toute la conception repose sur le fait qu'on touche ces
   * pilules ne doit pas les servir à 34 px.
   */
  height?: number;
  /**
   * Ce que fait la rangée quand elle dépasse sa colonne.
   * `clip` — rognée (défaut) · `scroll` — défilement horizontal, cas du mobile ·
   * `wrap` — passe à la ligne, cas du desktop où la place existe en hauteur.
   *
   * `scroll` est le seul mode où les pilules sont posées en `flex: 0 0 auto` : sans ça elles
   * se comprimeraient pour tenir dans la colonne et il n'y aurait plus rien à faire défiler.
   * Sous `clip`, elles gardent le `0 1 auto` implicite — elles se compriment plutôt que de
   * se faire rogner, ce qui les garde toutes atteignables. **Ne pas généraliser le
   * `0 0 auto` :** trois appels existants passent tout juste dans leur conteneur et y
   * perdraient un onglet, invisible et inatteignable.
   *
   * `scroll` pose aussi la classe **`.mm-scroll-x`** (`brand/interactions.css`), qui masque
   * la barre de défilement. Elle vit dans la fermeture de `styles.css` et non en style
   * inline, parce que `::-webkit-scrollbar` est un pseudo-élément — même raison que
   * `.mm-chrome` pour le repli de flou. **Elle doit voyager avec le composant** : sans elle,
   * une barre native épaisse s'affiche sous la bande de pilules.
   * @default "clip"
   */
  layout?: 'clip' | 'scroll' | 'wrap';
  /** Classes supplémentaires sur le conteneur. Elles s'ajoutent à `.mm-scroll-x`, ne la remplacent pas. */
  className?: string;
  /**
   * Glyphe posé devant le libellé des pilules **inactives** — un cadenas sur une bande
   * d'onglets verrouillés. Sur la pilule active il répéterait une information que l'état
   * donne déjà, et sur un onglet ouvert un cadenas serait carrément faux.
   *
   * C'est une prop à part et non une forme d'`options` à dessein : `options` reste un
   * tableau de chaînes, donc un appel avec `icon` **dégrade proprement** contre une version
   * antérieure du composant — il perd l'icône, il ne lève pas d'exception. Passer des objets
   * dans `options` faisait tomber les huit écrans avec « Objects are not valid as a React
   * child » le temps que le paquet se recompile.
   */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
export function ChipRow(props: ChipRowProps): JSX.Element;
