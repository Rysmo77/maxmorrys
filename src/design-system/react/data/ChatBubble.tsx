import type { CSSProperties, ReactNode } from 'react';

/**
 * LE CAS D'ÉCOLE DE LA RÈGLE 1, ET LA RAISON POUR LAQUELLE ELLE EXISTE.
 *
 * Le kit posait `blur(14px)` sur cette bulle. Prise seule, elle est jolie et ne coûte rien.
 * Mais une bulle est RÉPÉTÉE — dix, vingt par conversation — ET elle vit dans un fil qui
 * DÉFILE : elle violait à elle seule les deux volets de la règle. Sur la page du Club, huit
 * composants comme celui-ci additionnaient 21 surfaces floutées, dont 5 défilantes. Le flou
 * est parti, il ne revient pas, et les voiles ont été relevés pour compenser : `--bubble-bg`
 * porte désormais ce que le flou adoucissait.
 *
 * La leçon, écrite ici parce que c'est ici qu'elle a été apprise : un flou n'est jamais
 * coûteux à l'endroit où on l'écrit. Il le devient à l'endroit où le composant est répété —
 * et l'auteur du composant ne voit pas cet endroit.
 *
 * LES TROIS POINTS SONT UN ÉVÉNEMENT, PAS UN DÉCOR. `blink` ne porte que `opacity` et
 * `translateY` (AD-16), et sous `prefers-reduced-motion` toutes les durées tombent à 1 ms
 * globalement — le composant n'a rien à savoir de ce réglage.
 */
export interface ChatBubbleProps {
  /** @default "ai" */
  from?: 'me' | 'ai';
  typing?: boolean;
  /**
   * Ce qu'un lecteur d'écran annonce pendant l'attente. Sans défaut, DÉLIBÉRÉMENT : le nom du
   * répétiteur se lit sur le profil de la personne, il n'est jamais une constante de
   * composant — c'est ce qui permet de le renommer sans toucher au code.
   */
  typingLabel?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

const BASE: CSSProperties = { maxWidth: '82%', padding: '13px 16px', borderRadius: '20px', fontSize: '14px', lineHeight: 1.45 };

export function ChatBubble({ from = 'ai', typing, typingLabel, children, style }: ChatBubbleProps) {
  if (typing) {
    return (
      // `role="status"` et non `alert` : l'attente est une information, pas une urgence, et
      // elle ne doit pas interrompre ce que la personne est en train de lire.
      <div
        role="status"
        style={{ ...BASE, background: 'var(--bubble-bg)', border: '1px solid var(--bubble-brd)', borderBottomLeftRadius: '7px', width: '64px', padding: '14px 16px', ...style }}
      >
        {typingLabel && <span className="sr-only">{typingLabel}</span>}
        <span aria-hidden="true" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          {[0, 0.18, 0.36].map((d) => (
            <i key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mm-violet)', opacity: 0.35, animation: 'blink 1.25s infinite', animationDelay: `${d}s` }} />
          ))}
        </span>
      </div>
    );
  }

  const me = from === 'me';
  return (
    <div
      style={{
        ...BASE,
        ...(me
          ? {
              // `--action-transforme` est déclaré hors de la portée `.dk` : le dégradé reste
              // profond dans les deux modes, donc l'encre inversée tient. L'ombre violette
              // garde les valeurs du kit — .28 et non le .34 de `--sh-violet`, qui est
              // l'ombre d'un bouton, pas celle d'une bulle.
              marginLeft: 'auto', background: 'var(--action-transforme)', color: 'var(--text-invert)',
              borderBottomRightRadius: '7px', boxShadow: '0 6px 18px rgba(108,35,221,.28)',
            }
          : { background: 'var(--bubble-bg)', border: '1px solid var(--bubble-brd)', borderBottomLeftRadius: '7px' }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
