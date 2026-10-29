import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';

/**
 * LA TUILE OPAQUE DU KIT V3 (`mm-bento`) — ce qui remplace le verre `flat` sur le site.
 *
 * Le kit v3 tranche : tout ce qui DÉFILE est opaque (`#FFF` / `#121821` en nuit), et le seul
 * flou d'un écran est son chrome fixe. Le verre `glass-flat` (.78) des pages publiques
 * devient donc la tuile `mm-bento`. Même signature que `GlassPanel` — `padding`, `as`,
 * `className`, `style` — pour que le passage d'un panneau à l'autre ne touche que son nom.
 */
export interface BentoProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  padding?: number | string;
  /** Pour `as="button"`. */
  type?: 'button' | 'submit' | 'reset';
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Bento({ padding, as: Tag = 'div', className = '', style, children, ...rest }: BentoProps) {
  return (
    <Tag
      className={['mm-bento', className].filter(Boolean).join(' ')}
      style={{ ...(padding !== undefined ? { padding: typeof padding === 'number' ? `${padding}px` : padding } : null), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
