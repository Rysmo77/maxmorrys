import type { Lang } from './routing';

/**
 * Dictionnaire de localisation des SEGMENTS d'URL.
 * Clé = segment canonique FR (celui des routes par défaut). Valeur = traduction par langue.
 * Le français est canonique : les URLs FR ne changent jamais.
 *
 * ⚠️ Chaque valeur EN doit être UNIQUE (pas deux segments FR → même EN) pour permettre
 * le remappage inverse sans ambiguïté. Notamment `formations→courses` et `cours→learn`
 * (sinon collision `/en/courses/:slug` entre la fiche formation et le lecteur de cours).
 */
const SEGMENTS: Record<string, { fr: string; en: string }> = {
  // Public
  'a-propos': { fr: 'a-propos', en: 'about' },
  formations: { fr: 'formations', en: 'courses' },
  blog: { fr: 'blog', en: 'blog' },
  podcasts: { fr: 'podcasts', en: 'podcasts' },
  videos: { fr: 'videos', en: 'videos' },
  faq: { fr: 'faq', en: 'faq' },
  contact: { fr: 'contact', en: 'contact' },
  agence: { fr: 'agence', en: 'agency' },
  devis: { fr: 'devis', en: 'quote' },
  legal: { fr: 'legal', en: 'legal' },
  'mentions-legales': { fr: 'mentions-legales', en: 'legal-notice' },
  confidentialite: { fr: 'confidentialite', en: 'privacy' },
  cgv: { fr: 'cgv', en: 'terms-of-sale' },
  cgu: { fr: 'cgu', en: 'terms-of-use' },
  cookies: { fr: 'cookies', en: 'cookies' },
  // LMS
  'mon-espace': { fr: 'mon-espace', en: 'my-space' },
  'tableau-de-bord': { fr: 'tableau-de-bord', en: 'dashboard' },
  cours: { fr: 'cours', en: 'learn' },
  notes: { fr: 'notes', en: 'notes' },
  messages: { fr: 'messages', en: 'messages' },
  succes: { fr: 'succes', en: 'achievements' },
  profil: { fr: 'profil', en: 'profile' },
  parametres: { fr: 'parametres', en: 'settings' },
  club: { fr: 'club', en: 'club' },
  rysmo: { fr: 'rysmo', en: 'rysmo' },
  temoignages: { fr: 'temoignages', en: 'testimonials' },
  checkout: { fr: 'checkout', en: 'checkout' },
  paiement: { fr: 'paiement', en: 'payment' },
  retour: { fr: 'retour', en: 'return' },
  certificat: { fr: 'certificat', en: 'certificate' },
  // Auth
  connexion: { fr: 'connexion', en: 'login' },
  inscription: { fr: 'inscription', en: 'signup' },
  'mot-de-passe-oublie': { fr: 'mot-de-passe-oublie', en: 'forgot-password' },
  // Admin
  admin: { fr: 'admin', en: 'admin' },
  articles: { fr: 'articles', en: 'articles' },
  utilisateurs: { fr: 'utilisateurs', en: 'users' },
  analytics: { fr: 'analytics', en: 'analytics' },
  annonces: { fr: 'annonces', en: 'announcements' },
  transactions: { fr: 'transactions', en: 'transactions' },
  coupons: { fr: 'coupons', en: 'coupons' },
  'rendez-vous': { fr: 'rendez-vous', en: 'appointments' },
  'club-digitos': { fr: 'club-digitos', en: 'club-digitos' },
  'prospects-agence': { fr: 'prospects-agence', en: 'agency-leads' },
};

// Tables inverses pré-calculées.
const FR_TO_EN: Record<string, string> = {};
const EN_TO_FR: Record<string, string> = {};
for (const { fr, en } of Object.values(SEGMENTS)) {
  FR_TO_EN[fr] = en;
  EN_TO_FR[en] = fr;
}

function mapSegment(seg: string, table: Record<string, string>): string {
  // Laisse intacts les paramètres de route (:slug), le wildcard (*), et les segments inconnus (slugs).
  if (!seg || seg.startsWith(':') || seg === '*') return seg;
  return table[seg] ?? seg;
}

/** Traduit les segments d'un chemin (sans préfixe de langue) du FR canonique vers `lang`. */
export function localizeSegments(path: string, lang: Lang): string {
  if (lang === 'fr') return path;
  return path.split('/').map((s) => mapSegment(s, FR_TO_EN)).join('/');
}

/** Remappe les segments EN vers le FR canonique (sans préfixe de langue). */
export function canonicalizeSegments(path: string): string {
  return path.split('/').map((s) => mapSegment(s, EN_TO_FR)).join('/');
}
