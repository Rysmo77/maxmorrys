import type { CSSProperties, ReactNode } from 'react';
import { forwardRef } from 'react';

/**
 * Cinq tons, un par territoire, deux tons neutres, et un ton destructif (AD-24).
 *
 * AUCUN FLOU. Un bouton est petit : le flou n'y apporte presque rien, mais il coûte une
 * couche de composition PAR bouton. Trois boutons « fantôme » suffisaient à dépasser le
 * budget de deux surfaces sans qu'aucune carte ne soit en cause — c'est le cas d'école de
 * la règle 1 : un flou n'est jamais coûteux là où on l'écrit, il le devient là où le
 * composant est répété, et l'auteur du composant ne voit pas cet endroit.
 * Le voile du ton fantôme a été relevé de .6 à .74 pour compenser.
 */
const TONE: Record<string, CSSProperties> = {
  primary: { background: 'var(--action-primary)', color: 'var(--text-on-primary)', boxShadow: 'var(--sh-ink)' },
  forme: { background: 'var(--action-forme)', color: 'var(--paper-fixed)', boxShadow: 'var(--sh-bleu)' },
  // L'orange reste clair dans les deux modes : son encre est `--ink-fixed`, jamais `--ink`,
  // qui deviendrait blanc sous `.dk` et donnerait du blanc sur orange clair.
  informe: { background: 'var(--action-informe)', color: 'var(--ink-fixed)', boxShadow: '0 8px 24px rgba(243,139,10,.32)' },
  transforme: { background: 'var(--action-transforme)', color: 'var(--paper-fixed)', boxShadow: 'var(--sh-violet)' },
  digitalise: { background: 'var(--action-digitalise)', color: 'var(--paper-fixed)', boxShadow: 'var(--sh-teal)' },
  ghost: { background: 'var(--btn-ghost-bg)', color: 'var(--ink)', border: 'var(--btn-ghost-brd)' },
  quiet: { background: 'var(--surface-quiet)', border: 'var(--btn-quiet-brd)', color: 'var(--ink)' },
  /* Le ton destructif. `--action-stop` et son encre viennent de `overrides/ad-24` :
     le kit déclare cinq fonds d'action et aucun ne dit « ce bouton supprime ».
     ⚠️ Ne PAS écrire `background: var(--stop)` — c'est une teinte de TEXTE, qui passe
     au rouge clair sous `.dk` et donnerait du blanc à 2,28:1. */
  stop: { background: 'var(--action-stop)', color: 'var(--on-action-stop)', boxShadow: 'var(--sh-ink)' },
  disabled: { background: 'var(--btn-off-bg)', color: 'var(--ink-3)' },
};

export type ButtonTone = 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet' | 'stop';

export interface ButtonProps {
  tone?: ButtonTone;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  children: ReactNode;
  /** Rend un <a href> au lieu d'un <button>. Une action qui NAVIGUE est un lien : elle doit
   *  s'ouvrir dans un onglet, se copier, s'annoncer comme un lien. */
  href?: string;
  /**
   * Cible du lien. Le contrat de `href` dit qu'une action qui navigue « doit s'ouvrir dans
   * un onglet » — encore faut-il pouvoir le demander. `_blank` sans `rel` laisse la page
   * ouverte accéder à `window.opener` : les deux vont donc ensemble, et `rel` est forcé
   * quand la cible est un nouvel onglet, même si l'appelant l'oublie.
   */
  target?: '_blank' | '_self';
  rel?: string;
  /** `type` explicite : dans un formulaire, un <button> sans type SOUMET. */
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  /** Le libellé RESTE pendant le chargement — un bouton dont le texte disparaît fait douter
   *  de ce qu'on vient de déclencher. Un liseré le balaie. Jamais de rond qui tourne. */
  loading?: boolean;
  /** Sur une surface colorée, l'anneau de focus bleu se noie dans le fond : il passe en blanc. */
  focusInvert?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(function Button(
  { tone = 'primary', size = 'md', fullWidth, children, href, target, rel, type = 'button', onClick,
    disabled, loading, focusInvert, className = '', style, ...rest },
  ref,
) {
  const off = disabled || loading;
  const t = TONE[off ? 'disabled' : tone] ?? TONE.primary;
  const sm = size === 'sm';

  // 42 px de DESSIN, 44 px de CIBLE — même arbitrage que `IconButton`.
  //
  // La taille `sm` reprend le 42 px du kit, que la consigne de fidélité interdit d'arrondir.
  // Mais 42 est sous le plancher `--touch-aa`, et le handoff dit l'écart « assumé dans les
  // maquettes, à ne pas reproduire en production ». `.mm-touch-extend` étend ce qui se touche
  // sans toucher au dessin : le bouton reste à 42, la cible fait 44.
  //
  // Seule `sm` la porte. En `md`, `--touch-btn` vaut 54 : la classe n'aurait rien à étendre,
  // et son `::before` centré à 44 px serait un mensonge de plus dans le DOM.
  const cls = ['mm-press', sm && 'mm-touch-extend', loading && 'mm-loading', focusInvert && 'mm-on-color', className]
    .filter(Boolean).join(' ');

  const css: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    border: 0, cursor: off ? 'default' : 'pointer',
    minHeight: sm ? '42px' : 'var(--touch-btn)',
    padding: sm ? '0 17px' : '0 22px',
    borderRadius: 'var(--r-pill)',
    fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: sm ? '13.5px' : '15px',
    textDecoration: 'none',
    width: fullWidth === undefined ? (sm ? 'auto' : '100%') : fullWidth ? '100%' : 'auto',
    ...t, ...style,
  };

  // Un élément natif, toujours. Le kit rendait des <span> sans tabindex ni rôle : rien
  // n'était atteignable au clavier ni annoncé par un lecteur d'écran.
  if (href && !off) {
    const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;
    return <a ref={ref} href={href} target={target} rel={safeRel} className={cls} style={css} {...rest}>{children}</a>;
  }
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      style={css}
      onClick={off ? undefined : onClick}
      disabled={disabled}
      aria-disabled={off || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
});
