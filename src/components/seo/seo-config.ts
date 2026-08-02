export const SITE_URL = 'https://maxmorrys.me';
export const SITE_NAME = 'Max-Morrys';
export const DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance';
export const DEFAULT_DESCRIPTION =
  'Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Par Max-Morrys depuis Dakar.';
// Image OG par défaut, servie depuis Cloudflare R2 (média migré depuis Firebase Storage).
export const DEFAULT_OG_IMAGE = 'https://media.maxmorrys.me/Je-te-forme/2252.jpg';
export const TWITTER_HANDLE = '@max_morrys';

export const SOCIAL_LINKS = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/max-morrys-eyoum/' },
  { name: 'Facebook', url: 'https://www.facebook.com/maxmorrys.me/' },
  { name: 'Instagram', url: 'https://www.instagram.com/maxmorrys.me' },
  { name: 'YouTube', url: 'https://www.youtube.com/@maxmorrys-me' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@maxmorrys.me' },
  { name: 'X', url: 'https://x.com/max_morrys' },
] as const;

export const SOCIAL_URLS = SOCIAL_LINKS.map((s) => s.url);

export function buildCanonical(path: string): string {
  const clean = path.split('?')[0].split('#')[0];
  return `${SITE_URL}${clean}`;
}

export function truncateDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + '...';
}
