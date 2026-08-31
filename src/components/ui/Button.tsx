import { cn } from '../../lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

/**
 * LE BOUTON DE LA CONSOLE — et les deux règles qu'il enfreignait.
 *
 * Il reste distinct du `Button` de `@ds` tant que la console n'est pas portée : ses cinq
 * variantes (dont `danger`, que le système ne nomme pas) et son API `icon` sont câblées dans
 * une cinquantaine d'appels. Mais deux de ses comportements contredisaient le système, et
 * ils sont corrigés ici plutôt que dans chacun de ces appels :
 *
 * 1 · IL FAISAIT TOURNER UN ROND. Le contrat du `Button` du système est explicite : « le
 *     libellé RESTE pendant le chargement — un bouton dont le texte disparaît fait douter de
 *     ce qu'on vient de déclencher. Un liseré le balaie. Jamais de rond qui tourne. » Celui-ci
 *     REMPLAÇAIT l'icône par un rond : le libellé restait, mais l'action, elle, disparaissait.
 *     Il porte désormais `.mm-loading`, le liseré du système, et garde son icône.
 *
 * 2 · IL BARRAIT LE CURSEUR. `cursor: not-allowed` se lit comme une erreur de la personne
 *     alors que c'est un état du produit — le système impose `default`, et `states.css`
 *     l'applique déjà à tout `[disabled]`. La classe est retirée pour ne pas la contredire.
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: 'bg-forme text-white hover:bg-forme active:bg-forme shadow-sm',
  secondary: 'bg-[color:var(--night-3)] text-white hover:bg-[color:var(--night-3)] dark:hover:bg-[color:var(--fill-2)]',
  // Les jetons de remplissage s'inversent seuls sous `.dk` — de teintes d'encre à teintes de
  // lumière — donc le survol n'a pas de moitié sombre à écrire.
  outline: 'border-2 border-[color:var(--line)] text-ink hover:bg-[color:var(--fill-1)]',
  ghost: 'text-ink-2 hover:bg-[color:var(--fill-2)]',
  danger: 'bg-stop text-white hover:bg-stop active:bg-stop',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-5 py-2.5 text-sm min-h-[44px]',
  lg: 'px-7 py-3.5 text-base min-h-[48px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'mm-press inline-flex items-center justify-center gap-2 font-semibold rounded-full transition duration-200 focus:outline-none',
        loading && 'mm-loading',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* L'icône NE BOUGE PAS pendant le chargement : c'est le liseré de `.mm-loading` qui
          dit que quelque chose se passe. Échanger l'icône contre un rond faisait disparaître
          l'action qu'on venait de déclencher, au moment précis où on la cherche des yeux. */}
      {icon}
      {children}
    </button>
  );
}
