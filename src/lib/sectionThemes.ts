/**
 * Tokens de couleurs partagés — couleur phare de chaque univers de la plateforme.
 *
 * Chaque page principale possède une couleur dominante identitaire. Ces tokens
 * relient un univers à ses classes Tailwind, afin de refléter cet univers sur
 * les sections correspondantes (page d'accueil et pages de destination).
 *
 * IMPORTANT : les classes sont des chaînes statiques complètes — Tailwind ne
 * détecte pas les noms de classes construits dynamiquement (purge du build).
 * Toute teinte utilisée ici doit apparaître littéralement dans ce fichier.
 *
 * | Univers     | Couleur phare | Palette  |
 * |-------------|---------------|----------|
 * | formations  | Bleu          | brand    |
 * | blog        | Corail        | coral    |
 * | podcasts    | Violet        | plum     |
 * | videos      | Rouge         | red      |
 * | about       | Violet        | morrys   |
 * | club        | Violet        | plum     |
 */

import { toCanonicalPath } from '../i18n/routing';

export type Universe = 'formations' | 'blog' | 'podcasts' | 'videos' | 'about' | 'club';

export interface UniverseTheme {
  /** nom de la palette Tailwind de base */
  palette: string;
  /** texte eyebrow (uppercase tracking) — light + dark */
  eyebrow: string;
  /** texte d'accent : icônes, liens, chiffres — light + dark */
  accentText: string;
  /** fond clair de section — le dark reste neutre */
  sectionBg: string;
  /** fond + texte de chip / tag / badge doux — light + dark */
  softBadge: string;
  /** bouton plein : bg + hover + active + text-white */
  buttonSolid: string;
  /** survol de titre de carte (à utiliser avec un parent `group`) */
  titleHover: string;
  /** survol de bordure : cercles, cards (à utiliser avec un parent `group`) */
  borderHover: string;
  /** anneau de focus d'un champ de saisie */
  focusRing: string;
  /** couleur d'un loader / spinner */
  spinner: string;
}

export const universeThemes: Record<Universe, UniverseTheme> = {
  formations: {
    palette: 'brand',
    eyebrow: 'text-brand-600 dark:text-brand-400',
    accentText: 'text-brand-600 dark:text-brand-400',
    sectionBg: 'bg-white dark:bg-neutral-950',
    softBadge: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300',
    buttonSolid: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white',
    titleHover: 'group-hover:text-brand-600 dark:group-hover:text-brand-400',
    borderHover: 'group-hover:border-brand-500 dark:group-hover:border-brand-400',
    focusRing: 'focus:ring-brand-500/20 focus:border-brand-500',
    spinner: 'text-brand-500',
  },
  blog: {
    palette: 'coral',
    eyebrow: 'text-coral-600 dark:text-coral-400',
    accentText: 'text-coral-600 dark:text-coral-400',
    sectionBg: 'bg-coral-50 dark:bg-neutral-900',
    softBadge: 'bg-coral-50 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300',
    buttonSolid: 'bg-coral-600 hover:bg-coral-700 active:bg-coral-800 text-white',
    titleHover: 'group-hover:text-coral-600 dark:group-hover:text-coral-400',
    borderHover: 'group-hover:border-coral-500 dark:group-hover:border-coral-400',
    focusRing: 'focus:ring-coral-500/20 focus:border-coral-500',
    spinner: 'text-coral-500',
  },
  podcasts: {
    palette: 'plum',
    eyebrow: 'text-plum-600 dark:text-plum-400',
    accentText: 'text-plum-600 dark:text-plum-400',
    sectionBg: 'bg-plum-50 dark:bg-neutral-900',
    softBadge: 'bg-plum-50 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300',
    buttonSolid: 'bg-plum-600 hover:bg-plum-700 active:bg-plum-800 text-white',
    titleHover: 'group-hover:text-plum-600 dark:group-hover:text-plum-400',
    borderHover: 'group-hover:border-plum-500 dark:group-hover:border-plum-400',
    focusRing: 'focus:ring-plum-500/20 focus:border-plum-500',
    spinner: 'text-plum-500',
  },
  videos: {
    palette: 'red',
    eyebrow: 'text-red-600 dark:text-red-400',
    accentText: 'text-red-600 dark:text-red-400',
    sectionBg: 'bg-red-50 dark:bg-neutral-900',
    softBadge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    buttonSolid: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    titleHover: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    borderHover: 'group-hover:border-red-500 dark:group-hover:border-red-400',
    focusRing: 'focus:ring-red-500/20 focus:border-red-500',
    spinner: 'text-red-500',
  },
  about: {
    palette: 'morrys',
    eyebrow: 'text-morrys-600 dark:text-morrys-400',
    accentText: 'text-morrys-600 dark:text-morrys-400',
    sectionBg: 'bg-neutral-50 dark:bg-neutral-900',
    softBadge: 'bg-morrys-50 dark:bg-morrys-900/30 text-morrys-700 dark:text-morrys-300',
    buttonSolid: 'bg-morrys-600 hover:bg-morrys-700 active:bg-morrys-800 text-white',
    titleHover: 'group-hover:text-morrys-600 dark:group-hover:text-morrys-400',
    borderHover: 'group-hover:border-morrys-500 dark:group-hover:border-morrys-400',
    focusRing: 'focus:ring-morrys-500/20 focus:border-morrys-500',
    spinner: 'text-morrys-500',
  },
  club: {
    palette: 'plum',
    eyebrow: 'text-plum-600 dark:text-plum-400',
    accentText: 'text-plum-600 dark:text-plum-400',
    sectionBg: 'bg-plum-50 dark:bg-neutral-900',
    softBadge: 'bg-plum-50 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300',
    buttonSolid: 'bg-plum-600 hover:bg-plum-700 active:bg-plum-800 text-white',
    titleHover: 'group-hover:text-plum-600 dark:group-hover:text-plum-400',
    borderHover: 'group-hover:border-plum-500 dark:group-hover:border-plum-400',
    focusRing: 'focus:ring-plum-500/20 focus:border-plum-500',
    spinner: 'text-plum-500',
  },
};

/** Déduit l'univers d'une route. Défaut : `formations` (couleur primaire). */
export function universeFromPath(rawPath: string): Universe {
  // Canonicalise (retire /en + remappe les segments EN) pour matcher les chemins FR.
  const path = toCanonicalPath(rawPath);
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/podcasts')) return 'podcasts';
  if (path.startsWith('/videos')) return 'videos';
  if (path.startsWith('/club')) return 'club';
  if (path.startsWith('/a-propos')) return 'about';
  return 'formations';
}
