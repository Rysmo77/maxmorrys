/**
 * LE BADGE D'ENVIRONNEMENT — kit v3 (AD-27), `mm-cprod`.
 *
 * Il rappelle, dans la console, que chaque geste touche la production (le dépôt n'a aucun
 * environnement de recette : tout déploiement vise la production). Le libellé est traduit
 * par la surface ; ce composant n'affirme rien de lui-même.
 */
export interface EnvBadgeProps {
  label: string;
  className?: string;
}

export function EnvBadge({ label, className = '' }: EnvBadgeProps) {
  return (
    <span className={['mm-cprod', className].filter(Boolean).join(' ')}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
