import { cn } from '../../lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * ⚠️ CE COMPOSANT EST RENDU SOUS LA PORTÉE `.dk` DE LA CONSOLE.
 *
 * `bg-paper` seul y donnait du texte ILLISIBLE. `--paper` est le blanc FIXE du système : il
 * n'est pas redéclaré dans `tokens/dark.css`, volontairement — c'est `--paper-fixed` qui sert
 * le papier sur surface colorée, et `--surface-page` qui porte le fond de page, redéclaré à
 * `#0B0E13`. Mais `--ink`, lui, DEVIENT `#ECF0F5` sous `.dk`.
 *
 * Résultat mesuré : encre `#ECF0F5` sur carte `#FFFFFF` — **1,06:1**. Le texte disparaît.
 * `AdminLayout` posant `dk` sur toute la zone de contenu, le défaut portait sur les
 * vingt-quatre surfaces que ces deux primitives rendent dans la console.
 *
 * C'est exactement le mode de panne qu'AD-3 décrit : « le composant retombe silencieusement
 * sur sa valeur claire ». La correction est celle du système — une surface lit un jeton qui
 * bascule seul, elle ne prend pas de prop de thème.
 *
 * `ConsoleSheet` reste la bonne feuille d'édition de la console (verre nuit, pied d'actions à
 * trois boutons) ; ceci empêche seulement les appels restants d'être illisibles.
 */
export default function Card({ children, hover, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-sheet rounded-2xl border border-[color:var(--line)]',
        hover && 'transition duration-300 hover:shadow-soft hover:-translate-y-1 hover:border-[color:var(--line)] dark:hover:border-[color:var(--border-hair)]',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
