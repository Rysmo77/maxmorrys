/**
 * L'échafaudage des pages publiques, porté depuis `ui_kits/site-public/SiteShell.js`.
 *
 * Une page publique se compose de ces quatre pièces et des primitives de `@ds` — elle ne
 * réinvente ni sa gouttière, ni son rythme de bande, ni sa cascade d'entrée.
 */
export { PageSite, SiteBand } from './PageSite';
export type { PageSiteProps } from './PageSite';
export { SiteDisplay, SiteEyebrow } from './SiteType';
export type { SiteDisplayProps } from './SiteType';
export { AuthPage } from './AuthPage';
export type { AuthPageProps } from './AuthPage';
export { LegalPage, LEGAL_DOCS } from './LegalPage';
export type { LegalPageProps, LegalDoc } from './LegalPage';
export { TerritoryRow, useTerritoryLayout } from './TerritoryRow';
export type { TerritoryLayout } from './TerritoryRow';
export { useReadingProgress } from './useReadingProgress';
export { useReveal } from './useReveal';
