import type { CSSProperties, ReactNode } from 'react';
import { forwardRef } from 'react';

export interface IconButtonProps {
  children: ReactNode;
  /** OBLIGATOIRE : une cible sans texte n'est rien pour un lecteur d'écran. */
  label: string;
  /** La pastille orange. Elle ne porte aucun nombre — un compteur non sourcé ne s'affiche pas. */
  badge?: boolean;
  /** Ce que la pastille signale, pour qui ne la voit pas. */
  badgeLabel?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Le chrome rond du kit — 42 px de DESSIN, 44 px de CIBLE.
 *
 * Le kit dessine à 42 (`--touch-min`) là où le plancher exigé est 44 (`--touch-aa`). Le
 * handoff déclare l'écart « assumé dans les maquettes, à ne pas reproduire en production ».
 * On ne grossit donc pas le bouton pour satisfaire la règle : `.mm-touch-extend` étend ce
 * qui se touche, et le dessin reste celui du kit.
 *
 * Le fond lit `--chrome-bg`, qui s'effondre sous `.dk`. C'est le défaut nommé par le système :
 * un disque de chrome à 60 % de blanc sous un glyphe #ECF0F5 donne 1,4:1, dans douze écrans
 * à la fois. Aucune prop de thème n'existe ici, et c'est délibéré.
 */
export const IconButton = forwardRef<HTMLButtonElement & HTMLAnchorElement, IconButtonProps>(
  function IconButton({ children, label, badge, badgeLabel, href, onClick, disabled, className = '', style }, ref) {
    const css: CSSProperties = {
      position: 'relative', width: 'var(--touch-min)', height: 'var(--touch-min)', borderRadius: '50%',
      display: 'grid', placeItems: 'center', cursor: disabled ? 'default' : 'pointer',
      color: 'var(--text-body)', background: 'var(--chrome-bg)',
      border: '1px solid var(--chrome-brd)',
      boxShadow: 'var(--chrome-hl),0 4px 14px rgba(14,17,22,.09)',
      textDecoration: 'none', flex: '0 0 auto',
      ...style,
    };
    const cls = ['mm-press-sm', 'mm-touch-extend', className].filter(Boolean).join(' ');
    const inner = (
      <>
        {children}
        {badge && (
          <b
            aria-hidden="true"
            style={{
              position: 'absolute', top: '8px', right: '9px', width: '9px', height: '9px',
              borderRadius: '50%', background: 'var(--mm-orange)',
              border: '1.5px solid var(--surface-page)',
            }}
          />
        )}
        {badge && badgeLabel && <span className="sr-only">{badgeLabel}</span>}
      </>
    );

    if (href && !disabled) {
      return <a ref={ref} href={href} aria-label={label} className={cls} style={css}>{inner}</a>;
    }
    return (
      <button ref={ref} type="button" aria-label={label} className={cls} style={css}
        onClick={disabled ? undefined : onClick} disabled={disabled} aria-disabled={disabled || undefined}>
        {inner}
      </button>
    );
  },
);
