/**
 * Pôles de catégories du blog.
 *
 * Le champ `category` des articles est saisi en texte libre (admin + génération n8n).
 * Pour éviter la prolifération de catégories hétérogènes, toute valeur brute est
 * normalisée vers un des 6 grands pôles de marketing digital ci-dessous.
 *
 * Source unique de vérité — réutilisée par la page Blog et l'admin.
 */

export const BLOG_POLES = [
  'SEO & Visibilité',
  'Publicité en ligne',
  'Réseaux sociaux & Influence',
  'E-commerce & Vente en ligne',
  'IA & Automatisation',
  'Business & Gestion',
] as const;

export type BlogPole = (typeof BLOG_POLES)[number];

/** Pôle par défaut quand aucune correspondance n'est trouvée. */
const DEFAULT_POLE: BlogPole = 'Business & Gestion';

/**
 * Mots-clés → pôle. Le premier pôle dont au moins un mot-clé est contenu
 * dans la valeur brute (insensible à la casse et aux accents) l'emporte.
 * L'ordre compte : les pôles spécifiques sont testés avant les génériques
 * (ex. « Publicité Facebook » doit tomber dans Publicité, pas dans Réseaux sociaux).
 */
const POLE_KEYWORDS: ReadonlyArray<readonly [BlogPole, readonly string[]]> = [
  ['Publicité en ligne', ['publicite', 'ads', 'sponsoris', 'campagne pay', 'pub ']],
  ['SEO & Visibilité', ['seo', 'referencement', 'google my business', 'google business', 'google maps', 'visibilit', 'trafic organique']],
  ['IA & Automatisation', ['intelligence artificielle', 'automatis', 'chatgpt', ' ia ']],
  ['Réseaux sociaux & Influence', ['reseaux sociaux', 'influence', 'community', 'personal brand', 'marque personnelle', 'social media', 'social', 'linkedin', 'instagram']],
  ['E-commerce & Vente en ligne', ['e-commerce', 'ecommerce', 'vente', 'vendre', 'paiement', 'logistique', 'catalogue', 'boutique', 'mobile money']],
  ['Business & Gestion', ['business', 'gestion', 'entrepreneur', 'finance', 'tresorerie', 'juridique', 'fiscalit', 'freelanc', 'carriere', 'salaire', 'outils', 'equipement', 'productivit']],
];

/** Supprime les accents et passe en minuscules pour une comparaison robuste. */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Convertit une valeur `category` brute en un des 6 pôles canoniques.
 * Une valeur déjà égale à un pôle est renvoyée telle quelle.
 */
export function categoryToPole(raw: string | undefined | null): BlogPole {
  if (!raw) return DEFAULT_POLE;

  const exact = BLOG_POLES.find((pole) => pole === raw);
  if (exact) return exact;

  const value = ` ${normalize(raw)} `;
  for (const [pole, keywords] of POLE_KEYWORDS) {
    if (keywords.some((kw) => value.includes(kw))) return pole;
  }
  return DEFAULT_POLE;
}
