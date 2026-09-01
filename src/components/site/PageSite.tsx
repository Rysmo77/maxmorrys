import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from './useReveal';

/**
 * L'ENVELOPPE D'UNE PAGE PUBLIQUE.
 *
 * Elle porte trois choses, et seulement trois :
 *
 *   • la GOUTTIÈRE du kit — `34px 40px 56px` en desktop, `18px` latéral en mobile. Le 18 px
 *     n'est pas un arrondi du 40 : c'est le rembourrage latéral unique de tout le produit
 *     mobile, celui dont dérive `margin: 0 -18px` pour les débordements pleine largeur ;
 *   • le PLAN — `z-index: 3`, au-dessus du maillage, qui est posé une seule fois pour toute
 *     l'application par `PageMesh` dans `PublicLayout`. **Ne pas en poser un second ici** :
 *     deux maillages superposés, c'est le troisième fond que le système interdit ;
 *   • la SCÈNE — `.play` arrive quand la page entre dans le champ, et les `.rv` s'animent.
 *
 * Ce qu'elle ne porte PAS : la barre haute et le pied de page. Ils vivent dans `PublicLayout`,
 * montés une fois pour les vingt routes. Les remonter par page les remonterait vingt fois.
 */
export interface PageSiteProps {
  children: ReactNode;
  /**
   * Identifiant de la section pour le lien de saut. Une seule page en porte un `main`, donc
   * la valeur par défaut suffit presque toujours.
   */
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function PageSite({ children, id, className = '', style }: PageSiteProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        position: 'relative',
        zIndex: 3,
        // Gouttière du kit. Le mobile passe à 18 px latéral par la requête média de
        // `index.css` — une valeur en dur ici la figerait pour les deux points de rupture.
        padding: 'var(--site-pad, 34px 40px 56px)',
        /*
          LA MESURE, hors-tout : la colonne du kit PLUS les deux gouttières que ce bloc
          porte lui-même. `box-sizing: border-box` étant posé par le préflet, le contenu
          retombe donc exactement sur `--site-measure` — 1200 px, le chiffre de la planche.
          Voir le pavé « LA MESURE DU SITE » d'`index.css` pour ce que son absence coûtait.
        */
        maxWidth: 'calc(var(--site-measure, 1200px) + 2 * var(--site-gutter, 40px))',
        marginInline: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * LA BANDE DE SECTION — pleine largeur, sur `--paper-2`.
 *
 * Le mécanisme du kit : `margin: 0 -40px` annule exactement le rembourrage latéral de la page,
 * donc la bande touche les deux bords tandis que son contenu revient dans la colonne. C'est ce
 * qui donne le rythme du site sans jamais introduire un troisième fond — `--paper-2` est un
 * papier, pas une couleur de territoire.
 *
 * ── LE DÉBORDEMENT QUI SE VOYAIT SUR ONZE PAGES SUR DOUZE ────────────────────────────────
 *
 * La marge négative n'annule un rembourrage QUE si elle a ce rembourrage au-dessus d'elle.
 * Dans la maquette, `SiteBand` est toujours un ENFANT du conteneur rembourré : `Page` rend
 * `<div style={{padding:'34px 40px 56px'}}>{children}</div>` et la bande sort de la gouttière
 * par `margin:'0 -40px'` (`reference/site-shell.jsx`).
 *
 * Ici, les pages ferment `</PageSite>` puis ouvrent `<SiteBand>` comme FRÈRE — et c'est la
 * bonne structure, parce que chaque bloc porte sa propre scène d'entrée. Mais le parent réel
 * devient alors le `<main>` de `App.tsx`, qui n'a aucun rembourrage latéral : la marge
 * négative n'annulait plus rien, elle AJOUTAIT 80 px de largeur. Résultat mesurable sur onze
 * pages : 40 px hors écran à gauche, une barre de défilement horizontale à droite, et le
 * contenu de la bande décalé de 40 px par rapport au reste de la page.
 *
 * Le défaut ne se voit sur aucune capture prise à la bonne largeur, et le typecheck ne peut
 * rien en dire. D'où l'inversion du défaut : une bande est PLEINE LARGEUR par nature, et
 * `bleed` devient l'exception explicite — à ne poser que si la bande vit à l'intérieur de la
 * gouttière d'un `PageSite`.
 */
export function SiteBand({
  children,
  tint,
  bleed = false,
  className = '',
  style,
}: {
  children: ReactNode;
  /** Un fond autre que `--paper-2`. Aucune page du kit ne s'en sert : y réfléchir à deux fois. */
  tint?: string;
  /**
   * La bande est IMBRIQUÉE dans un `PageSite` et doit ressortir de sa gouttière. À réserver à
   * ce cas : posé sur une bande de premier niveau, il la fait déborder de la fenêtre.
   * La valeur négative vient du même jeton que le rembourrage, pour qu'ils ne divergent pas.
   */
  bleed?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        zIndex: 3,
        marginInline: bleed ? 'var(--site-band-bleed, -40px)' : 0,
        padding: 'var(--site-band-pad, 44px 40px)',
        /*
          LA MESURE D'UNE BANDE PASSE PAR SON REMBOURRAGE, PAS PAR SA LARGEUR.

          Une bande est pleine largeur PAR NATURE — c'est son fond qui donne le rythme du
          site, et le borner en ferait une carte. C'est donc son CONTENU qu'il faut ramener
          dans la colonne : le rembourrage latéral s'ouvre jusqu'à ce qu'il ne reste que
          `--site-measure` au milieu, et retombe sur la gouttière ordinaire dès que l'écran
          est plus étroit que la mesure. `max()` fait les deux d'un trait, sans requête
          média et sans un `<div>` de plus dans vingt pages.

          Il vient APRÈS le raccourci `padding` ci-dessus, donc il n'en écrase que l'axe
          horizontal : les 44/34 px verticaux du kit sont intacts.
        */
        paddingInline: 'max(var(--site-gutter, 40px), calc((100% - var(--site-measure, 1200px)) / 2))',
        /*
          `--surface-band`, et non `--paper-2` en direct : le papier de rythme du kit n'est PAS
          redéclaré sous `.dk` — ni par `tokens/dark.css`, ni par le kit livré, vérifié. Une
          bande restait donc un aplat quasi blanc en pleine page sur fond #0B0E13. Le jeton
          bascule seul (AD-22, même famille que `--surface-sheet`) : la bande recule d'un cran
          sous le fond de page, dans les deux modes.
        */
        background: tint ?? 'var(--surface-band)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
