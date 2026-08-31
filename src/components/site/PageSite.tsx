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
 * La valeur négative est calculée à partir du même jeton que le rembourrage : si l'un change,
 * l'autre suit. Le kit les écrit en dur tous les deux, et c'est exactement ainsi qu'ils
 * finissent par diverger.
 */
export function SiteBand({
  children,
  tint,
  className = '',
  style,
}: {
  children: ReactNode;
  /** Un fond autre que `--paper-2`. Aucune page du kit ne s'en sert : y réfléchir à deux fois. */
  tint?: string;
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
        marginInline: 'var(--site-band-bleed, -40px)',
        padding: 'var(--site-band-pad, 44px 40px)',
        background: tint ?? 'var(--paper-2)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
