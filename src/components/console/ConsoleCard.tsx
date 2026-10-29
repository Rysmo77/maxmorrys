import type { CSSProperties, ElementType, ReactNode } from 'react';

/**
 * ── LA CARTE DE CONSOLE (kit v3, `mm-ccard`) ────────────────────────────────────────
 *
 * Elle remplace le `GlassPanel level="night"` que les écrans de console posaient partout
 * quand la coquille vivait en nuit. La coquille est CLAIRE depuis les fondations du kit v3
 * (AD-27) : un panneau `glass-d` y devenait une dalle presque noire portant une encre
 * sombre — illisible. Le kit dessine des cartes blanches, opaques, à filet fin.
 *
 * LE FOND EST REPOSÉ SUR `--bento`, ET C'EST VOLONTAIRE. `mm-ccard` écrit `#fff` en dur ;
 * sous `.dk` (choix de la personne) l'encre bascule et la carte resterait blanche : du
 * blanc sur du blanc. `--bento` vaut `#fff` en clair et la dalle sombre du kit en sombre.
 *
 * `title` et `aside` dessinent l'en-tête du kit (`mm-ccard__h` : titre à gauche, relevé ou
 * action à droite). Sans eux, la carte n'est qu'un cadre — le cas des listes et des pieds.
 */
export interface ConsoleCardProps {
  padding?: number | string;
  children?: ReactNode;
  as?: ElementType;
  /** Titre de la carte (`h2` du kit). */
  title?: ReactNode;
  /** Ce qui se lit à droite du titre : portée, relevé, une action. */
  aside?: ReactNode;
  className?: string;
  style?: CSSProperties;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-pressed'?: boolean;
}

export default function ConsoleCard({
  padding, children, as: Tag = 'div', title, aside, className, style, ...rest
}: ConsoleCardProps) {
  return (
    <Tag
      className={className ? `mm-ccard ${className}` : 'mm-ccard'}
      style={{
        background: 'var(--bento)',
        ...(padding !== undefined ? { padding: typeof padding === 'number' ? `${padding}px` : padding } : null),
        ...style,
      }}
      {...rest}
    >
      {(title || aside) && (
        <div className="mm-ccard__h">
          {title && <h2>{title}</h2>}
          {aside && <span className="r">{aside}</span>}
        </div>
      )}
      {children}
    </Tag>
  );
}
