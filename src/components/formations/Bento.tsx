import type { CSSProperties, ElementType, ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA TUILE OPAQUE DE L'ESPACE APPRENDRE — `mm-bento` du kit v3.
 *
 * Le kit v3 remplace le verre translucide des tableaux de bord par des tuiles « bento »
 * opaques (#fff / #121821) : tout ce qui défile est opaque, le seul flou reste sur le chrome
 * fixe (AD-4). Ce composant reprend la signature de `GlassPanel` (padding, `as`, rôle,
 * libellé) pour que la bascule des écrans du lot Apprendre ne touche à aucune logique.
 *
 * `tone="hero"` = la tuile principale d'un écran : même surface, avec l'ombre de carte du
 * kit pour la détacher. L'encart de vérité, lui, reste `GlassPanel level="truth"` — c'est
 * un autre sens, pas une autre surface.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export interface BentoProps {
  tone?: 'flat' | 'hero';
  padding?: number | string;
  children?: ReactNode;
  as?: ElementType;
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

export default function Bento({
  tone = 'flat', padding, children, as: Tag = 'div', className = '', style, ...rest
}: BentoProps) {
  return (
    <Tag
      className={['mm-bento', tone === 'hero' ? 'shadow-v3-card' : '', className].filter(Boolean).join(' ')}
      style={{ padding: typeof padding === 'number' ? `${padding}px` : padding, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
