import type { CSSProperties, ReactNode } from 'react';
import type { Territory } from '../types';
import { TERRITORY_INK } from '../types';

/**
 * LA BARRE HAUTE DU SITE — pilule flottante, et la première des surfaces qui ONT PERDU LEUR
 * VERRE (AD-26).
 *
 * Elle portait `glass mm-chrome` : blanc à 62 % et `blur(24px)`, blanc à 9 % en nuit. C'était
 * la dernière des deux surfaces à qui le kit accordait encore un flou, au motif que le contenu
 * passe RÉELLEMENT dessous. L'argument tenait tant qu'on acceptait de voir au travers ; il ne
 * dit rien en faveur du voile lui-même. Deux mesures l'ont emporté : en nuit, 9 % de blanc ne
 * masque rien sans le flou ; et le repli « appareil modeste » de `fallback.css` ne s'appliquait
 * JAMAIS en mode sombre (`.lowfi .dk` est un combinateur descendant, les deux classes sont sur
 * <html>), donc la barre y rendait blanc à 90 % sur le profil d'appareil du marché visé.
 *
 * `.mm-menu` est opaque et bascule seule avec le thème. Ce qui la fait flotter n'est plus sa
 * transparence, c'est son ombre — et `--r-pill` ci-dessous, qui garde la silhouette.
 *
 * Le kit la pose en `relative` dans une maquette qui ne défile pas ; en production c'est
 * `sticky`. La marge de 16 px survit au collage : `top: 0` colle la boîte de marge, donc la
 * pilule reste détachée du bord.
 *
 * LE LIEN DE SAUT EST LE PREMIER ÉLÉMENT FOCALISABLE. Il ne coûte rien et il est le seul
 * moyen, au clavier, de ne pas retraverser six entrées de navigation à chaque page. Il est
 * invisible tant qu'il n'a pas le focus — `.mm-skip` le sort du cadre en `transform`, jamais
 * en `top`, parce que la règle du mouvement ne fait pas d'exception pour le code du système
 * lui-même.
 *
 * L'ORDRE DES ENTRÉES N'EST PAS UNE DÉCISION DE COMPOSANT : Je suis · Je te forme ·
 * Je t'informe · Je te transforme · Je te digitalise · Contacte-moi. L'agence vit hors des
 * quatre verbes et n'a donc pas de territoire — le type `Territory` l'en empêche.
 */

const BAR: CSSProperties = {
  /* Le collage se fait au bord haut : la marge de 16 px fait partie de la boîte collée,
     donc la pilule reste détachée du bord au lieu de s'y écraser. */
  top: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  padding: '14px 22px',
  margin: '16px 22px',
  borderRadius: 'var(--r-pill)',
  zIndex: 4,
};

const LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--f-body)',
  fontSize: '13.5px',
  fontWeight: 600,
  color: 'var(--text-body)',
  textDecoration: 'none',
  paddingBottom: '3px',
  borderBottomWidth: '2px',
  borderBottomStyle: 'solid',
};

export interface TopBarItem {
  label: string;
  href: string;
  /** Le territoire porte son filet de couleur sous le libellé, en permanence. */
  territory?: Territory;
}

export interface TopBarProps {
  /** La marque, à gauche — `<Wordmark />`. */
  brand?: ReactNode;
  items: TopBarItem[];
  /** Libellé de l'entrée courante. */
  active?: string;
  /** Bloc de droite : langue, connexion. */
  trailing?: ReactNode;
  /** Nom du point de repère de navigation. Il se traduit : la chaîne vient de la surface. */
  label: string;
  /** Ancre du contenu principal. */
  skipHref?: string;
  /**
   * Libellé du lien de saut. Obligatoire et jamais défaillant en français : il DEVIENT
   * visible dès qu'il prend le focus, et un « Aller au contenu » figé s'afficherait tel quel
   * sur le site anglais.
   */
  skipLabel: string;
  className?: string;
  style?: CSSProperties;
}

export function TopBar({
  brand, items, active, trailing, label, skipHref = '#contenu', skipLabel, className = '', style,
}: TopBarProps) {
  return (
    // AD-26 : plus de `glass` ni de `mm-chrome`. Le REMPLACEMENT est le point — garder l'une
    // des deux à côté de `mm-menu` laisserait les trois replis de `fallback.css`, qui sont en
    // `!important`, réimposer leur fond de verre à une surface qui n'en veut plus.
    <header className={['mm-menu', className].filter(Boolean).join(' ')} style={{ position: 'sticky', ...BAR, ...style }}>
      <a className="mm-skip" href={skipHref}>{skipLabel}</a>
      {brand}
      <nav aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {items.map((it) => {
          const on = it.label === active;
          return (
            <a
              key={it.label}
              href={it.href}
              aria-current={on ? 'page' : undefined}
              // Le dessin du kit reste — 13,5 px, filet de 2 px. Seule la CIBLE passe à 44 px,
              // par le pseudo-élément de `.mm-touch-extend` : on n'épaissit pas une barre de
              // navigation pour satisfaire une règle, on étend ce qui se touche.
              className="mm-touch-extend"
              style={{
                ...LINK,
                borderBottomColor: it.territory ? TERRITORY_INK[it.territory] : on ? 'var(--ink)' : 'transparent',
                transition: 'border-color var(--t-ui) var(--ease)',
              }}
            >
              {it.label}
            </a>
          );
        })}
      </nav>
      {trailing && (
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>{trailing}</span>
      )}
    </header>
  );
}
