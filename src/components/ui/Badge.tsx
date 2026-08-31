import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'accent' | 'coral' | 'plum' | 'teal' | 'lagoon' | 'neutralOutline';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * LES ÉTIQUETTES DE LA CONSOLE — et le défaut qu'elles portaient toutes.
 *
 * Le voile `color-mix(…, transparent)` était appliqué à la COULEUR DU TEXTE, pas au fond.
 * Le `Tag` du design system fait exactement l'inverse, et c'est lui qui a raison : le voile
 * est un FOND, l'encre est un jeton PLEIN. Mesuré sur blanc, un texte de marque ramené à
 * 40 % d'opacité donnait :
 *
 *     --mm-bleu    #0057BC → #99BCE4   1,97:1   ✗
 *     --ok         #0F7B52 → #9FCABA   1,81:1   ✗
 *     --stop       #B4231F → #E1A7A5   2,04:1   ✗
 *     --mm-violet  #6C23DD → #C4A7F1   2,07:1   ✗
 *
 * Quatre sur quatre sous 4,5:1, et sous 3:1 — donc illisibles à toute taille.
 *
 * QUATRE VARIANTES NE RENDAIENT MÊME AUCUNE COULEUR. `accent`, `coral`, `teal` et `lagoon`
 * portaient un suffixe orphelin — `text-[color-mix(…)]-txt` — reste d'un remplacement
 * automatique qui avait laissé la fin de l'ancien nom de classe collée à la nouvelle valeur
 * arbitraire. Tailwind ne génère rien pour une classe pareille : elle n'existait pas dans le
 * CSS produit, et ces étiquettes héritaient simplement de la couleur ambiante. Aucun outil
 * ne le signalait — une classe utilitaire absente ne casse pas la compilation.
 *
 * Le voile passe donc au FOND, aux pourcentages du kit (13 / 18 / 13, jamais arrondis), et
 * l'encre prend le jeton plein — sa version `-t` quand la teinte pleine ne porte pas de
 * texte sur fond clair : l'orange fait 2,47:1, le teal 2,84:1, le corail 2,70:1 (AD-20).
 * Tous ces jetons basculent seuls sous `.dk`.
 */
const variants = {
  default: 'bg-[color:var(--fill-tag)] text-ink-2',
  brand: 'bg-[color-mix(in_srgb,var(--mm-bleu)_12%,transparent)] text-[color:var(--mm-bleu)]',
  /* 11 % et non les 13 % du `Tag` : le vert `--ok` #0F7B52 est la plus sombre des encres
     d'état, et son propre voile la rattrape. Mesuré — 13 % : 4,42:1 ✗ · 12 % : 4,47:1 ✗ ·
     11 % : 4,53:1 ✓. Deux points de voile, et l'étiquette repasse la barre. */
  success: 'bg-[color-mix(in_srgb,var(--ok)_11%,transparent)] text-[color:var(--ok)]',
  // Le fond emprunte l'orange de marque, l'encre son alternative texte : deux jetons
  // différents sur une seule pilule, exactement comme le `Tag` du système.
  warning: 'bg-[color-mix(in_srgb,var(--mm-orange)_18%,transparent)] text-[color:var(--warn)]',
  error: 'bg-[color-mix(in_srgb,var(--stop)_13%,transparent)] text-[color:var(--stop)]',
  accent: 'bg-[color-mix(in_srgb,var(--mm-orange)_14%,transparent)] text-[color:var(--mm-orange-t)]',
  // AD-20 : le corail est la quatrième teinte sans version texte livrée par le kit.
  // `--mm-corail-t` #C22A3C tient 5,69:1 sur blanc, et rend la teinte pleine en nuit.
  coral: 'bg-[color-mix(in_srgb,var(--mm-corail)_14%,transparent)] text-[color:var(--mm-corail-t)]',
  plum: 'bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] text-[color:var(--mm-violet)]',
  teal: 'bg-[color-mix(in_srgb,var(--mm-teal)_14%,transparent)] text-[color:var(--mm-teal-t)]',
  // Univers agence. Le teal plein fait 2,84:1 sur blanc : le texte passe par `--mm-teal-t`,
  // qui bascule seul sous `.dk`.
  lagoon: 'bg-[color-mix(in_srgb,var(--mm-teal)_14%,transparent)] text-[color:var(--mm-teal-t)]',
  // Mention de relation (« Client product ») — délibérément sobre, pour ne jamais entrer en
  // concurrence visuelle avec le badge venture. Voir docs/BRAND-ARCHITECTURE.md §6.
  neutralOutline:
    'bg-transparent text-ink-2 ring-1 ring-inset ring-[color:var(--line)]',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizeMap[size], className)}>
      {children}
    </span>
  );
}
