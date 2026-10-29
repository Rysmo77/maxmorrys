import type { CSSProperties } from 'react';

/**
 * LA BANDE DÉFILANTE — kit v3 (AD-27), `mm-ticker`.
 *
 * Ses éléments sont TIRÉS DES DONNÉES par la surface (dernières parutions, prochaines
 * sessions) : aucune liste n'est écrite ici. La rangée est rendue deux fois pour boucler sans
 * couture ; la seconde copie est masquée aux lecteurs d'écran. La boucle (30–44 s) fait partie
 * des boucles autorisées du kit ; « réduire les animations » l'arrête (`brand/fallback.css`),
 * et le survol la met en pause.
 */
export interface TickerProps {
  items: string[];
  /** Pastille à gauche (« EN DIRECT », « NOUVEAU »…) — traduite par la surface. */
  badge?: string;
  tone?: 'default' | 'highlight' | 'ink';
  /** Durée d'un tour, en secondes (30 à 44 selon le kit). */
  seconds?: number;
  /** Nom accessible de la bande. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function Ticker({ items, badge, tone = 'default', seconds = 38, label, className = '', style }: TickerProps) {
  if (items.length === 0) return null;
  const cls = ['mm-ticker', tone !== 'default' && `is-${tone}`, className].filter(Boolean).join(' ');
  return (
    <div role="region" aria-label={label} className={cls} style={style}>
      {badge && <span className="mm-ticker__badge"><i aria-hidden="true" />{badge}</span>}
      <div className="mm-ticker__track">
        <div className="mm-ticker__row" style={{ ['--speed' as string]: `${seconds}s` } as CSSProperties}>
          {items.map((it, i) => <span key={`a${i}`}>{it}</span>)}
          {items.map((it, i) => <span key={`b${i}`} aria-hidden="true">{it}</span>)}
        </div>
      </div>
    </div>
  );
}
