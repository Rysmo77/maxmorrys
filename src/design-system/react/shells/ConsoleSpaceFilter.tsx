import type { CSSProperties } from 'react';

/**
 * LE FILTRE D'ESPACE DE LA CONSOLE — kit v3 (AD-27), `mm-cspaces`.
 *
 * `Tout · Hub · Edu · Club · Conception · Rysmo` : il filtre les tuiles et les files de la
 * console. Ce sont des BOUTONS bascule (`aria-pressed`), pas des liens : l'adresse ne change
 * pas, seule la vue. Les options et leurs libellés viennent de la surface.
 */
export interface ConsoleSpaceOption {
  id: string;
  label: string;
  /** Pastille de couleur — une teinte du système (`var(--mm-bleu-f)`…), jamais un hexadécimal. */
  dot?: string;
}

export interface ConsoleSpaceFilterProps {
  options: ConsoleSpaceOption[];
  value: string;
  onChange: (id: string) => void;
  /** Nom du groupe (« Filtrer par espace »). */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function ConsoleSpaceFilter({ options, value, onChange, label, className = '', style }: ConsoleSpaceFilterProps) {
  return (
    <div role="group" aria-label={label} className={['mm-cspaces', className].filter(Boolean).join(' ')} style={style}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.dot && <i aria-hidden="true" style={{ background: o.dot }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
