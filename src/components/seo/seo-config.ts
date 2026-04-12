export const SITE_URL = 'https://maxmorrys.me';
export const SITE_NAME = 'Max-Morrys';
export const DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance';
export const DEFAULT_DESCRIPTION =
  'Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Par Max-Morrys depuis Dakar.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const TWITTER_HANDLE = '@maxmorrys';

export function buildCanonical(path: string): string {
  const clean = path.split('?')[0].split('#')[0];
  return `${SITE_URL}${clean}`;
}

export function truncateDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + '...';
}
