/**
 * Helpers de routing multilingue.
 * Le français est la langue par défaut (pas de préfixe). L'anglais est servi sous /en.
 * La langue est dérivée du préfixe d'URL — source de vérité unique.
 */

import { localizeSegments, canonicalizeSegments } from './segments';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

export function isLang(value: unknown): value is Lang {
  return value === 'fr' || value === 'en';
}

/** Déduit la langue active à partir du pathname (/en ou /en/... => en, sinon fr). */
export function getLangFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
}

/** Retire le préfixe /en pour obtenir le chemin « canonique » (style fr). */
export function stripLangPrefix(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

/**
 * Chemin canonique FR (sans préfixe, segments en FR) à partir de n'importe quel pathname.
 * Gère le préfixe /en ET le remappage des segments EN → FR.
 */
export function toCanonicalPath(pathname: string): string {
  const lang = getLangFromPath(pathname);
  const noPrefix = stripLangPrefix(pathname);
  return lang === 'en' ? canonicalizeSegments(noPrefix) : noPrefix;
}

/**
 * Construit le chemin pour une langue donnée. Accepte un chemin FR ou EN (préfixé) :
 * il est d'abord canonicalisé, puis localisé + préfixé.
 */
export function localizedPath(path: string, lang: Lang): string {
  const canonical = toCanonicalPath(path);
  const localized = localizeSegments(canonical, lang);
  if (lang === 'en') {
    return localized === '/' ? '/en' : `/en${localized}`;
  }
  return localized;
}

/** Locale Intl correspondant à la langue (dates, nombres, devises). */
export function intlLocale(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'fr-FR';
}

/** Locale Open Graph. */
export function ogLocale(lang: Lang): string {
  return lang === 'en' ? 'en_US' : 'fr_FR';
}
