/**
 * Les deux practices commerciales de MY ONOMA.
 *
 * BUILD et GROW sont des piliers stratégiques ; Max-Morrys Agency et Cléa Growth Office
 * sont les marques qui les portent commercialement. La distinction compte : le pilier ne
 * change pas, la marque qui le porte peut évoluer. Aucun composant ne doit coder en dur
 * un nom de marque.
 *
 * ⚠️ Cléa Growth Office est une practice SŒUR, jamais une sous-traitante de Max-Morrys :
 *
 *     MY ONOMA
 *     ├── Max-Morrys Agency   (BUILD)
 *     └── Cléa Growth Office  (GROW)
 *
 * Miroir de `My-onoma/apps/web/src/lib/brand/practices.ts`.
 * Voir `docs/AGENCY-POSITIONING.md`.
 */

export type PracticeId = 'build' | 'grow';

export interface PracticeCapability {
  /** Clé i18n, sous `capabilities.<key>` du namespace de la page. */
  key: string;
}

export interface Practice {
  id: PracticeId;
  /** Le pilier stratégique — invariant, non traduit. */
  pillar: 'BUILD' | 'GROW';
  /** La marque qui porte le pilier commercialement. */
  brand: string;
  /**
   * Positionnement en une ligne, en anglais dans les deux langues : c'est une signature
   * de marque, pas de la copie traduisible.
   */
  discipline: string;
  /** Page dédiée sur cette plateforme, si la practice en a une ici. */
  path: string | null;
  /** Page dédiée sur le site corporate, relative à `corporateUrl`. */
  corporatePath: string;
  capabilities: readonly PracticeCapability[];
}

export const practices: Record<PracticeId, Practice> = {
  build: {
    id: 'build',
    pillar: 'BUILD',
    brand: 'Max-Morrys Agency',
    discipline: 'Digital Product · AI · Technology · Brand',
    path: '/agence',
    corporatePath: '/services/max-morrys-agency',
    capabilities: [
      { key: 'product' },
      { key: 'ai' },
      { key: 'technology' },
      { key: 'brand' },
    ],
  },
  grow: {
    id: 'grow',
    pillar: 'GROW',
    brand: 'Cléa Growth Office',
    discipline: 'Growth · Revenue · AdTech · Operations',
    /** Cléa n'a pas de page sur maxmorrys.me : le renvoi se fait vers le site corporate. */
    path: null,
    corporatePath: '/services/clea-growth-office',
    capabilities: [
      { key: 'growthStrategy' },
      { key: 'revenueOperations' },
      { key: 'performanceMedia' },
      { key: 'fractionalGrowth' },
    ],
  },
};

export const practiceList = [practices.build, practices.grow] as const;

/**
 * Marqueur porté par un prospect dont le besoin relève de GROW.
 *
 * Le lead n'est jamais rejeté : il est enregistré normalement, tagué, et le prospect se voit
 * proposer Cléa Growth Office. Aucune automatisation de transfert n'existe — l'infrastructure
 * inter-entités n'est pas en place.
 */
export const GROWTH_ROUTING_TAG = 'MY_ONOMA_GROW';

/**
 * Les trois piliers du studio, dans l'ordre canonique.
 * Rendu tel quel sur la page À propos — non traduit, c'est l'architecture de marque.
 */
export const pillars = ['BUILD', 'GROW', 'OWN'] as const;
