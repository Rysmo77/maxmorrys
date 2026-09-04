import type { CSSProperties, ReactNode } from 'react';
import type { Territory } from '../types';
import { TERRITORY_INK } from '../types';

/**
 * LA NAVIGATION LATÉRALE — 250 px, tablette et écran large (700 à 1080 px).
 *
 * ELLE A PERDU SON FLOU, PUIS SON VOILE. Le kit lui donnait `.glass` : elle devenait la
 * troisième surface floutée d'une page qui a déjà sa barre haute, alors qu'une colonne
 * latérale défile dès qu'elle est plus haute que la fenêtre. Elle est donc passée en faux
 * verre (`.glass-flat`, voile à 78 %, aucun flou), ce qui réglait le coût de composition.
 *
 * Restait le voile, et il ne réglait rien : en nuit `.dk .glass-flat` vaut blanc à 7 %, et la
 * page se lit à travers le panneau — c'est le flou qui tenait la lisibilité, pas le voile.
 * AD-26 : `.mm-menu`, opaque, qui bascule seule avec le thème. Un tiroir doit MASQUER ; c'est
 * le voile derrière lui, et lui seul, qui reste translucide.
 *
 * DE VRAIS LIENS DANS UNE VRAIE LISTE. Le kit rendait des `<a>` sans `href`, posés côte à côte
 * sans conteneur : un lecteur d'écran n'annonçait ni « liste de 4 », ni « lien », ni quelle
 * entrée était la courante. `<ul>` + `<a href>` + `aria-current="page"` — AD-6.
 *
 * LE SEUIL D'APPARITION N'EST PAS ICI. Une primitive ne connaît pas la mise en page, et un
 * style inline ne peut pas porter de requête média. La surface qui la compose décide de
 * l'afficher entre `--bp-stack` (700 px) et `--bp-wide` (1080 px) ; c'est aussi elle qui sait
 * ce qui la remplace en dessous.
 */

const PANE: CSSProperties = {
  flex: '0 0 auto',
  padding: '22px 18px',
  /* Ce n'est pas une carte posée sur la page, c'est un bord de page : ni rayon, ni ombre,
     un seul filet à droite — les trois écrasent `.mm-menu`, un style en ligne gagnant sur une
     classe. `--nav-brd` est repointé sur `--menu-brd` dans la portée du menu (AD-26) : à 50 %
     de blanc, l'ancien filet était invisible sur une surface blanche opaque. */
  border: 0,
  borderRight: '1px solid var(--nav-brd)',
  borderRadius: 0,
  boxShadow: 'none',
  position: 'relative',
  zIndex: 3,
};

const ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '11px 13px',
  /* 14 px : la valeur du kit. Elle n'est sur aucun échelon de `radius.css` (10 · 16 · 24) et
     ne s'arrondit pas pour autant — si le kit dit 14, c'est 14 (AD-1). */
  borderRadius: '14px',
  fontFamily: 'var(--f-body)',
  fontSize: '13.5px',
  fontWeight: 600,
  textDecoration: 'none',
};

const DOT: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '3px',
  display: 'block',
  flex: '0 0 auto',
};

export interface SideNavItem {
  label: string;
  href: string;
  /** Sa pastille prend l'encre du territoire. Sans territoire, pastille grise (`--fill-5`). */
  territory?: Territory;
}

export interface SideNavProps {
  /** La marque, en tête de colonne — `<Wordmark />`. */
  brand?: ReactNode;
  items: SideNavItem[];
  active?: string;
  /** Bloc bas : reprise de cours, progression. */
  footer?: ReactNode;
  /** Nom du point de repère. Il se traduit : la chaîne vient de la surface. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function SideNav({ brand, items, active, footer, label, className = '', style }: SideNavProps) {
  return (
    <nav aria-label={label} className={['mm-menu', className].filter(Boolean).join(' ')} style={{ width: '250px', ...PANE, ...style }}>
      {brand && <div style={{ margin: '2px 0 22px 12px' }}>{brand}</div>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it) => {
          const on = it.label === active;
          return (
            <li key={it.label} style={{ marginBottom: '3px' }}>
              <a
                href={it.href}
                aria-current={on ? 'page' : undefined}
                // Le dessin fait 40 px de haut ; `.mm-touch-extend` porte la cible à 44 sans
                // toucher au dessin. Une colonne de navigation se touche au pouce sur tablette.
                className="mm-touch-extend"
                style={{
                  ...ITEM,
                  // AD-18 : au repos, `--ink-2`. L'encre tertiaire ne porte pas de texte.
                  color: on ? 'var(--text-body)' : 'var(--text-muted)',
                  background: on ? 'var(--nav-on-bg)' : 'transparent',
                  boxShadow: on ? 'var(--nav-on-sh)' : 'none',
                }}
              >
                {/* La pastille redit la couleur du territoire, que le libellé dit déjà :
                    aucune information n'y est portée seule, donc rien à annoncer. */}
                <span aria-hidden="true" style={{ ...DOT, background: it.territory ? TERRITORY_INK[it.territory] : 'var(--fill-5)' }} />
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
      {footer && <div style={{ marginTop: '22px' }}>{footer}</div>}
    </nav>
  );
}
