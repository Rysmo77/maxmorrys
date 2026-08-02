"use strict";
/**
 * Miroir serveur de src/i18n/segments.ts — localisation des segments d'URL.
 * Garder synchronisé avec le frontend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizeSegmentsEn = localizeSegmentsEn;
exports.canonicalizeSegments = canonicalizeSegments;
exports.enPath = enPath;
const SEGMENTS = {
    // Public
    'a-propos': 'about',
    formations: 'courses',
    blog: 'blog',
    podcasts: 'podcasts',
    videos: 'videos',
    faq: 'faq',
    contact: 'contact',
    agence: 'agency',
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
};
const EN_TO_FR = {};
for (const [fr, en] of Object.entries(SEGMENTS))
    EN_TO_FR[en] = fr;
/** Traduit les segments connus d'un chemin FR canonique vers l'anglais (laisse les slugs intacts). */
function localizeSegmentsEn(path) {
    return path.split('/').map((s) => { var _a; return (s && !s.startsWith(':') ? (_a = SEGMENTS[s]) !== null && _a !== void 0 ? _a : s : s); }).join('/');
}
/** Remappe les segments EN d'un chemin (sans préfixe /en) vers le FR canonique. */
function canonicalizeSegments(path) {
    return path.split('/').map((s) => { var _a; return (s ? (_a = EN_TO_FR[s]) !== null && _a !== void 0 ? _a : s : s); }).join('/');
}
/** Construit l'URL EN (préfixe /en + segments localisés) à partir d'un chemin FR canonique. */
function enPath(canonicalPath) {
    const localized = localizeSegmentsEn(canonicalPath);
    return localized === '/' ? '/en' : `/en${localized}`;
}
//# sourceMappingURL=segments.js.map