import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Territory } from '../types';

/**
 * LA BARRE HAUTE DU SITE — pilule flottante, gabarit `mm-topbar` du kit v3 (passe 2).
 *
 * Structure des maquettes (`Main.dc.html`) : marque à gauche, navigation en CONTRÔLE
 * SEGMENTÉ centré (`mm-topbar__nav`, fond `--fill-1`) avec un POUCE (`mm-topbar__thumb`) qui
 * se pose sous l'entrée active, utilitaires à droite (`mm-topbar__end`).
 *
 * Reste opaque (AD-26) : `.mm-menu`, jamais le verre du kit (`mm-glass`) — les replis de
 * `fallback.css` sont en `!important` et réimposeraient un voile. Ce qui la fait flotter est
 * son ombre et `--r-pill`.
 *
 * Le pouce est MESURÉ (position et largeur de l'entrée active), jamais deviné : les libellés
 * français courent 18 % plus long que l'anglais. Animé en `transform` seulement (AD-16).
 */

const BAR: CSSProperties = {
  top: 0,
  display: 'flex',
  alignItems: 'center',
  margin: '16px 22px',
  borderRadius: 'var(--r-pill)',
  zIndex: 4,
};

export interface TopBarItem {
  label: string;
  href: string;
  /** Conservé pour compatibilité ; le gabarit v3 ne peint plus de filet de territoire. */
  territory?: Territory;
}

export interface TopBarProps {
  brand?: ReactNode;
  items: TopBarItem[];
  /** Libellé de l'entrée active. */
  active?: string;
  trailing?: ReactNode;
  label: string;
  skipHref?: string;
  skipLabel: string;
  className?: string;
  style?: CSSProperties;
}

export function TopBar({
  brand, items, active, trailing, label, skipHref = '#contenu', skipLabel, className = '', style,
}: TopBarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const signature = items.map((i) => i.label).join('|') + '#' + (active ?? '');

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const place = () => {
      const on = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      const next = on && on.offsetWidth > 0 ? { x: on.offsetLeft, w: on.offsetWidth } : null;
      setThumb((prev) => (prev?.x === next?.x && prev?.w === next?.w ? prev : next));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [signature]);

  return (
    <header
      className={['mm-menu', 'mm-topbar', 'mm-topbar-v3', className].filter(Boolean).join(' ')}
      style={{ position: 'sticky', ...BAR, ...style }}
    >
      <a className="mm-skip" href={skipHref}>{skipLabel}</a>
      {brand}
      <nav ref={navRef} aria-label={label} className="mm-topbar__nav">
        {thumb && (
          <span
            className="mm-topbar__thumb"
            aria-hidden="true"
            style={{ width: `${thumb.w}px`, transform: `translateX(${thumb.x}px)` }}
          />
        )}
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href}
            aria-current={it.label === active ? 'page' : undefined}
            className="mm-touch-extend"
          >
            {it.label}
          </a>
        ))}
      </nav>
      {trailing && <div className="mm-topbar__end">{trailing}</div>}
    </header>
  );
}
