import * as React from 'react';

/**
 * Barre d'onglets basse, 80 px, en verre flouté — c'est la seule surface floutée
 * fixe d'un écran d'espace personnel, et elle compte dans le budget de deux.
 * Cinq onglets : Espace, Cours, Rysmo, Club, Profil.
 *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
export interface TabBarProps {
  /** Onglets : { label, icon }. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  items?: { label: string; icon?: React.ReactNode }[];
  /** Libellé de l'onglet actif. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  active?: string;
  onSelect?: (label: string) => void;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  style?: React.CSSProperties;
}
export function TabBar(props: TabBarProps): JSX.Element;
