import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { GlassLevel } from '../types';

/**
 * LES CINQ NIVEAUX DE VERRE — dont UN SEUL porte encore un flou.
 *
 *   panel  .glass       .62   flou 24–26 px   CHROME FIXE UNIQUEMENT
 *   hero   .glass-hero  .58   aucun flou      héros — prix, formulaire principal
 *   flat   .glass-flat  .78   aucun flou      listes, fils, grilles — tout ce qui défile
 *   night  .glass-d     .72   aucun flou      nuit
 *   truth  .truth       .72   aucun flou      l'encart de vérité
 *
 * POURQUOI. `backdrop-filter` sur un conteneur défilant force un recompositing PAR IMAGE de
 * toute la pile derrière lui. Sur le profil d'appareil visé — 2 Go de mémoire, 4 cœurs, qui
 * EST le marché et non le cas limite — c'est le poste le plus coûteux du produit. Et son
 * poids réseau étant nul, il n'apparaît dans aucun audit de poids.
 *
 * Le niveau `panel` ne doit donc être posé QUE sur un élément en `position: fixed|sticky`.
 * `npm run ds:check` le vérifie ; en pratique, seules la barre haute du site et la barre
 * d'onglets basse y ont droit.
 *
 * CE QUI FAIT QU'UN VERRE A L'AIR D'UN VERRE n'est pas le flou : c'est le liseré de lumière
 * de 1 px en haut, la bordure blanche à 55 % et le `saturate(170%)`. Sans la saturation, le
 * flou délave le maillage et tout devient gris. Ne jamais retirer `saturate()` en croyant
 * optimiser.
 */
const CLASS: Record<GlassLevel, string> = {
  panel: 'glass',
  hero: 'glass-hero',
  flat: 'glass-flat',
  night: 'glass-d',
  truth: 'truth',
};

export interface GlassPanelProps {
  level?: GlassLevel;
  padding?: number | string;
  children?: ReactNode;
  /** `section`, `aside`, `nav`… — une surface n'est pas toujours une <div>. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function GlassPanel({
  level = 'panel', padding, children, as: Tag = 'div', className = '', style, ...rest
}: GlassPanelProps) {
  return (
    <Tag
      className={[CLASS[level], className].filter(Boolean).join(' ')}
      style={{ padding: typeof padding === 'number' ? `${padding}px` : padding, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
