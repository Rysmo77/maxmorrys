/** Teinte et découpe du titre d'une couverture Edu — partagés par `EduCover` et `FloatingCovers`. */
const TINTS = ['mm-tint-seo', 'mm-tint-ads', 'mm-tint-ia', 'mm-tint-mq', 'mm-tint-wa', 'mm-tint-me'] as const;
export type Tint = (typeof TINTS)[number];

const BY_CATEGORY: Array<[RegExp, Tint]> = [
  [/seo|référencement|referencement|search/i, 'mm-tint-seo'],
  [/ads|publicit|meta|facebook|campagne/i, 'mm-tint-ads'],
  [/\bia\b|\bai\b|intelligence|gpt|automat/i, 'mm-tint-ia'],
  [/marque|brand|personal|community|contenu|content/i, 'mm-tint-mq'],
  [/whatsapp|vente|commerce|sales|social/i, 'mm-tint-wa'],
  [/mesure|analytics|data|ga4|chiffre/i, 'mm-tint-me'],
];

export function coverTint(key: { category?: string; slug?: string; id?: string; title?: string }): Tint {
  const probe = `${key.category ?? ''} ${key.title ?? ''}`;
  for (const [re, tint] of BY_CATEGORY) if (re.test(probe)) return tint;
  const seed = key.slug || key.id || probe;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * « SEO local pour commerces » → titre « SEO local », fin « pour commerces ».
 * Un titre long (« Automatisation WhatsApp Business : Gagne du temps… ») garde sa partie avant
 * les deux-points, et la fin s'arrête à quatre mots : une couverture n'est pas une notice.
 */
export function splitTitle(title: string): { t: string; s: string } {
  const head = title.split(/\s[:–—-]\s/)[0].trim();
  const words = head.split(/\s+/);
  if (words.length <= 2) return { t: head, s: '' };
  const rest = words.slice(2);
  return { t: words.slice(0, 2).join(' '), s: rest.length > 4 ? `${rest.slice(0, 4).join(' ')}…` : rest.join(' ') };
}

/** Taille du titre ramenée pour que le mot le plus long tienne (capitales display ≈ 0,62 em). */
export function fitTitle(t: string, size: number, width = 250): number {
  const longest = Math.max(...t.split(/\s+/).map((w) => w.length), 1);
  return Math.min(size, Math.floor(width / (longest * 0.62)));
}
