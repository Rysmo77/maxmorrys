import type { CSSProperties, ReactNode } from 'react';
import { coverTint, fitTitle, splitTitle } from './coverTint';

/**
 * LA COUVERTURE « LIVRE » D'UNE FORMATION — kit v3 `CourseCover`, au gabarit des maquettes
 * Edu (Catalogue, Fiche, Paiement, Connexion).
 *
 * La maquette ne pose AUCUNE photo : la couverture est une teinte du kit (`mm-tint-*`), un
 * sourcil mono, le titre en capitales et sa fin en italique. La teinte se déduit de la
 * catégorie RÉELLE de la formation, sinon d'un hachage stable du slug — jamais d'un rang
 * (la même formation garde sa couleur d'une page à l'autre).
 *
 * L'étiquette (`tag`) est en haut à gauche, comme dans la maquette, et ne porte que des faits
 * dérivés de la base (« 3 leçons libres » compté, « Bientôt »).
 */
interface EduCoverProps {
  title: string;
  category?: string;
  slug?: string;
  id?: string;
  kicker?: string;
  tag?: ReactNode;
  /** Taille du titre en px (42 carte, 40 récapitulatif, 26 vignette flottante). */
  titleSize?: number;
  subSize?: number;
  /** Largeur utile du titre, pour l'ajustement (px). */
  titleWidth?: number;
  className?: string;
  style?: CSSProperties;
}

export default function EduCover({
  title, category, slug, id, kicker, tag, titleSize = 42, subSize, titleWidth, className, style,
}: EduCoverProps) {
  const { t, s } = splitTitle(title);
  const size = fitTitle(t, titleSize, titleWidth);
  return (
    <div
      className={['mm-cover', coverTint({ category, slug, id, title }), className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    >
      {tag
        ? <span className="mm-tag self-start text-[color:var(--paper-fixed)]" style={{ background: 'color-mix(in srgb, var(--paper-fixed) 18%, transparent)' }}>{tag}</span>
        : <span />}
      <div>
        {kicker ? <span className="k" style={titleSize < 30 ? { fontSize: '8px' } : undefined}>{kicker}</span> : null}
        <div className="t" style={{ fontSize: `${size}px`, marginTop: titleSize < 30 ? 0 : '8px' }}>{t}</div>
        {s ? <div className="s" style={subSize ? { fontSize: `${subSize}px` } : undefined}>{s}</div> : null}
      </div>
    </div>
  );
}
