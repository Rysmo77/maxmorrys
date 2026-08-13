import { GROWTH_ROUTING_TAG } from '../brand';
import type { EngagementBudget, EngagementProjectType, EngagementTimeline } from '../../types';

/**
 * Configuration du formulaire de qualification de Max-Morrys Agency — SOURCE UNIQUE.
 *
 * Ce module ne porte que des clés et des règles, jamais de texte affichable : les libellés
 * vivent dans les fichiers i18n `agency.json`, sous `form.projectTypes`, `form.budgets`
 * et `form.timelines`.
 *
 * ⚠️ Ce formulaire sert à FILTRER les leads, pas à en maximiser le volume. L'offre est
 * high-ticket : aucune grille tarifaire n'est publiée, seule une fourchette est demandée.
 * Voir `docs/AGENCY-POSITIONING.md §7`.
 *
 * ⚠️ Ne pas confondre avec `src/lib/presence/offer.ts`, qui porte la grille publique de
 * l'offre « Digital Commerce Local » sur `/presence-digitale`.
 */

/** Types de projet proposés, dans l'ordre d'affichage. Clés i18n `form.projectTypes.<key>`. */
export const PROJECT_TYPES: readonly EngagementProjectType[] = [
  'product',
  'platform',
  'application',
  'ai',
  'internalTool',
  'transformation',
  'brand',
  'growth',
  'other',
];

/**
 * Types de projet qui relèvent de Cléa Growth Office (pilier GROW), pas de Max-Morrys Agency.
 *
 * Le lead n'est JAMAIS rejeté : il est enregistré normalement et tagué `MY_ONOMA_GROW`,
 * et le prospect se voit proposer la practice qui porte réellement le sujet.
 */
const GROWTH_PROJECT_TYPES: ReadonlySet<EngagementProjectType> = new Set(['growth']);

/**
 * Mots-clés growth recherchés dans la description libre.
 *
 * Un prospect décrit rarement son besoin avec le bon vocabulaire : il choisit
 * « Autre » puis écrit « on veut structurer notre acquisition ». Sans ce filet, la demande
 * partirait sur la mauvaise practice.
 *
 * Volontairement conservateur — seuls des termes sans ambiguïté figurent ici. « CRM » et
 * « pipeline » en sont absents : intégrer un CRM ou construire un pipeline de données sont
 * des missions BUILD parfaitement légitimes.
 */
const GROWTH_KEYWORDS: readonly string[] = [
  'go-to-market',
  'go to market',
  'gtm',
  'acquisition',
  'revops',
  'revenue operations',
  'media buying',
  'achat media',
  'programmatique',
  'programmatic',
  'fractional growth',
  'growth office',
];

/** Fourchettes budgétaires, dans l'ordre d'affichage. Clés i18n `form.budgets.<key>`. */
export const BUDGET_RANGES: readonly EngagementBudget[] = [
  'exploring',
  'small',
  'medium',
  'large',
  'xlarge',
];

/** Échéances proposées, dans l'ordre d'affichage. Clés i18n `form.timelines.<key>`. */
export const TIMELINES: readonly EngagementTimeline[] = [
  'urgent',
  'quarter',
  'halfYear',
  'flexible',
];

/** Longueur minimale de la description : en dessous, la demande n'est pas qualifiable. */
export const MIN_DESCRIPTION_LENGTH = 40;

/**
 * Détermine si une demande relève de Cléa Growth Office.
 *
 * Deux signaux : le type de projet choisi, et le vocabulaire de la description libre.
 * Le second rattrape les prospects qui ont coché « Autre ».
 */
export function isGrowthRequest(
  projectType: EngagementProjectType,
  description: string,
): boolean {
  if (GROWTH_PROJECT_TYPES.has(projectType)) return true;
  const haystack = description.toLowerCase();
  return GROWTH_KEYWORDS.some((kw) => haystack.includes(kw));
}

/**
 * Marqueur de routage posé sur le lead, ou `null` s'il relève bien de BUILD.
 *
 * Aucune automatisation de transfert n'existe : l'infrastructure inter-entités n'est pas
 * en place, et la construire par anticipation serait prématuré.
 */
export function routingTagFor(
  projectType: EngagementProjectType,
  description: string,
): typeof GROWTH_ROUTING_TAG | null {
  return isGrowthRequest(projectType, description) ? GROWTH_ROUTING_TAG : null;
}

/**
 * Configuration exposée au formulaire — un seul objet à importer côté page.
 * Nommé `agencyLeadConfig` pour rester repérable depuis la documentation produit.
 */
export const agencyLeadConfig = {
  projectTypes: PROJECT_TYPES,
  budgets: BUDGET_RANGES,
  timelines: TIMELINES,
  minDescriptionLength: MIN_DESCRIPTION_LENGTH,
} as const;
