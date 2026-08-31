import type { CSSProperties, ReactNode } from 'react';

/**
 * UN ÉCRAN VIDE EST UNE INVITATION À AGIR, pas une excuse.
 *
 * « Aucune formation n'est encore en ligne. » puis l'action. Jamais « oups », jamais
 * d'excuse, jamais un rond qui tourne à la place d'une explication.
 *
 * Ce composant porte une part du positionnement du produit : au relevé du 30 août 2026, le
 * catalogue ne contient aucune formation publiée et zéro certificat a été émis. Les états
 * vides disent la vérité plutôt que de la maquiller — c'est ce qui rend l'encart de vérité
 * crédible ailleurs.
 */
export interface EmptyStateProps {
  glyph?: ReactNode;
  glyphBackground?: string;
  title?: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}

export function EmptyState({ glyph, glyphBackground = 'var(--fill-1)', title, body, action, style }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '34px 20px', ...style }}>
      {glyph !== undefined && (
        <span aria-hidden="true" style={{ width: '64px', height: '64px', borderRadius: '22px', display: 'grid', placeItems: 'center', marginBottom: '16px', background: glyphBackground }}>
          {glyph}
        </span>
      )}
      {title && (
        <p style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: '22px', letterSpacing: '-.03em', lineHeight: 1.1, margin: 0 }}>
          {title}
        </p>
      )}
      {/* --text-muted, jamais --text-faint : l'encre tertiaire ne porte pas de texte (AD-18). */}
      {body && (
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '9px', maxWidth: '34ch' }}>
          {body}
        </p>
      )}
      {action && <div style={{ marginTop: '18px', width: '100%' }}>{action}</div>}
    </div>
  );
}
