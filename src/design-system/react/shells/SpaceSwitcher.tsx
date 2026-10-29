import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * LE SÉLECTEUR D'ESPACES — kit v3 (AD-27), `mm-spaces`.
 *
 * Un compte, plusieurs espaces. Le kit les place sur trois sous-domaines ; le dépôt ne les a
 * PAS (décision du 29/10/2026 : la session partagée et le cookie de domaine sont un chantier
 * séparé). Le sélecteur mène donc à des ROUTES du même domaine — `/`, `/mon-espace`,
 * `/mon-espace/club`, `/admin` — et c'est la surface qui fournit les `href`.
 *
 * Ce sont des LIENS : un espace est une adresse, il s'ouvre dans un onglet. Le pouce blanc
 * glisse sous l'entrée courante en `transform` seul (AD-16) ; sa largeur est posée, jamais
 * animée. Rendu dans un `DsNavHost` côté produit pour naviguer sans recharger.
 */
export type SpaceId = 'hub' | 'edu' | 'club' | 'admin';

export interface SpaceSwitcherItem {
  id: SpaceId;
  /** Le nom visible de l'espace — traduit par la surface. */
  label: string;
  href: string;
  /** Petite mention en monospace à droite du nom (facultative). */
  hint?: string;
}

export interface SpaceSwitcherProps {
  items: SpaceSwitcherItem[];
  current: SpaceId;
  /** Nom du point de repère (« Changer d'espace »). */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function SpaceSwitcher({ items, current, label, className = '', style }: SpaceSwitcherProps) {
  const ref = useRef<HTMLElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const on = root?.querySelector<HTMLElement>(`a[data-space="${current}"]`);
    if (!root || !on) { setThumb(null); return; }
    const measure = () => setThumb({ x: on.offsetLeft, w: on.offsetWidth });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [current, items]);

  return (
    <nav ref={ref} aria-label={label} className={['mm-spaces', className].filter(Boolean).join(' ')} style={style}>
      {thumb && (
        <span
          aria-hidden="true"
          className="mm-spaces__thumb"
          style={{ width: `${thumb.w}px`, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {items.map((it) => (
        <a key={it.id} href={it.href} data-space={it.id} aria-current={it.id === current ? 'page' : undefined}>
          <i aria-hidden="true" />
          {it.label}
          {it.hint && <small>{it.hint}</small>}
        </a>
      ))}
    </nav>
  );
}
