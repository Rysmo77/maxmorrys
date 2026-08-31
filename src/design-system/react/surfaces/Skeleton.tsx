import type { CSSProperties } from 'react';

/**
 * Un squelette à la FORME EXACTE du contenu qu'il attend — pour que rien ne saute quand il
 * arrive. Jamais un rond qui tourne : il ne dit ni ce qui se passe, ni combien de temps.
 *
 * Le dégradé lit l'échelle --fill-*, qui s'inverse sous `.dk`. Une valeur rgba(14,17,22,…)
 * écrite en dur ici ne blanchirait pas en mode sombre — elle DISPARAÎTRAIT.
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  /** Ce que le squelette attend, pour qui ne le voit pas. */
  label?: string;
  style?: CSSProperties;
}

const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

export function Skeleton({ width = '100%', height = 16, radius = 'var(--r-s)', label, style }: SkeletonProps) {
  return (
    <div
      className="skel"
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Chargement'}
      style={{
        width: px(width),
        height: px(height),
        borderRadius: px(radius),
        background: 'linear-gradient(100deg,var(--fill-1) 30%,var(--fill-3) 48%,var(--fill-1) 62%)',
        backgroundSize: '280% 100%',
        animation: 'shim 1.5s infinite linear',
        ...style,
      }}
    />
  );
}
