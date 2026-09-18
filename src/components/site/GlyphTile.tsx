import { Icon, type IconName } from '@ds';

/**
 * LA PASTILLE À GLYPHE D'UNE CARTE — carrée, teintée, avec son rayon DÉRIVÉ de sa taille.
 *
 * Le dépôt en portait six écrites à la main, et cinq suivaient sans le dire la même famille :
 * 34/11, 38/12, 44/14, 70/22 — un rayon d'environ 0,32 fois le côté. La sixième, sur
 * `/contact`, faisait 34/10 : hors famille, et arbitraire dans les deux cas puisque ni 10 ni
 * 12 ne sont posés par une règle.
 *
 * Le rayon est donc CALCULÉ ici, et n'est plus une valeur à retaper. C'est ce qui supprime la
 * classe arbitraire au lieu de la déplacer d'un fichier à l'autre — et ce qui garantit qu'une
 * troisième taille, le jour où elle arrive, tombera d'elle-même dans la famille.
 *
 * ⚠️ Le rayon vit en style en ligne, pas en classe Tailwind : `rounded-[11px]` construit à la
 * volée serait purgé du build (une classe Tailwind ne se concatène jamais).
 */

interface GlyphTileProps {
  icon: IconName;
  /** Côté en pixels. 34 dans une rangée de choix, 38 dans une carte de section. @default 34 */
  size?: 34 | 38;
  /** Le jeton de teinte, tel quel — `var(--mm-corail)`, `var(--forme)`… */
  tint: string;
  /** L'encre du glyphe. Le plus souvent la variante texte de la même teinte. */
  ink: string;
  className?: string;
}

export function GlyphTile({ icon, size = 34, tint, ink, className }: GlyphTileProps) {
  return (
    <span
      aria-hidden="true"
      className={['grid flex-none place-items-center', className].filter(Boolean).join(' ')}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.32)}px`,
        background: `color-mix(in srgb, ${tint} 16%, transparent)`,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.47)} color={ink} strokeWidth={2.2} />
    </span>
  );
}
