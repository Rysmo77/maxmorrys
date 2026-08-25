/**
 * Port de `functions/src/segments.ts`, lui-même miroir de `src/i18n/segments.ts`.
 *
 * ⚠️ Trois copies doivent rester synchronisées : le frontend, les Cloud Functions
 * (tant qu'elles existent) et ce Worker. Ajouter une route localisée impose de
 * toucher les trois.
 */

const SEGMENTS: Record<string, string> = {
  // Public
  'a-propos': 'about',
  formations: 'courses',
  blog: 'blog',
  podcasts: 'podcasts',
  videos: 'videos',
  faq: 'faq',
  contact: 'contact',
  agence: 'agency',
  'presence-digitale': 'digital-presence',
  legal: 'legal',
  'mentions-legales': 'legal-notice',
  confidentialite: 'privacy',
  cgv: 'terms-of-sale',
  cgu: 'terms-of-use',
  cookies: 'cookies',
  // LMS
  'mon-espace': 'my-space',
  'tableau-de-bord': 'dashboard',
  cours: 'learn',
  notes: 'notes',
  messages: 'messages',
  succes: 'achievements',
  profil: 'profile',
  parametres: 'settings',
  club: 'club',
  rysmo: 'rysmo',
  temoignages: 'testimonials',
  checkout: 'checkout',
  paiement: 'payment',
  retour: 'return',
  certificat: 'certificate',
  // Auth
  connexion: 'login',
  inscription: 'signup',
  'mot-de-passe-oublie': 'forgot-password',
  // Admin
  admin: 'admin',
  articles: 'articles',
  utilisateurs: 'users',
  analytics: 'analytics',
  annonces: 'announcements',
  transactions: 'transactions',
  coupons: 'coupons',
  'rendez-vous': 'appointments',
  'club-digitos': 'club-digitos',
  redirections: 'redirects',
};

const EN_TO_FR: Record<string, string> = {};
for (const [fr, en] of Object.entries(SEGMENTS)) EN_TO_FR[en] = fr;

/** Traduit les segments connus d'un chemin FR canonique vers l'anglais (laisse les slugs intacts). */
export function localizeSegmentsEn(path: string): string {
  return path
    .split('/')
    .map((s) => (s && !s.startsWith(':') ? (SEGMENTS[s] ?? s) : s))
    .join('/');
}

/** Remappe les segments EN d'un chemin (sans préfixe /en) vers le FR canonique. */
export function canonicalizeSegments(path: string): string {
  return path
    .split('/')
    .map((s) => (s ? (EN_TO_FR[s] ?? s) : s))
    .join('/');
}

/** Construit l'URL EN (préfixe /en + segments localisés) à partir d'un chemin FR canonique. */
export function enPath(canonicalPath: string): string {
  const localized = localizeSegmentsEn(canonicalPath);
  return localized === '/' ? '/en' : `/en${localized}`;
}
