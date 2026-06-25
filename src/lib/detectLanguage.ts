import type { Lang } from '../i18n/routing';

/**
 * Détection de la langue qui convient au visiteur.
 * Priorité : langue(s) du navigateur. Repli géo-IP par pays UNIQUEMENT si aucune
 * langue du navigateur n'est fr/en (cas rare). Défaut : 'en' (visiteur non-francophone).
 */

// Pays majoritairement francophones (ISO 3166-1 alpha-2).
const FRANCOPHONE_COUNTRIES = new Set([
  'FR', 'BE', 'CH', 'LU', 'MC', // Europe
  'SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CM', 'GA', 'CG', 'CD',
  'TD', 'CF', 'DJ', 'KM', 'MG', 'RW', 'BI', 'GQ', 'SC', // Afrique
  'HT', // Caraïbes
]);

/** Mappe un code pays ISO vers la langue suggérée (pure — testable). */
export function countryToLang(countryCode: string | null | undefined): Lang {
  if (!countryCode) return 'en';
  return FRANCOPHONE_COUNTRIES.has(countryCode.toUpperCase()) ? 'fr' : 'en';
}

/** Première langue supportée (fr/en) trouvée dans les préférences du navigateur. */
export function langFromNavigator(): Lang | null {
  if (typeof navigator === 'undefined') return null;
  const list = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (const raw of list) {
    const base = (raw || '').toLowerCase().split('-')[0];
    if (base === 'fr') return 'fr';
    if (base === 'en') return 'en';
  }
  return null;
}

/** Repli géo-IP : déduit la langue depuis le pays du visiteur (échec → 'en'). */
async function langFromGeo(): Promise<Lang> {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/country.json');
    if (!res.ok) return 'en';
    const data = (await res.json()) as { country?: string; country_code?: string };
    return countryToLang(data.country_code || data.country);
  } catch {
    return 'en';
  }
}

/**
 * Langue préférée du visiteur. Synchrone dans le cas courant (langue navigateur
 * fr/en) ; n'effectue un appel réseau que si le navigateur n'indique ni fr ni en.
 */
export async function detectPreferredLang(): Promise<Lang> {
  const fromNav = langFromNavigator();
  if (fromNav) return fromNav;
  return langFromGeo();
}
