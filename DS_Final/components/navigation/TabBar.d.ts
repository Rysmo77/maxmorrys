import * as React from 'react';

/**
 * Barre d'onglets basse, 80 px, en verre flouté — c'est la seule surface floutée fixe d'un
 * écran d'espace personnel. Cinq onglets : Espace, Cours, Répétiteur, Club, Profil.
 *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 *
 * Aucune prop de thème : la surface vient de `--tabbar-bg`, qui bascule sous `.dk`.
 */
export interface TabBarProps {
  items?: { label: string; icon?: React.ReactNode }[];
  /** Libellé de l'onglet actif. */
  active?: string;
  onSelect?: (label: string) => void;
  /**
   * Hauteur de la zone de geste système, en px — `34` sur iOS, `24` ou `48` sur Android.
   * **Obligatoire en natif, inutile en web.** @default 0
   *
   * Elle vit ici, sur le `bottom` de la barre, et pas sur un rembourrage d'ancêtre :
   * `bottom:0` se résout au bas de la boîte de rembourrage, donc aucun `paddingBottom`
   * extérieur ne remonterait la barre. Sans cette prop, l'indicateur d'accueil se dessine
   * par-dessus les onglets et les 34 px inférieurs de chaque cible tombent dans la zone où
   * l'OS intercepte le glissement vers le haut.
   */
  safeBottom?: number;
  style?: React.CSSProperties;
}
export function TabBar(props: TabBarProps): JSX.Element;
