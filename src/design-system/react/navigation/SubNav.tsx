import type { CSSProperties } from 'react';
import type { Territory } from '../types';
import { TERRITORY_INK } from '../types';

/**
 * LA SOUS-NAVIGATION D'UN TERRITOIRE — en tête de page, et elle existe pour une raison
 * commerciale précise.
 *
 * « Je te transforme » abrite du contenu GRATUIT ET OUVERT (podcast, vidéos) et du contenu
 * PAYANT ET FERMÉ (le Club). Sans cette séparation visible, un visiteur croit le podcast
 * derrière le mur et ne clique pas — et le haut de l'entonnoir perd sa fonction. L'ordre
 * n'est donc pas négociable : le gratuit d'abord, le Club ensuite.
 *
 * PLUS DE VERRE DU TOUT (AD-26). Elle n'a jamais eu de flou — elle défile avec la page — mais
 * ses puces étaient deux voiles de blanc, `--surface-card` (62 %) pour l'active et
 * `--ctl-off-bg` (55 %) pour les autres. Sur un maillage, deux voiles proches se distinguent
 * mal, et en nuit ils tombent à 7,5 % et 8 % : l'écart entre l'étage courant et les autres
 * devenait un jeu de contraste sur ce qu'il y avait DERRIÈRE. Les deux puces sont désormais
 * des couleurs pleines, `--menu-on-bg` et `--menu-off-bg`, dont l'écart ne dépend plus du fond.
 *
 * DE VRAIS LIENS. Le kit rendait des `<a>` sans `href` et un `onSelect` : deux étages d'un
 * même territoire sont deux ADRESSES, pas deux états d'un composant — elles se partagent,
 * s'indexent, et se rouvrent. C'est le point ouvert C du transfert (AD-6).
 */

const ITEM: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '9px',
  /* 42 px de dessin, 44 px de cible par `.mm-touch-extend` : l'écart de 2 px du kit est
     assumé dans les maquettes et ne se reproduit pas en production. */
  height: '42px',
  padding: '0 16px',
  borderRadius: 'var(--r-pill)',
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

export interface SubNavItem {
  label: string;
  href: string;
  /** Pastille à l'encre du territoire ; sans territoire, pastille grise (`--fill-5`). */
  territory?: Territory;
}

export interface SubNavProps {
  items: SubNavItem[];
  /** Libellé de l'entrée courante. Sans valeur, c'est la première — le gratuit. */
  active?: string;
  /** Nom du point de repère. Il se traduit : la chaîne vient de la surface. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function SubNav({ items, active, label, className = '', style }: SubNavProps) {
  return (
    <nav aria-label={label} className={className || undefined} style={style}>
      <ul style={{ display: 'flex', gap: '8px', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it, i) => {
          const on = active === undefined ? i === 0 : active === it.label;
          return (
            <li key={it.label} style={{ display: 'flex' }}>
              <a
                href={it.href}
                aria-current={on ? 'page' : undefined}
                className="mm-press-sm mm-touch-extend"
                style={{
                  ...ITEM,
                  background: on ? 'var(--menu-on-bg)' : 'var(--menu-off-bg)',
                  border: '1px solid var(--menu-brd)',
                  // AD-18 : l'étage au repos reste sur `--ink-2`, jamais sur l'encre tertiaire.
                  color: on ? 'var(--text-body)' : 'var(--text-muted)',
                  // `--glass-hl` était un liseré de lumière INTERNE : il imitait la réfraction
                  // d'un bord de verre, et sur une couleur pleine il ne dit plus rien.
                  boxShadow: on ? '0 4px 14px rgba(14,17,22,.07)' : 'none',
                }}
              >
                <span aria-hidden="true" style={{ ...DOT, background: it.territory ? TERRITORY_INK[it.territory] : 'var(--fill-5)' }} />
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
