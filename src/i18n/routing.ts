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
  /*
    ⚠️ LA CHAÎNE DE REQUÊTE ET L'ANCRE SORTENT AVANT LA TRADUCTION DES SEGMENTS.

    Sans cette découpe, `localizeSegments` reçoit `repetiteur?tab=tokens` comme UN
    segment. Il ne correspond à aucune entrée de la table, il ressort donc tel quel —
    et l'URL anglaise garde un segment français :

        /mon-espace/repetiteur          → /en/my-learning/tutor        ✔
        /mon-espace/repetiteur?tab=…    → /en/my-learning/repetiteur?…  ✘

    La seconde ne correspond à aucune route déclarée : quelqu'un en anglais tombait
    sur un 404 en cliquant un lien interne. `LocalizedLink` passe `to` ici sans le
    découper, donc tous ses appelants portaient le défaut — deux dans le widget du
    répétiteur, vers l'écran des packs, c'est-à-dire vers l'achat.

    Le défaut ne se voyait qu'en anglais ET seulement sur les liens à requête : c'est
    la raison pour laquelle il a tenu si longtemps.
  */
  const cut = path.search(/[?#]/);
  const bare = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? '' : path.slice(cut);

  const canonical = toCanonicalPath(bare);
  const localized = localizeSegments(canonical, lang);
  if (lang === 'en') {
    return (localized === '/' ? '/en' : `/en${localized}`) + suffix;
  }
  return localized + suffix;
}

/** Locale Intl correspondant à la langue (dates, nombres, devises). */
export function intlLocale(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'fr-FR';
}

/** Locale Open Graph. */
export function ogLocale(lang: Lang): string {
  return lang === 'en' ? 'en_US' : 'fr_FR';
}
