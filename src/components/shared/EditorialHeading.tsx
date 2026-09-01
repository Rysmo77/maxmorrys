import { useId } from 'react';

/** Couleur de mise en valeur d'un segment de titre. */
export type EditorialColor = 'brand' | 'accent' | 'coral' | 'plum' | 'morrys' | 'lagoon';

export interface EditorialSegment {
  /** Texte du segment (inclure les espaces autour si besoin). */
  text: string;
  /** Couleur d'accent ; absent = couleur de texte neutre. */
  color?: EditorialColor;
}

const COLOR_CLASS: Record<EditorialColor, string> = {
  brand: 'text-forme',
  accent: 'text-informe-txt',
  coral: 'text-corail-txt',
  plum: 'text-transforme',
  morrys: 'text-transforme',
  // ⚠️ `--mm-teal` sur blanc ne fait que 2,84:1 — interdit pour du texte. `text-digitalise-txt`
  // lit `--mm-teal-t`, foncé en clair, qui repasse sur la variante nuit sous `.dk`, sans
  // aucune classe `dark:`. Voir sectionThemes.ts et AD-20.
  lagoon: 'text-digitalise-txt',
};

interface CircularBadgeProps {
  /** Texte qui tourne autour du cercle. */
  text: string;
  /** Contenu central (initiales, icône…). */
  center?: React.ReactNode;
  className?: string;
}

/** Badge circulaire à texte rotatif — clin d'œil éditorial « Ravi de te rencontrer ». */
export function CircularBadge({ text, center, className = '' }: CircularBadgeProps) {
  const id = useId().replace(/:/g, '');
  const ring = ` ${text} · `.repeat(3);
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-[spin_22s_linear_infinite] text-ink-2"
        aria-hidden="true"
      >
        <defs>
          <path id={`circ-${id}`} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[8.5px] font-bold uppercase" style={{ letterSpacing: '0.18em' }}>
          <textPath href={`#circ-${id}`}>{ring}</textPath>
        </text>
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg text-ink-2">{center}</span>
        </div>
      )}
    </div>
  );
}

interface EditorialHeadingProps {
  /** Segments composant le titre, dont certains colorés. */
  segments: EditorialSegment[];
  /** Petit label en capitales au-dessus du titre. */
  eyebrow?: string;
  /** Couleur de l'eyebrow. */
  eyebrowColor?: EditorialColor;
  /** Balise rendue (h1 pour le hero, h2 ailleurs). */
  as?: 'h1' | 'h2';
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Gros titre de section éditorial avec mots colorés à la façon Jenna Kutcher.
 * Garde les couleurs de marque via `EditorialColor` (brand / accent / coral /
 * plum / morrys).
 */
export default function EditorialHeading({
  segments,
  eyebrow,
  eyebrowColor = 'brand',
  as = 'h2',
  align = 'left',
  className = '',
}: EditorialHeadingProps) {
  const Tag = as;
  return (
    <div className={`${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <p className={`text-xs font-bold tracking-[0.35em] uppercase mb-5 ${COLOR_CLASS[eyebrowColor]}`}>
          {eyebrow}
        </p>
      )}
      <Tag className="text-5xl wide:text-6xl font-black tracking-tight text-balance text-ink">
        {segments.map((seg, i) => (
          <span key={i} className={seg.color ? COLOR_CLASS[seg.color] : undefined}>
            {seg.text}
          </span>
        ))}
      </Tag>
    </div>
  );
}
