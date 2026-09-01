import type { CSSProperties, ReactNode } from 'react';
import type { Territory } from '../types';

/**
 * LA SIGNATURE DU SYSTÈME. Quatre cartes qui s'emboîtent par un chevron et reconstruisent
 * la silhouette du M du logo en défilant.
 *
 * Le chevron et le chevauchement sont DEUX AXES SÉPARÉS, et c'est tout l'intérêt de la prop
 * `layout` : au-delà de 700 px, le chevauchement disparaît mais le CHEVRON RESTE. Une encoche
 * prise dans une carte large et isolée ne rappelle plus rien — c'est un accident graphique.
 * Mais quatre chevrons côte à côte redonnent exactement la silhouette du logo, lue
 * horizontalement, comme dans le M.
 *
 *   < 700 px      stack   chevron + chevauchement −14 px
 *   700–1080 px   grid    chevron, aucun chevauchement — grille 2 × 2
 *   > 1080 px     row     chevron, aucun chevauchement — rangée de quatre
 *   —             plain   ni l'un ni l'autre : la carte sert de simple surface colorée
 *
 * L'ENCRE NE SE CODE JAMAIS EN DUR ICI. Elle vient de --card-ink / --card-ink-2, qui
 * s'inversent avec les dégradés sous `.dk` — sinon le méta reste noir sur bleu nuit.
 */
type Layout = 'stack' | 'grid' | 'row' | 'plain';

const LAYOUT: Record<Layout, { chevron: boolean; overlap: boolean; pad: string }> = {
  stack: { chevron: true, overlap: true, pad: '24px 20px 36px' },
  grid: { chevron: true, overlap: false, pad: '24px 20px 28px' },
  row: { chevron: true, overlap: false, pad: '26px 20px 30px' },
  plain: { chevron: false, overlap: false, pad: '20px' },
};

export interface TerritoryCardProps {
  /** `rose` est la cinquième carte — corail, hors des quatre verbes. */
  territory?: Territory | 'rose';
  layout?: Layout;
  /** Sourcil monospace — compte, durée, date. */
  meta?: string;
  title?: ReactNode;
  titleSize?: number;
  /**
   * Le nombre à droite, en monospace. Il vient de la base ou d'une source citée : passer un
   * <Num>, jamais une chaîne — c'est ce qui empêche un chiffre de démonstration d'atterrir ici.
   */
  big?: ReactNode;
  bigLabel?: string;
  trailing?: ReactNode;
  /** Première carte de la pile — supprime le chevauchement haut. */
  first?: boolean;
  /** Rend la carte cliquable, comme un vrai lien. */
  href?: string;
  padding?: number | string;
  /**
   * LA CARTE REMPLIT SA PISTE, ET SON PIED SE POSE EN BAS.
   *
   * À réserver aux grilles COMPARATIVES — trois formules côte à côte, une par piste. Sans
   * elle, chaque carte prend sa hauteur naturelle : le prix et le bouton d'un pack à six
   * arguments montent de trente pixels par rapport à celui qui en a huit, et l'œil ne peut
   * plus comparer deux montants qui ne sont pas sur la même ligne. C'est un défaut de
   * lecture avant d'être un défaut de dessin, et il vit sur la page qui vend.
   *
   * Ce que la prop fait, et rien d'autre : la carte devient une colonne flexible de hauteur
   * pleine, et son contenu aussi. Il reste à l'appelant de désigner l'élément ÉLASTIQUE —
   * la liste d'arguments — avec un `flex-1` ; c'est lui qui sait lequel doit s'étirer, pas
   * la primitive.
   */
  fill?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export function TerritoryCard({
  territory = 'forme', layout = 'stack', meta, title, titleSize, big, bigLabel,
  trailing, first, href, padding, fill, children, style,
}: TerritoryCardProps) {
  const grad = `linear-gradient(150deg,var(--g-${territory}-1) 0%,var(--g-${territory}-2) 100%)`;
  const L = LAYOUT[layout];
  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      {...(href ? { href, className: 'mm-press mm-on-color' } : {})}
      style={{
        position: 'relative',
        ...(fill
          ? { display: 'flex', flexDirection: 'column' as const, height: '100%' }
          : { display: 'block' }),
        textDecoration: 'none',
        borderRadius: 'var(--r-l)',
        padding: padding !== undefined ? (typeof padding === 'number' ? `${padding}px` : padding) : L.pad,
        marginTop: L.overlap && !first ? 'var(--stack-overlap)' : 0,
        isolation: 'isolate',
        background: grad,
        border: '1px solid var(--border-glass)',
        color: 'var(--card-ink)',
        boxShadow: 'var(--card-hl),var(--card-sh)',
        ...style,
      }}
    >
      {L.chevron && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', left: '-1px', right: '-1px', top: '-16px', height: '18px',
            background: grad,
            clipPath: 'polygon(0 100%,22% 62%,38% 18%,50% 0,62% 18%,78% 62%,100% 100%)',
          }}
        />
      )}
      {L.chevron && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)',
            width: '34px', height: '4px', borderRadius: '3px', background: 'var(--card-grip)', zIndex: 3,
          }}
        />
      )}

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          {/* `.mm-eyebrow` porte la monospace : un sourcil est un LIBELLÉ, pas un nombre.
              Un chiffre qui apparaît dedans reste soumis à la règle 6 et passe par <Num>. */}
          {meta && <div className="mm-eyebrow" style={{ fontSize: '11px', color: 'var(--card-ink-2)', letterSpacing: 'normal', textTransform: 'none' }}>{meta}</div>}
          {title && (
            <div style={{
              fontFamily: 'var(--f-display)', fontWeight: 900,
              fontSize: titleSize ? `${titleSize}px` : 'var(--fs-ttl)',
              letterSpacing: 'var(--ls-ttl)',
              lineHeight: titleSize && titleSize < 26 ? 1.08 : 1,
              marginTop: '4px',
            }}>
              {title}
            </div>
          )}
        </div>
        {/* Le conteneur NE POSE PAS la monospace : c'est le <Num> passé en `big` qui
            l'apporte, par `.mm-num`. Sans ça, une chaîne quelconque héritait de la fonte des
            nombres vérifiés — et la règle 6 se contournait sans qu'on l'ait voulu. */}
        {big !== undefined && (
          <div style={{ fontWeight: 700, fontSize: '26px', lineHeight: 1, textAlign: 'right', letterSpacing: '-.03em' }}>
            {big}
            {bigLabel && (
              <small style={{ display: 'block', fontFamily: 'var(--f-body)', fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.58, marginTop: '3px' }}>
                {bigLabel}
              </small>
            )}
          </div>
        )}
        {trailing}
      </div>

      {children && (
        <div
          style={{
            position: 'relative',
            // Sous `fill`, l'enveloppe prend la hauteur restante et redevient une colonne :
            // c'est elle qui porte le `flex-1` que l'appelant pose sur sa liste.
            ...(fill ? { flex: 1, display: 'flex', flexDirection: 'column' as const } : {}),
          }}
        >
          {children}
        </div>
      )}
    </Tag>
  );
}
