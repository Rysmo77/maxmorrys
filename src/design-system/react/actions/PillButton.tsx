import type { CSSProperties, ReactNode } from 'react';
import { forwardRef } from 'react';

export interface PillButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Marque la pilule comme l'entrée courante — utile quand elle sert de navigation. */
  current?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/**
 * La pilule d'encre — « MENU » dans le chrome, la navigation entre écrans de la console.
 *
 * C'est le seul libellé du système qui reste en capitales dans un bouton ; partout ailleurs
 * les boutons sont en casse de phrase.
 */
export const PillButton = forwardRef<HTMLButtonElement & HTMLAnchorElement, PillButtonProps>(
  function PillButton({ children, href, onClick, disabled, current, className = '', style, ...rest }, ref) {
    const css: CSSProperties = {
      background: 'var(--pill-bg)', color: 'var(--text-invert)',
      border: 0, cursor: disabled ? 'default' : 'pointer', borderRadius: 'var(--r-pill)',
      padding: '0 17px', textDecoration: 'none',
      fontFamily: 'var(--f-body)', fontSize: '12px', fontWeight: 700,
      letterSpacing: '.08em', textTransform: 'uppercase',
      minHeight: 'var(--touch-min)', display: 'inline-flex', alignItems: 'center',
      ...style,
    };
    const cls = ['mm-press-sm', 'mm-touch-extend', className].filter(Boolean).join(' ');

    if (href && !disabled) {
      return (
        <a ref={ref} href={href} className={cls} style={css} aria-current={current ? 'page' : undefined} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <button ref={ref} type="button" className={cls} style={css} onClick={disabled ? undefined : onClick}
        disabled={disabled} aria-disabled={disabled || undefined} aria-pressed={current} {...rest}>
        {children}
      </button>
    );
  },
);
