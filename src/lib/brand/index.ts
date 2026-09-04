/**
 * Architecture de marque — point d'entrée unique.
 *
 *                            MY ONOMA SARL
 *                  Digital Product & Growth Studio
 *                                 │
 *            ┌────────────────────┼────────────────────┐
 *          BUILD                 GROW                 OWN
 *            │                    │                    │
 *     Max-Morrys Agency   Cléa Growth Office     Product Lab
 *                                                DOVEN · NAYO · STEPS
 *
 * Importer depuis `@/lib/brand`, jamais depuis les fichiers internes, afin que la surface
 * publique reste stable si l'organisation interne évolue.
 *
 * ⚠️ Ce module est un MIROIR de `My-onoma/apps/web/src/lib/brand/`. En cas de divergence
 * sur une donnée corporate, c'est le dépôt My-onoma qui fait foi.
 *
 * Voir `docs/BRAND-ARCHITECTURE.md`.
 */

export {
  legalEntity,
  legalName,
  corporateUrl,
  positioning,
  contact,
  socialLinks,
  podcastPlatform,
  publicProfiles,
  PLATFORM_OPENED_AT,
  formatPhone,
  formatRegisteredAddress,
  type LegalEntity,
} from './company';

export {
  practices,
  practiceList,
  pillars,
  GROWTH_ROUTING_TAG,
  type Practice,
  type PracticeId,
  type PracticeCapability,
} from './practices';

export {
  ventures,
  getVenture,
  VENTURE_RELATION,
  type Venture,
  type VentureStatus,
} from './ventures';

export {
  clientProjects,
  clientCategories,
  getClientProject,
  categoryKey,
  CLIENT_RELATION,
  type ClientProject,
  type ClientCapability,
} from './clients';
