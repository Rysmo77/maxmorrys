import type { CSSProperties, ReactNode } from 'react';
import FormationArt from './FormationArt';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA COUVERTURE « LIVRE » D'UNE FORMATION — `CourseCover` du kit v3 (`mm-cover`).
 *
 * Une teinte par formation, STABLE partout : catalogue, fiche, tableau de bord, reprise.
 * Elle se dérive de la catégorie quand celle-ci est connue, sinon du slug — jamais d'un
 * index de grille, qui changerait la couleur d'une formation au premier filtre.
 *
 * AD-24 tient toujours : si la formation a une `coverImage`, la photo entre sous un voile
 * et la typographie reste par-dessus. Sans image, la couverture est typographique.
 *
 * Titre court en capitales (deux mots) + le reste du titre en italique : c'est la recette
 * de la fiche du kit. Les deux morceaux sortent du titre réel — aucun texte inventé.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/* Les six teintes du kit, écrites littéralement pour le purge. */
const TINTS = ['mm-tint-seo', 'mm-tint-ads', 'mm-tint-ia', 'mm-tint-mq', 'mm-tint-wa', 'mm-tint-me'] as const;
type Tint = (typeof TINTS)[number];

const BY_CATEGORY: Array<[RegExp, Tint]> = [
  [/seo|référencement|referencement|search/i, 'mm-tint-seo'],
  [/ads|publicit|meta|facebook|campagne/i, 'mm-tint-ads'],
  [/\bia\b|ai\b|intelligence|gpt|automat/i, 'mm-tint-ia'],
  [/marque|brand|personal|contenu|content/i, 'mm-tint-mq'],
  [/whatsapp|vente|commerce|sales|social/i, 'mm-tint-wa'],
  [/mesure|analytics|data|ga4|chiffre/i, 'mm-tint-me'],
];

function courseTint(key: { category?: string; slug?: string; id?: string }): Tint {
  const cat = key.category ?? '';
  for (const [re, tint] of BY_CATEGORY) if (re.test(cat)) return tint;
  const seed = key.slug || key.id || cat;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Coupe un titre réel en « deux mots en capitales » + « le reste en italique ». */
function splitCourseTitle(title: string): { t: string; s: string } {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return { t: title.trim(), s: '' };
  return { t: words.slice(0, 2).join(' '), s: words.slice(2).join(' ') };
}

interface CourseCoverProps {
  title: string;
  category?: string;
  slug?: string;
  id?: string;
  coverImage?: string;
  /** Ligne mono du haut (« Edu · SEO »). */
  kicker?: string;
  /** Pastille du coin (« 3 leçons libres », « Bientôt »). Faits réels seulement. */
  tag?: ReactNode;
  /** Taille du titre : la fiche agrandit, les vignettes réduisent. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  /** Nom de View Transition (carte → fiche). */
  transitionName?: string;
}

const TITLE_SIZE = { sm: '26px', md: '36px', lg: '54px' } as const;

export default function CourseCover({
  title, category, slug, id, coverImage, kicker, tag, size = 'md', className, style, transitionName,
}: CourseCoverProps) {
  const tint = courseTint({ category, slug, id });
  const { t, s } = splitCourseTitle(title);
  return (
    <div
      className={['mm-cover', tint, className].filter(Boolean).join(' ')}
      style={{ minHeight: size === 'lg' ? '300px' : size === 'sm' ? '150px' : '210px', ...(transitionName ? { ['viewTransitionName' as string]: transitionName } : null), ...style }}
      aria-hidden="true"
    >
      {coverImage ? (
        <FormationArt
          src={coverImage}
          radius="0"
          veil
          style={{ position: 'absolute', inset: 0, zIndex: -1 }}
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        {kicker ? <span className="k">{kicker}</span> : <span />}
        {tag ? <span className="mm-tag">{tag}</span> : null}
      </div>
      <div>
        <div className="t" style={{ fontSize: TITLE_SIZE[size] }}>{t}</div>
        {s ? <div className="s mt-[6px]">{s}</div> : null}
      </div>
    </div>
  );
}
