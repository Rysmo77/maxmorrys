import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'accent' | 'coral' | 'plum' | 'teal' | 'lagoon' | 'neutralOutline';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  coral: 'bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300',
  plum: 'bg-plum-100 text-plum-700 dark:bg-plum-900/40 dark:text-plum-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  // Univers agence. Texte en `-700` sur fond clair : `lagoon-500` ne passerait pas le contraste.
  lagoon: 'bg-lagoon-100 text-lagoon-700 dark:bg-lagoon-900/40 dark:text-lagoon-300',
  // Mention de relation (« Client product ») — délibérément sobre, pour ne jamais entrer en
  // concurrence visuelle avec le badge venture. Voir docs/BRAND-ARCHITECTURE.md §6.
  neutralOutline:
    'bg-transparent text-neutral-600 dark:text-neutral-400 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700',
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
